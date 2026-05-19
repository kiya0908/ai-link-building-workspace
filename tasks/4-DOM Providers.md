Phase 4 — Implement DOM Provider Abstraction Layer

Continue the existing project.

Now implement the provider-based DOM abstraction system.

IMPORTANT:
Do NOT hardcode business logic with direct querySelector usage.

Requirements:

1. Create provider architecture:

/providers
/base
/generic
/wordpress
/manual

2. Create base interface:

CommentProvider

3. Provider responsibilities:

* detect comment systems
* locate comment box
* locate name/email/website inputs
* locate submit button
* scroll to comment section
* fill fields safely

4. Implement:

* GenericProvider
* WordPressProvider

5. Create ProviderDetector.

Responsibilities:

* scan page
* select best provider
* fallback safely

6. Add provider confidence scoring.

7. Add safe DOM operations.

8. Add mutation observer support for dynamic pages.

9. Add auto-scroll behavior:

* scrollIntoView()
* textarea highlight
* submit button highlight

10. Add manual learning mode.

Workflow:

* User clicks "Select Comment Box"
* User manually selects textarea
* Store selector in IndexedDB
* Reuse selector next visit

11. Add learned selector priority logic.

12. Add iframe-safe detection preparation.

13. Add contenteditable support preparation.

14. Add provider logging/debug mode.

15. Add safe retry logic.

16. Add article extraction layer using Readability.js.

Extract:

* title
* summary
* headings
* first paragraphs
* language

DO NOT send full HTML to AI.

17. Add quality filter engine.

Detect:

* comments closed
* login required
* no comment area
* archive pages
* low quality pages

IMPORTANT:
Architecture must support future:

* Disqus
* Reddit-like systems
* React comment systems
* iframe comment systems

DO NOT implement AI generation yet.

Goal:
Stable extensible DOM interaction architecture.
