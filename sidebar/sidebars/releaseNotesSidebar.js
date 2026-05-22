/** @type {import('@docusaurus/plugin-content-docs').SidebarConfig} */
export default [
  {
    type: 'doc',
    id: 'release-notes/index',
    label: 'WaveMaker Releases',
  },
  {
    type: 'category',
    label: 'Release - Version 1',
    collapsible: true,
    collapsed: true,
    items: [
      {
        type: 'doc',
        id: 'release-notes/release-version-1/the-announcement',
        label: '📣 The Announcement ',
      },
      {
        type: 'category',
        label: '1.0.x',
        collapsible: true,
        collapsed: true,
        items: [
          {
            type: 'doc',
            id: 'release-notes/release-version-1/version-1-0-x/1.0.0-beta',
            label: '1.0.0 Beta',
          },
        ],
      },
    ],
  },
];
