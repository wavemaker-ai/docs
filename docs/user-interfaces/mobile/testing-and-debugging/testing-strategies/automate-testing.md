---
last_update: { author: "Praneeth Reddy" }
---

# Automated testing

Automated testing helps you validate WaveMaker mobile apps on **iOS and Android** with repeatable scripts. WaveMaker does not ship a built-in test runner; you use industry tools—**Appium**, **WebDriverIO (WDIO)**, **Mocha**, and optional **Allure** or cloud farms such as **BrowserStack**—against a built app (APK, IPA, or a dev build on a simulator or device).

For manual testing, accessibility, and how automation fits the overall strategy, see [Mobile app testing](ui-testing-mobile.md).

## Core stack

| Tool                                  | Role                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| **Appium**                            | Drives the native app on emulator, simulator, or device |
| **WebDriverIO**                       | Test runner, specs, and Appium service integration      |
| **Mocha**                             | Test structure (`describe` / `it`)                      |
| **Allure** (optional)                 | HTML reports, screenshots, failure history              |
| **BrowserStack / Jenkins** (optional) | Cloud devices and CI pipelines                          |

---

## Prerequisites

Install and verify the following before you write tests.

| Requirement         | Notes                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js**         | **16.20.x** or **18.x+** (required for Appium 2.x)                                                                                        |
| **npm**             | Latest stable version                                                                                                                     |
| **Java JDK**        | **11** or higher (Android tooling and Appium)                                                                                             |
| **Android**         | Android Studio, SDK, and an AVD that matches your capability `deviceName` and `platformVersion`                                           |
| **iOS**             | Xcode and a simulator that matches your capabilities (**macOS only**)                                                                     |
| **Appium**          | **2.x** or later (recommended: **2.11.x**)                                                                                                |
| **WebDriverIO CLI** | Latest version                                                                                                                            |
| **Built app**       | APK/IPA or a dev build installed on the emulator or simulator. See [Mobile build overview](/docs/build-and-deploy/build/mobile/overview). |

**Check Node.js:**

```bash
node -v   # Should show v16.20.x or v18.x+
```

**Install Appium, drivers, and WebDriverIO:**

```bash
npm install -g appium@latest

appium driver install uiautomator2   # Android
appium driver install xcuitest       # iOS

npm install -g @wdio/cli

appium -v
appium driver list
```

**Initialize a WDIO project** (in your test repo, not inside `node_modules`):

```bash
npx wdio config
```

---

## Version compatibility

| Component                      | Recommended      | Notes                                                            |
| ------------------------------ | ---------------- | ---------------------------------------------------------------- |
| **Node.js**                    | 16.20.x or 18.x+ | Avoid **Node.js 18.16.x** with **Appium 1.x**                    |
| **Appium**                     | 2.11.x or later  | Appium **2.x** is required for current Node.js releases          |
| **appium-uiautomator2-driver** | 3.7.x+           | Installed with Appium 2.x (`appium driver install uiautomator2`) |
| **appium-xcuitest-driver**     | 5.x+             | Installed with Appium 2.x (`appium driver install xcuitest`)     |
| **WebDriverIO**                | 8.x+             | Matches Appium 2.x W3C capabilities                              |

**Common mismatches:**

- **Appium 1.x + Node.js 18+** — Can fail with ES Module / `uuid` errors. **Fix:** Upgrade to Appium 2.x, or use Node.js 16.x.
- **Mixed Node versions (nvm)** — Install Appium on the **same** Node version you use to run `npx wdio`. Switch with `nvm use` before installing or running tests.

---

## Selectors and WaveMaker `testID`

WaveMaker assigns a stable **`testID`** to each widget in your app (for example `Login_submitBtn` on a button, `page1_text1_i` on a text field). That value is what you configure in Studio as **Automation ID** when you need a fixed id for testing.

On the device, React Native maps **`testID`** to the native **accessibility identifier**. Appium exposes that identifier as **accessibility id** in the UI tree—the name you use in automation scripts, not `testID` literally.

| Where                          | What you see                                         |
| ------------------------------ | ---------------------------------------------------- |
| **Studio / generated source**  | `testID` (Automation ID)                             |
| **Appium inspector / session** | Accessibility id (same string value)                 |
| **WebDriverIO**                | Prefix the id with `~` to select by accessibility id |

```javascript
// Studio testID Login_submitBtn → Appium accessibility id Login_submitBtn → WDIO ~Login_submitBtn
await $('~Login_submitBtn').click();
await expect($('~page1_text1_i')).toBeDisplayed();
```

Set **Automation ID** on widgets you need to target reliably. Prefer these `~` selectors over long XPath paths through the React Native view hierarchy.

---

## Appium capabilities (Android and iOS)

