---
title: "Reactotron"
id: "reactotron"
sidebar_label: "Reactotron"
last_update: { author: "Praneeth Reddy" }
---

# Reactotron

Reactotron is a desktop app from Infinite Red for inspecting React Native applications. It is an **optional** add-on for WaveMaker mobile apps: it is not included in Studio and requires setup in an **exported or locally synced** project.

---

## Overview

Reactotron provides a desktop interface for custom logging, benchmarks, image overlays, and custom commands while your app runs in development mode.

**Platform support:**

- ❌ Web preview (use [Chrome DevTools](./chrome-devtools) or [React DevTools](./react-devtools))
- ✅ Expo Go / development build (after you install and configure the plugin)
- ❌ Release build (APK/IPA): use [WavePulse](../wm-debugging-tools/wavepulse)

:::note How Reactotron fits with other tools
Use [React Native DevTools](./react-native-devtools) first (`j` in the Expo CLI terminal, or **Open DevTools** in the developer menu) for breakpoints, Console, Sources, Network, and Components.

Use Reactotron when you want extra logging, benchmarks, or custom commands in a **dev build** you control.

Use [WavePulse](../wm-debugging-tools/wavepulse) for WaveMaker widgets, variables, services, and debugging release installs.

Reactotron and React Native DevTools can run at the same time.
:::

---

## Installation

### Desktop Application

Download and install Reactotron desktop app:

```bash
# macOS
brew install --cask reactotron

# Or download from GitHub releases
# https://github.com/infinitered/reactotron/releases
```

**Supported platforms:**

- macOS
- Windows
- Linux

### React Native plugin

Install the plugin in the **exported or local** project directory (the folder where you run `npx expo start`), not in Studio’s `src/main/webapp` tree alone.

```bash
cd /path/to/your/expo/project

npm install --save-dev reactotron-react-native
```

**Prerequisites:**

- App exported or pulled for local development. See [Set up WaveMaker project locally](/docs/guide/integration/set-up-wavemaker-project-locally/) and [Mobile build overview](/docs/build-and-deploy/build/mobile/overview).
- Reactotron desktop app installed on your machine.
- Physical device and computer on the same network when testing on hardware.

Re-exporting from Studio can overwrite entry files. Re-apply `ReactotronConfig` and the `require` in your app entry if you export again.

---

## Configuration

### Basic Setup

1. Create `ReactotronConfig.js` in your project root:

```javascript
// ReactotronConfig.js
import Reactotron from 'reactotron-react-native';

if (__DEV__) {
  Reactotron
    .configure({
      name: 'WaveMaker Mobile App',
    })
    .useReactNative({
      networking: {
        // Ignore Expo and symbolication requests
        ignoreUrls: /symbolicate|127.0.0.1|localhost/,
      },
    })
    .connect();

  // Clear Reactotron on app load (optional)
  Reactotron.clear();
}

export default Reactotron;
```

2. Import in your app entry point (development only):

In the exported project, add this near the top of the root `App.js` (or the entry file your project uses), **before** other app imports:

```javascript
if (__DEV__) {
  require('./ReactotronConfig');
}
```

3. Start the Reactotron desktop app, then run your app:

```bash
npx expo start
```

Connect a simulator or device (`i`, `a`, or QR code). Reactotron should connect when the dev client loads.

