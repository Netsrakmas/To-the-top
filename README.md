# Roef de Vis — To the Top 🐟⬆️

> Een verticale mobiele arcade-game waarin **Roef de vis** naar het wateroppervlak
> zwemt om te ontsnappen aan het monster dat hem van onderaf achtervolgt.

![status](https://img.shields.io/badge/status-prototype-green)
![platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)

---

## In één zin

Zwem omhoog, ontwijk de obstakels, blijf het monster voor — en haal **the top**
(het wateroppervlak) voordat je wordt ingehaald.

## Het idee

Roef is een kleine vis op de bodem van de zee/het meer. Diep onder hem jaagt een
**monstervis**. De enige uitweg is naar boven: Roef moet door meerdere schermen
hoge levels heen zwemmen, langs rotsen, kwallen, stroming en visnetten, totdat hij
het oppervlak doorbreekt.

Het spannende: de jager verandert. De voedselketen ("grote vis eet kleine vis") kent
**3 monstervissen** die oplopen in grootte. De jager schuift een schakel op wanneer
hij wordt **opgegeten door een grotere monstervis**, óf wanneer Roef hem **afschudt
door door een net te glippen** — waarna een nieuwe, grotere vis opduikt. De druk
wordt steeds groter.

De ontknoping draait het om: bij het oppervlak hangt een **visnet**. Roef is klein
genoeg om er dwars doorheen te zwemmen — de grote monstervis niet, en raakt
verstrikt. Roef ontsnapt. Klein zijn was uiteindelijk zijn redding.

Het spel speelt zich af over de **volledige breedte** van het scherm — je beweegt
Roef links/rechts en stuwt hem omhoog terwijl het beeld meescrolt naar boven.

Aan het oppervlak gebeurt er telkens iets onverwachts en grappigs (zie
[de eindscenario's](#eindscenarios-de-twist)).

## Kernkenmerken

- 📱 **Verticale gameplay over de volle schermbreedte** — gemaakt voor mobiel, één hand.
- 🌊 **Levels van meerdere schermen hoog** — elk level eindigt bij het oppervlak.
- 👹 **Escalerende jager** — een kleine monstervis wordt opgegeten door een grotere; de druk loopt op.
- 🪨 **Obstakels & hazards** — rotsen, kwallen, stroming, netten en meer.
- 🫧 **Power-ups & collectibles** — luchtbellen, boosts en schilden.
- 🕸️ **Het net als ontknoping** — Roef glipt erdoorheen, de grote vis raakt verstrikt.

## Prototype spelen ▶️

Er is een **speelbaar HTML5-prototype** (één bestand, geen build):

```bash
cd prototype
python3 -m http.server 8000   # open http://localhost:8000
```

Of open `prototype/index.html` direct in een browser. **Sleep** om Roef te laten
zwemmen, **loslaten** om te zakken. Glip door de netten, ontwijk rotsen en kwallen,
en haal de top. Zie [prototype/README.md](prototype/README.md) voor details.

## Documentatie

| Document | Inhoud |
|----------|--------|
| [docs/DESIGN.md](docs/DESIGN.md) | Volledig Game Design Document (GDD) |
| [docs/REVIEW.md](docs/REVIEW.md) | Review van het idee + aanbevelingen |
| [prototype/](prototype/) | Speelbaar HTML5-prototype van de kern-gameplay |

## De verhaalboog (escalerende jager → het net)

De spanning bouwt op via de **voedselketen**:

1. Roef wordt achtervolgd door een **kleine monstervis** (schakel 1 van 3).
2. De jager schuift op naar een **grotere monstervis** — door opgegeten te worden óf
   doordat Roef hem via een net afschudt. Enger, sneller, vult meer van het scherm.
3. Dit gebeurt tot de **3e, reusachtige** monstervis, zodat de druk oploopt.
4. **Ontknoping:** bij het oppervlak hangt een **visnet**. Roef glipt er klein als
   hij is dwars doorheen; de grote monstervis is te groot en raakt verstrikt. Roef
   ontsnapt — klein zijn redt hem.
5. **Cliffhanger:** net boven water doemt al een nieuwe dreiging op (meeuw, boot…) —
   "wordt vervolgd".

## Status & roadmap (kort)

Er is een **speelbaar prototype** dat de kern-gameplay valideert (zwemmen, obstakels,
escalerende jager, net-ontknoping, cliffhanger). De eerstvolgende mijlpaal is een
volledige verticale-slice (MVP). Zie de
[roadmap in het GDD](docs/DESIGN.md#14-roadmap--milestones).

## Licentie

Nog te bepalen.
