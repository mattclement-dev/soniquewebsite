# SONIQUE — Artist Website

A responsive artist website for SONIQUE, built with HTML, CSS, and vanilla JavaScript.

## Pages
- `index.html` — Main single-page site with biography, photo gallery, music, videos, events, socials, and contact
- `press.html` — Legacy press-kit page; currently excluded from search indexing until its placeholder content is replaced

## Shared files
- `styles.css` — all design tokens, layout, and animation (colors/fonts are CSS variables at the top)
- `script.js` — mobile menu, carousel wheel scrolling, scroll reveal animation, and footer year
- `robots.txt` and `sitemap.xml` — search crawler guidance and the canonical homepage URL

## Preview locally
1. Unzip/download the folder.
2. VS Code → File → Open Folder → select it.
3. Install the **Live Server** extension.
4. Right-click `index.html` → "Open with Live Server" to preview with auto-refresh.

## Update photos
Homepage portraits, gallery images, and release artwork are referenced from `images/` in `index.html`. Replace the relevant `src` and write concise, descriptive `alt` text when changing an informative image.

## Connect the Bandsintown widget
The events page already has the real, official Bandsintown embed code:
```html
<script charset="utf-8" src="https://widget.bandsintown.com/main.min.js"></script>
<a class="bit-widget-initializer" data-artist-name="SONIQUE" ...></a>
```
The widget is embedded in the Events section of `index.html`.
To make it live:
1. Go to **bandsintown.com/artists** and claim/create Sonique's artist profile if you haven't already.
2. Add her tour dates there — the widget pulls from that profile automatically.
3. In the artist dashboard, open the **Widget** tool. You can either:
   - Confirm the artist identifier in `index.html` matches her Bandsintown profile, **or**
   - Use her Bandsintown **artist ID** instead (more reliable) — find it in her profile URL, e.g. `bandsintown.com/a/1234567` → use `data-artist-id="1234567"` in place of `data-artist-name`.
4. The color attributes are set to match this site's palette; edit them in `index.html` if needed.

## Add streaming platform links
The release and streaming-service links in `index.html` currently use `href="#"`. Replace each with the real smart link or platform URL:
```html
<a href="https://open.spotify.com/artist/..." class="platform-pill">Spotify</a>
```
You can also use a "smart link" service (Linkfire, Feature.fm, or Songwhip are common free/paid options) to generate one link that redirects fans to their preferred platform automatically — just point the `href` at that smart link instead of a specific platform.

## Add press kits
In `press.html`, each `.press-card` has two buttons:
- **Download Press Kit (PDF)** — link this to a PDF you've prepared per single (bio blurb, credits, contact info).
- **Download Photos (ZIP)** — link this to a zipped folder of high-res photos for that release.

Upload the actual PDFs/ZIPs to your hosting once the site is live, then point each `href="#"` at the real file path, e.g. `href="press-kits/single-title.pdf"`.

## Add a new single
Duplicate a `.release-item` in `index.html`, then update its title, cover art, alt text, and smart-link URLs.

## Deploy and submit to Google
**Netlify (easiest):**
1. netlify.com → sign up free.
2. Drag the whole project folder onto the Netlify dashboard, or connect a GitHub repo for auto-deploys.
3. Site settings → Domain management → Add custom domain → enter your domain.
4. Add the DNS records Netlify gives you at your domain registrar (usually a CNAME record).
5. SSL (https) is issued automatically once DNS propagates.

**Alternatives:** Vercel, GitHub Pages, and Cloudflare Pages all work the same way for a static site like this.

The canonical URL and sitemap currently assume the planned domain `https://sonique.co.za/`. If the final domain differs, update the canonical/Open Graph/schema URLs in `index.html`, plus `robots.txt` and `sitemap.xml`, before launch. Once the site is live on HTTPS, verify the domain in Google Search Console and submit `/sitemap.xml`. Search indexing and rankings are not immediate or guaranteed.

## Notes
- No dependencies or build step — one active homepage plus shared CSS/JS and static assets.
- Fully responsive down to small mobile screens, with a proper mobile menu.
- Respects `prefers-reduced-motion` and has visible keyboard focus states throughout.
- Fonts (Bricolage Grotesque, Inter, IBM Plex Mono) load via Google Fonts CDN.
