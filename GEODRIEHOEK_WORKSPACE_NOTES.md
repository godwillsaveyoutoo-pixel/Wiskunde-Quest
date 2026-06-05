# Geodriehoek workspace redesign

Deze patch maakt meetopgaven met de geodriehoek ruimer en bruikbaarder.

## Wat is aangepast

- Geodriehoekvragen krijgen automatisch de CSS-class `geoMeasureMode`.
- In die modus krijgt de visualisatie veel meer hoogte en breedte.
- `visualWrap` en `panelBodyInner` knijpen de `geoScene` niet meer samen.
- De keypad wordt compacter bij meetopgaven.
- De geodriehoek blijft behouden.
- De startwaarden voor lijnstukken meten staan opnieuw op:
  - `data-geo-x="-200"`
  - `data-geo-y="0"`
  - `data-geo-scale="0.40"`
- De onzichtbare-geodriehoek bug in de hoekmeting is hersteld door opnieuw `svgGeodriehoekSvgOnly()` te gebruiken.

## Zelf aanpassen

Bij een `geoScene` kan je blijven werken met:

```html
data-geo-x="-200"
data-geo-y="0"
data-geo-rot="180"
data-geo-scale="0.40"
```

- `x` groter = meer naar rechts
- `y` groter = meer naar beneden
- `scale` groter = groter
