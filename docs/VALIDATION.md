# Validation and review status

## Completed

- TypeScript: `npx tsc --noEmit` passed after the native motion components and isolated preview harness were added.
- Unit/contract suite: 61 tests passed. Includes original multipart upload, supported media URLs, cancellation, latest-request guards, native-intent URL encoding, and Xcode extension packaging tests. Six presentation/state regressions were added. The obsolete assertion requiring the old tab dock's route animation was removed because the dock is no longer part of the app shell.
- Production web export passed.
- Production iOS and Android Hermes bundle exports passed. iOS was exported again after adding the Silk shader and the collapsing intro.
- Preview fixture bundle generated successfully from the same React Native screen/components. Fixtures exist only in `scripts/visual-entry.tsx`, which is not the production entry point.

## Not completed

- No physical iPhone or iOS simulator session was available.
- No Xcode compilation, signed IPA installation, or native shader rendering test was performed.
- No visual screenshot approval: the available browser could not open this environment's local preview. Bundle generation is not visual validation.
- No claim that the original iOS Action Extension's app-opening issue is fixed. Its Swift/native project files were preserved.
- No measured FPS, memory, heat, energy usage, or comparison to ChatGPT/Gemini.
- Native keyboard animation, safe-area behavior on specific iPhones, dynamic text scaling and native Liquid Glass refraction still require device review.

## Five-minute device visual review

1. Open the home screen on an iPhone. Check the entry field and primary action are immediately available; inspect native glass with the green Silk field behind it.
2. Tap and drag Quran/Hadith. Verify the elastic thumb; enter text and switch context to confirm that it clears. Switch normal/meaning/specialist and confirm the text stays.
3. Open and interactively dismiss the keyboard several times. Check the stationary background reaches every edge and the action stays reachable.
4. Start a request: intro collapses, arrow morphs into stop, input remains, loading trace opens. Cancel and immediately switch context to look for stale results.
5. Pick an image/video, inspect the attachment, submit, expand result details, trigger an error and swipe/dismiss or retry.
6. Enable Reduce Motion and Reduce Transparency; background/gesture motion should stop or simplify and surfaces should become opaque.
7. In a native development/release build, exercise the original share extension on a real iPhone. Expo Go is not an extension test.

## Source preservation

The transport modules under `src/api`, `.env`, native bridge, native-intent parser, App Group plugin/Swift extension and existing build workflow came from `app.zip`. The previous rework's changes to server configuration and extension behavior were not adopted.
