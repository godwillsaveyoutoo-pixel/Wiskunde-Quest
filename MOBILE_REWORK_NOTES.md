# Mobile rework

Deze versie herwerkt de interface mobile-first, zonder de bestaande functionaliteiten of SVG-inhoud te verwijderen.

## Belangrijkste wijzigingen
- volledige mobile-first visuele laag toegevoegd
- alle schermen in compactere 'game app' verpakking
- startscherm, map, game, leaderboard, settings en modals mobieler gemaakt
- game-layout herschikt naar: vraag + visual + antwoord + keypad
- keypad op mobiel standaard open en onderaan bruikbaar
- meerkeuzeopties full-width voor tikgemak
- geomeasure / geodriehoek layout opnieuw geprioriteerd voor portret-gsm's
- `showScreen()` zet nu ook correct `.active`

## Toegevoegde bestanden
- `css/mobile-game-rework.css`
- `js/mobile-game-rework.js`

## Aangepaste bestanden
- `index.html`
- `js/core.js`
- `js/game.js`
