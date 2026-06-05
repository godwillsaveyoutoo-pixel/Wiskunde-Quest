# UX cleanup patch

Deze patch pakt vier problemen aan:

## 1. Meerkeuzevragen
Meerkeuzevragen tonen geen keypad/rechterpaneel meer. Het rechterpaneel drukte de layout op smartphone samen.

## 2. Fullscreen
- De bestaande fullscreenknop blijft werken.
- Dubbel tikken/dubbel klikken op de lege spelruimte schakelt fullscreen aan/uit.
- In fullscreen wordt de topbar compacter of verborgen op mobiel.

## 3. Tijdtekst
Apostrofs zoals `'s morgens` zijn vervangen door eenvoudiger woorden zoals `ochtend`.
Dit voorkomt rare HTML-entiteiten zoals `&#39;`.

## 4. Vraagtekst
Promptweergave is rustiger:
- berekeningen gecentreerd;
- haakjes worden als kleine hint-chip getoond;
- meetvragen worden korter weergegeven.

## Bestanden
- `css/ux-cleanup-patch.css`
- `js/ux-cleanup-patch.js`
- wijzigingen in `js/game.js`
- kleine tekstfix in `js/questions.js`
