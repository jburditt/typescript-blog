# Quickstart: Mermaid Diagram Rendering

## Prerequisites

- Node.js `>=20.19.0`
- Dependencies installed with `npm install`

## Static Rendering Validation

Run:

```bash
npm run compile
node --test --test-name-pattern="mermaid|Mermaid" .build/test/rendering.test.js
```

Expected outcomes:

- A `mermaid` fence produces an escaped `<pre class="mermaid">` block.
- HTML-sensitive source remains text and cannot inject markup.
- The generated page remains readable without a Mermaid runtime.

## Client Extension Validation

Run:

```bash
npm run compile
node --test --test-name-pattern="Mermaid" .build/test/site-client.test.js
```

The focused tests should cover no runtime, automatic `window.mermaid.run({ nodes })`, manual host
invocation after late loading, multiple blocks, rejected enhancement, and preservation of failed
source.

## Full Validation

Run:

```bash
npm test
npm run build
```

Expected outcomes:

- All native tests pass.
- The generated site contains Mermaid markup and route-correct shared asset references.
- A host can add Mermaid separately without changing the generator dependency set.

For an interactive browser check, serve the generated output with `npm run preview`, open a page
containing a Mermaid fence, and verify that the source is readable before a host runtime is added.
When a host supplies Mermaid, verify successful SVG enhancement and that a malformed diagram does
not hide its source or affect other article content.
