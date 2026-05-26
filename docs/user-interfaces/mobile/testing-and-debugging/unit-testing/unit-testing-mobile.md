---
title: Unit testing (mobile)
sidebar_label: Unit testing
last_update: { author: "Praneeth Reddy" }
---

# Unit testing (mobile)

Unit tests check **small units of code in isolation**: utility functions, custom hooks, WMX component logic, or page script helpers you maintain in your mobile app. They run on your machine with **Jest** and do not require a simulator.

WaveMaker Studio does not generate a full unit test suite for every page. Most teams combine **unit tests** for custom logic, **manual testing** while building, and **[Appium end-to-end tests](../testing-strategies/automate-testing.md)** for full flows on device.

## What to unit test

| Good candidates                                                 | Usually not unit-tested                                |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| Custom JavaScript or TypeScript in page/partial **Script** tabs | Every `wm-*` widget markup line Studio generates       |
| Shared helpers under `src/` in the exported app                 | Full navigation across many screens without mocks      |
| WMX custom components you author                                | Native camera, biometrics, or push (use device or E2E) |
| Pure functions (formatting, validation rules)                   | REST calls without mocking the client                  |

For whole-screen behavior on a real build, use [Mobile app testing](../testing-strategies/ui-testing-mobile.md) and [Automated testing](../testing-strategies/automate-testing.md).

## Recommended stack

WaveMaker React Native apps and `@wavemaker/app-rn-runtime` use:

| Package                           | Role                                        |
| --------------------------------- | ------------------------------------------- |
| **Jest**                          | Test runner                                 |
| **jest-expo**                     | Preset for Expo and React Native transforms |
| **@testing-library/react-native** | Render components and simulate `press`      |
| **react-test-renderer**           | Required peer for RN tests                  |

Add these in your **exported app** project (or a dedicated test package), not inside Studio:

```bash
npm install --save-dev jest jest-expo @testing-library/react-native react-test-renderer @types/jest
```

## Jest configuration

Minimal `jest.config.js` in the project root:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-svg|@wavemaker/.*)',
  ],
};
```

**`jest.setup.js`** (example):

```javascript
import '@testing-library/jest-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

Adjust `transformIgnorePatterns` if tests fail to parse a dependency. Match versions to your Expo SDK (see [Expo Jest docs](https://docs.expo.dev/develop/unit-testing/)).

Add a script in `package.json`:

```json
"scripts": {
  "test": "jest"
}
```

## Testing a React Native component

Use **`testID`** for stable queries. WaveMaker sets `testID` on widgets (for example `Login_submitBtn`, `page1_text1_i` on inputs). In tests, use `getByTestId`:

```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

function SubmitButton({ onPress }) {
  return (
    <TouchableOpacity testID="Login_submitBtn" onPress={onPress}>
      <Text>Submit</Text>
    </TouchableOpacity>
  );
}

describe('SubmitButton', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<SubmitButton onPress={onPress} />);

    fireEvent.press(getByTestId('Login_submitBtn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

Prefer **`getByText`**, **`getByLabelText`**, or **`getByRole`** when accessibility labels are set in Studio. Use `testID` when no accessible name exists.

## Testing page script logic

Extract pure logic from page scripts into importable functions under `src/` (for example `src/utils/validateOrder.js`), then test without rendering the full page:

```javascript
import { validateOrder } from '../src/utils/validateOrder';

describe('validateOrder', () => {
  it('rejects empty cart', () => {
    expect(validateOrder({ items: [] })).toEqual({ valid: false, message: 'Cart is empty' });
  });
});
```

Keep WaveMaker **Variables** and services behind thin wrappers so you can `jest.mock()` them in tests.

## Mocking native and Expo modules

Mock modules that touch the device when unit testing UI:

```javascript
jest.mock('expo-camera', () => ({
  Camera: { requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })) },
}));
```

Follow each library’s Jest guidance (AsyncStorage, location, notifications). For behavior that depends on the real native stack, use manual or Appium tests instead.

## Coverage and CI

Run with coverage when needed:

```bash
npm test -- --coverage
```

In CI, run `npm ci` and `npm test` on the exported app repo after you add tests. Set coverage thresholds only when your team agrees on targets.

## Practices

- Test **behavior** users see (labels, press outcomes), not internal component state.
- **Mock** network and native APIs; do not call production services from unit tests.
- Keep tests **fast** and independent; clear mocks in `afterEach` when needed.
- Use descriptive names: `rejects invalid email format`, not `test 1`.

## Related documentation

- [Mobile app testing](../testing-strategies/ui-testing-mobile.md) — Manual, accessibility, and performance
- [Automated testing](../testing-strategies/automate-testing.md) — Appium and WebDriverIO on device
- [Debugging overview](../debugging-overview) — Logs and inspectors while developing tests
- [Expo: Unit testing](https://docs.expo.dev/develop/unit-testing/) — Official Jest and jest-expo setup
