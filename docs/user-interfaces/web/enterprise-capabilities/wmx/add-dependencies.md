---
title: "Add external libraries"
last_update: { author: "Yagyaraj Lodhi" }
---

# Add external libraries to a WMX component

A WMX component can use any npm library, such as a carousel, a chart or a date library. Each component keeps its own list of libraries in its own `package.json`, so one component's libraries never affect another's.

## Step 1: Install the library in the component folder

Run `npm install` from inside the component folder, not from the project root:

```bash
cd src/main/webapp/extensions/components/src/Carousel
npm install embla-carousel-react
```

npm adds the library to that component's `package.json`:

```json
"dependencies": {
  "embla-carousel-react": "^8.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

If the folder has no `package.json`, create one first with `npm init -y`.

## Step 2: Import it in `index.tsx`

```tsx
import React from "react";
import useEmblaCarousel from "embla-carousel-react";

const Carousel = ({ dataset = [], imageField = "url", classname = "", styles }) => {
  const [viewportRef] = useEmblaCarousel({ loop: true });

  return (
    <div className={classname} style={styles?.root?.style}>
      <div ref={viewportRef} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex" }}>
          {dataset.map((item, i) => (
            <img key={i} src={item[imageField]} style={{ flex: "0 0 100%", minWidth: 0 }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;
```

The properties you expose to Studio still come from `wmx.json`. The library is an implementation detail inside the component.

## Step 3: Test and push

Check the component with the [local preview](./develop-locally.md), then push it:

```bash
mvn wavemaker-workspace:push
```

The component's `package.json` goes to Studio with the rest of the component. The libraries are installed from it when the app is built, so you don't need to install them anywhere else.

:::tip
Don't commit a component's `node_modules` folder. The project's `.gitignore` only excludes `src/main/webapp/extensions/components/node_modules`. Add this line to cover each component's own folder:

```text
src/main/webapp/extensions/components/src/*/node_modules
```

:::

## Libraries the app already provides

The app already includes these libraries. Import them as usual and the component uses the app's copy:

`react`, `react-dom`, `@mui/material`, `@mui/x-date-pickers`, `@emotion/react`, `@emotion/styled`, `react-redux`, `@reduxjs/toolkit`, `react-hook-form`, `react-router-dom`, `@dnd-kit/core` and `@base-ui-components/react`.

Using the app's copy keeps things like React hooks, Material UI themes and routing working inside your component. You can list `react` and `react-dom` in the component's `package.json` for the local preview. The app uses its own version when it runs.

Any other library is bundled with your component.

## Troubleshooting

| Problem                                   | What to check                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cannot find module` in the local preview | Run `npm install` inside the component folder.                                                                                               |
| Works in the preview but not in the app   | The library is missing from the component's `package.json`. Install it with `npm install <name>` from the component folder, then push again. |
| "Invalid hook call" or a missing theme    | The component is using its own copy of a library the app provides. Remove it from the component's `package.json` and import it normally.     |
