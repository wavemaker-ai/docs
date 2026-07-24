/** @type {import('@docusaurus/plugin-content-docs').SidebarConfig} */
export default [
  {
    type: 'doc',
    id: 'developing-with-agents/index',
    label: 'Developing with agents',
  },
  {
    type: 'category',
    label: 'Get started',
    collapsible: true,
    collapsed: false,
    items: [
      {
        type: 'doc',
        id: 'developing-with-agents/get-started/before-you-begin',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/get-started/choose-an-agent',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/get-started/write-effective-requests',
      },
    ],
  },
  {
    type: 'category',
    label: 'Understand the workflow',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'developing-with-agents/understand-the-workflow/how-it-works',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/understand-the-workflow/skills-and-project-context',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/understand-the-workflow/sessions-and-checkpoints',
      },
    ],
  },
  {
    type: 'category',
    label: 'Build with agents',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'developing-with-agents/build-with-agents/user-interfaces',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/build-with-agents/apis-data-and-backend',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/build-with-agents/screenshot-to-code',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/build-with-agents/native-mobile',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/build-with-agents/security-and-localization',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/build-with-agents/extensions',
      },
    ],
  },
  {
    type: 'category',
    label: 'Control and collaborate',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'developing-with-agents/control-and-collaborate/review-and-manage-changes',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/control-and-collaborate/project-instructions',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/control-and-collaborate/visual-and-ai-development',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/control-and-collaborate/recovery-and-conflicts',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/control-and-collaborate/security-and-data-handling',
      },
    ],
  },
  {
    type: 'category',
    label: 'Reference',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'developing-with-agents/reference/supported-agents',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/reference/capabilities-and-limitations',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/reference/troubleshooting',
      },
      {
        type: 'doc',
        id: 'developing-with-agents/reference/terminology',
      },
    ],
  },
];
