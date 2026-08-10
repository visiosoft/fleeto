import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform, Linking, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { driverService, uploadDriverDocument } from '../../services/driverService';
import { payrollService } from '../../services/financeService';
import { buildDriverReportHtml } from '../../utils/driverReport';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';
import { ui } from '../../config/ui';
import api from '../../config/api';

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const docTypes = [
  { key: 'emirates_id', label: 'Emirates ID', icon: 'card-account-details-outline' },
  { key: 'license', label: 'Driving License', icon: 'card-bulleted-outline' },
  { key: 'passport', label: 'Passport', icon: 'passport' },
  { key: 'other', label: 'Other', icon: 'file-document-outline' },
];

// Last 12 months, newest first — the report month picker runs off this.
const buildMonthOptions = () => {
  const out: { key: string; label: string; month: number; year: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }
  return out;
};

const DriverDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [driver, setDriver] = useState<any>(route.params.driver || null);
  const [loading, setLoading] = useState(!route.params.driver);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  // Daily hours log
  const [hourEntries, setHourEntries] = useState<any[]>([]);
  const [monthHours, setMonthHours] = useState(0);
  const [showHourForm, setShowHourForm] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [hourForm, setHourForm] = useState({ date: todayStr, hours: '', note: '' });

  // Monthly report — its own month selection, independent of the section above
  const monthOptions = React.useMemo(buildMonthOptions, []);
  const [reportMonth, setReportMonth] = useState(monthOptions[0].key);
  const [reportBusy, setReportBusy] = useState<'pdf' | 'share' | null>(null);

  const fetchDriver = async () => {
    try {
      const res = await driverService.getById(id);
      setDriver(res.data?.data || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchDocuments = async () => {
    try {
      const res = await driverService.getDocuments(id);
      const docs = res.data?.documents || res.data?.data || res.data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) { console.log('Could not load documents:', err); }
  };

  const fetchHours = async () => {
    try {
      const now = new Date();
      const res = await driverService.getHours(id, { month: now.getMonth() + 1, year: now.getFullYear() });
      const payload = res.data?.data || res.data || {};
      setHourEntries(Array.isArray(payload.entries) ? payload.entries : []);
      setMonthHours(payload.totalHours || 0);
    } catch (err) { console.log('Could not load hours:', err); }
  };

  useEffect(() => { fetchDriver(); fetchDocuments(); fetchHours(); }, [id]);

  const saveHours = async () => {
    const hours = parseFloat(hourForm.hours);
    if (!hours || hours <= 0) { notify('Error', 'Enter the hours worked'); return; }
    setSavingHours(true);
    try {
      await driverService.addHours(id, {
        date: hourForm.date,
        hours,
        note: hourForm.note,
        driverName: driver?.name || [driver?.firstName, driver?.lastName].filter(Boolean).join(' '),
      });
      setHourForm({ date: todayStr, hours: '', note: '' });
      setShowHourForm(false);
      await fetchHours();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Could not save the hours');
    } finally { setSavingHours(false); }
  };

  const deleteHourEntry = (entry: any) => {
    const doDelete = async () => {
      try { await driverService.deleteHours(id, entry._id); fetchHours(); }
      catch { notify('Error', 'Could not delete the entry'); }
    };
    if (Platform.OS === 'web') { if ((window as any).confirm('Delete this entry?')) doDelete(); }
    else Alert.alert('Delete entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const exportReport = async (share: boolean) => {
    const opt = monthOptions.find(m => m.key === reportMonth) || monthOptions[0];
    // The pop-up must be opened synchronously from the tap or the browser blocks it.
    let webWin: any = null;
    if (Platform.OS === 'web') webWin = window.open('', '_blank');
    setReportBusy(share ? 'share' : 'pdf');
    try {
      const [hoursRes, payrollRes] = await Promise.all([
        driverService.getHours(id, { month: opt.month, year: opt.year }),
        payrollService.getAll().catch(() => null),
      ]);
      const hoursPayload = hoursRes.data?.data || hoursRes.data || {};
      const entries = Array.isArray(hoursPayload.entries) ? hoursPayload.entries : [];

      const payrollList = payrollRes?.data?.data || payrollRes?.data || [];
      const mm = String(opt.month).padStart(2, '0');
      const payroll = (Array.isArray(payrollList) ? payrollList : []).find((p: any) =>
        String(p?.driverId) === String(id)
        && String(p?.month).padStart(2, '0') === mm
        && Number(p?.year) === opt.year
      ) || null;

      const html = buildDriverReportHtml({
        driver,
        monthLabel: opt.label,
        hourEntries: entries,
        totalHours: hoursPayload.totalHours || 0,
        payroll,
      });

      if (Platform.OS === 'web') {
        if (!webWin) { (window as any).alert('Please allow pop-ups to export the report.'); return; }
        webWin.document.write(html);
        webWin.document.close();
        webWin.focus();
        setTimeout(() => webWin.print(), 400);
      } else if (!share) {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Send Driver Report',
            UTI: 'com.adobe.pdf',
          });
        }
      }
    } catch (err: any) {
      if (webWin) { try { webWin.close(); } catch {} }
      notify('Error', err.response?.data?.message || err.message || 'Could not build the report');
    } finally { setReportBusy(null); }
  };

  const sendFile = async (file: { uri: string; name: string }, type: string) => {
    const meta = docTypes.find(d => d.key === type);
    setUploadingType(type);
    setPickerFor(null);
    try {
      await uploadDriverDocument(id, file, type, meta?.label || 'Document');
      await fetchDocuments();
      notify('Uploaded', `${meta?.label} saved for ${driver?.name || 'this driver'}.`);
    } catch (err: any) {
      notify('Upload failed', err.response?.data?.message || err.message || 'Could not upload the file');
    } finally { setUploadingType(null); }
  };

  const pickImage = async (type: string, fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { notify('Camera', 'Camera permission is required.'); return; }
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.75 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 });
      if (!result.canceled && result.assets?.[0]) {
        const a = result.assets[0];
        await sendFile({ uri: a.uri, name: a.fileName || `${type}-${Date.now()}.jpg` }, type);
      }
    } catch { notify('Error', 'Could not open the picker'); }
  };

  const pickPdf = async (type: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const a: any = result.assets[0];
        await sendFile({ uri: a.uri, name: a.name || `${type}-${Date.now()}.pdf` }, type);
      }
    } catch { notify('Error', 'Could not open the file picker'); }
  };

  const openDocument = (doc: any) => {
    const base = String((api.defaults.baseURL || '').replace(/\/api$/, ''));
    const url = doc.url?.startsWith('http') ? doc.url : `${base}${doc.url}`;
    Linking.openURL(url).catch(() => notify('Error', 'Could not open this document'));
  };

  const removeDocument = (doc: any) => {
    const doDelete = async () => {
      try { await driverService.deleteDocument(id, doc._id); fetchDocuments(); }
      catch { notify('Error', 'Could not delete the document'); }
    };
    if (Platform.OS === 'web') { if ((window as any).confirm('Delete this document?')) doDelete(); }
    else Alert.alert('Delete document', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Driver', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await driverService.delete(id); navigation.goBack(); }
        catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!driver) return <LoadingScreen message="Driver not found" />;

  // Contact details are nested by the API; older records kept them flat.
  const fmtDay = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const money = (n: any) => (n === undefined || n === null || n === '' ? '' : `AED ${Number(n).toLocaleString()}`);

  const displayName = driver.name
    || [driver.firstName, driver.lastName].filter(Boolean).join(' ')
    || 'Driver';

  const emergency = driver.emergencyContact;
  const emergencyText = typeof emergency === 'string'
    ? emergency
    : [emergency?.name, emergency?.phone].filter(Boolean).join(' · ');

  const infoRows = [
    { icon: 'phone-outline', label: 'Phone', value: driver.contact?.phone || driver.phone },
    { icon: 'email-outline', label: 'Email', value: driver.contact?.email || driver.email },
    { icon: 'card-account-details-outline', label: 'License Number', value: driver.licenseNumber },
    { icon: 'calendar-clock-outline', label: 'License Expiry', value: fmtDay(driver.licenseExpiry) },
    { icon: 'map-marker-outline', label: 'Address', value: driver.contact?.address || driver.address },
    { icon: 'badge-account-outline', label: 'Employee ID', value: driver.employeeId },
    { icon: 'cash', label: 'Monthly Salary', value: money(driver.salary) },
    { icon: 'clock-outline', label: 'Overtime Rate', value: driver.overtimeRate ? `${money(driver.overtimeRate)} / hour` : '' },
    { icon: 'account-alert-outline', label: 'Emergency Contact', value: emergencyText },
    { icon: 'briefcase-outline', label: 'Hire Date', value: fmtDay(driver.hireDate || driver.joinDate) },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={fetchDriver} />}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(displayName || 'D')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {!!(driver.contact?.phone || driver.phone) && (
          <Text style={styles.sub}>{driver.contact?.phone || driver.phone}</Text>
        )}
        {driver.status && <StatusBadge status={driver.status} />}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('DriverForm', { driver })}>
          <Icon name="pencil-outline" size={18} color={colors.white} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Driver Information</Text>
        {infoRows.map((row, i) => (
          <View key={i} style={[styles.infoRow, i < infoRows.length - 1 && styles.border]}>
            <View style={styles.infoLeft}>
              <Icon name={row.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>{row.label}</Text>
            </View>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </Card>

      {/* Daily hours worked */}
      <Card style={{ marginHorizontal: spacing.md }}>
        <View style={styles.hoursHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Hours Worked</Text>
          <TouchableOpacity
            style={styles.logBtn}
            onPress={() => setShowHourForm(s => !s)}
            activeOpacity={0.8}
          >
            <Icon name={showHourForm ? 'close' : 'plus'} size={14} color="#FFFFFF" />
            <Text style={styles.logBtnText}>{showHourForm ? 'Cancel' : 'Log hours'}</Text>
          </TouchableOpacity>
        </View>

        {/* This month's running total */}
        <View style={styles.hoursTotalCard}>
          <View>
            <Text style={styles.hoursTotalLabel}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <Text style={styles.hoursTotalValue}>{monthHours} hours</Text>
          </View>
          {!!driver.overtimeRate && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.hoursTotalLabel}>At AED {driver.overtimeRate}/h</Text>
              <Text style={styles.hoursTotalPay}>
                AED {(monthHours * Number(driver.overtimeRate || 0)).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {showHourForm && (
          <View style={styles.hourForm}>
            <View style={styles.hourFormRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hourFieldLabel}>Date</Text>
                <TextInput
                  style={styles.hourInput}
                  value={hourForm.date}
                  onChangeText={v => setHourForm(p => ({ ...p, date: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={ui.muted}
                />
              </View>
              <View style={{ width: 96 }}>
                <Text style={styles.hourFieldLabel}>Hours</Text>
                <TextInput
                  style={[styles.hourInput, styles.hourInputBig]}
                  value={hourForm.hours}
                  onChangeText={v => setHourForm(p => ({ ...p, hours: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={ui.muted}
                />
              </View>
            </View>

            {/* Quick picks for the common answers */}
            <View style={styles.quickRow}>
              {[2, 4, 5, 7, 8, 10].map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.quickPill, hourForm.hours === String(h) && styles.quickPillActive]}
                  onPress={() => setHourForm(p => ({ ...p, hours: String(h) }))}
                >
                  <Text style={[styles.quickText, hourForm.hours === String(h) && styles.quickTextActive]}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.hourFieldLabel}>Note (optional)</Text>
            <TextInput
              style={styles.hourInput}
              value={hourForm.note}
              onChangeText={v => setHourForm(p => ({ ...p, note: v }))}
              placeholder="e.g. Airport run, extra shift"
              placeholderTextColor={ui.muted}
            />

            <TouchableOpacity
              style={[styles.hourSaveBtn, savingHours && { opacity: 0.7 }]}
              onPress={saveHours}
              disabled={savingHours}
            >
              <Text style={styles.hourSaveText}>{savingHours ? 'Saving…' : 'Save hours'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {hourEntries.length === 0 ? (
          <Text style={styles.emptyDocs}>No hours logged this month.</Text>
        ) : (
          hourEntries.map((e: any, i: number) => (
            <View key={e._id || i} style={styles.hourRow}>
              <View style={styles.hourDayBox}>
                <Text style={styles.hourDayNum}>{new Date(e.date).getDate()}</Text>
                <Text style={styles.hourDayMon}>
                  {new Date(e.date).toLocaleDateString('en-GB', { month: 'short' })}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hourAmount}>{e.hours} hours</Text>
                {!!e.note && <Text style={styles.docSub} numberOfLines={1}>{e.note}</Text>}
              </View>
              <TouchableOpacity onPress={() => deleteHourEntry(e)} style={{ padding: 4 }}>
                <Icon name="delete-outline" size={16} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>

      {/* Monthly salary report */}
      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Monthly Report</Text>
        <Text style={styles.reportHint}>
          Pick a month to build a branded salary report with the hours logged, overtime, advances and payments.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthRow}
          style={styles.monthScroll}
        >
          {monthOptions.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.monthPill, reportMonth === m.key && styles.monthPillActive]}
              onPress={() => setReportMonth(m.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.monthPillText, reportMonth === m.key && styles.monthPillTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.reportActions}>
          <TouchableOpacity
            style={[styles.reportBtn, !!reportBusy && { opacity: 0.7 }]}
            onPress={() => exportReport(false)}
            disabled={!!reportBusy}
            activeOpacity={0.85}
          >
            <Icon name="file-pdf-box" size={17} color="#FFFFFF" />
            <Text style={styles.reportBtnText}>{reportBusy === 'pdf' ? 'Preparing…' : 'Export PDF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportBtnAlt, !!reportBusy && { opacity: 0.7 }]}
            onPress={() => exportReport(true)}
            disabled={!!reportBusy}
            activeOpacity={0.85}
          >
            <Icon name="share-variant-outline" size={16} color={ui.purple} />
            <Text style={styles.reportBtnAltText}>{reportBusy === 'share' ? 'Preparing…' : 'Share'}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Documents */}
      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Documents</Text>

        {documents.length === 0 ? (
          <Text style={styles.emptyDocs}>No documents uploaded yet.</Text>
        ) : (
          documents.map((doc: any, i: number) => {
            const meta = docTypes.find(d => d.key === doc.type) || docTypes[3];
            const isPdf = /\.pdf$/i.test(doc.url || doc.title || '');
            return (
              <View key={doc._id || i} style={styles.docRow}>
                <View style={[styles.docIcon, { backgroundColor: isPdf ? '#fdecea' : ui.lilac }]}>
                  <Icon name={isPdf ? 'file-pdf-box' : (meta.icon as any)} size={19} color={isPdf ? '#c0392b' : ui.purple} />
                </View>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => openDocument(doc)} activeOpacity={0.7}>
                  <Text style={styles.docTitle} numberOfLines={1}>{doc.title || meta.label}</Text>
                  <Text style={styles.docSub} numberOfLines={1}>
                    {meta.label}
                    {doc.uploadDate ? ` • ${new Date(doc.uploadDate).toLocaleDateString('en-GB')}` : ''}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeDocument(doc)} style={{ padding: 4 }}>
                  <Icon name="delete-outline" size={17} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Upload buttons, one per document type */}
        <View style={styles.uploadGrid}>
          {docTypes.map(d => (
            <TouchableOpacity
              key={d.key}
              style={[styles.uploadTile, pickerFor === d.key && styles.uploadTileActive]}
              onPress={() => setPickerFor(pickerFor === d.key ? null : d.key)}
              disabled={!!uploadingType}
              activeOpacity={0.8}
            >
              <Icon
                name={(uploadingType === d.key ? 'progress-upload' : d.icon) as any}
                size={19}
                color={ui.purple}
              />
              <Text style={styles.uploadTileText}>
                {uploadingType === d.key ? 'Uploading…' : d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Source choice for the selected document type */}
        {!!pickerFor && (
          <View style={styles.sourceRow}>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.sourceBtn} onPress={() => pickImage(pickerFor, true)}>
                <Icon name="camera-outline" size={16} color={ui.purple} />
                <Text style={styles.sourceText}>Camera</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.sourceBtn} onPress={() => pickImage(pickerFor, false)}>
              <Icon name="image-outline" size={16} color={ui.purple} />
              <Text style={styles.sourceText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sourceBtn} onPress={() => pickPdf(pickerFor)}>
              <Icon name="file-pdf-box" size={16} color={ui.purple} />
              <Text style={styles.sourceText}>PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  hoursHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: ui.purple, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7,
  },
  logBtnText: { fontSize: 12, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  hoursTotalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: ui.ink, borderRadius: 12, padding: 14, marginBottom: spacing.sm,
  },
  hoursTotalLabel: { fontSize: 11, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.65)' },
  hoursTotalValue: { fontSize: 22, fontFamily: fonts.bold, color: '#FFFFFF', marginTop: 2 },
  hoursTotalPay: { fontSize: 16, fontFamily: fonts.bold, color: '#4ade80', marginTop: 2 },
  hourForm: {
    backgroundColor: ui.bg, borderRadius: 12, padding: 12, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  hourFormRow: { flexDirection: 'row', gap: 10 },
  hourFieldLabel: { fontSize: 11, fontFamily: fonts.semiBold, color: ui.muted, marginBottom: 4, marginTop: 8 },
  hourInput: {
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontFamily: fonts.medium, color: ui.ink,
    borderWidth: 1, borderColor: ui.border,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  hourInputBig: { fontSize: 20, fontFamily: fonts.bold, textAlign: 'center' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  quickPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  quickPillActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  quickText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.ink },
  quickTextActive: { color: '#FFFFFF' },
  hourSaveBtn: {
    marginTop: 12, backgroundColor: ui.purple, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  hourSaveText: { fontSize: 14, fontFamily: fonts.bold, color: '#FFFFFF' },
  hourRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  hourDayBox: {
    width: 42, height: 42, borderRadius: 11, backgroundColor: ui.lilac,
    justifyContent: 'center', alignItems: 'center',
  },
  hourDayNum: { fontSize: 15, fontFamily: fonts.bold, color: ui.purple, lineHeight: 17 },
  hourDayMon: { fontSize: 9, fontFamily: fonts.medium, color: ui.purple, textTransform: 'uppercase' },
  hourAmount: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  reportHint: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, lineHeight: 17, marginBottom: 10 },
  // Pills size themselves; a fixed height on the row clips them on Android.
  monthScroll: { minHeight: 40 },
  monthRow: { flexDirection: 'row', gap: 6, paddingRight: 4, alignItems: 'center' },
  monthPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  monthPillActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  monthPillText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.ink },
  monthPillTextActive: { color: '#FFFFFF' },
  reportActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  reportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: ui.purple, borderRadius: 12, paddingVertical: 12,
  },
  reportBtnText: { fontSize: 13, fontFamily: fonts.bold, color: '#FFFFFF' },
  reportBtnAlt: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: ui.border,
  },
  reportBtnAltText: { fontSize: 13, fontFamily: fonts.bold, color: ui.purple },
  emptyDocs: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, paddingVertical: spacing.sm },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  docIcon: { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  docTitle: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text },
  docSub: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  uploadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  uploadTile: {
    width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(91,43,201,0.2)',
  },
  uploadTileActive: { borderStyle: 'solid', borderColor: ui.purple, backgroundColor: ui.lilac },
  uploadTileText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple, flexShrink: 1 },
  sourceRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  sourceBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 99, backgroundColor: ui.lilac,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.15)',
  },
  sourceText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center', paddingVertical: spacing.xl, paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 32, fontFamily: fonts.bold, color: colors.white },
  name: { fontSize: fontSize.xl, fontFamily: fonts.bold, color: colors.white },
  sub: { fontSize: fontSize.md, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: spacing.sm },
  actions: {
    flexDirection: 'row', justifyContent: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md,
    gap: spacing.sm,
  },
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
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: spacing.sm },
  infoValue: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text, maxWidth: '50%', textAlign: 'right' },
});

export default DriverDetailScreen;
