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
  month that starts on any day. Testing those turned up two more, fixed: "available" while
  changing a transaction counted that transaction against itself (Q1.05), and a tab chosen just
  after saving could stay blank on Android (Q1.06; tabs now change at once, as on iOS).

## Next

1. I4.11 on a phone: the release installed over a 2.0.x install shows "New in Fintraq 2.1".
2. P1.02 on the Honor (not connected so far), and a restore from a backup file.
3. Owner: `eas build`, internal track, an upgrade from 2.0.2 with real data, rollout,
   `latestVersionConfig` once at 100%, GA4 custom definitions (`cadence`, `on_day`, `action`,
   `state`). Then merge to `develop` and `main`, tag 2.1.0 and push, on his word.

## Not verified

- On iOS, nothing of 2.1.0.
- Restoring a backup file on a phone (the share sheet leads into other apps).
- A real 9:00 repeating-item reminder firing; a TalkBack pass (I4.09).
- The 12 translations are machine translations; none was read on a phone.
- The 2.1 "What is new" note has not been seen on a phone yet (phase Q was, on the Samsung).
- Migration 0011 on a real 2.0.2 install with notes saved as category names (tested on SQLite only).

## Building a test release

The local `android/` is a prebuild (`CI=1 npx expo prebuild --platform android --clean
--no-install`), git-ignored. Set `versionCode 80` in `android/app/build.gradle` so the update
sheet stays away, then build lightly (the defaults froze a 16 GB laptop):
`cd android && nohup nice -n 19 ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2
-Pkotlin.compiler.execution.strategy=in-process "-Dorg.gradle.jvmargs=-Xmx3g -XX:MaxMetaspaceSize=768m"`,
then `./gradlew --stop`.
On a slow network Gradle's own download times out at 10 s: point
`android/gradle/wrapper/gradle-wrapper.properties` at the cached `gradle-9.3.1-all.zip`. Delete
`android/app/build` afterwards; storage is tight.
