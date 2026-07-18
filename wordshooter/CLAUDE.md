# Wordshooter — Claude Instructions

## Architecture Rules

- Max 400 lines per JS file. Flag before exceeding and propose a split first.
- New entity types go in their own file under `entities/`.
- New screens go in their own file under `screens/`.
- No `if (x === 'variantName')` chains for extensible systems — use a config object or strategy pattern instead. Flag when we're about to do it the other way.
- Magic numbers go in `config.js`, not inline.
- New manifest entries must have a corresponding CSV that actually exists.

## General

- When about to write something that would need to be modified in multiple places to add a new variant, stop and propose a better structure first.
- Before writing any significant new code, propose the module structure and wait for approval.
