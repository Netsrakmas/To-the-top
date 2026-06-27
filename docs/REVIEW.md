# Review van het idee + aanbevelingen

Dit document beoordeelt het concept van **Roef de Vis — To the Top** en geeft
concrete aanbevelingen voordat we gaan bouwen.

---

## 1. Samenvatting van het concept

Een verticale mobiele arcade-swimmer. Roef zwemt over de volle schermbreedte
omhoog door levels van meerdere schermen hoog, ontwijkt obstakels en blijft een
monster voor dat van onderaf opkomt. Doel: het wateroppervlak (the top) bereiken.
Aan het oppervlak volgt een grappige twist.

## 2. Wat sterk is aan het idee ✅

- **Heldere, universele kernfantasie.** "Zwem omhoog, ontsnap" is in 1 seconde te
  begrijpen — ideaal voor mobiel en voor app-store-screenshots.
- **Verticale scroll past perfect bij telefoons.** Volle breedte + omhoog scrollen
  benut het portretscherm optimaal en speelt met één hand/duim.
- **Ingebouwde spanningsbron.** Het opkomende monster geeft een natuurlijke
  "haast"-druk zonder dat je het hoeft uit te leggen (vergelijk: de stijgende lava
  in veel platformers).
- **Memorabele mascotte.** "Roef de vis" is grappig en merkbaar — goed voor
  herkenning en mogelijke uitbreiding (skins, sequels, merchandise).
- **Humor als handtekening.** De twist aan het oppervlak geeft het spel
  persoonlijkheid en deelbare momenten ("kijk wat er gebeurde!").

## 3. Risico's & aandachtspunten ⚠️

| Risico | Toelichting | Mitigatie |
|--------|-------------|-----------|
| Genre is verzadigd | Veel "swim/fly up" en endless-climbers bestaan al | Onderscheid via humor, personage en de twist-momenten |
| Frustratie door dood = helemaal opnieuw | Lange levels + instant death = boos afhaken | Checkpoints of korte levels; "bijna gehaald" gevoel behouden |
| Besturing op mobiel | Tilt is onnauwkeurig; touch dekt soms het beeld af | Touch-drag onderaan het scherm of "raak waar je heen wilt" |
| Onduidelijke monster-druk | Te traag = saai, te snel = oneerlijk | Monster-snelheid koppelen aan voortgang, met fair warning |
| Scope creep | Veel ideeën (power-ups, werelden, twists) | Strakke MVP (zie GDD §12), rest na validatie |

## 4. Belangrijkste ontwerpbeslissingen om vroeg vast te leggen

1. **Besturing:** touch-drag (aanbevolen) vs. tilt vs. tap-to-swim. → Zie GDD §5.
2. **Omhoog bewegen:** automatisch opstijgen (speler stuurt alleen links/rechts) vs.
   actief omhoog zwemmen (tap/houd vast). → Aanbeveling: **actief zwemmen** voor meer
   controle en skill-expressie.
3. **Levelstructuur:** vaste, ontworpen levels vs. procedureel/endless. → Aanbeveling:
   **ontworpen levels met einddoel** (past bij "the top" en de twists), later eventueel
   een endless-modus.
4. **Faal-conditie:** wat doet het monster precies — inhalen = dood, of meerdere
   levens/treffers? → Aanbeveling: monster = instant fail bij contact, obstakels =
   levens/health.

## 5. Aanbevelingen (kort)

- ✅ **Bouw eerst een verticale slice**: 1 level, besturing, monster-chase, 2–3
  obstakeltypes, 1 twist-einde. Valideer of het *fun* is voordat je content opschaalt.
- ✅ **Kies actief omhoog zwemmen + touch-besturing** voor skill en duidelijkheid.
- ✅ **Houd levels kort (30–60s)** met een duidelijke "bijna!"-zone vlak onder het
  oppervlak om herhaald spelen aan te moedigen.
- ✅ **Maak de twist een beloning**, geen straf — laat de speler winnen en lach erom.
- ✅ **Engine: Godot 4** (gratis, sterk in 2D, exporteert naar iOS/Android). Alternatief:
  Flutter + Flame, of Unity. Zie GDD §11.

## 6. Eindscenario's (de twist) — opties & afweging

De twist aan het oppervlak is het handtekeningmoment. Vier richtingen:

### Optie A — Het monster wordt gevangen 🎣 (Aanbevolen)
Roef breekt door het oppervlak en ontsnapt; het achtervolgende monster schiet er
vlak achteraan doorheen en wordt door een visser/harpoen/grote vogel gegrepen.
- **Voor:** zeer voldaan gevoel ("de jager wordt de prooi"), positief einde, past bij
  de spanning die je net hebt opgebouwd.
- **Tegen:** iets minder verrassend/donker-grappig dan B.

### Optie B — Roef in het netje 🪤
Roef ontsnapt aan het monster maar springt recht in een schepnetje van spelende
kinderen op een bootje/steiger.
- **Voor:** bittersweet en heel grappig, onverwacht, deelbaar.
- **Tegen:** voelt als "verliezen na winnen"; kan frustreren als het te vaak gebeurt.

### Optie C — Van de regen in de drup 🐦
Boven water wacht meteen een nieuwe dreiging (meeuw, visser, kat op de kade) die de
**volgende wereld** inluidt.
- **Voor:** sterke cliffhanger, motiveert doorspelen, schaalbaar over werelden.
- **Tegen:** geen "afsluiting"; minder geschikt als einde van het hele spel.

### Optie D — Held-redding 🦸
Roef bereikt het oppervlak en redt iets/iemand (kleine visjes, een gestrand maatje),
de twist is een warm/heroïsch moment in plaats van een grap.
- **Voor:** emotioneel, goed voor verhaal/verbinding met de mascotte.
- **Tegen:** minder "lollig"; past beter als seizoens-/eind-moment.

### Aanbeveling
Gebruik **een mix die met voortgang escaleert**:
- **Normale levels:** kleine variaties van **C** (cliffhanger) om door te spelen.
- **Wereld-einde (boss-achtig):** **A** (monster gevangen) als beloning.
- **Speciale/grap-levels:** af en toe **B** (netje) als verrassing.
- **Verhaalmomenten:** **D** spaarzaam inzetten.

Zo blijft de twist vers, beloont hij de speler én houdt hij de humor erin.

## 7. Voorgestelde volgende stappen

1. Akkoord op de kernbeslissingen (§4) en het favoriete twist-model (§6).
2. Verticale slice bouwen volgens GDD §12 (MVP-scope).
3. Speeltest → afstemmen van monster-snelheid, levelhoogte en besturing.
4. Content opschalen (werelden, obstakels, twists) na validatie.
