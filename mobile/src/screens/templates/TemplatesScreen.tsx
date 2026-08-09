import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  Alert, TextInput, Platform, ScrollView, Linking,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { templateService } from '../../services/otherServices';
import { contractService } from '../../services/contractService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';
import { fillTemplate, valuesFromContract, PLACEHOLDERS } from '../../utils/templateFill';

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if ((window as any).confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

const categoryIcon = (category: string) => {
  switch (String(category || '').toLowerCase()) {
    case 'onboarding': return 'hand-wave-outline';
    case 'contract': return 'file-document-outline';
    case 'payment': return 'cash-multiple';
    case 'documents': return 'folder-alert-outline';
    case 'fines': return 'car-emergency';
    case 'maintenance': return 'wrench-outline';
    default: return 'bell-outline';
  }
};

const emptyForm = { _id: '', name: '', category: '', subject: '', body: '' };

const TemplatesScreen = () => {
  const { companies, selectedCompanyId } = useAuth();
  const company = companies.find((c: any) => (c as any).id === selectedCompanyId || c._id === selectedCompanyId) || companies[0];
  const myCompanyName = (company as any)?.name || '';

  const [mode, setMode] = useState<'list' | 'editor' | 'send'>('list');
  const [templates, setTemplates] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCat, setActiveCat] = useState('All');

  const [form, setForm] = useState(emptyForm);

  // SEND mode state
  const [sendTemplate, setSendTemplate] = useState<any>(null);
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        templateService.getAll(),
        contractService.getAll().catch(() => null),
      ]);
      const tData = tRes.data?.data || tRes.data || [];
      setTemplates(Array.isArray(tData) ? tData : []);
      const cData = cRes?.data?.data || cRes?.data || [];
      setContracts(Array.isArray(cData) ? cData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categories = useMemo(() => {
    const seen: string[] = [];
    templates.forEach((t: any) => {
      const c = t.category || 'Other';
      if (!seen.includes(c)) seen.push(c);
    });
    return ['All', ...seen];
  }, [templates]);

  const filtered = useMemo(
    () => (activeCat === 'All' ? templates : templates.filter((t: any) => (t.category || 'Other') === activeCat)),
    [templates, activeCat],
  );

  const selectedContract = contracts.find((c: any) => c._id === selectedContractId);

  /* ---------------- editor ---------------- */

  const openEditor = (t?: any) => {
    setForm(t ? {
      _id: t._id, name: t.name || '', category: t.category || '',
      subject: t.subject || '', body: t.body || '',
    } : emptyForm);
    setMode('editor');
  };

  const saveTemplate = async () => {
    if (!form.name.trim()) { notify('Error', 'Template name is required'); return; }
    if (!form.body.trim()) { notify('Error', 'Message body is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || 'Other',
        subject: form.subject,
        body: form.body,
      };
      if (form._id) await templateService.update(form._id, payload);
      else await templateService.create(payload);
      setForm(emptyForm);
      setMode('list');
      fetchData();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to save template');
    } finally { setSaving(false); }
  };

  const appendPlaceholder = (key: string) => {
    setForm(p => ({ ...p, body: `${p.body}${p.body && !p.body.endsWith(' ') ? ' ' : ''}{{${key}}}` }));
  };

  const deleteTemplate = (t: any) => {
    const doDelete = async () => {
      try { await templateService.delete(t._id); fetchData(); }
      catch { notify('Error', 'Failed to delete template'); }
    };
    confirmAction(
      'Delete Template',
      t.isDefault
        ? `"${t.name}" is a built-in template. Deleting it removes it from your library. Continue?`
        : `Delete "${t.name}"?`,
      doDelete,
    );
  };

  /* ---------------- send ---------------- */

  const buildMessage = (template: any, contract: any) =>
    fillTemplate(template?.body || '', valuesFromContract(contract, myCompanyName));

  const openSend = (t: any) => {
    setSendTemplate(t);
    setSelectedContractId('');
    setClientOpen(false);
    setMessage(buildMessage(t, null));
    setMode('send');
  };

  const selectContract = (c: any) => {
    setClientOpen(false);
    setSelectedContractId(c._id);
    setMessage(buildMessage(sendTemplate, c));
  };

  const sendWhatsApp = async () => {
    if (!message.trim()) { notify('Error', 'Message is empty'); return; }
    const phone = String(selectedContract?.contactPhone || '').replace(/\D/g, '');
    if (!phone) { notify('No phone number', 'Select a client that has a contact phone number.'); return; }
    try {
      await Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    } catch {
      notify('Error', 'Could not open WhatsApp');
      return;
    }
    try {
      await templateService.logSent({
        templateId: sendTemplate?._id,
        templateName: sendTemplate?.name,
        channel: 'whatsapp',
        recipient: phone,
        message,
        contractId: selectedContractId || null,
      });
    } catch { /* logging must never block sending */ }
  };

  const copyMessage = async () => {
    try {
      await Clipboard.setStringAsync(message);
      notify('Copied', 'Message copied to clipboard');
    } catch {
      notify('Error', 'Could not copy message');
    }
  };

  if (loading) return <LoadingScreen />;

  /* ---------------- render ---------------- */

  const headerTitle = mode === 'editor' ? (form._id ? 'Edit Template' : 'New Template')
    : mode === 'send' ? 'Send Message' : 'Templates';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {mode !== 'list' && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setMode('list')}>
              <Icon name="chevron-left" size={22} color={ui.ink} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{headerTitle}</Text>
        </View>
        {mode === 'list' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => openEditor()}>
            <Icon name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {mode === 'list' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterTab, activeCat === cat && styles.filterTabActive]}
                onPress={() => setActiveCat(cat)}
              >
                <Text style={[styles.filterTabText, activeCat === cat && styles.filterTabTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
            ListEmptyComponent={
              <EmptyState icon="message-text-outline" title="No templates yet"
                actionLabel="New Template" onAction={() => openEditor()} />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Icon name={categoryIcon(item.category) as any} size={20} color={ui.purple} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {[item.category || 'Other', item.isDefault ? 'Built-in' : null].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.preview} numberOfLines={2}>{item.body}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionChip} onPress={() => openSend(item)}>
                    <Icon name="whatsapp" size={15} color={ui.purple} />
                    <Text style={styles.actionChipText}>Use</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionChip} onPress={() => openEditor(item)}>
                    <Icon name="pencil-outline" size={14} color={ui.purple} />
                    <Text style={styles.actionChipText}>Edit</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTemplate(item)}>
                    <Icon name="delete-outline" size={17} color={ui.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      )}

      {mode === 'editor' && (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Name</Text>
          <View style={styles.fieldCard}>
            <TextInput style={styles.fieldInput} placeholder="e.g. Payment Reminder"
              placeholderTextColor={ui.muted} value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))} />
          </View>

          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.fieldCard}>
            <TextInput style={styles.fieldInput} placeholder="e.g. Payment"
              placeholderTextColor={ui.muted} value={form.category}
              onChangeText={v => setForm(p => ({ ...p, category: v }))} />
          </View>

          <Text style={styles.sectionLabel}>Subject</Text>
          <View style={styles.fieldCard}>
            <TextInput style={styles.fieldInput} placeholder="Short subject line"
              placeholderTextColor={ui.muted} value={form.subject}
              onChangeText={v => setForm(p => ({ ...p, subject: v }))} />
          </View>

          <Text style={styles.sectionLabel}>Message Body</Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={[styles.fieldInput, { minHeight: 160, textAlignVertical: 'top' }]}
              placeholder={'Dear {{contactPerson}},\n\nWrite your message here...'}
              placeholderTextColor={ui.muted}
              value={form.body}
              onChangeText={v => setForm(p => ({ ...p, body: v }))}
              multiline
            />
          </View>

          <Text style={styles.hint}>Tap to insert a placeholder</Text>
          <View style={styles.chipWrap}>
            {PLACEHOLDERS.map(key => (
              <TouchableOpacity key={key} style={styles.phChip} onPress={() => appendPlaceholder(key)}>
                <Text style={styles.phChipText}>{`{{${key}}}`}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveTemplate} disabled={saving}>
            <Icon name="content-save-outline" size={18} color="#FFFFFF" />
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Template'}</Text>
          </TouchableOpacity>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}

      {mode === 'send' && (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Template</Text>
          <View style={styles.templateBadge}>
            <View style={styles.selectorIconBox}>
              <Icon name={categoryIcon(sendTemplate?.category) as any} size={16} color={ui.purple} />
            </View>
            <Text style={styles.selectorText} numberOfLines={1}>{sendTemplate?.name}</Text>
          </View>

          <Text style={styles.sectionLabel}>Client</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={() => setClientOpen(o => !o)} activeOpacity={0.8}>
            <View style={styles.selectorIconBox}>
              <Icon name="account-outline" size={16} color={ui.purple} />
            </View>
            <Text style={[styles.selectorText, !selectedContract && { color: ui.muted }]}>
              {selectedContract ? (selectedContract.companyName || selectedContract.customerName || 'Client') : 'Select client...'}
            </Text>
            <Icon name={clientOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
          </TouchableOpacity>
          {clientOpen && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {contracts.map((c: any, i: number) => (
                  <TouchableOpacity
                    key={c._id}
                    style={[styles.dropdownItem, i === contracts.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => selectContract(c)}
                  >
                    <Text style={[styles.dropdownText, selectedContractId === c._id && { color: ui.purple, fontFamily: fonts.semiBold }]}>
                      {c.companyName || c.customerName || 'Client'}{c.contractNumber ? ` — #${c.contractNumber}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionLabel}>Message</Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={[styles.fieldInput, { minHeight: 180, textAlignVertical: 'top' }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Your message..."
              placeholderTextColor={ui.muted}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.whatsappBtn} onPress={sendWhatsApp}>
            <Icon name="whatsapp" size={19} color="#FFFFFF" />
            <Text style={styles.saveText}>Send on WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyBtn} onPress={copyMessage}>
            <Icon name="content-copy" size={16} color={ui.ink} />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },
  filterScroll: { flexGrow: 0, minHeight: 48 },
  filterRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 6 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 99, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: ui.border,
  },
  filterTabActive: { backgroundColor: ui.ink, borderColor: ui.ink },
  filterTabText: { fontSize: 12, fontFamily: fonts.medium, color: ui.ink },
  filterTabTextActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 80 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: ui.lilac,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
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
  formScroll: { padding: 20, paddingTop: 4 },
  sectionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginBottom: 8, marginTop: 16 },
  fieldCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  fieldInput: {
    fontSize: 14, fontFamily: fonts.regular, color: ui.ink, padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  hint: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 14, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phChip: {
    backgroundColor: ui.lilac, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.12)',
  },
  phChipText: { fontSize: 11, fontFamily: fonts.medium, color: ui.purple },
  templateBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: ui.lilac, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.12)',
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
    borderWidth: 1, borderColor: ui.border, overflow: 'hidden', maxHeight: 260,
  },
  dropdownItem: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  dropdownText: { fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  saveBtn: {
    marginTop: 24, backgroundColor: ui.purple, borderRadius: 16,
    padding: 15, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },
  whatsappBtn: {
    marginTop: 24, backgroundColor: '#25D366', borderRadius: 16,
    padding: 15, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  copyBtn: {
    marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    borderWidth: 1, borderColor: ui.border,
  },
  copyText: { color: ui.ink, fontSize: 14, fontFamily: fonts.semiBold },
});

export default TemplatesScreen;
