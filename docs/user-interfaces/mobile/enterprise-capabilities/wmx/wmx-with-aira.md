---
last_update: { author: "Praneeth Reddy" }
---

# Create WMX components with AIRA

Creating a WMX component involves defining the component UI and logic using React Native, configuring metadata through the `wmx.json` file, and organizing the component within the WaveMaker extensions framework. Once created, WMX components can be used directly within WaveMaker Studio, where developers can configure properties, handle events, apply styling, and integrate them into application workflows.

This approach enables developers to implement advanced UI functionality, integrate third-party libraries, and deliver highly customized mobile experiences.

For file layout, capabilities, and limitations, see [WMX components](/docs/user-interfaces/mobile/enterprise-capabilities/wmx/). For `wmx.json` and `index.tsx` details, see [WMX schema reference](wmx-schema-reference.md).

## Prerequisites

- A **mobile** WaveMaker application (React Native).
- Components are created under `src/main/webapp/extensions/components/src/<componentname>/` with `index.tsx`, `wmx.json`, and optional `icon.svg`. See [WMX components](/docs/user-interfaces/mobile/enterprise-capabilities/wmx/) for the standard layout.
- To edit in an external IDE and sync back to Studio, complete [Set up WaveMaker project locally](/docs/guide/integration/set-up-wavemaker-project-locally/) first.

---

## Creating WMX Components with AIRA

The AIRA WMX Agent enables developers to accelerate WMX component development for WaveMaker React Native applications through AI-driven automation. The agent can analyze the existing project structure, generate required component files, and automatically configure metadata required for seamless integration with WaveMaker Studio.

### Start in AIRA

1. In WaveMaker Studio, use the **Design** / **AI** toggle at the top of the canvas.
2. Select **AI** to open the AIRA chat panel.
3. In the chat, describe the WMX component you need (layout, props, events, colors, third-party libraries). The agent generates the component files in your project.

### Example prompt

> Create a numeric keyboard WMX component named `numerickeyboard` with a 3×4 keypad (0–9, backspace, enter). Expose props for background and key colors, `keyHeight`, and `gap`. Fire `onKeyPress` with the digit, plus `onBackspace` and `onEnter` events. Add an `icon.svg` for Studio.

### What the agent does

To create a WMX component, switch to AIRA and provide a prompt to the WMX Agent describing the requirement. Based on the prompt, the agent performs the following tasks:

- Analyzes the existing project structure
- Generates the necessary WMX component files
- Configures metadata, properties, events, and styling support
- Validates compatibility and integration with WaveMaker Studio

This generates the file structure for that component. See [WMX components](/docs/user-interfaces/mobile/enterprise-capabilities/wmx/) for the standard layout.

### After generation

1. **Review** `index.tsx` and `wmx.json`. Confirm the folder name matches the lowercase `name` in `wmx.json`, the component uses a **default export**, and you did not declare reserved properties (`show`, `name`, `disabled`, and others). See [WMX schema reference](wmx-schema-reference.md).
2. **Apply `root`** on the outermost view so **Show** and layout work like built-in widgets (details in the schema reference).
3. **Build** the extensions package if you edit locally:
   ```bash
   cd src/main/webapp/extensions/components
   npm install
   npm run build
   ```
   Run `npm install` only when the agent adds a new dependency.
4. **Refresh Studio** so the widget appears under **WMX Widgets** in the widget panel.
5. **Place the widget** on a page, bind props, wire events, and **test on device**. The Studio canvas shows a placeholder until you preview the app on a device.

---

## Creating WMX Components Using AI Tools

AI-powered development tools such as Cursor and GitHub Copilot can also accelerate WMX widget creation.

The WMX component creation process typically begins with completing the [local development setup](/docs/guide/integration/set-up-wavemaker-project-locally/) and opening the WaveMaker project in an AI-assisted development environment such as Cursor or a similar IDE. Once the project is loaded, developers can switch the AI assistant to Agent Mode and provide a prompt describing the WMX widget requirements.

Based on the provided prompt, the AI tool analyzes the project structure and attempts to generate the WMX component. This includes creating the widget implementation, configuring metadata, executing necessary commands, and resolving common errors interactively.

After the component is generated, developers should carefully review the generated code to ensure correctness, maintainability, and alignment with project standards. Any required refinements or corrections can be applied either manually or with AI assistance.

Build under `extensions/components`, then push changes to Studio with Maven workspace sync (`mvn wavemaker-workspace:push`) as described in the local setup guide.

The component must then be tested to verify its functionality, behavior, and integration within WaveMaker Studio. Once validated, the final changes can be committed and pushed to the repository, making the WMX component ready for use and collaboration.

---

## Using the Component in WaveMaker Studio

Once generated, the component becomes available under **WMX Widgets** in the widget panel. Developers can:

- Drag and drop the component into mobile pages
- Configure properties and events
- Apply custom styling using the Studio Properties panel

The design canvas shows a placeholder for WMX widgets. Use app preview or a device build to verify the real UI.

---

## Best Practices

### Prompt Design

- Clearly specify required features, behavior, and libraries.
- Provide relevant context such as UI references or existing code.
- Build components incrementally, starting with basic functionality.

### Code Validation

- Review AI-generated code before integration.
- Test component behavior across different scenarios.
- Verify dependency compatibility with your environment.
- Check accessibility labels and touch targets on device where the widget is interactive.

### Troubleshooting

- If unsupported libraries are suggested, request alternative or native implementations.
- Ensure generated components follow WMX standards by referring to:
  `src/main/webapp/extensions/components/src/readme.md`
- Validate structure by comparing with existing WMX components and the [WMX schema reference](wmx-schema-reference.md).

---

## Summary

WMX components enable developers to extend WaveMaker mobile applications by creating custom React Native Components that integrate seamlessly with the platform. These components are built by defining UI and logic, configuring metadata, and organizing them within the WaveMaker extensions framework.

AI tools such as AIRA, Cursor, and GitHub Copilot help accelerate WMX component development by automating file generation, metadata configuration, and error resolution. After generation, developers should review, test, and validate the components before deploying them for use in WaveMaker Studio.

By following recommended best practices, developers can ensure WMX components remain scalable, maintainable, and aligned with WaveMaker standards while delivering advanced and customizable mobile experiences.
