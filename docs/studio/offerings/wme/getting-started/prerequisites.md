---
title: WaveMaker Enterprise AI Prerequisites
last_update: { author: "Imtiyaz Mohammad" }
id: prerequisites
sidebar_label: Prerequisites
---
You can set up WaveMaker Enterprise AI on any machine.

:::note
This document uses words like **VM**, **Instance** to refer a machine.
:::

## **WME AI setup system requirements**

WaveMaker Enterprise AI can be installed on any machine that meets the following requirements. Before you start setting up WaveMaker Enterprise AI, review the minimum and recommended system requirements for each instance type.

### **WME AI Platform Instance**

<table style={{ fontSize: '0.875rem', fontFamily: 'inherit' }}>
  <colgroup>
    <col style={{ width: '120px' }} />
    <col />
  </colgroup>
  <thead>
    <tr>
      <th style={{ fontSize: '0.875rem' }}>Requirement</th>
      <th>Minimum configuration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Memory</td>
      <td><ul><li>Minimum 32 GB</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>CPU</td>
      <td><ul><li>8-core, single CPU system</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Hard disk</td>
      <td><ul><li>Minimum 450 GB to be allocated</li><li>For volume-based setups, allocate:<ul><li>100 GB for <code style={{ fontFamily: 'inherit' }}>/</code></li><li>200 GB for <code style={{ fontFamily: 'inherit' }}>/wm-data</code></li><li>150 GB for <code style={{ fontFamily: 'inherit' }}>/wm-runtime</code></li></ul></li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Host OS</td>
      <td><ul><li>Ubuntu 22.x LTS or RHEL 8.x/9.x</li><li>Kernel 4.4 or later</li><li>x86 architecture</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Software</td>
      <td><ul><li>Docker 28.x</li><li>Python 3.5 or later</li><li><code style={{ fontFamily: 'inherit' }}>wget</code></li><li><code style={{ fontFamily: 'inherit' }}>jq</code></li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Network</td>
      <td><ul><li>Static IP with valid DNS</li><li>Open ports 80, 443, 8080, and 22 for SSH access from the developer network range.</li></ul></td>
    </tr>
  </tbody>
</table>

### **WME AI StudioWorkspace Instance and AppDeployment Instance**

<table style={{ fontSize: '0.875rem', fontFamily: 'inherit' }}>
  <colgroup>
    <col style={{ width: '120px' }} />
    <col />
  </colgroup>
  <thead>
    <tr>
      <th style={{ fontSize: '0.875rem' }}>Requirement</th>
      <th>Minimum configuration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Memory</td>
      <td><ul><li>Minimum 32 GB</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>CPU</td>
      <td><ul><li>8-core, single CPU system</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Hard disk</td>
      <td><ul><li>Minimum 300 GB to be allocated</li><li>For volume-based setups, allocate:<ul><li>100 GB for <code style={{ fontFamily: 'inherit' }}>/</code></li><li>200 GB for <code style={{ fontFamily: 'inherit' }}>/data</code></li></ul></li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Host OS</td>
      <td><ul><li>Ubuntu 22.x LTS or RHEL 8.x/9.x</li><li>Kernel 4.4 or later</li><li>x86 architecture</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Software</td>
      <td><ul><li>Docker 28.x</li><li>Python 3.5 or later</li><li><code style={{ fontFamily: 'inherit' }}>wget</code></li><li><code style={{ fontFamily: 'inherit' }}>jq</code></li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Network</td>
      <td><ul><li>Static IP</li><li>Open the required ports for access from the Platform Instance.</li></ul></td>
    </tr>
  </tbody>
</table>

### **WME AI Observability Instance**

