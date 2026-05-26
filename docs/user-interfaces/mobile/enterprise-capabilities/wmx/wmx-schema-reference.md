---
last_update: { author: "Praneeth Reddy" }
---

# WMX Component Schema

WMX Components allow developers to build custom React Native components
that integrate directly into WaveMaker Studio. Each component includes
UI logic, metadata configuration, and optional visual assets.

For an overview of WMX components, file layout, and getting started, see [WMX components](/docs/user-interfaces/mobile/enterprise-capabilities/wmx/).

---

## Component Structure

All WMX components must be placed inside:

`src/main/webapp/extensions/components/src`

Each component should follow this structure:

```text
    componentname/
    ├── index.tsx
    ├── wmx.json
    └── icon.svg (optional)
```

| File      | Purpose                                |
| --------- | -------------------------------------- |
| index.tsx | Contains UI and component logic        |
| wmx.json  | Defines properties, events, and styles |
| icon.svg  | Optional Studio icon                   |

Use a **lowercase** folder name that matches the `name` field in `wmx.json`. After you change `wmx.json` or `index.tsx`, build the extensions package (`npm run build` under `extensions/components`) so Studio picks up the update.

---

## wmx.json Overview

The `wmx.json` file defines how the component appears and behaves in
WaveMaker Studio.

`props`, `events`, and `styles` are **maps**: the JSON key is the identifier Studio and the runtime use; the value is the schema object for that entry.

### Example

```json
 {
   "name": "myComponent",
   "displayName": "My component",
   "description": "Sample WMX component",
   "webSupport": true,
   "iconUrl": "icon.svg",
   "props": {},
   "events": {},
   "styles": {}
 }
```

### Metadata Fields

| Field       | Description                  | Required |
| ----------- | ---------------------------- | -------- |
| name        | Unique lowercase identifier  | Yes      |
| displayName | Name shown in Studio         | No       |
| description | Help text                    | No       |
| iconUrl     | SVG icon path                | No       |
| webSupport  | Enables web preview          | No       |
| props       | Defines component properties | No       |
| events      | Defines component events     | No       |
| styles      | Defines styling options      | No       |

| Field       | Description                                                                                                        | Required | Default |
| ----------- | ------------------------------------------------------------------------------------------------------------------ | -------- | ------- |
| name        | Component identifier in lowercase letters. Must match the component folder name.                                   | Yes      | —       |
| displayName | Label shown in Studio. If omitted, `name` is used.                                                                 | No       | `name`  |
| description | Help text in the Properties panel.                                                                                 | No       | —       |
| iconUrl     | Relative path to the Studio icon (for example `icon.svg`).                                                         | No       | —       |
| webSupport  | When `true`, the component can render in Studio **web preview** builds. Does not change on-device mobile behavior. | No       | `false` |
| props       | Map of custom properties (see Property schema).                                                                    | No       | —       |
| events      | Map of custom events (see Event schema).                                                                           | No       | —       |
| styles      | Map of style slots (see Style schema).                                                                             | No       | —       |

### Property Schema

Defines configurable component inputs.

| Field        | Description                     |
| ------------ | ------------------------------- |
| name         | Property identifier             |
| type         | string, number, boolean, object |
| defaultValue | Default property value          |
| isList       | Supports array values           |
| isRequired   | Marks property mandatory        |

Each entry under `props` uses the property name as the map key. Supported fields:

| Field        | Description                                                   | Required | Default  |
| ------------ | ------------------------------------------------------------- | -------- | -------- |
| name         | Property identifier (alphanumeric). Should match the map key. | Yes      | —        |
| displayName  | Label in Studio. If omitted, `name` is used.                  | No       | `name`   |
| description  | Help text for the property.                                   | No       | —        |
| type         | `string`, `number`, `boolean`, or `object`.                   | No       | `string` |
| isList       | When `true`, the property accepts an array of values.         | No       | `false`  |
| defaultValue | Initial value when the widget is placed on a page.            | No       | —        |
| isRequired   | When `true`, Studio treats the property as mandatory.         | No       | `false`  |

#### Property example

```json
"props": {
  "title": {
    "name": "title",
    "displayName": "Title",
    "type": "string",
    "defaultValue": "Hello World",
    "isRequired": false
  },
  "count": {
    "name": "count",
    "type": "number",
    "defaultValue": 0
  }
}
```

