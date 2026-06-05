# Keypad bottom lock

Deze patch zorgt dat de game-keypad op smartphone altijd onderaan blijft.

## Probleem

Bij korte vragen werd de vraagzone kleiner en schoof de keypad hoger in het scherm.

## Oplossing

Het spelscherm krijgt vaste zones:

- boven: panel met vraag + visualisatie + antwoord
- onder: keypad

De bovenste zone gebruikt altijd de resterende hoogte, ook als de vraag weinig tekst heeft.

## Bestanden

- `css/keypad-bottom-lock.css`
- `js/keypad-bottom-lock.js`
