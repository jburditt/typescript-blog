export interface ContentMetadata {
  route: string;
  title: string;
  categories: string[];
  author: string;
  date: string;
}

export interface ParsedMetadata extends ContentMetadata {
  dateValue: Date;
}
