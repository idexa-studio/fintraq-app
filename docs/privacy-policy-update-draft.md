# Privacy and Play disclosure update draft

The website policy source in `/Users/ahmed/Documents/Projects/Others/Fintraq/fintraq-website/src/data/privacy-content.tsx` has now been revised locally, including the contact address `admin@idexa.app`. The site edits are not deployed. This file is retained as an implementation and Play Console Data safety checklist; its suggested wording is background material and should not replace the updated website policy. Match all disclosures to the shipped Android build before submitting the Data safety form.

## Why the current disclosure needs an update

The current public policy says Firebase Analytics collects anonymous usage statistics and says financial figures are never transmitted. The app includes Firebase Analytics, Crashlytics, Remote Config, Google sign-in, and optional Google Drive backup. Before this patch, custom Analytics events also sent an amount range, currency, and transaction/account/search metadata. This patch removes those custom event parameters and user traits, but Firebase SDK-generated events and diagnostic data still leave the device when production telemetry is enabled.

## Disclosure points reflected in the website source

### App analytics and diagnostics

When analytics and diagnostics are enabled in a production build, Fintraq uses Firebase Analytics and Firebase Crashlytics to understand app usage and investigate failures. Analytics receives app activity such as screen views and feature-use events, along with app or installation identifiers and information Firebase derives from requests, such as approximate location. Purchase-related analytics may include purchase or product information. Crashlytics receives crash reports, relevant app state, device information, and an installation identifier so we can diagnose crashes and measure their impact.

Fintraq's custom analytics events do not include transaction amounts, transaction notes, balances, account names, or category names. Your finance records are stored on your device for normal offline use. If you choose Google Drive backup or restore, the backup data is sent to or retrieved from your Google Drive account to provide that feature. Google processes information under its applicable service terms and privacy policy.

We use analytics to understand feature usage and improve the app, and diagnostics to find and fix reliability problems. Firebase data is transmitted using encryption in transit. You can use Fintraq's core tracking features offline without connecting a bank or enabling Google Drive backup.

## Play Console Data safety review checklist

Do not keep “No data collected” while production Firebase collection is enabled. Review the exact shipped dependencies and answer the Play form for the app build, including the collection purposes and whether each data type is collected, shared, required, or optional. Firebase's current Play disclosure guide identifies Crashlytics stack traces, relevant app state and device metadata, and its installation UUID; Firebase Analytics and other included SDKs have additional automatic and usage-dependent disclosures.

At minimum, investigate these Play data types against the current SDK versions and usage:

- App activity (screen views and custom feature events).
- Device or other IDs (Firebase installation/app-instance identifiers; check Android Advertising ID behavior for the shipped Analytics configuration).
- Approximate location inferred from IP, if the current Analytics SDK configuration processes it.
- Diagnostics (crash logs, app state, and device metadata).
- Purchase history or purchase-related data for the in-app purchase flow and Analytics integration.
- Google account information and files/data when a user opts into Google Drive backup or restore.

Google Play's form definitions distinguish data collection from data sharing and include data processed by SDKs. Confirm each answer against the exact SDK disclosures and the app's implementation. Do not claim data is anonymous or not collected merely because custom event parameters have been removed.

## App implementation changes

October 2026 rebuild (`src/services/telemetry`, see ARCHITECTURE.md → Analytics & crash reporting):

- Users can turn off analytics and crash reports in Settings → About → *Share usage data*; on by default. Disclose this as optional collection.
- Ad storage, ad user data and ad personalisation consent are always denied; advertising-ID collection is disabled and the Android `com.google.android.gms.permission.AD_ID` permission is removed. Update the Play Console *Advertising ID* declaration to "No" for the build that ships this.
- Custom events carry only enums and result bands; search text, amounts, IDs and concrete screen paths are never sent. Screen names are route templates.
- User properties: Pro status, app language and default currency. `begin_checkout` carries the Pro product id and its store price.

Earlier changes:

- Removed custom Analytics parameters that exposed transaction amount ranges, currency, search metadata, and account/profile traits.
- Kept basic event names and screen views so product usage and acquisition can still be measured.
- Disabled Firebase automatic screen reporting so the app's Expo Router screen views are not also reported by Android Activity tracking.
- Website privacy and terms copy were updated locally in the website repository; deployment remains outstanding.
- Left the Play Data safety form unchanged because its exact SDK data types, purposes, and optionality must be reconciled against the production build before submission.

## References

- [Firebase Android Play data disclosure guide](https://firebase.google.com/docs/android/play-data-disclosure)
- [Google Play Data safety requirements](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Analytics data collection and disclosure](https://support.google.com/analytics/answer/11582702)
