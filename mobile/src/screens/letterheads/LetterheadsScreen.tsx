import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, TextInput, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { letterService } from '../../services/otherServices';
import { contractService } from '../../services/contractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';
import { BRAND, brandCss, brandHeaderHtml, brandFooterHtml } from '../../utils/brandTemplate';

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const fmtDate = (d: any) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d || '');
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const generateLetterHtml = (letter: any) => {
  const r = letter.recipient || {};
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; min-height: 100vh; display: flex; flex-direction: column; }
  ${brandCss}
  .body { flex: 1; padding: 34px 40px; }
  .date { font-size: 12px; color: #555; margin-bottom: 24px; text-align: right; }
  .to-block { margin-bottom: 24px; }
  .to-label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
  .to-name { font-size: 15px; font-weight: 700; color: #222; }
  .to-detail { font-size: 12px; color: #555; margin-top: 2px; }
  .subject { font-size: 14px; font-weight: 700; color: #232B38; margin-bottom: 18px; }
  .subject span { border-bottom: 2px solid #35A3EF; padding-bottom: 2px; }
  .content { font-size: 13px; color: #444; line-height: 1.9; white-space: pre-line; margin-bottom: 36px; }
  .closing { font-size: 13px; color: #444; line-height: 1.7; }
  .closing .sig { margin-top: 34px; font-weight: 700; color: #232B38; }
</style></head><body>
  ${brandHeaderHtml}
  <div class="body">
    <div class="date">${fmtDate(letter.letterDate || letter.createdAt)}</div>
    <div class="to-block">
      <div class="to-label">To</div>
      <div class="to-name">${r.companyName || r.contactPerson || 'Recipient'}</div>
      ${r.contactPerson && r.companyName ? `<div class="to-detail">Attn: ${r.contactPerson}</div>` : ''}
      ${r.address ? `<div class="to-detail">${r.address}</div>` : ''}
      ${r.email ? `<div class="to-detail">${r.email}</div>` : ''}
      ${r.phone ? `<div class="to-detail">${r.phone}</div>` : ''}
    </div>
    <div class="subject"><span>Subject: ${letter.subject || ''}</span></div>
    <div class="content">${(letter.body || '').replace(/</g, '&lt;')}</div>
    <div class="closing">
      Sincerely,
      <div class="sig">${BRAND.shortName}<br><span style="font-weight:400;font-size:11px;color:#666">${BRAND.subName}</span></div>
    </div>
  </div>
  ${brandFooterHtml}
</body></html>`;
};

const LetterheadsScreen = () => {
  const [letters, setLetters] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  const emptyForm = {
    contractId: '',
    companyName: '', contactPerson: '', email: '', phone: '', address: '',
    subject: '', body: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [lRes, cRes] = await Promise.all([
        letterService.getAll(),
        contractService.getAll().catch(() => null),
      ]);
      setLetters(lRes.data?.data || lRes.data || []);
      const cData = cRes?.data?.data || cRes?.data || [];
      setContracts(Array.isArray(cData) ? cData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedContract = contracts.find((c: any) => c._id === form.contractId);

  // Selecting a contract auto-fills the To section from the client's details
  const selectContract = (c: any | null) => {
    setContractOpen(false);
    if (!c) { setForm(p => ({ ...p, contractId: '', companyName: '', contactPerson: '', email: '', phone: '', address: '' })); return; }
    setForm(p => ({
      ...p,
      contractId: c._id,
      companyName: c.companyName || c.customerName || '',
      contactPerson: c.contactPerson || '',
      email: c.contactEmail || '',
      phone: c.contactPhone || '',
      address: c.address || c.companyAddress || '',
    }));
  };

  const saveLetter = async () => {
    if (!form.subject.trim()) { notify('Error', 'Subject is required'); return; }
    if (!form.body.trim()) { notify('Error', 'Letter content is required'); return; }
    setSaving(true);
    try {
      await letterService.create({
        subject: form.subject,
        body: form.body,
        contractId: form.contractId || null,
        recipient: {
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          email: form.email,
          phone: form.phone,
          address: form.address,
        },
        letterDate: new Date().toISOString().split('T')[0],
      });
      setForm(emptyForm);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to save letter');
    } finally { setSaving(false); }
  };

  const printLetter = async (letter: any, share = false) => {
    let webWin: any = null;
    if (Platform.OS === 'web') webWin = window.open('', '_blank');
    try {
      const html = generateLetterHtml(letter);
      if (Platform.OS === 'web') {
        if (!webWin) { (window as any).alert('Please allow pop-ups to print the letter.'); return; }
        webWin.document.write(html);
        webWin.document.close();
        webWin.focus();
        setTimeout(() => webWin.print(), 400);
      } else if (!share) {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Send Letter', UTI: 'com.adobe.pdf' });
        }
      }
    } catch (err: any) {
      if (webWin) { try { webWin.close(); } catch {} }
      notify('Error', err.message || 'Failed to generate letter PDF');
    }
  };

  const deleteLetter = (id: string) => {
    const doDelete = async () => {
      try { await letterService.delete(id); fetchData(); }
      catch { notify('Error', 'Failed to delete'); }
    };
    if (Platform.OS === 'web') {
      if ((window as any).confirm('Delete this letter?')) doDelete();
    } else {
      Alert.alert('Delete Letter', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const contractLabelOf = (id: string) => {
    const c = contracts.find((x: any) => x._id === id);
    return c ? (c.companyName || c.customerName || c.contractNumber) : null;
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Letters</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(s => !s)}>
          <Icon name={showForm ? 'close' : 'plus'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          {/* Client / Contract selector */}
          <Text style={styles.sectionLabel}>Client (from contract)</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={() => setContractOpen(o => !o)} activeOpacity={0.8}>
            <View style={styles.selectorIconBox}>
              <Icon name="account-outline" size={16} color={ui.purple} />
            </View>
            <Text style={[styles.selectorText, !selectedContract && { color: ui.muted }]}>
              {selectedContract ? (selectedContract.companyName || selectedContract.customerName) : 'Select client...'}
            </Text>
            <Icon name={contractOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
          </TouchableOpacity>
          {contractOpen && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                <TouchableOpacity style={styles.dropdownItem} onPress={() => selectContract(null)}>
                  <Text style={[styles.dropdownText, { color: ui.muted }]}>None (enter manually)</Text>
                </TouchableOpacity>
                {contracts.map((c: any, i: number) => (
                  <TouchableOpacity
                    key={c._id}
                    style={[styles.dropdownItem, i === contracts.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => selectContract(c)}
                  >
                    <Text style={[styles.dropdownText, form.contractId === c._id && { color: ui.purple, fontFamily: fonts.semiBold }]}>
                      {c.companyName || c.customerName || 'Client'}{c.contractNumber ? ` — #${c.contractNumber}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* To section (auto-filled, editable) */}
          <Text style={styles.sectionLabel}>To</Text>
          <View style={styles.toCard}>
            <TextInput style={styles.input} placeholder="Company name" placeholderTextColor={ui.muted}
              value={form.companyName} onChangeText={v => setForm(p => ({ ...p, companyName: v }))} />
            <TextInput style={styles.input} placeholder="Contact person" placeholderTextColor={ui.muted}
              value={form.contactPerson} onChangeText={v => setForm(p => ({ ...p, contactPerson: v }))} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={ui.muted}
              value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} />
            <TextInput style={[styles.input, { borderBottomWidth: 0, marginBottom: 0 }]} placeholder="Phone" placeholderTextColor={ui.muted}
              value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} />
          </View>

          {/* Subject */}
          <Text style={styles.sectionLabel}>Subject</Text>
          <View style={styles.fieldCard}>
            <TextInput style={styles.fieldInput} placeholder="e.g. Payment Reminder — Invoice #INV-2026-072"
              placeholderTextColor={ui.muted} value={form.subject}
              onChangeText={v => setForm(p => ({ ...p, subject: v }))} />
          </View>

          {/* Body */}
          <Text style={styles.sectionLabel}>Letter Content</Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={[styles.fieldInput, { minHeight: 160, textAlignVertical: 'top' }]}
              placeholder={'Dear Sir/Madam,\n\nWrite your letter here...'}
              placeholderTextColor={ui.muted}
              value={form.body}
              onChangeText={v => setForm(p => ({ ...p, body: v }))}
              multiline
            />
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveLetter} disabled={saving}>
            <Icon name="content-save-outline" size={18} color="#FFFFFF" />
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Letter'}</Text>
          </TouchableOpacity>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      ) : (
        <FlatList
          data={letters}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
          ListEmptyComponent={
            <EmptyState icon="email-edit-outline" title="No letters yet"
              actionLabel="Write a Letter" onAction={() => setShowForm(true)} />
          }
          renderItem={({ item }) => {
            const linkedClient = item.recipient?.companyName || contractLabelOf(item.contractId);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Icon name="email-outline" size={20} color={ui.purple} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {[linkedClient, fmtDate(item.letterDate || item.createdAt)].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.preview} numberOfLines={2}>{item.body}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionChip} onPress={() => printLetter(item, false)}>
                    <Icon name="file-pdf-box" size={15} color={ui.purple} />
                    <Text style={styles.actionChipText}>PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionChip, { backgroundColor: 'rgba(37,211,102,0.1)' }]} onPress={() => printLetter(item, true)}>
                    <Icon name="send-outline" size={14} color="#16a34a" />
                    <Text style={[styles.actionChipText, { color: '#16a34a' }]}>Send</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteLetter(item._id)}>
                    <Icon name="delete-outline" size={17} color={ui.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },
  formScroll: { padding: 20, paddingTop: 4 },
  sectionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginBottom: 8, marginTop: 16 },
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
    borderWidth: 1, borderColor: ui.border, overflow: 'hidden', maxHeight: 260,
  },
  dropdownItem: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  dropdownText: { fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  toCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  input: {
    fontSize: 14, fontFamily: fonts.regular, color: ui.ink,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  fieldCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  fieldInput: {
    fontSize: 14, fontFamily: fonts.regular, color: ui.ink, padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  saveBtn: {
    marginTop: 24, backgroundColor: ui.purple, borderRadius: 16,
    padding: 15, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },
  list: { paddingHorizontal: 20, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: ui.lilac,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 14, fontFamily: fonts.bold, color: ui.ink },
  cardSub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 2 },
  preview: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 10, lineHeight: 18 },
  cardActions: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: ui.hairline,
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: ui.lilac, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7,
  },
  actionChipText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple },
  deleteBtn: { padding: 6 },
});

export default LetterheadsScreen;
