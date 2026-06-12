# Garden Match

A calm, family-friendly mobile puzzle game built as a Progressive Web App. It works in a browser and can be installed to a phone home screen.

Live game:

```text
https://garden-match.onrender.com
```

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
- Theme: cheerful garden tiles drawn with original CSS artwork
- Sharing: one simple Share / LINE button using the device/browser share sheet
- Accessibility: no timer, large tap targets, simple language, gentle sounds, hint button
- Mobile: responsive portrait layout, PWA manifest, offline service worker
- Progress: browser-based save/continue feature
- Rewards: milestone badges every 5 levels from Level 5 to Level 50 with celebration confetti
- Encouragement: every completed level shows a positive progress message
- Difficulty: Normal and Tricky modes are tuned gentler for casual players

## Security and privacy

This project is intentionally simple and low-risk:

- Static HTML/CSS/JavaScript only
- No login system
- No payment system
- No database
- No user uploads
- No third-party scripts
- No advertising or analytics in this version
- Original CSS-drawn playable tile artwork; no downloaded icon packs or copied game art
- The Share / LINE button uses built-in browser/device sharing when available; no social app account data is received by the game
- Content Security Policy meta tags on HTML pages
- Referrer Policy and Permissions Policy meta tags
- Privacy Policy page
- Terms of Use page
- Service worker only caches same-origin game files

Before adding ads, analytics, payments, leaderboards, or accounts, update the Privacy Policy and Terms of Use.

## Files

- `index.html` — app structure and home screen
- `styles.css` — mobile UI, legal pages, and animations
- `game.js` — full game logic
- `manifest.webmanifest` — installable PWA metadata
- `sw.js` — offline cache
- `icon.svg` — app icon
- `privacy.html` — privacy policy
- `terms.html` — terms of use
- `_headers` — optional static-host security headers for compatible hosts

## Publish options

The simplest deployment is any static host: Netlify, Vercel, GitHub Pages, Cloudflare Pages, or Render Static Site. Upload this folder as a static site and set the publish directory to the project root.

For the current GitHub repository structure where the files are directly in the root, Render should use:

```text
Build Command: leave empty
Publish Directory: .
```