Use **Appium 2** W3C capabilities. Put the **`appium:`** prefix on every Appium-specific field (only `platformName` stays unprefixed). Values below are a **working reference** for WaveMaker React Native apps; replace package/bundle IDs, activity, `deviceName`, and `platformVersion` with your emulator, simulator, and app.

**Where IDs come from:** Check `app.json` in your generated Expo app—`android.package` / `applicationId` and `ios.bundleIdentifier`. Examples use the WaveMaker sample **WMSample** (`com.wavemaker.wmsample` / `com.wmsample`); your project will differ (for example `com.first`).

### Why these settings matter

| Capability                                | Purpose                                                              |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `appium:useJSONSource`                    | JSON hierarchy; often more reliable with React Native on Android     |
| `appium:settings[allowInvisibleElements]` | Finds elements not currently visible (lists, tabs, off-screen items) |
| `appium:settings[enableMultiWindows]`     | Supports overlays, modals, and multi-window UI                       |
| `appium:noReset` (Android example)        | Keeps app data between local test runs                               |
| `appium:settings[snapshotMaxDepth]` (iOS) | Deeper view hierarchy for nested RN layouts                          |

### Android (UiAutomator2)

**Installed app** (no APK path in the session):

```json
{
  "platformName": "Android",
  "appium:platformVersion": "13.0",
  "appium:automationName": "UiAutomator2",
  "appium:appPackage": "com.wavemaker.wmsample",
  "appium:deviceName": "Pixel_4_API_33",
  "appium:appActivity": "com.wavemaker.wmsample.MainActivity",
  "appium:disableSuppressAccessibilityService": false,
  "appium:settings[allowInvisibleElements]": true,
  "appium:settings[enableMultiWindows]": true,
  "appium:useJSONSource": true,
  "appium:noReset": true
}
```

- **`appPackage` / `appActivity`:** Must match your app. Expo builds often use `{package}.MainActivity` with **no** extra leading dot (not `.com.yourapp.MainActivity`).
- **`deviceName` / `platformVersion`:** Must match the AVD (`adb devices` / Android Studio Device Manager).

**APK install each run** — often fewer activity-name problems. Use only the app path and omit `appPackage` / `appActivity`:

```json
{
  "platformName": "Android",
  "appium:platformVersion": "13.0",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "Pixel_4_API_33",
  "appium:app": "/absolute/path/to/app-debug.apk",
  "appium:noReset": true
}
```

### iOS (XCUITest)

```json
{
  "platformName": "iOS",
  "appium:platformVersion": "18.1",
  "appium:automationName": "XCUITest",
  "appium:bundleId": "com.wmsample",
  "appium:settings[snapshotMaxDepth]": 80,
  "appium:disableSuppressAccessibilityService": false,
  "appium:settings[allowInvisibleElements]": true,
  "appium:deviceName": "iPhone 13 Pro",
  "appium:settings[enableMultiWindows]": true,
  "appium:useJSONSource": true
}
```

- **`appium:bundleId`:** From `bundleIdentifier` in `app.json`. You can use `appium:app` with a `.app` or `.ipa` path when installing per run instead.
- **`deviceName` / `platformVersion`:** Must match the booted simulator (`xcrun simctl list devices`).

---

## WebDriverIO configuration

Typical layout:

- `test/specs/` — test files
- `wdio.conf.js` — capabilities and services

Example `wdio.conf.js` fragment (**Android**; add a second capability object or config for iOS):

```javascript
exports.config = {
  runner: 'local',
  port: 4723,
  specs: ['./test/specs/**/*.js'],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:platformVersion': '13.0',
    'appium:automationName': 'UiAutomator2',
    'appium:appPackage': 'com.yourcompany.yourapp',
    'appium:deviceName': 'Pixel_4_API_33',
    'appium:appActivity': 'com.yourcompany.yourapp.MainActivity',
    'appium:disableSuppressAccessibilityService': false,
    'appium:settings[allowInvisibleElements]': true,
    'appium:settings[enableMultiWindows]': true,
    'appium:useJSONSource': true,
    'appium:noReset': true,
  }],
  logLevel: 'info',
  framework: 'mocha',
  reporters: ['spec'],
  services: ['appium'],
  mochaOpts: { timeout: 120000 },
};
```

### Example spec

```javascript
describe('App launch', () => {
  it('shows the welcome control', async () => {
    await expect($('~welcome')).toBeDisplayed();
  });
});
```

---

## Running tests locally

1. Start the **Android emulator** or **iOS simulator** and install your app if needed.

2. In **one terminal**, start Appium (unless WDIO starts it for you):

   ```bash
   appium
   ```

   You should see Appium listening on `http://127.0.0.1:4723`.

3. In **another terminal**, run WebDriverIO:

   ```bash
   npx wdio run wdio.conf.js
   ```

Use separate WDIO configs or capability overrides to switch between Android and iOS.

---

## Cloud and CI/CD

