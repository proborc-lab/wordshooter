# uitgeleerd.nl — Claude Instructions

Deze repo is de site, niet één spel. In de root staat de portal; elk spel dat
hier gehost wordt staat in zijn eigen map met zijn eigen CLAUDE.md.

```
/                 portal (index.html, css/site.css)
  wordshooter/    het spel — eigen regels in wordshooter/CLAUDE.md
```

## Portal-regels

- De portal is een **gewone webpagina, geen PWA**. Twee van de vier tegels
  wijzen naar andere sites; een standalone app die zichzelf voortdurend
  verlaat is verwarrend. Manifests horen bij de spellen, niet bij de portal.
- **Niets hotlinken.** Geen logo's, screenshots of fonts van andere domeinen.
  Een tegel mag niet stukgaan omdat andermans site traag is. Tegel-art wordt
  hier getekend (inline SVG), net zoals het spel zijn sprites zelf tekent.
- **Externe links in dezelfde tab.** Er staat niets op de portal om te
  bewaren, en tabklutter op een tablet is voor een kind erger dan terug
  drukken. Wel altijd zichtbaar markeren dat je de site verlaat.
- Elke tegel die naar een **lokale** map wijst moet een bestaande map hebben.
  `deploy.sh` controleert dat en faalt hard. Externe URL's worden bewust niet
  gecontroleerd — dan zou je niet kunnen uploaden omdat andermans site plat
  ligt.

## Gedeelde code

Nog geen `shared/`. Er is één spel in deze repo, dus we weten nog niet wat
gedeeld is. Wacht tot een tweede spel laat zien wat het écht nodig heeft en
hoist dan met bewijs, niet met een gok.

## Algemeen

- Voordat je significante nieuwe code schrijft: stel de structuur voor en
  wacht op akkoord.
