import type { CommentMode } from '@/core/types/project';
import type { SidebarIdentity, SidebarProject } from '@/ui/sidebar/types';

export interface WorkspaceProfileImport {
  project: SidebarProject;
  identity: SidebarIdentity;
}

const VALID_COMMENT_MODES = ['soft_mention', 'plain_url', 'html_link'] as const satisfies readonly CommentMode[];

export const WORKSPACE_PROFILE_JSON_EXAMPLE = {
  project: {
    brand: 'Dog Age Calculator',
    website: 'https://dogagecalculator.info',
    description: 'Accurate dog age calculator based on AVMA guidelines.',
    commentMode: 'soft_mention'
  },
  commentIdentity: {
    name: 'Alex',
    email: 'alex@example.com',
    website: 'https://dogagecalculator.info'
  }
};

export const WORKSPACE_PROFILE_CSV_EXAMPLE = [
  'projectBrand,projectWebsite,projectDescription,commentMode,identityName,identityEmail,identityWebsite',
  'Dog Age Calculator,https://dogagecalculator.info,Accurate dog age calculator based on AVMA guidelines.,soft_mention,Alex,alex@example.com,https://dogagecalculator.info'
].join('\n');

export function parseWorkspaceProfileFile(fileName: string, content: string): WorkspaceProfileImport {
  if (fileName.toLowerCase().endsWith('.json')) {
    return parseWorkspaceProfileJson(content);
  }

  return parseWorkspaceProfileCsv(content);
}

export function createJsonExampleContent(): string {
  return JSON.stringify(WORKSPACE_PROFILE_JSON_EXAMPLE, null, 2);
}

export function createCsvExampleContent(): string {
  return WORKSPACE_PROFILE_CSV_EXAMPLE;
}

function parseWorkspaceProfileJson(content: string): WorkspaceProfileImport {
  const parsed = JSON.parse(content) as {
    project?: Partial<{
      brand: string;
      website: string;
      description: string;
      commentMode: CommentMode;
    }>;
    commentIdentity?: Partial<{
      name: string;
      email: string;
      website: string;
    }>;
  };

  return normalizeWorkspaceProfile({
    projectBrand: parsed.project?.brand,
    projectWebsite: parsed.project?.website,
    projectDescription: parsed.project?.description,
    commentMode: parsed.project?.commentMode,
    identityName: parsed.commentIdentity?.name,
    identityEmail: parsed.commentIdentity?.email,
    identityWebsite: parsed.commentIdentity?.website
  });
}

function parseWorkspaceProfileCsv(content: string): WorkspaceProfileImport {
  const [headerLine, firstRow] = content.trim().split(/\r?\n/);
  if (!headerLine || !firstRow) {
    throw new Error('Workspace profile CSV must include a header and one data row.');
  }

  const headers = parseCsvRow(headerLine);
  const values = parseCsvRow(firstRow);
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  return normalizeWorkspaceProfile(record);
}

function normalizeWorkspaceProfile(record: Record<string, unknown>): WorkspaceProfileImport {
  const brand = requiredString(record.projectBrand, 'projectBrand');
  const website = requiredString(record.projectWebsite, 'projectWebsite');
  const commentMode = normalizeCommentMode(record.commentMode);
  const idSeed = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  return {
    project: {
      id: `project-${idSeed}`,
      name: brand,
      brand,
      website,
      description: String(record.projectDescription ?? ''),
      defaultCommentMode: commentMode
    },
    identity: {
      id: `identity-${idSeed}`,
      name: String(record.identityName ?? ''),
      email: String(record.identityEmail ?? ''),
      website: String(record.identityWebsite ?? website)
    }
  };
}

function requiredString(value: unknown, fieldName: string): string {
  const text = String(value ?? '').trim();
  if (!text) {
    throw new Error(`Workspace profile import missing ${fieldName}.`);
  }

  return text;
}

function normalizeCommentMode(value: unknown): CommentMode {
  const mode = String(value ?? 'soft_mention') as CommentMode;
  return VALID_COMMENT_MODES.includes(mode) ? mode : 'soft_mention';
}

function parseCsvRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    const nextCharacter = row[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  cells.push(current);
  return cells;
}
