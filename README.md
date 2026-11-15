# gkougkoudis team · site

Static site for **gkougkoudisteam.gr** (RE/MAX delta ktima, Λάρισα & Κατερίνη).

- `index.html`, `assets/` — the page (HTML/CSS/JS, three.js + GSAP from cdnjs).
- `data/listings.json` — the team's live listings, refreshed every day by
  `.github/workflows/update-listings.yml`, which runs `scripts/fetch_listings.py`
  against the public WordPress API of remax-deltaktima.gr (author 62 = team page).
- Hosted on GitHub Pages from `main` (root).
