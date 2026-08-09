# A Little Invite

A no-account invitation app for asking someone special to coffee, dinner, a
walk, or a simple outing with a little more feeling than a regular message.

## Current workflow

The app now supports the complete no-account response loop:

- create an invitation in the three-step composer;
- receive a public recipient link and a separate private status link;
- share the recipient link manually through WhatsApp, email, or any messenger;
- let the recipient accept, suggest an adjustment, or decline with an optional note;
- see the saved answer on the private status page; and
- prevent later submissions from replacing the first response.

The experience also includes:

- warm/playful and soft/sincere visual templates;
- live editing and a full recipient preview;
- interactive response animations;
- responsive and reduced-motion behavior.

There is no login and no contact list. Link possession is the privacy boundary:
the recipient link can answer the invitation, while the private status link can
read the response. Private status tokens are stored only as SHA-256 hashes.

## Privacy and browser inspection

Browser developer tools can always show the HTML, JavaScript, URL, and API data
already delivered to that browser. A recipient can therefore inspect the name,
place, time, message, and response state for the invitation they opened. The
creator can inspect the response loaded by their private status page. This is
normal web behavior and cannot be hidden by minifying the frontend.

Developer tools do not expose the D1 database binding, stored status-token
hashes, or a list of other invitations. Access to a record requires its long,
random URL token. Anyone who receives or steals a recipient link can read that
invitation and submit its first response; anyone with the private status link
can read the answer. Do not put passwords, financial details, intimate secrets,
or other high-risk personal information in an invitation.

The site uses a no-referrer policy so tokenized paths are not sent to unrelated
sites in the HTTP `Referer` header. Invitation and private-status routes also
publish `noindex` directives and are omitted from the sitemap. Browser history,
screenshots, extensions, shared devices, and copied links remain outside the
app's control.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Free personal URL

The repository includes a small Vercel proxy configuration. It gives the app a
free personal `*.vercel.app` address while the existing Sites deployment keeps
running the D1-backed invitation and response API.

Import this repository in Vercel, keep the project root as the repository root,
and use `a-little-invite` as the project name if it is available. Vercel reads
`vercel.json`, skips the application build, and forwards every route to the
working origin without changing the address visible in the browser.

The `vercel-static` directory deliberately has no `index.html`. This lets the
root request reach the external rewrite instead of being handled as a local
static page.

The composer and private status page rewrite returned links to the browser's
current origin. Links copied from the Vercel deployment therefore stay on the
personal Vercel address.

This is a hostname layer, not a backend migration. The Vercel project currently
proxies to the Sites deployment, which still runs the Worker and D1 database.
That origin must remain deployed. For a fully independent personal deployment,
move the Worker and D1 database to a personal Cloudflare account or replace the
database before treating the project as a long-term public service.

## Google Search setup

The public homepage has canonical metadata, a crawlable `robots.txt`, and a
one-page sitemap at:

```text
https://a-little-invite.vercel.app/sitemap.xml
```

Recipient invitations and private response pages are intentionally excluded
from search. To register the homepage with Google:

1. Open [Google Search Console](https://search.google.com/search-console) and
   add the URL-prefix property `https://a-little-invite.vercel.app/`.
2. Choose the HTML tag or HTML file verification method. Add the exact token or
   file Google provides to this project, deploy it, and then click **Verify**.
3. Submit `https://a-little-invite.vercel.app/sitemap.xml` in the Sitemaps page.
4. Inspect the homepage URL and choose **Request indexing**.

A `vercel.app` subdomain cannot be verified as a Domain property because its
DNS belongs to Vercel, so use the URL-prefix option. Google says crawling may
take from a few days to a few weeks and requesting indexing does not guarantee a
ranking. A custom domain, useful public wording, and genuine links from other
sites can improve long-term discoverability.

## Capacity and invitation isolation

Every invitation is independent. It receives a cryptographically random public
recipient token, a different private status token whose SHA-256 hash is stored,
one invitation row, and at most one response row. The response insert and status
update run as a transactional D1 batch, and the response primary key ensures the
first submitted response wins even when two submissions arrive together.

A short burst of roughly 100 people creating or opening their own invitations is
a reasonable small-scale target for this design. Token lookups are indexed and
D1 queues short bursts of queries. This is an engineering expectation, not an
availability guarantee: the hosted deployment has not been subjected to a
production load test, and a sustained 100-user workload is different from 100
people visiting around the same time.

To protect the free request budget, an open private status page checks only while
its tab is visible, once per minute, for at most 15 automatic checks. Manual
refresh remains available after that.

Current published free-tier limits include:

- [Vercel Hobby](https://vercel.com/docs/plans/hobby): up to 1,000,000 edge
  requests per usage period for personal, non-commercial projects;
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/):
  5,000,000 rows read per day and 100,000 rows written per day; and
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/):
  500 MB per database and 5 GB total storage on the free plan.

One hundred invitations and their responses are far below those database limits
under normal use. Traffic abuse, bots, or clients refreshing continuously can
consume a free quota much faster than real invitation traffic.

Before opening the service to a large unknown audience, add rate limiting or a
bot challenge to write endpoints, monitoring for API errors and quota use, and a
retention job that deletes expired invitations. Expiration currently closes an
invitation to new responses but does not remove its stored names, place, or
message.

Generate a migration after changing `db/schema.ts` with:

```bash
npm run db:generate
```

## Project shape

- `app/page.tsx`: invitation composer and link handoff
- `app/i/[token]/`: public recipient invitation and response form
- `app/s/[token]/`: private creator response status
- `app/api/`: tokenized invitation and response endpoints
- `app/components/`: shared invitation and flow UI
- `app/globals.css`: responsive layout, templates, and animation
- `app/layout.tsx`: document metadata and fonts
- `app/robots.ts` and `app/sitemap.ts`: public search discovery rules
- `worker/`: Cloudflare-compatible server entry
- `db/`: D1 schema, validation, token handling, and queries
- `drizzle/`: generated database migrations
- `.openai/hosting.json`: Sites deployment configuration

## Product principles

- no account or sign-in requirement;
- inclusive creator and recipient language;
- no saved contacts or tracking;
- honest decline and change-plan responses; and
- mobile-first, accessible interaction.
