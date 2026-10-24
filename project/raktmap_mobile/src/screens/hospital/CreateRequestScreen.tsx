import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../../config/api';

const BG = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY = [
  { value: 'low',       label: 'Low Priority',              icon: '🩺', color: '#10B981' },
  { value: 'medium',    label: 'Medium Priority',           icon: '⏰', color: '#F59E0B' },
  { value: 'high',      label: 'High Priority — Emergency', icon: '🚨', color: '#EF4444' },
  { value: 'pregnancy', label: 'Pregnancy',                 icon: '🤰', color: '#EC4899' },
];

const CreateRequestScreen = () => {
  const [form, setForm] = useState({ bloodGroup: '', quantity: '1', urgency: 'medium', patientAge: '', patientCondition: '', requiredBy: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate]     = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode]     = useState<'date' | 'time'>('date');

  const onDateChange = (event: any, selected?: Date) => {
    if (event.type === 'dismissed') { setShowPicker(false); return; }
    const d = selected || date; setDate(d);
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (mode === 'date') { setMode('time'); setTimeout(() => setShowPicker(true), 100); }
      else { setMode('date'); setForm(f => ({ ...f, requiredBy: d.toISOString().slice(0, 16) })); }
    } else { setForm(f => ({ ...f, requiredBy: d.toISOString().slice(0, 16) })); }
  };

  const submit = async () => {
    if (!form.bloodGroup) { Alert.alert('Error', 'Please select a blood group'); return; }
    if (!form.requiredBy)  { Alert.alert('Error', 'Please select required date & time'); return; }
    setSubmitting(true);
    try {
      const r = await api.post('/blood-requests', {
        bloodGroup: form.bloodGroup, quantity: parseInt(form.quantity) || 1, urgency: form.urgency,
        requiredBy: form.requiredBy, description: form.description,
        patientAge: form.patientAge ? parseInt(form.patientAge) : undefined, patientCondition: form.patientCondition,
      });
      if (r.data.success) {
        Alert.alert('Request Created!', 'Matching donors will be notified automatically.', [{ text: 'OK', onPress: () => setForm({ bloodGroup: '', quantity: '1', urgency: 'medium', patientAge: '', patientCondition: '', requiredBy: '', description: '' }) }]);
      }
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed to create blood request'); }
    finally { setSubmitting(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Info banner */}
      <View style={s.banner}>
        <Text style={s.bannerIcon}>ℹ️</Text>
        <Text style={s.bannerTxt}>Fill in the details below. Matching donors will be notified automatically via SMS and push notifications.</Text>
      </View>

      {/* Blood Group */}
      <View style={s.field}>
        <Text style={s.label}>Blood Group <Text style={s.req}>*</Text></Text>
        <View style={s.pickerWrap}>
          <Picker selectedValue={form.bloodGroup} onValueChange={v => setForm(f => ({ ...f, bloodGroup: v }))}>
            <Picker.Item label="Select blood group…" value="" />
            {BG.map(g => <Picker.Item key={g} label={g} value={g} />)}
          </Picker>
        </View>
      </View>

      {/* Quantity */}
      <View style={s.field}>
        <Text style={s.label}>Units Required <Text style={s.req}>*</Text></Text>
        <TextInput style={s.input} value={form.quantity} onChangeText={v => setForm(f => ({ ...f, quantity: v }))} keyboardType="number-pad" placeholder="1" />
        <Text style={s.hint}>Min: 1  ·  Max: 10</Text>
      </View>

      {/* Required By */}
      <View style={s.field}>
        <Text style={s.label}>Required By (Date & Time) <Text style={s.req}>*</Text></Text>
        <TouchableOpacity style={s.dateBtn} onPress={() => { setMode('date'); setShowPicker(true); }} activeOpacity={0.8}>
          <Text style={form.requiredBy ? s.dateTxt : s.datePh}>
            {form.requiredBy ? new Date(form.requiredBy).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Select Date & Time'}
          </Text>
          <Text>📅</Text>
        </TouchableOpacity>
        {showPicker && <DateTimePicker testID="dtp" value={date} mode={mode} is24Hour onChange={onDateChange} minimumDate={new Date()} />}
      </View>

      {/* Patient Age */}
      <View style={s.field}>
        <Text style={s.label}>Patient Age <Text style={s.opt}>(optional)</Text></Text>
        <TextInput style={s.input} value={form.patientAge} onChangeText={v => setForm(f => ({ ...f, patientAge: v }))} keyboardType="number-pad" placeholder="Enter patient age" />
      </View>

      {/* Urgency */}
      <View style={s.field}>
        <Text style={s.label}>Urgency Level <Text style={s.req}>*</Text></Text>
        {URGENCY.map(u => (
          <TouchableOpacity key={u.value} style={[s.urgCard, form.urgency === u.value && { borderColor: u.color, backgroundColor: u.color + '08' }]} onPress={() => setForm(f => ({ ...f, urgency: u.value }))} activeOpacity={0.8}>
            <View style={[s.urgRadio, form.urgency === u.value && { borderColor: u.color }]}>
              {form.urgency === u.value && <View style={[s.urgDot, { backgroundColor: u.color }]} />}
            </View>
            <Text style={s.urgIcon}>{u.icon}</Text>
            <Text style={[s.urgLbl, form.urgency === u.value && { color: u.color, fontWeight: '700' }]}>{u.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Patient Condition */}
      <View style={s.field}>
        <Text style={s.label}>Patient Condition <Text style={s.opt}>(optional)</Text></Text>
        <TextInput style={s.input} value={form.patientCondition} onChangeText={v => setForm(f => ({ ...f, patientCondition: v }))} placeholder="e.g. Surgery, Accident, Cancer treatment" />
      </View>

      {/* Notes */}
      <View style={s.field}>
        <Text style={s.label}>Additional Notes <Text style={s.opt}>(optional)</Text></Text>
        <TextInput style={[s.input, s.textarea]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Any specific requirements or additional information…" multiline numberOfLines={4} textAlignVertical="top" />
      </View>

      {/* What happens next */}
      <View style={s.nextCard}>
        <Text style={s.nextTitle}>What happens next?</Text>
        {['SMS notifications sent to eligible donors nearby', 'Real-time updates as donors respond', 'Donor contact info shared once they confirm', 'Track live progress on the Live Map'].map(t => (
          <Text key={t} style={s.nextItem}>› {t}</Text>
        ))}
      </View>

      <TouchableOpacity style={[s.submitBtn, submitting && s.submitDim]} onPress={submit} disabled={submitting} activeOpacity={0.85}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitTxt}>Create Blood Request</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F9F5F5' },
  content:     { padding: 16, paddingBottom: 40 },
  banner:      { flexDirection: 'row', backgroundColor: '#DBEAFE', padding: 14, borderRadius: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  bannerIcon:  { fontSize: 18, marginRight: 10, marginTop: 1 },
  bannerTxt:   { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 20 },
  field:       { marginBottom: 20 },
  label:       { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  req:         { color: '#C8102E' },
  opt:         { color: '#9CA3AF', fontWeight: '400' },
  input:       { borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: '#fff', color: '#1A0A0F' },
  textarea:    { height: 96, textAlignVertical: 'top' },
  pickerWrap:  { borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' },
  hint:        { fontSize: 11, color: '#9CA3AF', marginTop: 5 },
  dateBtn:     { borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateTxt:     { fontSize: 15, color: '#1A0A0F' },
  datePh:      { fontSize: 15, color: '#9CA3AF' },
  urgCard:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 10, backgroundColor: '#fff' },
  urgRadio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  urgDot:      { width: 10, height: 10, borderRadius: 5 },
  urgIcon:     { fontSize: 22, marginRight: 10 },
  urgLbl:      { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },
  nextCard:    { backgroundColor: '#DBEAFE', borderRadius: 14, padding: 16, marginBottom: 20 },
  nextTitle:   { fontSize: 14, fontWeight: '800', color: '#1E40AF', marginBottom: 10 },
  nextItem:    { fontSize: 13, color: '#1E40AF', marginBottom: 6, lineHeight: 20 },
  submitBtn:   { backgroundColor: '#C8102E', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#C8102E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6 },
  submitDim:   { opacity: 0.6 },
  submitTxt:   { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default CreateRequestScreen;