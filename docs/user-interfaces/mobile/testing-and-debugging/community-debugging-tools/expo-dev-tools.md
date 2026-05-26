---
title: "Expo Dev Tools"
id: "expo-dev-tools"
sidebar_label: "Expo Dev Tools"
last_update: { author: "Praneeth Reddy" }
---

# Expo Dev Tools

Built-in development tools from the Expo CLI for debugging your mobile app on a **device or simulator** while `npx expo start` is running. Use this page for **Expo Go** and **development builds**. For Studio **web preview** in the browser, use [Chrome DevTools](./chrome-devtools).

**Platform support:**

- ❌ Web preview
- ✅ Expo Go / development build (development mode)
- ❌ Release build (APK/IPA): use [WavePulse](../wm-debugging-tools/wavepulse) for WaveMaker debugging on installed builds

:::note Primary debugger
For full debugging (Console, Sources, Network, Components), use [React Native DevTools](./react-native-devtools). Press **`j`** in the Expo CLI terminal after the app is running, or choose **Open DevTools** from the developer menu on the device or simulator.

Use the sections below for the developer menu, performance overlay, and element inspector. For WaveMaker widgets, variables, and services on device, also see [WavePulse](../wm-debugging-tools/wavepulse).
:::

## Run the app with Expo CLI

Export or run your mobile app, then start the dev server from the project directory. See [Expo Go / Development Build](../debugging-overview#expo-go--development-build) in the debugging overview and [Mobile build overview](/docs/build-and-deploy/build/mobile/overview) for export and run options.

```bash
npx expo start
```

Connect a device or simulator (`i` for iOS simulator, `a` for Android emulator, or scan the QR code for a physical device).

If logs are missing in the console, set `"enableLogs": true` under `preferences` in `src/main/webapp/wm_rn_config.json` and restart the dev server. See [Enabling logs in WaveMaker mobile app](../debugging-overview#enabling-logs-in-wavemaker-mobile-app).

## Expo CLI shortcuts

While the dev server is running, use these keys in the terminal:

```bash
# Press 'j' - Open React Native DevTools
# Press 'm' - Open developer menu on connected device/simulator
# Press 'shift + m' - More tools menu (plugins and extra actions)
# Press 'r' - Reload app
# Press '?' - Show all options
```

Press **`?`** anytime to see the full list for your installed Expo CLI version.

## Developer menu

Open the developer menu on the running app:

- **Terminal:** Press **`m`** where `npx expo start` is running
- **Physical device:** Shake the device
- **iOS Simulator:** `Cmd` + `D`, or `Ctrl` + `Cmd` + `Z`
- **Android Emulator:** `Cmd` + `M` (Mac) or `Ctrl` + `M` (Windows/Linux)

**Common options:**

- **Reload**
- **Open DevTools** (React Native DevTools; includes React component inspection)
- **Toggle element inspector**
- **Toggle performance monitor**
- **Go Home** (return to Expo Go or dev client home)
- **Fast Refresh** (toggle automatic JS reload on save)

Remote JavaScript debugging is deprecated on current React Native stacks that use Hermes. Use **Open DevTools** or **`j`** in the terminal instead.

## Performance monitor

Enable from the developer menu (**Toggle performance monitor**) or from the Expo CLI **More tools** menu (`Shift` + `m`).

**Displays:**

- RAM usage
- JavaScript heap size
- View counts
- UI and JS thread frame rates

## Element inspector

Enable from the developer menu (**Toggle element inspector**) or from the Expo CLI **More tools** menu (`Shift` + `m`).

**Features:**

- Tap components to inspect
- View component props and styles
- Navigate the component hierarchy
- Highlight component boundaries

For deeper React inspection, use [React Native DevTools](./react-native-devtools) (**`j`** in the terminal or **Open DevTools** in the menu).

---

## React Native Debugger (standalone, legacy)

The standalone [React Native Debugger](https://github.com/jhen0409/react-native-debugger) relied on remote JS debugging, which is deprecated on Hermes-based apps. WaveMaker mobile apps use Hermes; prefer [React Native DevTools](./react-native-devtools) instead.

If you maintain an older project that still supports remote debugging, install from the [GitHub releases](https://github.com/jhen0409/react-native-debugger/releases) or `brew install --cask react-native-debugger` on macOS.

---

## Related Documentation

**Primary Debugging Tools:**

- [React Native DevTools](./react-native-devtools) – Integrated debugging for Expo and dev builds
- [Chrome DevTools](./chrome-devtools) – Browser debugging for web preview
- [React DevTools](./react-devtools) – React component inspection (also available inside React Native DevTools)
- [WavePulse](../wm-debugging-tools/wavepulse) – WaveMaker debugging tool

**Additional Debugging Tools:**

- [Reactotron](./reactotron) – Community debugging tool with custom logging

**Testing Documentation:**

- [Debugging Overview](../debugging-overview) – All debugging tools and methods
- [UI Testing Mobile](../testing-strategies/ui-testing-mobile) – Mobile testing strategies

**Build Documentation:**

- [Expo Builds](/docs/build-and-deploy/build/mobile/expo) – Expo EAS Build setup
- [CLI Builds](/docs/build-and-deploy/build/mobile/cli) – Local builds with Expo CLI

**External Resources:**

- [Expo debugging tools](https://docs.expo.dev/debugging/tools/) – Official Expo guide (CLI shortcuts and developer menu)
- [Expo runtime issues](https://docs.expo.dev/debugging/runtime-issues/) – Debugging strategies

:::tip
Start with [React Native DevTools](./react-native-devtools) (`j` in the terminal) for day-to-day debugging. Use this page when you need the on-device developer menu, performance overlay, or element inspector.
:::
