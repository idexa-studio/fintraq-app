import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { usePremium } from '../../../providers/PremiumProvider';
import type { LoanWithStats } from '../api/loans';
import { useLoanReminders } from '../hooks/useLoanReminders';

const DUE_DAYS_OPTIONS = [
  { label: 'On due date', value: 0 },
  { label: '1 day before', value: 1 },
  { label: '3 days before', value: 3 },
  { label: '1 week before', value: 7 },
];

type Props = { loan: LoanWithStats };

export const LoanReminderSection = React.memo(function LoanReminderSection({ loan }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { scheduleEmiReminder, cancelEmiReminder, scheduleDueReminder, cancelDueReminder } = useLoanReminders();
  const { showAlert } = usePremium();

  const [emiDay, setEmiDay] = useState(loan.emiReminderDay ?? 5);
  const [emiTime, setEmiTime] = useState(loan.emiReminderTime ?? '09:00');
  const [emiEnabled, setEmiEnabled] = useState(loan.emiReminderEnabled);

  const [dueEnabled, setDueEnabled] = useState(loan.dueReminderEnabled);
  const [dueDaysBefore, setDueDaysBefore] = useState(loan.dueReminderDaysBefore ?? 1);
  const [dueTime, setDueTime] = useState(loan.emiReminderTime ?? '09:00');

  const [showEmiTimePicker, setShowEmiTimePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);

  const emiTimeDate = useMemo(() => {
    const [h, m] = emiTime.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  }, [emiTime]);

  const dueTimeDate = useMemo(() => {
    const [h, m] = dueTime.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  }, [dueTime]);

  const formatTime = (str: string) => {
    const [h, m] = str.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleEmiToggle = useCallback(async (val: boolean) => {
    setEmiEnabled(val);
    if (val) {
      const ok = await scheduleEmiReminder(loan, emiDay, emiTime);
      if (!ok) {
        setEmiEnabled(false);
        showAlert({ title: 'Permission required', message: 'Enable notifications to set reminders.', type: 'warning' });
      }
    } else {
      await cancelEmiReminder(loan);
    }
  }, [loan, emiDay, emiTime, scheduleEmiReminder, cancelEmiReminder, showAlert]);

  const handleEmiDayPress = useCallback(() => {
    const next = ((emiDay) % 28) + 1;
    setEmiDay(next);
    if (emiEnabled) scheduleEmiReminder(loan, next, emiTime);
  }, [emiDay, emiEnabled, emiTime, loan, scheduleEmiReminder]);

  const handleEmiTimeChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowEmiTimePicker(false);
    if (!date) return;
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const str = `${hh}:${mm}`;
    setEmiTime(str);
    if (emiEnabled) scheduleEmiReminder(loan, emiDay, str);
  }, [emiEnabled, emiDay, loan, scheduleEmiReminder]);

  const handleDueToggle = useCallback(async (val: boolean) => {
    if (!loan.dueDate && val) {
      showAlert({ title: 'No due date', message: 'Set a due date on this loan first.', type: 'warning' });
      return;
    }
    setDueEnabled(val);
    if (val) {
      const ok = await scheduleDueReminder(loan, dueDaysBefore, dueTime);
      if (!ok) {
        setDueEnabled(false);
        showAlert({ title: 'Permission required', message: 'Enable notifications to set reminders.', type: 'warning' });
      }
    } else {
      await cancelDueReminder(loan);
    }
  }, [loan, dueDaysBefore, dueTime, scheduleDueReminder, cancelDueReminder, showAlert]);

  const handleDueDaysPress = useCallback(() => {
    const idx = DUE_DAYS_OPTIONS.findIndex(o => o.value === dueDaysBefore);
    const next = DUE_DAYS_OPTIONS[(idx + 1) % DUE_DAYS_OPTIONS.length].value;
    setDueDaysBefore(next);
    if (dueEnabled && loan.dueDate) scheduleDueReminder(loan, next, dueTime);
  }, [dueDaysBefore, dueEnabled, dueTime, loan, scheduleDueReminder]);

  const handleDueTimeChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowDueTimePicker(false);
    if (!date) return;
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const str = `${hh}:${mm}`;
    setDueTime(str);
    if (dueEnabled && loan.dueDate) scheduleDueReminder(loan, dueDaysBefore, str);
  }, [dueEnabled, dueDaysBefore, loan, scheduleDueReminder]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        Reminders
      </Text>

      {/* EMI Reminder */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.rowLabel}>
              Monthly EMI reminder
            </Text>
            <Text style={styles.rowSub}>
              Fires every month on day {emiDay}
            </Text>
          </View>
          <Switch
            value={emiEnabled}
            onValueChange={handleEmiToggle}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        {emiEnabled && (
          <View style={styles.subControls}>
            <BentoPressable style={styles.chip} onPress={handleEmiDayPress}>
              <Text style={styles.chipText}>
                Day {emiDay}
              </Text>
            </BentoPressable>
            <BentoPressable style={styles.chip} onPress={() => setShowEmiTimePicker(true)}>
              <Text style={styles.chipText}>
                {formatTime(emiTime)}
              </Text>
            </BentoPressable>
          </View>
        )}
      </View>

      {/* Due Date Reminder */}
      {loan.dueDate && (
        <View style={[styles.card, { marginTop: theme.spacing('2') }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.rowLabel}>
                Due date reminder
              </Text>
              <Text style={styles.rowSub}>
                {DUE_DAYS_OPTIONS.find(o => o.value === dueDaysBefore)?.label ?? 'On due date'}
              </Text>
            </View>
            <Switch
              value={dueEnabled}
              onValueChange={handleDueToggle}
              trackColor={{ true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          {dueEnabled && (
            <View style={styles.subControls}>
              <BentoPressable style={styles.chip} onPress={handleDueDaysPress}>
                <Text style={styles.chipText}>
                  {DUE_DAYS_OPTIONS.find(o => o.value === dueDaysBefore)?.label}
                </Text>
              </BentoPressable>
              <BentoPressable style={styles.chip} onPress={() => setShowDueTimePicker(true)}>
                <Text style={styles.chipText}>
                  {formatTime(dueTime)}
                </Text>
              </BentoPressable>
            </View>
          )}
        </View>
      )}

      {showEmiTimePicker && (
        <DateTimePicker
          value={emiTimeDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEmiTimeChange}
        />
      )}
      {showDueTimePicker && (
        <DateTimePicker
          value={dueTimeDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDueTimeChange}
        />
      )}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    section: { marginTop: spacing('6') },
    title: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing('2'),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleInfo: { flex: 1, paddingRight: spacing('3') },
    rowLabel: {
      fontFamily: typography.styles.rowLabel.fontFamily,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    rowSub: {
      fontFamily: typography.styles.rowMeta.fontFamily,
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      marginTop: spacing('0.5'),
    },
    subControls: { flexDirection: 'row', gap: spacing('2'), marginTop: spacing('3') },
    chip: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      backgroundColor: colors.primary + '15',
      borderRadius: radius('full'),
    },
    chipText: {
      fontFamily: typography.styles.chipLabel.fontFamily,
      fontSize: typography.sizes.sm,
      color: colors.primary,
    },
  });
