const crypto = require('crypto');
const { CompanyContract, SIGNATURE_STATUS } = require('../models/companyContract');
const CompanyProfile = require('../models/companyProfile');
const TwilioWhatsAppService = require('../services/twilioWhatsAppService');
const { buildWaMeUrl } = require('../utils/whatsappLink');
const { renderContractDocument } = require('../utils/contractDocument');

const whatsapp = new TwilioWhatsAppService();

// How long a signing link stays valid, in days
const LINK_VALIDITY_DAYS = parseInt(process.env.SIGNATURE_LINK_DAYS || '14', 10);

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMoney = (amount) => {
    if (amount === undefined || amount === null || amount === '') return '—';
    return `AED ${Number(amount).toLocaleString()}`;
};

// Public base URL the client's browser will hit. Set PUBLIC_BASE_URL in production
// (the API must be reachable from outside for WhatsApp links to work).
const getBaseUrl = (req) => {
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    return `${proto}://${req.get('host')}`;
};

const toWhatsAppNumber = (phone) => {
    if (!phone) return null;
    const trimmed = String(phone).trim();
    if (trimmed.startsWith('whatsapp:')) return trimmed;
    return `whatsapp:${trimmed.startsWith('+') ? trimmed : '+' + trimmed.replace(/[^\d]/g, '')}`;
};


const getClientIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || null;

// The full branded contract document the client reads and agrees to. Pass the
// signature to draw it into the client signature box on the page itself.
const buildDocumentHtml = (contract, signature = null) =>
    renderContractDocument(contract, { signature });

// Resolve the number that should be told when a client signs.
const resolveNotifyPhone = async (contract) => {
    if (contract.signature?.notifyPhone) return contract.signature.notifyPhone;
    if (process.env.SIGNATURE_NOTIFY_WHATSAPP) return process.env.SIGNATURE_NOTIFY_WHATSAPP;
    try {
        const profile = await CompanyProfile.findOne({});
        return profile?.contact?.phone?.[0] || null;
    } catch (error) {
        console.error('Could not resolve notification phone from company profile:', error.message);
        return null;
    }
};

// ----------------------------------------------------------------------------
// Authenticated endpoints (mounted under /api/contracts)
// ----------------------------------------------------------------------------

