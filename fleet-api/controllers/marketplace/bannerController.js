/**
 * Listing images uploaded by staff.
 *   POST   /admin/listings/:id/photo    the van's main photo, used everywhere in the app (cards, banners, van page).
 *                                       PNG / WebP with a transparent background is drawn on the app's showroom
 *                                       backdrop (stored as cutoutImage too); a JPG is shown as a normal photo.
 *   POST   /admin/listings/:id/banner   multipart field "file" (JPG, PNG or WebP, max 5 MB) - legacy banner artwork
 *   DELETE /admin/listings/:id/banner   back to the app's generated banner
 * Every upload gets a new file name, so phones never keep showing a cached old image.
 * Files live in <MARKETPLACE_UPLOAD_DIR>/banners and are served publicly from /api/marketplace/banners/<file>.
 * Banner art is public by design (it is marketing), unlike the private customer documents in the same root.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { col, audit } = require('../../services/marketplace/store');
const { toId, HttpError, handle } = require('../../services/marketplace/util');
const { UPLOAD_ROOT, runUpload } = require('./documentController');
const { publicListing } = require('./listingController');

const BANNER_DIR = path.join(UPLOAD_ROOT, 'banners');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const uploader = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => fs.mkdir(BANNER_DIR, { recursive: true }, (err) => cb(err, BANNER_DIR)),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXT[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'Upload a JPG, PNG or WebP image', 'UNSUPPORTED_FILE'));
  },
});

const orgId = (req) => String(req.user.companyId || '');

/** field: 'bannerImage' (home banner) or 'cardImage' (finished card shown as-is in the van list). */
async function setImage(req, field, value) {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Listing not found');
  const listings = await col('listings');
  const result = await listings.updateOne({ _id, organizationId: orgId(req) }, { $set: { [field]: value || null, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, 'Listing not found');
  const what = field === 'cardImage' ? 'card' : 'banner';
  await audit(value ? `listing.${what}_set` : `listing.${what}_removed`, { userId: req.user.userId, organizationId: orgId(req) }, { listingId: _id });
  const listing = await listings.findOne({ _id });
  return { ...publicListing(listing), status: listing.status };
}

const uploadFor = (field) => [
  runUpload(uploader.single('file')),
  handle(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose an image to upload', 'NO_FILE');
    try {
      const listing = await setImage(req, field, `/api/marketplace/banners/${req.file.filename}`);
      res.json({ status: 'success', data: { listing } });
    } catch (err) {
      fs.unlink(req.file.path, () => {});
      throw err;
    }
  }),
];
const removeFor = (field) => handle(async (req, res) => {
  res.json({ status: 'success', data: { listing: await setImage(req, field, null) } });
});

/** POST /admin/listings/:id/photo - replace the van's main photo (first image). */
exports.uploadPhoto = [
  runUpload(uploader.single('file')),
  handle(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose an image to upload', 'NO_FILE');
    const _id = toId(req.params.id);
    const listings = await col('listings');
    const listing = _id ? await listings.findOne({ _id, organizationId: orgId(req) }) : null;
    if (!listing) {
      fs.unlink(req.file.path, () => {});
      throw new HttpError(404, 'Listing not found');
    }
    const url = `/api/marketplace/banners/${req.file.filename}`;
    const cutout = req.file.mimetype === 'image/png' || req.file.mimetype === 'image/webp';
    const images = [url, ...(listing.images || []).filter((u) => u !== url)].slice(0, 10);
    await listings.updateOne({ _id }, { $set: { images, cutoutImage: cutout ? url : null, updatedAt: new Date() } });
    await audit('listing.photo_set', { userId: req.user.userId, organizationId: orgId(req) }, { listingId: _id, cutout });
    const updated = await listings.findOne({ _id });
    res.json({ status: 'success', data: { listing: { ...publicListing(updated), status: updated.status } } });
  }),
];

exports.upload = uploadFor('bannerImage');
exports.remove = removeFor('bannerImage');
exports.uploadCard = uploadFor('cardImage');
exports.removeCard = removeFor('cardImage');

exports.BANNER_DIR = BANNER_DIR;
