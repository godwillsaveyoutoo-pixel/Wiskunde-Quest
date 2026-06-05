# Inhoudmodule — maatbeker patch

Deze versie houdt de UX/schermstijl van `wiskunde_quest_1B_ux_swipe_guest`, maar werkt de submodule **Inhoud → maatbeker** didactisch en visueel bij.

## Aangepast

- Mooier maatbeker-visual met beter passende stijl.
- De ijking wordt nu per vraag **slim gekozen**.
- Waarden liggen altijd op een **bestaand ijkstreepje**.
- Meer variatie in schalen (`ml`, `cl`, `dl`) zodat aflezen niet telkens identiek is.
- **Easy**: vooral recht aflezen in dezelfde eenheid.
- **Normal**: aflezen + eenvoudige herleiding.
- **Hard**: aflezen + herleiding met gevarieerde schalen.
- Compactere vraagformuleringen.
- Prompt ondersteunt nu een rijkere visuele opmaak zodat doel-eenheden duidelijker zijn.

## Bewust niet veranderd

- Het algemene beloningssysteem is behouden.
- Bestaande andere submodules van `inhoud` zijn niet herschreven.
- De oude assets blijven aanwezig.


## Extra promptupdate

- Tweeregelige inhoudsvragen worden mooier weergegeven.
- Voorbeeld:
  - regel 1: `Een mok bevat 20 cl.`
  - regel 2: `Hoeveel dl is dat?`
- Maatgetallen en eenheden krijgen visuele aandacht via compacte chips.
- Klassieke invultekst zoals `____ ml` wordt in de prompt niet onnodig herhaald; de antwoordzone blijft apart.
