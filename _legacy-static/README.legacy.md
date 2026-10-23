# EPIC ELITES — Official esports website

A complete, responsive, multi-page website for the Epic Elites Free Fire team, using the supplied team emblem, six player portraits and jersey artwork.

## What is included

- Seven fully designed pages: Home, Roster, Matches, Media, News, About and Contact.
- Six real supplied player portraits and individually editable names, roles and biographies.
- An interactive player selector, player profile dialog, and custom pointer-reactive roster cards.
- Tactical radar graphics, a live motion canvas, orbital details, looping editorial ticker and magnetic buttons.
- A physically rotating 3D jersey viewer with the exact original front/back jersey artwork.
- Keyboard-friendly match filters and modal galleries.
- Mobile navigation, reduced-motion support, semantic markup, metadata for every page and optimized WebP assets.
- A contact form that opens a real email draft when the team email is configured. Until then, it copies a prepared inquiry instead of pretending to send one.
- No invented match results, trophies, sponsor names, roster identities or social accounts.
- No libraries, npm installation, authentication or external JavaScript dependencies.

## Preview locally

From this directory, run:

```sh
python -m http.server 8000 --directory site
```

Open http://localhost:8000/ . The full site is in the `site` directory and is ready to upload to a static host.

## Editing the roster and team information

Open `content/team.json` and change any player's `name`, `role`, `bio` or `number`. The images are already assigned to the six players. All the imagery lives in `site/assets/images/`.

After editing the JSON, run:

```sh
python build.py
```

This generates the updated public HTML pages with the latest information. **Make sure to deploy the regenerated `site` folder.**

## Entering official fixtures or results

In `content/team.json`, add records to either `upcomingMatches` or `results`:

```json
{
  "opponent": "Verified opponent name",
  "event": "Verified tournament name",
  "date": "18 NOV 2026",
  "time": "8:00 PM BST"
}
```

For `results`, use `"result": "BOOYAH / PLACEMENT / SCORE"` to display real data. The example is illustrative only: do not publish it as an actual team result.

## Contact details and socials

In `content/team.json`, set `email` and any verified profile URLs inside `socials`. Empty social fields are hidden. Until the email is configured, the inquiry form can only **prepare and copy** a message. It cannot deliver email itself.

For actual server-side contact submission, connect a trusted form backend and implement anti-spam validation before switching the form to an API endpoint.

## SEO and deployment

Every page has its own HTML title, description, Open Graph title/description and indexable initial page content. If you know the official domain, add `"siteUrl": "https://yourdomain.com"` to `content/team.json` and rerun `python build.py` to generate `sitemap.xml` and a sitemap link in `robots.txt`.

Deploy the contents of `site/` to Netlify, Cloudflare Pages, GitHub Pages (at the root), or Vercel as a static site. No build step is required on the host after generating the files locally.

## Notes

Typography loads Barlow Condensed, Rajdhani and Space Mono from Google Fonts, with local fallback stacks. All logo, portrait and jersey assets were provided by the team. Please ensure you hold usage rights before making the website public.
