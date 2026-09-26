import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLayout } from '../src/lib/layout.js';
import { renderMarkdown } from '../src/lib/markdown.js';
import { renderHomePage, renderSitemapPage } from '../src/lib/renderers.js';
import { ContentRepository } from '../src/lib/repository.js';
import { getRelativeHref } from '../src/lib/routes.js';
import { BlogEntry, PageEntry } from '../src/lib/types.js';

test('renderMarkdown should add line numbers and highlighted lines for fenced code blocks', () => {
  const html = renderMarkdown('```typescript line=2 lineOffset=10\nconst one = 1;\nconst two = 2;\n```');
  const defaultNumberedHtml = renderMarkdown('```typescript\nconst one = 1;\nconst two = 2;\n```');

  assert.match(html, /data-line-number="10"/);
  assert.match(html, /data-line-number="11"/);
  assert.match(html, /code-line is-highlighted/);
  assert.match(defaultNumberedHtml, /class="code-block has-line-numbers"/);
  assert.match(defaultNumberedHtml, /data-line-number="1"/);
  assert.match(defaultNumberedHtml, /data-line-number="2"/);
  assert.doesNotMatch(defaultNumberedHtml, /<\/span>\s+<span class="code-line/);
});

test('renderMarkdown should highlight comma-separated lines and ranges', () => {
  const html = renderMarkdown('```typescript line=1,3-4\nconst one = 1;\nconst two = 2;\nconst three = 3;\nconst four = 4;\n```');
  const lineClasses = [...html.matchAll(/class="(code-line(?: is-highlighted)?)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(lineClasses, [
    'code-line is-highlighted',
    'code-line',
    'code-line is-highlighted',
    'code-line is-highlighted',
  ]);
});

test('renderMarkdown should preserve escaped Mermaid source without code controls', () => {
  const html = renderMarkdown('```mermaid\ngraph TD;\n<script>alert(1)</script>\n```');

  assert.match(html, /<pre class="mermaid">graph TD;\n&lt;script&gt;alert\(1\)&lt;\/script&gt;<\/pre>/);
  assert.doesNotMatch(html, /data-copy-code/);
});

test('renderLayout should escape metadata values before injecting them into the page shell', () => {
  const html = renderLayout({
    route: '/blog/example',
    assetPrefix: '../../',
    pageTitle: 'Unsafe <title>',
    title: 'Unsafe <heading>',
    author: 'Author <name>',
    date: new Date('2025-10-31T00:00:00.000Z'),
    categories: ['CSharp'],
    content: '<p>Safe body</p>',
  });

  assert.match(html, /Unsafe &lt;title&gt;/);
  assert.match(html, /Unsafe &lt;heading&gt;/);
  assert.match(html, /Author &lt;name&gt;/);
  assert.match(html, /C#/);
});

test('renderLayout should render an accessible author byline below the title', () => {
  const html = renderLayout({
    route: '/blog/example',
    assetPrefix: '../../',
    pageTitle: 'Nested page',
    title: 'Nested page',
    author: 'Jebb Burditt',
    date: new Date('2025-10-17T00:00:00.000Z'),
    content: '<p>Body</p>',
  });

  assert.match(html, /<h1>Nested page<\/h1>\s+<div class="page-meta post-byline">/);
  assert.match(html, /src="\.\.\/\.\.\/assets\/avatar\.png" alt="Portrait of Jebb Burditt"/);
  assert.match(html, /<time datetime="2025-10-17T00:00:00\.000Z">Oct 17, 2025<\/time>/);
});

test('home and sitemap listings should render compact author metadata with route-relative avatars', () => {
  const blogs: BlogEntry[] = [{
    kind: 'blog',
    id: 'example',
    route: '/blog/example',
    title: 'Example post',
    categories: ['Document'],
    author: 'Jebb Burditt',
    date: '2025-10-17',
    dateValue: new Date('2025-10-17T00:00:00.000Z'),
    markdownPath: '/tmp/example.md',
    metadataPath: '/tmp/example.json',
  }];
  const pages: PageEntry[] = [{
    kind: 'page',
    name: 'about',
    route: '/page/about',
    title: 'About',
    categories: ['Document'],
    author: 'Jebb Burditt',
    date: '2025-10-17',
    dateValue: new Date('2025-10-17T00:00:00.000Z'),
    metadataPath: '/tmp/about.json',
    modulePath: '/tmp/about.js',
  }];
  const repository = new ContentRepository(blogs, pages);
  const homeHtml = renderHomePage(repository);
  const sitemapHtml = renderSitemapPage(repository);

  assert.match(homeHtml, /src="\.\/assets\/avatar\.png" alt="Portrait of Jebb Burditt"/);
  assert.match(sitemapHtml, /src="\.\.\/assets\/avatar\.png" alt="Portrait of Jebb Burditt"/);
  for (const html of [homeHtml, sitemapHtml]) {
    assert.match(html, /class="content-list__avatar"/);
    assert.match(html, /<time datetime="2025-10-17T00:00:00\.000Z">Oct 17, 2025<\/time>/);
  }
});

test('renderLayout should include the external social navigation links', () => {
  const html = renderLayout({
    route: '/blog/example',
    assetPrefix: '../../',
    pageTitle: 'Nested page',
    title: 'Nested page',
    content: '<p>Body</p>',
  });

  assert.match(html, /class=\"social-links\"/);
  assert.match(html, /href=\"https:\/\/github\.com\/jburditt\"[^>]*aria-label=\"GitHub\"/);
  assert.match(html, /href=\"https:\/\/www\.linkedin\.com\/in\/jburditt\"[^>]*aria-label=\"LinkedIn\"/);
  assert.match(html, /<svg width=\"25\" height=\"24\"/g);
});

test('renderLayout should resolve the header logo from the generated asset directory', () => {
  const html = renderLayout({
    route: '/blog/example',
    assetPrefix: '../../',
    pageTitle: 'Nested page',
    title: 'Nested page',
    content: '<p>Body</p>',
  });

  assert.match(html, /src=\"\.\.\/\.\.\/assets\/logo\.jpg\"/);
  assert.match(html, /href=\"\.\.\/\.\.\/favicon\.png\"/);
});

test('renderLayout should load Mermaid for pages containing diagram blocks', () => {
  const html = renderLayout({
    route: '/blog/example',
    assetPrefix: '../../',
    pageTitle: 'Diagram page',
    title: 'Diagram page',
    content: '<pre class="mermaid">graph TD;</pre>',
  });

  assert.match(html, /mermaid@11\.12\.0\/dist\/mermaid\.min\.js/);
  assert.match(html, /mermaid\?\.initialize\(\{\s*startOnLoad: false,\s*securityLevel: 'strict'\s*\}\)/);
});

test('getRelativeHref should resolve nested routes relative to generated output directories', () => {
  assert.equal(getRelativeHref('/blog/example', '/'), '../../');
  assert.equal(getRelativeHref('/blog/example', '/sitemap'), '../../sitemap/');
  assert.equal(getRelativeHref('/sitemap', '/'), '../');
});
