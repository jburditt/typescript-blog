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

  assert.match(html, /data-line-number="10"/);
  assert.match(html, /data-line-number="11"/);
  assert.match(html, /code-line is-highlighted/);
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

test('getRelativeHref should resolve nested routes relative to generated output directories', () => {
  assert.equal(getRelativeHref('/blog/example', '/'), '../../');
  assert.equal(getRelativeHref('/blog/example', '/sitemap'), '../../sitemap/');
  assert.equal(getRelativeHref('/sitemap', '/'), '../');
});
