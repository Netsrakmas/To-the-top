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

- Verticaal level van **5 schermen hoog**, met meescrollende camera (niet terug omlaag).
- **Roef** met sleep-besturing over de volle schermbreedte.
- **Escalerende jager:** 3 monstervissen. Glip door een net → de huidige jager raakt
  verstrikt en een **grotere** monstervis komt van onderaf opzetten.
- **Net-ontknoping:** bij het bovenste net raakt de grote vis vast → Roef ontsnapt →
  **cliffhanger** (er cirkelt een meeuw).
- **Obstakels:** rotsen en (bewegende) kwallen — treffer kost een ❤ (3 hartjes).
- **Luchtbellen** als collectible (score) — géén zuurstofmeter (we zijn een vis 🐟).
- HUD: hartjes, score, voortgangsbalk naar de top, en een rode "jager-nabijheid"-gloed
  met waarschuwing.
- Faal-model: **jager-contact = direct verloren**; obstakels = hartjes.

## Bewust nog niet in het prototype

Meerdere werelden, power-ups (boost/schild), skins, audio, het scripted "opgegeten
worden"-moment als alternatieve escalatie-trigger, en een endless-modus. Zie het GDD
voor de volledige scope.

## Techniek

Vanilla JavaScript + Canvas 2D, geen dependencies. Responsive/portrait, high-DPI,
pointer events (muis + touch). Alles staat in `index.html`.
