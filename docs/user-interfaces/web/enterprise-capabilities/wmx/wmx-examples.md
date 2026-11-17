---
title: "WMX examples"
last_update: { author: "Yagyaraj Lodhi" }
---

# WMX component examples

Two examples that cover the main cases: a display component fed by a variable, and a custom input used as a field in a WaveMaker form.

## Example 1: Carousel

A carousel that shows images from a variable, reports the current slide, and fires an event when the slide changes.

### `Carousel/wmx.json`

```json
{
  "name": "Carousel",
  "displayName": "Carousel",
  "description": "Image carousel with autoplay",
  "webSupport": true,
  "props": {
    "dataset": { "name": "dataset", "displayName": "Dataset", "type": "array", "defaultValue": [] },
    "imageField": { "name": "imageField", "displayName": "Image Field", "type": "string", "defaultValue": "url" },
    "titleField": { "name": "titleField", "displayName": "Title Field", "type": "string", "defaultValue": "title" },
    "autoplay": { "name": "autoplay", "displayName": "Autoplay", "type": "boolean", "defaultValue": true },
    "interval": { "name": "interval", "displayName": "Interval (ms)", "type": "number", "defaultValue": 3000 },
    "currentIndex": { "name": "currentIndex", "displayName": "Current Index", "type": "number", "defaultValue": 0 }
  },
  "events": {
    "onSlideChange": {
      "name": "onSlideChange",
      "displayName": "On Slide Change",
      "description": "Triggered when the slide changes. Receives the new index."
    }
  },
  "styles": {
    "root": { "name": "root", "style": { "width": "100%", "borderRadius": "8px" } },
    "caption": { "name": "caption", "style": { "fontSize": "14px", "textAlign": "center" } }
  }
}
```

### `Carousel/index.tsx`

```tsx
import React, { CSSProperties, useEffect, useState } from "react";

interface CarouselProps {
  name?: string;
  dataset?: Record<string, any>[];
  imageField?: string;
  titleField?: string;
  autoplay?: boolean;
  interval?: number;
  currentIndex?: number;
  classname?: string;
  styles?: { root?: { style?: CSSProperties }; caption?: { style?: CSSProperties } };
  listener?: { onChange?: (name: string, values: Record<string, any>) => void };
  onSlideChange?: (index: number) => void;
}

const Carousel = ({
  name,
  dataset = [],
  imageField = "url",
  titleField = "title",
  autoplay = true,
  interval = 3000,
  currentIndex = 0,
  classname = "",
  styles,
  listener,
  onSlideChange,
}: CarouselProps) => {
  const [index, setIndex] = useState(currentIndex);

  // keep in step when the property is bound or set from a script
  useEffect(() => setIndex(currentIndex), [currentIndex]);

  const goTo = (next: number) => {
    if (!dataset.length) return;
    const i = (next + dataset.length) % dataset.length;
    setIndex(i);
    listener?.onChange?.(name!, { currentIndex: i }); // updates Page.Widgets.<name>.currentIndex
    onSlideChange?.(i); // runs the handler attached on the page
  };

  useEffect(() => {
    if (!autoplay || dataset.length < 2) return;
    const t = setInterval(() => goTo(index + 1), interval);
    return () => clearInterval(t);
  }, [autoplay, interval, index, dataset.length]);

  const item = dataset[index];
  if (!item) return <div className={classname} style={styles?.root?.style}>No images</div>;

  return (
    <div className={classname} style={styles?.root?.style}>
      <img src={item[imageField]} alt={item[titleField]} style={{ width: "100%", display: "block" }} />
      <div style={styles?.caption?.style}>{item[titleField]}</div>
      <button onClick={() => goTo(index - 1)}>Previous</button>
      <button onClick={() => goTo(index + 1)}>Next</button>
    </div>
  );
};

export default Carousel;
```

### Use it on a page

1. Create a variable, for example `ImagesVar`, that returns a list with `url` and `title` fields.
2. Add the Carousel to the page and bind **Dataset** to `bind:Variables.ImagesVar.dataSet`.
3. Set **Image Field** and **Title Field** to match your data. Turn **Autoplay** off if you don't want it.
4. Under **Events**, add a handler for **On Slide Change**.

