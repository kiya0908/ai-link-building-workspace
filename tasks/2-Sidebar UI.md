Phase 2 — Build Sidebar Workspace UI

Continue developing the existing project:

ai-link-building-workspace

Current status:

* Project architecture already initialized
* WXT + React + TypeScript configured
* IndexedDB scaffold exists
* Provider abstraction scaffold exists

Now implement the Sidebar Workspace UI only.

IMPORTANT:
Do NOT implement AI logic yet.
Do NOT implement DOM providers yet.
Do NOT implement queue business logic yet.

Requirements:

1. Create injected sidebar UI

* Fixed right-side sidebar
* Responsive layout
* Collapsible
* Dark/light friendly
* Scrollable sections

2. Sidebar sections:

* Current Project
* Queue List
* Article Analysis
* Generated Comment
* Status
* Action Buttons

3. Action buttons:

* Generate Comment
* Fill
* Next
* Skip
* Regenerate

4. Use React + Zustand.

5. Use clean component architecture.

Expected component structure example:

/components
/sidebar
/queue
/project
/comment
/status

6. Add placeholder mock state only.

7. Add message passing scaffold between:

* sidebar
* content script
* background worker

8. Sidebar must inject into page via content script.

9. Avoid popup-based workflow.

10. Add clean TypeScript interfaces for:

* Project
* Target
* QueueItem
* CommentState

11. Add basic loading states.

12. Add error boundary support.

DO NOT implement real AI generation yet.
DO NOT implement real storage persistence yet.
DO NOT implement DOM filling yet.

Goal:
Create stable scalable sidebar workspace UI foundation.
