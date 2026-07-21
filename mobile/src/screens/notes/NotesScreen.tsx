import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { noteService } from '../../services/otherServices';
import Card from '../../components/common/Card';
import FAB from '../../components/common/FAB';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const NotesScreen = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const fetch = useCallback(async () => {
    try {
      const res = await noteService.getAll();
      setNotes(res.data?.data || res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addNote = async () => {
    if (!noteTitle.trim()) { Alert.alert('Error', 'Title is required'); return; }
    try {
      await noteService.create({ title: noteTitle, content: noteContent });
      setNoteTitle(''); setNoteContent(''); setShowForm(false);
      fetch();
    } catch (err) { Alert.alert('Error', 'Failed to add note'); }
  };

  const deleteNote = (id: string) => Alert.alert('Delete Note', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await noteService.delete(id); fetch(); }
      catch { Alert.alert('Error', 'Failed to delete'); }
    }},
  ]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {showForm && (
        <Card style={{ margin: spacing.md }}>
          <TextInput style={styles.input} placeholder="Note title" value={noteTitle} onChangeText={setNoteTitle} placeholderTextColor={colors.textLight} />
          <TextInput style={[styles.input, { height: 80 }]} placeholder="Note content" value={noteContent} onChangeText={setNoteContent} multiline placeholderTextColor={colors.textLight} />
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => setShowForm(false)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={addNote}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
          </View>
        </Card>
      )}
      <FlatList
        data={notes}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}
        ListEmptyComponent={<EmptyState icon="note-text-outline" title="No notes yet" actionLabel="Add Note" onAction={() => setShowForm(true)} />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>{item.title}</Text>
                {item.content && <Text style={styles.noteSub} numberOfLines={2}>{item.content}</Text>}
              </View>
              <TouchableOpacity onPress={() => deleteNote(item._id)}>
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
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  noteContent: { flex: 1 },
  noteTitle: { fontSize: fontSize.md, fontFamily: fonts.semiBold, color: colors.text },
  noteSub: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.sm, fontSize: fontSize.md, color: colors.text, marginBottom: spacing.sm },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancel: { fontSize: fontSize.md, fontFamily: fonts.regular, color: colors.textSecondary, padding: spacing.sm },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  saveText: { color: colors.white, fontFamily: fonts.semiBold },
});

export default NotesScreen;
