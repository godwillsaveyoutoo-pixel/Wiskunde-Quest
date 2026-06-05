# SVG scale + no idle return patch

## SVG's schalen mee

Deze patch overschrijft oude vaste breedtes, vooral bij `svgImgSafe()` waar vaak inline `width:120px` stond.

Belangrijkste bestand:
- `css/svg-scale-and-layout-fix.css`

Effect:
- inline SVG's worden `width:100%`
- object-SVG's in `.svgSafeWrap` worden groter
- visualisaties vullen hun vak beter
- multiple-choice SVG-symbolen blijven wel binnen hun knop

## Niet meer zomaar naar startscherm

In `js/auth.js` is `onAuthSignedOut()` aangepast.

Waarom:
Supabase kan na inactiviteit, netwerkpauze of token-refreshproblemen een null-session/signed-out event geven.
Dat stuurde het spel naar `scrStart`.

Nieuwe regel:
- bij gastmodus: blijf gewoon waar je bent
- tijdens spel/map/settings: niet automatisch naar start
- alleen bij echte logout ga je naar start
