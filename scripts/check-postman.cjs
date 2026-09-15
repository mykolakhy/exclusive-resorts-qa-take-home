// Exercises collection transport and assertions against a loopback stub only.
const assert = require('node:assert/strict');
const http = require('node:http');
const newman = require('newman');
const collection = require('../postman/collection.json');
const environment = require('../postman/environment.json');

async function main() {
  let requests = [];
  let mode = 'correct';
  const server = http.createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const record = { method: req.method, url: req.url, raw, headers: req.headers };
    requests.push(record);
    let status = 200;
    let body = { data: { id: 'local-test-lead' } };
    if (req.method === 'GET') { status = 405; body = { error: 'method' }; }
    else {
      try {
        const wrapper = JSON.parse(raw);
        const fields = Object.fromEntries(new URLSearchParams(wrapper.values));
        record.wrapper = wrapper;
        record.fields = fields;
        if (!fields.Email || fields.Email === 'invalid-email' || fields.Phone === '123' || fields.termsAgreement !== 'true') {
          status = 422;
          body = { error: 'validation' };
        }
      } catch { status = 400; body = { error: 'body' }; }
    }
    if (mode === 'accept-invalid') { status = 200; body = { data: { id: 'incorrectly-created' } }; }
    if (mode === 'empty-id' && status === 200) body = { data: { id: '' } };
    if (mode === 'error-with-id' && status >= 400) body = { data: { id: 'incorrectly-created' } };
    if (mode === 'server-error') { status = 500; body = { error: 'server' }; }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const run = async (overrides = {}, selected = collection.item) => {
    requests = [];
    const env = structuredClone(environment);
    const values = { baseUrl: origin, isolatedTargetOrigin: origin, contractCaptured: 'true', expectedValidationStatuses: '422', expectedMethodStatuses: '405', ...overrides };
    for (const [key, value] of Object.entries(values)) {
      const entry = env.values.find((v) => v.key === key);
      if (entry) entry.value = value;
      else env.values.push({ key, value, enabled: true });
    }
    return new Promise((resolve, reject) => newman.run({
      collection: { ...structuredClone(collection), item: structuredClone(selected) },
      environment: env, reporters: [], timeoutRequest: 2000, ignoreRedirects: true
    }, (error, summary) => error ? reject(error) : resolve(summary)));
  };
  try {
    let result = await run({ contractCaptured: 'false' });
    assert.equal(requests.length, 0); assert.equal(result.run.failures.length, 0);
    console.log('PASS: disabled collection sends zero requests');
    result = await run({ isolatedTargetOrigin: 'http://localhost:1' });
    assert.equal(requests.length, 0); assert.ok(result.run.failures.length > 0);
    console.log('PASS: unapproved target fails before transport');
    const negatives = collection.item.filter((i) => i.name.startsWith('Negative'));
    result = await run({ expectedValidationStatuses: '', expectedMethodStatuses: '' }, negatives);
    assert.equal(requests.length, 0); assert.ok(result.run.failures.length > 0);
    console.log('PASS: missing negative expectations fail before transport');
    result = await run({ expectedValidationStatuses: '200', expectedMethodStatuses: '200' }, negatives);
    assert.equal(requests.length, 0); assert.ok(result.run.failures.length > 0);
    console.log('PASS: success status cannot be configured as rejection');
    result = await run({ baselinePayload: '{{unknownPayload}}' }, [collection.item[0]]);
    assert.equal(requests.length, 0); assert.ok(result.run.failures.length > 0);
    console.log('PASS: unresolved payload fails before transport');
    result = await run();
    assert.deepEqual(result.run.failures.map((f) => f.error.message), []);
    assert.equal(requests.length, collection.item.length);
    assert.equal(result.run.stats.assertions.total, collection.item.length * 2);
    for (const request of requests) {
      assert.equal(request.url, '/submit-form/');
      assert.ok(!request.raw.includes('{{'));
      if (request.method === 'POST') {
        assert.equal(request.headers['content-type'], 'application/x-www-form-urlencoded');
        assert.equal(request.wrapper.form, 'SHORT_FORM');
        assert.equal(request.fields.FirstName, 'QA Candidate');
        assert.equal(request.fields.LastName, 'Example');
      }
    }
    assert.equal(requests[0].fields.Email, 'qa.automation@example.invalid');
    assert.equal(requests[0].fields.Phone, '+1 202 555 0100');
    assert.equal(requests[1].fields.Email, undefined);
    assert.equal(requests[2].fields.Email, 'invalid-email');
    assert.equal(requests[3].fields.Phone, '123');
    assert.equal(requests[4].fields.termsAgreement, 'false');
    assert.equal(requests[5].fields.ZIP, '00-001');
    assert.equal(requests[6].method, 'GET');
    console.log(`PASS: ${requests.length} requests and ${result.run.stats.assertions.total} assertions against local stub; encoded fields verified`);
    for (const mutation of ['accept-invalid', 'empty-id', 'error-with-id', 'server-error']) {
      mode = mutation;
      result = await run();
      for (const execution of result.run.executions) {
        const negative = execution.item.name.startsWith('Negative');
        const shouldFail = mode === 'server-error' || (mode === 'empty-id' ? !negative : negative);
        const assertionFailed = execution.assertions.some((a) => a.error);
        assert.equal(assertionFailed, shouldFail, `${mode}: ${execution.item.name}`);
      }
      assert.equal(result.run.stats.requests.total, collection.item.length);
      console.log(`PASS: assertions reject ${mode}`);
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
