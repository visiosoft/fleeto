import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, Modal, FlatList, Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { invoiceService } from '../../services/financeService';
import { contractService } from '../../services/contractService';
import FormInput from '../../components/common/FormInput';
import DatePickerField from '../../components/common/DatePickerField';
import Card from '../../components/common/Card';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const formatDate = (d: any) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toISOString().split('T')[0];
};

const daysUntil = (d: any) => {
  if (!d) return null;
  const end = new Date(d);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const InvoiceFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.invoice;
  const preselectedContract = route.params?.contract;
  const preselectedContractId = route.params?.contractId;
  const isEdit = !!existing;

  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(preselectedContract || null);
  const [showContractPicker, setShowContractPicker] = useState(false);
  const [contractSearch, setContractSearch] = useState('');
  const [loadingContracts, setLoadingContracts] = useState(true);

  const [invoiceNumber, setInvoiceNumber] = useState(existing?.invoiceNumber || '');
  const [issueDate, setIssueDate] = useState(existing?.issueDate ? formatDate(existing.issueDate) : formatDate(new Date()));
  const [dueDate, setDueDate] = useState(existing?.dueDate ? formatDate(existing.dueDate) : '');
  const [includeVat, setIncludeVat] = useState(existing?.includeVat === true);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [items, setItems] = useState<any[]>(
    existing?.items?.length ? existing.items : [{ description: '', quantity: '1', unitPrice: '', amount: '' }]
  );
  const [loading, setLoading] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await contractService.getAll();
      const data = res.data?.data || res.data || [];
      setContracts(data);
      if (preselectedContractId && !preselectedContract) {
        const match = data.find((c: any) => c._id === preselectedContractId);
        if (match) setSelectedContract(match);
      } else if (existing?.contractId && !preselectedContract) {
        const match = data.find((c: any) => c._id === existing.contractId || c._id === existing.contractId?.toString());
        if (match) setSelectedContract(match);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingContracts(false); }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  useEffect(() => {
    if (!isEdit && !invoiceNumber) {
      const num = `INV-${Date.now().toString().slice(-6)}`;
      setInvoiceNumber(num);
    }
  }, []);

  useEffect(() => {
    if (selectedContract && !isEdit) {
      // Calculate billing month based on contract start day
      const start = new Date(selectedContract.startDate);
      const now = new Date();
      const startDay = start.getDate();
      // Current billing period: from startDay of current month to startDay of next month
      const billingStart = new Date(now.getFullYear(), now.getMonth(), startDay);
      const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, startDay - 1);

      // Due date = billing period end + 2 days
      const due = new Date(billingEnd);
      due.setDate(due.getDate() + 2);
      setDueDate(formatDate(due));

      const contractValue = selectedContract.amount || selectedContract.value || 0;
      if (contractValue > 0) {
        // Billing month label = the month the period ends in
        const monthLabel = billingEnd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const contractDesc = [
          selectedContract.contractType || 'Monthly',
          selectedContract.companyName ? `(${selectedContract.companyName})` : '',
          selectedContract.vehicleName ? `- ${selectedContract.vehicleName}` : '',
          `- ${monthLabel}`,
        ].filter(Boolean).join(' ');
        setItems([{
          description: contractDesc,
          quantity: '1',
          unitPrice: String(contractValue),
          amount: String(contractValue),
        }]);
      }
    }
  }, [selectedContract]);

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].amount = (qty * price).toFixed(2);
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', quantity: '1', unitPrice: '', amount: '' }]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const tax = includeVat ? subtotal * 0.05 : 0;
  const total = subtotal + tax;

  const filteredContracts = contracts.filter(c => {
    if (!contractSearch.trim()) return true;
    const q = contractSearch.toLowerCase();
    return c.companyName?.toLowerCase().includes(q) || c.contractNumber?.toLowerCase().includes(q) ||
      c.tradeLicenseNo?.toLowerCase().includes(q) || c.vehicleName?.toLowerCase().includes(q);
  });

  const submit = async () => {
    if (!selectedContract) { Alert.alert('Error', 'Please select a contract'); return; }
    if (!invoiceNumber.trim()) { Alert.alert('Error', 'Invoice number is required'); return; }
    const validItems = items.filter(i => i.description.trim() && parseFloat(i.amount) > 0);
    if (validItems.length === 0) { Alert.alert('Error', 'Add at least one line item'); return; }

    setLoading(true);
    try {
      const payload = {
        contractId: selectedContract._id,
        invoiceNumber: invoiceNumber.trim(),
        issueDate,
        dueDate,
        includeVat,
        notes,
        items: validItems.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unitPrice: parseFloat(i.unitPrice) || 0,
          amount: parseFloat(i.amount) || 0,
        })),
      };
      if (isEdit) {
        await invoiceService.update(existing._id, payload);
      } else {
        await invoiceService.create(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to save';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  if (loadingContracts) return <LoadingScreen message="Loading contracts..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Contract Picker */}
      <Text style={styles.sectionLabel}>SELECT CONTRACT</Text>
      <TouchableOpacity style={styles.contractPicker} onPress={() => setShowContractPicker(true)}>
        {selectedContract ? (
          <View style={styles.selectedContract}>
            <View style={styles.contractIcon}>
              <Icon name="file-document-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contractName}>{selectedContract.companyName}</Text>
              <Text style={styles.contractMeta}>
                {selectedContract.vehicleName || ''} · Ends: {formatDate(selectedContract.endDate)}
              </Text>
              {(() => {
                const days = daysUntil(selectedContract.endDate);
                if (days === null) return null;
                const isExpired = days < 0;
                return (
                  <View style={[styles.dateBadge, { backgroundColor: isExpired ? colors.errorLight : days < 30 ? colors.warningLight : colors.successLight }]}>
                    <Text style={[styles.dateBadgeText, { color: isExpired ? colors.error : days < 30 ? '#92400E' : colors.success }]}>
                      {isExpired ? `Expired ${Math.abs(days)}d ago` : `${days} days remaining`}
                    </Text>
                  </View>
                );
              })()}
            </View>
            <Icon name="chevron-down" size={20} color={colors.textLight} />
          </View>
        ) : (
          <View style={styles.contractPlaceholder}>
            <Icon name="plus-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.contractPlaceholderText}>Select a contract</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Contract Amount Info */}
      {selectedContract && (
        <View style={styles.contractInfo}>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipLabel}>Contract Value</Text>
            <Text style={styles.infoChipValue}>AED {(selectedContract.amount || selectedContract.value || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipLabel}>Status</Text>
            <Text style={[styles.infoChipValue, { color: selectedContract.status === 'Active' ? colors.success : colors.accent }]}>
              {selectedContract.status}
            </Text>
          </View>
        </View>
      )}

      {/* Invoice Details */}
      <Text style={styles.sectionLabel}>INVOICE DETAILS</Text>
      <FormInput label="Invoice Number" value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="INV-001" required />
      <View style={styles.dateRow}>
        <View style={{ flex: 1 }}>
          <DatePickerField label="Issue Date" value={issueDate} onChange={setIssueDate} placeholder="Select issue date" />
        </View>
        <View style={{ width: spacing.sm }} />
        <View style={{ flex: 1 }}>
          <DatePickerField label="Due Date" value={dueDate} onChange={setDueDate} placeholder="Select due date" />
        </View>
      </View>

      {/* Line Items */}
      <Text style={styles.sectionLabel}>LINE ITEMS</Text>
      {items.map((item, idx) => (
        <Card key={idx} style={{ marginBottom: spacing.sm }}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemNum}>Item {idx + 1}</Text>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(idx)}>
                <Icon name="close-circle-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.itemInput}
            placeholder="Description"
            value={item.description}
            onChangeText={(v) => updateItem(idx, 'description', v)}
            placeholderTextColor={colors.textLight}
          />
          <View style={styles.itemRow}>
            <TextInput
              style={[styles.itemInput, { flex: 1 }]}
              placeholder="Amount (AED)"
              value={item.unitPrice}
              onChangeText={(v) => { updateItem(idx, 'unitPrice', v); updateItem(idx, 'quantity', '1'); }}
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
            />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total:</Text>
            <Text style={styles.amountText}>AED {parseFloat(item.amount || '0').toLocaleString()}</Text>
          </View>
        </Card>
      ))}
      <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
        <Icon name="plus" size={18} color={colors.primary} />
        <Text style={styles.addItemText}>Add Line Item</Text>
      </TouchableOpacity>

      {/* Totals */}
      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>AED {subtotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.vatRow} onPress={() => setIncludeVat(!includeVat)}>
          <Icon name={includeVat ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={colors.primary} />
          <Text style={styles.vatLabel}>Include VAT (5%)</Text>
          <Text style={styles.totalValue}>AED {tax.toFixed(2)}</Text>
        </TouchableOpacity>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>AED {total.toLocaleString()}</Text>
        </View>
      </Card>

      {/* Notes */}
      <FormInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional notes..." multiline />

      {/* Submit */}
      <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
        <Text style={styles.submitText}>{loading ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xxl * 2 }} />

      {/* Contract Picker Modal */}
      <Modal visible={showContractPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contract</Text>
              <TouchableOpacity onPress={() => setShowContractPicker(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Icon name="magnify" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search contracts..."
                value={contractSearch}
                onChangeText={setContractSearch}
                placeholderTextColor={colors.textLight}
              />
            </View>
            <FlatList
              data={filteredContracts}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const days = daysUntil(item.endDate);
                const isExpired = days !== null && days < 0;
                return (
                  <TouchableOpacity
                    style={[styles.contractOption, selectedContract?._id === item._id && styles.contractOptionSelected]}
                    onPress={() => { setSelectedContract(item); setShowContractPicker(false); }}
                  >
                    <View style={styles.contractOptionIcon}>
                      <Icon name="file-document-outline" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contractOptionName}>{item.companyName}</Text>
                      <Text style={styles.contractOptionMeta}>
                        {item.vehicleName ? `${item.vehicleName} · ` : ''}{item.tradeLicenseNo || ''}
                      </Text>
                      <View style={styles.contractDates}>
                        <Icon name="calendar-range" size={13} color={colors.textLight} />
                        <Text style={styles.contractDateText}>
                          {formatDate(item.startDate)} → {formatDate(item.endDate)}
                        </Text>
                        {days !== null && (
                          <View style={[styles.daysChip, { backgroundColor: isExpired ? colors.errorLight : days < 30 ? colors.warningLight : colors.successLight }]}>
                            <Text style={[styles.daysChipText, { color: isExpired ? colors.error : days < 30 ? '#92400E' : colors.success }]}>
                              {isExpired ? 'Expired' : `${days}d`}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.contractAmount}>AED {(item.amount || item.value || 0).toLocaleString()}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No contracts found</Text>}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  sectionLabel: {
    fontSize: fontSize.xs, fontFamily: fonts.semiBold, color: colors.textSecondary,
    marginTop: spacing.md, marginBottom: spacing.xs,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  contractPicker: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', marginBottom: spacing.sm,
  },
  selectedContract: { flexDirection: 'row', alignItems: 'center' },
  contractIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.purpleLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  contractName: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.text },
  contractMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1, fontFamily: fonts.regular },
  dateBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full, marginTop: 4 },
  dateBadgeText: { fontSize: fontSize.xs, fontFamily: fonts.semiBold },
  contractPlaceholder: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  contractPlaceholderText: { fontSize: fontSize.md, color: colors.primary, fontFamily: fonts.semiBold, marginLeft: spacing.sm },
  contractInfo: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  infoChip: { flex: 1, backgroundColor: colors.purpleLight, borderRadius: borderRadius.lg, padding: spacing.sm, alignItems: 'center' },
  infoChipLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontFamily: fonts.regular },
  infoChipValue: { fontSize: fontSize.md, fontFamily: fonts.extraBold, color: colors.primary, marginTop: 2 },
  dateRow: { flexDirection: 'row' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  itemNum: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.textSecondary },
  itemInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
    fontSize: fontSize.sm, color: colors.text, marginBottom: spacing.xs,
    height: 40,
  },
  itemRow: { flexDirection: 'row' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  amountLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: fonts.regular },
  amountText: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.primary },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.full, borderStyle: 'dashed',
  },
  addItemText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.primary, marginLeft: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs + 2 },
  totalLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.md, fontFamily: fonts.semiBold, color: colors.text },
  vatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs + 2 },
  vatLabel: { flex: 1, fontSize: fontSize.md, color: colors.text, marginLeft: spacing.xs },
  grandTotal: { borderTopWidth: 1.5, borderTopColor: colors.primary, marginTop: spacing.xs, paddingTop: spacing.sm },
  grandTotalLabel: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text },
  grandTotalValue: { fontSize: fontSize.lg, fontFamily: fonts.extraBold, color: colors.primary },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg,
    ...shadows.md,
  },
  submitText: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingBottom: spacing.xl,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
    marginHorizontal: spacing.md, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, height: 42, marginBottom: spacing.sm,
  },
  modalSearchInput: { flex: 1, fontSize: fontSize.md, color: colors.text, marginLeft: spacing.xs },
  contractOption: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  contractOptionSelected: { backgroundColor: colors.purpleLight },
  contractOptionIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: colors.purpleLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  contractOptionName: { fontSize: fontSize.md, fontFamily: fonts.semiBold, color: colors.text },
  contractOptionMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1, fontFamily: fonts.regular },
  contractDates: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  contractDateText: { fontSize: fontSize.xs, color: colors.textLight, marginLeft: 4, fontFamily: fonts.regular },
  daysChip: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: borderRadius.full },
  daysChipText: { fontSize: 10, fontFamily: fonts.semiBold },
  contractAmount: { fontSize: fontSize.sm, fontFamily: fonts.bold, color: colors.primary },
  emptyText: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl, fontFamily: fonts.regular },
});

export default InvoiceFormScreen;
