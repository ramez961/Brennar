# Brennar

Outdoor storefront concept with original vector branding, generated product imagery, and a browser-local catalog dashboard.

## Run

Run `node server.mjs` (or `npm start`), then open http://127.0.0.1:4173. Open `/admin.html` for the dashboard. No dependency installation or build step is needed. Run `npm run check` for JavaScript syntax checks.

## Repository layout

Website HTML, CSS, and JavaScript are at the repository root. All photographs, the logo, and the browser icon are together in `assets/`. Serve the root folder with any static host. `server.mjs` is the local preview server.

## Loading performance

The photo assets use WebP and total about 584 KB, down from 25.3 MB of original PNGs. Product images are sized to 800 pixels, and the hero includes a smaller responsive mobile variant. The hero loads with high priority; images below it decode asynchronously and load lazily. Content-versioned photo URLs allow caching without stale image replacements. Catalog scripts are deferred and font connections start early.

The preview server caches file representations, serves Brotli or gzip for text and SVG, and supports ETags with 304 responses. Images are cached for one day; HTML, CSS, scripts, and logos revalidate when requested. Static hosting should provide equivalent compression and caching headers.

## Storefront

Eight sample outdoor products, search, category filters, price sorting, saved gear, product details, options, a persistent local cart, quantity controls, demo order preview, FAQs, and a local interest list. Category labels sit below their photographs; product images fit inside their frames without cropping.

## Dashboard

Add, edit, hide, or remove products; create and rename categories; select a catalog photograph or upload PNG, JPEG, or WebP up to 1 MB. Undo the latest change within the current dashboard session. Catalog JSON import and export support backups and transfers.

The requested Nerf Darts toy category starts with three editable main headings and six image subtitles. Each main heading can hold multiple subtitles, each with its own photograph and description. No brand affiliation is claimed.

## Demo limitations

All prices, specifications, and product photographs are illustrative. No real orders, payments, or emails are submitted. Protection ratings and certifications are unverified. Browser-local catalog changes only affect visitors using that same browser and origin. No shared database or administrator authentication is connected. Export backups regularly.

Google Fonts supplies typography. Product photos and vector logos are served locally. Real commerce requires supplier inventory, validated specifications, policies, shipping settings, authentication, shared storage, and payment integration.
