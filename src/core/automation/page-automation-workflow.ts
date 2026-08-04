import { extractArticle } from '@/core/article/article-extractor';
import { detectDefaultProvider } from '@/content/dom/provider-registry';
import { checkSubmissionDocument } from '@/core/dom/submission-evidence';
import { evaluatePageQuality } from '@/core/quality/quality-filter';
import type { Identity, LinkAsset, Project } from '@/core/types/project';
import type { AutomationSession } from '@/core/types/automation';
import type { GenerateCommentResponse } from '@/shared/messaging/messages';
import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';

const runtime = createRuntimeMessageClient();
const CONFIRM_TIMEOUT_MS = 20_000;

export interface PageAutomationContext {
  project: Project;
  identity: Identity;
  linkAsset: LinkAsset | null;
  style: 'friendly' | 'casual' | 'expert' | 'question';
}

export async function runPageAutomation(document: Document, context: PageAutomationContext) {
  let session = await runtime.send<AutomationSession | null>({ type: 'AUTOMATION_GET' });
  if (!session?.running || !session.targetId || session.projectId !== context.project.id) return session;
  session = await runtime.send<AutomationSession | null>({ type: 'AUTOMATION_PAGE_READY' });
  if (!session?.running || !session.targetId) return session;

  if (session.phase === 'confirming' && session.comment) {
    return confirmAfterNavigation(document, session);
  }

  const provider = detectDefaultProvider(document);
  const article = extractArticle(document);
  const quality = evaluatePageQuality(document, provider, article);
  if (!provider || !quality.isSuitable) {
    return complete(session.targetId, 'skipped', `Page is not suitable: ${quality.issues.join(', ') || 'provider not detected'}.`);
  }

  await setPhase('generating', 'Generating an AI comment.');
  const generated = await runtime.send<GenerateCommentResponse>({
    type: 'GENERATE_COMMENT',
    payload: { article, project: context.project, style: context.style, mode: context.project.defaultCommentMode, targetId: session.targetId }
  });
  if (!generated.validation.valid) {
    return complete(session.targetId, 'failed', `Generated comment failed validation: ${generated.validation.issues.join(', ')}.`);
  }

  await setPhase('filling', 'Filling detected comment fields.', generated.comment);
  provider.fillFields({
    comment: generated.comment,
    name: context.identity.name,
    email: context.identity.email,
    website: resolveWebsite(context)
  });
  provider.scrollToComment();
  await runtime.send({ type: 'QUEUE_UPDATE_STATUS', payload: { targetId: session.targetId, status: 'filled' } });

  if (session.mode === 'fill_only') {
    return complete(session.targetId, 'filled', 'Comment fields were filled; submit was not clicked.');
  }

  const readiness = provider.checkSubmissionReadiness();
  if (!readiness.canSubmit) {
    return complete(session.targetId, 'filled', `Automatic submission blocked: ${readiness.reason}`);
  }

  const snapshot = provider.createSubmissionSnapshot(generated.comment);
  await setPhase('confirming', 'Submit clicked; waiting for reliable site confirmation.', generated.comment);
  provider.submit();

  const deadline = Date.now() + CONFIRM_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(750);
    const result = provider.checkSubmissionResult(snapshot);
    if (result.outcome === 'success') {
      return complete(session.targetId, 'submitted', result.reason, result.moderationPending ? 'pending_review' : 'submitted');
    }
    if (result.outcome === 'failure') return complete(session.targetId, 'failed', result.reason, 'rejected');
  }
  return complete(session.targetId, 'filled', 'Submit was clicked, but the site result could not be confirmed.', 'pending_review');
}

async function confirmAfterNavigation(document: Document, session: AutomationSession) {
  const result = checkSubmissionDocument(document, session.comment ?? '');
  if (result.outcome === 'success') {
    return complete(session.targetId!, 'submitted', result.reason, result.moderationPending ? 'pending_review' : 'submitted');
  }
  if (result.outcome === 'failure') return complete(session.targetId!, 'failed', result.reason, 'rejected');
  await delay(CONFIRM_TIMEOUT_MS);
  const later = checkSubmissionDocument(document, session.comment ?? '');
  if (later.outcome === 'success') return complete(session.targetId!, 'submitted', later.reason, later.moderationPending ? 'pending_review' : 'submitted');
  if (later.outcome === 'failure') return complete(session.targetId!, 'failed', later.reason, 'rejected');
  return complete(session.targetId!, 'filled', 'Submit was clicked, but the result page had no reliable confirmation.', 'pending_review');
}

function setPhase(phase: 'generating' | 'filling' | 'confirming', detail: string, comment?: string) {
  return runtime.send({ type: 'AUTOMATION_SET_PHASE', payload: { phase, detail, comment } });
}

function complete(targetId: string, status: 'filled' | 'submitted' | 'failed' | 'skipped', detail: string, submissionStatus?: 'submitted' | 'pending_review' | 'rejected') {
  return runtime.send<AutomationSession | null>({ type: 'AUTOMATION_COMPLETE_TARGET', payload: { targetId, status, submissionStatus, detail } });
}

function resolveWebsite(context: PageAutomationContext): string {
  if (context.project.defaultCommentMode === 'html_link') return context.linkAsset?.htmlCode || context.identity.website || context.project.website;
  if (context.project.defaultCommentMode === 'plain_url') return context.linkAsset?.plainUrl || context.identity.website || context.project.website;
  return context.linkAsset?.anchorText || context.identity.website || context.project.website;
}

function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }