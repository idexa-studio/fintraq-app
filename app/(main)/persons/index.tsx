import { Redirect } from 'expo-router';
import React from 'react';

/** `/persons`, the path of the shipped app. People live at `/people` now. */
export default function LegacyPeopleRoute() {
  return <Redirect href="/people" />;
}
