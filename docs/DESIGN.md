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
  - Health-indicator (hartjes; zie §8). **Geen zuurstof-/luchtmeter — we zijn een vis.**
  - Score / verzamelde bellen.
- **Leesbaarheid:** UI uit de duim-zones houden; gameplay nooit onder de vingers.

## 5. Besturing

**Gekozen schema (prototype) — relatieve veeg-besturing (volle breedte):**
- De speler **veegt** ergens op het scherm; Roef beweegt **relatief** mee (zoals
  scrollen), dus de vinger hoeft niet op de vis te staan en zit niet in de weg. Je
  kunt loslaten en opnieuw vegen ("re-grippen") om verder omhoog te komen.
- **Niet vegen** laat Roef langzaam terugzakken (drijfvermogen) → de jager wint terrein.
- Dit is geïmplementeerd in het [prototype](../prototype/). Eerder getest: absolute
  "volg-de-vinger" voelde onhandig op mobiel (vinger in de weg) → vervangen door
  relatief vegen. Het "actief stuwen"-variant blijft een te testen alternatief.

**Alternatieven (te testen):**
- **Actief stuwen:** vasthouden = stuwstoot omhoog, loslaten = zakken; meer skill/ritme.
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
Er zijn **3 schakels** (3 monstervissen) over het hele spel:

- **Predator 1** — kleine monstervis, achtervolgt Roef van onderaf.
- **Predator 2** — groter, sneller, vult meer van het scherm.
- **Predator 3** — reusachtig; de uiteindelijke jager die bij de net-ontknoping vast
  komt te zitten.

Elke jager: silhouet, ogen, hap-animatie. **Snelheid schaalt** per schakel en met
voortgang, maar altijd "fair": visuele/audio-waarschuwing voordat hij inhaalt.

**De keten loopt op via twee triggers:**

1. **Opgegeten worden (scripted):** op een dramatisch beat-moment wordt de huidige
   jager van onderaf verzwolgen door de volgende, grotere monstervis. Even respijt voor
   Roef, daarna zet de grotere de achtervolging in. Korte, krachtige in-game beat (geen
   lange cutscene); werkt goed als wereld-/sectie-overgang.
2. **Afgeschud worden (speler-gedreven):** als Roef zijn jager kwijtraakt door door een
   net te glippen waar de grote vis niet volgt (zie §7), verdwijnt die jager —
   en **komt er even later een nieuwe (grotere) monstervis** opzetten. Zo wordt de
   escalatie deels door de speler veroorzaakt en voelt het kwijtraken nooit als
   "het is voorbij".

Beide triggers schuiven de keten één schakel op (Predator 1 → 2 → 3).

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
- **Net = terugkerende kernmechanic:** introduceer netten vroeg als obstakel waar Roef
  net dóór kan, zodat de speler de regel "ik pas erdoor, mijn achtervolger niet"
  leert vóór de grote ontknoping.
- **Net als tactiek (bevestigd):** Roef kan zijn huidige jager **afschudden** door
  door een net te glippen waar de grote vis niet volgt. De jager verdwijnt en even
  later komt er een **nieuwe, grotere monstervis** opzetten (escalatie, zie §6). Dit
  geeft de speler agency en koppelt de net-mechanic aan de verhaalboog.

## 8. Power-ups & collectibles

- 🫧 **Luchtbellen** — basis-collectible voor **score** (in het prototype al
  geïmplementeerd). **Geen zuurstofmeter** — een vis hoeft geen lucht te happen; de
  enige tijdsdruk is de jager.
- ⚡ **Boost** — tijdelijke snelheidsstoot omhoog (afstand winnen op de jager).
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
**3 schakels**, die oplopen via twee triggers (zie §6): de jager wordt opgegeten door
een grotere, óf Roef schudt zijn jager af via een net waarna een grotere opzet.
1. **Predator 1** — kleine monstervis achtervolgt Roef.
2. **Predator 2** — neemt de achtervolging over, groter en sneller.
3. **Predator 3** — reusachtig; de uiteindelijke jager.

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

