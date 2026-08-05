import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('per-target automation failures are persisted and advance the queue', () => {
  const workflow = read('src/core/automation/page-automation-workflow.ts');
  const coordinator = read('src/core/automation/automation-coordinator.ts');
  const queueTypes = read('src/core/types/queue.ts');
  const queueList = read('src/ui/sidebar/components/queue/QueueList.tsx');

  assert.match(workflow, /try\s*{[\s\S]*runAutomationTarget/);
  assert.match(workflow, /catch \(error\)[\s\S]*targetId,[\s\S]*'failed'/);
  assert.match(workflow, /Automatic processing failed:/);
  assert.match(workflow, /catch \(error\)[\s\S]*'generation_failed'[\s\S]*AI generation failed:/);
  assert.match(queueTypes, /'generation_failed'/);
  assert.match(queueList, /generation_failed: 'AI failed'/);
  assert.match(coordinator, /completeAutomationTarget[\s\S]*queue\.updateStatus/);
  assert.match(coordinator, /return openNextAutomationTarget\(\)/);
});