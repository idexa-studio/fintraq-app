/** The i18n key for a time-of-day greeting ("Good morning" …). */
export function getGreetingKey(date: Date = new Date()): 'common.goodMorning' | 'common.goodAfternoon' | 'common.goodEvening' {
  const h = date.getHours();
  if (h < 12) return 'common.goodMorning';
  if (h < 17) return 'common.goodAfternoon';
  return 'common.goodEvening';
}
