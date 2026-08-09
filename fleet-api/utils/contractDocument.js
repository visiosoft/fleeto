// Renders the full branded contract document - the same layout the client sees
// on the signing page, prints to PDF, and is frozen as the signed snapshot.
// When a signature is supplied it is drawn into the client signature box, so the
// signed document carries the signature on the page itself.

const { BRAND, brandCss, brandHeaderHtml, brandFooterHtml } = require('./brandTemplate');

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return String(date);
    return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (date) => {
    if (!date) return '';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const formatMoney = (amount) => {
    if (amount === undefined || amount === null || amount === '') return '—';
    return `AED ${Number(amount).toLocaleString()}`;
};

// Contracts can be quoted per day, week or month. Records written before the
// rate unit existed are monthly.
const RATE_LABELS = {
    day: { rate: 'Daily Rate', per: 'per day' },
    week: { rate: 'Weekly Rate', per: 'per week' },
    month: { rate: 'Monthly Rate', per: 'per month' },
};
const rateInfo = (unit) => RATE_LABELS[unit] || RATE_LABELS.month;

// Contract type is the driver arrangement. It used to be free text, so values
// like "Monthly Without Driver" are read rather than printed verbatim.
const contractTypeLabel = (value) => {
    const text = String(value ?? '').toLowerCase();
    if (text.includes('without driver') || text.includes('self drive') || text.includes('self-drive')) {
        return 'Without Driver';
    }
    if (text.includes('with driver') || text.includes('with-driver') || text.includes('chauffeur')) {
        return 'With Driver';
    }
    return 'Without Driver';
};

// Contract length expressed in whole units of the contract's own rate period
const termLength = (contract) => {
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    const days = Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
    const unit = contract.rateUnit || 'month';
    if (unit === 'day') return `${days} day${days === 1 ? '' : 's'}`;
    if (unit === 'week') {
        const weeks = Math.max(1, Math.round(days / 7));
        return `${weeks} week${weeks === 1 ? '' : 's'}`;
    }
    const months = Math.max(1, Math.round(days / 30));
    return `${months} month${months === 1 ? '' : 's'}`;
};

const documentCss = `
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #333; }
  ${brandCss}
  .doc-body { padding: 30px 40px 16px; }
  .doc-title { font-size: 24px; font-weight: 800; color: #232B38; text-transform: uppercase; }
  .doc-num { font-size: 12px; color: #666; margin-top: 2px; margin-bottom: 22px; }
  .doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; border-top: 2px solid #eee; padding-top: 8px; }
  .doc-field { padding: 11px 0; border-bottom: 1px solid #eee; }
  .doc-field .lbl { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .doc-field .value { font-size: 14px; font-weight: 600; color: #222; margin-top: 3px; word-break: break-word; }
  .doc-highlight { background: #F4F9FE; border: 1px solid #d8ecfb; border-radius: 8px;
                   padding: 16px 20px; margin: 22px 0; display: flex; justify-content: space-between; gap: 20px; }
  .doc-highlight .lbl { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .doc-highlight .value { font-size: 17px; font-weight: 800; color: #232B38; margin-top: 3px; }
  .doc-section { font-size: 14px; font-weight: 700; color: #232B38; margin: 22px 0 8px; }
  .doc-text { font-size: 13px; line-height: 1.65; color: #444; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 38px; gap: 48px; }
  .sign-box { flex: 1; }
  .sign-area { height: 84px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; }
  .sign-area img { max-height: 78px; max-width: 100%; }
  .sign-line { border-top: 1.5px solid #333; padding-top: 7px; font-size: 11px; color: #666; text-align: center; }
  .sign-meta { font-size: 10px; color: #888; text-align: center; margin-top: 3px; line-height: 1.5; }
  .signed-stamp { display: inline-block; margin-top: 10px; padding: 4px 10px; border: 1.5px solid #16a34a;
                  color: #16a34a; border-radius: 4px; font-size: 10px; font-weight: 700;
                  letter-spacing: 1px; text-transform: uppercase; }
`;

// Terms come from the company's own contract template when one exists; otherwise
// a standard clause set generated from the contract record.
const renderTerms = (contract) => {
    const custom = contract.template?.content;
    if (custom && String(custom).trim()) {
        // Authored by the company in the template editor - rendered as-is
        return `<div class="doc-text">${custom}</div>`;
    }

    const notes = contract.notes
        ? `<div class="doc-section">Additional Terms</div>
           <div class="doc-text">${escapeHtml(contract.notes).replace(/\n/g, '<br>')}</div>`
        : '';

    return `
    ${notes}
    <div class="doc-section">Declaration</div>
    <div class="doc-text">
      By signing this agreement, the client confirms that the details stated above are correct,
      accepts responsibility for the vehicle for the duration of the contract period, and agrees
      to settle all rental charges, traffic fines and damages attributable to the rental period.
      This agreement is executed electronically and the electronic signature below is legally binding.
    </div>`;
};

/**
 * @param {Object} contract - contract record
 * @param {Object} [options]
 * @param {Object} [options.signature] - when signed, drawn into the client box
 * @returns {string} full HTML document
 */
const renderContractDocument = (contract, options = {}) => {
    const signature = options.signature || null;
    const isSigned = !!(signature && signature.signatureImage);

    const fields = [
        ['Client', contract.companyName],
        ['Contact Person', contract.contactPerson],
        ['Trade License No.', contract.tradeLicenseNo],
        ['Contract Type', contractTypeLabel(contract.contractType)],
        ['Vehicle', contract.vehicleName],
        ['Contact Phone', contract.contactPhone],
        ['Start Date', formatDate(contract.startDate)],
        ['End Date', formatDate(contract.endDate)],
        ['Contract Duration', termLength(contract)],
    ]
        .filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== '—')
        .map(([label, value]) => `
          <div class="doc-field">
            <div class="lbl">${escapeHtml(label)}</div>
            <div class="value">${escapeHtml(value)}</div>
          </div>`)
        .join('');

    const clientSignArea = isSigned
        ? `<img src="${escapeHtml(signature.signatureImage)}" alt="Client signature">`
        : '';

    const clientSignMeta = isSigned
        ? `<div class="sign-meta">
             ${escapeHtml(signature.signerName || '')}<br>
             Signed ${escapeHtml(formatDateTime(signature.signedAt))}
             ${signature.ipAddress ? `<br>IP ${escapeHtml(signature.ipAddress)}` : ''}
           </div>
           <div style="text-align:center"><span class="signed-stamp">Electronically Signed</span></div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contract — ${escapeHtml(contract.companyName || '')}</title>
<style>${documentCss}</style>
</head><body>
  ${brandHeaderHtml}
  <div class="doc-body">
    <div class="doc-title">Contract Agreement</div>
    <div class="doc-num">#${escapeHtml(contract.contractNumber || contract._id || '')}</div>

    <div class="doc-grid">${fields}</div>

    <div class="doc-highlight">
      <div>
        <div class="lbl">${escapeHtml(rateInfo(contract.rateUnit).rate)}</div>
        <div class="value">${formatMoney(contract.amount ?? contract.value)}
          <span style="font-size:12px;font-weight:600;color:#666">
            ${escapeHtml(rateInfo(contract.rateUnit).per)}
          </span>
        </div>
      </div>
      <div>
        <div class="lbl">Security Deposit</div>
        <div class="value">${formatMoney(contract.securityDeposit)}</div>
      </div>
    </div>

    ${renderTerms(contract)}

    <div class="sign-row">
      <div class="sign-box">
        <div class="sign-area"></div>
        <div class="sign-line">${escapeHtml(BRAND.shortName)} — Authorized Signature</div>
      </div>
      <div class="sign-box">
        <div class="sign-area">${clientSignArea}</div>
        <div class="sign-line">Client — Authorized Signature</div>
        ${clientSignMeta}
      </div>
    </div>
  </div>
  ${brandFooterHtml}
</body></html>`;
};

module.exports = {
    renderContractDocument, contractTypeLabel,
    escapeHtml, formatDate, formatDateTime, formatMoney,
};
