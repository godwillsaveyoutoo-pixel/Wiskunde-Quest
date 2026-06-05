# Fixed Zones Layout

Deze versie vereenvoudigt de layout van het spelscherm.

## Idee

Het scherm krijgt vaste zones:

### Desktop
- links: opgave + visualisatie + antwoord
- rechts: keypad

### Smartphone
- boven: opgave + visualisatie
- midden: antwoordveld
- onder: compacte keypad

## Waarom

De vorige patches probeerden veel afzonderlijke onderdelen te herschalen.
Dat leidde tot conflicten. Deze versie gebruikt een simpele vaste verdeling.

## Belangrijk

- Geen agressieve MutationObserver.
- Geen inline stijl-mutaties voor afbeeldingen.
- Meer voorspelbare verhouding tussen opgave en keypad.
- MC-vragen verbergen de keypad op mobiel.

## Bestanden

- `css/fixed-zones-layout.css`
- `js/fixed-zones-layout.js`
