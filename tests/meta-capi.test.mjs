import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Compile the pure request handler for isolated tests. All outbound calls are mocked.
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "alphabet-meta-test-"));
after(() => fs.rm(tmp, { recursive: true, force: true }));
const root = path.resolve(import.meta.dirname, "..");
const source = await fs.readFile(path.join(root, "src/lib/meta-capi-handler.server.ts"), "utf8");
const offer = await fs.readFile(path.join(root, "src/lib/offer.ts"), "utf8");
await fs.writeFile(
  path.join(tmp, "offer.mjs"),
  ts.transpileModule(offer, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText,
);
const policySource = await fs.readFile(path.join(root, "src/lib/advertising-policy.ts"), "utf8");
await fs.writeFile(
  path.join(tmp, "advertising-policy.mjs"),
  ts.transpileModule(policySource, { compilerOptions: { module: ts.ModuleKind.ESNext } })
    .outputText,
);
const { advertisingPolicy } = await import(
  pathToFileURL(path.join(tmp, "advertising-policy.mjs")).href
);
const zodUrl = import.meta.resolve("zod");
const compiled = ts
  .transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  .outputText.replace('from "zod"', `from "${zodUrl}"`)
  .replace('from "./offer"', 'from "./offer.mjs"')
  .replace('from "./advertising-policy"', 'from "./advertising-policy.mjs"');
await fs.writeFile(path.join(tmp, "handler.mjs"), compiled);
const { handleMetaRequest } = await import(pathToFileURL(path.join(tmp, "handler.mjs")).href);

const browserSource = await fs.readFile(path.join(root, "src/lib/marketing.ts"), "utf8");
await fs.writeFile(
  path.join(tmp, "marketing.mjs"),
  ts
    .transpileModule(browserSource, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    .outputText.replace('from "./offer"', 'from "./offer.mjs"'),
);
const { createEventId, hasMarketingPermission, startNoticeMeasurement, setMarketingConsent } =
  await import(pathToFileURL(path.join(tmp, "marketing.mjs")).href);
const event = {
  event_name: "ViewContent",
  event_id: "a3d8166f-6630-4e52-88f6-a45396008870",
  event_source_url: "https://example.test/?private=not-forwarded",
  consent: true,
  fbp: "fb.1.1794170000000.1234567",
};
const request = (body = event, headers = {}) =>
  new Request("https://example.test/api/meta", {
    method: "POST",
    headers: {
      Origin: "https://example.test",
      "Content-Type": "application/json",
      Cookie: "alphabet_marketing=allow",
      "User-Agent": "test-browser",
      ...headers,
    },
    body: JSON.stringify(body),
  });
const config = { token: "dummy-test-token", pixelId: "1670040038036599", version: "v25.0" };

test("forwards the shared event ID and server-controlled price without putting the token in the URL/body", async () => {
  let called = 0;
  const response = await handleMetaRequest(request(), {
    ...config,
    fetcher: async (url, init) => {
      called++;
      assert.equal(url, "https://graph.facebook.com/v25.0/1670040038036599/events");
      assert.equal(init.headers.Authorization, "Bearer dummy-test-token");
      assert.ok(!url.includes(config.token));
      assert.ok(!init.body.includes(config.token));
      const sent = JSON.parse(init.body).data[0];
      assert.equal(sent.event_id, event.event_id);
      assert.equal(sent.event_name, "ViewContent");
      assert.equal(sent.event_source_url, "https://example.test/");
      assert.equal(sent.custom_data.currency, "CAD");
      assert.equal(sent.custom_data.value, 14.9);
      assert.ok(!("external_id" in sent.user_data));
      return Response.json({ events_received: 1 });
    },
  });
  assert.equal(response.status, 200);
  assert.equal(called, 1);
  assert.ok(!(await response.text()).includes(config.token));
});
test("does not accept Purchase from a browser", async () => {
  const response = await handleMetaRequest(request({ ...event, event_name: "Purchase" }), {
    ...config,
    fetcher: () => assert.fail("unexpected outbound request"),
  });
  assert.equal(response.status, 400);
});
test("rejects cross-origin requests and requests without consent", async () => {
  assert.equal(
    (await handleMetaRequest(request(event, { Origin: "https://other.test" }), config)).status,
    403,
  );
  assert.equal(
    (await handleMetaRequest(request(event, { Cookie: "alphabet_marketing=deny" }), config)).status,
    403,
  );
  assert.equal(
    (await handleMetaRequest(request({ ...event, consent: false }), config)).status,
    400,
  );
});
test("fails closed when the token is missing or targets another pixel", async () => {
  assert.equal((await handleMetaRequest(request(), { ...config, token: "" })).status, 503);
  assert.equal((await handleMetaRequest(request(), { ...config, pixelId: "other" })).status, 503);
});
test("rejects oversized bodies and strips upstream diagnostics", async () => {
  assert.equal(
    (await handleMetaRequest(request({ ...event, padding: "x".repeat(9000) }), config)).status,
    400,
  );
  const r = await handleMetaRequest(request(), {
    ...config,
    fetcher: async () => Response.json({ error: config.token }, { status: 400 }),
  });
  assert.equal(r.status, 502);
  assert.ok(!(await r.text()).includes(config.token));
});

test("uses a valid unique event ID when randomUUID is unavailable", () => {
  const source = { getRandomValues: crypto.getRandomValues.bind(crypto) };
  const first = createEventId(source);
  const second = createEventId(source);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(first, second);
});

const withGeo = (req, country, regionCode) => {
  Object.defineProperty(req, "cf", { value: { country, regionCode } });
  return req;
};
test("uses trusted regional policy and defaults to prior consent when geography is missing", () => {
  assert.equal(advertisingPolicy(request()).mode, "consent");
  assert.equal(advertisingPolicy(request(event, { "cf-ipcountry": "AU" })).mode, "consent");
  for (const country of ["GB", "DE", "FR"])
    assert.equal(advertisingPolicy(withGeo(request(), country)).mode, "consent");
  assert.equal(advertisingPolicy(withGeo(request(), "CA", "QC")).mode, "consent");
  assert.equal(advertisingPolicy(withGeo(request(), "CA")).mode, "consent");
  assert.equal(advertisingPolicy(withGeo(request(), "CA", "ON")).mode, "notice");
  assert.equal(advertisingPolicy(withGeo(request(), "AU")).mode, "notice");
});
test("notice measurement requires both runtime policy and a recorded notice, and respects opt-out", async () => {
  const payload = { ...event, consent: undefined, privacy_mode: "notice" };
  const opts = { ...config, fetcher: async () => Response.json({ events_received: 1 }) };
  assert.equal(
    (await handleMetaRequest(request(payload, { Cookie: "alphabet_marketing=notice" }), opts))
      .status,
    403,
  );
  assert.equal(
    (
      await handleMetaRequest(
        withGeo(request(payload, { Cookie: "alphabet_marketing=notice" }), "GB"),
        opts,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handleMetaRequest(
        withGeo(request(payload, { Cookie: "alphabet_marketing=notice" }), "AU"),
        opts,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await handleMetaRequest(
        withGeo(request(payload, { Cookie: "alphabet_marketing=deny" }), "AU"),
        opts,
      )
    ).status,
    403,
  );
  assert.equal((await handleMetaRequest(request(event, { "Sec-GPC": "1" }), opts)).status, 403);
  assert.equal((await handleMetaRequest(request(event, { DNT: "1" }), opts)).status, 403);
});
test("sends only validated video milestones as a custom event without attributing a purchase", async () => {
  const payload = {
    ...event,
    event_name: "VideoProgress",
    video: { video_id: "writing-demo", percent: 75 },
  };
  const response = await handleMetaRequest(request(payload), {
    ...config,
    fetcher: async (url, init) => {
      const sent = JSON.parse(init.body).data[0];
      assert.equal(sent.event_name, "VideoProgress");
      assert.equal(sent.custom_data.video_id, "writing-demo");
      assert.equal(sent.custom_data.percent, 75);
      assert.ok(!("value" in sent.custom_data));
      return Response.json({ events_received: 1 });
    },
  });
  assert.equal(response.status, 200);
  assert.equal(
    (
      await handleMetaRequest(
        request({ ...payload, video: { video_id: "unapproved-video", percent: 75 } }),
        config,
      )
    ).status,
    400,
  );
  assert.equal(
    (await handleMetaRequest(request({ ...payload, video: undefined }), config)).status,
    400,
  );
  assert.equal(
    (
      await handleMetaRequest(
        request({ ...payload, video: { video_id: "writing-demo", percent: 9 } }),
        config,
      )
    ).status,
    400,
  );
});

test("browser honours explicit opt-out, privacy signals and region changes", () => {
  const previous = Object.fromEntries(
    ["window", "document", "navigator"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const browser = { alphabetAdvertisingPolicy: { mode: "notice" } };
  const doc = { cookie: "alphabet_marketing=deny" };
  const nav = { globalPrivacyControl: false, doNotTrack: "0" };
  try {
    for (const [name, value] of Object.entries({ window: browser, document: doc, navigator: nav }))
      Object.defineProperty(globalThis, name, { value, configurable: true });
    assert.equal(hasMarketingPermission(), false);
    doc.cookie = "alphabet_marketing=allow";
    assert.equal(hasMarketingPermission(), true);
    nav.globalPrivacyControl = true;
    assert.equal(hasMarketingPermission(), false);
    nav.globalPrivacyControl = false;
    nav.doNotTrack = "1";
    assert.equal(hasMarketingPermission(), false);
    nav.doNotTrack = "0";
    doc.cookie = "alphabet_marketing=notice";
    assert.equal(hasMarketingPermission(), true);
    browser.alphabetAdvertisingPolicy.mode = "consent";
    assert.equal(hasMarketingPermission(), false);
  } finally {
    for (const [name, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
});

test("notice regions automatically send one deduplicated pair of page events without accepting a panel", () => {
  const keys = ["window", "document", "navigator", "location", "fetch"];
  const previous = Object.fromEntries(
    keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  try {
    for (const scenario of [
      { mode: "notice", cookie: "", sends: true },
      { mode: "notice", cookie: "alphabet_marketing=notice", sends: true },
      { mode: "consent", cookie: "", sends: false },
      { mode: "consent", cookie: "alphabet_marketing=notice", sends: false },
      { mode: "notice", cookie: "alphabet_marketing=deny", sends: false },
      { mode: "notice", cookie: "", gpc: true, sends: false },
      { mode: "notice", cookie: "", dnt: "1", sends: false },
    ]) {
      const calls = [];
      const scripts = [];
      const browser = { alphabetAdvertisingPolicy: { mode: scenario.mode } };
      const values = {
        window: browser,
        document: {
          cookie: scenario.cookie,
          createElement: () => ({}),
          head: { appendChild: (script) => scripts.push(script) },
        },
        navigator: { globalPrivacyControl: scenario.gpc ?? false, doNotTrack: scenario.dnt ?? "0" },
        location: { origin: "https://example.test", pathname: "/", protocol: "https:" },
        fetch: async (_url, init) => {
          calls.push(JSON.parse(init.body));
          return Response.json({ ok: true });
        },
      };
      for (const [key, value] of Object.entries(values))
        Object.defineProperty(globalThis, key, { value, configurable: true });
      startNoticeMeasurement();
      startNoticeMeasurement();
      assert.equal(calls.length, scenario.sends ? 2 : 0);
      assert.equal(scripts.length, scenario.sends ? 1 : 0);
      if (scenario.sends) {
        assert.deepEqual(
          calls.map((call) => call.event_name),
          ["PageView", "ViewContent"],
        );
        assert.ok(
          calls.every((call) => call.privacy_mode === "notice" && call.consent === undefined),
        );
        assert.equal(new Set(calls.map((call) => call.event_id)).size, 2);
        const pixelEvents = browser.fbq.queue.filter((call) => call[0] === "track");
        assert.deepEqual(
          pixelEvents.map((call) => call[3].eventID),
          calls.map((call) => call.event_id),
        );
        setMarketingConsent(false);
        startNoticeMeasurement();
        assert.equal(calls.length, 2, "opting out must stop further events");
      }
    }
  } finally {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
