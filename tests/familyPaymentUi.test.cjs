const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, requireMock = require, globals = {}) {
  const file = path.join(__dirname, '..', relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }, fileName: file,
  });
  const module = { exports: {} };
  vm.runInNewContext(compiled.outputText, { module, exports: module.exports, require: requireMock, URL, ...globals });
  return module.exports;
}
const utils = load('src/features/subscription/utils/familyPayment.ts');
const plan = { _id: 'plan', planCode: 'FAMILY_MONTHLY', planName: 'Family', scope: 'HOUSEHOLD', isActive: true,
  price: 120000, currency: 'VND', durationDays: 30, features: ['Shared inventory'], limits: { maxMembers: 6, maxFoodItems: 100, maxStorageLocations: 10 } };
const entitlement = { householdId: 'home', canManageSubscription: true, hasPaidAccess: false, source: 'NONE', subscription: null };
const pending = { orderCode: 123, householdId: 'home', transactionCode: 'PAY123', planCode: 'FAMILY_MONTHLY', subscriptionId: 'paid-sub', status: 'PENDING', amount: 49000, currency: 'VND', checkoutUrl: 'https://pay.example/123', awaitingProvider: false };

test('checkout requires web, owner, active Family plan and valid backend price', () => {
  assert.equal(utils.canCheckoutFamily('web', entitlement, plan), true);
  for (const platform of ['ios', 'android']) assert.equal(utils.canCheckoutFamily(platform, entitlement, plan), false);
  assert.equal(utils.canCheckoutFamily('web', { ...entitlement, canManageSubscription: false }, plan), false);
  for (const change of [{ scope: 'USER' }, { planCode: 'PREMIUM_MONTHLY' }, { isActive: false }, { price: 0 }, { price: 1.5 }, { currency: 'USD' }]) {
    assert.equal(utils.canCheckoutFamily('web', entitlement, { ...plan, ...change }), false);
  }
  const active = { ...entitlement, hasPaidAccess: true, source: 'HOUSEHOLD', subscription: { planCode: 'FAMILY_YEARLY' } };
  assert.equal(utils.canCheckoutFamily('web', active, plan), false);
  assert.equal(utils.canCheckoutFamily('web', active, { ...plan, planCode: 'FAMILY_YEARLY' }), true);
  assert.equal(utils.canCheckoutFamily('web', { ...active, source: 'LEGACY_OWNER' }, plan), true);
});

test('checkout links and restored orders reject unsafe or unrelated values', () => {
  for (const value of [null, 'javascript:alert(1)', 'http://pay.example', 'https://user:pass@pay.example', '/success']) assert.equal(utils.safeCheckoutUrl(value), null);
  assert.equal(utils.safeCheckoutUrl(pending.checkoutUrl), pending.checkoutUrl);
  assert.equal(utils.parsePendingOrder(JSON.stringify({ householdId: 'home', orderCode: 123 }), 'home'), 123);
  for (const value of ['bad', 'null', '{"householdId":"other","orderCode":123}', '{"householdId":"home","orderCode":-1}', '{"householdId":"home","orderCode":"123"}']) assert.equal(utils.parsePendingOrder(value, 'home'), null);
  assert.notEqual(utils.paymentMessage(pending), utils.paymentMessage({ ...pending, status: 'SUCCESS' }));
  assert.equal(new Set(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].map(status => utils.paymentMessage({ ...pending, status }))).size, 5);
});

test('API wrappers use the household scope and unwrap backend responses', async () => {
  const calls = [];
  const client = { get: async (...args) => { calls.push(args); return { data: args[0].includes('/plans') ? [plan] : { data: pending } }; },
    post: async (...args) => { calls.push(args); return { data: { data: pending } }; } };
  const api = load('src/features/subscription/services/paymentApi.ts', () => ({ apiClient: client }));
  assert.equal((await api.getFamilyPlansApi())[0], plan);
  assert.equal(await api.getHouseholdSubscriptionApi('home'), pending);
  assert.equal(await api.createPayOSCheckoutApi('home', 'FAMILY_MONTHLY'), pending);
  assert.equal(await api.getPayOSPaymentStatusApi(123), pending);
  assert.equal(JSON.stringify(calls), JSON.stringify([
    ['/api/subscriptions/plans', { params: { scope: 'HOUSEHOLD' } }], ['/api/households/home/subscription'],
    ['/api/payments/payos/checkout', { householdId: 'home', planCode: 'FAMILY_MONTHLY' }], ['/api/payments/123/status'],
  ]));
});

