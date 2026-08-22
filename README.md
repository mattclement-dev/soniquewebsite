# SONIQUE — Artist Site

A multi-page site for Sonique: HTML, CSS, and vanilla JS, no build tools required.

## Pages
- `index.html` — Home: big name + hero photo, about teaser, latest release, tour teaser, gallery, newsletter
- `bio.html` — Full biography (placeholder text, ready for you to update)
- `music.html` — All releases with streaming platform links
- `press.html` — Press kit: general EPK + a downloadable kit per single
- `events.html` — Tour dates, live from Bandsintown

## Shared files
- `styles.css` — all design tokens, layout, and animation (colors/fonts are CSS variables at the top)
- `script.js` — mobile menu, scroll reveal animation, header scroll state, newsletter form handling

## 1. Open it in VS Code
1. Unzip/download the folder.
2. VS Code → File → Open Folder → select it.
3. Install the **Live Server** extension.
4. Right-click `index.html` → "Open with Live Server" to preview with auto-refresh.

## 2. Add real photos
Every photo spot is currently a gradient placeholder `<div class="photo-placeholder">` inside a sized container (`.hero-photo`, `.bio-photo-frame`, `.release-art`, `.gallery-item`, `.press-card-art`). To swap one in, replace the placeholder div with:
```html
<img src="images/your-photo.jpg" alt="Describe the photo">
```
The containers already control size/aspect ratio/border-radius, so the image will just fill the space correctly. Create an `images/` folder next to `index.html` for your photo files.

## 3. Connect the Bandsintown widget (events.html)
The events page already has the real, official Bandsintown embed code:
```html
<script charset="utf-8" src="https://widget.bandsintown.com/main.min.js"></script>
<a class="bit-widget-initializer" data-artist-name="SONIQUE" ...></a>
```
To make it live:
1. Go to **bandsintown.com/artists** and claim/create Sonique's artist profile if you haven't already.
2. Add her tour dates there — the widget pulls from that profile automatically.
3. In the artist dashboard, open the **Widget** tool. You can either:
   - Just confirm the `data-artist-name="SONIQUE"` in `events.html` exactly matches her Bandsintown profile name, **or**
   - Use her Bandsintown **artist ID** instead (more reliable) — find it in her profile URL, e.g. `bandsintown.com/a/1234567` → use `data-artist-id="1234567"` in place of `data-artist-name`.
4. The color attributes (`data-text-color`, `data-link-color`, etc.) are already set to match this site's palette — adjust them in the widget dashboard if you want an exact pixel match, then copy your personalized code back into `events.html`.

## 4. Add streaming platform links
Every `.platform-pill` link (in the hero, release cards, and press kit) currently points to `href="#"`. Replace each with the real URL for that platform:
```html
<a href="https://open.spotify.com/artist/..." class="platform-pill">Spotify</a>
```
You can also use a "smart link" service (Linkfire, Feature.fm, or Songwhip are common free/paid options) to generate one link that redirects fans to their preferred platform automatically — just point the `href` at that smart link instead of a specific platform.

## 5. Add press kits
In `press.html`, each `.press-card` has two buttons:
- **Download Press Kit (PDF)** — link this to a PDF you've prepared per single (bio blurb, credits, contact info).
- **Download Photos (ZIP)** — link this to a zipped folder of high-res photos for that release.

Upload the actual PDFs/ZIPs to your hosting once the site is live, then point each `href="#"` at the real file path, e.g. `href="press-kits/single-title.pdf"`.

## 6. Add a new single (repeat as needed)
`music.html` and `press.html` both have a clearly commented **release card template** — duplicate the block, swap in the new title, year, description, cover art, and links.

## 7. Deploy for free
**Netlify (easiest):**
1. netlify.com → sign up free.
2. Drag the whole project folder onto the Netlify dashboard, or connect a GitHub repo for auto-deploys.
3. Site settings → Domain management → Add custom domain → enter your domain.
4. Add the DNS records Netlify gives you at your domain registrar (usually a CNAME record).
5. SSL (https) is issued automatically once DNS propagates.

**Alternatives:** Vercel, GitHub Pages, and Cloudflare Pages all work the same way for a static site like this.

## Notes
- No dependencies or build step — just five HTML files plus shared CSS/JS.
- Fully responsive down to small mobile screens, with a proper mobile menu.
- Respects `prefers-reduced-motion` and has visible keyboard focus states throughout.
- Fonts (Bricolage Grotesque, Inter, IBM Plex Mono) load via Google Fonts CDN links already in each page's `<head>`.
