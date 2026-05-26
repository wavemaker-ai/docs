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
        id: 'user-interfaces/mobile/concepts/overview',
      },
      {
        type: 'doc',
        id: 'user-interfaces/mobile/concepts/tech-stack',
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
        id: 'user-interfaces/mobile/components/mobile-components',
        label: 'Mobile Components',
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
        label: 'Create React Native App',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/mobile/develop/create-reactnative-app-project/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/create-reactnative-app-project/project-structure',
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
                id: 'user-interfaces/mobile/develop/create-reactnative-app-project/reactnative-project-structure',
                label: 'React Native',
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
          id: 'user-interfaces/mobile/develop/page/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/page/properties',
            label: 'Properties & Behaviour',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/page/types',
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
          id: 'user-interfaces/mobile/develop/working-with-layouts/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/working-with-layouts/auto-layout',
            label: 'Auto Layout',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/working-with-layouts/container-types',
            label: 'Container types',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/working-with-layouts/responsive-design-with-layouts',
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
          id: 'user-interfaces/mobile/develop/styling-with-design-tokens/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/styling-with-design-tokens/introduction-to-foundation-css',
            label: 'Introduction to Foundation CSS',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/styling-with-design-tokens/design-token-architecture',
            label: 'Design Token Architecture',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/styling-with-design-tokens/working-with-style-workspace',
            label: 'Working with Style Workspace',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/styling-with-design-tokens/customising-your-application',
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
          id: 'user-interfaces/mobile/develop/integrating-with-apis/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/integrating-with-apis/variables',
            label: 'Variables',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/integrating-with-apis/life-cycle-hooks',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/integrating-with-apis/bind-expressions',
            label: 'Bind expressions',
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
      //       id: 'user-interfaces/mobile/develop/component-behaviour-and-methods/common-properties',
      //       label: 'Common properties',
      //     },
      //     {
      //       type: 'doc',
      //       id: 'user-interfaces/mobile/develop/component-behaviour-and-methods/javascript-access',
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
          id: 'user-interfaces/mobile/develop/form-input-validations/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/form-input-validations/custom-validators-in-javascript',
            label: 'Custom validators in JavaScript',
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
          id: 'user-interfaces/mobile/develop/events/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/events/app-page-events',
            label: 'App and Page Events',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/events/variable-events',
            label: 'Variable Events',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/events/ui-events',
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
          id: 'user-interfaces/mobile/develop/actions/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/develop/actions/types',
            label: 'Types',
          },
        ],
      },
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
        id: 'user-interfaces/mobile/enterprise-capabilities/accessibility',
      },
      {
        type: 'doc',
        id: 'user-interfaces/mobile/enterprise-capabilities/language-support-i18n',
      },
      {
        type: 'category',
        label: 'Prefabs',
        collapsible: true,
        collapsed: true,
        link: {
          type: 'doc',
          id: 'user-interfaces/mobile/enterprise-capabilities/prefabs/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/enterprise-capabilities/prefabs/create-prefab',
            label: 'Creating prefabs',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/enterprise-capabilities/prefabs/publishing',
            label: 'Publishing',
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
          id: 'user-interfaces/mobile/enterprise-capabilities/wmx/index',
        },
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/enterprise-capabilities/wmx/wmx-schema-reference',
            label: 'WMX schema reference',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/enterprise-capabilities/wmx/wmx-with-aira',
            label: 'Creating with AIRA',
          },
        ],
      },
    ],
  },

  {
    type: 'category',
    label: 'Testing & Debugging',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'user-interfaces/mobile/testing-and-debugging/debugging-overview',
        label: 'Debugging Overview',
      },
      {
        type: 'category',
        label: 'Community Debugging Tools',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/community-debugging-tools/chrome-devtools',
            label: 'Chrome DevTools',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/community-debugging-tools/react-devtools',
            label: 'React DevTools',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/community-debugging-tools/react-native-devtools',
            label: 'React Native DevTools',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/community-debugging-tools/expo-dev-tools',
            label: 'Expo Dev Tools',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/community-debugging-tools/reactotron',
            label: 'Reactotron',
          },
        ],
      },
      {
        type: 'category',
        label: 'WaveMaker Debugging Tools',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/wm-debugging-tools/wavepulse',
            label: 'WavePulse',
          },
        ],
      },
      {
        type: 'category',
        label: 'Testing Strategies',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/testing-strategies/ui-testing-mobile',
            label: 'Mobile app testing',
          },
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/testing-strategies/automate-testing',
            label: 'Automated testing',
          },
        ],
      },
      {
        type: 'category',
        label: 'Unit Testing',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'user-interfaces/mobile/testing-and-debugging/unit-testing/unit-testing-mobile',
          },
        ],
      },
    ],
  },
  {
    type: 'category',
    label: 'device-capabilities-mobile',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'user-interfaces/mobile/device-capabilities-mobile/third-party-expo-plugins',
      },
      // {
      //   type: 'doc',
      //   id: 'user-interfaces/mobile/device-capabilities-mobile/offline-support',
      // },
    ],
  },
];
