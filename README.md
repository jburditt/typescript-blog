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
- Mermaid extension point: Mermaid blocks render as `<pre class="mermaid">...</pre>`, and `assets/site.js` will auto-run `window.mermaid.run(...)` when Mermaid is present or expose `window.typescriptBlog.enhanceMermaid(...)` for custom enhancement

## Limitations

- Mermaid diagrams are not bundled directly; the generated HTML provides markup and a client-side hook so Mermaid can be added without coupling the build to Angular or a specific runtime.
- Syntax highlighting supports the Prism languages imported in `src/lib/markdown.ts`. Additional languages can be added there if needed.
