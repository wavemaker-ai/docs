---
title: WaveMaker Enterprise AI Setup Process
last_update: { author: "Imtiyaz Mohammad" }
id: getting-started
sidebar_label: WaveMaker Enterprise AI Setup Process
---

WaveMaker Enterprise AI (WME AI) is an on-premise offering of WaveMaker. WME AI can be installed on an on-premise/private cloud or public cloud. It can be hosted and managed by an organization on its own infrastructure.

You can set up WaveMaker Enterprise AI on any machine.

This document describes the process for setting up WaveMaker Enterprise AI in all major cloud providers and on-premise environments.

:::note
This document uses words like **VM** and **Instance** to refer to a machine.
:::

The machine can be hosted on any cloud provider like Amazon Web Services Elastic Compute Cloud (AWS EC2), Google Cloud Platform (GCP), Microsoft Azure, an enterprise cloud, or bare metal. All machines allocated to the WME Platform must not have any other process running on them.

## **WaveMaker Enterprise AI Setup Process**

WaveMaker Enterprise AI setup requires you to follow the steps below.

### **Step-1: Understand prerequisites**

Understand and procure the [Prerequisites](./prerequisites).

### **Step-2: Choose an infrastructure provider**

Choose a cloud provider from:

1. [AWS](../installation/platforms/aws/launching-instances-in-aws)
2. [Azure](../installation/platforms/azure/launching-instances-in-azure)
3. GCP (Follow general prerequisites and installation steps)

Or, choose an on-premise virtualization provider from:

1. [VMware ESXi (OVA)](../installation/platforms/vmware-esxi/launching-instances-in-esxi-ova)
2. [VMware ESXi (ISO)](../installation/platforms/vmware-esxi/launching-instances-in-esxi-iso)
3. [Hyper-V](../installation/platforms/hyperv/launching-instances-in-hyper-v-vhd)

You can also choose bare metal or any other infrastructure option.

### **Step-3: Choose the OS**

WaveMaker Enterprise AI supports the following operating systems.

- RHEL 8.x and RHEL 9.x
- Ubuntu 20.04 and Ubuntu 22.x

### **Step-4: Check for software requirements**

Depending on the operating system, you need to install additional software.

### **Step-5: Install**

Start installing using the WME AI installer. Follow the steps for the infrastructure provider selected in step-2.

### **Step-6: Configure**

Configure the setup.

