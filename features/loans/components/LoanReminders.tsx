import type { LoanWithStats } from '@/data/repositories/loans';
import { Button, Dialog, ListGroup, ListRow, OptionList, Select, Sheet, Switch, TimePicker, useStyles } from '@/design';
import type { Theme } from '@/design';
import { useLoanReminders } from '@/features/loans/hooks/useLoanReminders';
import { DEFAULT_DUE_DAYS, DEFAULT_MONTHLY_DAY, DEFAULT_REMINDER_TIME, DUE_REMINDER_DAYS, MONTHLY_DAYS, timeOf, timeText } from '@/features/loans/loan-rules';
import type { DueReminderDays } from '@/features/loans/loan-rules';
import { formatDate } from '@/shared/date/date';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const isDueDays = (value: number | null | undefined): value is DueReminderDays => DUE_REMINDER_DAYS.includes(value as DueReminderDays);

const clock = (saved: string) => {
  const { hour, minute } = timeOf(saved);
  return formatDate(new Date(2000, 0, 1, hour, minute), { hour: 'numeric', minute: '2-digit' });
};

/**
 * A loan's two reminders: one ahead of its due date, one every month for a
 * loan repaid in instalments. Each change is saved on the loan and the
 * phone's scheduled reminders are rebuilt from what is saved, so the two can
 * never disagree.
 */
export function LoanReminders({ loan }: { loan: LoanWithStats }) {
  const { t } = useTranslation('loans');
  const styles = useStyles(createStyles);
  const reminders = useLoanReminders();

  const dueDays = isDueDays(loan.dueReminderDaysBefore) ? loan.dueReminderDaysBefore : DEFAULT_DUE_DAYS;
  const dueTime = loan.dueReminderTime ?? loan.emiReminderTime ?? DEFAULT_REMINDER_TIME;
  const monthlyDay = loan.emiReminderDay ?? DEFAULT_MONTHLY_DAY;
  const monthlyTime = loan.emiReminderTime ?? DEFAULT_REMINDER_TIME;

  const [picking, setPicking] = useState<'dueTime' | 'monthlyTime' | 'monthlyDay' | null>(null);
  /** The time being chosen, kept here until Done so the reminder is rescheduled once, not on every tap. */
  const [time, setTime] = useState(timeOf(DEFAULT_REMINDER_TIME));
  const [denied, setDenied] = useState(false);

  // Switching on asks for permission where needed; a refusal leaves the switch off and says what to do.
  const orDenied = async (scheduled: Promise<boolean>) => { if (!(await scheduled)) setDenied(true); };
  const setDue = (on: boolean) => (on ? orDenied(reminders.scheduleDueReminder(loan, dueDays, dueTime)) : reminders.cancelDueReminder(loan));
  const setMonthly = (on: boolean) => (on ? orDenied(reminders.scheduleEmiReminder(loan, monthlyDay, monthlyTime)) : reminders.cancelEmiReminder(loan));

  const openTime = (which: 'dueTime' | 'monthlyTime') => { setTime(timeOf(which === 'dueTime' ? dueTime : monthlyTime)); setPicking(which); };
  const saveTime = () => {
    const chosen = timeText(time);
    if (picking === 'dueTime') void orDenied(reminders.scheduleDueReminder(loan, dueDays, chosen));
    if (picking === 'monthlyTime') void orDenied(reminders.scheduleEmiReminder(loan, monthlyDay, chosen));
    setPicking(null);
  };

  return (
    <>
      <ListGroup>
        <ListRow
          icon="bell"
          title={t('reminders.due')}
          subtitle={loan.dueDate ? (loan.dueReminderEnabled ? `${t(`reminders.days.d${dueDays}`)} · ${clock(dueTime)}` : t('reminders.dueOff')) : t('reminders.noDueDate')}
          disabled={!loan.dueDate}
          trailing={<Switch value={loan.dueReminderEnabled && !!loan.dueDate} onValueChange={setDue} disabled={!loan.dueDate} accessibilityLabel={t('reminders.due')} />}
        />
        {loan.dueReminderEnabled && loan.dueDate ? (
          <View style={styles.options}>
            <ListRow
              title={t('reminders.dueWhen')}
              trailing={
                <Select
                  title={t('reminders.dueWhen')}
                  options={DUE_REMINDER_DAYS.map((days) => ({ key: String(days), label: t(`reminders.days.d${days}`) }))}
                  value={String(dueDays)}
                  onChange={(days) => void orDenied(reminders.scheduleDueReminder(loan, Number(days), dueTime))}
                  accessibilityLabel={t('reminders.dueWhen')}
                />
              }
            />
            <ListRow title={t('reminders.time')} value={clock(dueTime)} onPress={() => openTime('dueTime')} />
          </View>
        ) : null}
        <ListRow
          icon="repeat"
          title={t('reminders.monthly')}
          subtitle={loan.emiReminderEnabled ? `${t('reminders.dayOfMonth', { day: monthlyDay })} · ${clock(monthlyTime)}` : t('reminders.monthlyOff')}
          trailing={<Switch value={loan.emiReminderEnabled} onValueChange={setMonthly} accessibilityLabel={t('reminders.monthly')} />}
        />
        {loan.emiReminderEnabled ? (
          <View style={styles.options}>
            <ListRow title={t('reminders.monthlyDay')} value={t('reminders.dayOfMonth', { day: monthlyDay })} onPress={() => setPicking('monthlyDay')} />
            <ListRow title={t('reminders.time')} value={clock(monthlyTime)} onPress={() => openTime('monthlyTime')} />
          </View>
        ) : null}
      </ListGroup>

      <Sheet visible={picking === 'dueTime' || picking === 'monthlyTime'} onClose={() => setPicking(null)} title={t('reminders.pick.time')} footer={<Button label={t('reminders.done')} onPress={saveTime} />}>
        <View style={styles.time}>
          <TimePicker value={time} onChange={setTime} minuteStep={5} />
        </View>
      </Sheet>
      <Sheet visible={picking === 'monthlyDay'} onClose={() => setPicking(null)} title={t('reminders.pick.day')}>
        <OptionList
          groups={[{ options: MONTHLY_DAYS.map((day) => ({ key: String(day), title: t('reminders.dayOfMonth', { day }) })) }]}
          selectedKey={String(monthlyDay)}
          onSelect={(day) => { setPicking(null); void orDenied(reminders.scheduleEmiReminder(loan, Number(day), monthlyTime)); }}
        />
      </Sheet>
      <Dialog visible={denied} onRequestClose={() => setDenied(false)} title={t('reminders.denied')} body={t('reminders.deniedBody')}>
        <Button label={t('reminders.ok')} onPress={() => setDenied(false)} />
      </Dialog>
    </>
  );
}

const createStyles = ({ space }: Theme) =>
  StyleSheet.create({
    // The options of a reminder sit under its switch, set in from it.
    options: { paddingLeft: space.xxl },
    time: { alignItems: 'center' },
  });
