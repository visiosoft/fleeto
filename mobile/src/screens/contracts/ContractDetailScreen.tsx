import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { contractService } from '../../services/contractService';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';
import { BRAND, brandCss, brandHeaderHtml, brandFooterHtml } from '../../utils/brandTemplate';

const fmtDate = (d: any) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const generateContractHtml = (contract: any) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; }
  ${brandCss}
  .body { padding: 30px 40px 16px; }
  .doc-title { font-size: 26px; font-weight: 800; color: #232B38; text-transform: uppercase; }
  .doc-num { font-size: 12px; color: #666; margin-top: 2px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; border-top: 2px solid #eee; padding-top: 8px; }
  .field { padding: 12px 0; border-bottom: 1px solid #eee; }
  .field .lbl { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .field .value { font-size: 14px; font-weight: 600; color: #222; margin-top: 3px; }
  .highlight { background: #F4F9FE; border: 1px solid #d8ecfb; border-radius: 8px; padding: 16px 20px; margin: 24px 0; display: flex; justify-content: space-between; }
  .highlight .h-item .lbl { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .highlight .h-item .value { font-size: 18px; font-weight: 800; color: #232B38; margin-top: 3px; }
  .sign-row { display: flex; justify-content: space-between; margin-top: 44px; gap: 60px; }
  .sign { flex: 1; border-top: 1.5px solid #333; padding-top: 8px; font-size: 11px; color: #666; text-align: center; }
</style></head><body>
  ${brandHeaderHtml}
  <div class="body">
    <div class="doc-title">Contract Agreement</div>
    <div class="doc-num">#${contract.contractNumber || contract._id || ''}</div>
    <div class="grid">
      <div class="field"><div class="lbl">Client</div><div class="value">${contract.companyName || contract.customerName || '—'}</div></div>
      <div class="field"><div class="lbl">Contact Person</div><div class="value">${contract.contactPerson || '—'}</div></div>
      <div class="field"><div class="lbl">Contract Type</div><div class="value">${contract.contractType || '—'}</div></div>
      <div class="field"><div class="lbl">Vehicle</div><div class="value">${contract.vehicleName || contract.vehiclePlate || contract.vehicleInfo || '—'}</div></div>
      <div class="field"><div class="lbl">Start Date</div><div class="value">${fmtDate(contract.startDate)}</div></div>
      <div class="field"><div class="lbl">End Date</div><div class="value">${fmtDate(contract.endDate)}</div></div>
      <div class="field"><div class="lbl">Payment Method</div><div class="value">${contract.paymentMethod || '—'}</div></div>
      <div class="field"><div class="lbl">Status</div><div class="value">${(contract.status || 'active').toUpperCase()}</div></div>
    </div>
    <div class="highlight">
      <div class="h-item"><div class="lbl">Monthly Rate</div><div class="value">AED ${Number(contract.monthlyRate || contract.amount || 0).toLocaleString()}</div></div>
      <div class="h-item"><div class="lbl">Total Contract Value</div><div class="value">AED ${Number(contract.totalValue || contract.value || 0).toLocaleString()}</div></div>
    </div>
    <div class="sign-row">
      <div class="sign">${BRAND.shortName} — Authorized Signature</div>
      <div class="sign">Client — Authorized Signature</div>
    </div>
  </div>
  ${brandFooterHtml}
</body></html>`;

const ContractDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [contract, setContract] = useState<any>(route.params.contract || null);
  const [loading, setLoading] = useState(!route.params.contract);
  const [pdfLoading, setPdfLoading] = useState(false);

  const generateAndSharePdf = async (share = false) => {
    if (!contract) return;
    setPdfLoading(true);
    let webWin: any = null;
    if (Platform.OS === 'web') webWin = window.open('', '_blank');
    try {
      const html = generateContractHtml(contract);
      if (Platform.OS === 'web') {
        if (!webWin) { window.alert('Please allow pop-ups to download the contract PDF.'); return; }
        webWin.document.write(html);
        webWin.document.close();
        webWin.focus();
        setTimeout(() => webWin.print(), 400);
      } else if (!share) {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Contract', UTI: 'com.adobe.pdf' });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (err: any) {
      if (webWin) { try { webWin.close(); } catch {} }
      if (Platform.OS === 'web') window.alert(err.message || 'Failed to generate PDF');
      else Alert.alert('Error', err.message || 'Failed to generate PDF');
    } finally { setPdfLoading(false); }
  };

  useEffect(() => {
    (async () => {
      try { const r = await contractService.getById(id); setContract(r.data?.data || r.data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = () => Alert.alert('Delete Contract', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await contractService.delete(id); navigation.goBack(); }
      catch { Alert.alert('Error', 'Failed to delete'); }
    }},
  ]);

  if (loading || !contract) return <LoadingScreen />;

  const rows = [
    { icon: 'pound', label: 'Contract #', value: contract.contractNumber },
    { icon: 'account-outline', label: 'Customer', value: contract.customerName },
    { icon: 'car-outline', label: 'Vehicle', value: contract.vehiclePlate || contract.vehicleInfo },
    { icon: 'calendar-start', label: 'Start Date', value: contract.startDate },
    { icon: 'calendar-end', label: 'End Date', value: contract.endDate },
    { icon: 'cash', label: 'Monthly Rate', value: contract.monthlyRate ? `AED ${contract.monthlyRate.toLocaleString()}` : null },
    { icon: 'cash-check', label: 'Total Value', value: contract.totalValue ? `AED ${contract.totalValue.toLocaleString()}` : null },
    { icon: 'credit-card-outline', label: 'Payment Method', value: contract.paymentMethod },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="file-document-outline" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>{contract.contractNumber || 'Contract'}</Text>
        {contract.monthlyRate && (
          <Text style={styles.headerAmount}>AED {contract.monthlyRate.toLocaleString()}/mo</Text>
        )}
        {contract.status && <StatusBadge status={contract.status} />}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => generateAndSharePdf(false)} disabled={pdfLoading}>
          <Icon name="file-pdf-box" size={18} color={colors.white} />
          <Text style={styles.editText}>{pdfLoading ? 'Wait...' : 'PDF'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => generateAndSharePdf(true)} disabled={pdfLoading}>
          <Icon name="share-variant-outline" size={18} color={colors.primary} />
          <Text style={[styles.deleteText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => navigation.navigate('ContractForm', { contract })}>
          <Icon name="pencil-outline" size={18} color={colors.info} />
          <Text style={[styles.deleteText, { color: colors.info }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.section}>Contract Details</Text>
        {rows.map((r, i) => (
          <View key={i} style={[styles.row, i < rows.length - 1 && styles.border]}>
            <View style={styles.left}>
              <Icon name={r.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.label}>{r.label}</Text>
            </View>
            <Text style={styles.val}>{r.value}</Text>
          </View>
        ))}
      </Card>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center', paddingVertical: spacing.xl, paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.xl, fontFamily: fonts.bold, color: colors.white },
  headerAmount: { fontSize: fontSize.lg, color: colors.accent, fontFamily: fonts.extraBold, marginTop: 4, marginBottom: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'center', padding: spacing.md, gap: spacing.sm, marginTop: -spacing.md },
  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, ...shadows.sm,
  },
  editText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.white, marginLeft: spacing.xs },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, ...shadows.sm,
  },
  deleteText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.error, marginLeft: spacing.xs },
  section: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  left: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: spacing.sm },
  val: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text, maxWidth: '50%', textAlign: 'right' },
});

export default ContractDetailScreen;
