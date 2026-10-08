import { Redirect } from 'expo-router';
import React from 'react';

/** `/analytics`, the tab's path in the shipped app. It is Insights now. */
export default function LegacyAnalyticsRoute() {
  return <Redirect href="/insights" />;
}