If application logs are empty everywhere, enable `"enableLogs": true` under `preferences` in `src/main/webapp/wm_rn_config.json` in Studio and re-export, or set it in the exported project’s config. See [Enabling logs in WaveMaker mobile app](../debugging-overview#enabling-logs-in-wavemaker-mobile-app).

---

## Features

### 1. Application State Logging

Log structured data and messages to Reactotron.

```javascript
import Reactotron from 'reactotron-react-native';

// Simple logging
Reactotron.log('User logged in successfully');
Reactotron.warn('API response time exceeded threshold');
Reactotron.error('Failed to fetch data', error);

// Structured data display
Reactotron.display({
  name: 'User Profile Data',
  value: {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  },
  important: true, // Highlights in Reactotron UI
});

// Log with preview
Reactotron.log({
  message: 'API Response',
  response: data,
});
```

### 2. Network Monitoring

Automatically tracks network requests made with `fetch` and `XMLHttpRequest`.

```javascript
// Automatically tracked
fetch('https://api.example.com/users')
  .then(response => response.json())
  .then(data => {
    console.log(data);
  });

// View in Reactotron:
// - Request method and URL
// - Request/response headers
// - Request/response body
// - Status code
// - Duration
```

**Configure network monitoring:**

```javascript
Reactotron
  .configure()
  .useReactNative({
    networking: {
      // Ignore specific URLs
      ignoreUrls: /symbolicate|logs/,
      // Ignore requests by content type
      ignoreContentTypes: /^(image)\//,
    },
  })
  .connect();
```

### 3. Performance Benchmarking

Measure performance of specific operations.

```javascript
import Reactotron from 'reactotron-react-native';

// Start benchmark
Reactotron.benchmark('Data Processing');

// ... perform operation
processLargeDataset(data);

// End benchmark (automatically calculates duration)
Reactotron.benchmark('Data Processing');
// Output in Reactotron: "Data Processing: 245ms"

// Nested benchmarks
Reactotron.benchmark('Complete Flow');
Reactotron.benchmark('Data Fetch');
await fetchData();
Reactotron.benchmark('Data Fetch'); // 120ms

Reactotron.benchmark('Data Transform');
transformData();
Reactotron.benchmark('Data Transform'); // 45ms
Reactotron.benchmark('Complete Flow'); // 165ms
```

### 4. Image Overlay

Overlay images on screen for design verification and mockup comparison.

```javascript
import Reactotron from 'reactotron-react-native';

// Overlay design mockup
Reactotron.overlay({
  name: 'Login Screen Design',
  url: 'https://example.com/designs/login-mockup.png',
  opacity: 0.5,
});

// Remove overlay
Reactotron.overlay(null);
```

**Use cases:**

- Compare implementation with designs
- Verify pixel-perfect layouts
- Check responsive design breakpoints

### 5. Custom Commands

Create custom commands that can be triggered from Reactotron UI.

```javascript
import Reactotron from 'reactotron-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear app data command
Reactotron.onCustomCommand({
  command: 'resetAppData',
  handler: () => {
    AsyncStorage.clear();
    Reactotron.log('App data cleared successfully');
  },
  title: 'Reset App Data',
  description: 'Clear all stored data including cache and preferences',
});

// Toggle feature flag
Reactotron.onCustomCommand({
  command: 'toggleFeature',
  handler: (featureName) => {
    const enabled = toggleFeatureFlag(featureName);
    Reactotron.log(`Feature ${featureName}: ${enabled ? 'enabled' : 'disabled'}`);
  },
  title: 'Toggle Feature Flag',
  description: 'Enable/disable feature flags for testing',
  args: [{
    name: 'featureName',
    type: 'string',
  }],
});

// Navigate to specific page
Reactotron.onCustomCommand({
  command: 'navigateTo',
  handler: (pageName) => {
    navigation.navigate(pageName);
    Reactotron.log(`Navigated to ${pageName}`);
  },
  title: 'Navigate to Page',
  description: 'Quick navigation to any page',
  args: [{
    name: 'pageName',
    type: 'string',
  }],
});
```

---

## Using Reactotron with WaveMaker

Examples below use `Reactotron` APIs in page scripts or helper modules in your **exported** project. They are patterns you add manually; Studio does not wire Reactotron automatically.

For built-in inspection of WaveMaker variables and services without custom code, use [WavePulse](../wm-debugging-tools/wavepulse).

### Debug service variables

Track service variable calls and responses (adjust to match your app’s API layer).

```javascript
import Reactotron from 'reactotron-react-native';

// Before service variable call
const callServiceVariable = async (variableName, params) => {
  Reactotron.display({
    name: 'Service Variable Call',
    value: {
      variable: variableName,
      params: params,
      timestamp: new Date().toISOString(),
    },
    important: true,
  });

  try {
    const response = await ServiceAPI.call(variableName, params);

    Reactotron.display({
      name: 'Service Variable Response',
      value: {
        variable: variableName,
        status: 'success',
        data: response,
      },
    });

    return response;
  } catch (error) {
    Reactotron.error('Service Variable Error', {
      variable: variableName,
      error: error.message,
    });
    throw error;
  }
};
```

### Monitor Component Lifecycle

Track component mounting, unmounting, and updates.

```javascript
import React, { useEffect } from 'react';
import Reactotron from 'reactotron-react-native';

const UserProfilePage = ({ userId }) => {
  useEffect(() => {
    Reactotron.log('UserProfilePage mounted', { userId });

    return () => {
      Reactotron.log('UserProfilePage unmounted');
    };
  }, []);

  useEffect(() => {
    Reactotron.log('UserProfilePage userId changed', {
      userId,
      timestamp: Date.now(),
    });
  }, [userId]);

  return <View>...</View>;
};
```

### Track Navigation Flow

Monitor page navigation and route changes.

```javascript
import Reactotron from 'reactotron-react-native';

// Wrap navigation function
const navigateToPage = (pageName, params = {}) => {
  Reactotron.display({
    name: 'Navigation',
    value: {
      from: currentPage,
      to: pageName,
      params: params,
      timestamp: new Date().toISOString(),
    },
  });

  // Your navigation logic
  navigation.navigate(pageName, params);
};

// Track navigation state changes
navigation.addListener('state', (state) => {
  Reactotron.log('Navigation State Changed', {
    routes: state.routes,
    index: state.index,
  });
});
```

### Debug Widget State

Monitor WaveMaker widget state changes.

```javascript
import Reactotron from 'reactotron-react-native';

const FormWidget = ({ name, value, onChange }) => {
  const handleChange = (newValue) => {
    Reactotron.display({
      name: 'Widget State Change',
      value: {
        widget: name,
        oldValue: value,
        newValue: newValue,
      },
    });

    onChange(newValue);
  };

  return <Input value={value} onChange={handleChange} />;
};
```

### Performance Monitoring

Benchmark page load times and data processing.

```javascript
import Reactotron from 'reactotron-react-native';

const loadPageData = async (pageId) => {
  Reactotron.benchmark(`Page ${pageId} Load`);

  // Fetch page configuration
  Reactotron.benchmark('Fetch Config');
  const config = await fetchPageConfig(pageId);
  Reactotron.benchmark('Fetch Config'); // ~100ms

  // Load page data
  Reactotron.benchmark('Load Data');
  const data = await fetchPageData(pageId);
  Reactotron.benchmark('Load Data'); // ~350ms

  // Process and render
  Reactotron.benchmark('Process Data');
  const processed = processData(data, config);
  Reactotron.benchmark('Process Data'); // ~50ms

  Reactotron.benchmark(`Page ${pageId} Load`); // Total: ~500ms

  return processed;
};
```

---

## Reactotron Plugins

Extend Reactotron with additional plugins.

### AsyncStorage Plugin

Inspect and modify AsyncStorage directly from Reactotron.

```bash
npm install --save-dev reactotron-react-native-async-storage
```

```javascript
import Reactotron from 'reactotron-react-native';
import ReactotronAsyncStorage from 'reactotron-react-native-async-storage';

Reactotron
  .configure()
  .useReactNative()
  .use(ReactotronAsyncStorage())
  .connect();
```

**Features:**

- View all AsyncStorage keys and values
- Edit values directly
- Delete keys
- Clear storage

---

## Debugging Utilities

Create reusable debugging utilities for WaveMaker applications.

```javascript
// utils/debug.js
import Reactotron from 'reactotron-react-native';

export const debugLog = {
  // Service variable calls
  service: (name, data, type = 'call') => {
    if (__DEV__) {
      Reactotron.display({
        name: `Service: ${name} (${type})`,
        value: data,
        important: type === 'error',
      });
    }
  },

  // Navigation events
  navigation: (from, to, params) => {
    if (__DEV__) {
      Reactotron.log('Navigation:', {
        from,
        to,
        params,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Widget events
  widget: (widgetName, event, data) => {
    if (__DEV__) {
      Reactotron.log(`Widget [${widgetName}] ${event}:`, data);
    }
  },

  // Errors
  error: (component, error, context = {}) => {
    if (__DEV__) {
      Reactotron.error(`Error in ${component}:`, {
        message: error.message,
        stack: error.stack,
        context,
      });
    }
    // Always log to console for production
    console.error(`${component}:`, error);
  },

  // Performance
  perf: {
    start: (label) => {
      if (__DEV__) {
        Reactotron.benchmark(label);
      }
    },
    end: (label) => {
      if (__DEV__) {
        Reactotron.benchmark(label);
      }
    },
  },
};

// Usage
debugLog.service('getUserData', { userId: 123 });
debugLog.navigation('Dashboard', 'UserProfile', { userId: 123 });
debugLog.widget('LoginForm', 'submit', { username: 'john' });
debugLog.error('UserProfile', new Error('Failed to load'));
debugLog.perf.start('Data Load');
// ... operation
debugLog.perf.end('Data Load');
```

---

## Best Practices

### 1. Remove Reactotron in Production

```javascript
// ✅ Good - Only in development
if (__DEV__) {
  require('./ReactotronConfig');
  Reactotron.log('App started');
}

// ❌ Bad - Left in production
Reactotron.log('App started');
```

### 2. Use Display for Structured Data

```javascript
// ✅ Good - Easy to inspect in Reactotron
Reactotron.display({
  name: 'User Data',
  value: userData,
  important: true,
});

// ❌ Bad - Hard to read
Reactotron.log(JSON.stringify(userData));
```

### 3. Create Custom Commands for Common Tasks

```javascript
// ✅ Good - Quick access to common debugging tasks
Reactotron.onCustomCommand({
  command: 'resetUser',
  handler: () => {
    resetUserSession();
    Reactotron.log('User session reset');
  },
  title: 'Reset User Session',
});
```

### 4. Use Benchmarking Strategically

```javascript
// ✅ Good - Measure critical operations
Reactotron.benchmark('API Call');
await fetchData();
Reactotron.benchmark('API Call');

// ❌ Bad - Benchmarking everything
Reactotron.benchmark('setState'); // Too granular
setState(value);
Reactotron.benchmark('setState');
```

### 5. Clean Up on App Start

```javascript
// ReactotronConfig.js
if (__DEV__) {
  Reactotron
    .configure()
    .useReactNative()
    .connect();

  // Clear previous session
  Reactotron.clear();
}
```

---

## Troubleshooting

### Reactotron not connecting

**Solutions:**

1. Ensure the Reactotron desktop app is running before you launch the app.
2. Confirm `ReactotronConfig` is loaded only in `__DEV__` and the `require` runs before the app mounts.
3. On a **physical device**, put the device and computer on the same Wi-Fi network.
4. Restart the dev server (`npx expo start`) and reload the app.
5. Check the Metro terminal and device log for connection errors.

### Slow Performance

**Solutions:**

1. Reduce logging frequency
2. Avoid logging large objects
3. Disable network monitoring if not needed
4. Clear Reactotron timeline periodically

### Network Requests Not Showing

**Solutions:**

1. Check `ignoreUrls` configuration
2. Ensure using `fetch` or `XMLHttpRequest`
3. Verify networking plugin is enabled
4. Check if requests are actually being made

---

## Comparison with Other Tools

### Reactotron vs React Native DevTools

| Feature                  | Reactotron            | React Native DevTools     |
| ------------------------ | --------------------- | ------------------------- |
| Built into Expo CLI      | ❌                     | ✅ (`j` or developer menu) |
| Custom commands          | ✅                     | ❌                         |
| Image overlay            | ✅                     | ❌                         |
| Benchmarking             | ✅                     | ❌                         |
| JavaScript breakpoints   | ❌                     | ✅                         |
| Sources / step debugging | ❌                     | ✅                         |
| Network inspection       | ✅                     | ✅                         |
| React Components panel   | ❌                     | ✅                         |
| Project setup required   | ✅ (npm + config file) | ❌                         |
| Works in release APK/IPA | ❌                     | ❌                         |

### When to use each tool

**Use Reactotron when:**

- You need custom debugging commands or benchmarks in a dev build you control
- You want structured logging beyond `console.log`
- You want an image overlay for design comparison
- You use the AsyncStorage plugin for storage inspection

**Use React Native DevTools when:**

- You need breakpoints and step-through debugging
- You want the default Expo workflow with no extra npm packages
- You inspect components, network, and memory in one tool

**Use WavePulse when:**

- You debug WaveMaker widgets, variables, or services
- You need insight on a release build installed on a device

**Use both:** React Native DevTools for debugging code flow; Reactotron for extra logging and custom commands in development.

---

## Related Documentation

**Other Debugging Tools:**

- [React Native DevTools](./react-native-devtools) – Integrated debugging for Expo and dev builds
- [Expo Dev Tools](./expo-dev-tools) – Developer menu and CLI shortcuts
- [Chrome DevTools](./chrome-devtools) – Browser debugging for web preview
- [React DevTools](./react-devtools) – React component inspection
- [WavePulse](../wm-debugging-tools/wavepulse) – WaveMaker debugging tool

**Testing Documentation:**

- [Debugging Overview](../debugging-overview) – All debugging tools and methods
- [UI Testing Mobile](../testing-strategies/ui-testing-mobile) – Mobile testing strategies

**Build Documentation:**

- [Expo Builds](/docs/build-and-deploy/build/mobile/expo) – Expo EAS Build setup
- [CLI Builds](/docs/build-and-deploy/build/mobile/cli) – Local builds with Expo CLI

**External Resources:**

- [Reactotron GitHub](https://github.com/infinitered/reactotron) – Official repository
- [Reactotron Documentation](https://github.com/infinitered/reactotron/tree/master/docs) – Detailed docs
- [Reactotron Releases](https://github.com/infinitered/reactotron/releases) – Download desktop app

:::tip
Reactotron is optional. Start with [React Native DevTools](./react-native-devtools) and [WavePulse](../wm-debugging-tools/wavepulse) for WaveMaker apps. Add Reactotron only when you need custom commands, benchmarks, or extra logging in an exported dev project.
:::
