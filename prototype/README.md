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

## Visuele stijl (art-direction pass)

Na een multi-agent visual review zijn de graphics opgewaardeerd, met behoud van
leesbaarheid en 60fps:

- **Roef = de warme held:** warme gloed-halo, radiaal-geschaduwd lijf, contour,
  drop-shadow en idle-dobber. Als enige warm object springt hij eruit tegen het
  koele water.
- **Monstervissen:** dreigend silhouet met rim-light, pulserend gloeiende ogen en
  spleet-pupillen; enger/feller per tier; gevangen vissen spartelen in het net.
- **Sfeer & diepte:** meerpunts diepte-gradient (turquoise → afgrond), geanimeerde
  godrays, oppervlak-shimmer + caustics, zwevend plankton, parallax wier-silhouetten,
  atmosferische diepte-waas, een **voorgrond-bokeh-laag** (onscherpe deeltjes dicht
  bij de lens) en een cinematisch **edge-vignet**.
- **Objecten:** onregelmatige, getextureerde rotsen met algen; koel-gekleurde,
  pulserende kwallen; stijgende luchtbellen; netten met doorhang + gloed (goud voor
  het eind-net).
- **Game-feel/juice:** screen shake bij treffer/net/verlies, hit-flash en
  kwetsbaar-vignet — HUD blijft altijd stil en leesbaar.

## Cartoon-assets (sprite-pipeline)

Het spel heeft een **sprite-systeem** met **procedurele fallback**: is er voor een
personage een sprite geladen, dan wordt die getekend; zo niet, dan valt de teken-code
automatisch terug op de in-code vormen. Nul regressie als een asset ontbreekt.

- **Nu ingebouwd:** Roef is een embedded **cartoon-SVG** (geen los bestand nodig —
  zit als data-URI in `index.html`, dus blijft offline in één bestand). Hij roteert,
  dobbert en gloeit nog steeds procedureel; alleen het lijf komt uit de sprite.
- **Zelf art toevoegen/vervangen:** vervang de data-URI in `SPRITE_SRC` (boven in het
  script) door je eigen **PNG of SVG als data-URI (base64)**. Zo blijft het één
  offline bestand. Sprites moeten met de **neus omhoog** wijzen (Roef roteert naar
  zijn zwemrichting).
- **Aangeleverde PNG's** (bijv. via Midjourney/DALL·E, gratis packs zoals Kenney.nl,
  of een illustrator): transparante PNG per personage, neus omhoog. Voeg een sleutel
  toe aan `SPRITE_SRC` (bijv. `jelly`, `angler`, `urchin`, `puffer`) en roep de sprite
  aan in de bijbehorende teken-functie — de fallback blijft bestaan.

> Geschilderde bitmap-art kan niet in-engine gegenereerd worden; die lever je aan.
> Vector/SVG cartoon-sprites kunnen wél in code worden opgesteld.

## Techniek

Vanilla JavaScript + Canvas 2D, geen dependencies. Responsive/portrait, high-DPI,
pointer events (muis + touch). Alles staat in `index.html`.
