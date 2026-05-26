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
- Studio login credentials, or an auth token generated at `https://<WaveMaker_Studio_Host>/studio/services/auth/token`

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
   - **Credentials** — either email and password, or a token from `https://<WaveMaker_Studio_Host>/studio/services/auth/token`.
5. When prompted, select the correct **project number** from the list of projects available to your account.

:::note
Keep your Studio session open in the browser until `init` completes. The plugin uses your active session to enumerate and bind the project.
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

| Constraint                     | Details                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Active Studio session          | The Studio session must remain open in the browser during `init` and for sync commands to authenticate reliably.             |
| One project binding per folder | A project directory initialized against one Studio project cannot be re-pointed at another without re-running `init`.        |
| Tooling requirements           | Git, JDK, and Maven must be present on `PATH`. Missing any one of them will cause `mvn wavemaker-workspace:*` goals to fail. |

---

## See Also

- [WMX components](/docs/user-interfaces/mobile/enterprise-capabilities/wmx/) — build custom React Native components that slot into WaveMaker mobile apps
- [WMX Agent](../../developing-with-agents/aira-agents/wmx-agent.md) — generate WMX components with AIRA
- [Building Project with Maven](../../build-and-deploy/build/web/package/war/build-war-from-projectzip.md) — generate a deployable WAR from a locally-synced project
