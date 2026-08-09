import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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

test("keeps the phase-one product contract in source", async () => {
  const [page, css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /type TemplateId = "playful" \| "sincere"/);
  assert.match(page, /Open recipient view/);
  assert.match(page, /I’d love to/);
  assert.match(page, /Adjust it/);
  assert.match(page, /Not this time/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(layout, /url:\s*"\/og\.png"/);
  assert.match(packageJson, /"lucide-react"/);
  assert.doesNotMatch(page, /WHATSAPP_NUMBER|EMAIL_ADDRESS|SMS_NUMBER/);
});
