# Wordshooter — Claude Instructions

Dit spel is één van de spellen op uitgeleerd.nl. De portal met de tegels is een
aparte repo (`Uitgeleerd`); deze repo is alleen het spel. `dist/` gaat naar
`uitgeleerd.nl/wordshooter/`, niet naar de web-root.

## Waar het staat

- **Alle paden relatief houden.** Het spel woont in een submap en hoort niet te
  weten in wélke. Eén `/js/…` of `/data/…` zoekt vanaf de web-root en vindt
  niets. `deploy.sh` faalt hierop.
- **De origin nooit veranderen.** localStorage hangt aan `uitgeleerd.nl`. Een
  eigen (sub)domein voor het spel maakt een schooljaar aan muntjes, outfits en
  Nemesis-wonden onbereikbaar. Een submap doet dat niet — vandaar een submap.

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
