import { ParsedMetadata } from '@fullswing/content-model';

export interface BlogEntry extends ParsedMetadata {
  kind: 'blog';
  id: string;
  markdownPath: string;
  metadataPath: string;
}

export interface PageEntry extends ParsedMetadata {
  kind: 'page';
  name: string;
  metadataPath: string;
  modulePath: string;
}

export type ContentEntry = BlogEntry | PageEntry;

export interface CategorySummary {
  name: string;
  displayName: string;
  slug: string;
  count: number;
}

export interface RepositoryView {
  getBlog(route: string): BlogEntry | undefined;
  getPage(route: string): PageEntry | undefined;
  getBlogs(): BlogEntry[];
  getPages(): PageEntry[];
  getAll(): ContentEntry[];
  getCategories(): CategorySummary[];
}

export interface PageRenderContext {
  metadata: PageEntry;
  repository: RepositoryView;
  escapeHtml: (value: string) => string;
}

export type PageRenderFunction = (context: PageRenderContext) => string;
