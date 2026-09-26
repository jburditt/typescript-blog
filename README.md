# TypeScript Blog

`projects/typescript-blog` is a standalone Node.js + TypeScript static-site generator that mirrors the functional behavior of `projects/fullswing-blog` without depending on the Angular CLI.

## Install

From the repository root:

```bash
npm install
npm --prefix projects/typescript-blog install
```

## Build

```bash
npm --prefix projects/typescript-blog run build
```

The build compiles the generator to `.build/`, discovers content, validates metadata, copies non-content assets, and writes static HTML into `projects/typescript-blog/dist/`.

## Verify in CI

```bash
npm --prefix projects/typescript-blog run verify
```

`verify` runs the focused test suite and then performs a full static build.

## Local preview

```bash
npm --prefix projects/typescript-blog run preview
```

Opening `dist/index.html` directly via `file://` shows a raw directory listing for friendly URLs like `/blog/<id>/`, because browsers don't resolve `index.html` for directories without a server. `preview` builds the site and serves `dist/` over HTTP on `http://localhost:5173/` (override with the `PORT` env var), resolving friendly URLs to their `index.html` without redirecting. Use `npm run serve` to serve an existing `dist/` without rebuilding.

Run `npm start` to build and serve the site while watching `src/` and `public/`. After each successful rebuild, open preview tabs refresh automatically at `http://localhost:5173/` (override with the `PORT` env var).

## Azure deployment

The `azd` project is pinned to the Azure resource group `rg-typescript-blog`.

- `azd up` reuses that resource group when it already exists and creates it first when it does not.
- `azd down` tears down the application resources and then deletes `rg-typescript-blog`.
- `.github/workflows/deploy.yml` applies the same lifecycle non-interactively for CI deploy and destroy runs.

## Output structure

```text
dist/
  index.html
  sitemap/index.html
  blog/<id>/index.html
  page/<name>/index.html
  assets/site.css
  assets/site.js
```

## Content authoring

### Markdown blog posts

Place Markdown and metadata sidecars in a year folder beneath `public/blog/`:

```text
public/blog/2025/my-post.md
public/blog/2025/my-post.json
```

Metadata must include:

- `route` — must match `/blog/<basename>` regardless of the source year folder
- `title`
- `categories`
- `author`
- `date` — ISO format `YYYY-MM-DD`

The build recursively discovers year folders and fails fast if a Markdown file or metadata file is missing its same-basename partner.

### Page renderers

Place renderers and metadata sidecars in `src/pages/`:

```text
src/pages/my-page.ts
src/pages/my-page.json
```

Each renderer must export:

```ts
export const renderPage = (context) => '<p>HTML</p>';
```

The sidecar JSON must use route `/page/<basename>`.

## Features

- Automatic discovery of blog posts and page renderers
- In-memory repository API with `getBlog`, `getPage`, `getBlogs`, `getPages`, `getAll`, and `getCategories`
- GFM Markdown rendering
- Prism-based syntax highlighting
- Server-rendered line numbers and line highlighting for fenced code blocks using info-string directives such as `line=2-4 lineOffset=10`
- Minimal client-side category filtering and copy-to-clipboard behavior
- Header social navigation uses accessible GitHub and LinkedIn SVG icons with lighter resting fills and darker hover/focus states
- Mermaid extension point: Mermaid blocks render as `<pre class="mermaid">...</pre>`, and `assets/site.js` will auto-run `window.mermaid.run(...)` when Mermaid is present or expose `window.typescriptBlog.enhanceMermaid(...)` for custom enhancement

## Limitations

- Mermaid diagrams are not bundled directly; the generated HTML provides markup and a client-side hook so Mermaid can be added without coupling the build to Angular or a specific runtime.
- Syntax highlighting supports the Prism languages imported in `src/lib/markdown.ts`. Additional languages can be added there if needed.

## Azure Deployments

- To destroy the Azure resources run `azd down --force --purge`
- To provision the Azure resources run `azd provision`

## Spec-Kit

### Shorter path — for smaller features:

- `/speckit-specify`
- `/speckit-plan`
- `/speckit-tasks`
- `/speckit-implement`
- `/speckit-converge`

### Full path — for production features, adding /speckit-clarify, /speckit-checklist, and /speckit-analyze as quality gates:

- `/speckit-constitution` (once per project)
- `/speckit-specify`
- `/speckit-clarify`
- `/speckit-plan`
- `/speckit-checklist`
- `/speckit-tasks`
- `/speckit-analyze`
- `/speckit-implement`
- `/speckit-converge`

## To-Do

- Implement pages e.g. angular-blog.html and azure-static-app.html OR use the existing pageRenderers
- Handle cases where blog filenames are the same in different year folders
- Remove route from blog.json files
- Add spec-kit
- Add unit and Playwright tests with Axe
- Add best practices instructions and documentation
- Add TypeScript skills
- Add AI category and tag relevant blogs
- Deploy to Azure static web app, preferably using Terraform or similar
- Add the ability to link/preview OneDrive files
- Consider moving the markdown and html files to OneDrive, which would require syncing folders
- Remove category "Bicep" and replace with Azure
- Make the cateogory pills collapsible, add a Filter icon right aligned on the same row as "Latest Content"