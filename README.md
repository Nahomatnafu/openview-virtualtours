# OpenView Virtual Tours

Marketing site for OpenView Virtual Tours. Live at **https://www.openviewhomes.com**.

## Running it

There is no npm, no build step, and no dev server. It is hand-written HTML, CSS
and JavaScript, so there is nothing to install and nothing to compile.

**Quickest:** double-click `index.html`. Every asset path is relative, so it
renders and the JavaScript runs straight from disk.

**Better, and what I'd use for real checking:**

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Python 3 ships with macOS, so there is nothing
to install. Use this rather than opening the file when you want to match
production, or when you want to open the site on your phone over the same
network.

To edit: change the file, save, reload the browser. That is the whole loop.

## Deploying

Hosted on Vercel, serving the repo root as-is. Nothing is generated, so what is
in the repo is what is on the site.

## Layout

```
index.html      Homepage
demos.html      The U-Square case study and all 16 tours
contact.html    Calendly booking
css/main.css    The only stylesheet
js/main.js      The only script
images/tours/   Tour covers: <unit>.jpg at 640px, <unit>-320.jpg for thumbnails
```

## Things to know before editing

**The referral flow in `js/main.js` is live business logic.** It reads `?ref=`
from the URL, stores it in `localStorage`, and feeds it into the Calendly
booking URL so referrals are attributed. Changing it silently breaks referral
tracking. To test it, load `contact.html?ref=TESTCODE` and confirm the generated
widget URL contains both `a1=TESTCODE` and the ref inside `text=`.

**The Calendly height is 700px in two places** — an inline style in
`js/main.js` and a `min-height` in `css/main.css`. The CSS one looks redundant
but reserves the space before the widget loads, so the page does not jump. Keep
them in step.

**The header and footer are copied into all three pages.** A static site has no
way to include a shared partial, so each block is wrapped in `SHARED:HEADER` /
`SHARED:FOOTER` comments. If you change one, change all three. To check:

```bash
for b in HEADER FOOTER; do
  for f in index.html demos.html contact.html; do
    sed -n "/SHARED:$b/,/\/SHARED:$b/p" "$f" | sed 's/ aria-current="page"//' \
      | shasum -a 256 | cut -c1-12
  done | sort -u | wc -l   # must print 1
done
```

## Adding a tour

Each tour needs a cover image and a list entry.

1. Get the Kuula collection ID from the share link, and the cover path from that
   page's `og:image` tag:

```bash
curl -sL "https://kuula.co/share/collection/<ID>" | grep -o 'og:image[^>]*'
```

2. Download the cover and make the thumbnail (`sips` ships with macOS):

```bash
curl -fsSL -o "images/tours/<slug>.jpg" \
  "https://kuula.co/shareimg/<path-from-og-image>/01-cover.jpg"
sips -Z 320 -s format jpeg -s formatOptions 72 \
  "images/tours/<slug>.jpg" --out "images/tours/<slug>-320.jpg"
```

Covers are copied locally rather than linked to Kuula: their CDN sends no cache
headers and sets cookies on your visitors.

3. Copy an existing `<li class="unit">` in `demos.html` and update the ID, the
   Kuula URL (in both `href` and `data-tour-url`), the poster paths, and the
   labels. Nothing else needs wiring — the viewer, filters and deep links all
   read from those attributes.

4. If it belongs on the homepage wall, copy an `<a class="door">` in
   `index.html` too.