// POST /api/contracts/:id/send-for-signature
exports.sendForSignature = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const contract = await CompanyContract.findOne({ _id: req.params.id, companyId });
        if (!contract) {
            return res.status(404).json({ status: 'error', message: 'Contract not found' });
        }

        if (contract.signature?.status === SIGNATURE_STATUS.SIGNED) {
            return res.status(400).json({
                status: 'error',
                message: 'This contract has already been signed. Void the existing signature before sending again.'
            });
        }

        const recipientPhone = req.body.phone || contract.contactPhone;
        const recipientName = req.body.name || contract.contactPerson || contract.companyName;
        const notifyPhone = req.body.notifyPhone || contract.signature?.notifyPhone;

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + LINK_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
        const signUrl = `${getBaseUrl(req)}/sign/${token}`;

        contract.signature = {
            ...(contract.signature?.toObject?.() || contract.signature || {}),
            status: SIGNATURE_STATUS.SENT,
            token,
            tokenExpiresAt: expiresAt,
            sentAt: new Date(),
            sentToName: recipientName,
            sentToPhone: recipientPhone,
            sentBy: req.user.email || req.user.userId || null,
            notifyPhone,
            sendCount: (contract.signature?.sendCount || 0) + 1,
            // A new request invalidates any earlier client activity
            viewedAt: null,
            signedAt: null,
            declinedAt: null,
            declineReason: null,
            signerName: null,
            signatureImage: null,
            documentSnapshot: null,
            ipAddress: null,
            userAgent: null
        };

        await contract.save();

        // The message body is built here so web and mobile share exactly the same wording.
        const shareMessage =
            `Dear ${recipientName || 'Client'},\n\n` +
            `Please review and sign your contract using the secure link below:\n\n` +
            `${signUrl}\n\n` +
            `Vehicle: ${contract.vehicleName || 'N/A'}\n` +
            `Period: ${formatDate(contract.startDate)} - ${formatDate(contract.endDate)}\n` +
            `Amount: ${formatMoney(contract.amount ?? contract.value)}\n\n` +
            `This link expires on ${formatDate(expiresAt)}.`;

        res.status(200).json({
            status: 'success',
            message: recipientPhone
                ? 'Signing link ready. Open WhatsApp to send it, or copy it and use any other channel.'
                : 'Signing link ready. No client phone on the contract — copy the link or pick a contact in WhatsApp.',
            data: {
                signUrl,
                // Opens WhatsApp with the message pre-filled; the user presses send
                whatsappUrl: buildWaMeUrl(recipientPhone, shareMessage),
                shareMessage,
                expiresAt,
                signature: contract.signature
            }
        });
    } catch (error) {
        console.error('Error sending contract for signature:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// GET /api/contracts/:id/signature
exports.getSignatureStatus = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const contract = await CompanyContract.findOne({ _id: req.params.id, companyId });
        if (!contract) {
            return res.status(404).json({ status: 'error', message: 'Contract not found' });
        }

        const signature = contract.signature?.toObject?.() || contract.signature || {};
        const signUrl = signature.token ? `${getBaseUrl(req)}/sign/${signature.token}` : null;
        const shareMessage = signUrl
            ? `Dear ${signature.sentToName || contract.contactPerson || 'Client'},\n\n` +
              `Please review and sign your contract using the secure link below:\n\n` +
              `${signUrl}\n\n` +
              `Vehicle: ${contract.vehicleName || 'N/A'}\n` +
              `Period: ${formatDate(contract.startDate)} - ${formatDate(contract.endDate)}\n` +
              `Amount: ${formatMoney(contract.amount ?? contract.value)}\n\n` +
              `This link expires on ${formatDate(signature.tokenExpiresAt)}.`
            : null;

        res.status(200).json({
            status: 'success',
            data: {
                ...signature,
                signUrl,
                shareMessage,
                whatsappUrl: shareMessage ? buildWaMeUrl(signature.sentToPhone, shareMessage) : null
            }
        });
    } catch (error) {
        console.error('Error fetching signature status:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// GET /api/contracts/:id/signed-document
// Returns the signed contract as HTML for printing / saving as PDF. Returned as
// JSON rather than a page so the caller's auth header still applies - opening a
// new tab directly would drop the token.
exports.getSignedDocument = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const contract = await CompanyContract.findOne({ _id: req.params.id, companyId });
        if (!contract) {
            return res.status(404).json({ status: 'error', message: 'Contract not found' });
        }

        const signature = contract.signature || {};
        // Prefer the frozen snapshot - it is what the client actually agreed to.
        // Fall back to re-rendering for contracts signed before snapshots existed.
        const html = signature.documentSnapshot || buildDocumentHtml(
            contract,
            signature.signatureImage ? signature : null
        );

        res.status(200).json({
            status: 'success',
            data: {
                html,
                signed: signature.status === SIGNATURE_STATUS.SIGNED,
                signerName: signature.signerName || null,
                signedAt: signature.signedAt || null,
            }
        });
    } catch (error) {
        console.error('Error building signed document:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// POST /api/contracts/:id/signature/cancel - invalidate an outstanding link
exports.cancelSignatureRequest = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const contract = await CompanyContract.findOne({ _id: req.params.id, companyId });
        if (!contract) {
            return res.status(404).json({ status: 'error', message: 'Contract not found' });
        }

        if (contract.signature?.status === SIGNATURE_STATUS.SIGNED && !req.body.void) {
            return res.status(400).json({
                status: 'error',
                message: 'Contract is already signed. Send { "void": true } to void the signature.'
            });
        }

        contract.signature = {
            ...(contract.signature?.toObject?.() || contract.signature || {}),
            status: SIGNATURE_STATUS.CANCELLED,
            token: null,
            tokenExpiresAt: null
        };
        await contract.save();

        res.status(200).json({ status: 'success', message: 'Signature request cancelled', data: contract.signature });
    } catch (error) {
        console.error('Error cancelling signature request:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ----------------------------------------------------------------------------
// Public endpoints (no auth — the token is the credential)
// ----------------------------------------------------------------------------

const findByToken = async (token) => {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    return CompanyContract.findOne({ 'signature.token': token });
};

// Reasons a token can be unusable, rendered as a friendly page instead of JSON
const validateToken = (contract) => {
    if (!contract) return 'This signing link is not valid. Please request a new link.';
    const signature = contract.signature || {};
    if (signature.status === SIGNATURE_STATUS.CANCELLED) return 'This signing request has been cancelled by the sender.';
    if (signature.status === SIGNATURE_STATUS.DECLINED) return 'This contract was declined. Please contact us if this was a mistake.';
    if (signature.tokenExpiresAt && new Date() > new Date(signature.tokenExpiresAt)) {
        return 'This signing link has expired. Please request a new link.';
    }
    return null;
};

// GET /sign/:token - the client-facing signing page
exports.renderSigningPage = async (req, res) => {
    try {
        const contract = await findByToken(req.params.token);
        const error = validateToken(contract);
        if (error) {
            return res.status(contract ? 410 : 404).send(renderMessagePage('Link unavailable', error));
        }

        const signature = contract.signature;

        // Already signed — show the completed receipt rather than the form
        if (signature.status === SIGNATURE_STATUS.SIGNED) {
            return res.send(renderSignedPage(contract));
        }

        // First open marks the request as viewed
        if (signature.status === SIGNATURE_STATUS.SENT) {
            contract.signature.status = SIGNATURE_STATUS.VIEWED;
            contract.signature.viewedAt = new Date();
            await contract.save();
        }

        res.send(renderSignForm(contract, req.params.token));
    } catch (error) {
        console.error('Error rendering signing page:', error);
        res.status(500).send(renderMessagePage('Something went wrong', 'We could not load this contract. Please try again later.'));
    }
};

// POST /api/contract-signing/:token/sign
exports.submitSignature = async (req, res) => {
    try {
        const contract = await findByToken(req.params.token);
        const error = validateToken(contract);
        if (error) {
            return res.status(contract ? 410 : 404).json({ status: 'error', message: error });
        }

        if (contract.signature.status === SIGNATURE_STATUS.SIGNED) {
            return res.status(409).json({ status: 'error', message: 'This contract has already been signed.' });
        }

        const { signerName, signatureImage, agreed } = req.body;

        if (!signerName || !String(signerName).trim()) {
            return res.status(400).json({ status: 'error', message: 'Full name is required.' });
        }
        if (!signatureImage || !/^data:image\/png;base64,/.test(signatureImage)) {
            return res.status(400).json({ status: 'error', message: 'A drawn signature is required.' });
        }
        if (signatureImage.length > 2 * 1024 * 1024) {
            return res.status(400).json({ status: 'error', message: 'Signature image is too large.' });
        }
        if (!agreed) {
            return res.status(400).json({ status: 'error', message: 'You must confirm that you agree to the terms.' });
        }

        const signedAt = new Date();
        contract.signature.status = SIGNATURE_STATUS.SIGNED;
        contract.signature.signedAt = signedAt;
        contract.signature.signerName = String(signerName).trim();
        contract.signature.signatureImage = signatureImage;
        contract.signature.ipAddress = getClientIp(req);
        contract.signature.userAgent = req.headers['user-agent'] || null;
        // Freeze the document *with* the signature drawn into it - this is the
        // exact page the client agreed to and what prints as the signed PDF.
        contract.signature.documentSnapshot = buildDocumentHtml(contract, contract.signature);
        // Re-signing is blocked by the status check above, so the link can stay
        // alive as the client's receipt - they can reopen it to print their copy.
        contract.signature.tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        await contract.save();

        // Notify the sender. Never let a messaging failure fail the signature itself.
        let notified = false;
        try {
            const notifyPhone = await resolveNotifyPhone(contract);
            if (notifyPhone) {
                const message = `✅ *Contract Signed*\n\n` +
                    `${contract.signature.signerName} has signed the contract for *${contract.companyName}*.\n\n` +
                    `🚗 Vehicle: ${contract.vehicleName || 'N/A'}\n` +
                    `📅 Period: ${formatDate(contract.startDate)} — ${formatDate(contract.endDate)}\n` +
                    `💰 Amount: ${formatMoney(contract.amount ?? contract.value)}\n` +
                    `🕒 Signed: ${signedAt.toLocaleString('en-GB')}\n\n` +
                    `Open Contract Management to view the signed copy.`;
                await whatsapp.sendMessage(toWhatsAppNumber(notifyPhone), message);
                notified = true;
            } else {
                console.warn('Contract signed but no notification number configured (set SIGNATURE_NOTIFY_WHATSAPP).');
            }
        } catch (notifyError) {
            console.error('Contract signed but sender notification failed:', notifyError);
        }

        res.status(200).json({
            status: 'success',
            message: 'Contract signed successfully',
            data: {
                signedAt,
                senderNotified: notified,
                // Returned so the page can swap straight to the signed document
                signedDocumentHtml: contract.signature.documentSnapshot
            }
        });
    } catch (error) {
        console.error('Error submitting signature:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// POST /api/contract-signing/:token/decline
exports.declineSignature = async (req, res) => {
    try {
        const contract = await findByToken(req.params.token);
        const error = validateToken(contract);
        if (error) {
            return res.status(contract ? 410 : 404).json({ status: 'error', message: error });
        }

        contract.signature.status = SIGNATURE_STATUS.DECLINED;
        contract.signature.declinedAt = new Date();
        contract.signature.declineReason = req.body.reason ? String(req.body.reason).slice(0, 500) : null;
        contract.signature.ipAddress = getClientIp(req);
        contract.signature.token = null;
        contract.signature.tokenExpiresAt = null;
        await contract.save();

        try {
            const notifyPhone = await resolveNotifyPhone(contract);
            if (notifyPhone) {
                await whatsapp.sendMessage(
                    toWhatsAppNumber(notifyPhone),
                    `❌ *Contract Declined*\n\nThe contract for *${contract.companyName}* was declined by the client.\n\n` +
                    (contract.signature.declineReason ? `Reason: ${contract.signature.declineReason}\n\n` : '') +
                    `🕒 ${contract.signature.declinedAt.toLocaleString('en-GB')}`
                );
            }
        } catch (notifyError) {
            console.error('Decline notification failed:', notifyError);
        }

        res.status(200).json({ status: 'success', message: 'Contract declined' });
    } catch (error) {
        console.error('Error declining contract:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ----------------------------------------------------------------------------
// Server-rendered pages (self-contained so they work from any WhatsApp browser)
// ----------------------------------------------------------------------------

const PAGE_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f1f5f9; color: #0f172a;
         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
  .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,.12); padding: 24px; margin-bottom: 16px; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #1d4ed8; }
  h2 { font-size: 19px; margin: 0 0 12px; }
  h3 { font-size: 16px; margin: 20px 0 8px; }
  .muted { color: #64748b; font-size: 14px; margin: 0; }
  .paper { padding: 0; overflow: hidden; }
  .paper-bar { display: flex; align-items: center; justify-content: space-between;
               padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
               font-size: 13px; color: #64748b; font-weight: 600; }
  .paper-frame { width: 100%; border: 0; display: block; background: #fff; }
  .paper-loading { padding: 40px; text-align: center; color: #94a3b8; font-size: 14px; }
  label { display: block; font-size: 14px; font-weight: 600; margin: 16px 0 6px; }
  input[type=text], input[type=email], textarea {
    width: 100%; padding: 12px; font-size: 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; }
  .padwrap { position: relative; border: 2px dashed #cbd5e1; border-radius: 8px; background: #fff; touch-action: none; }
  canvas { display: block; width: 100%; height: 190px; border-radius: 6px; }
  .padhint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
             color: #94a3b8; font-size: 15px; pointer-events: none; }
  .padhint.hidden { display: none; }
  .row { display: flex; gap: 10px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
  button { font-size: 16px; font-weight: 600; border-radius: 8px; padding: 13px 20px; border: none; cursor: pointer; font-family: inherit; }
  .primary { background: #2563eb; color: #fff; width: 100%; margin-top: 20px; }
  .primary:disabled { background: #94a3b8; cursor: not-allowed; }
  .ghost { background: #f1f5f9; color: #475569; padding: 9px 14px; font-size: 14px; }
  .link { background: none; color: #dc2626; text-decoration: underline; padding: 8px 0; font-size: 14px; font-weight: 500; }
  .consent { display: flex; gap: 10px; align-items: flex-start; margin-top: 20px; font-size: 14px; line-height: 1.5; }
  .consent input { width: 20px; height: 20px; margin-top: 1px; flex-shrink: 0; }
  .alert { padding: 12px 14px; border-radius: 8px; font-size: 14px; margin-top: 16px; display: none; }
  .alert.error { background: #fef2f2; color: #b91c1c; display: block; }
  .done { text-align: center; padding: 40px 24px; }
  .done .tick { font-size: 52px; }
  .sigproof { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 12px; background: #f8fafc; }
  .sigproof img { max-height: 110px; }
`;

const shell = (title, body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>${PAGE_STYLES}</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;

const renderMessagePage = (title, message) => shell(title, `
  <div class="card done">
    <div class="tick">🔒</div>
    <h2>${escapeHtml(title)}</h2>
    <p class="muted">${escapeHtml(message)}</p>
  </div>`);

// Shown when a signed link is reopened - the client's receipt copy, with the
// signature already on the document and a print button.
const renderSignedPage = (contract) => {
    const sig = contract.signature || {};
    const documentHtml = sig.documentSnapshot || buildDocumentHtml(contract, sig);

    return shell('Signed Contract', `
  <div class="card done" style="padding:24px">
    <div class="tick">✅</div>
    <h2>Contract signed</h2>
    <p class="muted">Signed by ${escapeHtml(sig.signerName || 'the client')} on
      ${escapeHtml(sig.signedAt ? new Date(sig.signedAt).toLocaleString('en-GB') : '')}.</p>
  </div>

  <div class="card paper">
    <div class="paper-bar">
      <span>Signed contract</span>
      <button type="button" class="ghost" id="printBtn">Print / Save PDF</button>
    </div>
    <div class="paper-loading" id="paperLoading">Loading contract…</div>
    <iframe class="paper-frame" id="paper" title="Signed contract"
            srcdoc="${escapeHtml(documentHtml)}" style="height:0"></iframe>
  </div>

<script>
(function () {
  var paper = document.getElementById('paper');
  var paperLoading = document.getElementById('paperLoading');
  function fitPaper() {
    try {
      var doc = paper.contentDocument;
      if (!doc || !doc.body) return;
      paper.style.height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) + 'px';
      paperLoading.style.display = 'none';
    } catch (e) { paperLoading.style.display = 'none'; }
  }
  paper.addEventListener('load', function () { fitPaper(); setTimeout(fitPaper, 250); });
  window.addEventListener('resize', fitPaper);
  setTimeout(fitPaper, 400);
  document.getElementById('printBtn').onclick = function () {
    paper.contentWindow.focus();
    paper.contentWindow.print();
  };
})();
</script>`);
};

const renderSignForm = (contract, token) => shell(`Sign Contract — ${contract.companyName}`, `
  <div class="card">
    <h1>Contract for Signature</h1>
    <p class="muted">${escapeHtml(contract.companyName)}${contract.vehicleName ? ' — ' + escapeHtml(contract.vehicleName) : ''}</p>
    <p class="muted" style="margin-top:6px">Please read the full contract below, then sign at the bottom of this page.</p>
  </div>

  <!-- The contract renders in an iframe so its print stylesheet cannot collide
       with this page's styles, and it looks exactly like the printed PDF. -->
  <div class="card paper">
    <div class="paper-bar">
      <span>Contract document</span>
      <button type="button" class="ghost" id="printBtn">Print / Save PDF</button>
    </div>
    <div class="paper-loading" id="paperLoading">Loading contract…</div>
    <iframe class="paper-frame" id="paper" title="Contract document"
            srcdoc="${escapeHtml(buildDocumentHtml(contract))}" style="height:0"></iframe>
  </div>

  <div class="card" id="signCard">
    <h2>Sign here</h2>
    <label for="signerName">Full name *</label>
    <input type="text" id="signerName" placeholder="Your full legal name"
           value="${escapeHtml(contract.signature?.sentToName || '')}" autocomplete="name">

    <label>Signature *</label>
    <div class="padwrap">
      <canvas id="pad"></canvas>
      <div class="padhint" id="padhint">Draw your signature here</div>
    </div>
    <div class="row"><button type="button" class="ghost" id="clearBtn">Clear signature</button></div>

    <div class="consent">
      <input type="checkbox" id="agreed">
      <label for="agreed" style="margin:0;font-weight:400;">
        I confirm I am authorised to sign this contract, that the details above are correct,
        and I agree that this electronic signature is legally binding.
      </label>
    </div>

    <div class="alert" id="alert"></div>
    <button class="primary" id="submitBtn">Sign &amp; Submit Contract</button>
    <div style="text-align:center"><button type="button" class="link" id="declineBtn">Decline this contract</button></div>
  </div>

<script>
(function () {
  var token = ${JSON.stringify(token)};

  // Grow the iframe to its content so the whole contract reads as one page
  // rather than a nested scroll area.
  var paper = document.getElementById('paper');
  var paperLoading = document.getElementById('paperLoading');
  function fitPaper() {
    try {
      var doc = paper.contentDocument;
      if (!doc || !doc.body) return;
      paper.style.height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) + 'px';
      paperLoading.style.display = 'none';
    } catch (e) { paperLoading.style.display = 'none'; }
  }
  paper.addEventListener('load', function () { fitPaper(); setTimeout(fitPaper, 250); });
  window.addEventListener('resize', fitPaper);
  setTimeout(fitPaper, 400);

  document.getElementById('printBtn').onclick = function () {
    paper.contentWindow.focus();
    paper.contentWindow.print();
  };

  var canvas = document.getElementById('pad');
  var hint = document.getElementById('padhint');
  var ctx = canvas.getContext('2d');
  var drawing = false, hasDrawn = false, last = null;

  // Size the backing store to the device pixel ratio so the signature stays sharp
  function resize() {
    var ratio = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var data = hasDrawn ? canvas.toDataURL() : null;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    if (data) {
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
      img.src = data;
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function point(e) {
    var rect = canvas.getBoundingClientRect();
    var src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function start(e) { e.preventDefault(); drawing = true; last = point(e); }
  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    var p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    if (!hasDrawn) { hasDrawn = true; hint.classList.add('hidden'); }
  }
  function end() { drawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  document.getElementById('clearBtn').onclick = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
    hint.classList.remove('hidden');
  };

  var alertBox = document.getElementById('alert');
  function fail(msg) { alertBox.textContent = msg; alertBox.className = 'alert error'; }

  var btn = document.getElementById('submitBtn');
  btn.onclick = function () {
    var name = document.getElementById('signerName').value.trim();
    if (!name) return fail('Please enter your full name.');
    if (!hasDrawn) return fail('Please draw your signature in the box above.');
    if (!document.getElementById('agreed').checked) return fail('Please tick the confirmation box to continue.');

    alertBox.className = 'alert';
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    fetch('/api/contract-signing/' + token + '/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerName: name,
        signatureImage: canvas.toDataURL('image/png'),
        agreed: true
      })
    })
      .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body.message || 'Submission failed');

        // Swap the document for the signed copy - the signature is now drawn
        // into the contract's signature box, and replace the form with a receipt.
        var signed = res.body.data && res.body.data.signedDocumentHtml;
        if (signed) {
          paper.srcdoc = signed;
          document.querySelector('.paper-bar span').textContent = 'Signed contract';
        }
        document.getElementById('signCard').outerHTML =
          '<div class="card done"><div class="tick">✅</div>' +
          '<h2>Thank you — contract signed</h2>' +
          '<p class="muted">Your signature now appears on the contract above and the sender ' +
          'has been notified. Use <strong>Print / Save PDF</strong> to keep a copy.</p></div>';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function (err) {
        fail(err.message);
        btn.disabled = false;
        btn.textContent = 'Sign & Submit Contract';
      });
  };

  document.getElementById('declineBtn').onclick = function () {
    var reason = window.prompt('Optionally tell us why you are declining:');
    if (reason === null) return;
    fetch('/api/contract-signing/' + token + '/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason })
    }).then(function () {
      document.body.innerHTML =
        '<div class="wrap"><div class="card done"><div class="tick">📋</div>' +
        '<h2>Contract declined</h2><p class="muted">The sender has been notified.</p></div></div>';
    });
  };
})();
</script>`);