### De knipoog ná de ontsnapping — cliffhanger (gekozen)
Direct na het ontsnappen volgt een korte **cliffhanger**: Roef breekt opgelucht door
het oppervlak en boven water doemt meteen een **nieuwe dreiging** op (bv. een meeuw die
neerduikt, een vissersboot, een kat op de kade). Beeld bevriest of fade-out op het
spannende moment → "wordt vervolgd". Dit motiveert doorspelen en zet een vervolg/wereld
op zonder de overwinning af te pakken.

> De alternatieven (verbaasde vissers; kinderen met schepnetje) zijn niet gekozen, maar
> bewaard als mogelijke variatie/seizoensmoment — zie [REVIEW.md §6](REVIEW.md).

**Implementatie:** de jager-keten en het net-einde zijn data-gedreven per
wereld/level (bv. `predatorTier: 1|2|3`, `ending: { net: true, gag: "cliffhanger" }`),
zodat we de escalatie en de cliffhanger makkelijk kunnen tunen en testen.

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
- Scene per level; level-data (obstakels, hoogte, `predatorTier`, `ending`) als
  data/resource zodat designers levels kunnen tunen zonder code.
- Componenten: `Player(Roef)`, `Predator` (3 tiers, gedeelde chase-logica), `Net`
  (obstakel + afschud-trigger), `Obstacle`-typen, `PowerUp`, `Camera`,
  `LevelController`, `PredatorDirector` (beheert escalatie: opgegeten/afgeschud →
  volgende tier), `HUD`, `EndingController`.
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
| **M0 — Concept** | Dit GDD + review | ✅ Gedeelde visie |
| **M1 — Prototype** | Besturing, escalerende jager, netten, obstakels, net-ontknoping ([`prototype/`](../prototype/)) | ✅ Validatie "core fun" |
| **M2 — Verticale slice** | MVP-scope (§13) speelbaar op telefoon | Eerste echte speeltest |
| **M3 — Wereld 1** | Volledige eerste wereld, art/audio-pass, twist A | Vertical product |
| **M4 — Content & polish** | Meer werelden, power-ups, twists B/C/D | Soft launch |
| **M5 — Launch** | Store-release, analytics, monetisatie | Live |

## 15. Monetisatie (later)

Te bepalen na fun-validatie. Opties: gratis met advertenties (rewarded ads voor
extra leven/boost), eenmalige "remove ads", cosmetische skins voor Roef. Geen
pay-to-win; difficulty moet eerlijk blijven.

## 16. Beslissingen & open vragen

### Vastgelegde beslissingen ✅
- **Geen zuurstofmeter** — we zijn een vis; de enige tijdsdruk is de jager.
- **Besturing:** sleep-besturing (Roef volgt je vinger, volle breedte; loslaten =
  zakken). In het prototype geïmplementeerd; "actief stuwen" blijft een te testen
  variant.
- **Levelhoogte:** **5 schermen** (prototype-default; verder tunen in M2).
- **Faal-model:** **jager-contact = direct verloren**; obstakels kosten een hartje
  (3 hartjes).
- **Aantal schakels:** **3 monstervissen** over het hele spel (1 escalatie in de MVP).
- **Net als tactiek:** **ja** — Roef kan zijn jager afschudden via een net, waarna een
  nieuwe, grotere monstervis verschijnt (§6, §7).
- **Knipoog na ontsnapping:** **cliffhanger** — nieuwe dreiging boven water als hint
  naar een vervolg (§10).

### Nog open (later tunen/testen)
1. **Besturingsvariant:** is "actief stuwen" leuker dan "vinger volgen"? A/B-testen.
2. **Levelhoogte fijn-tunen:** voelen 5 schermen goed (spanning vs. frustratie)?
3. **Scripted "opgegeten worden"-beat:** als tweede escalatie-trigger naast de
   net-afschud nog toevoegen (nu alleen net-afschud in het prototype).
4. **Endless-modus:** wel/niet, en wanneer (post-MVP).
