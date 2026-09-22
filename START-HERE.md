# Tabayyan — repaired source

## Install and build

This is source code, not a prebuilt IPA. Keep a backup of your existing app folder.
Copy these files into the existing app repository. Preserve your local .env and .git.
No backend changes or new API endpoints are required.

The workflow still builds an unsigned IPA with Expo prebuild, CocoaPods and Xcode.
It now checks that TabayyanAction.appex is embedded before packaging.
Node is updated from 20 to 22 because Expo SDK 57 requires Node 22.13 or later.
The API URL is preserved from the supplied archive: http://10.66.66.2:8000.
Your phone needs access to that private network (for example, your configured VPN).
If your server has moved, update EXPO_PUBLIC_API_BASE_URL in the workflow before building.

Run npm install in the app directory when installing this source copy.
Push your changes to main to trigger the existing GitHub workflow.
Generated ios/, dependencies, local credentials, caches and git history are intentionally
not included in this ZIP. A fresh GitHub build regenerates the native project.
For an existing locally generated native project, back up manual native edits first,
then regenerate with: npx expo prebuild --platform ios --clean

## IMPORTANT: signing and the action list

The lower share-sheet action is a native Action Extension, not a Share Extension.
Its title is “تحقّق عبر تبيّن” / “Verify with Tabayyan”.

When signing the downloaded IPA, your signing tool MUST retain and sign:

- The main application: com.roolxi.tabayyan
- PlugIns/TabayyanAction.appex: com.roolxi.tabayyan.action
- The matching App Group entitlement on BOTH targets: group.com.roolxi.tabayyan

The App Group must be authorized by the provisioning profiles. Merely adding the
entitlement in source does not grant permission. If your signing service strips extensions
or cannot provision App Groups, this cannot be repaired with JavaScript.

After installing the NEW IPA, open Tabayyan once. In Instagram/TikTok/YouTube choose
the SYSTEM share sheet, scroll to the actions, and enable the action under Edit Actions
if iOS offers it. iOS controls ordering and the host controls which attachment types
it shares. Do not look only in Instagram's in-app contacts panel.

An iOS Action Extension is NOT guaranteed permission to launch its containing app.
The action saves a link to the shared container, tries the public extension-context open
API, and otherwise instructs you to open Tabayyan manually. On launch/foreground,
Tabayyan reads the pending link and starts the existing URL job flow.
No private API or responder-chain trick is used. I cannot guarantee a one-tap app
launch under iOS's extension restrictions.

If shared storage is unavailable, the extension shows a signing error instead of
falsely claiming the link was saved. Pasting a link on the scan screen remains available.

## Repairs

- Fixed a dangling PBXBuildFile reference for the embedded .appex.
- Added a real app-to-extension build dependency (including missing Xcode sections).
- Fixed extension source paths and used a localized resource variant group.
- Fixed the Swift principal class/module mismatch.
- Enabled URL/text matching with mixed host attachments and inspect providers until
  a valid link is found, instead of stopping at the first thumbnail/title.
- Used URLComponents/query items to preserve nested query strings.
- Added cold-start/foreground pending-link handling; clear by payload ID only after
  the backend accepts the request, so an older request cannot erase a newer share.
- Removed double URL decoding. Added retry for a failed shared-link request.
- Switched page transitions from fade to native slide; dock navigation reuses routes.
- Cancelled stale search requests; candidate selection explicitly uses normal search.
- Fixed route search parameters, keyboard taps, empty states and search loading skeletons.
- Added clearer typography, a home link-verification shortcut, restrained backgrounds,
  an outer loading ring, and accessibility-aware loading motion.
- Suspended ambient motion and sensor subscriptions when screens are unfocused/backgrounded.
- Fixed an asynchronous accelerometer subscription leak.
- Improved JSON cancellation/listener cleanup and cancellable polling delays.

## Validation already completed

47 JavaScript/TypeScript tests passed, TypeScript typecheck passed, and Expo iOS
prebuild completed on this Linux environment. A new test executes the actual plugin
and checks packaging references, dependency, localized resources and repeatability.
No further tests were run after the final cosmetic loading-ring/callback cleanup.

Xcode compilation, CocoaPods, signing, physical iPhone installation, visual smoothness,
and actual third-party app sharing were NOT tested here. No backend was provided;
live extraction and server availability were not verified.
