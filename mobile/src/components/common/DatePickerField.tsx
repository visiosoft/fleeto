import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

interface Props {
    label: string;
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const getDaysInMonth = (month: number, year: number) => {
    if (month === 1 && isLeapYear(year)) return 29;
    return DAYS_IN_MONTH[month];
};

const DatePickerField: React.FC<Props> = ({ label, value, onChange, placeholder }) => {
    const [visible, setVisible] = useState(false);

    const parsed = value ? new Date(value) : new Date();
    const initYear = parsed.getFullYear();
    const initMonth = parsed.getMonth();
    const initDay = parsed.getDate();

    const [year, setYear] = useState(initYear);
    const [month, setMonth] = useState(initMonth);
    const [selectedDay, setSelectedDay] = useState(initDay);

    const open = () => {
        const d = value ? new Date(value) : new Date();
        setYear(d.getFullYear());
        setMonth(d.getMonth());
        setSelectedDay(d.getDate());
        setVisible(true);
    };

    const confirm = () => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(selectedDay).padStart(2, '0');
        onChange(`${year}-${m}-${d}`);
        setVisible(false);
    };

    const daysCount = getDaysInMonth(month, year);
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days: (number | null)[] = Array(firstDayOfWeek).fill(null);
    for (let i = 1; i <= daysCount; i++) days.push(i);

    const displayValue = value
        ? `${parseInt(value.split('-')[2])} ${MONTHS[parseInt(value.split('-')[1]) - 1]} ${value.split('-')[0]}`
        : '';

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.field} onPress={open} activeOpacity={0.7}>
                <Icon name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[styles.fieldText, !value && styles.placeholder]}>
                    {displayValue || placeholder || 'Select date'}
                </Text>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <View style={styles.backdrop}>
                    <View style={styles.modal}>
                        {/* Month/Year navigation */}
                        <View style={styles.navRow}>
                            <TouchableOpacity onPress={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
                                <Icon name="chevron-left" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.navTitle}>{MONTHS[month]} {year}</Text>
                            <TouchableOpacity onPress={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
                                <Icon name="chevron-right" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Weekday headers */}
                        <View style={styles.weekRow}>
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <Text key={d} style={styles.weekDay}>{d}</Text>
                            ))}
                        </View>

                        {/* Days grid */}
                        <View style={styles.daysGrid}>
                            {days.map((day, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.dayCell, day === selectedDay && styles.dayCellActive]}
                                    onPress={() => day && setSelectedDay(day)}
                                    disabled={!day}
                                >
                                    <Text style={[styles.dayText, day === selectedDay && styles.dayTextActive]}>
                                        {day || ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
                                <Text style={styles.confirmText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { marginBottom: spacing.sm },
    label: { fontSize: fontSize.xs, fontFamily: fonts.semiBold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
    field: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: colors.surface, borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md, paddingVertical: 14,
        borderWidth: 1, borderColor: colors.divider,
    },
    fieldText: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: colors.text },
    placeholder: { color: colors.textLight },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: 320 },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    navTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text },
    weekRow: { flexDirection: 'row', marginBottom: 4 },
    weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: fonts.semiBold, color: colors.textLight },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
    dayCellActive: { backgroundColor: colors.primary },
    dayText: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
    dayTextActive: { color: '#fff', fontFamily: fonts.bold },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
    cancelText: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSecondary },
    confirmBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10 },
    confirmText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#fff' },
});

export default DatePickerField;
