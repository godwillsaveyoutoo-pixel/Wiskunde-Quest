# Final optimization layer

Deze versie zet één laatste, stabiele laag bovenop de bestaande patches.

## Belangrijkste fixes

- `showScreen()` zet nu ook `.active` op het zichtbare scherm. Daardoor werken de bestaande CSS-patches voor fullscreen, map en keypad eindelijk consequent.
- De keypad op smartphone blijft onderaan in een vaste zone, ook bij korte vragen.
- Automatisch inklappen van de keypad op kleine touchscreens wordt geneutraliseerd zodra de keypad nodig is.
- Meerkeuzevragen verbergen de keypad en krijgen de volledige spelhoogte.
- De wereldkaarten vullen de resterende hoogte beter op het scherm.
- Fullscreen gebruikt de echte viewporthoogte via `--wq-vh`, nuttig op mobiele browsers.
- Tijdteksten zoals `&#39;s avonds` worden extra genormaliseerd naar `in de avond`.
- SVG's en afbeeldingen schalen binnen hun visualisatievak zonder de antwoord/keypad-zone omhoog te duwen.

## Bestanden

- `css/wq-final-optimization.css`
- `js/wq-final-optimization.js`
- kleine verbetering in `js/core.js` bij `showScreen()` en `hideAllScreens()`
