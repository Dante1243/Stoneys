# Stoneys

Static website hosted for free on GitHub Pages.

## Hosting

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. The site will be live at `https://<username>.github.io/<repo-name>/`.

No build step, no external services, no extra accounts required — just HTML, CSS and JavaScript.

## Transferring ownership

Repo **Settings → General → Danger Zone → Transfer ownership**. GitHub Pages keeps working after the transfer (the URL changes to the new owner's username).

## Project layout

```
index.html        Public site (all sections)
css/styles.css    Styles. Brand colours and fonts are tokens at the top of the file
js/main.js        Nav, scroll reveals, zoom, before/after sliders, forms, reviews list
js/hero.js        3D wheel in the hero (Three.js, loaded from a CDN)
js/api.js         Where form submissions go (stub in stage 1, Supabase in stage 2)
assets/img/       Favicon and placeholder art (swap for real photos)
```

## Updating content

- **Reviews:** add real reviews to the `REVIEWS` array at the top of `js/main.js`.
- **Photos:** drop files in `assets/img/` and update the `src` in `index.html`.
- **Colours:** edit `--accent`, `--accent-2` and `--accent-deep` in `css/styles.css`. The 3D wheel follows automatically.

## Stages

1. Public site, done with placeholders
2. Quotes and booking (Supabase)
3. Admin CRM and new-request alerts
