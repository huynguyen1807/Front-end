import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { isCalendarDate, localDate } from '../utils/scanReview';

export default function ScanDateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (date: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = isCalendarDate(value) ? new Date(`${value}T12:00:00`) : new Date();
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>
    {Platform.OS === 'web' ? <TextInput editable={!disabled} accessibilityLabel={label} value={value} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.onSurfaceVariant} onChangeText={onChange} style={styles.input} maxLength={10} /> : <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`${label}: ${value || 'chưa chọn'}`} onPress={() => {
      if (Platform.OS === 'android') DateTimePickerAndroid.open({ value: selected, mode: 'date', onChange: (event, date) => { if (event.type === 'set' && date) onChange(localDate(date)); } });
      else setOpen(true);
    }} style={styles.button}><Text style={styles.value}>{value || 'Chọn ngày'}</Text><Ionicons name="calendar-outline" size={18} color={COLORS.primary} /></Pressable>}
    {open && <Modal transparent visible animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.modal}><Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Đóng lịch" /><View style={styles.panel}><Text style={styles.title}>{label}</Text><DateTimePicker value={selected} mode="date" display="spinner" onChange={(_event, date) => { if (date) onChange(localDate(date)); }} /><Pressable accessibilityRole="button" style={styles.done} onPress={() => { if (!value) onChange(localDate(selected)); setOpen(false); }}><Text style={styles.doneText}>Xong</Text></Pressable></View></View></Modal>}
  </View>;
}
const styles = StyleSheet.create({
  field: { flex: 1, gap: 7 }, label: { color: COLORS.onSurfaceVariant, fontSize: 11, fontWeight: '600' }, input: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), borderRadius: 12, color: COLORS.onSurface, fontSize: 13, backgroundColor: COLORS.surfaceContainerLowest }, button: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.alpha(COLORS.outlineVariant, '50'), borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surfaceContainerLowest }, value: { flex: 1, color: COLORS.onSurface, fontSize: 13 },
  modal: { flex: 1, justifyContent: 'flex-end' }, scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' }, panel: { backgroundColor: COLORS.surfaceContainerLowest, padding: 20, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, title: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface }, done: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 12 }, doneText: { color: COLORS.onPrimary, fontWeight: '700' },
});