**Cloud (BrowserStack, etc.):** Upload APK/IPA or use your app id; map the same capabilities (`useJSONSource`, invisible elements, multi-window) in the provider’s Appium settings.

**CI/CD (typical flow):**

1. Build APK and/or IPA in the pipeline.
2. Start Appium or use a cloud grid.
3. Run `npx wdio run wdio.conf.js`.
4. Publish Allure or JUnit artifacts.

---

## Reporting and practices

**Allure (optional):** Add `@wdio/allure-reporter`, attach screenshots on failure, and publish the report from CI.

**Best practices:**

- Prefer **`testID`** (`~id`) selectors over brittle XPath.
- Cover critical user journeys first; expand regression over time.
- Match **capabilities to real devices** you use in CI and locally.
- Keep **WaveMaker RN-friendly Appium settings** (`useJSONSource`, `allowInvisibleElements`, `enableMultiWindows`) unless you have a reason to turn them off.

---

## Troubleshooting

Issues below are common when setting up Appium with WaveMaker React Native apps. Try the matching fix before changing test code.

### ES Module / `uuid` errors

**What you see:** `Error [ERR_REQUIRE_ESM]: require() of ES Module ... uuid ...`

**Cause:** **Appium 1.x** with **Node.js 18+**.

**Fix (recommended) — upgrade to Appium 2.x:**

```bash
npm uninstall -g appium
npm cache clean --force
npm install -g appium@latest
appium driver install uiautomator2
appium driver install xcuitest
```

**Or use Node.js 16.x:**

```bash
nvm install 16.20.2
nvm use 16.20.2
npm install -g appium@latest
```

**Or run without a global install:**

```bash
npx appium
```

### Activity name errors (Android)

**What you see:** Activity name does not exist or cannot be launched (sometimes with an extra leading dot, for example `.com.yourapp.MainActivity`).

**Cause:** Wrong `appActivity`, wrong `appPackage`, or a typo in the capability string.

**Fix (recommended):** Use **`appium:app`** with the APK path only and remove `appPackage` and `appActivity` (see [Android APK install](#android-uiautomator2) above).

**If you need the activity name:**

```bash
aapt dump badging /path/to/your.apk | grep launchable-activity
```

If the app is already installed:

```bash
adb shell pm dump com.yourapp.package | grep -A 5 "MAIN:"
```

Typical Expo pattern: `com.yourcompany.yourapp.MainActivity` (full class name, no leading dot).

### Cannot connect to Appium (`127.0.0.1:4723`)

**What you see:** Could not connect to Appium server URL.

**Cause:** Appium is not running.

**Fix:** Start Appium in its own terminal, then run WDIO in another:

```bash
# Terminal 1
appium

# Terminal 2
npx wdio run wdio.conf.js
```

**Check the server is up:**

```bash
lsof -i :4723
```

### Port already in use (4723 or 8081)

**What you see:** `EADDRINUSE: address already in use`.

**Fix:** Stop the process on that port:

```bash
sudo lsof -ti:4723 | xargs kill -9    # Appium
sudo lsof -ti:8081 | xargs kill -9    # Metro bundler (if needed)
```

### Invalid WebDriver capabilities (`undefined`)

**Cause:** Missing **`appium:`** prefix on Appium fields.

**Wrong:**

```json
{
  "platformName": "Android",
  "deviceName": "Pixel_4_API_33",
  "automationName": "UiAutomator2",
  "app": "/path/to/app.apk"
}
```

**Correct:**

```json
{
  "platformName": "Android",
  "appium:deviceName": "Pixel_4_API_33",
  "appium:automationName": "UiAutomator2",
  "appium:app": "/path/to/app.apk"
}
```

### `appium: command not found`

**Cause:** Appium not installed globally, or a different Node version (nvm) than the one used for install.

**Fix:**

```bash
npm list -g appium
npm install -g appium@latest
```

With nvm:

```bash
nvm use 18
npm list -g appium
```

**Alternative:**

```bash
npx appium
```

### Clean reinstall

If problems persist:

```bash
npm uninstall -g appium appium-uiautomator2-driver appium-xcuitest-driver
npm cache clean --force
npm install -g appium@latest
appium driver install uiautomator2
appium driver install xcuitest
appium -v
appium driver list
```

### Verification checklist

Before running tests:

```bash
node -v
appium -v
appium driver list
adb devices                    # Android: emulator listed
xcrun simctl list devices | grep Booted   # iOS: simulator booted
lsof -i :4723                    # Appium listening
```

---

## Related documentation

- [Mobile app testing](ui-testing-mobile.md) — Manual, accessibility, performance, and strategy overview
- [Debugging overview](../debugging-overview) — Logs and inspection while authoring tests
- [Mobile build overview](/docs/build-and-deploy/build/mobile/overview) — Builds you install for automation
