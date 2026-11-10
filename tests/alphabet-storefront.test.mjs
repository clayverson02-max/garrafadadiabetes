import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(path.join(root, "package.json"));

// Render the real storefront without a router, advertising requests or payment requests.
export function loadStorefront(track = () => {}, marketingOverrides = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    const localRequire = (name) => {
      if (name === "@tanstack/react-router") return { createFileRoute: () => (options) => options };
      if (name.endsWith(".css")) return {};
      if (name.endsWith("/marketing")) return { trackMarketing: track, ...marketingOverrides };
      if (!name.startsWith(".")) return require(name);
      const base = path.resolve(path.dirname(file), name);
      const resolved = [base, base + ".tsx", base + ".ts"].find((item) => fs.existsSync(item));
      assert.ok(resolved, "Missing local import: " + name);
      return load(resolved);
    };
    new Function("require", "module", "exports", source)(localRequire, module, module.exports);
    return module.exports;
  }
  return load(path.join(root, "src/routes/index.tsx")).Route.component;
}

const Page = loadStorefront();
const html = renderToStaticMarkup(React.createElement(Page));

test("server-rendered product offer precedes details and retains a working payment link", () => {
  assert.ok(html.indexOf('id="offer"') < html.indexOf('id="what-you-get"'));
  assert.match(html, /CAD\s*14\.90/);
  assert.match(html, /Canadian dollars/);
  assert.match(html, /href="https:\/\/pay\.hotmart\.com\/W108399942O\?checkoutMode=10"/);
  assert.doesNotMatch(html, /<iframe/);
  assert.doesNotMatch(html, /<s>|countdown|last chance/i);
});

test("gallery has four selectable photos and a video without loading a payment frame", () => {
  assert.match(html, /aria-label="Choose a product preview"/);
  assert.equal((html.match(/aria-controls="product-preview"/g) || []).length, 5);
  assert.match(html, /aria-label="Watch a preview"/);
  assert.match(html, /fetchPriority="high"/i);
  assert.match(html, /Digital files\. No shipping\./);
});

test("every rendered product asset exists and all three demonstration videos remain available", () => {
  const assets = [...html.matchAll(/(?:src|poster)="(\/alphabet\/[^"?]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(assets.length > 10);
  for (const asset of assets) assert.ok(fs.existsSync(path.join(root, "public", asset)), asset);
  for (const id of ["writing-demo", "alphabet-pages-preview", "letter-formation-preview"])
    assert.ok(html.includes(`/alphabet/${id}.mp4`));
});

test("advertising choices render only in the footer without an open banner", () => {
  const footer = html.indexOf("<footer");
  const preferences = html.indexOf('class="ab-footer-privacy"');
  assert.ok(preferences > footer && footer > html.indexOf('id="offer"'));
  assert.doesNotMatch(html, /ab-measurement-notice|class="ab-privacy"/);
  assert.match(html.slice(preferences), /<details>/);
  assert.doesNotMatch(html.slice(preferences), /<details open/);
  assert.match(html.slice(preferences), /Turn off measurement/);
  assert.match(html.slice(preferences), /Allow measurement/);
});
