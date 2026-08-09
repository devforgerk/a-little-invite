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
