Phase 5 — Implement AI Comment Generation Workflow

Continue the existing project.

Now implement:

1. AI comment generation
2. AI workflow integration
3. Auto-fill workflow
4. Human review flow

IMPORTANT:
This is a semi-automatic workflow.
DO NOT implement automatic submission.

Requirements:

1. Create AI provider abstraction.

Architecture:

/ai
providers/
prompts/
adapters/

2. Create AIProvider interface.

3. Implement OpenRouter provider.

Default model:
DeepSeek V4 Flash

4. Add model configuration support.

5. Add prompt builder system.

Prompt inputs:

* article title
* article summary
* language
* project
* link mode
* comment style

6. Add supported comment modes:

* soft_mention
* plain_url
* html_link

7. Add supported styles:

* friendly
* casual
* expert
* question

8. Add language detection:

* document lang
* meta fallback
* AI fallback

9. Add generation workflow:

Generate
→ Sidebar Preview
→ Human Review
→ Fill
→ Manual Submit

10. Add regenerate support.

11. Add comment history persistence.

12. Add generation loading states.

13. Add API error handling.

14. Add token usage tracking.

15. Add rate limit handling.

16. Add fill workflow.

IMPORTANT:
DO NOT auto-fill immediately after generation.

Workflow:

* Show generated comment in sidebar
* User clicks Fill
* Then perform DOM fill

17. Add safe field filling:

* comment
* name
* email
* website

18. Add provider-aware filling.

19. Add anti-duplicate generation support preparation.

20. Add generation timeout handling.

21. Add AI response sanitization.

22. Add optional HTML link insertion support.

23. Add comment validation:

* minimum quality
* spam prevention
* excessive link prevention

Goal:
Stable AI-assisted human-reviewed backlink workflow.
