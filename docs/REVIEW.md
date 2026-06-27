# Review van het idee + aanbevelingen

Dit document beoordeelt het concept van **Roef de Vis — To the Top** en geeft
concrete aanbevelingen voordat we gaan bouwen.

---

## 1. Samenvatting van het concept

Een verticale mobiele arcade-swimmer. Roef zwemt over de volle schermbreedte
omhoog door levels van meerdere schermen hoog, ontwijkt obstakels en blijft een
monstervis voor die van onderaf jaagt. De jager escaleert: een kleine monstervis
wordt opgegeten door een grotere (en die eventueel weer door een nóg grotere). Doel:
het wateroppervlak (the top) bereiken. De ontknoping: Roef glipt door een visnet dat
de grote monstervis tegenhoudt — klein zijn redt hem.

## 2. Wat sterk is aan het idee ✅

- **Heldere, universele kernfantasie.** "Zwem omhoog, ontsnap" is in 1 seconde te
  begrijpen — ideaal voor mobiel en voor app-store-screenshots.
- **Verticale scroll past perfect bij telefoons.** Volle breedte + omhoog scrollen
  benut het portretscherm optimaal en speelt met één hand/duim.
- **Ingebouwde, escalerende spanningsbron.** De opkomende jager geeft natuurlijke
  "haast"-druk; doordat de monstervis onderweg wordt opgegeten door een grotere, loopt
  die spanning vanzelf op zonder uitleg (vergelijk: stijgende lava, maar met verhaal).
- **Memorabele mascotte.** "Roef de vis" is grappig en merkbaar — goed voor
  herkenning en mogelijke uitbreiding (skins, sequels, merchandise).
- **Thematische ontknoping.** Het omdraaien van de voedselketen (klein zijn redt je
  via het net) is een sterk, bevredigend en deelbaar slot — niet zomaar een grap.

## 3. Risico's & aandachtspunten ⚠️

| Risico | Toelichting | Mitigatie |
|--------|-------------|-----------|
| Genre is verzadigd | Veel "swim/fly up" en endless-climbers bestaan al | Onderscheid via personage, escalerende jager en de net-ontknoping |
| Frustratie door dood = helemaal opnieuw | Lange levels + instant death = boos afhaken | Checkpoints of korte levels; "bijna gehaald" gevoel behouden |
| Besturing op mobiel | Tilt is onnauwkeurig; touch dekt soms het beeld af | Touch-drag onderaan het scherm of "raak waar je heen wilt" |
| Onduidelijke jager-druk | Te traag = saai, te snel = oneerlijk | Jager-snelheid koppelen aan voortgang/schakel, met fair warning |
| Escalatie kan verwarren | Steeds nieuwe jager kan onduidelijk zijn | Kort, leesbaar "opgegeten worden"-beat; duidelijke nieuwe dreiging |
| Net-regel niet aangeleerd | Speler snapt de ontknoping niet | Netten vroeg als obstakel introduceren (Roef past net door) |
| Scope creep | Veel ideeën (power-ups, werelden, schakels) | Strakke MVP (zie GDD §13), rest na validatie |

## 4. Belangrijkste ontwerpbeslissingen om vroeg vast te leggen

1. **Besturing:** touch-drag (aanbevolen) vs. tilt vs. tap-to-swim. → Zie GDD §5.
2. **Omhoog bewegen:** automatisch opstijgen (speler stuurt alleen links/rechts) vs.
   actief omhoog zwemmen (tap/houd vast). → Aanbeveling: **actief zwemmen** voor meer
   controle en skill-expressie.
3. **Levelstructuur:** vaste, ontworpen levels vs. procedureel/endless. → Aanbeveling:
   **ontworpen levels met einddoel** (past bij "the top", de escalatie en het net),
   later eventueel een endless-modus.
4. **Faal-conditie:** wat doet de jager precies — inhalen = dood, of meerdere
   levens/treffers? → Aanbeveling: jager = instant fail bij contact, obstakels =
   levens/health.
5. **Aantal schakels in de keten:** 2 of 3 monstervissen? → Aanbeveling: **3** over
   het hele spel, **1 escalatie** in de MVP.

## 5. Aanbevelingen (kort)

- ✅ **Bouw eerst een verticale slice**: 1 level, besturing, jager-chase met één
  escalatie, 2–3 obstakeltypes en de net-ontknoping. Valideer of het *fun* is voordat
  je content opschaalt.
- ✅ **Kies actief omhoog zwemmen + touch-besturing** voor skill en duidelijkheid.
- ✅ **Houd levels kort (30–60s)** met een duidelijke "bijna!"-zone vlak onder het
  oppervlak om herhaald spelen aan te moedigen.
- ✅ **Maak de ontknoping een beloning**, geen straf — laat de speler winnen en lach erom.
- ✅ **Engine: Godot 4** (gratis, sterk in 2D, exporteert naar iOS/Android). Alternatief:
  Flutter + Flame, of Unity. Zie GDD §11.

## 6. De verhaalboog: escalerende jager → het net (gekozen richting)

Dit is de **handtekening** van het spel en vervangt de losse "twist-opties" uit de
eerste opzet. De boog:

1. **Kleine monstervis** achtervolgt Roef.
2. Wordt **opgegeten door een grotere monstervis**, die de jacht overneemt (enger,
   sneller). Kan nog 1× herhalen.
3. **Ontknoping bij het net:** Roef is klein genoeg om er dwars doorheen te glippen;
   de grote monstervis is te groot en raakt verstrikt. Roef ontsnapt.

**Waarom dit sterk is:**
- **Eén heldere, opbouwende spanningslijn** i.p.v. losse eindjes — makkelijker te
  begrijpen en te vermarkten.
- **Thematische payoff:** de voedselketen wordt omgedraaid; Roefs zwakte (klein) wordt
  zijn kracht. Zeer bevredigend en "fair" (de speler heeft de net-regel eerder geleerd).
- **Natuurlijke difficulty-ramp:** elke grotere jager = meer druk, zonder uitleg.
- **Reuse van bestaande elementen:** netten zijn al een obstakel; ze worden nu ook de
  climax.

**Aandachtspunten:**
- Maak het "opgegeten worden"-moment kort en leesbaar (geen lange onderbreking).
- Geef de speler vlak voor het net een hint/leermoment ("ik pas er net door").
- Houd elke escalatie eerlijk — waarschuwing voordat de nieuwe, snellere jager inhaalt.

### De knipoog ná de ontsnapping — opties
Direct na de ontsnapping kan een korte komische beat het karakter versterken:

- **A. Verbaasde vissers** halen de reusachtige verstrikte vis op terwijl Roef
  wegzwemt. *(Aanbevolen — versterkt de "klein wint"-payoff.)*
- **B. Kinderen met schepnetje** aan de kade die Roef net mís vangen — spannend/grappig.
- **C. Cliffhanger:** een meeuw/nieuwe dreiging als hint naar een vervolg.
- **Geen gag:** rustig, triomfantelijk einde.

Aanbeveling: **A** als hoofd-knipoog; **C** spaarzaam tussen werelden voor "nog één".

## 7. Voorgestelde volgende stappen

1. Akkoord op de kernbeslissingen (§4) en op het aantal schakels in de keten + de
   knipoog (§6).
2. Verticale slice bouwen volgens GDD §13 (MVP-scope): inclusief één escalatie en de
   net-ontknoping.
3. Speeltest → afstemmen van jager-snelheid, escalatie-timing, levelhoogte en besturing.
4. Content opschalen (werelden, extra schakels, obstakels) na validatie.
