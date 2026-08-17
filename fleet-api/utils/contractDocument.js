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
  body { margin: 0; background: #FBF8F2; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #14081F; font-size: 12px; line-height: 1.45; }
  a { color: #4A1FA0; text-decoration: underline; }
  ${brandCss}
  .doc-body { max-width: 760px; margin: 0 auto; padding: 20px 36px 12px; }

  .sign-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; page-break-inside: avoid; margin-top: 20px; }
  .sign-box-header { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #1A0B33; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid rgba(20,8,31,.14); }
  .sign-fields { display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: #4A4357; }
  .sign-area { height: 60px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; }
  .sign-area img { max-height: 56px; max-width: 100%; }
  .sign-line { border-bottom: 1px dotted #756E80; display: inline-block; width: 58%; }
  .signed-stamp { display: inline-block; margin-top: 6px; padding: 3px 8px; border: 1.5px solid #16a34a;
                  color: #16a34a; border-radius: 4px; font-size: 9px; font-weight: 700;
                  letter-spacing: 1px; text-transform: uppercase; }
`;

/**
 * @param {Object} contract - contract record
 * @param {Object} [options]
 * @param {Object} [options.signature] - when signed, drawn into the client box
 * @returns {string} full HTML document
 */
const renderContractDocument = (contract, options = {}) => {
  const signature = options.signature || null;
  const isSigned = !!(signature && signature.signatureImage);

  const vehicleName = escapeHtml(contract.vehicleName || '—');
  const startDate = formatDate(contract.startDate);
  const endDate = formatDate(contract.endDate);
  const totalValue = formatMoney(contract.totalValue ?? contract.value ?? contract.amount);
  const deposit = formatMoney(contract.securityDeposit);
  const duration = termLength(contract);
  const paymentMethod = escapeHtml(contract.paymentMethod || 'Post-Dated Cheque');
  const mileageCap = Number(contract.mileageCap || 5000).toLocaleString();
  const excessRate = Number(contract.excessMileageRate || 1);

  const extraContacts = Array.isArray(contract.contacts) ? contract.contacts.filter(c => c && (c.name || c.phone)) : [];
  const extraContactsHtml = extraContacts.length
    ? extraContacts.map(c => `<div style="color: #4A4357; font-size: 13.5px; margin-top: 4px;">${escapeHtml(c.name || 'Contact')}${c.role ? ` &middot; ${escapeHtml(c.role)}` : ''}${c.phone ? ` &mdash; ${escapeHtml(c.phone)}` : ''}</div>`).join('')
    : '';

  const clientSignArea = isSigned
    ? `<div style="margin-top: 8px;"><img src="${escapeHtml(signature.signatureImage)}" alt="Client signature" style="max-height: 78px; max-width: 100%;"></div>`
    : '';

  const clientSignMeta = isSigned
    ? `<div style="font-size: 10px; color: #756E80; margin-top: 6px;">
             ${escapeHtml(signature.signerName || '')}<br>
             Signed ${escapeHtml(formatDateTime(signature.signedAt))}
             ${signature.ipAddress ? `<br>IP ${escapeHtml(signature.ipAddress)}` : ''}
           </div>
           <div style="margin-top: 6px;"><span class="signed-stamp">Electronically Signed</span></div>`
    : '';

  // Terms: use custom template content if available
  const termsHtml = (() => {
    const custom = contract.template?.content;
    if (custom && String(custom).trim()) {
      return custom;
    }
    const notes = contract.notes
      ? `<h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Additional Terms</h3>
               <p style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">${escapeHtml(contract.notes).replace(/\n/g, '<br>')}</p>`
      : '';
    return `
        ${notes}
        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Contract Duration and Value</h3>
        <div style="margin: 0 0 8px 18px; font-size: 12px;">
          <div>Duration: From ${startDate} to ${endDate} &middot; Renewal: mutual written consent only</div>
          <div>Total Rental Value: ${totalValue} &middot; Security Deposit: ${deposit} &middot; Payment: ${paymentMethod}</div>
        </div>
        <p style="margin: 0 0 12px; color: #4A4357; font-size: 11px;">Security Deposit refundable within 21 days after vehicle return, subject to inspection, clearance of fines, Salik charges, and settlement of all outstanding dues. The Company reserves the right to deduct unpaid amounts, damages, fines, repair costs, or other liabilities from the deposit.</p>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Vehicle Handover and Condition</h3>
        <p style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">The Vehicle shall be delivered in good working and roadworthy condition. A vehicle handover report shall be signed by both Parties at delivery and return. The Client confirms receipt of the Vehicle in satisfactory condition.</p>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Payment Default</h3>
        <p style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">In case of cheque dishonor or delayed payment, the Company reserves the right to immediately repossess the Vehicle without prior notice and pursue legal remedies under UAE law.</p>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Client Responsibilities</h3>
        <ul style="margin: 0 0 6px; padding-left: 18px; color: #4A4357; font-size: 12px;">
          <li>Fuel and petrol costs</li>
          <li>Salik (toll) charges</li>
          <li>Traffic fines, black points, parking violations, and impound charges &mdash; must be paid within 3 days</li>
          <li>Compliance with all UAE traffic laws and regulations</li>
        </ul>
        <p style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">The Client shall ensure that only legally licensed drivers operate the Vehicle.</p>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Maintenance and Repairs</h3>
        <div style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">
          <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Routine Maintenance:</strong> Client responsible for all routine/preventive maintenance (monthly oil change, filters, brake inspection, tire rotation) at reputable garages using manufacturer-approved parts.</p>
          <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Operational Liability:</strong> Client assumes full financial responsibility for damages from accidents, negligence, misuse, overloading, overheating, or failure to maintain.</p>
          <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Major Repairs:</strong> Company responsible only for major mechanical defects from normal wear and tear, not caused by misuse or negligence.</p>
          <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Accidents:</strong> Valid Dubai Police report mandatory. Insurance deductible borne by Client. Damage without police report fully payable by Client.</p>
          <p style="margin: 0 0 4px;"><strong style="color: #14081F;">Authorization:</strong> No non-routine repair without prior written Company approval. Unauthorized repairs not reimbursed.</p>
          <p style="margin: 0;"><strong style="color: #14081F;">Records:</strong> Client shall maintain proper maintenance records and provide upon request.</p>
        </div>

        <div style="border: 1.5px solid #B45309; background: #FEF6E7; border-radius: 8px; padding: 12px 14px; margin: 0 0 14px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="width: 6px; height: 6px; border-radius: 999px; background: #B45309; display: inline-block;"></span>
            <span style="text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; font-weight: 700; color: #92400E;">Mileage Limit and Excess Charges</span>
          </div>
          <p style="margin: 0; color: #78350F; font-weight: 500; font-size: 11px;">Maximum ${mileageCap} km per month. Excess charged at ${excessRate} AED per additional km. Odometer recorded at start/end of each month; excess invoiced separately and payable within 7 days.</p>
        </div>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Prohibited Use</h3>
        <p style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">The Vehicle shall not be used for illegal activities, racing, reckless driving, sub-renting, or transport outside Dubai without written Company consent.</p>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Termination</h3>
        <ul style="margin: 0 0 12px; padding-left: 18px; color: #4A4357; font-size: 12px;">
          <li>Early termination requires 30 days written notice and full settlement of remaining rental value.</li>
          <li>Either Party may terminate for material breach with 30 days written notice.</li>
          <li>Upon termination, Vehicle must be returned immediately and all dues settled.</li>
        </ul>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Vehicle Return</h3>
        <p style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">Vehicle shall be returned to the Company premises or agreed location in clean condition with all keys and documents. Failure to return may result in legal action.</p>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Governing Law and Jurisdiction</h3>
        <p style="margin: 0 0 12px; color: #4A4357; font-size: 12px;">Governed by the laws of the UAE. Courts of Dubai have exclusive jurisdiction.</p>

        <h3 style="font-size: 11px; font-weight: 700; color: #4A1FA0; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 6px;">Entire Agreement</h3>
        <p style="margin: 0 0 16px; color: #4A4357; font-size: 12px;">This Agreement constitutes the entire understanding between the Parties and supersedes all prior agreements. Any amendment must be in writing and signed by both Parties.</p>

        <p style="margin: 0 0 12px; color: #4A4357; font-size: 11px;">By signing, the client confirms the above details are correct, accepts responsibility for the vehicle for the contract duration, and agrees to settle all rental charges, fines and damages. This agreement is executed electronically and the electronic signature below is legally binding.</p>`;
  })();

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contract — ${escapeHtml(contract.companyName || '')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${documentCss}</style>
</head><body>
  ${brandHeaderHtml}
  <div class="doc-body">

    <div style="display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #14081F; padding-bottom: 12px; margin-bottom: 16px;">
      <div>
        <div style="text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; font-size: 9px; color: #4A1FA0; margin-bottom: 4px;">Vehicle Rental Agreement</div>
        <h1 style="font-family: 'Bricolage Grotesque', serif; font-weight: 800; font-size: 24px; letter-spacing: -0.02em; margin: 0; color: #1A0B33;">Rental Agreement</h1>
      </div>
      <div style="text-align: right; font-size: 10px; color: #756E80; font-weight: 500;">
        <div>Dubai, UAE</div>
        <div>Entered into ${startDate}</div>
        <div style="margin-top: 2px; font-size: 9px; color: #999;">#${escapeHtml(contract.contractNumber || contract._id || '')}</div>
      </div>
    </div>

    <p style="margin: 0 0 14px; color: #4A4357; font-size: 12px;">This Vehicle Rental Agreement (the &ldquo;Agreement&rdquo;) is made and entered into on <strong style="color: #14081F;">${startDate}</strong> in Dubai, United Arab Emirates.</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
      <div style="border: 1px solid rgba(20,8,31,.14); border-radius: 8px; padding: 12px 14px;">
        <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; font-weight: 700; color: #756E80; margin-bottom: 4px;">Company</div>
        <div style="font-weight: 700; font-size: 12px; margin-bottom: 2px;">${escapeHtml(BRAND.name)}</div>
        <div style="color: #4A4357; font-size: 11px;">${escapeHtml(BRAND.city)} &middot; ${escapeHtml(BRAND.phone)}</div>
      </div>
      <div style="border: 1px solid rgba(20,8,31,.14); border-radius: 8px; padding: 12px 14px;">
        <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; font-weight: 700; color: #756E80; margin-bottom: 4px;">Client</div>
        <div style="font-weight: 700; font-size: 12px; margin-bottom: 2px;">${escapeHtml(contract.companyName || '—')}</div>
        <div style="color: #4A4357; font-size: 11px;">${contract.tradeLicenseNo ? `TL# ${escapeHtml(contract.tradeLicenseNo)}` : ''}${(contract.contactPerson) ? ` &middot; ${escapeHtml(contract.contactPerson)}` : ''}${(contract.contactPhone) ? ` &mdash; ${escapeHtml(contract.contactPhone)}` : ''}</div>
        ${extraContactsHtml}
      </div>
    </div>

    <div style="border: 1px solid #DDD0FF; background: #F7F3FF; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
      <div style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; font-weight: 700; color: #4A1FA0; margin-bottom: 10px;">Key Terms at a Glance</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 16px;">
        <div>
          <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Vehicle</div>
          <div style="font-weight: 700; font-size: 11px;">${vehicleName}</div>
        </div>
        <div>
          <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Duration</div>
          <div style="font-weight: 700; font-size: 11px;">${startDate} &ndash; ${endDate}${duration ? ` (${duration})` : ''}</div>
        </div>
        <div>
          <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Total Rental Value</div>
          <div style="font-weight: 700; font-size: 11px;">${totalValue}</div>
        </div>
        <div>
          <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Security Deposit</div>
          <div style="font-weight: 700; font-size: 11px;">${deposit}</div>
        </div>
        <div>
          <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Payment Method</div>
          <div style="font-weight: 700; font-size: 11px;">${paymentMethod}</div>
        </div>
        <div>
          <div style="font-size: 9px; color: #756E80; margin-bottom: 2px;">Mileage Cap</div>
          <div style="font-weight: 700; font-size: 11px;">${mileageCap} km / month</div>
        </div>
      </div>
    </div>

    <h2 style="font-family: 'Bricolage Grotesque', serif; font-weight: 700; font-size: 15px; letter-spacing: -0.01em; color: #1A0B33; margin: 0 0 6px;">Vehicle Information</h2>
    <p style="margin: 0 0 4px; color: #4A4357; font-size: 12px;">The Company hereby rents to the Client the following vehicle ${escapeHtml(contractTypeLabel(contract.contractType)).toLowerCase()}:</p>
    <div style="margin: 0 0 16px 18px; color: #14081F; font-size: 12px;">
      <div>Vehicle: <strong>${vehicleName}</strong></div>
    </div>

    <h2 style="font-family: 'Bricolage Grotesque', serif; font-weight: 700; font-size: 15px; letter-spacing: -0.01em; color: #1A0B33; margin: 0 0 10px;">Terms and Conditions</h2>

    ${termsHtml}

    <div class="sign-row">
      <div class="sign-box">
        <div class="sign-box-header">For ${escapeHtml(BRAND.shortName)}</div>
        <div class="sign-fields">
          <div>Name: <span class="sign-line">&nbsp;</span></div>
          <div>Signature: <span class="sign-line">&nbsp;</span></div>
          <div>Date: <span class="sign-line">&nbsp;</span></div>
        </div>
      </div>
      <div class="sign-box">
        <div class="sign-box-header">For ${escapeHtml(contract.companyName || '—')}</div>
        <div class="sign-fields">
          <div>Name: <strong style="color: #14081F;">${escapeHtml(contract.contactPerson || '')}</strong></div>
          ${clientSignArea}
          <div>Signature: <span class="sign-line">&nbsp;</span></div>
          <div>Date: <span class="sign-line">&nbsp;</span></div>
        </div>
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
