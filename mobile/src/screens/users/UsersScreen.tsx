import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { userService } from '../../services/otherServices';
import Card from '../../components/common/Card';
import SearchBar from '../../components/common/SearchBar';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const UsersScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await userService.getAll();
      const data = res.data?.data || res.data || [];
      setUsers(data); setFiltered(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter((u: any) =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const deleteUser = (id: string) => Alert.alert('Delete User', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await userService.delete(id); fetchData(); }
      catch { Alert.alert('Error', 'Failed to delete user'); }
    }},
  ]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search team members..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListEmptyComponent={<EmptyState icon="account-group-outline" title="No team members" />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.name || item.email || 'U')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name || item.email}</Text>
                <Text style={styles.email}>{item.email}</Text>
                {item.role && <StatusBadge status={item.role} />}
              </View>
              <TouchableOpacity onPress={() => deleteUser(item._id)}>
                <Icon name="delete-outline" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.purpleLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.primary },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1, marginBottom: 4, fontFamily: fonts.regular },
});

export default UsersScreen;
