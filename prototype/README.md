# Prototype — Roef de Vis: To the Top

Een speelbaar **HTML5-prototype** (één bestand, canvas) om de kern-gameplay te
valideren: omhoog zwemmen, obstakels ontwijken, de monstervis afschudden via netten,
en de top halen. Geen build-stap nodig.

> Dit prototype dient om te testen of de kern *fun* is. Voor productie blijft **Godot 4**
> de aanbeveling (zie [../docs/DESIGN.md §12](../docs/DESIGN.md)).

## Spelen

Open `index.html` direct in een browser, of serveer de map (aanbevolen op mobiel):

```bash
cd prototype
python3 -m http.server 8000
# open http://localhost:8000  (op je telefoon: http://<jouw-ip>:8000)
```

## Besturing

- **Veeg** ergens op het scherm (vinger of muis) → Roef beweegt mee, zoals scrollen.
  Je vinger hoeft **niet** op de vis te staan; je kunt loslaten en opnieuw vegen
  ("re-grippen") om verder omhoog te komen.
- **Niet vegen** → Roef zakt langzaam (de jager wint dan terrein).
- Tik om te starten / opnieuw te spelen.

## Wat is geïmplementeerd

- Verticaal level van **10 schermen hoog**, met meescrollende camera (niet terug omlaag).
- **Roef** met sleep-besturing over de volle schermbreedte.
- **Escalerende jager:** 3 monstervissen. Glip door een net → de huidige jager raakt
  verstrikt en een **grotere** monstervis komt van onderaf opzetten.
- **Net-ontknoping:** bij het bovenste net raakt de grote vis vast → Roef ontsnapt →
  **cliffhanger** (er cirkelt een meeuw).
- **Obstakels & vijanden:** **rotsen blokkeren** je als vaste muren (geen
  levensverlies — je glijdt eraf). Alle vijanden **prikken** (treffer kost een ❤) en
  variëren per dieptezone:
  - 🦔 **zee-egels** boven (draaiende stekelballen),
  - 🐡 **kogelvissen** in het midden (blazen zich op — grotere hitbox als ze bol staan, dus timing telt),
  - 🏮 **lampvissen** diep onder (donker lijf, happende bek, gloeiend loklampje),
  - 🪼 **kwallen overal** (pulserend, zwemmen elk een eigen kant op).
- **Roef draait mee** in de richting waarin je hem stuurt en kwispelt met zijn staart.
- **Luchtbellen** als collectible (score) — géén zuurstofmeter (we zijn een vis 🐟).
- HUD: hartjes, score, voortgangsbalk naar de top, en een rode "jager-nabijheid"-gloed
  met waarschuwing.
- Faal-model: **jager-contact = direct verloren**; obstakels = hartjes.

## Bewust nog niet in het prototype

Meerdere werelden, power-ups (boost/schild), skins, audio, het scripted "opgegeten
worden"-moment als alternatieve escalatie-trigger, en een endless-modus. Zie het GDD
voor de volledige scope.

## Visuele stijl (AAA-graphics pass)

De volledige render-laag is opnieuw opgebouwd voor console-kwaliteit beeld, met
behoud van leesbaarheid en een gemeten stabiele **60fps** (gameplay-logica is
ongewijzigd):

- **Roef = de warme held, volledig procedureel geanimeerd:** kwispelende
  tweelobbige staartvin (frequentie schaalt met snelheid), flutterende zijvinnen,
  **squash & stretch** bij elke veeg, knipperende ogen, blosjes, schub-suggestie,
  rim-light, warme gloed-halo, drop-shadow, motion-trail en een bubbel-spoor uit
  zijn mondje. Als enige warm object springt hij eruit tegen het koele water.
- **Monstervissen:** vinnen, kieuwspleten, littekens per tier, tweelobbige staart —
  en een **bek die verder opent naarmate hij dichterbij komt** (met keel-gloed en
  extra tandenrij). Pulserend gloeiende ogen met spleet-pupillen; gevangen vissen
  spartelen in het net; bubbels uit de bek.
- **Water & licht:** meerpunts diepte-gradient (tropisch turquoise → afgrond),
  zon-gloed + **volumetrische godrays** vanuit een zon-punt, **naadloos tilende
  geanimeerde caustics** (twee tegengesteld drijvende licht-webben), golvende
  oppervlakte-shimmer met heldere waterlijn.
- **Diepte-parallax (5 lagen):** verre rots-silhouetten, wier-silhouetten,
  **scholen ambient visjes**, zwevend plankton, en een voorgrond-bokeh-laag dicht
  bij de lens. Atmosferische diepte-waas scheidt achtergrond van gameplay.
- **Objecten:** rotsen krijgen een **geprerenderde textuur** (mineraal-spikkels,
  richels, toplicht, kernschaduw) met geanimeerde algen; kwallen met doorschijnende
  gradient-klok, geschulpte rok, inwendige organen en bioluminescente gloed;
  lampvissen met fotoforen en een loklampje dat de omgeving echt verlicht;
  glazige luchtbellen met dubbele glinstering; netten met lopende glinstering
  (goud twinkelt extra op het eind-net).
- **VFX/partikels:** bubbel-pop + expanderende ring + "+1"-floater bij pick-ups,
  vonken bij treffers, zand-plofjes bij rots-botsingen, net-sparkles bij het
  doorglippen, triomf-trail tijdens de win-climb.
- **Post-processing:** cinematisch edge-vignet + subtiele **filmkorrel**;
  screen shake (nu ook met micro-rotatie), hit-flash en kwetsbaar-vignet.
- **HUD & schermen:** getekende vector-hartjes (pulseren bij 1 leven) en
  score-capsule op glazen panelen, voortgangsbalk met net-markers en Roef-stip,
  glazen banner-pil; titelscherm met golvende gradient-letters, dobberende Roef,
  veeg-hint-chevrons; win/verlies-kaarten met gloeiende titels. HUD blijft altijd
  stil en leesbaar.

> Alle art is in-code (Canvas 2D, vector + geprerenderde offscreen-textures) —
> het blijft één offline `index.html` zonder assets of dependencies.

## Techniek

Vanilla JavaScript + Canvas 2D, geen dependencies. Responsive/portrait, high-DPI,
pointer events (muis + touch). Alles staat in `index.html`.
