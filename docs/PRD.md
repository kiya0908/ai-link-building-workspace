# AI Link Building Workspace - PRD

Version: MVP v1  
Platform: Chrome Extension (Manifest V3)  
Architecture: Local-first AI-assisted workflow system  
Primary Goal: Improve blog comment backlink workflow efficiency through AI-assisted page analysis, comment generation, queue management, and auto-fill capabilities.

---

# 1. Product Overview

## Product Positioning

AI-assisted browser workflow extension for blog comment backlink operations.

This product is NOT a fully automated SEO bot.

The extension focuses on:

- Comment workflow acceleration
- AI-assisted comment generation
- Auto form filling
- Queue-based backlink management
- Site learning
- Multi-project management

Human users remain responsible for:

- Login
- CAPTCHA
- Final review
- Manual comment submission

---

# 2. Core Workflow

```text
Import backlink target URLs
    ↓
Select current project
    ↓
Open target article
    ↓
Analyze page structure
    ↓
Detect comment form
    ↓
Extract article content
    ↓
Generate AI comment
    ↓
Auto-fill form
    ↓
Human review
    ↓
Manual submit
    ↓
Record result
    ↓
Next target
```

# 3. MVP Goals

## Must Have

- Multi-project workspace
- Queue-based workflow
- Blog article extraction
- Comment form detection
- AI comment generation
- Auto-fill comment fields
- Manual review before submit
- Status tracking
- Local storage
- Export database
- Site learning system

---

# 4. Non-Goals (Out of Scope)

## The MVP version does NOT support:

- Automatic comment submission
- CAPTCHA solving
- Proxy rotation
- Automatic login
- Playwright automation
- Cloud sync
- Team collaboration
- Browser fingerprint spoofing
- AI-based DOM understanding
- Remote database
- Auto moderation bypass

# 5. Technical Stack

<br/>

|Layer|Technology|
|--|--|
|Extension Framework|WXT|
|UI|React|
|Language|TypeScript|
|Storage|IndexedDB|
|State Management|Zustand|
|AI API|OpenRouter|
|Default Model|DeepSeek V4 Flash|
|Article Extraction|Readability.js|
|Extension Type|Manifest V3|

# 6.Architecture

## Core Architecture

```text
Injected sidebar ui
 ↓
Queue Manager
 ↓
Provider Detector
 ↓
Comment Provider
 ↓
DOM Interaction Layer```
```

# 7. Main Modules

## 7.1 Project Manager

Manage multiple owned websites/projects.

### Features

- Create project
- Edit project
- Delete project
- Select active project

### Project Structure

```json
{
  "id": "",
  "name": "",
  "brand": "",
  "website": "",
  "description": "",
  "defaultCommentMode": "soft_mention"
}
```

## 7.2 Identity Manager

Manage comment identities.

### Features

- Name
- Email
- Website

### Structure

```json
{
  "id": "",
  "name": "",
  "email": "",
  "website": ""
}
```

## 7.3 Link Asset Manager

Stores backlink-related assets.

### Structure

```json
{
  "projectId": "",
  "anchorText": "",
  "htmlCode": "",
  "plainUrl": ""
}
```

Example:

```json
{
  "url": "https://dogagecalculator.info",
  "description": "Accurate dog age calculator based on AVMA guidelines.",
  "anchorText": "dog age calculator",
  "email": "contact@dogagecalculator.info",
  "htmlCode": "<a href=\"https://dogagecalculator.info\">dog age calculator</a>"
}
```

## 7.4 Queue Manager

Controls target workflow sequence.

### Features

- Open next target
- Status management
- Skip target
- Retry target

### Queue Strategy

- Use current tab navigation
- Do NOT open new tabs by default

## 7.5 Target Manager

Stores backlink target URLs.

### Structure

```json
{
  "id": "",
  "url": "",
  "status": "pending",
  "language": "",
  "commentSystem": "",
  "qualityScore": 0,
  "projectId": "",
  "notes": ""
}
```

## 7.6 Article Extractor

Extract readable article content from current page.

### Technology

Use Readability.js.

### Extracted Data

- title
- summary
- headings
- first few paragraphs
- language

### Important

DO NOT send full HTML to AI.

## 7.7 AI Comment Generator

Generate natural blog comments.

### AI Provider

OpenRouter

### Default Model

DeepSeek V4 Flash

### AI Provider Interface

```typescript
interface AIProvider {
  generateComment(input): Promise<string>
}
```

## 7.8 Comment Modes

### Supported Modes

**soft_mention (default)**

Natural brand mention without direct link.

**plain_url**

Insert plain URL.

**html_link**

Insert HTML anchor link.

## 7.9 Comment Styles

Built-in Styles

- friendly
- casual
- expert
- question

## 7.10 Auto Fill Engine

Auto-fill detected comment forms.

### Fields

- comment
- name
- email
- website

### Fill Strategy

AI comment is first displayed in sidebar.

User manually clicks:
[ Fill ]
Then extension fills the form.

## 7.11 DOM Abstraction Layer

IMPORTANT MODULE.

Must support future extensibility.

### Architecture

```text
Provider Detector
    ↓
