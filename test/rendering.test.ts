import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLayout } from '../src/lib/layout.js';
import { renderMarkdown } from '../src/lib/markdown.js';
import { getRelativeHref } from '../src/lib/routes.js';

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

test('renderLayout should generate route-aware navigation links for nested pages', () => {
  const html = renderLayout({
    route: '/blog/example',
    assetPrefix: '../../',
    pageTitle: 'Nested page',
    title: 'Nested page',
    content: '<p>Body</p>',
  });

  assert.match(html, /href=\"\.\.\/\.\.\/\">Home<\/a>/);
  assert.match(html, /href=\"\.\.\/\.\.\/sitemap\/\">Sitemap<\/a>/);
});

test('getRelativeHref should resolve nested routes relative to generated output directories', () => {
  assert.equal(getRelativeHref('/blog/example', '/'), '../../');
  assert.equal(getRelativeHref('/blog/example', '/sitemap'), '../../sitemap/');
  assert.equal(getRelativeHref('/sitemap', '/'), '../');
});