<table style={{ fontSize: '0.875rem', fontFamily: 'inherit' }}>
  <colgroup>
    <col style={{ width: '120px' }} />
    <col />
  </colgroup>
  <thead>
    <tr>
      <th style={{ fontSize: '0.875rem' }}>Requirement</th>
      <th>Minimum configuration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Memory</td>
      <td><ul><li>Minimum 16 GB</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>CPU</td>
      <td><ul><li>4-core, single CPU system</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Hard disk</td>
      <td><ul><li>Minimum 200 GB to be allocated</li><li>For volume-based setups, allocate:<ul><li>200 GB for <code style={{ fontFamily: 'inherit' }}>/</code></li></ul></li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Host OS</td>
      <td><ul><li>Ubuntu 22.x LTS or RHEL 8.x/9.x</li><li>Kernel 4.4 or later</li><li>x86 architecture</li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Software</td>
      <td><ul><li>Docker 28.x</li><li>Docker Compose 28.x</li><li>Python 3.5 or later</li><li><code style={{ fontFamily: 'inherit' }}>wget</code></li><li><code style={{ fontFamily: 'inherit' }}>jq</code></li></ul></td>
    </tr>
    <tr>
      <td style={{ fontSize: '0.875rem' }}>Network</td>
      <td><ul><li>Static IP with valid DNS</li><li>Open the required ports for access from the Studio workspace Instance.</li></ul></td>
    </tr>
  </tbody>
</table>

## **Port requirements**

**Open the following ports on the Platform Instance for access from the StudioWorkspace Instance and AppDeployment Instance.**

<table style={{ fontSize: '0.875rem', fontFamily: 'inherit' }}>
  <colgroup>
    <col style={{ width: '120px' }} />
    <col />
  </colgroup>
  <thead>
    <tr>
      <th style={{ fontSize: '0.875rem' }}>Port</th>
      <th>Required for</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style={{ fontSize: '0.875rem' }}>443</td><td>HTTPS access to the Platform Instance</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>5000</td><td>Platform services</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8500</td><td>Service discovery</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>22</td><td>SSH access</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8081</td><td>Platform communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>2200</td><td>Container SSH access</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8100</td><td>StudioWorkspace and AppDeployment communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>9200</td><td>Search and observability services</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8000-8020</td><td>Platform-managed application services</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8094</td><td>AI service communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8079</td><td>AI service communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>5432</td><td>Database connectivity</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>5433</td><td>Vector database access for AI features</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8083</td><td>AI Studio and agent-server LiteLLM proxy communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8086</td><td>AI Studio and agent-server key management</td></tr>
  </tbody>
</table>

**Open the following ports on the StudioWorkspace Instance,  AppDeployment Instance and Observability Instance for access from the Platform Instance.**

<table style={{ fontSize: '0.875rem', fontFamily: 'inherit' }}>
  <colgroup>
    <col style={{ width: '120px' }} />
    <col />
  </colgroup>
  <thead>
    <tr>
      <th style={{ fontSize: '0.875rem' }}>Port</th>
      <th>Required for</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style={{ fontSize: '0.875rem' }}>22</td><td>SSH access</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>2375</td><td>Docker API access</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>80</td><td>HTTP access</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>5000</td><td>Platform service communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8100</td><td>StudioWorkspace and AppDeployment communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8888</td><td>Workspace service communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>9101, 9102, 9100</td><td>Metrics collection</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>9404</td><td>Metrics export</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>2200-2299</td><td>Container SSH access</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>8001-8099</td><td>Platform-managed application services</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>3300-3399</td><td>Database and service communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>9500-9599</td><td>Platform-managed service communication</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>3000</td><td>Routing traffic from the load balancer to AI Studio</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>3001</td><td>Routing traffic from the load balancer to AI Studio NGINX</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>3002</td><td>Routing traffic from the load balancer to agent-server</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>5010</td><td>Backend MCP</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>5020</td><td>UI MCP</td></tr>
  </tbody>
</table>

**Open the following ports on the Observability Instance.**

