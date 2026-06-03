/** @type {import('@docusaurus/plugin-content-docs').SidebarConfig} */
export default [
  {
    type: 'category',
    label: 'App Solutions',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/app-solutions/overview',
        label: 'App Solutions',
      },
      {
        type: 'doc',
        id: 'guide/app-solutions/migrate-to-design-system-project',
        label: 'Migrate to Design System',
      },
    ],
  },
  {
    type: 'category',
    label: 'integration',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/integration/overview',
        label: 'Integration',
      },
      {
        type: 'doc',
        id: 'guide/integration/set-up-wavemaker-project-locally',
        label: 'Local Setup with Workspace Sync',
      },
      {
        type: 'doc',
        id: 'guide/integration/use-sse-in-wavemaker-ui',
        label: 'Handle SSE Events',
      },
    ],
  },

  {
    type: 'category',
    label: 'components',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/components/overview',
        label: 'Components',
      },
      {
        type: 'doc',
        id: 'guide/components/dynamic-form-metadata',
        label: 'Dynamic Form with Metadata',
      },
    ],
  },

  {
    type: 'category',
    label: 'security',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/security/customizing-post-authentication-handlers',
        label: 'Customize Post-Authentication Handlers',
      },
      {
        type: 'doc',
        id: 'guide/security/add-custom-filters',
        label: 'Add Custom Filters',
      },
    ],
  },

  {
    type: 'category',
    label: 'deployment',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/deployment/overview',
        label: 'Deployment',
      },
      {
        type: 'doc',
        id: 'guide/deployment/ssl-offloading',
        label: 'SSL Termination',
      },
    ],
  },

  {
    type: 'category',
    label: 'Layouting And Styling',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/layouting-and-styling/overview',
        label: 'Layouting and Styling',
      },
    ],
  },

  {
    type: 'category',
    label: 'variables',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/variables/overview',
        label: 'Variables',
      },
    ],
  },

  {
    type: 'category',
    label: 'databases',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/databases/integrate-flyway-wavemaker',
        label: 'Flyway Integration',
      },
      {
        type: 'doc',
        id: 'guide/databases/db-crud-event-listeners',
        label: 'DB CRUD Event Listeners',
      },
    ],
  },

  {
    type: 'category',
    label: 'java-services',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/java-services/schedule-java-service',
        label: 'Schedule a Java Service',
      },
      {
        type: 'doc',
        id: 'guide/java-services/custom-status-code-and-error-message',
        label: 'Custom Status Codes & Error Messages',
      },
    ],
  },

  {
    type: 'category',
    label: 'Device Native',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'guide/device-native/store-credentials-with-secure-store',
        label: 'Secure Store',
      },
    ],
  },
];