function panelHarness({ owner = true, platform = 'web', checkoutError = false, status = 'SUCCESS', subscription = {}, catalogue = [plan], afterPayment } = {}) {
  const slots = []; let index = 0; let focus; let createCount = 0; let verified = 0; let statusReads = 0; let entitlementReads = 0; let trialStarts = 0;
  const popup = { opener: {}, location: {}, close() { this.closed = true; } };
  const react = { useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = index++; return slots[i] ?? (slots[i] = { current: initial }); }, useCallback: fn => fn, useEffect() {} };
  const jsx = (type, props) => ({ type, props });
  const api = { getFamilyPlansApi: async () => catalogue, startFamilyTrialApi: async () => { trialStarts++; }, getHouseholdSubscriptionApi: async () => { entitlementReads++; return { ...entitlement, ...subscription, canManageSubscription: owner,
    ...(trialStarts ? { hasPaidAccess: true, isTrial: true, source: 'HOUSEHOLD', subscription: { planCode: 'FAMILY_MONTHLY', grantType: 'TRIAL', endDate: '2027-01-01' }, trialEligibility: { eligible: false } } : {}),
    ...(statusReads && status === 'SUCCESS' ? afterPayment ?? { hasPaidAccess: true, source: 'HOUSEHOLD', subscription: { id: 'paid-sub', planCode: 'FAMILY_MONTHLY', startDate: '2026-12-01', endDate: '2027-01-01' } } : {}) }; },
    createPayOSCheckoutApi: async () => { createCount++; if (checkoutError) throw Error('checkout unavailable'); return pending; },
    getPayOSPaymentStatusApi: async () => { statusReads++; return { ...pending, status }; } };
  const component = load('src/features/subscription/components/FamilyPlanPanel.tsx', id => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (id === '@react-navigation/native') return { useFocusEffect: fn => { focus = fn; }, useNavigation: () => ({ navigate() {} }) };
    if (id === 'react-native') return { Platform: { OS: platform }, Text: 'Text', View: 'View', TouchableOpacity: 'Button', ActivityIndicator: 'Spinner' };
    if (id.endsWith('familyCloudApi')) return { getMyHouseholdsApi: async () => [{ role: owner ? 'OWNER' : 'MEMBER', household: { _id: 'home', householdName: 'Our home' } }] };
    if (id.endsWith('paymentApi')) return api;
    if (id.endsWith('familyPayment')) return utils;
    if (id.endsWith('reloadPage')) return load('src/utils/reloadPage.ts', () => ({ Platform: { OS: platform } }), { window: { location: { reload() {} } } });
    if (id.endsWith('SubscriptionScreen.styles')) return { subscriptionStyles: {} };
    throw Error(`Unexpected module ${id}`);
  }, { window: { open: () => popup, sessionStorage: { getItem: () => null, setItem() {} } } }).default;
  const render = () => { index = 0; return component({ appUserId: 'user', onPaymentVerified: () => verified++ }); };
  const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  return { render, settle, start: () => focus(), popup, stats: () => ({ createCount, verified, statusReads, entitlementReads, trialStarts }) };
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
const label = tree => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(label).join('') : label(tree?.props?.children ?? '');
const button = (tree, text) => nodes(tree, node => node.type === 'Button' && label(node).includes(text))[0];

test('owner checkout opens backend URL, prevents duplicate clicks and verifies entitlement after status', async () => {
  const h = panelHarness(); h.render(); h.start(); await h.settle();
  let tree = h.render(); assert.ok(label(tree).includes(plan.features[0]));
  const pay = button(tree, 'payOS'); await Promise.all([pay.props.onPress(), pay.props.onPress()]);
  tree = h.render(); assert.equal(h.stats().createCount, 1); assert.equal(h.popup.location.href, pending.checkoutUrl);
  assert.equal(button(tree, 'payOS').props.disabled, true); assert.equal(h.stats().verified, 0);
  await button(tree, 'Kiểm tra trạng thái').props.onPress(); await h.settle(); tree = h.render();
  assert.equal(h.stats().verified, 1); assert.ok(h.stats().entitlementReads >= 2);
  assert.ok(label(tree).includes(new Date('2027-01-01').toLocaleDateString('vi-VN'))); assert.ok(button(tree, 'Gia hạn'));
});

