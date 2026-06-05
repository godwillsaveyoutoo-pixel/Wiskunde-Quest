# Geodriehoek fit patch

Deze patch corrigeert het probleem waarbij `visualWrap` en `panelBodyInner` een groot leeg vlak maakten terwijl de eigenlijke geodriehoek-scène klein bleef.

## Aangepast

- Geen grote lege `visualWrap` meer op smartphone.
- De geodriehoekscènes gebruiken een compactere viewBox.
- De extra titel/instructietekst binnen de SVG is verwijderd; de vraag erboven volstaat.
- De geodriehoek zelf blijft behouden.
- De werkende startpositie blijft behouden:

```html
data-geo-x="-200"
data-geo-y="0"
data-geo-rot="180"
data-geo-scale="0.40"
```

Voor hoek meten:

```html
data-geo-x="-180"
data-geo-y="30"
data-geo-rot="180"
data-geo-scale="0.40"
```

## Bestanden

- `css/geo-fit-patch.css`
- `js/geo-fit-patch.js`
