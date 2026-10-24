import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { api } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const ICON: Record<string, string> = { blood_request: '🩸', donation_confirmed: '✅', urgent_request: '🚨', donation_reminder: '⏰', system: 'ℹ️' };

const NotificationCenterScreen = () => {
  const { user } = useAuth();
  const [notifs, setNotifs]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<'all' | 'unread'>('all');

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    try {
      if (!user?._id) { setNotifs([]); return; }
      const r = await api.get(`/notifications/${user._id}`);
      setNotifs(r.data.notifications || []);
    } catch { setNotifs([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const markRead = async (id: string) => {
    try { await api.post(`/notifications/${id}/read`); setNotifs(p => p.map(n => n._id === id ? { ...n, read: true } : n)); } catch {}
  };

  const markAllRead = async () => {
    try { if (!user?._id) return; await api.post(`/notifications/${user._id}/read-all`); setNotifs(p => p.map(n => ({ ...n, read: true }))); } catch {}
  };

  const displayed = notifs.filter(n => filter === 'all' || !n.read);
  const unread    = notifs.filter(n => !n.read).length;

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#C8102E" /></View>;

  return (
    <View style={s.root}>
      {/* Controls */}
      <View style={s.controls}>
        <View style={s.filterRow}>
          {[['all', `All (${notifs.length})`], ['unread', `Unread (${unread})`]].map(([val, lbl]) => (
            <TouchableOpacity key={val} style={[s.filterBtn, filter === val && s.filterBtnActive]} onPress={() => setFilter(val as any)}>
              <Text style={[s.filterTxt, filter === val && s.filterTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {unread > 0 && (
          <TouchableOpacity style={s.markAllBtn} onPress={markAllRead} activeOpacity={0.8}>
            <Text style={s.markAllTxt}>✓ Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} tintColor="#C8102E" />} showsVerticalScrollIndicator={false}>
        {displayed.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔔</Text>
            <Text style={s.emptyTitle}>{filter === 'unread' ? 'All caught up!' : 'No notifications'}</Text>
            <Text style={s.emptySub}>{filter === 'unread' ? 'No unread notifications.' : 'You have no notifications yet.'}</Text>
          </View>
        ) : (
          <View style={s.list}>
            {displayed.map(n => (
              <TouchableOpacity key={n._id} style={[s.card, !n.read && s.cardUnread]} onPress={() => !n.read && markRead(n._id)} activeOpacity={0.85}>
                <View style={s.cardInner}>
                  <Text style={s.notifIcon}>{ICON[n.type] ?? '📬'}</Text>
                  <View style={s.notifContent}>
                    <View style={s.notifTitleRow}>
                      <Text style={s.notifTitle}>{n.title}</Text>
                      {!n.read && <View style={s.unreadDot} />}
                    </View>
                    <Text style={s.notifMsg}>{n.message}</Text>
                    <Text style={s.notifTime}>{new Date(n.createdAt).toLocaleString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F9F5F5' },
  loading:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls:     { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterRow:    { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterBtn:    { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  filterBtnActive:{ backgroundColor: '#C8102E' },
  filterTxt:    { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  filterTxtActive:{ color: '#fff' },
  markAllBtn:   { backgroundColor: '#DBEAFE', padding: 11, borderRadius: 10, alignItems: 'center' },
  markAllTxt:   { fontSize: 14, color: '#1E40AF', fontWeight: '700' },
  list:         { padding: 12 },
  card:         { backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardUnread:   { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  cardInner:    { flexDirection: 'row', padding: 14, alignItems: 'flex-start' },
  notifIcon:    { fontSize: 28, marginRight: 12 },
  notifContent: { flex: 1 },
  notifTitleRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle:   { fontSize: 15, fontWeight: '700', color: '#1A0A0F', flex: 1 },
  unreadDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C8102E', marginLeft: 8 },
  notifMsg:     { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 6 },
  notifTime:    { fontSize: 12, color: '#9CA3AF' },
  empty:        { alignItems: 'center', paddingVertical: 80 },
  emptyIcon:    { fontSize: 52, opacity: 0.3, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', color: '#1A0A0F', marginBottom: 6 },
  emptySub:     { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});

export default NotificationCenterScreen;