<table style={{ fontSize: '0.875rem', fontFamily: 'inherit' }}>
  <colgroup>
    <col style={{ width: '120px' }} />
    <col />
  </colgroup>

  <thead>
    <tr>
      <th style={{ fontSize: '0.875rem' }}>Port</th>
      <th>Required for</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style={{ fontSize: '0.875rem' }}>3000</td><td>Open for access from the Studio workspace Instance to Observability Instance and vice-versa</td></tr>
    <tr><td style={{ fontSize: '0.875rem' }}>443</td><td>Open within the network to access the Observability UI</td></tr>
  </tbody>
</table>

### **Network Communication**

- The following diagram explains the network communication between the Platform Instance, StudioWorkspace Instance, and AppDeployment Instance.

[![network-communication-between-instances](./assets/images/network-communication-between-instances.jpg)](./assets/images/network-communication-between-instances.jpg)

### **Capacity planning**

Adding an instance to either User Workspace or Deployed Apps increases WME AI setup capacity for application development and deployment, respectively. Each added User Workspace or Deployed Apps instance supports a specific number of app developments and app deployments. These numbers vary based on the WME AI version.

| Application Type    | Developer logins per 32GB WaveMaker Studio Instance | 
| ------------------- | --------------------------------------------------- |
| WEB                 | 18           				            |
| App-Preview-ESBuild | 18          					    |
| App-Preview-expo    | 4           					    |


| App Deployments per 32GB WaveMaker AppDeployment Instance |
| --------------------------------------------------------- |
| 20                                                        |


The actual app development and deployment support is also determined by your license terms. Even if your infrastructure has the capacity, the apps that can be developed and deployed are restricted by your license terms. Similarly, even when your license terms allow more apps, the apps that can be developed and deployed are limited by infrastructure capacity.

:::note
Different instances need to be added to each stage in the release pipeline.
:::

## **WME AI Setup Artifacts**

WaveMaker will share the required artifacts (installer files/Images) to do the setup. There are two ways to do the setup.

1. **Operating System Pre-Installed**.  
    You can come up with machines with the Operating system pre-installed and install Prerequisite(optional).
    Then use our installer to setup WME.

## **IP Addressing and DNS Mapping**

You will be needing IP Addresses for the following.

### **IP Address**

- One static IP for accessing the platform machine from your developer's network.
- Machine Static IP: This is the IP assigned to the machine during setup and should be accessible on your network, or
  - In the case of VM, it will be the local IP address, which should be rout table from in your LAN.
  - In case of AWS instance: Private static IP for the instance within your VPC (assigned via eth0 or via ENI on eth1,ens5)

### **DNS Mapping**

Map a domain to the above IP for easy access.

| **Domain**              | **Domain URL**                                                                      | **Description**                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| WaveMaker Studio        | `wavemakerai.[mycompany].com`                                                         | This domain will be used to access WaveMaker AI Studio                                      |
| WaveMaker Deployed Apps | `wmai-apps.[mycompany].com`  `wmai-stage.[mycompany].com`     `wmai-live.[mycompany].com` | These domains will be used to access WaveMaker AI Studio apps deployed onto WaveMaker AI Cloud |
| WaveMaker AI Observability | `wmai-analytics.[mycompany].com` | This domain will be used to access WaveMaker AI Analytics service|
:::note
In the preceding table, `[mycompany]` is used as an example. You may have to replace `[mycompany]` with your appropriate domain name.
:::

### **Docker Container Access**

- An IP range to be assigned to the Docker containers internally. The Minimum [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing#CIDR_notation) (Classless Inter-Domain Routing) range for Docker container network is 24.

You will be needing to assign a /24 CIDR to Docker during setup. This IP range should not be in use anywhere on your network and can be completely different from your network’s range. These IPs are assigned internally by Docker to containers and these IPs won’t be exposed on your network.

For example, if your network is using a 10.x.x.x_range and the range_192.168.x.x is not used anywhere in your network, you may assign this 192.168.x.x range to Docker. See [here](https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces) for the possible LAN IP ranges.
