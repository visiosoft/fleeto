/**
 * Customer verification documents (trade licence, Emirates ID, driving
 * licence, authorization letter).
 *
 * Files are written OUTSIDE the publicly served /uploads folder and are only
 * readable through the authenticated file endpoint. Uploading never verifies
 * anything: every document starts as `submitted` and only staff review can
 * move it to `approved`.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { col, audit } = require('../../services/marketplace/store');
const { toId, HttpError, handle, cleanString } = require('../../services/marketplace/util');

const UPLOAD_ROOT = process.env.MARKETPLACE_UPLOAD_DIR || path.join(__dirname, '../../private_uploads/marketplace');

const DOCUMENT_TYPES = {
  trade_licence: { label: 'Trade licence', required: true },
  // Retired: no longer asked for. Kept so documents uploaded earlier still show their label to staff.
  emirates_id: { label: 'Emirates ID or passport', required: false, retired: true },
  driving_licence: { label: 'Driving licence', required: true },
  authorization_letter: { label: 'Company authorization letter', required: false },
};
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'application/pdf'];
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/heic': '.heic', 'image/heif': '.heif', 'image/webp': '.webp', 'application/pdf': '.pdf' };

function makeUploader(subfolder, { maxFiles = 1 } = {}) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_ROOT, subfolder, req.customer._id.toString());
      fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXT[file.mimetype] || ''}`),
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: maxFiles },
    fileFilter: (req, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
      else cb(new HttpError(400, 'Upload a JPG, PNG, HEIC or PDF file', 'UNSUPPORTED_FILE'));
    },
  });
}

/** Run a multer middleware and convert its errors into JSON responses. */
function runUpload(middleware) {
  return (req, res, next) =>
    middleware(req, res, (err) => {
      if (!err) return next();
      const status = err.status || 400;
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10 MB)' : err.message;
      res.status(status).json({ status: 'error', message });
    });
}

function storedFile(file) {
  if (!file) return null;
  return {
    path: path.relative(UPLOAD_ROOT, file.path).split(path.sep).join('/'),
    originalName: (file.originalname || '').slice(0, 120),
    mimeType: file.mimetype,
    size: file.size,
  };
}

function publicDocument(d) {
  return {
    id: d._id.toString(),
    type: d.type,
    label: DOCUMENT_TYPES[d.type]?.label || d.type,
    status: d.status,
    reviewNote: d.reviewNote || '',
    holderName: d.holderName || '',
    expiryDate: d.expiryDate || null,
    file: d.file ? { name: d.file.originalName, mimeType: d.file.mimeType, size: d.file.size } : null,
    createdAt: d.createdAt,
    reviewedAt: d.reviewedAt || null,
  };
}

/** Latest document per type, plus an overall status for the customer. */
async function verificationSummary(customerId) {
  const documents = await col('documents');
  const rows = await documents.find({ customerId }).sort({ createdAt: -1 }).toArray();
  const today = new Date().toISOString().slice(0, 10);
  const items = Object.entries(DOCUMENT_TYPES).filter(([, meta]) => !meta.retired).map(([type, meta]) => {
    const latest = rows.find((d) => d.type === type);
    let status = latest ? latest.status : 'missing';
    if (latest && latest.status === 'approved' && latest.expiryDate && latest.expiryDate < today) status = 'expired';
    return { type, label: meta.label, required: meta.required, status, document: latest ? publicDocument(latest) : null };
  });
  const required = items.filter((i) => i.required);
  let overall = 'not_started';
  if (required.every((i) => i.status === 'approved')) overall = 'approved';
  else if (required.some((i) => ['rejected', 'expired'].includes(i.status))) overall = 'action_required';
  else if (required.some((i) => i.status !== 'missing')) overall = required.every((i) => i.status !== 'missing') ? 'under_review' : 'incomplete';
  return { overall, items };
}

exports.upload = runUpload(makeUploader('documents').single('file'));

exports.create = handle(async (req, res) => {
  const type = req.body?.type;
  if (!DOCUMENT_TYPES[type] || DOCUMENT_TYPES[type].retired) {
    if (req.file) fs.unlink(req.file.path, () => {});
    throw new HttpError(400, 'Choose a document type');
  }
  if (!req.file) throw new HttpError(400, 'Attach a photo or PDF of the document');
  const expiryDate = cleanString(req.body?.expiryDate, 10);
  if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) throw new HttpError(400, 'Expiry date must be YYYY-MM-DD');

  const now = new Date();
  const doc = {
    customerId: req.customer._id.toString(),
    type,
    status: 'submitted',
    holderName: cleanString(req.body?.holderName, 80) || '',
    expiryDate: expiryDate || null,
    file: storedFile(req.file),
    createdAt: now,
    updatedAt: now,
  };
  const documents = await col('documents');
  const { insertedId } = await documents.insertOne(doc);
  await audit('document.submitted', { customerId: doc.customerId }, { documentId: insertedId, type });
  res.status(201).json({ status: 'success', data: { document: publicDocument({ ...doc, _id: insertedId }) } });
});

exports.list = handle(async (req, res) => {
  res.json({ status: 'success', data: await verificationSummary(req.customer._id.toString()) });
});

exports.file = handle(async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Document not found');
  const documents = await col('documents');
  const doc = await documents.findOne({ _id, customerId: req.customer._id.toString() });
  if (!doc?.file) throw new HttpError(404, 'Document not found');
  const full = path.resolve(UPLOAD_ROOT, doc.file.path);
  if (!full.startsWith(path.resolve(UPLOAD_ROOT))) throw new HttpError(404, 'Document not found');
  res.setHeader('Content-Type', doc.file.mimeType);
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(full);
});

/**
 * Are the documents this booking needs approved? (A van with our driver doesn't need the renter's licence.)
 * @returns {Promise<{ ready: boolean, missing: { type: string, label: string, status: string }[] }>}
 */
async function documentsReady(booking) {
  if (!booking?.customerId) return { ready: false, missing: [] };
  const { items } = await verificationSummary(String(booking.customerId));
  const withDriver = booking.quote?.driver === 'with_driver';
  const missing = items
    .filter((i) => i.required && !(i.type === 'driving_licence' && withDriver) && i.status !== 'approved')
    .map((i) => ({ type: i.type, label: i.label, status: i.status }));
  return { ready: missing.length === 0, missing };
}

exports.documentsReady = documentsReady;
exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
exports.UPLOAD_ROOT = UPLOAD_ROOT;
exports.makeUploader = makeUploader;
exports.runUpload = runUpload;
exports.storedFile = storedFile;
exports.publicDocument = publicDocument;
exports.verificationSummary = verificationSummary;
