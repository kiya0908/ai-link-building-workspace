import type { CommentMode } from '@/core/types/project';
import type { SidebarIdentity, SidebarProject } from '@/ui/sidebar/types';

export interface WorkspaceProfileImport {
  project: SidebarProject;
  identity: SidebarIdentity;
}

const VALID_COMMENT_MODES = ['soft_mention', 'plain_url', 'html_link'] as const satisfies readonly CommentMode[];

export const WORKSPACE_PROFILE_JSON_EXAMPLE = {
  profiles: [
    {
      project: {
        brand: 'Playlist Name Generator',
        website: 'https://playlistnameai.org',
        description: 'Playlist title generator for Spotify, Apple Music, and YouTube Music users.',
        commentMode: 'soft_mention'
      },
      commentIdentity: {
        name: 'playlist name generator',
        email: 'support@playlistnameai.org',
        website: 'https://playlistnameai.org'
      }
    },
    {
      project: {
        brand: 'Doodle Baseball',
        website: 'https://doodlebaseball.info',
        description: 'Browser game site for Doodle Baseball fans.',
        commentMode: 'soft_mention'
      },
      commentIdentity: {
        name: 'doodle baseball',
        email: 'support@doodlebaseball.info',
        website: 'https://doodlebaseball.info'
      }
    }
  ]
};

export const WORKSPACE_PROFILE_CSV_EXAMPLE = [
  'projectBrand,projectWebsite,projectDescription,commentMode,identityName,identityEmail,identityWebsite',
  'Playlist Name Generator,https://playlistnameai.org,"Playlist title generator for Spotify, Apple Music, and YouTube Music users.",soft_mention,playlist name generator,support@playlistnameai.org,https://playlistnameai.org',
  'Doodle Baseball,https://doodlebaseball.info,Browser game site for Doodle Baseball fans.,soft_mention,doodle baseball,support@doodlebaseball.info,https://doodlebaseball.info'
].join('\n');

export function parseWorkspaceProfileFile(fileName: string, content: string): WorkspaceProfileImport[] {
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

function parseWorkspaceProfileJson(content: string): WorkspaceProfileImport[] {
  const parsed = JSON.parse(content) as unknown;
  const records = getJsonProfileRecords(parsed);
  if (!records.length) {
    throw new Error('Workspace profile JSON must include at least one profile.');
  }

  return records.map((record) => normalizeWorkspaceProfile({
    projectBrand: record.project?.brand,
    projectWebsite: record.project?.website,
    projectDescription: record.project?.description,
    commentMode: record.project?.commentMode,
    identityName: record.commentIdentity?.name,
    identityEmail: record.commentIdentity?.email,
    identityWebsite: record.commentIdentity?.website
  }));
}

function getJsonProfileRecords(value: unknown): Array<{
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
}> {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const parsed = value as {
    profiles?: unknown;
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

  if (Array.isArray(parsed.profiles)) {
    return parsed.profiles as ReturnType<typeof getJsonProfileRecords>;
  }

  return [parsed];
}

function parseWorkspaceProfileCsv(content: string): WorkspaceProfileImport[] {
  const [headerLine, ...rows] = content.trim().split(/\r?\n/);
  if (!headerLine || rows.length === 0) {
    throw new Error('Workspace profile CSV must include a header and one data row.');
  }

  const headers = parseCsvRow(headerLine);
  return rows
    .filter((row) => row.trim())
    .map((row) => {
      const values = parseCsvRow(row);
      const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
      return normalizeWorkspaceProfile(record);
    });
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
