---
last_update: { author: "Praneeth Reddy" }
---

# Localization

Localization is the process of adapting an application to meet the language, cultural, and regional preferences of users. In WaveMaker, localization enables applications to be rendered in multiple languages and formats, making them more usable and relevant for a global audience. Localization support in WaveMaker is provided at two levels: **Application Localization** and **Platform Localization**.

## Application Localization

Application localization lets your mobile app present UI text and regional formats in different languages:

- **Default language and locale:** In **Project Settings**, configure the default language and locale for the app. This sets the language and regional formats (date, time, currency) used when the app starts and no other locale is stored yet.

- **Select Locale widget:** Add the **Select Locale** widget to a page so users can pick a display language from the languages you enabled for the project. The widget is bound to the `supportedLocale` variable. When the user selects a language, the app calls `App.changeLocale`, loads the locale bundle, updates UI text and formats, and refreshes the screen. If the switch changes layout direction (RTL ↔ LTR), the app may restart on device.

To support localization within the app, maintain a **dictionary of localized messages** (keys and translated values) and bind widget **Caption** and other text to those keys (for example `appLocale.LABEL_WELCOME`). See [Binding to localized messages](/docs/user-interfaces/mobile/develop/integrating-with-apis/bind-expressions#binding-to-localized-messages) for binding patterns.

## Platform Localization *(Enterprise only)*

Platform localization lets developers work in WaveMaker Studio in their preferred language. This applies to the Studio and Launchpad experience, not to your exported mobile app UI. It is available in the **Enterprise** edition.

### Setting language preference

- Developers can set a **personal preferred language** in their Studio profile.
- Administrators can configure a **default language for all users** from Launchpad.

### Adding language bundles

To add languages in Studio:

1. Copy an existing English bundle file (`en.properties` or `en.json`).
2. Rename it with the target locale identifier (for example `de.properties` for German).
3. Translate the content.
4. Add the files to the required resource locations for Launchpad, Studio frontend, and backend modules.

WaveMaker includes English and German bundles by default. New locales are added by placing language files in the correct module directories so Studio UI and backend services can load them.

## How localization works in the app

When the app supports multiple languages:

- On first launch, the app uses the default language and locale from **Project Settings**.
- After a user picks a language with **Select Locale**, that choice is saved on the device and restored on the next launch.
- The app loads the locale bundle for the active language (message keys and format settings for date, time, and currency).
- Widgets bound to `appLocale` keys show translated text for the active locale.
- Date, time, number, and currency widgets use formats from the active locale.
- For right-to-left languages (such as Arabic or Hebrew), layout direction follows the locale. Switching between a left-to-right and a right-to-left language on a device build may require restarting the app for layout to apply fully.

Test language switching on a device or simulator. Studio preview may not match every on-device locale behavior.

## Summary

WaveMaker localization helps mobile apps reach a global audience with multiple languages and regional formatting. **Application localization** controls what end users see in the app. **Platform localization** controls the language developers use in Studio (Enterprise). Together they improve usability for both app users and your team.

## Related topics

- [Bind expressions](/docs/user-interfaces/mobile/develop/integrating-with-apis/bind-expressions/) for `appLocale` bindings and formatters
- [Variables](/docs/user-interfaces/mobile/develop/integrating-with-apis/variables/) including `supportedLocale`
