# Game Design Document — Roef de Vis: To the Top

> Versie 0.1 (concept) · Doel: vastleggen van visie, mechanics en scope zodat we
> een speelbare verticale-slice (MVP) kunnen bouwen.

## Inhoud

1. [Visie & pitch](#1-visie--pitch)
2. [Doelgroep & platform](#2-doelgroep--platform)
3. [Core gameplay loop](#3-core-gameplay-loop)
4. [Camera, schermindeling & wereldoriëntatie](#4-camera-schermindeling--wereldoriëntatie)
5. [Besturing](#5-besturing)
6. [Personages](#6-personages)
7. [Obstakels & hazards](#7-obstakels--hazards)
8. [Power-ups & collectibles](#8-power-ups--collectibles)
9. [Levels, werelden & progressie](#9-levels-werelden--progressie)
10. [De twist: eindscenario's](#10-de-twist-eindscenarios)
11. [Art & audio](#11-art--audio)
12. [Techniek](#12-techniek)
13. [MVP / verticale slice](#13-mvp--verticale-slice)
14. [Roadmap & milestones](#14-roadmap--milestones)
15. [Monetisatie (later)](#15-monetisatie-later)
16. [Open vragen](#16-open-vragen)

---

## 1. Visie & pitch

**Roef de Vis: To the Top** is een verticale arcade-swimmer voor mobiel. Je stuurt
Roef, een kleine vis, omhoog door levels die meerdere schermen hoog zijn. Diep onder
je komt een monster op — stilstaan betekent gepakt worden. Onderweg ontwijk je
rotsen, kwallen, stroming en visnetten. Bereik **the top** (het wateroppervlak) en
geniet van een onverwachte, grappige twist.

**Fantasie:** "Zwem voor je leven naar boven en ontsnap — net op tijd."

**Toon:** licht, kleurrijk, cartoonesk en grappig. Spanning met een knipoog.

**Onderscheidend:** persoonlijke mascotte (Roef), humoristische twist-momenten en
strakke één-hands verticale gameplay.

## 2. Doelgroep & platform

- **Platform:** iOS en Android (portretmodus). Touchscreen-first.
- **Oriëntatie:** verticaal (portrait), gameplay over de **volledige schermbreedte**.
- **Doelgroep:** casual spelers van alle leeftijden (8+), korte sessies (1–5 min).
- **Sessielengte:** een level duurt ~30–60 seconden; "pick up & play".
- **Schermondersteuning:** verschillende aspect ratios (van 4:3 tablet tot 20:9
  telefoon). De speelbreedte schaalt mee; veilige marges voor notch/UI.

## 3. Core gameplay loop

```
Start onderaan ──► Zwem omhoog ──► Ontwijk obstakels & blijf monster voor
      ▲                                          │
      │                                          ▼
   Opnieuw  ◄──── Gepakt/geraakt? ──nee──► Bereik oppervlak (the top)
   (snel)                                         │
                                                  ▼
                                          Twist-einde + score/voortgang
```

**Per run:**
1. Roef start onderin het level.
2. De speler beweegt Roef links/rechts en stuwt hem omhoog.
3. Het beeld scrollt mee omhoog; het monster nadert van onderaf.
4. Obstakels en hazards moeten ontweken worden; collectibles geven bonus.
5. Bereikt de speler het oppervlak → level gehaald → twist + score → volgend level.
6. Geraakt door monster (fail) of health op → korte fail-animatie → snel opnieuw.

**Beloningsritme:** elke ~10–15s een spanningsmoment (nauwe doorgang, kwallenzwerm),
afgewisseld met een korte "ademruimte". Vlak onder het oppervlak een **"bijna!"-zone**
met oplopende muziek.

## 4. Camera, schermindeling & wereldoriëntatie

- **Camera:** volgt Roef verticaal en scrollt omhoog; horizontaal vast (volle breedte
  is het speelveld). De camera scrollt niet terug naar beneden (al gepasseerd =
  afgesloten, voorkomt "terugkruipen").
- **Speelveld:** volledige schermbreedte. Links/rechts zijn harde randen (muren of
  zachte "bots terug").
- **HUD (minimaal):**
  - Hoogte-/voortgangsbalk aan de zijkant (hoe ver tot het oppervlak).
  - Monster-nabijheid-indicator (onderaan, kleurt rood als het dichtbij is).
  - Health/lucht-indicator (zie §8).
  - Score / verzamelde bellen.
- **Leesbaarheid:** UI uit de duim-zones houden; gameplay nooit onder de vingers.

## 5. Besturing

**Aanbevolen schema — touch-drag (volle breedte):**
- De speler legt de duim op het scherm; Roef volgt de horizontale vingerpositie.
- **Omhoog zwemmen = actief**: tikken/vasthouden geeft een stuwstoot omhoog; loslaten
  laat Roef langzaam terugzakken (drijfvermogen). Dit geeft skill-expressie en ritme.

**Alternatieven (te testen):**
- **Auto-rise:** Roef stijgt automatisch; speler stuurt alleen links/rechts. Simpeler,
  minder diep.
- **Tilt:** telefoon kantelen voor links/rechts. Afgeraden als primair (onnauwkeurig),
  eventueel als optie.
- **Tap-to-target:** tik waar je heen wilt; Roef zwemt daarheen. Toegankelijk maar
  minder direct.

**Toegankelijkheid:** linkshandige modus, gevoeligheid-instelling, optie om
omhoog-zwemmen op auto te zetten.

## 6. Personages

### Roef (speler)
- Kleine, sympathieke vis met veel persoonlijkheid (uitdrukkingen: vastberaden,
  bang, opgelucht). Reageert op gevaar (bange blik als monster dichtbij is).
- Mogelijke skins/varianten als latere uitbreiding.

### Het Monster (antagonist)
- Komt van onderaf op; vult de onderkant van het scherm met dreiging (silhouet,
  ogen, hap-animatie).
- **Snelheid schaalt** met levelvoortgang en moeilijkheid, maar altijd "fair":
  de speler krijgt visuele/audio-waarschuwing voordat het inhaalt.
- Verschillende monstervarianten per wereld (bv. dieptevis, inktvis, haai).

### Bijfiguren (voor twists)
- Spelende kinderen met schepnetje, visser/boot, meeuw, kat op de kade — afhankelijk
  van het eindscenario (§10).

## 7. Obstakels & hazards

Obstakels maken het moeilijker om omhoog te komen. Categorieën:

| Type | Gedrag | Effect |
|------|--------|--------|
| **Rotsen / wrakdelen** | Statisch, blokkeren paden | Versperring; dwingt route te kiezen |
| **Kwallen** | Zweven, soms bewegend | Treffer = schade/verdoving (kort niet sturen) |
| **Stroming** | Verticale/horizontale stromingsvlakken | Duwt Roef weg; kan helpen of hinderen |
| **Visnetten** | Statisch of zakkend van boven | Verstrikt Roef kort (vertraagt → monster nadert) |
| **Luchtbellen-gat / draaikolk** | Trekt Roef richting gevaar | Positioneringsuitdaging |
| **Bewegende obstakels** | Heen-en-weer (vissen, boten, ankers) | Timing-uitdaging |
| **Smalle doorgangen** | Nauwe spleten | Precisie vereist; spanningspiek |

**Ontwerpprincipes:**
- Introduceer elk type apart en veilig voordat je ze combineert.
- Geen "onmogelijke" of onvermijdbare situaties; altijd een leesbare route.
- Hazards leveren spanning, het monster levert tijdsdruk — combineer doseerbaar.

## 8. Power-ups & collectibles

- 🫧 **Luchtbellen** — basis-collectible (score) en/of vullen een **lucht/zuurstofmeter**
  (optioneel faalmechanisme naast het monster). Beslissing: zie open vragen.
- ⚡ **Boost** — tijdelijke snelheidsstoot omhoog (afstand winnen op het monster).
- 🛡️ **Schild/bubbel** — absorbeert één treffer van een obstakel.
- 🧲 **Magneet** — trekt luchtbellen aan.
- ⭐ **Sterren/munten** — meta-valuta voor skins/upgrades (later).

Power-ups spaarzaam plaatsen zodat ze speciaal voelen en keuzes creëren.

## 9. Levels, werelden & progressie

- **Levelstructuur:** ontworpen levels (geen pure endless) met een duidelijk
  einddoel: het oppervlak. Elk level is **meerdere schermen hoog** (richtlijn:
  3–6 schermhoogtes voor de MVP, oplopend).
- **Werelden/thema's:** bv. *Ondiep rif* → *Diepzee* → *Haven/kade*. Elke wereld een
  eigen palet, obstakelset, monstervariant en wereld-einde-twist.
- **Moeilijkheidscurve:** per level meer/complexere obstakels, snellere monster,
  langere afstand. Nieuwe mechanic introduceren → oefenen → combineren.
- **Checkpoints:** korte levels = geen mid-level checkpoints nodig; wel een snelle
  retry. (Heroverwegen als levels lang worden.)
- **Scoring:** tijd + verzamelde bellen + ontweken near-misses (bonus voor risico).
  Per level sterren (1–3) op basis van prestatie → herspeelwaarde.
- **Optionele endless-modus** (post-MVP): procedureel gegenereerde, oneindig stijgende
  duik met highscore.

## 10. De twist: eindscenario's

Aan het oppervlak speelt een korte cutscene/animatie. We zetten verschillende
varianten in, escalerend met voortgang (zie ook [REVIEW.md](REVIEW.md#6-eindscenarios-de-twist-opties--afweging)):

- **A. Monster gevangen** (wereld-einde, beloning): het monster schiet door het
  oppervlak en wordt gevangen door visser/harpoen/vogel; Roef ontsnapt. **Aanbevolen
  als hoofd-payoff.**
- **B. Roef in het netje** (speciale/grap-levels): Roef springt in een schepnetje van
  kinderen — bittersweet & grappig.
- **C. Van de regen in de drup** (normale levels): nieuwe dreiging boven water leidt
  de volgende sectie/wereld in (cliffhanger).
- **D. Held-redding** (verhaalmoment): Roef redt iets/iemand — warm i.p.v. grappig.

**Implementatie:** twist-einde is data-gedreven per level (`endingType: A|B|C|D`),
zodat we makkelijk kunnen variëren en testen welke het leukst is.

## 11. Art & audio

- **Stijl:** kleurrijk 2D cartoon, duidelijke silhouetten (Roef altijd herkenbaar
  tegen achtergrond en monster). Parallax-lagen voor diepte (voorgrond-koraal,
  achtergrond-zonnestralen).
- **Sfeer per wereld:** kleurverloop van licht (oppervlak) naar donker (diepte);
  het monster leeft in het donker onderin.
- **Animatie:** Roef met emoties; monster met dreigende hap; bellen, stroming en
  netten met leven.
- **Audio:** rustige onderwater-ambient die opbouwt naar spanning naarmate het monster
  nadert; "bijna!"-stinger vlak onder het oppervlak; vrolijke/komische sting bij de
  twist. Duidelijke SFX voor stuwstoot, treffer, bel-pak en boost.
- **Haptics:** lichte trilling bij treffer en bij "monster dichtbij".

## 12. Techniek

**Engine-aanbeveling: Godot 4**
- Gratis & open source, sterk in 2D, kleine build-grootte, exporteert naar iOS &
  Android. Goede tilemap/scene-tools voor verticale levels.

**Alternatieven:**
- **Flutter + Flame** — fijn als het team Dart/Flutter kent; goede 2D game-loop.
- **Unity** — meest features/asset-store, maar zwaarder en licentie-overwegingen.

**Architectuur (globaal):**
- Scene per level; level-data (obstakels, hoogte, `endingType`) als data/resource zodat
  designers levels kunnen tunen zonder code.
- Componenten: `Player(Roef)`, `Monster`, `Obstacle`-typen, `PowerUp`, `Camera`,
  `LevelController`, `HUD`, `EndingController`.
- Deterministische, frame-onafhankelijke physics voor eerlijke difficulty.
- Schaalbare resolutie/aspect-ratio-handling voor volle-breedte op alle toestellen.

**Tooling:** versiebeheer (git, deze repo), CI voor builds (later), analytics voor
fun-metrics (waar falen spelers? hoe ver komen ze?).

## 13. MVP / verticale slice

Doel: zo snel mogelijk valideren of de kern **fun** is.

**In scope (MVP):**
- 1 wereld, 1–2 ontworpen levels (elk 3–4 schermen hoog).
- Roef met touch-besturing + actief omhoog zwemmen.
- Monster-chase van onderaf met fair "inhaal"-waarschuwing.
- 2–3 obstakeltypes (rots, kwal, net) + luchtbellen (collectible).
- 1 twist-einde geïmplementeerd (Optie A — monster gevangen).
- Basis-HUD (voortgang, monster-nabijheid), fail & retry, simpele score.
- Placeholder-art en -audio is prima.

**Buiten scope (later):** meerdere werelden, alle power-ups, skins, endless-modus,
monetisatie, leaderboards, verhaal-cutscenes.

**Succescriterium:** speeltesters willen "nog een keer" en begrijpen de besturing
zonder uitleg.

## 14. Roadmap & milestones

| Milestone | Inhoud | Doel |
|-----------|--------|------|
| **M0 — Concept** | Dit GDD + review (✅ huidige stap) | Gedeelde visie |
| **M1 — Prototype** | Besturing + monster-chase + 1 obstakel, grijze blokken | Validatie "core fun" |
| **M2 — Verticale slice** | MVP-scope (§13) speelbaar op telefoon | Eerste echte speeltest |
| **M3 — Wereld 1** | Volledige eerste wereld, art/audio-pass, twist A | Vertical product |
| **M4 — Content & polish** | Meer werelden, power-ups, twists B/C/D | Soft launch |
| **M5 — Launch** | Store-release, analytics, monetisatie | Live |

## 15. Monetisatie (later)

Te bepalen na fun-validatie. Opties: gratis met advertenties (rewarded ads voor
extra leven/boost), eenmalige "remove ads", cosmetische skins voor Roef. Geen
pay-to-win; difficulty moet eerlijk blijven.

## 16. Open vragen

1. **Lucht/zuurstofmeter:** willen we naast het monster een tweede tijdsdruk
   (zuurstof)? Risico: te veel druk. Voorstel: MVP zonder, later testen.
2. **Besturing definitief:** touch-drag + actief zwemmen bevestigen via prototype.
3. **Levelhoogte:** hoeveel schermen voelt goed (spanning vs. frustratie)? Tunen in M2.
4. **Faal-model:** monster = instant fail; obstakels = health/levens? Bevestigen.
5. **Twist-frequentie:** hoe vaak welke twist, zodat humor vers blijft (zie §10).
6. **Endless-modus:** wel/niet, en wanneer (post-MVP).
