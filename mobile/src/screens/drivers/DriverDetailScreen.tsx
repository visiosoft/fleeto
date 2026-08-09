import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform, Linking } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { driverService, uploadDriverDocument } from '../../services/driverService';
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

const DriverDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [driver, setDriver] = useState<any>(route.params.driver || null);
  const [loading, setLoading] = useState(!route.params.driver);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

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

  useEffect(() => { fetchDriver(); fetchDocuments(); }, [id]);

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

  const infoRows = [
    { icon: 'phone-outline', label: 'Phone', value: driver.phone },
    { icon: 'email-outline', label: 'Email', value: driver.email },
    { icon: 'card-account-details-outline', label: 'License Number', value: driver.licenseNumber },
    { icon: 'calendar-clock-outline', label: 'License Expiry', value: driver.licenseExpiry },
    { icon: 'map-marker-outline', label: 'Address', value: driver.address },
    { icon: 'account-alert-outline', label: 'Emergency Contact', value: driver.emergencyContact },
    { icon: 'calendar-outline', label: 'Date of Birth', value: driver.dateOfBirth },
    { icon: 'briefcase-outline', label: 'Join Date', value: driver.joinDate },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={fetchDriver} />}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(driver.name || 'D')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{driver.name}</Text>
        {driver.phone && <Text style={styles.sub}>{driver.phone}</Text>}
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
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: spacing.sm },
  infoValue: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text, maxWidth: '50%', textAlign: 'right' },
});

export default DriverDetailScreen;
