const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const db = require('../config/db');
const { renderReceiptDocument, PAYMENT_METHOD_LABELS } = require('../utils/receiptDocument');
const { buildWaMeUrl } = require('../utils/whatsappLink');

const getBaseUrl = (req) => {
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    return `${proto}://${req.get('host')}`;
};

const money = (amount) => `AED ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
})}`;

const formatDate = (date) => {
    if (!date) return '';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Loads the invoice plus the contract behind it (client name and phone live there)
const loadInvoiceContext = async (invoiceId, companyId) => {
    const database = await db.getDb();
    const invoice = await database.collection('invoices').findOne({
        _id: new ObjectId(invoiceId),
        companyId: companyId.toString(),
    });
    if (!invoice) return { invoice: null, contract: null };

    let contract = null;
    if (invoice.contractId) {
        contract = await database.collection('contracts').findOne({
            _id: new ObjectId(invoice.contractId.toString()),
        });
    }
    return { invoice, contract };
};

const buildShareMessage = (receipt, invoice, contract, publicUrl) => {
    const settled = Number(invoice?.remainingBalance || 0) <= 0;
    return `Dear ${contract?.contactPerson || contract?.companyName || receipt.clientName || 'Client'},\n\n` +
        `Thank you - we have received your payment.\n\n` +
        `Receipt No: ${receipt.receiptNumber}\n` +
        `Amount Received: ${money(receipt.amount)}\n` +
        `Date: ${formatDate(receipt.paymentDate)}\n` +
        (invoice?.invoiceNumber ? `Invoice: #${invoice.invoiceNumber}\n` : '') +
        (settled
            ? `Status: Paid in full\n`
            : `Balance Remaining: ${money(invoice?.remainingBalance)}\n`) +
        `\nView / download your receipt:\n${publicUrl}\n\n` +
        `Thank you,\nEfficient Move`;
};

/**
 * Create a shareable receipt for a payment on an invoice.
 * POST /api/invoices/beta/:id/receipt   body: { paymentId? , referenceNumber?, notes? }
 *
 * With no paymentId the most recent payment on the invoice is used, which is what
 * the "record payment then send receipt" flow needs.
 */
exports.createReceiptForPayment = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const { invoice, contract } = await loadInvoiceContext(req.params.id, companyId);
        if (!invoice) {
            return res.status(404).json({ status: 'error', message: 'Invoice not found' });
        }

        const payments = invoice.payments || [];
        if (!payments.length) {
            return res.status(400).json({
                status: 'error',
                message: 'This invoice has no recorded payments to receipt.'
            });
        }

        const { paymentId } = req.body;
        const payment = paymentId
            ? payments.find((p) => p._id?.toString() === paymentId.toString())
            : payments[payments.length - 1];

        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Payment not found on this invoice' });
        }

        const receiptsCollection = await db.getCollection('receipts');

        // One receipt per payment - re-running the flow returns the existing one
        // instead of issuing a duplicate receipt number for the same money.
        const existing = await receiptsCollection.findOne({
            companyId: companyId.toString(),
            paymentId: payment._id.toString(),
        });

        let receipt = existing;
        if (!receipt) {
            const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            receipt = {
                receiptNumber,
                invoiceId: invoice._id.toString(),
                paymentId: payment._id.toString(),
                amount: Number(payment.amountPaid || 0),
                paymentMethod: payment.paymentMethod || 'cash',
                paymentDate: payment.paymentDate || payment.createdAt || new Date(),
                referenceNumber: req.body.referenceNumber || payment.transactionId || '',
                notes: req.body.notes || payment.notes || '',
                clientName: contract?.companyName || invoice.clientName || '',
                clientPhone: contract?.contactPhone || '',
                status: 'completed',
                // Lets the client open the receipt without logging in
                publicToken: crypto.randomBytes(24).toString('hex'),
                companyId: companyId.toString(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = await receiptsCollection.insertOne(receipt);
            receipt._id = result.insertedId;
        }

        const publicUrl = `${getBaseUrl(req)}/receipt/${receipt.publicToken}`;
        const shareMessage = buildShareMessage(receipt, invoice, contract, publicUrl);

        res.status(existing ? 200 : 201).json({
            status: 'success',
            message: existing ? 'Receipt already issued for this payment' : 'Receipt created',
            data: {
                receipt,
                publicUrl,
                shareMessage,
                whatsappUrl: buildWaMeUrl(receipt.clientPhone, shareMessage),
                clientPhone: receipt.clientPhone || null,
                // Rendered here so mobile can print it straight to PDF
                html: renderReceiptDocument(receipt, invoice),
            }
        });
    } catch (error) {
        console.error('Error creating payment receipt:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Receipt HTML for printing / saving as PDF from inside the apps.
 * GET /api/receipts/:id/document
 */
exports.getReceiptDocument = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ status: 'error', message: 'Company ID not found in user token' });
        }

        const receiptsCollection = await db.getCollection('receipts');
        const receipt = await receiptsCollection.findOne({
            _id: new ObjectId(req.params.id),
            companyId: companyId.toString(),
        });
        if (!receipt) {
            return res.status(404).json({ status: 'error', message: 'Receipt not found' });
        }

        let invoice = null;
        if (receipt.invoiceId) {
            const database = await db.getDb();
            invoice = await database.collection('invoices').findOne({
                _id: new ObjectId(receipt.invoiceId.toString()),
            });
        }

        const publicUrl = receipt.publicToken ? `${getBaseUrl(req)}/receipt/${receipt.publicToken}` : null;

        res.status(200).json({
            status: 'success',
            data: {
                html: renderReceiptDocument(receipt, invoice),
                receiptNumber: receipt.receiptNumber,
                publicUrl,
            }
        });
    } catch (error) {
        console.error('Error building receipt document:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Public receipt page the client opens from the WhatsApp link.
 * GET /receipt/:token   - no auth; the random token is the credential.
 */
exports.renderPublicReceipt = async (req, res) => {
    try {
        const token = req.params.token;
        if (!token || !/^[a-f0-9]{48}$/.test(token)) {
            return res.status(404).send(notFoundPage());
        }

        const receiptsCollection = await db.getCollection('receipts');
        const receipt = await receiptsCollection.findOne({ publicToken: token });
        if (!receipt) {
            return res.status(404).send(notFoundPage());
        }

        let invoice = null;
        if (receipt.invoiceId) {
            const database = await db.getDb();
            invoice = await database.collection('invoices').findOne({
                _id: new ObjectId(receipt.invoiceId.toString()),
            });
        }

        // The receipt document is a full HTML page, so it is framed rather than
        // inlined - same approach as the contract signing page.
        res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Receipt ${receipt.receiptNumber || ''}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 20px 14px 40px; }
  .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,.12); overflow: hidden; }
  .bar { display: flex; align-items: center; justify-content: space-between;
         padding: 11px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
         font-size: 13px; font-weight: 600; color: #64748b; }
  button { font-family: inherit; font-size: 14px; font-weight: 600; border: none; cursor: pointer;
           background: #2563eb; color: #fff; border-radius: 7px; padding: 9px 15px; }
  iframe { width: 100%; border: 0; display: block; background: #fff; }
</style></head>
<body><div class="wrap"><div class="card">
  <div class="bar"><span>Payment receipt</span><button id="p">Print / Save PDF</button></div>
  <iframe id="f" title="Receipt" style="height:0"></iframe>
</div></div>
<script>
(function () {
  var f = document.getElementById('f');
  f.srcdoc = ${JSON.stringify(renderReceiptDocument(receipt, invoice))};
  function fit() {
    try {
      var d = f.contentDocument;
      if (d && d.body) f.style.height = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight) + 'px';
    } catch (e) {}
  }
  f.addEventListener('load', function () { fit(); setTimeout(fit, 250); });
  window.addEventListener('resize', fit);
  setTimeout(fit, 400);
  document.getElementById('p').onclick = function () { f.contentWindow.focus(); f.contentWindow.print(); };
})();
</script></body></html>`);
    } catch (error) {
        console.error('Error rendering public receipt:', error);
        res.status(500).send(notFoundPage('We could not load this receipt. Please try again later.'));
    }
};

const notFoundPage = (message = 'This receipt link is not valid.') => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt unavailable</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0">
  <div style="max-width:420px;margin:60px auto;background:#fff;border-radius:12px;padding:40px 24px;text-align:center">
    <div style="font-size:44px">🧾</div>
    <h2 style="margin:12px 0 6px;color:#0f172a">Receipt unavailable</h2>
    <p style="color:#64748b;font-size:14px;margin:0">${message}</p>
  </div>
</body></html>`;

module.exports.PAYMENT_METHOD_LABELS = PAYMENT_METHOD_LABELS;