test('member and native views cannot expose web checkout; failed checkout permits retry', async () => {
  for (const options of [{ owner: false }, { platform: 'ios' }]) {
    const h = panelHarness(options); h.render(); h.start(); await h.settle();
    assert.equal(button(h.render(), 'Thanh toán qua payOS'), undefined); assert.equal(h.stats().createCount, 0);
  }
  const h = panelHarness({ checkoutError: true }); h.render(); h.start(); await h.settle();
  await button(h.render(), 'payOS').props.onPress();
  const tree = h.render(); assert.ok(label(tree).includes('checkout unavailable'));
  assert.equal(button(tree, 'payOS').props.disabled, false); assert.equal(h.popup.closed, true);
});

test('cancelled or failed backend status never claims payment verification', async () => {
  for (const status of ['CANCELLED', 'FAILED']) {
    const h = panelHarness({ status }); h.render(); h.start(); await h.settle();
    await button(h.render(), 'payOS').props.onPress();
    button(h.render(), 'Kiểm tra trạng thái').props.onPress(); await h.settle();
    assert.equal(h.stats().verified, 0); assert.equal(button(h.render(), 'payOS').props.disabled, false);
  }
});

test('member permissions are visible, editable only for eligible members, and locked while saving', () => {
  const jsx = (type, props) => ({ type, props });
  const MemberList = load('src/features/familyCloud/components/MemberList.tsx', id => {
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (id === 'react-native') return Object.fromEntries(['View', 'Text', 'Switch', 'TouchableOpacity', 'ActivityIndicator'].map(key => [key, key]));
    if (id === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (id.endsWith('/colors')) return { COLORS: {} };
    if (id.endsWith('.styles')) return { familyCloudStyles: {} };
    if (id.endsWith('/constants')) return { ROLE_LABEL: { OWNER: 'Owner', MEMBER: 'Member' } };
    throw Error(id);
  }).default;
  const permission = { canViewInventory: true, canEditInventory: false, canViewShoppingList: true, canEditShoppingList: false, canInviteMember: false };
  const members = ['OWNER', 'MEMBER'].map(role => ({ _id: role, role, permission, userId: { fullName: role, email: `${role}@example.test` } }));
  const changes = [];
  const props = { members, loading: false, canManageMembers: true, canEditPermissions: true, saving: false,
    onUpdatePermission: (...args) => changes.push(args), onRemoveMember() {} };
  const switches = nodes(MemberList(props), node => node.type === 'Switch');
  assert.equal(switches.length, 4); assert.equal(switches[1].props.value, false);
  switches[1].props.onValueChange(true); assert.equal(changes[0][0]._id, 'MEMBER'); assert.equal(changes[0][1], 'canEditInventory');
  assert.equal(nodes(MemberList({ ...props, canEditPermissions: false }), node => node.type === 'Switch').length, 0);
  assert.equal(nodes(MemberList({ ...props, saving: true }), node => node.type === 'Switch').every(node => node.props.disabled), true);
});

test('expired owner can select and renew a Family plan on web while shared data is read-only', async () => {
  const h = panelHarness({ subscription: { source: 'HOUSEHOLD', readOnly: true, hasPaidAccess: false,
    subscription: { planCode: 'FAMILY_MONTHLY', status: 'EXPIRED', endDate: '2020-01-01' } } });
  h.render(); h.start(); await h.settle(); const tree = h.render();
  assert.equal(button(tree, 'Gia hạn qua payOS').props.disabled, false);
  await button(tree, 'Gia hạn qua payOS').props.onPress(); assert.equal(h.stats().createCount, 1);
});

test('Expo Go can display backend Family prices and explicitly start a free trial without RevenueCat or payment', async () => {
  const h = panelHarness({ platform: 'ios', subscription: { trialEligibility: { eligible: true } },
    catalogue: [{ ...plan, price: 49000, billingPeriodMonths: 1 }, { ...plan, _id: 'year', planCode: 'FAMILY_YEARLY', price: 499000, billingPeriodMonths: 12 }] });
  h.render(); h.start(); await h.settle(); let tree = h.render();
  assert.ok(label(tree).includes((49000).toLocaleString('vi-VN'))); assert.ok(label(tree).includes((499000).toLocaleString('vi-VN')));
  assert.ok(label(tree).includes('/ tháng')); assert.ok(label(tree).includes('/ năm'));
  button(tree, 'Bắt đầu dùng thử').props.onPress(); await h.settle(); tree = h.render();
  assert.equal(h.stats().trialStarts, 1); assert.equal(h.stats().createCount, 0); assert.ok(label(tree).includes('Đang dùng thử'));
});

test('a trial owner may select either calendar plan for web checkout', () => {
  const trial = { ...entitlement, hasPaidAccess: true, source: 'HOUSEHOLD', isTrial: true, subscription: { planCode: 'FAMILY_MONTHLY', grantType: 'TRIAL' } };
  assert.equal(utils.canCheckoutFamily('web', trial, plan), true);
  assert.equal(utils.canCheckoutFamily('web', trial, { ...plan, planCode: 'FAMILY_YEARLY', billingPeriodMonths: 12 }), true);
  const queued = { ...trial, scheduledSubscription: { planCode: 'FAMILY_YEARLY' } };
  assert.equal(utils.canCheckoutFamily('web', queued, plan), false);
  assert.equal(utils.canCheckoutFamily('web', queued, { ...plan, planCode: 'FAMILY_YEARLY' }), true);
});

test('confirmed purchase during trial shows the paid period and keeps trial access visible', async () => {
  const trial = { hasPaidAccess: true, isTrial: true, source: 'HOUSEHOLD',
    subscription: { id: 'trial-sub', planCode: 'FAMILY_MONTHLY', grantType: 'TRIAL', endDate: '2026-12-09' } };
  const scheduledSubscription = { id: 'paid-sub', planCode: 'FAMILY_MONTHLY', startDate: '2026-12-09', endDate: '2027-01-09' };
  const h = panelHarness({ subscription: trial, afterPayment: { ...trial, scheduledSubscription } });
  h.render(); h.start(); await h.settle();
  await button(h.render(), 'payOS').props.onPress();
  button(h.render(), 'Kiểm tra trạng thái').props.onPress(); await h.settle();
  let tree = h.render(); const text = label(tree);
  for (const expected of ['Thanh toán thành công', 'Family tháng', 'Đang dùng thử Family', 'Thời hạn Family',
    new Date('2026-12-09').toLocaleDateString('vi-VN'), new Date('2027-01-09').toLocaleDateString('vi-VN')]) assert.ok(text.includes(expected), expected);
  assert.equal(text.includes('Backend'), false);
  assert.equal(button(tree, 'payOS'), undefined);
  assert.equal(button(tree, 'Kiểm tra trạng thái'), undefined);
  assert.ok(button(tree, 'Về gia đình'));
  button(tree, 'Gia hạn thêm').props.onPress(); tree = h.render();
  assert.equal(button(tree, 'payOS').props.disabled, false);
  assert.equal(h.stats().createCount, 1, 'Opening renewal options must not create another payment');
});

test('successful payment with stale entitlement does not invent activation dates', async () => {
  const h = panelHarness({ afterPayment: { hasPaidAccess: false, subscription: null } });
  h.render(); h.start(); await h.settle();
  await button(h.render(), 'payOS').props.onPress();
  button(h.render(), 'Kiểm tra trạng thái').props.onPress(); await h.settle();
  const text = label(h.render());
  assert.ok(text.includes('Thanh toán thành công'));
  assert.ok(text.includes('Thông tin gói đang được cập nhật'));
  assert.equal(text.includes('Thời hạn Family:'), false);
});

test('web return paths only identify an order and never infer paid status from URL flags', () => {
  assert.equal(utils.parsePayOSReturnOrder('http://localhost:8081/payment/success?orderCode=123&status=PAID'), 123);
  assert.equal(utils.parsePayOSReturnOrder('http://localhost:8081/payment/cancel?orderCode=123'), 123);
  for (const value of ['http://localhost:8081/payment/success?status=PAID', 'http://localhost:8081/payment/success?orderCode=-1', 'http://localhost:8081/other?orderCode=123']) {
    assert.equal(utils.parsePayOSReturnOrder(value), undefined);
  }
});

function screenHarness({ platform = 'web', expoGo = true, historyFails = false } = {}) {
  const slots = []; let index = 0, effect; let revenueCatImports = 0, reloads = 0, currentReads = 0;
  const react = { useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; }, useEffect(fn) { effect = fn; } };
  const jsx = (type, props) => ({ type, props });
  const component = load('src/features/subscription/screens/SubscriptionScreen.tsx', name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === '@react-navigation/native') return { useNavigation: () => ({ goBack() {} }), useRoute: () => ({ params: {} }) };
    if (name === 'react-native') return { Platform: { OS: platform }, View: 'View', Text: 'Text', TouchableOpacity: 'Button', ScrollView: 'ScrollView', ActivityIndicator: 'Spinner', Alert: { alert() {} } };
    if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView' };
    if (name === 'expo-constants') return { __esModule: true, default: { appOwnership: expoGo ? 'expo' : null } };
    if (name.endsWith('paymentApi')) return { getCurrentSubscriptionApi: async () => { currentReads++; return { appUserId: 'owner', planCode: 'FREE' }; },
      getPaymentHistoryApi: async () => { if (historyFails) throw Error('history offline'); return []; },
      getSubscriptionPlansApi: async () => [{ ...plan, _id: 'premium', planCode: 'PREMIUM_MONTHLY', planName: 'Premium Monthly' }] };
    if (name.endsWith('revenueCatService')) { revenueCatImports++; throw Error('Native SDK unavailable'); }
    if (name.endsWith('FamilyPlanPanel')) return { __esModule: true, default: 'FamilyPlanPanel' };
    if (name.endsWith('reloadPage')) return load('src/utils/reloadPage.ts', () => ({ Platform: { OS: platform } }), { window: { location: { reload() { reloads++; } } } });
    if (name.endsWith('.styles')) return { subscriptionStyles: {} };
    if (name.endsWith('/colors')) return { COLORS: {} };
    throw Error(name);
  }, { window: { location: { reload() { reloads++; } } } }).default;
  return { render() { index = 0; return component(); }, start() { effect(); }, imports: () => revenueCatImports, stats: () => ({ reloads, currentReads }) };
}

