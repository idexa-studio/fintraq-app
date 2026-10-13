/** Public surface of people: reading and changing them, and their screens. */
export * from './hooks/people';
export { initialsOf, peopleByStanding, standingOf } from './person-form';
export type { PersonBalance } from './person-form';
export { PeopleScreen } from './screens/PeopleScreen';
export { PersonScreen } from './screens/PersonScreen';
export { PersonFormScreen } from './screens/PersonFormScreen';
