---
title: "Create WMX components"
last_update: { author: "Yagyaraj Lodhi" }
---

# Create WMX components

Creating a WMX component means writing the React UI in `index.tsx`, describing its properties and events in `wmx.json`, and placing the folder under the project's extensions. You can write these files yourself, or have AIRA or an AI coding tool generate them.

For the file layout, see [WMX components](./index.mdx). For `wmx.json` and `index.tsx` details, see the [WMX schema reference](./wmx-schema-reference.md). For finished examples, see [Carousel and custom input examples](./wmx-examples.md).

## Prerequisites

- A WaveMaker **web** application that uses the React stack.
- To edit in an external editor, complete [Set up WaveMaker project locally](/docs/guide/integration/set-up-wavemaker-project-locally/) first.

## Create with AIRA

The AIRA WMX agent can analyze your project, generate the component files, and set up the properties and events for Studio.

### Start in AIRA

1. In WaveMaker Studio, use the **Design** / **AI** toggle at the top of the canvas.
2. Select **AI** to open the AIRA chat panel.
3. Describe the component you need, including its properties, events and any library to use.

### Example prompt

> Create a React web WMX component named `Carousel` that shows a list of images from a `dataset` property, with `imageField` and `titleField` properties, autoplay and an interval. Fire `onSlideChange` with the new index and keep a `currentIndex` property up to date.

### After generation

1. **Review** `index.tsx` and `wmx.json`. Check that the folder name matches `name` in `wmx.json`, the component has a default export, and you did not declare reserved properties such as `show`, `name` or `disabled`.
2. **Apply `classname` and the `root` style** to the outermost element.
3. **Sync to Studio** if you edited locally: `mvn wavemaker-workspace:push`.
4. **Refresh Studio** so the component is available.
5. **Use it** on a page or in a form, bind its properties, wire its events, and run the app.

## Create with an AI coding tool

Tools such as Cursor or GitHub Copilot can also write the component. Open the project locally, switch the tool to agent mode, and describe the component. Review the generated code, test it with the [local preview](./develop-locally.md), and push it to Studio.

## Import an existing React component

To use a component you already have, or one from a library:

1. Create the component folder and add a small `index.tsx` that imports it and passes through the props you want to control.
2. Describe those props and events in `wmx.json`.
3. List the library in the component's `package.json`.

```tsx
import React from "react";
import { SomeChart } from "some-chart-library";

const Chart = ({ dataset = [], xField, yField, classname = "", styles }) => (
  <div className={classname} style={styles?.root?.style}>
    <SomeChart data={dataset} x={xField} y={yField} />
  </div>
);

export default Chart;
```

This is the whole integration. `dataset`, `xField` and `yField` become properties you can bind in Studio.

## Best practices

- Describe the properties, events and libraries clearly in your prompt.
- Build in small steps, starting with basic behavior.
- Review generated code and test it in the running app.
- Keep property names the same in `wmx.json` and `index.tsx`.

## Summary

You can create a WMX component by hand, with AIRA, or with an AI tool, and you can wrap any existing React component the same way. After you push it to Studio, use it on a page or in a form like any other widget.
