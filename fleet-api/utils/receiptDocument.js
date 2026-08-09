// Branded payment receipt - same header/footer as invoices and contracts, so a
// client receiving all three sees one consistent set of documents.

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

const money = (amount) => `AED ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
})}`;

const PAYMENT_METHOD_LABELS = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    card: 'Card',
    online: 'Online',
};

const receiptCss = `
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #333; }
  ${brandCss}
  .rc-body { padding: 30px 40px 16px; }
  .rc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .rc-title { font-size: 26px; font-weight: 800; color: #232B38; text-transform: uppercase; letter-spacing: 1px; }
  .rc-num { font-size: 12px; color: #666; margin-top: 3px; }
  .rc-stamp { border: 2.5px solid #16a34a; color: #16a34a; border-radius: 6px;
              padding: 8px 16px; font-size: 15px; font-weight: 800; letter-spacing: 2px;
              text-transform: uppercase; transform: rotate(-4deg); }
  .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px;
             border-top: 2px solid #eee; padding-top: 8px; }
  .rc-field { padding: 11px 0; border-bottom: 1px solid #eee; }
  .rc-field .lbl { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .rc-field .value { font-size: 14px; font-weight: 600; color: #222; margin-top: 3px; word-break: break-word; }
  .rc-amount { background: #F0FDF4; border: 1px solid #bbf7d0; border-radius: 8px;
               padding: 18px 22px; margin: 22px 0; text-align: center; }
  .rc-amount .lbl { font-size: 11px; color: #15803d; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
  .rc-amount .value { font-size: 30px; font-weight: 800; color: #14532d; margin-top: 5px; }
  .rc-summary { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .rc-summary td { padding: 9px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  .rc-summary td:last-child { text-align: right; font-weight: 700; color: #222; }
  .rc-summary tr:last-child td { border-bottom: none; font-size: 15px; padding-top: 12px; }
  .rc-note { font-size: 12px; color: #666; line-height: 1.6; margin-top: 20px; }
  .rc-sign { margin-top: 40px; display: flex; justify-content: flex-end; }
  .rc-sign-box { width: 230px; border-top: 1.5px solid #333; padding-top: 7px;
                 font-size: 11px; color: #666; text-align: center; }
`;

/**
 * @param {Object} receipt - receipt record (receiptNumber, amount, paymentMethod, ...)
 * @param {Object} [invoice] - the invoice this payment settles, for the summary block
 */
const renderReceiptDocument = (receipt, invoice = null) => {
    const method = PAYMENT_METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod || '—';

    const fields = [
        ['Received From', receipt.clientName],
        ['Payment Date', formatDate(receipt.paymentDate)],
        ['Payment Method', method],
        ['Reference / Txn No.', receipt.referenceNumber],
        ['Invoice No.', invoice?.invoiceNumber],
        ['Invoice Date', invoice?.issueDate ? formatDate(invoice.issueDate) : null],
    ]
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([label, value]) => `
          <div class="rc-field">
            <div class="lbl">${escapeHtml(label)}</div>
            <div class="value">${escapeHtml(value)}</div>
          </div>`)
        .join('');

    // Only meaningful when the receipt is tied to an invoice
    const summary = invoice ? `
      <table class="rc-summary">
        <tr><td>Invoice Total</td><td>${money(invoice.total)}</td></tr>
        <tr><td>Total Paid to Date</td><td>${money(invoice.totalPaid)}</td></tr>
        <tr>
          <td>Balance Remaining</td>
          <td style="color:${Number(invoice.remainingBalance || 0) > 0 ? '#b91c1c' : '#15803d'}">
            ${money(invoice.remainingBalance)}
          </td>
        </tr>
      </table>` : '';

    const notes = receipt.notes
        ? `<div class="rc-note"><strong>Notes:</strong> ${escapeHtml(receipt.notes).replace(/\n/g, '<br>')}</div>`
        : '';

    const fullySettled = invoice && Number(invoice.remainingBalance || 0) <= 0;

    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt ${escapeHtml(receipt.receiptNumber || '')}</title>
<style>${receiptCss}</style>
</head><body>
  ${brandHeaderHtml}
  <div class="rc-body">
    <div class="rc-top">
      <div>
        <div class="rc-title">Payment Receipt</div>
        <div class="rc-num">#${escapeHtml(receipt.receiptNumber || '')}</div>
      </div>
      <div class="rc-stamp">${fullySettled ? 'Paid in Full' : 'Payment Received'}</div>
    </div>

    <div class="rc-grid">${fields}</div>

    <div class="rc-amount">
      <div class="lbl">Amount Received</div>
      <div class="value">${money(receipt.amount)}</div>
    </div>

    ${summary}
    ${notes}

    <div class="rc-note">
      This is a computer-generated receipt confirming the payment detailed above and is valid without a signature.
    </div>

    <div class="rc-sign">
      <div class="rc-sign-box">For ${escapeHtml(BRAND.shortName)}</div>
    </div>
  </div>
  ${brandFooterHtml}
</body></html>`;
};

module.exports = { renderReceiptDocument, PAYMENT_METHOD_LABELS };
