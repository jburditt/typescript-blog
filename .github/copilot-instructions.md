# TypeScript Blog Copilot Instructions

## Commands

- Requires Node.js `>=20.19.0`. Install dependencies with `npm install`.
- `npm run compile` type-checks and emits TypeScript to `.build/`.
- `npm test` cleans generated output, compiles, then runs all native `node:test` tests from `.build/test/`.
- Run one named test after compiling with:
  ```bash
  npm run compile && node --test --test-name-pattern="renderLayout should escape" .build/test/rendering.test.js
  ```
  Run every test in one generated file by omitting `--test-name-pattern`.
- `npm run build` cleans, compiles, discovers content, copies assets, and writes the static site to `dist/`; `npm run verify` runs tests followed by that build.
- `npm run preview` builds and serves `dist/` on `http://localhost:5173/` (set `PORT` to override). `npm start` additionally watches `src/` and `public/` and triggers live reload.
- There is no lint script.

## Architecture

- This is an ESM Node/TypeScript static-site generator, not a client framework app. `src/build.ts` is the orchestration entry point: it discovers content, creates a `ContentRepository`, copies assets, renders every route, and writes directory-style output such as `dist/blog/<id>/index.html`.
- Blog content lives in `public/blog/<year>/` (recursively) as same-basename Markdown and JSON metadata pairs. Discovery derives each route from the basename as `/blog/<basename>`; the year directory does not affect the route.
- Rich pages live in `src/pages/` as same-basename `.ts` renderer and `.json` metadata pairs. Build dynamically imports the **compiled** `.build/src/pages/*.js` renderer, so page renderers must remain included by `tsconfig.json`.
- `ContentRepository` sorts blogs, pages, and combined content by descending parsed date (then title), and computes category summaries used by the generated home and sitemap pages.
- `renderLayout` owns the shared page shell; `renderers.ts` produces home/sitemap content; `markdown.ts` turns blog Markdown into HTML with Prism support; `src/assets/` is copied into `dist/assets/`. `public/` files are copied except `.md`, `.json`, and `.html`, which are treated as source content rather than published assets.

## Repository conventions

- TypeScript runs as NodeNext ESM: use `.js` extensions in relative TypeScript imports, including type-only imports.
- Content metadata must be a JSON object with non-empty `route`, `title`, `author`, and `categories`, plus a real `YYYY-MM-DD` `date`. The route must exactly be `/blog/<basename>` or `/page/<basename>` for its content type. Discovery deliberately fails on either side of an unmatched pair.
- Page modules must export `renderPage(context)` and return HTML. Escape interpolated values with `context.escapeHtml`; the generated layout escapes metadata but intentionally accepts rendered content HTML.
- Preserve directory-style route behavior. Use `getRelativeHref` for internal links, `getAssetPrefix` for static asset paths, and `getOutputPath` for output locations instead of constructing route-relative paths manually.
- Markdown fenced-code directives are parsed from the info string: `lineNumbers`, `line=2-4`, and `lineOffset=10`. Prism languages must be imported in `src/lib/markdown.ts` before using them in content.
- Azure deployment is intentionally pinned to `rg-typescript-blog`. Keep `azure.yaml`, `.github/workflows/deploy.yml`, and the lifecycle scripts aligned; the scripts refuse to manage another resource group.
