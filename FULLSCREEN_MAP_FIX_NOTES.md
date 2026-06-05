# Fullscreen + map fix

## Fullscreen

Probleem:
In fullscreen kon de topbar verdwijnen, waardoor je niet meer uit fullscreen of uit de vraag kon.

Oplossing:
Er is nu altijd een zwevende knop zichtbaar in fullscreen:

- `⤢` = verlaat fullscreen
- `Stop` = stop vraag / ga terug uit de spelvraag

Bestanden:
- `css/fullscreen-map-fix.css`
- `js/fullscreen-map-fix.js`

## Kies je wereld

Probleem:
De wereldkaarten gebruikten de verticale ruimte niet goed en kwamen visueel niet mooi tot onderaan.

Oplossing:
Het map-scherm gebruikt nu een grid met:
- header
- deckbar
- kaartenzone die de resterende hoogte vult

De kaartenzone kan scrollen, maar vult wel het scherm beter.
