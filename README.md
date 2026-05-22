# wavemaker.ai Documentation

Welcome to the wavemaker.ai Documentation repository! This site is built with [Docusaurus](https://docusaurus.io/) and serves as the comprehensive documentation hub for the Agentic Application Development Platform.

🌐 **Production Site** (prod branch): [WaveMaker.ai Docs](https://docs.wavemaker.ai/)

🌐 **Devlopment Site** (main branch): [WaveMaker.ai Next Docs](https://next-docs.wavemaker.ai/)

## Quick Start

### Prerequisites

- **Node.js** >= 20.0
- **npm** or **yarn**
- **Git**

### Local Development

1. **Clone the repository**
   ```bash
   git clone (https://github.com/wavemaker/ai-docs.git)
   cd docs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   
   This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

4. **Access the site**
   - Local URL: `http://localhost:3000`
   - The site will automatically reload when you make changes

### Build for Production

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Project Structure

```
docs/
├── docs/                    # Documentation content (MDX/Markdown files)
│   ├── apis-and-services/   # API and services documentation
│   ├── user-interfaces/     # UI component documentation
│   ├── studio/             # Studio-related docs
│   └── ...
├── blogs/                   # Blog content
│   ├── blog/               # Main blog posts
│   ├── feature-announcements/  # Feature announcements
│   └── whatsnew/           # Release notes
├── sidebar/                 # Sidebar configurations
│   └── sidebars/           # Individual sidebar files
├── src/                    # React components and custom pages
├── static/                 # Static assets (images, files)
├── scripts/                # Utility scripts
└── docusaurus.config.js    # Docusaurus configuration
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Serve production build locally
- `npm run clear` - Clear Docusaurus cache
- `npm run manage-docs` - Interactive CLI tool for managing documentation
- `npm run gen-metrics` - Generate documentation metrics

## Documentation Management

We provide a powerful CLI tool to help manage documentation structure:

```bash
npm run manage-docs
```

This interactive tool allows you to:
- Create new sidebars
- Add categories to existing sidebars
- Create new documentation pages
- Maintain proper file organization

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:

- Content creation and editing
- File organization conventions
- Markdown and MDX best practices
- Review process
- Style guidelines

## Technology Stack

- **Framework**: [Docusaurus 3.x](https://docusaurus.io/)
- **Content**: MDX (Markdown + JSX)
- **Styling**: CSS Modules + Custom CSS
- **Search**: Algolia DocSearch
- **Diagrams**: Mermaid

## License

This project is licensed under the terms specified by WaveMaker, Inc. 


## Branching & Contribution Workflow

We follow a simple branching setup to keep the docs stable, while still making it easy to work on changes.

## Working Branch (`main`)

- `main` is where **all active documentation work happens**.
- All documentation updates, fixes, and content changes should be based on `main`.

### Contribution Flow (Fork-based)

- Contributors **must fork the repository from `main`**
- Work should be done in a **branch created from the forked `main`**
- Once changes are ready:
  - Raise a **Pull Request to the upstream `main` branch**
- Direct pushes to the upstream `main` branch are restricted

### Feature-Specific Branches

- For any structural changes (like navigation, search, UI updates, or plugins):
  - Create a **temporary feature branch from `main`**
  - Use the following naming format:
    ```
    feature/<feature-name>
    ```
    Examples:
    ```
    feature/docs-search
    feature/new-theme
    ```

- These branches are meant to be **temporary**:
  - Use them only while the feature is being built
  - Merge them back into `next` via a Pull Request when done
  - Delete the branch after merging to keep things tidy
  - Never merge feature branches directly into `main`

### Prod Branch (`prod`)
- This is the **stable, production** version of the documentation.
- Please **don’t commit directly or raise pr** to `prod`.
- Updates reach `prod` **only through a Pull Request from `main`**.




