import Prism from 'prismjs';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-bash.js';
import { Marked, Tokens } from 'marked';
import { escapeHtml } from './html.js';

interface CodeFenceOptions {
  language: string;
  lineNumbers: boolean;
  lineOffset: number;
  highlightedLines: Set<number>;
}

function parseHighlightedLines(value: string): Set<number> {
  const result = new Set<number>();

  for (const segment of value.split(',')) {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) {
      continue;
    }

    const [rawStart, rawEnd] = trimmedSegment.split('-');
    const start = Number.parseInt(rawStart, 10);
    const end = rawEnd ? Number.parseInt(rawEnd, 10) : start;

    if (Number.isNaN(start) || Number.isNaN(end) || start <= 0 || end < start) {
      continue;
    }

    for (let current = start; current <= end; current += 1) {
      result.add(current);
    }
  }

  return result;
}

function parseCodeFenceInfo(rawInfo: string | undefined): CodeFenceOptions {
  const tokens = (rawInfo ?? '').split(/\s+/).filter(Boolean);
  const [language = '', ...directives] = tokens;

  let lineNumbers = false;
  let lineOffset = 1;
  let highlightedLines = new Set<number>();

  for (const directive of directives) {
    if (directive === 'lineNumbers') {
      lineNumbers = true;
      continue;
    }

    const [key, value] = directive.split('=');
    if (!value) {
      continue;
    }

    if (key === 'line') {
      highlightedLines = parseHighlightedLines(value);
      lineNumbers = true;
    } else if (key === 'lineOffset') {
      const parsedOffset = Number.parseInt(value, 10);
      if (!Number.isNaN(parsedOffset) && parsedOffset > 0) {
        lineOffset = parsedOffset;
        lineNumbers = true;
      }
    }
  }

  return {
    language,
    lineNumbers,
    lineOffset,
    highlightedLines,
  };
}

function highlightCode(code: string, language: string): string {
  const prismLanguage = Prism.languages[language];
  if (!prismLanguage) {
    return escapeHtml(code);
  }

  return Prism.highlight(code, prismLanguage, language);
}

function renderCodeBlock(code: string, rawInfo: string | undefined): string {
  const options = parseCodeFenceInfo(rawInfo);

  if (options.language === 'mermaid') {
    return `<pre class="mermaid">${escapeHtml(code.trimEnd())}</pre>`;
  }

  const normalizedCode = code.replace(/\r\n/g, '\n').replace(/\n$/, '');
  const highlighted = highlightCode(normalizedCode, options.language);
  const lines = highlighted.split('\n');
  const codeLines = lines.map((line, index) => {
    const lineNumber = options.lineOffset + index;
    const attributes = [`class="code-line${options.highlightedLines.has(index + 1) ? ' is-highlighted' : ''}"`];
    if (options.lineNumbers) {
      attributes.push(`data-line-number="${lineNumber}"`);
    }

    return `<span ${attributes.join(' ')}>${line || ' '}</span>`;
  }).join('\n');

  const languageClass = options.language ? ` language-${escapeHtml(options.language)}` : '';
  const preClass = options.lineNumbers ? 'code-block has-line-numbers' : 'code-block';

  return [
    `<pre class="${preClass}" data-language="${escapeHtml(options.language || 'plain-text')}">`,
    '<button type="button" class="copy-code" data-copy-code>Copy</button>',
    `<code class="${languageClass.trim()}">`,
    codeLines,
    '</code>',
    '</pre>',
  ].join('');
}

const marked = new Marked({
  gfm: true,
});

marked.use({
  renderer: {
    code(token: Tokens.Code): string {
      return renderCodeBlock(token.text, token.lang);
    },
  },
});

export function renderMarkdown(source: string): string {
  return marked.parse(source) as string;
}
