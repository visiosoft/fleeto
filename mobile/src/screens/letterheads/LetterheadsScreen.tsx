import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { letterheadService } from '../../services/otherServices';
import Card from '../../components/common/Card';
import FAB from '../../components/common/FAB';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';
import { brandCss, brandHeaderHtml, brandFooterHtml } from '../../utils/brandTemplate';

const generateLetterheadHtml = (item: any) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; min-height: 100vh; display: flex; flex-direction: column; }
  ${brandCss}
  .body { flex: 1; padding: 36px 40px; }
  .doc-title { font-size: 20px; font-weight: 700; color: #232B38; margin-bottom: 18px; }
  .doc-date { font-size: 12px; color: #888; margin-bottom: 24px; }
  .content { font-size: 13px; color: #444; line-height: 1.9; white-space: pre-line; }
</style></head><body>
  ${brandHeaderHtml}
  <div class="body">
    <div class="doc-title">${item.title || ''}</div>
    <div class="doc-date">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div class="content">${item.content || ''}</div>
  </div>
  ${brandFooterHtml}
</body></html>`;

const LetterheadsScreen = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await letterheadService.getAll();
      setItems(res.data?.data || res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addItem = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    try {
      await letterheadService.create({ title, content });
      setTitle(''); setContent(''); setShowForm(false);
      fetchData();
    } catch (err) { Alert.alert('Error', 'Failed to add letterhead'); }
  };

  const printItem = async (item: any, share = false) => {
    let webWin: any = null;
    if (Platform.OS === 'web') webWin = window.open('', '_blank');
    try {
      const html = generateLetterheadHtml(item);
      if (Platform.OS === 'web') {
        if (!webWin) { window.alert('Please allow pop-ups to print the letterhead.'); return; }
        webWin.document.write(html);
        webWin.document.close();
        webWin.focus();
        setTimeout(() => webWin.print(), 400);
      } else if (!share) {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Letterhead', UTI: 'com.adobe.pdf' });
        }
      }
    } catch (err: any) {
      if (webWin) { try { webWin.close(); } catch {} }
      if (Platform.OS === 'web') window.alert(err.message || 'Failed to generate PDF');
      else Alert.alert('Error', err.message || 'Failed to generate PDF');
    }
  };

  const deleteItem = (id: string) => Alert.alert('Delete Letterhead', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await letterheadService.delete(id); fetchData(); }
      catch { Alert.alert('Error', 'Failed to delete'); }
    }},
  ]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {showForm && (
        <Card style={{ margin: spacing.md }}>
          <TextInput style={styles.input} placeholder="Letterhead title" value={title} onChangeText={setTitle} placeholderTextColor={colors.textLight} />
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Content" value={content} onChangeText={setContent} multiline placeholderTextColor={colors.textLight} />
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => setShowForm(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={addItem}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
          </View>
        </Card>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListEmptyComponent={<EmptyState icon="file-document-edit-outline" title="No letterheads" actionLabel="Add Letterhead" onAction={() => setShowForm(true)} />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Icon name="file-document-edit-outline" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.content && <Text style={styles.sub} numberOfLines={2}>{item.content}</Text>}
              </View>
              <TouchableOpacity style={styles.actionBtn} onPress={() => printItem(item, false)}>
                <Icon name="file-pdf-box" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => printItem(item, true)}>
                <Icon name="share-variant-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => deleteItem(item._id)}>
                <Icon name="delete-outline" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
      {!showForm && <FAB onPress={() => setShowForm(true)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, fontFamily: fonts.regular },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md, color: colors.text, marginBottom: spacing.sm,
  },
  actionBtn: { padding: 6 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancel: { fontSize: fontSize.md, color: colors.textSecondary, padding: spacing.sm, fontFamily: fonts.regular },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  saveText: { color: colors.white, fontFamily: fonts.semiBold, fontSize: fontSize.md },
});

export default LetterheadsScreen;
