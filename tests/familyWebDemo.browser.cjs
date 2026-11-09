const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Real Expo Web + browser, isolated profile, synthetic API responses only.
// No checkout or payment endpoint on the real backend is called by this test.
async function main() {
  const trialPurchase = process.argv.includes('--trial');
  const executable = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
  assert.ok(executable, 'A local Edge or Chrome installation is required');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'freshfriends-web-browser-'));
  const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1280,1100', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    const activePort = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(activePort); i++) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(fs.existsSync(activePort), 'Browser debugging port unavailable');
    const [port, endpoint] = fs.readFileSync(activePort, 'utf8').trim().split(/\r?\n/);
    socket = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let sequence = 0, paid = false, checkoutCalls = 0, forbiddenRequests = 0;
    const pending = new Map(), exceptions = [];
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    const householdId = 'synthetic-demo-household';
    const limits = { maxMembers: 6, maxFoodItems: 1000, maxStorageLocations: 10, familyCloudEnabled: true, multiStorageEnabled: true };
    const plans = [{ _id: 'month', scope: 'HOUSEHOLD', planCode: 'FAMILY_MONTHLY', planName: 'Family Monthly', price: 49000, currency: 'VND', billingPeriodMonths: 1,
      isActive: true, limits, features: ['Kho gia đình dùng chung', 'Danh sách mua sắm gia đình'] },
    { _id: 'year', scope: 'HOUSEHOLD', planCode: 'FAMILY_YEARLY', planName: 'Family Yearly', price: 499000, currency: 'VND', billingPeriodMonths: 12,
      isActive: true, limits, features: ['Kho gia đình dùng chung', 'Danh sách mua sắm gia đình'] }];
    const payment = status => ({ householdId, orderCode: 123, transactionCode: 'SYNTHETIC-DEMO', status, amount: 49000, currency: 'VND',
      planCode: 'FAMILY_MONTHLY', checkoutUrl: 'https://checkout.test.invalid/demo', awaitingProvider: false, subscriptionId: status === 'SUCCESS' ? 'synthetic-paid' : null });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request?.reject(Error(message.error.message)); else request?.resolve(message.result); return; }
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
      if (message.method !== 'Fetch.requestPaused') return;
      void (async () => {
        const { requestId, request } = message.params; const url = new URL(request.url);
        if (url.hostname.includes('payos.vn')) { forbiddenRequests++; await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }, message.sessionId); return; }
        if (request.method === 'OPTIONS') {
          await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: [
            { name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,OPTIONS' },
            { name: 'Access-Control-Allow-Headers', value: '*' },
          ] }, message.sessionId); return;
        }
        let body;
        if (url.pathname === '/api/subscriptions/current') body = { appUserId: 'synthetic-owner', planCode: 'FREE', isPremium: false };
        else if (url.pathname === '/api/payments/history') body = { success: true, data: [] };
        else if (url.pathname === '/api/subscriptions/plans') body = url.searchParams.get('scope') === 'HOUSEHOLD' ? plans : [];
        else if (url.pathname === '/api/households/me') body = { success: true, data: [{ role: 'OWNER', membershipId: 'synthetic-membership',
          household: { _id: householdId, householdName: 'Gia đình demo' }, permission: {} }] };
        else if (url.pathname === `/api/households/${householdId}/subscription`) body = { success: true, data: {
          householdId, ownerId: 'synthetic-owner', source: 'HOUSEHOLD', hasPaidAccess: paid, readOnly: !paid, canManageSubscription: true,
          limits, subscription: { id: paid ? 'synthetic-paid' : 'synthetic-subscription', planCode: 'FAMILY_MONTHLY', status: paid ? 'ACTIVE' : 'EXPIRED', startDate: '2026-12-01', endDate: paid ? '2027-01-01' : '2020-01-01' },
          ...(paid && trialPurchase ? { isTrial: true, subscription: { id: 'synthetic-trial', planCode: 'FAMILY_MONTHLY', grantType: 'TRIAL', status: 'ACTIVE', startDate: '2026-11-09', endDate: '2026-12-09' },
            scheduledSubscription: { id: 'synthetic-paid', planCode: 'FAMILY_MONTHLY', grantType: 'PAID', status: 'ACTIVE', startDate: '2026-12-09', endDate: '2027-01-09' } } : {}) } };
        else if (url.pathname === '/api/payments/payos/checkout') { checkoutCalls++; assert.equal(JSON.parse(request.postData).householdId, householdId); body = { success: true, data: payment('PENDING') }; }
        else if (/^\/api\/payments\/\d+\/status$/.test(url.pathname)) body = { success: true, data: payment(url.pathname.includes('/321/') ? 'CANCELLED' : paid ? 'SUCCESS' : 'PENDING') };
        else throw Error(`Unexpected synthetic endpoint: ${url.pathname}`);
        await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(JSON.stringify(body)).toString('base64') }, message.sessionId);
      })().catch(error => { exceptions.push(error.message); });
    });
    const target = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    await send('Page.enable', {}, sessionId); await send('Runtime.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1100, deviceScaleFactor: 1, mobile: false }, sessionId);
    await send('Fetch.enable', { patterns: [{ urlPattern: '*://localhost:4000/api/*' }, { urlPattern: '*://127.0.0.1:4000/api/*' }, { urlPattern: '*://*.payos.vn/*' }] }, sessionId);
    await send('Page.navigate', { url: 'http://localhost:8081/payment/cancel?orderCode=321' }, sessionId);
    const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)).result.value;
    const waitFor = async expression => {
      for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 150)); }
      throw Error('Browser condition timed out: ' + await evaluate('document.body.innerText.slice(0, 1000)') + '; ' + exceptions.join('; '));
    };
    await waitFor('document.body.innerText.includes("499.000") && document.body.innerText.includes("Gia hạn qua payOS")');
    const output = path.resolve(__dirname, '../demo-artifacts'); fs.mkdirSync(output, { recursive: true });
    const before = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(output, 'family-web-expired-owner.png'), Buffer.from(before.data, 'base64'));
    assert.equal(await evaluate('document.body.innerText.includes("Cần bản development build")'), false);
    const clicked = await evaluate(`(() => { const node = [...document.querySelectorAll('[role="button"]')].find(node => node.textContent.trim() === 'Gia hạn qua payOS'); if (!node || node.getAttribute('aria-disabled') === 'true') return false; node.click(); return true; })()`);
    assert.equal(clicked, true); await waitFor('document.body.innerText.includes("Đang chờ thanh toán")'); assert.equal(checkoutCalls, 1);
    paid = true;
    await evaluate(`(() => { const node = [...document.querySelectorAll('[role="button"]')].find(node => node.textContent.includes('Kiểm tra trạng thái thanh toán')); node.click(); })()`);
    await waitFor('document.body.innerText.includes("Thanh toán thành công") && document.body.innerText.includes("Thời hạn Family")');
    assert.equal(await evaluate('document.body.innerText.includes("Backend đã xác nhận")'), false);
    if (trialPurchase) {
      assert.equal(await evaluate('document.body.innerText.includes("Đang dùng thử Family miễn phí") && document.body.innerText.includes("9/12/2026") && document.body.innerText.includes("9/1/2027")'), true);
    }
    assert.equal(await evaluate(`!![...document.querySelectorAll('[role="button"]')].find(node => node.textContent.trim() === 'Gia hạn qua payOS')`), false);
    assert.equal(forbiddenRequests, 0); assert.equal(exceptions.length, 0, exceptions.join('; '));
    const after = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(output, trialPurchase ? 'family-web-trial-paid-mock.png' : 'family-web-verified-mock.png'), Buffer.from(after.data, 'base64'));
    const documentBeforeReload = await evaluate('performance.timeOrigin');
    await evaluate(`document.querySelector('[aria-label="Làm mới trang"]').click()`);
    await waitFor(`performance.timeOrigin !== ${documentBeforeReload} && document.body.innerText.includes('Family Plan')`);
    assert.equal(exceptions.length, 0, exceptions.join('; '));
    console.log(JSON.stringify({ result: 'PASS', browser: 'real headless browser', api: 'synthetic intercepted responses', checkoutCalls,
      realPayOSRequests: forbiddenRequests, screenshots: output }, null, 2));
    await send('Browser.close');
  } finally { socket?.close(); if (browser.exitCode === null) browser.kill(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
