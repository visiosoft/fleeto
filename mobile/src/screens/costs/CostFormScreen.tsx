import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { costService } from '../../services/financeService';
import {
  GOOGLE_CLIENT_ID, DRIVE_SCOPES,
  saveDriveToken, getStoredDriveToken, uploadReceiptToDrive,
} from '../../services/googleDrive';
import { vehicleService } from '../../services/vehicleService';
import { contractService } from '../../services/contractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';

// API enum: fuel, maintenance, insurance, registration, tires, repairs, salary,
// benefits, training, uniform, accommodation, food, office, administrative, marketing, other.
// UI categories map onto allowed values; the UI key is also sent as `category`.
const categories = [
  { key: 'fuel', value: 'fuel', label: 'Fuel', icon: 'gas-station-outline' },
  { key: 'salik', value: 'other', label: 'Salik', icon: 'road-variant', prefix: '[Salik]' },
  { key: 'maintenance', value: 'maintenance', label: 'Maintenance', icon: 'wrench-outline' },
  { key: 'parking', value: 'other', label: 'Parking', icon: 'parking', prefix: '[Parking]' },
  { key: 'fine', value: 'other', label: 'Fines', icon: 'map-marker-alert-outline', prefix: '[Fine]' },
  { key: 'other', value: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

WebBrowser.maybeCompleteAuthSession();

const CostFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.cost;
  const isEdit = !!existing;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ uri: string; name: string } | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);

  const [, googleResponse, promptGoogleAuth] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    scopes: DRIVE_SCOPES,
  });

  useEffect(() => { getStoredDriveToken().then(setDriveToken); }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.authentication?.accessToken) {
      const { accessToken, expiresIn } = googleResponse.authentication as any;
      setDriveToken(accessToken);
      saveDriveToken(accessToken, Number(expiresIn) || undefined);
    }
  }, [googleResponse]);

  const initialCategory =
    categories.find(c => c.key === existing?.category)?.key ||
    categories.find(c => c.value === (existing?.expenseType || existing?.category))?.key ||
    'other';

  const [form, setForm] = useState({
    description: existing?.description || '',
    amount: existing?.amount?.toString() || '',
    category: initialCategory,
    date: existing?.date || new Date().toISOString().split('T')[0],
    vehicleId: existing?.vehicleId || '',
    contractId: existing?.contractId || '',
    driverId: existing?.driverId || '',
    paymentMethod: existing?.paymentMethod || 'cash',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [vRes, cRes] = await Promise.allSettled([vehicleService.getAll(), contractService.getAll()]);
      if (vRes.status === 'fulfilled') setVehicles(vRes.value.data?.data || vRes.value.data || []);
      if (cRes.status === 'fulfilled') setContracts(cRes.value.data?.data || cRes.value.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingVehicles(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const vehicleLabel = (v: any) => v?.plateNumber || v?.licensePlate || v?.name || v?.vehicleName || 'Vehicle';
  const contractLabel = (c: any) =>
    c?.contractNumber || c?.clientName || c?.name || c?.title || 'Contract';

  const selectedVehicle = vehicles.find((v: any) => v._id === form.vehicleId);
  const selectedContract = contracts.find((c: any) => c._id === form.contractId);
  const selectedCategory = categories.find(c => c.key === form.category) || categories[5];

  const pickReceipt = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setReceipt({ uri: asset.uri, name: asset.fileName || 'receipt.jpg' });
      }
    } catch (e) {
      notify('Error', 'Could not open image picker');
    }
  };

  const submit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { notify('Error', 'Valid amount is required'); return; }
    if (!form.vehicleId) { notify('Error', 'Please select a vehicle'); return; }

    // API requires a description; use notes if given, else derive from category.
    let description = form.notes.trim() || form.description.trim() || `${selectedCategory.label} expense`;
    if (selectedCategory.prefix && !description.startsWith(selectedCategory.prefix)) {
      description = `${selectedCategory.prefix} ${description}`;
    }

    setLoading(true);
    try {
      // Upload receipt to Google Drive: Fleeto/<vehicle plate>/<image>
      let receiptUrl: string | undefined;
      if (receipt && driveToken) {
        try {
          const folder = selectedVehicle ? vehicleLabel(selectedVehicle) : 'Unassigned';
          const filename = `receipt_${form.date}_${Date.now()}.${(receipt.name.split('.').pop() || 'jpg')}`;
          receiptUrl = await uploadReceiptToDrive(driveToken, folder, receipt.uri, filename);
        } catch (upErr: any) {
          console.error('Drive upload failed:', upErr);
          notify('Google Drive', 'Receipt upload failed — the expense will be saved without it. ' + (upErr.message || ''));
        }
      }

      const payload = {
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        contractId: form.contractId || undefined,
        expenseType: selectedCategory.value,
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        description,
        notes: receiptUrl ? `${form.notes ? form.notes + '\n' : ''}Receipt: ${receiptUrl}` : form.notes,
        receiptUrl,
        paymentMethod: form.paymentMethod,
      };
      if (isEdit) await costService.update(existing._id, payload);
      else await costService.create(payload);
      navigation.goBack();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.errors?.join(', ') || e.message || 'Failed to save';
      notify('Error', msg);
    }
    finally { setLoading(false); }
  };

  if (loadingVehicles) return <LoadingScreen message="Loading..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Category */}
      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map(c => {
          const active = form.category === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.categoryCard, active && styles.categoryCardActive]}
              onPress={() => setForm(p => ({ ...p, category: c.key }))}
              activeOpacity={0.8}
            >
              <Icon name={c.icon as any} size={20} color={active ? '#FFFFFF' : ui.muted} />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Amount */}
      <Text style={styles.sectionLabel}>Amount (AED)</Text>
      <View style={styles.amountCard}>
        <Text style={styles.amountCurrency}>AED</Text>
        <TextInput
          style={styles.amountInput}
          value={form.amount}
          onChangeText={v => setForm(p => ({ ...p, amount: v }))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={ui.muted}
        />
      </View>

      {/* Vehicle */}
      <Text style={styles.sectionLabel}>Vehicle</Text>
      <TouchableOpacity
        style={styles.selectorCard}
        onPress={() => { setVehicleOpen(o => !o); setContractOpen(false); }}
        activeOpacity={0.8}
      >
        <View style={styles.selectorIconBox}>
          <Icon name="van-utility" size={16} color={ui.purple} />
        </View>
        <Text style={[styles.selectorText, !selectedVehicle && { color: ui.muted }]}>
          {selectedVehicle ? vehicleLabel(selectedVehicle) : 'Select vehicle...'}
        </Text>
        <Icon name={vehicleOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
      </TouchableOpacity>
      {vehicleOpen && (
        <View style={styles.dropdown}>
          {vehicles.map((v: any, i: number) => (
            <TouchableOpacity
              key={v._id}
              style={[styles.dropdownItem, i === vehicles.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => { setForm(p => ({ ...p, vehicleId: v._id })); setVehicleOpen(false); }}
            >
              <Text style={[styles.dropdownText, form.vehicleId === v._id && styles.dropdownTextActive]}>
                {vehicleLabel(v)}
              </Text>
            </TouchableOpacity>
          ))}
          {vehicles.length === 0 && <Text style={[styles.dropdownItem, styles.dropdownText, { color: ui.muted }]}>No vehicles found</Text>}
        </View>
      )}

      {/* Contract */}
      <Text style={styles.sectionLabel}>
        Contract <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TouchableOpacity
        style={styles.selectorCard}
        onPress={() => { setContractOpen(o => !o); setVehicleOpen(false); }}
        activeOpacity={0.8}
      >
        <View style={styles.selectorIconBox}>
          <Icon name="file-document-outline" size={16} color={ui.purple} />
        </View>
        <Text style={[styles.selectorText, !selectedContract && { color: ui.muted }]}>
          {selectedContract ? contractLabel(selectedContract) : 'Select contract...'}
        </Text>
        <Icon name={contractOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
      </TouchableOpacity>
      {contractOpen && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => { setForm(p => ({ ...p, contractId: '' })); setContractOpen(false); }}
          >
            <Text style={[styles.dropdownText, { color: ui.muted }]}>None</Text>
          </TouchableOpacity>
          {contracts.map((c: any, i: number) => (
            <TouchableOpacity
              key={c._id}
              style={[styles.dropdownItem, i === contracts.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => { setForm(p => ({ ...p, contractId: c._id })); setContractOpen(false); }}
            >
              <Text style={[styles.dropdownText, form.contractId === c._id && styles.dropdownTextActive]}>
                {contractLabel(c)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Receipt photo */}
      <Text style={styles.sectionLabel}>
        Receipt Photo <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickReceipt} activeOpacity={0.8}>
        {receipt ? (
          <>
            <Image source={{ uri: receipt.uri }} style={styles.receiptThumb} />
            <Text style={styles.uploadTitle} numberOfLines={1}>{receipt.name}</Text>
            <Text style={styles.uploadHint}>Tap to change</Text>
          </>
        ) : (
          <>
            <View style={styles.uploadIconBox}>
              <Icon name="camera-outline" size={24} color={ui.purple} />
            </View>
            <Text style={styles.uploadTitle}>Take Photo or Upload</Text>
            <Text style={styles.uploadHint}>Snap a receipt or choose from gallery</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Google Drive connection status */}
      {receipt && (
        driveToken ? (
          <View style={styles.driveRow}>
            <Icon name="google-drive" size={16} color="#16a34a" />
            <Text style={styles.driveConnectedText}>
              Google Drive connected — will save to Fleeto/{selectedVehicle ? vehicleLabel(selectedVehicle) : '…'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.driveBtn} onPress={() => promptGoogleAuth()}>
            <Icon name="google-drive" size={16} color="#FFFFFF" />
            <Text style={styles.driveBtnText}>Connect Google Drive to upload receipt</Text>
          </TouchableOpacity>
        )
      )}

      {/* Notes */}
      <Text style={styles.sectionLabel}>
        Notes <Text style={styles.optional}>(optional)</Text>
      </Text>
      <View style={styles.notesCard}>
        <TextInput
          style={styles.notesInput}
          value={form.notes}
          onChangeText={v => setForm(p => ({ ...p, notes: v }))}
          placeholder="Full tank refill at ENOC Al Quoz"
          placeholderTextColor={ui.muted}
          multiline
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={submit}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>
          {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Submit Expense'}
        </Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl * 2 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  content: { padding: 20 },
  sectionLabel: {
    fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink,
    marginBottom: 10, marginTop: 20,
  },
  optional: { fontFamily: fonts.regular, color: ui.muted },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: {
    width: '31%', flexGrow: 1,
    paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  categoryCardActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  categoryLabel: { fontSize: 12, fontFamily: fonts.medium, color: ui.ink },
  categoryLabelActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },

  amountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.3)',
  },
  amountCurrency: { fontSize: 16, fontFamily: fonts.medium, color: ui.muted, marginRight: 8 },
  amountInput: {
    flex: 1, fontSize: 32, fontFamily: fonts.bold, color: ui.ink,
    padding: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  selectorCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  selectorIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: ui.lilacDark,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  selectorText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  dropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 6,
    borderWidth: 1, borderColor: ui.border, overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border,
  },
  dropdownText: { fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  dropdownTextActive: { color: ui.purple, fontFamily: fonts.semiBold },

  uploadBox: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(91,43,201,0.2)',
    padding: 28, alignItems: 'center',
  },
  uploadIconBox: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: ui.lilac,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  receiptThumb: { width: 64, height: 64, borderRadius: 12, marginBottom: 10 },
  uploadTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.purple },
  uploadHint: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 4 },

  driveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, paddingHorizontal: 4,
  },
  driveConnectedText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: '#16a34a' },
  driveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 10, backgroundColor: '#1a73e8', borderRadius: 12, padding: 12,
  },
  driveBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: '#FFFFFF' },

  notesCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  notesInput: {
    minHeight: 60, fontSize: 14, fontFamily: fonts.regular, color: ui.ink,
    textAlignVertical: 'top', padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  submitBtn: {
    marginTop: 28, backgroundColor: ui.purple, borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
});

export default CostFormScreen;
