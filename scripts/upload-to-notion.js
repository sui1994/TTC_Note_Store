/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
/*
  Upload PR draft markdown to Notion as a new page under a parent page.

  Requirements:
  - env NOTION_TOKEN: Notion Internal Integration Token
  - env NOTION_PARENT_PAGE_ID: The Notion parent page ID to create the page under
  - or env NOTION_PARENT_PAGE_URL: A Notion page URL to extract the page ID from
  - optional env NOTION_TITLE: Override page title

  Usage:
  - NOTION_TOKEN=xxx NOTION_PARENT_PAGE_ID=yyy npm run upload:notion
  - or
  - NOTION_TOKEN=xxx NOTION_PARENT_PAGE_URL=https://www.notion.so/xxxx npm run upload:notion
*/

const fs = require('fs');
const path = require('path');

async function main() {
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;
  const NOTION_PARENT_PAGE_URL = process.env.NOTION_PARENT_PAGE_URL;
  const NOTION_TITLE = process.env.NOTION_TITLE;

  if (!NOTION_TOKEN) {
    console.error('[upload-to-notion] Missing env NOTION_TOKEN');
    process.exit(1);
  }

  // Resolve parent page id from ID or URL
  let parentPageId = NOTION_PARENT_PAGE_ID;
  if (!parentPageId && NOTION_PARENT_PAGE_URL) {
    parentPageId = extractPageIdFromUrl(NOTION_PARENT_PAGE_URL);
  }
  if (!parentPageId) {
    console.error('[upload-to-notion] Missing env NOTION_PARENT_PAGE_ID or NOTION_PARENT_PAGE_URL');
    process.exit(1);
  }

  // Lazy import to avoid requiring dependency during Next runtime
  const { Client } = require('@notionhq/client');
  const notion = new Client({ auth: NOTION_TOKEN });

  // Determine source markdown file
  const repoRoot = process.cwd();
  const draftPath = path.join(repoRoot, '.github', 'pr_draft_current_branch.md');
  const fallbackPath = path.join(repoRoot, '.github', 'pull_request_template.md');

  let mdPath = draftPath;
  if (!fs.existsSync(mdPath)) {
    if (fs.existsSync(fallbackPath)) {
      mdPath = fallbackPath;
      console.warn('[upload-to-notion] Using fallback template at .github/pull_request_template.md');
    } else {
      console.error('[upload-to-notion] No markdown source found at .github/pr_draft_current_branch.md or fallback template');
      process.exit(1);
    }
  }

  const markdown = fs.readFileSync(mdPath, 'utf8');

  // Title: first non-empty heading line or file name
  const title = (NOTION_TITLE || extractTitle(markdown) || 'PR Draft').slice(0, 200);

  // Convert markdown to a simple set of paragraph blocks (minimal implementation)
  const children = markdownToParagraphBlocks(markdown);

  try {
    const response = await notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [
            {
              type: 'text',
              text: { content: title },
            },
          ],
        },
      },
      children,
    });

    const url = response?.url || '(no url)';
    console.log(`[upload-to-notion] Created page: ${url}`);
  } catch (err) {
    console.error('[upload-to-notion] Failed to create Notion page:', err.body || err.message || err);
    process.exit(1);
  }
}

function extractTitle(md) {
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Prefer a markdown heading as title
    const m = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (m) return m[2];
    // Fallback to first non-empty line
    return trimmed.slice(0, 200);
  }
  return null;
}

function extractPageIdFromUrl(url) {
  try {
    const u = new URL(url);
    // Notion URLs often end with slug-and-id; extract last segment and keep 32 hex chars
    const path = u.pathname;
    const last = path.split('/').pop() || '';
    const candidate = last.split('-').pop() || '';
    const id = (candidate || '').replace(/[^a-fA-F0-9]/g, '');
    if (id.length === 32) return id;
  } catch (_) {
    // ignore
  }
  return null;
}

function markdownToParagraphBlocks(md) {
  const lines = md.split(/\r?\n/);
  // Limit number of blocks to avoid Notion rate/size limits
  const MAX_BLOCKS = 200;
  const blocks = [];
  let buffer = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.join('\n');
    blocks.push(paragraphBlock(text));
    buffer = [];
  };

  for (const line of lines) {
    if (line.trim() === '') {
      flush();
    } else {
      buffer.push(line);
    }
    if (blocks.length >= MAX_BLOCKS) break;
  }
  flush();

  return blocks.length > 0 ? blocks : [paragraphBlock('')];
}

function paragraphBlock(text) {
  // Notion API accepts up to ~2000 characters per rich_text item; keep it safe
  const SAFE_CHUNK = 1800;
  const chunks = [];
  for (let i = 0; i < text.length; i += SAFE_CHUNK) {
    chunks.push(text.slice(i, i + SAFE_CHUNK));
  }
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: chunks.map((c) => ({ type: 'text', text: { content: c } })),
    },
  };
}

if (require.main === module) {
  main();
}
