/** @type {import('@docusaurus/plugin-content-docs').SidebarConfig} */
export default [
  {
    type: 'category',
    label: 'Concepts',
    link: {
      type: 'doc',
      id: 'design-system/concepts/index',
    },
    items: ['design-system/concepts/best-practices'],
  },
  {
    type: 'category',
    label: 'Design to Code',
    items: [
      'design-system/figma-design-to-code-plugin/working-with-design-to-code-plugin',
      'design-system/figma-design-to-code-plugin/design-guidelines',
      'design-system/figma-design-to-code-plugin/annotation-glossary',
      'design-system/figma-design-to-code-plugin/figma-cheat-sheet',
    ],
  },
  {
    type: 'category',
    label: 'Design System Project',
    collapsible: true,
    collapsed: true,
    link: {
      type: 'doc',
      id: 'design-system/design-system-project/index',
    },
    items: ['design-system/design-system-project/features'],
  },
];
