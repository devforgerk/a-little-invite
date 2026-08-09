import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the invitation studio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>A Little Invite<\/title>/i);
  assert.match(html, /Create an invitation/);
  assert.match(html, /Warm &amp; playful/);
  assert.match(html, /Soft &amp; sincere/);
  assert.match(html, /Live recipient preview/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.doesNotMatch(html, /signin-with-chatgpt|Sign in with ChatGPT/i);
});

test("serves public search discovery files", async () => {
  const robotsResponse = await render("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Disallow: \/api\//i);
  assert.match(robots, /Sitemap: https:\/\/a-little-invite\.vercel\.app\/sitemap\.xml/i);

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /<loc>https:\/\/a-little-invite\.vercel\.app<\/loc>/i);
  assert.doesNotMatch(sitemap, /\/i\/|\/s\//i);
});

test("keeps the invitation and response workflow contract in source", async () => {
  const [
    page,
    css,
    layout,
    packageJson,
    invitationTypes,
    preview,
    database,
    schema,
    recipientPage,
    statusPage,
    hosting,
    robots,
    sitemap,
    recipientLayout,
    statusLayout,
    vercelConfig,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/invitation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/invitation-preview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/invitations.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/i/[token]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/s/[token]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/i/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/s/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  ]);

  assert.match(invitationTypes, /type TemplateId = "playful" \| "sincere"/);
  assert.match(invitationTypes, /type ActivityId = "coffee" \| "dinner" \| "walk"/);
  assert.match(invitationTypes, /id: "movie"/);
  assert.match(invitationTypes, /id: "outing"/);
  assert.match(page, /className="activity-picker"/);
  assert.match(preview, /activity-\$\{selectedActivity\.id\}/);
  assert.match(page, /aria-label="Invitation studio view"/);
  assert.match(page, /template-swatches/);
  assert.match(preview, /preview-for-you/);
  assert.match(page, /Create invitation/);
  assert.match(page, /Your private response page/);
  assert.match(preview, /I’d love to/);
  assert.match(preview, /Adjust it/);
  assert.match(preview, /Not this time/);
  assert.match(recipientPage, /Send my response/);
  assert.match(recipientPage, /maxLength=\{320\}/);
  assert.match(statusPage, /Refresh response/);
  assert.match(statusPage, /setInterval/);
  assert.match(statusPage, /AUTO_REFRESH_INTERVAL_MS = 60_000/);
  assert.match(statusPage, /MAX_AUTO_REFRESHES = 15/);
  assert.match(statusPage, /document\.visibilityState/);
  assert.match(database, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(database, /INSERT OR IGNORE INTO invitation_responses/);
  assert.match(database, /SELECT 1 FROM invitations LIMIT 1/);
  assert.match(database, /status_token_hash/);
  assert.match(schema, /uniqueIndex\("invitations_public_token_unique"\)/);
  assert.match(schema, /invitationId: text\("invitation_id"\)\s*\.primaryKey\(\)/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.activity-coffee/);
  assert.match(css, /\.activity-dinner/);
  assert.match(css, /\.activity-walk/);
  assert.match(css, /\.activity-movie/);
  assert.match(css, /\.activity-outing/);
  assert.match(css, /--font-cormorant/);
  assert.match(css, /--font-caveat/);
  assert.match(css, /\.mobile-view-switch/);
  assert.match(css, /\.mobile-view-hidden/);
  assert.match(css, /\.live-mark/);
  assert.match(layout, /url:\s*"\/og\.png"/);
  assert.match(layout, /canonical:\s*publicSiteUrl/);
  assert.match(layout, /referrer:\s*"no-referrer"/);
  assert.match(layout, /Cormorant_Garamond/);
  assert.match(layout, /Caveat/);
  assert.match(robots, /disallow:\s*\["\/api\/"\]/);
  assert.match(robots, /sitemap:/);
  assert.match(sitemap, /changeFrequency:\s*"monthly"/);
  assert.doesNotMatch(sitemap, /\/i\/|\/s\//);
  assert.match(recipientLayout, /index:\s*false/);
  assert.match(statusLayout, /index:\s*false/);
  assert.match(vercelConfig, /Referrer-Policy/);
  assert.match(vercelConfig, /X-Robots-Tag/);
  assert.match(packageJson, /"lucide-react"/);
  assert.doesNotMatch(page, /WHATSAPP_NUMBER|EMAIL_ADDRESS|SMS_NUMBER/);
  assert.doesNotMatch(database, /status_token\s+TEXT/i);
});
