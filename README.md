# A Little Invite

A no-account invitation app for asking someone special to coffee, dinner, a
walk, or a simple outing with a little more feeling than a regular message.

## Current milestone

Phase 1 is a frontend prototype with:

- a reusable three-step invitation composer;
- warm/playful and soft/sincere visual templates;
- live editing and a full recipient preview;
- interactive response animations; and
- responsive and reduced-motion behavior.

Shared invitation links, durable responses, and the private creator status page
belong to Phase 2 and will use a small serverless API with D1 persistence.

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

## Project shape

- `app/page.tsx`: invitation composer and recipient preview
- `app/globals.css`: responsive layout, templates, and animation
- `app/layout.tsx`: document metadata and fonts
- `worker/`: Cloudflare-compatible server entry
- `db/`: persistence surface reserved for Phase 2
- `.openai/hosting.json`: Sites deployment configuration

## Product principles

- no account or sign-in requirement;
- inclusive creator and recipient language;
- no saved contacts or tracking;
- honest decline and change-plan responses; and
- mobile-first, accessible interaction.
