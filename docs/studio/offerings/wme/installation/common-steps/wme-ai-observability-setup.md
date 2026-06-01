---
title: Setting Up WME AI Observability
last_update: { author: "RohithPanditi" }
id: wme-ai-observability-setup
sidebar_label: WME AI Observability Setup
---

WME AI Observability is a monitoring and analytics service that provides visibility into your AI workloads running on the WaveMaker platform. Install and run this service on the **WME AI Observability instance**.

## Step 1 — Download and Extract Package

#### Download the Package

Download the package using the link shared by the WaveMaker team:

```bash
wget https://s3.us-east-1.amazonaws.com/downloads.wavemaker.com/wme/<WME-AI-Version>/rhel/ai-observability-<WME-AI-Version>.tar.gz
```

#### Create Directory

```bash
mkdir ai-observability
```

#### Extract the Package

```bash
tar -xzf ai-observability-<WME-AI-Version>.tar.gz -C ai-observability
```

## Step 2 — Package Structure

The extracted package contains installation scripts, Docker images, and configuration files.

#### Directory Structure

```
ai-observability-1.0.0/
├── INSTALL.md
├── certs/
├── docker-compose.yml
├── env.example
├── images.tar.gz
├── init-db.sql
├── install-ai-observability.sh
└── nginx.conf.template
```

## Step 3 — Installation Scenarios

### Case 1 — Installation Without Public Domain

Use this method when accessing the application using:

```
http://<Public-IP>:5050
```

:::caution
This method uses unencrypted HTTP access. It is recommended only for internal or non-production environments. Use Case 2 for secure HTTPS access.
:::

#### Run the Installation Script

```bash
cd ai-observability-<WME-AI-Version>
bash install-ai-observability.sh
```

During execution, provide the following inputs:

| Prompt                                                                                 | Value                              |
| -------------------------------------------------------------------------------------- | ---------------------------------- |
| `Public domain for Analytics UI [analytics.example.com]:`                              | Press Enter                        |
| `Run nginx reverse proxy (HTTPS on 443) for analytics.example.com? [Y/n]`              | `n`                                |
| `WaveMaker platform instance IP (leave blank to skip Consul registration) [127.0.0.1]` | Platform Private IP                |
| `Private IP for Langfuse (registered in Consul; usually this host)`                    | Private IP of WME AI Observability |
| `Langfuse project PUBLIC key (blank = auto-generate)`                                  | Press Enter                        |
| `Langfuse project SECRET key (blank = auto-generate)`                                  | Press Enter                        |
| `Analytics API key (blank = auto-generate)`                                            | Press Enter                        |

#### Accessing the Application

After successful installation, access the application at:

```
http://<Public-IP-of-WME-AI-Observability>:5050
```

#### Login Password

The login password is the generated `ANALYTICS_API_KEY`. You can find this value in the terminal output after execution of `install-ai-observability.sh`.

### Case 2 — Installation With Public Domain and SSL

Use this method when accessing the application through a domain with HTTPS enabled.

#### SSL Certificate Preparation

Place the SSL certificate files inside:

```
ai-observability-<WME-AI-Version>/certs/
```

Required file names:

| File             | Required Name |
| ---------------- | ------------- |
| Certificate File | `bundle.crt`  |
| Private Key File | `private.key` |

Directory example:

```
certs/
├── bundle.crt
└── private.key
```

#### Run the Installation Script

```bash
cd ai-observability-<WME-AI-Version>
bash install-ai-observability.sh
```

During execution, provide the following inputs:

| Prompt                                                                                 | Value               |
| -------------------------------------------------------------------------------------- | ------------------- |
| `Public domain for Analytics UI [analytics.example.com]:`                              | `<domain-name>`     |
| `Run nginx reverse proxy (HTTPS on 443) for <domain-name>? [Y/n]`                      | `Y`                 |
| `Also expose Langfuse UI via nginx? (otherwise internal only) [y/N]`                   | `y`                 |
| `Domain for Langfuse [<domain-name>]`                                                  | Press Enter         |
| `Also expose MinIO API via nginx? (otherwise internal only) [y/N]`                     | `y`                 |
| `Domain for MinIO [minio.<domain-name>]`                                               | Press Enter         |
| `WaveMaker platform instance IP (leave blank to skip Consul registration) [127.0.0.1]` | Platform Private IP |
| `Langfuse project PUBLIC key (blank = auto-generate)`                                  | Press Enter         |
| `Langfuse project SECRET key (blank = auto-generate)`                                  | Press Enter         |
| `Analytics API key (blank = auto-generate)`                                            | Press Enter         |
| `TLS certs directory [./certs]`                                                        | Press Enter         |

:::note
By pressing Enter for `TLS certs directory [./certs]`, the installer automatically uses:

- `ai-observability-<WME-AI-Version>/certs/bundle.crt`
- `ai-observability-<WME-AI-Version>/certs/private.key`

:::

#### Accessing the Application

After successful installation, access the application at:

```
https://<domain-name>
```

The **Analytics URL** will also be displayed in the terminal output after execution of `install-ai-observability.sh`.

#### Login Password

The login password is the generated `ANALYTICS_API_KEY`. You can find this value in the terminal output after installation completes.
