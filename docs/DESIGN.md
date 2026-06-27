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
10. [De verhaalboog & ontknoping](#10-de-verhaalboog--ontknoping)
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
je jaagt een monstervis — stilstaan betekent gepakt worden. Onderweg verandert de
jager: een kleine monstervis wordt opgegeten door een grotere (en die eventueel weer
door een nóg grotere), zodat de druk oploopt. Onderweg ontwijk je rotsen, kwallen,
stroming en visnetten. Bij het oppervlak draait het om: Roef glipt door het net, de
grote vis raakt verstrikt — klein zijn redt hem.

**Fantasie:** "Zwem voor je leven naar boven en ontsnap — net op tijd, omdat je klein
bent."

**Toon:** licht, kleurrijk, cartoonesk en grappig. Spanning met een knipoog.

**Onderscheidend:** persoonlijke mascotte (Roef), een escalerende-jager-spanningsboog
met een omgedraaide-voedselketen-ontknoping, en strakke één-hands verticale gameplay.

## 2. Doelgroep & platform

- **Platform:** iOS en Android (portretmodus). Touchscreen-first.
- **Oriëntatie:** verticaal (portrait), gameplay over de **volledige schermbreedte**.
- **Doelgroep:** casual spelers van alle leeftijden (8+), korte sessies (1–5 min).
- **Sessielengte:** een level duurt ~30–60 seconden; "pick up & play".
- **Schermondersteuning:** verschillende aspect ratios (van 4:3 tablet tot 20:9
  telefoon). De speelbreedte schaalt mee; veilige marges voor notch/UI.

## 3. Core gameplay loop

```
Start onderaan ──► Zwem omhoog ──► Ontwijk obstakels & blijf de jager voor
      ▲                                          │
      │                                          ▼
   Opnieuw  ◄──── Gepakt/geraakt? ──nee──► Bereik oppervlak (the top)
   (snel)                                         │
                                                  ▼
                                   Escalatie-beat of net-ontknoping + score
```

**Per run:**
1. Roef start onderin het level.
2. De speler beweegt Roef links/rechts en stuwt hem omhoog.
3. Het beeld scrollt mee omhoog; de jager (monstervis) nadert van onderaf.
4. Obstakels en hazards moeten ontweken worden; collectibles geven bonus.
5. Op gezette momenten: **escalatie-beat** — de jager wordt opgegeten door een
   grotere monstervis die de achtervolging overneemt.
6. Bij het oppervlak van de laatste wereld: **net-ontknoping** — Roef glipt erdoor,
   de grote vis raakt verstrikt → level/spel gehaald → score → vervolg.
7. Geraakt door de jager (fail) of health op → korte fail-animatie → snel opnieuw.

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
  - Jager-nabijheid-indicator (onderaan, kleurt rood als de monstervis dichtbij is).
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

### De monstervis(sen) (escalerende antagonist)
Het centrale idee: een **voedselketen die oploopt** — "grote vis eet kleine vis".

- Roef wordt eerst achtervolgd door een **kleine monstervis** (Predator 1) die van
  onderaf opkomt.
- Op een dramatisch beat-moment wordt die jager **opgegeten door een grotere
  monstervis** (Predator 2), die het stokje overneemt. De nieuwe jager is groter,
  sneller en vult meer van het scherm → meer druk.
- Dit kan **1× herhalen** (Predator 3, reusachtig). Aanbeveling: in totaal **2–3
  schakels** in de keten over het hele spel/de werelden.
- Elke jager: silhouet, ogen, hap-animatie. **Snelheid schaalt** per schakel en met
  voortgang, maar altijd "fair": visuele/audio-waarschuwing voordat hij inhaalt.

**Het "opgegeten worden"-moment** is een korte, krachtige in-game beat (geen lange
cutscene): de huidige jager wordt van onderaf verzwolgen; even respijt voor Roef,
daarna zet de grotere de achtervolging in. Werkt goed als wereld-/sectie-overgang.

**Ontwerp-haak — grootte als kernthema:** hoe groter de jager, hoe enger, maar ook
hoe minder wendbaar. Dit zet de ontknoping op: bij het net is Roefs kleine formaat
juist zijn redding (§10).

### Bijfiguren
- Visser/boot, spelende kinderen, meeuw — voor de optionele knipoog ná de
  ontsnapping (§10).

## 7. Obstakels & hazards

Obstakels maken het moeilijker om omhoog te komen. Categorieën:

| Type | Gedrag | Effect |
|------|--------|--------|
| **Rotsen / wrakdelen** | Statisch, blokkeren paden | Versperring; dwingt route te kiezen |
| **Kwallen** | Zweven, soms bewegend | Treffer = schade/verdoving (kort niet sturen) |
| **Stroming** | Verticale/horizontale stromingsvlakken | Duwt Roef weg; kan helpen of hinderen |
| **Visnetten** | Statisch of zakkend van boven | Roef glipt er (klein als hij is) doorheen, maar het vertraagt hem licht → jager nadert. **Zet de ontknoping op** (§10): de grote monstervis past er níét door |
| **Luchtbellen-gat / draaikolk** | Trekt Roef richting gevaar | Positioneringsuitdaging |
| **Bewegende obstakels** | Heen-en-weer (vissen, boten, ankers) | Timing-uitdaging |
| **Smalle doorgangen** | Nauwe spleten | Precisie vereist; spanningspiek |

**Ontwerpprincipes:**
- Introduceer elk type apart en veilig voordat je ze combineert.
- Geen "onmogelijke" of onvermijdbare situaties; altijd een leesbare route.
- Hazards leveren spanning, de jager levert tijdsdruk — combineer doseerbaar.
- **Net = terugkerend kernidee:** introduceer netten vroeg als obstakel waar Roef
  net dóór kan, zodat de speler de regel "ik pas erdoor, mijn achtervolger niet"
  leert vóór de grote ontknoping. Optionele tactiek: een jager kwijtraken door door
  een net te glippen waar hij niet volgt.

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
  eigen palet en obstakelset. **De escalerende jager loopt door de werelden heen:**
  een nieuwe, grotere monstervis verschijnt (door het "opgegeten worden"-moment, §6)
  als overgang tussen werelden, zodat de keten 2–3 schakels telt richting de
  net-ontknoping in de laatste wereld.
- **Moeilijkheidscurve:** per level meer/complexere obstakels, snellere monster,
  langere afstand. Nieuwe mechanic introduceren → oefenen → combineren.
- **Checkpoints:** korte levels = geen mid-level checkpoints nodig; wel een snelle
  retry. (Heroverwegen als levels lang worden.)
- **Scoring:** tijd + verzamelde bellen + ontweken near-misses (bonus voor risico).
  Per level sterren (1–3) op basis van prestatie → herspeelwaarde.
- **Optionele endless-modus** (post-MVP): procedureel gegenereerde, oneindig stijgende
  duik met highscore.

## 10. De verhaalboog & ontknoping

De dramatische lijn zit in de **escalerende jager** (§6) die uitmondt in de
**net-ontknoping**:

### De escalatie (gedurende het spel)
1. **Predator 1** — kleine monstervis achtervolgt Roef.
2. **Predator 2** — eet Predator 1 op tijdens een in-game beat; neemt de
   achtervolging over, groter en sneller.
3. **(optioneel) Predator 3** — herhaalt dit nog één keer; reusachtig.

Elke escalatie verhoogt de spanning en benadrukt het thema **grootte**: enger, maar
log en onwendbaar.

### De ontknoping (het net)
In de laatste wereld, vlak onder het oppervlak, hangt een groot **visnet**:
- Roef is **klein genoeg** om er dwars doorheen te glippen (korte "squeeze"-animatie).
- De grote monstervis is **te groot**, knalt erin en **raakt verstrikt**.
- Roef breekt door het oppervlak en ontsnapt. De voedselketen wordt omgedraaid:
  **klein zijn — eerst zijn zwakte — is uiteindelijk zijn redding.**

Dit is de centrale, bevredigende payoff van het spel. De speler heeft de regel "ik
pas door netten, mijn jager niet" eerder geleerd (§7), waardoor de ontknoping logisch
en triomfantelijk voelt.

### Optionele knipoog ná de ontsnapping
Direct na het ontsnappen kan een korte, grappige beat volgen voor karakter/humor.
Varianten (zie afweging in [REVIEW.md §6](REVIEW.md)):
- **Verbaasde vissers** die de reusachtige verstrikte vis ophalen terwijl Roef
  vrolijk wegzwemt.
- **Spelende kinderen** aan de kade die Roef bijna in een schepnetje vangen — maar
  net mis.
- **Cliffhanger:** een meeuw/nieuwe dreiging boven water als hint naar een vervolg.

**Implementatie:** de jager-keten en het net-einde zijn data-gedreven per
wereld/level (bv. `predatorTier`, `ending: { net: true, gag: "fishermen|kids|none" }`),
zodat we de escalatie en de knipoog makkelijk kunnen tunen en testen.

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
- Jager-chase van onderaf met fair "inhaal"-waarschuwing.
- **Eén escalatie**: kleine monstervis wordt opgegeten door een grotere (het
  "opgegeten worden"-beat). Volledige keten (3 schakels) is post-MVP.
- 2–3 obstakeltypes (rots, kwal, net) + luchtbellen (collectible).
- **Net-ontknoping geïmplementeerd:** Roef glipt erdoor, grote vis raakt verstrikt,
  Roef breekt door het oppervlak. Knipoog-gag mag placeholder/uit zijn.
- Basis-HUD (voortgang, jager-nabijheid), fail & retry, simpele score.
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
4. **Faal-model:** jager = instant fail; obstakels = health/levens? Bevestigen.
5. **Aantal schakels in de keten:** 2 of 3 monstervissen (zie §6)? Voorstel: 3 over
   het hele spel, 1 escalatie in de MVP.
6. **Net als tactiek:** maken we het kwijtraken van je jager via een net een echte
   speelbare mechanic, of houden we het net puur voor de ontknoping?
7. **Knipoog na ontsnapping:** welke gag (vissers/kinderen/cliffhanger) en hoe vaak.
8. **Endless-modus:** wel/niet, en wanneer (post-MVP).
