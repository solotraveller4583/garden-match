# Garden Match

A calm, family-friendly mobile puzzle game built as a Progressive Web App. It works in a browser and can be installed to a phone home screen.

## Play locally

```bash
cd /c/Users/5290/MobilePuzzleGame
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Game design

- Genre: match-3 puzzle
- Audience: everyone, all ages
- Theme: cheerful garden tiles
- Accessibility: no timer, large tap targets, simple language, gentle sounds, hint button
- Mobile: responsive portrait layout, PWA manifest, offline service worker

## Files

- `index.html` — app structure
- `styles.css` — mobile UI and animations
- `game.js` — full game logic
- `manifest.webmanifest` — installable PWA metadata
- `sw.js` — offline cache
- `icon.svg` — app icon

## Publish options

The simplest deployment is any static host: Netlify, Vercel, GitHub Pages, Cloudflare Pages, or Render Static Site. Upload this folder as a static site and set the publish directory to the project root.
