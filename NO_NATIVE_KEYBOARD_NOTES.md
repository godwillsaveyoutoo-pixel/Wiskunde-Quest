# Geen telefoon-keyboard

Deze patch zorgt dat op smartphone het native Android/iOS-toetsenbord niet opent wanneer leerlingen op het antwoordveld tikken.

## Waarom

De game heeft een eigen keypad. Als het telefoon-keyboard opent, wordt de game-keypad onbruikbaar en schuift de layout stuk.

## Werking

Op touch/smalle schermen:

- `#mainInput` wordt `readonly`
- `inputmode="none"`
- tikken op het veld opent geen telefoon-keyboard
- de game-keypad schrijft nog steeds gewoon in het veld
- ratio/fraction-inputs worden ook klaargemaakt voor game-keypad-invoer
- automatische focus op ratio-inputs is op smartphone uitgeschakeld

Op pc/laptop blijft typen met het echte toetsenbord gewoon mogelijk.

## Bestanden

- `css/no-native-keyboard.css`
- wijziging in `js/game.js`
