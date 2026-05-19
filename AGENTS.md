# AGENTS.md

## Project Rules

This project must follow strict scalable architecture rules.

## Core Architecture

* Use provider-based DOM abstraction
* Avoid hardcoded querySelector business logic
* Use TypeScript interfaces first
* Keep modules isolated
* Use IndexedDB as primary storage
* Queue state must persist
* Support Manifest V3 lifecycle safely

## UI Rules

* Sidebar-first workflow
* Avoid popup-only UX
* React components must remain modular

## Storage Rules

* Never rely on in-memory background state
* Persist queue state immediately
* Use repository pattern

## Provider Rules

* Providers must remain replaceable
* Providers must not contain business workflow logic
* Support future extensibility

## AI Rules

* AI providers must be abstracted
* OpenRouter integration must remain replaceable
* Prompt templates must be isolated

## Code Quality

* Avoid monolithic files
* Avoid duplicated DOM logic
* Prefer composition over condition chains
* Keep modules independently testable

## Workflow Rules

* Implement one task at a time
* Do not expand scope automatically
* Ask before introducing major architectural changes
