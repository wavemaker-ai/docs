/** @type {import('@docusaurus/plugin-content-docs').SidebarConfig} */
export default [
  {
    type: 'doc',
    id: 'release-notes/index',
    label: 'WaveMaker Releases',
  },
  {
    type: 'category',
    label: 'Release - Version 12',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'release-notes/release-version-12/the-announcement',
        label: '📣 The Announcement ',
      },
      {
        type: 'category',
        label: '12.0.x',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'release-notes/release-version-12/version-12-0-x/12.0.0',
            label: '12.0.0',
          },
        ],
      },
    ],
  },
];