Studio creates the handler function in the page script for you. Inside it, and anywhere else in the page script, you can use the widget:

```js
// read or set the internal property
var current = Page.Widgets.carousel1.currentIndex;
Page.Widgets.carousel1.currentIndex = 0;

// the event handler receives the new index
// (the function name Studio generates depends on your widget name)
Page.Widgets.label1.caption = "Slide " + (index + 1);
```

You can also bind another widget to the current slide, for example a label bound to `bind:Widgets.carousel1.currentIndex`.

## Example 2: Custom input as a form field

A phone number input that formats the value as the user types, and works as a field in a WaveMaker form.

### `PhoneInput/wmx.json`

```json
{
  "name": "PhoneInput",
  "displayName": "Phone Input",
  "description": "Phone number input with formatting",
  "webSupport": true,
  "props": {
    "datavalue": { "name": "datavalue", "displayName": "Data Value", "type": "string", "defaultValue": "" },
    "placeholder": { "name": "placeholder", "displayName": "Placeholder", "type": "string", "defaultValue": "(555) 123-4567" },
    "readonly": { "name": "readonly", "displayName": "Read Only", "type": "boolean", "defaultValue": false },
    "required": { "name": "required", "displayName": "Required", "type": "boolean", "defaultValue": false }
  },
  "events": {
    "onChange": {
      "name": "onChange",
      "displayName": "On Change",
      "description": "Triggered when the value changes. Receives the new value."
    }
  },
  "styles": {
    "root": { "name": "root", "style": { "width": "100%" } },
    "input": { "name": "input", "style": { "padding": "8px", "borderRadius": "6px", "border": "1px solid #d1d5db" } }
  }
}
```

### `PhoneInput/index.tsx`

```tsx
import React, { ChangeEvent, CSSProperties } from "react";

interface PhoneInputProps {
  name?: string;
  datavalue?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  disabled?: boolean;
  classname?: string;
  styles?: { root?: { style?: CSSProperties }; input?: { style?: CSSProperties } };
  listener?: { onChange?: (name: string, values: Record<string, any>) => void };
  onChange?: (value: string) => void;
}

const format = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

const PhoneInput = ({
  name,
  datavalue = "",
  placeholder = "(555) 123-4567",
  readonly = false,
  required = false,
  disabled = false,
  classname = "",
  styles,
  listener,
  onChange,
}: PhoneInputProps) => {
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const value = format(e.target.value);
    listener?.onChange?.(name!, { datavalue: value }); // sends the value to the form field
    onChange?.(value);
  };

  return (
    <div className={classname} style={styles?.root?.style}>
      <input
        type="tel"
        value={datavalue}
        placeholder={placeholder}
        readOnly={readonly}
        required={required}
        disabled={disabled}
        onChange={handle}
        style={styles?.input?.style}
      />
    </div>
  );
};

export default PhoneInput;
```

### Use it in a WaveMaker form

In a form, add a field and choose **PhoneInput** as its widget. Studio saves:

```html
<wm-form-field
  displayname="Phone"
  widget="wmx-PhoneInput"
  type="custom"
  name="phone"
  key="phone"
  componentname="PhoneInput"
  placeholder="(555) 123-4567"
  required="true"></wm-form-field>
```

Because the component is a form field, the form treats it like a built-in field. `required` is validated, the value is part of the form data when the form is submitted, and it is filled in when the form edits an existing record. The component sends its value with `listener.onChange(name, { datavalue })`, which is what the form reads.

## What the examples show

| Need                                                       | How                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Show data from a variable                                  | Declare an `array` property and bind it with `bind:Variables.<var>.dataSet`                 |
| Let a script or binding read a value the component changed | Call `listener.onChange(name, { prop: value })`                                             |
| Let a script set a property                                | Assign `Page.Widgets.<name>.<prop> = value`. The component receives it as a prop.           |
| Run page code on a user action                             | Declare an event and call the function prop                                                 |
| Use as a form field                                        | `widget="wmx-<Name>"` and `type="custom"`, and send `datavalue` through `listener.onChange` |