test('web Family UI is independent of Expo ownership, history failure and native RevenueCat', async () => {
  const h = screenHarness({ historyFails: true }); h.render(); h.start(); for (let i = 0; i < 20; i++) await Promise.resolve();
  const tree = h.render(); assert.equal(h.imports(), 0); assert.equal(nodes(tree, node => node.type === 'FamilyPlanPanel').length, 1);
  assert.equal(label(tree).includes('Cần bản development build'), false);
});

test('Expo Go shows backend plan cards without importing native billing', async () => {
  const h = screenHarness({ platform: 'ios' }); h.render(); h.start(); for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.ok(label(h.render()).includes('Premium Monthly')); assert.equal(h.imports(), 0);
});

test('header refresh reloads the browser on web and refetches data on native', async () => {
  for (const platform of ['web', 'ios']) {
    const h = screenHarness({ platform });
    let tree = h.render();
    const refresh = value => nodes(value, node => node.type === 'Button' && node.props.accessibilityLabel === 'Làm mới trang')[0];
    assert.equal(refresh(tree).props.disabled, true);
    h.start(); for (let i = 0; i < 20; i++) await Promise.resolve();
    tree = h.render(); assert.equal(refresh(tree).props.disabled, false);
    refresh(tree).props.onPress(); for (let i = 0; i < 20; i++) await Promise.resolve();
    assert.equal(h.stats().reloads, platform === 'web' ? 1 : 0);
    assert.equal(h.stats().currentReads, platform === 'web' ? 1 : 2);
  }
});
