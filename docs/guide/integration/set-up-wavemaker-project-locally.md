---
title: "Set Up a WaveMaker Project Locally with Workspace Sync"
id: "set-up-wavemaker-project-locally"
sidebar_label: "Local Setup with Workspace Sync"
last_update: { author: "vivekRaj" }
---

## Overview

When you need to build a WMX Widget, edit custom code, or use your own IDE tooling, you work on the project locally and sync changes back to WaveMaker Studio. This guide sets up that two-way sync using the `wavemaker-workspace` Maven plugin so you can pull the latest from Studio and push your local changes back without re-uploading ZIPs.

---

## Prerequisites

Install and configure these on your machine before you start:

- **Git**
- **JDK** (version matching your WaveMaker project)
- **Maven**

You'll also need:

- Access to your WaveMaker Studio host URL
- An access token for the project you want to sync. An access token is a key generated in WaveMaker Studio that lets the plugin connect to your project without your WaveMaker password or browser session. To generate one, open the project in Studio, go to **Project Settings → Access Tokens → Generate New Token**, choose a validity period (1–90 days), and copy the token value.

:::note
The access token works only for the project it was created for and only for Workspace Sync operations. If you work on more than one project, generate a separate token for each project.
:::

---

## Export the Project as Sources

1. In WaveMaker Studio, open **Settings → Export → Export Project as Sources (ZIP)**.
2. Download the ZIP and extract it to a location on your machine.
3. Open the extracted folder in your editor or IDE (VS Code, IntelliJ, etc.).

You now have the full project source — including `pom.xml`, `src/`, and webapp assets — ready for local edits.

---

## Initialize Workspace Sync

Run the `wavemaker-workspace:init` goal once per project. It wires the local folder to a specific Studio project so subsequent pulls and pushes target the right place.

1. Open a terminal in the project root (the folder containing `pom.xml`).
2. Run:
   ```bash
   mvn wavemaker-workspace:init
   ```
3. Press `y` when prompted to continue.
4. Provide:
   - **Studio Host URL** — the domain of your WaveMaker Studio instance.
   - **Access Token** — the token generated from **Project Settings → Access Tokens**.
5. The plugin shows the project name and branch linked to the token. Press `y` to confirm and fetch the project.

:::note
The plugin does not depend on your browser session, so it works for SSO users, and logging out of Studio does not affect it. The `pull` and `push` commands reuse the saved token and prompt for a new one only when it expires or is revoked.
:::

---

## Pull and Push Changes

Once initialized, you have two commands for the sync loop.

1. **Pull the latest from Studio** — use this before starting a round of local edits so you're on top of any changes made in Studio:
   ```bash
   mvn wavemaker-workspace:pull
   ```

2. **Push your local changes back** — use this after you've added a WMX Widget, edited custom code, or made other modifications locally:
   ```bash
   mvn wavemaker-workspace:push
   ```

After a successful push, refresh the project in Studio and your local changes — including any new WMX Widgets — will be available for use in the app.

:::tip
Treat `pull` the way you'd treat `git pull` before starting work: run it at the start of each session to avoid conflicts with changes made directly in Studio.
:::

---

## Limitations and Constraints

| Constraint                     | Details                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Access token validity          | The token expires after the validity period you choose (1–90 days). Generate a new token and enter it when the plugin prompts. |
| One project binding per folder | A project directory initialized against one Studio project cannot be re-pointed at another without re-running `init`.          |
| Tooling requirements           | Git, JDK, and Maven must be present on `PATH`. Missing any one of them will cause `mvn wavemaker-workspace:*` goals to fail.   |

---

## See Also

- [WMX components (web)](/docs/user-interfaces/web/enterprise-capabilities/wmx/) — build custom React components for WaveMaker web apps
- [WMX components](/docs/user-interfaces/mobile/enterprise-capabilities/wmx/) — build custom React Native components that slot into WaveMaker mobile apps
- [Developing with agents](../../developing-with-agents/) — generate WMX components with WaveMaker AI Assistant
- [Building Project with Maven](../../build-and-deploy/build/web/package/war/build-war-from-projectzip.md) — generate a deployable WAR from a locally-synced project
