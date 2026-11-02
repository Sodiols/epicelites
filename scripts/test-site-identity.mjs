import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/site-identity.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { getSiteOrigin, SITE_NAME, DEFAULT_SITE_ORIGIN } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("canonical origin and brand identity", async (t) => {
  const previous = { mode: process.env.NODE_ENV, origin: process.env.NEXT_PUBLIC_SITE_URL };
  try {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "https://epicelites.vercel.app/";
    await t.test("official name and production fallback", () => {
      assert.equal(SITE_NAME, "EPIC ELITES");
      delete process.env.NEXT_PUBLIC_SITE_URL;
      assert.equal(getSiteOrigin(), DEFAULT_SITE_ORIGIN);
      process.env.NEXT_PUBLIC_SITE_URL = "https://epicelites.vercel.app/";
    });
    await t.test("editable canonical domain is normalized consistently", () => {
      assert.equal(getSiteOrigin(" https://www.example.com/news?q=1#section "), "https://www.example.com");
      assert.equal(getSiteOrigin("https://example.com/"), "https://example.com");
    });
    await t.test("invalid or unsafe settings fall back to the configured public origin", () => {
      for (const value of ["", "invalid", "javascript:alert(1)", "https://user:pass@example.com", "http://example.com", "https://localhost", "https://127.0.0.1", "https://[::1]"]) {
        assert.equal(getSiteOrigin(value), DEFAULT_SITE_ORIGIN, value);
      }
    });
    await t.test("production never falls back to localhost or a request/preview host", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
      assert.equal(getSiteOrigin(), DEFAULT_SITE_ORIGIN);
      process.env.NEXT_PUBLIC_SITE_URL = "not a URL";
      assert.equal(getSiteOrigin(), DEFAULT_SITE_ORIGIN);
    });
    await t.test("explicit local development URLs remain supported", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000/";
      assert.equal(getSiteOrigin(), "http://localhost:3000");
    });
  } finally {
    if (previous.mode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.mode;
    if (previous.origin === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous.origin;
  }
});
