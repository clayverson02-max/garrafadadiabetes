import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Compile the pure request handler for isolated tests. All outbound calls are mocked.
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'alphabet-meta-test-'));
after(() => fs.rm(tmp, { recursive: true, force: true }));
const root = path.resolve(import.meta.dirname, '..');
const source = await fs.readFile(path.join(root, 'src/lib/meta-capi-handler.server.ts'), 'utf8');
const offer = await fs.readFile(path.join(root, 'src/lib/offer.ts'), 'utf8');
await fs.writeFile(path.join(tmp, 'offer.mjs'), ts.transpileModule(offer, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText);
const zodUrl = import.meta.resolve('zod');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('from "zod"', `from "${zodUrl}"`).replace('from "./offer"', 'from "./offer.mjs"');
await fs.writeFile(path.join(tmp, 'handler.mjs'), compiled);
const { handleMetaRequest } = await import(pathToFileURL(path.join(tmp, 'handler.mjs')).href);

const browserSource = await fs.readFile(path.join(root, 'src/lib/marketing.ts'), 'utf8');
await fs.writeFile(path.join(tmp, 'marketing.mjs'), ts.transpileModule(browserSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('from "./offer"', 'from "./offer.mjs"'));
const { createEventId } = await import(pathToFileURL(path.join(tmp, 'marketing.mjs')).href);
const event = { event_name: 'ViewContent', event_id: 'a3d8166f-6630-4e52-88f6-a45396008870', event_source_url: 'https://example.test/?private=not-forwarded', consent: true, fbp: 'fb.1.1794170000000.1234567' };
const request = (body = event, headers = {}) => new Request('https://example.test/api/meta', { method: 'POST', headers: { Origin: 'https://example.test', 'Content-Type': 'application/json', Cookie: 'alphabet_marketing=allow', 'User-Agent': 'test-browser', ...headers }, body: JSON.stringify(body) });
const config = { token: 'dummy-test-token', pixelId: '1670040038036599', version: 'v25.0' };

test('forwards the shared event ID and server-controlled price without putting the token in the URL/body', async () => {
  let called = 0;
  const response = await handleMetaRequest(request(), { ...config, fetcher: async (url, init) => {
    called++;
    assert.equal(url, 'https://graph.facebook.com/v25.0/1670040038036599/events');
    assert.equal(init.headers.Authorization, 'Bearer dummy-test-token');
    assert.ok(!url.includes(config.token)); assert.ok(!init.body.includes(config.token));
    const sent = JSON.parse(init.body).data[0];
    assert.equal(sent.event_id, event.event_id); assert.equal(sent.event_name, 'ViewContent');
    assert.equal(sent.event_source_url, 'https://example.test/');
    assert.equal(sent.custom_data.currency, 'CAD'); assert.equal(sent.custom_data.value, 14.9);
    assert.ok(!('external_id' in sent.user_data));
    return Response.json({ events_received: 1 });
  } });
  assert.equal(response.status, 200); assert.equal(called, 1);
  assert.ok(!(await response.text()).includes(config.token));
});
test('does not accept Purchase from a browser', async () => {
  const response = await handleMetaRequest(request({ ...event, event_name: 'Purchase' }), { ...config, fetcher: () => assert.fail('unexpected outbound request') });
  assert.equal(response.status, 400);
});
test('rejects cross-origin requests and requests without consent', async () => {
  assert.equal((await handleMetaRequest(request(event, { Origin: 'https://other.test' }), config)).status, 403);
  assert.equal((await handleMetaRequest(request(event, { Cookie: 'alphabet_marketing=deny' }), config)).status, 403);
  assert.equal((await handleMetaRequest(request({ ...event, consent: false }), config)).status, 400);
});
test('fails closed when the token is missing or targets another pixel', async () => {
  assert.equal((await handleMetaRequest(request(), { ...config, token: '' })).status, 503);
  assert.equal((await handleMetaRequest(request(), { ...config, pixelId: 'other' })).status, 503);
});
test('rejects oversized bodies and strips upstream diagnostics', async () => {
  assert.equal((await handleMetaRequest(request({ ...event, padding: 'x'.repeat(9000) }), config)).status, 400);
  const r = await handleMetaRequest(request(), { ...config, fetcher: async () => Response.json({ error: config.token }, { status: 400 }) });
  assert.equal(r.status, 502); assert.ok(!(await r.text()).includes(config.token));
});

test('uses a valid unique event ID when randomUUID is unavailable', () => {
  const source = { getRandomValues: crypto.getRandomValues.bind(crypto) };
  const first = createEventId(source); const second = createEventId(source);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(first, second);
});
