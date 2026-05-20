import {
  SUBMISSION_STATUSES,
  TARGET_STATUSES,
  type BacklinkTarget,
  type SubmissionStatus,
  type TargetStatus
} from '@/core/types/queue';
import { openWorkspaceDatabase, STORE_NAMES } from '@/core/storage/database';
import { createId } from '@/shared/id';

const CSV_COLUMNS = [
  'id',
  'url',
  'status',
  'submissionStatus',
  'language',
  'commentSystem',
  'qualityScore',
  'projectId',
  'notes',
  'updatedAt'
] as const;

export function exportTargetsAsJson(targets: BacklinkTarget[]): string {
  return JSON.stringify(targets, null, 2);
}

export function exportTargetsAsCsv(targets: BacklinkTarget[]): string {
  return [
    CSV_COLUMNS.join(','),
    ...targets.map((target) => CSV_COLUMNS.map((column) => escapeCsvCell(String(target[column] ?? ''))).join(','))
  ].join('\n');
}

export function parseTargetsFromJson(input: string): BacklinkTarget[] {
  const parsed = JSON.parse(input) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Queue JSON export must be an array.');
  }

  return parsed.map(normalizeTarget);
}

export function parseTargetsFromCsv(input: string): BacklinkTarget[] {
  const [headerLine, ...rows] = input.trim().split(/\r?\n/);
  if (!headerLine) {
    return [];
  }

  const columns = parseCsvRow(headerLine);
  return rows.filter(Boolean).map((row) => {
    const values = parseCsvRow(row);
    const record = Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));
    return normalizeTarget(record);
  });
}

function normalizeTarget(value: unknown): BacklinkTarget {
  const record = value as Partial<Record<keyof BacklinkTarget, unknown>>;
  const status = normalizeStatus(record.status);

  return {
    id: String(record.id ?? createId()),
    url: String(record.url ?? ''),
    status,
    submissionStatus: normalizeSubmissionStatus(record.submissionStatus),
    language: String(record.language ?? ''),
    commentSystem: String(record.commentSystem ?? ''),
    qualityScore: Number(record.qualityScore ?? 0),
    projectId: String(record.projectId ?? ''),
    notes: String(record.notes ?? ''),
    updatedAt: Number(record.updatedAt ?? Date.now())
  };
}

function normalizeStatus(value: unknown): TargetStatus {
  const status = String(value ?? 'pending') as TargetStatus;
  return TARGET_STATUSES.includes(status) ? status : 'pending';
}

function normalizeSubmissionStatus(value: unknown): SubmissionStatus {
  const status = String(value ?? 'unknown') as SubmissionStatus;
  return SUBMISSION_STATUSES.includes(status) ? status : 'unknown';
}

function escapeCsvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
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

export async function exportFullDatabase(): Promise<string> {
  const db = await openWorkspaceDatabase();
  const exportData: Record<string, unknown[]> = {};

  const storeNames = Array.from(db.objectStoreNames);
  for (const storeName of storeNames) {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    exportData[storeName] = await new Promise<unknown[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  db.close();
  return JSON.stringify(exportData, null, 2);
}
