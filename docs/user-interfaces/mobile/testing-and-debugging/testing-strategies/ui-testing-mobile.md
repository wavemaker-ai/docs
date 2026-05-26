---
last_update: { author: "Praneeth Reddy" }
---

# Mobile app testing

Testing is a critical part of building high-quality mobile applications with WaveMaker. A strong testing strategy helps your app work correctly, perform well, and behave consistently on **iOS and Android** devices.

WaveMaker supports multiple testing approaches to validate quality, usability, and performance.

## Types of testing

- **Manual testing**
  - Validates workflows, UI behavior, and real user interactions.
  - Helps identify usability issues and edge cases.

- **Automation testing**
  - Enables repeatable UI and functional testing.
  - Uses tools such as Appium, WebDriverIO, Mocha, and TypeScript. See [Automated testing](automate-testing.md) for setup and workflows.

- **Visual testing**
  - Detects UI layout or styling regressions.
  - Compares screenshots with baseline images.

- **Accessibility testing**
  - Validates VoiceOver (iOS) and TalkBack (Android) behavior.
  - Confirms labels, hints, and focus order on device.

- **Performance testing**
  - Measures responsiveness, resource use, and load handling.

- **Device compatibility testing**
  - Ensures stability across screen sizes, devices, and OS versions.

### Tools and infrastructure

- Physical devices and simulators
- [BrowserStack](https://www.browserstack.com/) for cloud device testing
- Appium and WebDriverIO for automation
- Jenkins for CI/CD integration
- Allure Reports for test reporting
- Apptim for performance profiling

---

## Manual testing

Manual testing validates real-world usability and end-to-end workflows.

### Key validation areas

- Functional workflows and feature validation
- UI consistency and visual checks
- Behavior on different phones, tablets, and OS versions
- Early bug identification

Test in **Studio web preview** for quick UI checks, and on a **simulator or physical device** (Expo Go or a development build) for native behavior, gestures, and performance.

While testing manually, use [Debugging overview](../debugging-overview) for logs, network calls, and component inspection ([React Native DevTools](../community-debugging-tools/react-native-devtools) on device, [Chrome DevTools](../community-debugging-tools/chrome-devtools) in web preview).

---

## Automation testing

WaveMaker supports automation with industry-standard frameworks. This page summarizes the role of automation; for prerequisites, CLI setup, sample tests, and CI integration, see **[Automated testing](automate-testing.md)**.

Automation typically covers:

- Functional and end-to-end workflows
- UI interaction and regression checks
- Runs on local devices, emulators, or cloud farms (for example BrowserStack)
- Visual regression with screenshot comparison tools such as Pixel Match

---

## Performance testing

Performance testing helps ensure smooth experiences under real conditions.

### Key performance areas

- Application launch time
- Screen load and transition performance
- CPU and memory usage
- Network request performance
- Frame rendering stability
- Memory leaks and dropped frames

### Performance tools

- **On device (development):** developer menu **performance monitor** and [React Native DevTools](../community-debugging-tools/react-native-devtools) Profiler tab. See [Expo Dev Tools](../community-debugging-tools/expo-dev-tools).
- **Lab / cloud:** BrowserStack performance testing, Apptim for CPU, memory, and resource analysis

### Important metrics

- Time to interactive (TTI)
- Screen rendering time
- Frame rate stability
- Resource utilization

---

## Accessibility testing

Accessibility testing confirms your app works with assistive technologies on device. Mobile apps use **VoiceOver** on iOS and **TalkBack** on Android, not browser-only patterns such as ARIA or keyboard-only web flows.

### What to validate

- Spoken labels match control purpose (caption, **Accessibility label**, **Hint**)
- Decorative elements are skipped (**Accessible** set appropriately)
- Focus order and navigation are logical with the screen reader on
- Contrast and touch targets are usable on real devices

### Configure and test in WaveMaker

In Studio, set **Accessibility** properties on widgets (**Hint**, **Accessibility label**, **Accessibility role**, **Accessible**, **Alt text**, and related fields). Full guidance is in [Accessibility](../../enterprise-capabilities/accessibility.md).

Always verify on a **physical device or simulator** with VoiceOver or TalkBack enabled. Studio preview does not fully match on-device screen reader behavior.

---

## Device compatibility testing

Device compatibility testing ensures the app behaves consistently across hardware and OS versions.

### Testing objectives

- Validate layout across screen sizes and densities
- Verify phones and tablets
- Test multiple Android and iOS versions
- Catch platform-specific issues (permissions, native APIs, gestures)

### Testing methods

- Real devices and local simulators
- Cloud platforms such as BrowserStack
- Different OS versions and resolutions

---

## Summary

A balanced mobile testing strategy combines:

- Manual validation in preview and on device
- [Automated testing](automate-testing.md) for regression and CI
- Visual and performance checks
- [Accessibility](../../enterprise-capabilities/accessibility.md) verified with screen readers on device
- Device and OS coverage on iOS and Android

---

## Related documentation

- [Automated testing](automate-testing.md) – Appium, WebDriverIO, setup, and CI
- [Unit testing (mobile)](../unit-testing/unit-testing-mobile) – Jest and React Native Testing Library for custom logic
- [Debugging overview](../debugging-overview) – Debug while testing manually
- [Accessibility](../../enterprise-capabilities/accessibility.md) – Studio properties and on-device testing
- [Mobile build overview](/docs/build-and-deploy/build/mobile/overview) – Export and run apps for test environments
