import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Linking, TextInput, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { invoiceService } from '../../services/financeService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, fonts } from '../../config/theme';
import { ui } from '../../config/ui';
import { BRAND, brandCss, brandHeaderHtml, brandFooterHtml } from '../../utils/brandTemplate';

const formatDate = (d: any) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// UI date format e.g. "Jul 15, 2026"
const fmtDate = (d: any) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const generateInvoiceHtml = (invoice: any) => {
  const contract = invoice.contract || {};
  const fmtNum = (n: any) => Number(n || 0).toFixed(2);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; min-height: 100vh; display: flex; flex-direction: column; }
  ${brandCss}
  .body { flex: 1; padding: 28px 32px 16px; }
  .title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .title-left h2 { font-size: 26px; font-weight: 800; color: #232B38; text-transform: uppercase; }
  .title-left .inv-num { font-size: 12px; color: #666; margin-top: 2px; }
  .company-info { text-align: right; font-size: 11px; color: #555; line-height: 1.7; }
  .company-info .name { font-size: 14px; font-weight: 700; color: #222; }
  .bill-section { display: flex; justify-content: space-between; border-top: 2px solid #eee; border-bottom: 2px solid #eee; padding: 14px 0; margin-bottom: 20px; }
  .bill-to .label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .bill-to .client-name { font-size: 16px; font-weight: 700; color: #222; }
  .bill-to .client-detail { font-size: 11px; color: #666; margin-top: 1px; }
  .dates { text-align: right; }
  .dates .date-label { font-size: 10px; color: #888; text-transform: uppercase; }
  .dates .date-value { font-size: 14px; font-weight: 700; color: #222; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  thead td { font-size: 11px; font-weight: 700; color: #333; padding: 8px 0; border-bottom: 2px solid #333; }
  thead td:nth-child(2) { text-align: center; }
  thead td:nth-child(3), thead td:last-child { text-align: right; }
  tbody td { padding: 12px 0; font-size: 12px; color: #444; border-bottom: 1px solid #eee; }
  tbody td:nth-child(2) { text-align: center; }
  tbody td:nth-child(3), tbody td:last-child { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-top: 10px; margin-bottom: 24px; }
  .totals-box { width: 260px; }
  .t-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: #555; }
  .t-row.total-main { border-top: 2px solid #333; padding-top: 8px; margin-top: 3px; }
  .t-row.total-main span:first-child { font-size: 15px; font-weight: 700; color: #222; }
  .t-row.total-main span:last-child { font-size: 16px; font-weight: 800; color: #222; }
  .t-row.paid span { color: #888; }
  .t-row.balance span { font-weight: 700; color: #c0392b; }
  .bank { text-align: center; margin: 20px 0; padding: 16px; border-top: 1px solid #eee; }
  .bank .legal { font-size: 11px; font-weight: 700; color: #333; text-transform: uppercase; margin-bottom: 6px; }
  .bank p { font-size: 11px; color: #666; line-height: 1.8; }
  .notes { margin: 0 0 20px; padding: 12px 14px; background: #fafafa; border-left: 3px solid #35A3EF; }
  .notes h4 { font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 3px; }
  .notes p { font-size: 11px; color: #555; line-height: 1.5; white-space: pre-line; }
</style></head><body>
  ${brandHeaderHtml}
  <div class="body">
    <div class="title-row">
      <div class="title-left"><h2>Invoice</h2><div class="inv-num">#${invoice.invoiceNumber}</div></div>
      <div class="company-info">
        <div class="name">Efficient Move</div>
        <div>New &amp; Used Furniture Removal L.L.C</div>
        <div>Dubai, UAE</div>
        <div>${BRAND.phone}</div>
      </div>
    </div>
    <div class="bill-section">
      <div class="bill-to">
        <div class="label">Bill To</div>
        <div class="client-name">${contract.companyName || 'Client'}</div>
        ${contract.contactPerson ? `<div class="client-detail">${contract.contactPerson}</div>` : ''}
        ${contract.contactEmail ? `<div class="client-detail">${contract.contactEmail}</div>` : ''}
        ${contract.tradeLicenseNo ? `<div class="client-detail">License No: ${contract.tradeLicenseNo}</div>` : ''}
      </div>
      <div class="dates">
        <div class="date-label">Issue Date</div>
        <div class="date-value">${formatDate(invoice.issueDate)}</div>
        <div class="date-label">Due Date</div>
        <div class="date-value">${formatDate(invoice.dueDate)}</div>
      </div>
    </div>
    <table>
      <thead><tr><td>Description</td><td>Qty</td><td>Unit Price</td><td>Amount</td></tr></thead>
      <tbody>
        ${(invoice.items || []).map((item: any) => `
          <tr><td>${item.description || ''}</td><td>${item.quantity || 1}</td><td>${fmtNum(item.unitPrice)}</td><td>${fmtNum(item.amount)}</td></tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals"><div class="totals-box">
      <div class="t-row"><span>Subtotal:</span><span>AED ${fmtNum(invoice.subtotal)}</span></div>
      ${invoice.includeVat !== false && (invoice.tax || 0) > 0 ? `<div class="t-row"><span>VAT (5%):</span><span>AED ${fmtNum(invoice.tax)}</span></div>` : ''}
      <div class="t-row total-main"><span>Total:</span><span>AED ${fmtNum(invoice.total)}</span></div>
      <div class="t-row paid"><span>Paid:</span><span>AED ${fmtNum(invoice.totalPaid)}</span></div>
      <div class="t-row balance"><span>Balance Due:</span><span>AED ${fmtNum((invoice.total || 0) - (invoice.totalPaid || 0))}</span></div>
    </div></div>
    ${invoice.notes ? `<div class="notes"><h4>Notes</h4><p>${invoice.notes}</p></div>` : ''}
    <div class="bank"><div class="legal">${BRAND.name}</div><p>Account Holder: Sardar Basharat Safdar<br>Bank Name: Mashreq Bank<br>Account Number: 019120198982<br>IBAN: AE710330000019120198982</p></div>
  </div>
  ${brandFooterHtml}
</body></html>`;
};

const InvoiceDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [invoice, setInvoice] = useState<any>(route.params.invoice || null);
  const [loading, setLoading] = useState(!route.params.invoice);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentNote, setPaymentNote] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchInvoice = async () => {
    try {
      const r = await invoiceService.getById(id);
      setInvoice(r.data?.data || r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoice(); }, [id]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchInvoice);
    return unsub;
  }, [navigation]);

  const handleDelete = () => {
    const doDelete = async () => {
      try { await invoiceService.delete(id); navigation.goBack(); }
      catch {
        if (Platform.OS === 'web') window.alert('Failed to delete');
        else Alert.alert('Error', 'Failed to delete');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this invoice?')) doDelete();
    } else {
      Alert.alert('Delete Invoice', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const generateAndSharePdf = async (shareToWhatsApp = false) => {
    if (!invoice) return;
    setPdfLoading(true);
    // On web, the window must open synchronously in the click gesture or pop-up blockers kill it
    let webWin: any = null;
    if (Platform.OS === 'web') {
      webWin = window.open('', '_blank');
    }
    try {
      let fullInvoice = invoice;
      try {
        const htmlRes = await invoiceService.getInvoiceHtml(id);
        fullInvoice = htmlRes.data?.data || invoice;
      } catch (e) {
        console.log('Using local invoice data for PDF');
      }

      const html = generateInvoiceHtml(fullInvoice);

      if (Platform.OS === 'web') {
        // Web: fill the pre-opened window — user can "Save as PDF" from the print dialog
        if (!webWin) {
          window.alert('Please allow pop-ups to download the invoice PDF.');
          return;
        }
        webWin.document.write(html);
        webWin.document.close();
        webWin.focus();
        setTimeout(() => webWin.print(), 400);
      } else if (!shareToWhatsApp) {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Invoice via WhatsApp',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (err: any) {
      console.error('PDF error:', err);
      if (webWin) { try { webWin.close(); } catch { } }
      if (Platform.OS === 'web') window.alert(err.message || 'Failed to generate PDF');
      else Alert.alert('Error', err.message || 'Failed to generate PDF');
    } finally { setPdfLoading(false); }
  };

  // Creates (or re-fetches) the receipt for the latest payment and opens the
  // share sheet. Safe to call twice - the API returns the existing receipt
  // rather than issuing a second one for the same payment.
  const issueReceipt = async ({ prompt = false }: { prompt?: boolean } = {}) => {
    setReceiptLoading(true);
    try {
      const r = await invoiceService.createReceipt(id);
      setReceipt(r.data.data);
      if (prompt) setShowReceiptModal(true);
      return r.data.data;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create receipt';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Error', msg);
      return null;
    } finally {
      setReceiptLoading(false);
    }
  };

  const openReceipt = async () => {
    const data = receipt || await issueReceipt();
    if (data) setShowReceiptModal(true);
  };

  // wa.me carries text only, so the message links to the hosted receipt page
  // where the client can view and save the PDF themselves.
  const sendReceiptOnWhatsApp = () => {
    if (!receipt?.whatsappUrl) return;
    Linking.openURL(receipt.whatsappUrl).catch(() => {
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp. Copy the message and send it another way.');
    });
  };

  // Attaches the actual PDF file - this is how a receipt PDF reaches WhatsApp,
  // since a wa.me link cannot carry an attachment.
  const shareReceiptPdf = async () => {
    if (!receipt?.html) return;
    setReceiptLoading(true);
    try {
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (!win) { window.alert('Please allow pop-ups to open the receipt.'); return; }
        win.document.write(receipt.html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
      } else {
        const { uri } = await Print.printToFileAsync({ html: receipt.html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Receipt ${receipt.receipt?.receiptNumber || ''}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          await Print.printAsync({ html: receipt.html });
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate receipt PDF');
    } finally {
      setReceiptLoading(false);
    }
  };

  const copyReceiptMessage = async () => {
    if (!receipt?.shareMessage) return;
    await Clipboard.setStringAsync(receipt.shareMessage);
    Alert.alert('Copied', 'Receipt message copied to clipboard.');
  };

  const copyReceiptLink = async () => {
    if (!receipt?.publicUrl) return;
    await Clipboard.setStringAsync(receipt.publicUrl);
    Alert.alert('Copied', 'Receipt link copied to clipboard.');
  };

  const handleMarkPaid = async () => {
    try {
      await invoiceService.update(id, { status: 'paid' });
      await fetchInvoice();
    } catch (err: any) {
      const msg = err?.message || 'Failed to mark invoice as paid';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleRecordPayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      if (Platform.OS === 'web') window.alert('Enter a valid amount');
      else Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    try {
      await invoiceService.addPayment(id, {
        amountPaid: amt,
        paymentMethod,
        notes: paymentNote,
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
      await fetchInvoice();

      // A payment is only really done once the client has the receipt, so offer
      // it straight away rather than making them hunt for it later.
      await issueReceipt({ prompt: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to record payment';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleSendWhatsApp = () => {
    const phone = String(contract?.contactPhone || '').replace(/[^\d]/g, '');
    const total = (invoice.total || 0);
    const paid = invoice.totalPaid || 0;
    const bal = total - paid;
    const dueStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const invoiceLink = `https://api.mypaperlessoffice.org/api/invoices/beta/${id}/html`;
    const amountLine = paid > 0
      ? `Total: AED ${total.toLocaleString()}\nPaid: AED ${paid.toLocaleString()}\nBalance Due: *AED ${bal.toLocaleString()}*`
      : `Amount: *AED ${total.toLocaleString()}*`;
    const msg = `Dear ${contract?.contactPerson || contract?.companyName || 'Client'},\n\nInvoice #${invoice.invoiceNumber || ''}\n${amountLine}\nDue Date: *${dueStr}*\n\nView/Download Invoice:\n${invoiceLink}\n\nPlease arrange payment at your earliest convenience.\n\nThank you,\nEfficient Move`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => { });
    invoiceService.update(id, { status: 'sent' }).then(() => fetchInvoice()).catch(() => { });
  };

  const handleSendReminder = () => {
    const phone = String(contract?.contactPhone || '').replace(/[^\d]/g, '');
    const bal = ((invoice.total || 0) - (invoice.totalPaid || 0)).toLocaleString();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
    const dueStr = dueDate ? dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const isOverdue = dueDate ? dueDate.getTime() < Date.now() : false;
    const invoiceLink = `https://api.mypaperlessoffice.org/api/invoices/beta/${id}/html`;

    const msg = isOverdue
      ? `Dear ${contract?.contactPerson || contract?.companyName || 'Client'},\n\n⚠️ *OVERDUE* — Invoice #${invoice.invoiceNumber || ''}\n\nThe due date (*${dueStr}*) has already passed.\nBalance Due: *AED ${bal}*\n\nPlease settle this payment immediately to avoid any service disruption.\n\nView/Download Invoice:\n${invoiceLink}\n\nThank you,\nEfficient Move`
      : `Dear ${contract?.contactPerson || contract?.companyName || 'Client'},\n\nFriendly reminder for Invoice #${invoice.invoiceNumber || ''}\nBalance Due: *AED ${bal}*\nDue Date: *${dueStr}*\n\nView/Download Invoice:\n${invoiceLink}\n\nKindly arrange payment at your earliest.\n\nThank you,\nEfficient Move`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => { });
  };

  if (loading || !invoice) return <LoadingScreen />;

  const contract = invoice.contract || {};
  const total = invoice.total || invoice.totalAmount || 0;
  const totalPaid = invoice.totalPaid || invoice.paidAmount || 0;
  const balance = total - totalPaid;
  const status = (invoice.status || '').toLowerCase();

  const pill = status === 'paid'
    ? { bg: ui.greenTint, color: ui.green, label: 'Paid' }
    : status === 'partial'
      ? { bg: '#fef3c7', color: '#d97706', label: 'Partially Paid' }
      : status === 'draft'
        ? { bg: ui.grayTint, color: ui.muted, label: 'Draft' }
        : status === 'overdue' || (invoice.dueDate && new Date(invoice.dueDate) < new Date() && status !== 'paid')
          ? { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' }
          : { bg: ui.amberTint, color: ui.amber, label: 'Unpaid' };

  const infoCells = [
    { label: 'Issue Date', value: fmtDate(invoice.issueDate || invoice.invoiceDate) },
    { label: 'Due Date', value: fmtDate(invoice.dueDate) },
    { label: 'Contract', value: contract.contractNumber || contract.tradeLicenseNo ? `#${contract.contractNumber || contract.tradeLicenseNo}` : '—', purple: true },
    { label: 'Vehicle', value: contract.vehicleName || '—' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Invoice card */}
      <View style={styles.invoiceCard}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.billToLabel}>BILL TO</Text>
            <Text style={styles.clientName}>{contract.companyName || invoice.customerName || 'Client'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.statusPillText, { color: pill.color }]}>{pill.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          {infoCells.map((cell, i) => (
            <View key={i} style={styles.infoCell}>
              <Text style={styles.infoLabel}>{cell.label.toUpperCase()}</Text>
              <Text style={[styles.infoValue, cell.purple && { color: ui.purple }]}>{cell.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={{ gap: 12 }}>
          {(invoice.items || []).map((item: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemMeta}>{item.quantity || 1} × AED {(item.unitPrice || 0).toLocaleString()}</Text>
              </View>
              <Text style={styles.itemAmount}>{(item.amount || 0).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>AED {total.toLocaleString()}</Text>
        </View>

        {totalPaid > 0 && (
          <View style={{ marginTop: 10, gap: 4 }}>
            <View style={styles.subTotalRow}>
              <Text style={[styles.subTotalText, { color: ui.green }]}>Paid</Text>
              <Text style={[styles.subTotalText, { color: ui.green }]}>AED {totalPaid.toLocaleString()}</Text>
            </View>
            <View style={styles.subTotalRow}>
              <Text style={[styles.subTotalText, { color: ui.red }]}>Balance</Text>
              <Text style={[styles.subTotalText, { color: ui.red }]}>AED {balance.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsWrap}>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, pdfLoading && { opacity: 0.6 }]}
            onPress={() => generateAndSharePdf(false)}
            disabled={pdfLoading}
          >
            <Icon name="download-outline" size={16} color={ui.ink} />
            <Text style={styles.secondaryBtnText}>{pdfLoading ? 'Wait...' : 'Download PDF'}</Text>
          </TouchableOpacity>
        </View>

        {status !== 'paid' && (
          <View style={{ gap: 8, marginTop: 12 }}>
            <TouchableOpacity style={styles.recordPayBtn} onPress={() => setShowPaymentModal(true)}>
              <Icon name="cash-plus" size={16} color={ui.purple} />
              <Text style={[styles.markPaidText, { color: ui.purple }]}>Record Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.markPaidBtn} onPress={handleMarkPaid}>
              <Icon name="check-circle-outline" size={16} color={ui.green} />
              <Text style={styles.markPaidText}>Mark as Fully Paid</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Available whenever money has been received, including part payments */}
        {(invoice.payments?.length > 0 || (invoice.totalPaid || 0) > 0) && (
          <TouchableOpacity
            style={styles.receiptBtn}
            onPress={openReceipt}
            disabled={receiptLoading}
          >
            {receiptLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Icon name="receipt" size={16} color="#fff" />}
            <Text style={styles.receiptBtnText}>
              {receiptLoading ? 'Preparing…' : 'Receipt — send to client'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* WhatsApp Send */}
      {status !== 'paid' && (
        <TouchableOpacity
          style={styles.whatsappCard}
          onPress={handleSendWhatsApp}
        >
          <View style={styles.whatsappIcon}>
            <Icon name="whatsapp" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappTitle}>Send Invoice via WhatsApp</Text>
            <Text style={styles.whatsappSub}>Send directly to client's number</Text>
          </View>
          <Icon name="chevron-right" size={22} color={ui.muted} />
        </TouchableOpacity>
      )}

      {/* WhatsApp Reminder */}
      {status !== 'paid' && (
        <TouchableOpacity
          style={[styles.whatsappCard, { borderColor: '#f59e0b', borderWidth: 1 }]}
          onPress={handleSendReminder}
        >
          <View style={[styles.whatsappIcon, { backgroundColor: '#f59e0b' }]}>
            <Icon name="bell-ring-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.whatsappTitle}>Send Payment Reminder</Text>
            <Text style={styles.whatsappSub}>Remind client via WhatsApp</Text>
          </View>
          <Icon name="chevron-right" size={22} color={ui.muted} />
        </TouchableOpacity>
      )}

      {/* Share PDF */}
      <TouchableOpacity
        style={styles.whatsappCard}
        onPress={() => generateAndSharePdf(true)}
        disabled={pdfLoading}
      >
        <View style={[styles.whatsappIcon, { backgroundColor: ui.purple }]}>
          <Icon name="file-pdf-box" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.whatsappTitle}>Share PDF via WhatsApp</Text>
          <Text style={styles.whatsappSub}>Send PDF attachment to client</Text>
        </View>
        <Icon name="chevron-right" size={22} color={ui.muted} />
      </TouchableOpacity>

      {/* Activity Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Activity</Text>
        {[
          invoice.createdAt && { icon: 'file-plus-outline', color: ui.purple, text: 'Invoice created', date: invoice.createdAt },
          invoice.sentAt && { icon: 'send-check', color: ui.blue, text: 'Sent to client via WhatsApp', date: invoice.sentAt },
          ...(invoice.payments || []).map((p: any) => ({
            icon: 'cash-check', color: ui.green,
            text: `Payment recorded — AED ${(p.amountPaid || p.amount || 0).toLocaleString()}${p.notes ? ` (${p.notes})` : ''}`,
            date: p.date || p.paymentDate,
          })),
          invoice.lastReminderAt && { icon: 'bell-ring-outline', color: '#f59e0b', text: `Reminder sent${invoice.reminderCount > 1 ? ` (${invoice.reminderCount}×)` : ''}`, date: invoice.lastReminderAt },
        ].filter(Boolean).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item: any, i: number) => (
          <View key={i} style={styles.timelineRow}>
            <View style={[styles.timelineDot, { backgroundColor: item.color }]}>
              <Icon name={item.icon} size={12} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineText}>{item.text}</Text>
              <Text style={styles.timelineDate}>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        ))}
        {invoice.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Edit / Delete */}
      <View style={styles.footerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('InvoiceForm', { invoice })}>
          <Text style={styles.editText}>Edit Invoice</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Record Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Text style={{ fontSize: 12, color: ui.muted, marginBottom: 12 }}>Balance: AED {balance.toLocaleString()}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount (AED)"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              placeholderTextColor={ui.muted}
            />
            <View style={styles.methodRow}>
              {['bank_transfer', 'cash', 'check'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodChip, paymentMethod === m && styles.methodChipActive]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text style={[styles.methodText, paymentMethod === m && { color: '#fff' }]}>
                    {m === 'bank_transfer' ? 'Bank' : m === 'cash' ? 'Cash' : 'Check'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="Note (optional)"
              value={paymentNote}
              onChangeText={setPaymentNote}
              multiline
              placeholderTextColor={ui.muted}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowPaymentModal(false)}>
                <Text style={{ color: ui.muted, fontFamily: fonts.semiBold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleRecordPayment}>
                <Text style={{ color: '#fff', fontFamily: fonts.semiBold }}>Save Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt sharing */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment receipt</Text>
            <Text style={{ fontSize: 12, color: ui.muted, marginBottom: 4 }}>
              {receipt?.receipt?.receiptNumber
                ? `${receipt.receipt.receiptNumber} · AED ${Number(receipt.receipt.amount || 0).toLocaleString()}`
                : 'Preparing receipt…'}
            </Text>
            {!!receipt?.clientPhone && (
              <Text style={{ fontSize: 12, color: ui.muted, marginBottom: 12 }}>
                Client: {receipt.clientPhone}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.receiptAction, { backgroundColor: '#25D366' }]}
              onPress={sendReceiptOnWhatsApp}
              disabled={!receipt?.whatsappUrl}
            >
              <Icon name="whatsapp" size={18} color="#fff" />
              <Text style={styles.receiptActionText}>Send on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.receiptAction, { backgroundColor: ui.purple }]}
              onPress={shareReceiptPdf}
              disabled={receiptLoading || !receipt?.html}
            >
              <Icon name="file-pdf-box" size={18} color="#fff" />
              <Text style={styles.receiptActionText}>
                {receiptLoading ? 'Preparing…' : 'Share PDF file'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.receiptHint}>
              WhatsApp sends a link to the receipt. Use “Share PDF file” to attach the
              PDF itself in WhatsApp, email, or anywhere else.
            </Text>

            <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
              <TouchableOpacity onPress={copyReceiptLink} disabled={!receipt?.publicUrl}>
                <Text style={styles.receiptLinkBtn}>Copy link</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={copyReceiptMessage} disabled={!receipt?.shareMessage}>
                <Text style={styles.receiptLinkBtn}>Copy message</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalCancel, { marginTop: 16 }]}
              onPress={() => setShowReceiptModal(false)}
            >
              <Text style={{ color: ui.muted, fontFamily: fonts.semiBold }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  invoiceCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: ui.cardBorder,
    marginHorizontal: 20, marginTop: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  billToLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: ui.muted, textTransform: 'uppercase', letterSpacing: 0.9 },
  clientName: { fontSize: 18, fontFamily: fonts.bold, color: ui.ink, marginTop: 4 },
  statusPill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillText: { fontSize: 12, fontFamily: fonts.semiBold },
  divider: { height: 1, backgroundColor: ui.cardBorder, marginVertical: 18 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: -16 },
  infoCell: { width: '50%', marginBottom: 16 },
  infoLabel: { fontSize: 11, textTransform: 'uppercase', color: ui.muted, letterSpacing: 0.6, fontFamily: fonts.medium },
  infoValue: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink, marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemDesc: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  itemMeta: { fontSize: 12, color: ui.muted, marginTop: 2, fontFamily: fonts.regular },
  itemAmount: { fontSize: 15, fontFamily: fonts.bold, color: ui.ink },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontFamily: fonts.bold, color: ui.ink },
  totalValue: { fontSize: 28, fontFamily: fonts.bold, color: ui.purple, letterSpacing: -0.5 },
  subTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subTotalText: { fontSize: 13, fontFamily: fonts.semiBold, textAlign: 'right' },
  actionsWrap: { paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1, padding: 14, borderRadius: 14, backgroundColor: ui.purple,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontFamily: fonts.semiBold },
  secondaryBtn: {
    flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#fff',
    borderWidth: 1, borderColor: ui.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryBtnText: { color: ui.ink, fontSize: 14, fontFamily: fonts.semiBold },
  markPaidBtn: {
    marginTop: 10, padding: 14, borderRadius: 14, backgroundColor: ui.greenTint,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  markPaidText: { color: ui.green, fontSize: 14, fontFamily: fonts.semiBold },
  whatsappCard: {
    marginTop: 14, marginHorizontal: 20, marginBottom: 20,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.cardBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  whatsappIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: ui.whatsapp,
    alignItems: 'center', justifyContent: 'center',
  },
  whatsappTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  whatsappSub: { fontSize: 12, color: ui.muted, fontFamily: fonts.regular, marginTop: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 10 },
  editText: { color: ui.purple, fontSize: 13, fontFamily: fonts.semiBold },
  deleteText: { color: ui.red, fontSize: 13, fontFamily: fonts.semiBold },
  recordPayBtn: {
    padding: 14, borderRadius: 14, backgroundColor: ui.purpleTint,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  timelineCard: {
    marginHorizontal: 20, marginTop: 14, backgroundColor: '#fff',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: ui.cardBorder,
  },
  timelineTitle: { fontSize: 14, fontFamily: fonts.bold, color: ui.ink, marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  timelineText: { fontSize: 13, fontFamily: fonts.medium, color: ui.ink },
  timelineDate: { fontSize: 11, color: ui.muted, fontFamily: fonts.regular, marginTop: 2 },
  notesBox: { marginTop: 8, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: ui.purple },
  notesLabel: { fontSize: 10, fontFamily: fonts.semiBold, color: ui.muted, textTransform: 'uppercase', marginBottom: 3 },
  notesText: { fontSize: 12, fontFamily: fonts.regular, color: ui.ink, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: ui.ink, marginBottom: 4 },
  modalInput: {
    borderWidth: 1, borderColor: ui.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: ui.ink, marginBottom: 10,
  },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  methodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: ui.border },
  methodChipActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  methodText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.ink },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: ui.purple },
  receiptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: ui.purple, borderRadius: 12, paddingVertical: 13, marginTop: 12,
  },
  receiptBtnText: { fontSize: 14, fontFamily: fonts.bold, color: '#fff' },
  receiptAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, marginTop: 10,
  },
  receiptActionText: { fontSize: 14, fontFamily: fonts.bold, color: '#fff' },
  receiptHint: { fontSize: 11, color: ui.muted, fontFamily: fonts.regular, marginTop: 12, lineHeight: 16 },
  receiptLinkBtn: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.purple },
});

export default InvoiceDetailScreen;