Comment Provider
```

## 7.12 Comment Provider Interface

```typescript
interface CommentProvider {
  detect(): boolean

  getCommentBox(): HTMLElement | null

  getNameInput(): HTMLInputElement | null

  getEmailInput(): HTMLInputElement | null

  getWebsiteInput(): HTMLInputElement | null

  getSubmitButton(): HTMLElement | null

  fillComment(text: string): void

  scrollToComment(): void
}
```

## 7.13 Initial Providers

### GenericProvider

Supports:

- textarea
- input
- contenteditable

### WordPressProvider

Supports common WordPress comment structures.

### ManualLearnProvider

User manually selects comment box.

System stores selector locally.

## 7.14 Site Learning Engine

Stores learned selectors by domain.

### Structure

```json
{
  "domain": "",
  "selectors": {
    "comment": "",
    "name": "",
    "email": "",
    "website": "",
    "submit": ""
  }
}
```

### Storage

IndexedDB

## 7.15 Quality Filter Engine

Determines whether page is suitable for commenting.

### Skip Conditions

- No comment box
- Comments closed
- Login required
- Very short content
- Archive page
- Tag page
- Category page
- Low quality page

## 7.16 Status System

### Status List

- pending
- opened
- analyzed
- generated
- filled
- submitted
- need_login
- comment_closed
- failed
- skipped

## 7.17 Export System

### Export Formats

- JSON
- CSV

# 8. Sidebar UI

## UI Type

Injected Sidebar

DO NOT use popup-only workflow.

## Sidebar Sections

--------------------------------

Current Project
Queue List
Article Analysis
AI Comment
Fill Button
Next Button
Status
--------------------------------

# 9. AI Prompt Structure

## Prompt Template

```text
You are writing a natural blog comment as a real reader.

ARTICLE TITLE:
{{title}}

ARTICLE SUMMARY:
{{summary}}

ARTICLE LANGUAGE:
{{language}}

PROJECT:

- Brand: {{brand}}
- Website: {{website}}

COMMENT STYLE:
{{style}}

LINK MODE:
{{soft_mention | plain_url | html_link}}

RULES:

1. Mention one specific detail from the article.
2. Sound like a genuine reader.
3. Keep it under 80 words.
4. Avoid generic praise.
5. Avoid marketing tone.
6. Match the article language naturally.
7. If using a link, insert it naturally.
8. Output only the comment text.
```

# 10. Manual Review Workflow

## Workflow

```text
Generate Comment
↓
Display In Sidebar
↓
User Reviews
↓
Click Fill
↓
Auto Fill Form
↓
User Manually Submit
```

# 11. Storage Strategy

## Primary Storage

IndexedDB

## DO NOT USE

- localStorage
- in-memory only storage

# 12. Manifest V3 Constraints

IMPORTANT.

## Rules

- Background service worker is NOT persistent
- Queue state must persist locally
- DOM interaction only inside content scripts
- Sidebar and content scripts communicate via message passing
- Do NOT store runtime-only critical state in service worker memory

# 13. Message Passing

## Required Communication

- Sidebar ↔ Content Script
- Sidebar ↔ Background Worker
- Content Script ↔ IndexedDB

# 14. Manual Selector Learning

## Workflow

User clicks:

```text
Select Comment Box
```

Then manually selects textarea.

Extension stores selector.

# 15. Auto Scroll Behavior

When comment box detected:

- Scroll into view
- Highlight textarea
- Highlight submit button

# 16. Language Detection

## Detection Priority

1.document.documentElement.lang
2.meta language
3.AI fallback

# 17. Security & Stability Requirements

- Avoid hardcoded selectors
- Avoid direct business logic in querySelector calls
- Use provider abstraction
- Persist all queue state
- Handle page refresh safely
- Support extension reload recovery

# 18. Future Extensibility

Future providers may include:

- Disqus
- Reddit-like systems
- Forum systems
- React-based comment systems
- iframe comment systems
Current architecture MUST support future provider expansion.

# 19. Technical Constraints

- Must use Manifest V3
- Must use TypeScript
- Must use WXT
- Must use React
- Must use IndexedDB
- Must support provider abstraction
- Must support scalable modular architecture
- AI provider must be replaceable
- Queue state must persist
- Site learning must persist locally

# 20. Success Criteria

The MVP is considered successful if users can:

- Import backlink targets
- Manage multiple projects
- Open next article quickly
- Automatically detect comment forms
- Generate natural comments
- Auto-fill forms
- Track backlink workflow status
- Export results
- Complete 20+ backlink workflows/day efficiently
