# NH Weather Widget Embed

Live widget URL: https://aaronrdavis.news/nhweather

## Standard iframe embed

Copy and paste this into any WordPress Custom HTML block, CMS page, or article:

```html
<iframe
  src="https://aaronrdavis.news/nhweather"
  width="300"
  height="300"
  style="border:1px solid #ddd; box-shadow:0 2px 4px rgba(0,0,0,0.1);"
  title="New Hampshire weather forecast and alerts"
  loading="lazy">
</iframe>
```

## Notes
- Width: 300px, Height: 300px. The widget needs extra room for the NWS alerts banner.
- No API key required.
- Uses the official U.S. National Weather Service API + Zippopotam.us for ZIP-to-coordinates.
- Default ZIP on load: 03301 (Concord, NH).
- User can enter any ZIP to get the local NWS forecast, active severe-weather alerts, and a link to the full NWS page.
