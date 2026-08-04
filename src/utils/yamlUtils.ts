import { MarkdownDoc, SupportedEncoding } from '../types';

/**
 * UPDATE 2026-08-04: MarkdownDoc から YAML Front Matter 文字列を生成する
 */
export function buildYamlFrontMatter(doc: Partial<MarkdownDoc>): string {
  const title = doc.title || '無題のドキュメント';
  const author = doc.author || '作成者';
  const created = doc.createdAt || new Date().toISOString();
  const updated = doc.updatedAt || new Date().toISOString();
  const updatedBy = doc.updatedBy || author;
  const encoding = doc.encoding || 'UTF-8';
  const tags = doc.tags && doc.tags.length > 0 ? doc.tags : [];

  const formattedTags = tags.length > 0
    ? `[${tags.map(t => JSON.stringify(t)).join(', ')}]`
    : '[]';

  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `author: ${JSON.stringify(author)}`,
    `created: ${JSON.stringify(created)}`,
    `updated: ${JSON.stringify(updated)}`,
    `updatedBy: ${JSON.stringify(updatedBy)}`,
    `encoding: ${JSON.stringify(encoding)}`,
    `tags: ${formattedTags}`,
    '---',
  ].join('\n');
}

/**
 * UPDATE 2026-08-04: YAML Front Matter を含む完全な Markdown テキストを生成
 * Why: エクスポート時やファイル出力時にのみ Front Matter を付与し、かつ重複付与や空行の累積を防止するため。
 */
export function buildFullMarkdownWithFrontMatter(doc: MarkdownDoc): string {
  const frontMatter = buildYamlFrontMatter(doc);
  // もし doc.content 内にすでに frontMatter がある場合は除去して本文のみを取り出す
  const { body } = parseYamlFrontMatter(doc.content || '');
  const cleanBody = body.trimStart();
  return `${frontMatter}\n\n${cleanBody}`;
}

export interface ParsedYamlMetadata {
  title?: string;
  author?: string;
  created?: string;
  updated?: string;
  updatedBy?: string;
  encoding?: SupportedEncoding;
  tags?: string[];
}

/**
 * ファイルのテキスト内容から YAML Front Matter と本文を抽出・パースする
 */
export function parseYamlFrontMatter(fullText: string): {
  body: string;
  metadata: ParsedYamlMetadata;
} {
  const normalized = fullText.replace(/\r\n/g, '\n');
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = normalized.match(frontMatterRegex);

  if (!match) {
    return {
      body: fullText,
      metadata: {},
    };
  }

  const rawYaml = match[1];
  // match[0] の後の本文を取得し、先頭の改行を除去
  const body = normalized.slice(match[0].length).replace(/^[\r\n]+/, '');
  const metadata: ParsedYamlMetadata = {};

  const lines = rawYaml.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    // 引用符の除去
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (key === 'title') metadata.title = val;
    if (key === 'author') metadata.author = val;
    if (key === 'created') metadata.created = val;
    if (key === 'updated') metadata.updated = val;
    if (key === 'updatedBy') metadata.updatedBy = val;
    if (key === 'encoding') metadata.encoding = val as SupportedEncoding;
    if (key === 'tags') {
      // [tag1, tag2] の解釈
      if (val.startsWith('[') && val.endsWith(']')) {
        const tagItems = val
          .slice(1, -1)
          .split(',')
          .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
          .filter((t) => t.length > 0);
        metadata.tags = tagItems;
      }
    }
  }

  return { body, metadata };
}