Props declared in `wmx.json` are passed into your component from `index.tsx` (for example `title`, `count`). Bind them to variables in Studio like built-in widget properties.

### Reserved properties

Do **not** add these to `wmx.json`. The platform provides them:

| Property       | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `show`         | Visibility (framework applies hidden styles via `root`) |
| `name`         | Widget identifier on the page                           |
| `disabled`     | Disabled state                                          |
| `classname`    | CSS class system                                        |
| `styles`       | Runtime style override object                           |
| `showindevice` | Device-specific visibility                              |

### Event Schema

Defines events triggered by user interaction or state change.

| Field       | Description         |
| ----------- | ------------------- |
| name        | Event identifier    |
| displayName | Studio label        |
| description | Event usage details |

Each entry under `events` uses the event name as the map key:

| Field       | Description                                                   | Required | Default |
| ----------- | ------------------------------------------------------------- | -------- | ------- |
| name        | Event identifier. Should match the map key.                   | Yes      | —       |
| displayName | Label in Studio (often prefixed with "On" in the Events tab). | No       | `name`  |
| description | Help text for the event.                                      | No       | —       |

#### Event example

```json
"events": {
  "onTap": {
    "name": "onTap",
    "displayName": "Tap",
    "description": "Fires when the user taps the control"
  }
}
```

Invoke events from `index.tsx` using the callback prop WaveMaker injects (same pattern as other widgets). Wire handlers on the page in Studio under **Events**.

### Style Schema

Defines styling options exposed to Studio.

| Field | Description         |
| ----- | ------------------- |
| name  | Style identifier    |
| style | Default style value |

Each entry under `styles` uses the style slot name as the map key:

| Field       | Description                                          | Required | Default |
| ----------- | ---------------------------------------------------- | -------- | ------- |
| name        | Style slot identifier. Should match the map key.     | Yes      | —       |
| displayName | Label in the Styles section of the Properties panel. | No       | `name`  |
| style       | Default React Native style object for this slot.     | No       | —       |

#### Style example

```json
"styles": {
  "container": {
    "name": "container",
    "displayName": "Container",
    "style": { "padding": 16 }
  }
}
```

Destructure style keys in `index.tsx` and merge them on the appropriate `View` (see index.tsx overview). Always apply the reserved **`root`** style last on the outermost container so `show` and layout behave correctly.

---

## index.tsx Overview

The `index.tsx` file contains the React Native implementation of the
component.

### Example

```
    import * as React from 'react';
    import { View, Text } from 'react-native';

    const MyComponent = ({ title = "Hello World" }) => (
      <View>
        <Text>{title}</Text>
      </View>
    );

    export default MyComponent;

```

### Implementation notes

:::tip
In the generated app, WaveMaker passes **`root`** and **`text`** to your component, plus any keys you add under the **`styles`** section in `wmx.json` (for example `container`). Apply **`root`** to your widget's **outermost** view so **Show** in Studio and outer layout behave like built-in widgets. Those custom keys are in addition to `root`; they do not replace it.
:::

- Export the component as the **default export** (required).
- Accept props that match keys under `props` in `wmx.json`.
- Accept style slots that match keys under `styles` in `wmx.json`.
- Include a **`root`** prop on the outermost `View` and apply it **last** in the style array so visibility and layout from the framework are not overridden:

```tsx
const MyComponent = ({ root, container, title = 'Hello World' }) => (
  <View style={[container, root]}>
    <Text>{title}</Text>
  </View>
);
```

For end-to-end creation and push to Studio, see [Create WMX components with AIRA](wmx-with-aira.md). For local edit and Maven sync, see [Set up WaveMaker project locally](/docs/guide/integration/set-up-wavemaker-project-locally/).

---

## icon.svg Guidelines

- SVG format only
- Transparent background recommended
- Suggested stroke color: #737373

Additional icon guidance (minimal design, small-size readability) is on the [WMX components](/docs/user-interfaces/mobile/enterprise-capabilities/wmx/) overview.

---

## Summary

WMX components combine React Native UI development with metadata-driven
configuration. Proper schema definition ensures components remain
reusable, configurable, and easy to integrate within WaveMaker Studio.
