import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { ListGroup, ListItem } from '@/src/components/ui';
import { AlarmIcon, BellIcon, BellRingingIcon, CalendarBlankIcon } from '@/src/components/ui/icons';
import { OptionsBottomSheet } from '@/src/components/ui/OptionsBottomSheet';
import { useTheme } from '@/src/providers/ThemeProvider';
import { usePremium } from '@/src/providers/PremiumProvider';
import type { LoanWithStats } from '@/src/features/loans/api/loans';
import { useLoanReminders } from '@/src/features/loans/hooks/useLoanReminders';
import { useTranslation } from 'react-i18next';

const DUE_DAYS_OPTIONS = [
  { label: 'onDueDate', value: 0 },
  { label: 'dayBefore', value: 1 },
  { label: 'daysBefore', value: 3 },
  { label: 'weekBefore', value: 7 },
] as const;

type Props = { loan: LoanWithStats };

export const LoanReminderSection = React.memo(function LoanReminderSection({ loan }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;
  const { scheduleEmiReminder, cancelEmiReminder, scheduleDueReminder, cancelDueReminder } = useLoanReminders();
  const { showAlert } = usePremium();

  const [emiDay, setEmiDay] = useState(loan.emiReminderDay ?? 5);
  const [emiTime, setEmiTime] = useState(loan.emiReminderTime ?? '09:00');
  const [emiEnabled, setEmiEnabled] = useState(loan.emiReminderEnabled);

  // Pre-activate due reminder whenever loan has a due date
  const [dueEnabled, setDueEnabled] = useState(!!loan.dueDate);
  const [dueDaysBefore, setDueDaysBefore] = useState(loan.dueReminderDaysBefore ?? 1);
  const [dueTime, setDueTime] = useState(loan.dueReminderTime ?? loan.emiReminderTime ?? '09:00');

  // Auto-schedule due reminder on first open when loan has dueDate but reminder not yet persisted
  useEffect(() => {
    if (loan.dueDate && !loan.dueReminderEnabled) {
      scheduleDueReminder(loan, dueDaysBefore, dueTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showEmiTimePicker, setShowEmiTimePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [showEmiDayPicker, setShowEmiDayPicker] = useState(false);
  const [showDueDaysPicker, setShowDueDaysPicker] = useState(false);

  const emiTimeDate = useMemo(() => {
    const [h, m] = emiTime.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  }, [emiTime]);

  const dueTimeDate = useMemo(() => {
    const [h, m] = dueTime.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0); return d;
  }, [dueTime]);

  const emiDayOptions = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const day = i + 1;
      return {
        key: `day-${day}`,
        label: t('loans.dayOfMonth', { day }),
        selected: emiDay === day,
        onPress: () => {
          setEmiDay(day);
          if (emiEnabled) scheduleEmiReminder(loan, day, emiTime);
        },
      };
    });
  }, [emiDay, emiEnabled, emiTime, loan, scheduleEmiReminder, t]);

  const dueDaysOptions = useMemo(() => {
    return DUE_DAYS_OPTIONS.map(opt => ({
      key: `due-before-${opt.value}`,
      label: t(`loans.${opt.label}`),
      selected: dueDaysBefore === opt.value,
      onPress: () => {
        setDueDaysBefore(opt.value);
        if (dueEnabled && loan.dueDate) scheduleDueReminder(loan, opt.value, dueTime);
      },
    }));
  }, [dueDaysBefore, dueEnabled, dueTime, loan, scheduleDueReminder, t]);

  const formatTime = (str: string) => {
    const [h, m] = str.split(':').map(Number);
    const ampm = h >= 12 ? t('loans.pm') : t('loans.am');
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleEmiToggle = useCallback(async (val: boolean) => {
    setEmiEnabled(val);
    if (val) {
      const ok = await scheduleEmiReminder(loan, emiDay, emiTime);
      if (!ok) {
        setEmiEnabled(false);
        showAlert({ title: t('loans.permissionRequired'), message: t('loans.enableNotifications'), type: 'warning' });
      }
    } else {
      await cancelEmiReminder(loan);
    }
  }, [loan, emiDay, emiTime, scheduleEmiReminder, cancelEmiReminder, showAlert, t]);

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
      showAlert({ title: t('loans.noDueDate'), message: t('loans.setDueDateFirst'), type: 'warning' });
      return;
    }
    setDueEnabled(val);
    if (val) {
      const ok = await scheduleDueReminder(loan, dueDaysBefore, dueTime);
      if (!ok) {
        setDueEnabled(false);
        showAlert({ title: t('loans.permissionRequired'), message: t('loans.enableNotifications'), type: 'warning' });
      }
    } else {
      await cancelDueReminder(loan);
    }
  }, [loan, dueDaysBefore, dueTime, scheduleDueReminder, cancelDueReminder, showAlert, t]);

  const handleDueTimeChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowDueTimePicker(false);
    if (!date) return;
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const str = `${hh}:${mm}`;
    setDueTime(str);
    if (dueEnabled && loan.dueDate) scheduleDueReminder(loan, dueDaysBefore, str);
  }, [dueEnabled, dueDaysBefore, loan, scheduleDueReminder]);

  const dueLabel = t(`loans.${DUE_DAYS_OPTIONS.find((o) => o.value === dueDaysBefore)?.label ?? 'onDueDate'}`);

  return (
    <View>
      {/* Same rows as Settings → Notifications: a switch, then its options once it's on. */}
      <ListGroup title={t('loans.reminders')}>
        <ListItem
          icon={BellIcon}
          iconColor={colors.warning}
          title={t('loans.emiReminder')}
          subtitle={t('loans.emiFires', { day: emiDay })}
          switchValue={emiEnabled}
          onSwitchChange={handleEmiToggle}
        />
        {emiEnabled ? (
          <ListItem icon={CalendarBlankIcon} iconColor={colors.warning} title={t('loans.emiDayTitle')} value={t('loans.dayN', { day: emiDay })} onPress={() => setShowEmiDayPicker(true)} />
        ) : null}
        {emiEnabled ? (
          <ListItem icon={AlarmIcon} iconColor={colors.warning} title={t('settings.reminderTime')} value={formatTime(emiTime)} onPress={() => setShowEmiTimePicker(true)} />
        ) : null}
        {loan.dueDate ? (
          <ListItem
            icon={BellRingingIcon}
            iconColor={colors.danger}
            title={t('loans.dueReminder')}
            subtitle={dueLabel}
            switchValue={dueEnabled}
            onSwitchChange={handleDueToggle}
          />
        ) : null}
        {loan.dueDate && dueEnabled ? (
          <ListItem icon={CalendarBlankIcon} iconColor={colors.danger} title={t('loans.dueReminder')} value={dueLabel} onPress={() => setShowDueDaysPicker(true)} />
        ) : null}
        {loan.dueDate && dueEnabled ? (
          <ListItem icon={AlarmIcon} iconColor={colors.danger} title={t('settings.reminderTime')} value={formatTime(dueTime)} onPress={() => setShowDueTimePicker(true)} />
        ) : null}
      </ListGroup>

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

      <OptionsBottomSheet
        visible={showEmiDayPicker}
        onClose={() => setShowEmiDayPicker(false)}
        title={t('loans.emiDayTitle')}
        subtitle={t('loans.emiDaySubtitle')}
        options={emiDayOptions}
      />

      <OptionsBottomSheet
        visible={showDueDaysPicker}
        onClose={() => setShowDueDaysPicker(false)}
        title={t('loans.dueReminder')}
        subtitle={t('loans.dueReminderSubtitle')}
        options={dueDaysOptions}
      />
    </View>
  );
});
