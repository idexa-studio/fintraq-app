# Handoff

Where Fintraq stands, for whoever picks it up next. Facts and rules are in `CLAUDE.md`; every
task, done and open, is in `docs/PLAN.md`. Updated 2026-11-02.

## Now

- **Branch:** `release/2.1.0`, cut from `develop` after 2.0.2. Nothing on it is pushed; the owner
  says when. Commits are local, in Conventional Commits form, with no Claude attribution.
- **Version:** 2.1.0 in `app.json` and `package.json`; the build number comes from EAS. Release
  notes for the 15 store languages are in `update-note.txt`.
- **In the release:** repeating items (phase I), the spendable balance (O), the 320-wide pass of
  every screen size (N3), R8 on the store build (P1), the "What is new" note for 2.1 (I4.11), and
  three customer reports (Q): a changed category not showing, search for people, and a budget
  month that starts on any day.

## Next

1. Q1.01 to Q1.03 on a phone: a release APK built from this branch, installed fresh on the
   Samsung (see "Building a test release" below).
2. I4.11 on a phone: the release installed over a 2.0.x install shows "New in Fintraq 2.1".
3. P1.02 on the Honor (not connected so far), and a restore from a backup file.
4. Owner: `eas build`, internal track, an upgrade from 2.0.2 with real data, rollout,
   `latestVersionConfig` once at 100%, GA4 custom definitions (`cadence`, `on_day`, `action`,
   `state`). Then merge to `develop` and `main`, tag 2.1.0 and push, on his word.

## Not verified

- On iOS, nothing of 2.1.0.
- Restoring a backup file on a phone (the share sheet leads into other apps).
- A real 9:00 repeating-item reminder firing; a TalkBack pass (I4.09).
- The 12 translations are machine translations; none was read on a phone.
- The Q fixes and the 2.1 "What is new" note have tests but have not been seen on a phone yet.

## Building a test release

The local `android/` is a prebuild (`CI=1 npx expo prebuild --platform android --clean
--no-install`), git-ignored. Set `versionCode 80` in `android/app/build.gradle` so the update
sheet stays away, then `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a`.
On a slow network Gradle's own download times out at 10 s: point
`android/gradle/wrapper/gradle-wrapper.properties` at the cached `gradle-9.3.1-all.zip`. Delete
`android/app/build` afterwards; storage is tight.
