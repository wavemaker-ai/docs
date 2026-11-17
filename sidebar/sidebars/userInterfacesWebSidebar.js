/** @type {import('@docusaurus/plugin-content-docs').SidebarConfig} */
export default [
  {
    type: 'category',
    label: 'Concepts',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'user-interfaces/web/concepts/overview',
      },
      {
        type: 'doc',
        id: 'user-interfaces/web/concepts/development-model',
        label: 'Development Model',
      },

      {
        type: 'doc',
        id: 'user-interfaces/web/concepts/tech-stack',
      },
    ],
  },
  {
    type: 'category',
    label: 'Components',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'user-interfaces/web/components/react-components',
        label: 'React Components',
      },
    ],
  },
  {
    type: 'category',
    label: 'Develop',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'category',
        label: 'Create Web App',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/create-web-app-project/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/create-web-app-project/project-structure',
            label: 'Project structure',
          },
          {
            type: 'category',
            label: 'Generated Code',
            collapsible: true,
            collapsed: true,
            items: [
              {
                type: 'doc',
                id: 'user-interfaces/web/develop/create-web-app-project/angular-project-structure',
                label: 'Angular',
              },
              {
                type: 'doc',
                id: 'user-interfaces/web/develop/create-web-app-project/react-project-structure',
                label: 'React',
              },
            ],
          },
        ],
      },
      {
        type: 'category',
        label: 'Create a page',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/page/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/page/properties',
            label: 'Properties & Behaviour',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/page/types',
            label: 'Types',
          },
        ],
      },
      {
        type: 'category',
        label: 'Working with Layouts',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/working-with-layouts/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/working-with-layouts/auto-layout',
            label: 'Auto Layout',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/working-with-layouts/component-with-layouting-features',
            label: 'Component with Layouting features',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/working-with-layouts/responsive-design-with-layouts',
            label: 'Responsive Design with Layouts',
          },
        ],
      },
      {
        type: 'category',
        label: 'Styling with Design Tokens',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/styling-with-design-tokens/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/styling-with-design-tokens/introduction-to-foundation-css',
            label: 'Introduction to Foundation CSS',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/styling-with-design-tokens/design-token-architecture',
            label: 'Design Token Architecture',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/styling-with-design-tokens/working-with-style-workspace',
            label: 'Working with Style Workspace',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/styling-with-design-tokens/component-variants',
            label: 'Component Variants',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/styling-with-design-tokens/customising-your-application',
            label: 'Customising your Application',
          },
        ],
      },
      {
        type: 'category',
        label: 'Integrating with APIs',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/integrating-with-apis/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/integrating-with-apis/variables',
            label: 'Variables',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/integrating-with-apis/life-cycle-hooks',
          },
        ],
      },
      // {
      //   type: 'category',
      //   label: 'Component behaviour & methods',
      //   collapsible: true,
      //   collapsed: true,
      //   items: [
      //     {
      //       type: 'doc',
      //       id: 'user-interfaces/web/develop/component-behaviour-and-methods/common-properties',
      //       label: 'Common properties',
      //     },
      //     {
      //       type: 'doc',
      //       id: 'user-interfaces/web/develop/component-behaviour-and-methods/javascript-access',
      //       label: 'JavaScript access methods',
      //     },
      //   ],
      // },
      {
        type: 'category',
        label: 'Validations',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/form-input-validations/index',
        },
        items: [
          // {
          //   type: 'doc',
          //   id: 'user-interfaces/web/develop/form-input-validations/validation-messages',
          //   label: 'Validation messages',
          // },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/form-input-validations/custom-validators-in-javascript',
            label: 'Custom validators in JavaScript',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/form-input-validations/bind-expressions',
            label: 'Bind expressions',
          },
        ],
      },

      {
        type: 'category',
        label: 'Event Handling',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/events/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/events/app-page-events',
            label: 'App and Page Events',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/events/variable-events',
            label: 'Variable Events',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/events/ui-events',
            label: 'UI Component Events',
          },
        ],
      },
      {
        type: 'category',
        label: 'Actions',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/develop/actions/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/develop/actions/types',
            label: 'Types',
          },
        ],
      },
      // {
      //   type: 'doc',
      //   id: 'user-interfaces/web/develop/input-validations',
      // },
      // {
      //   type: 'doc',
      //   id: 'user-interfaces/web/develop/state-management',
      // },
      // {
      //   type: 'category',
      //   label: 'State Management',
      //   collapsible: true,
      //   collapsed: true,
      //   items: [
      //     {
      //       type: 'doc',
      //       id: 'user-interfaces/web/develop/state-management/overview',
      //       label: 'State Management',
      //     },
      //   ],
      // },
    ],
  },
  {
    type: 'category',
    label: 'Enterprise capabilities',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'user-interfaces/web/enterprise-capabilities/accessibility',
      },
      {
        type: 'doc',
        id: 'user-interfaces/web/enterprise-capabilities/language-support-i18n',
      },
      {
        type: 'category',
        label: 'prefabs',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/prefabs/overview',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/prefabs/create-prefab',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/prefabs/publishing',
          },
        ],
      },
      {
        type: 'category',
        label: 'WMX components',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/web/enterprise-capabilities/wmx/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/wmx/wmx-schema-reference',
            label: 'WMX schema reference',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/wmx/wmx-with-aira',
            label: 'Create WMX components',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/wmx/wmx-examples',
            label: 'Examples',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/wmx/develop-locally',
            label: 'Develop and test locally',
          },
          {
            type: 'doc',
            id: 'user-interfaces/web/enterprise-capabilities/wmx/use-wmx-component',
            label: 'Use in your app',
          },
        ],
      },
      // {
      //   type: 'doc',
      //   id: 'user-interfaces/web/enterprise-capabilities/prefabs',
      // },
      // {
      //   type: 'doc',
      //   id: 'user-interfaces/web/enterprise-capabilities/role-based-access-control',
      // },
    ],
  },
  {
    type: 'category',
    label: 'Testing & Debugging',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'category',
        label: 'community-debugging-tools',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/testing-and-debugging/community-debugging-tools/flipper-expo-dev-tools',
          },
        ],
      },
      {
        type: 'category',
        label: 'testing-strategies',
        collapsible: true,
        collapsed: true,
        items: [
          // {
          //   type: 'doc',
          //   id: 'user-interfaces/web/testing-and-debugging/testing-strategies/ui-testing-mobile',
          // },
          {
            type: 'doc',
            id: 'user-interfaces/web/testing-and-debugging/testing-strategies/ui-testing-web',
          },
        ],
      },
      {
        type: 'category',
        label: 'unit-testing',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/web/testing-and-debugging/unit-testing/web-and-mobile',
          },
        ],
      },
    ],
  },
];
