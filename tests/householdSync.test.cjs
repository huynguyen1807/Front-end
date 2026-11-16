const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, requireMock = require, globals = {}) {
  const file = path.join(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(source.outputText, { module, exports: module.exports, require: requireMock, AbortController, URL, setTimeout, clearTimeout, ...globals });
  return module.exports;
}
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function virtualClock() {
  let now = 0, sequence = 0; const jobs = new Map();
  return { setTimeout(fn, delay) { const id = ++sequence; jobs.set(id, { fn, at: now + delay }); return id; }, clearTimeout(id) { jobs.delete(id); },
    async tick(ms) { const end = now + ms; while (true) { const next = [...jobs].sort((a, b) => a[1].at - b[1].at)[0]; if (!next || next[1].at > end) break; now = next[1].at; jobs.delete(next[0]); next[1].fn(); await settle(); } now = end; },
    nextDelay() { return Math.min(...[...jobs.values()].map(job => job.at - now)); }, get size() { return jobs.size; } };
}
function hooks() {
  const slots = []; let cursor = 0; let effects = [];
  const memo = (factory, deps) => { const index = cursor++; const old = slots[index]; if (!old || deps.some((dep, i) => dep !== old.deps[i])) slots[index] = { value: factory(), deps }; return slots[index].value; };
  const react = { useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return slots[index] ?? (slots[index] = { current: initial }); }, useMemo: memo, useCallback: (fn, deps) => memo(() => fn, deps),
    useEffect(fn, deps) { const index = cursor++; const old = slots[index]; if (!old || deps.some((dep, i) => dep !== old.deps[i])) { slots[index] = { deps }; effects.push(() => { old?.cleanup?.(); slots[index].cleanup = fn(); }); } } };
  return { react, render(fn) { cursor = 0; const output = fn(); const pending = effects; effects = []; pending.forEach(fn => fn()); return output; },
    cleanup() { slots.forEach(slot => slot?.cleanup?.()); } };
}
const syncModule = load('src/hooks/useHouseholdSync.ts', () => ({}));

test('scheduler waits 20 seconds after completion, deduplicates triggers and never overlaps reads', async () => {
  const clock = virtualClock(); const pending = deferred(); let calls = 0;
  const sync = syncModule.createHouseholdSync(async () => { calls++; if (calls === 1) await pending.promise; }, clock);
  sync.setPolling(true); sync.start(); await settle();
  const first = sync.refresh(); assert.equal(sync.refresh(), first);
  await clock.tick(100000); assert.equal(calls, 1); assert.equal(clock.size, 0);
  pending.resolve(); await first; assert.equal(clock.nextDelay(), 20000);
  await clock.tick(19999); assert.equal(calls, 1); await clock.tick(1); assert.equal(calls, 2); sync.stop();
});

test('network backoff is bounded at 120 seconds and success resets the interval', async () => {
  const clock = virtualClock(); let fails = true;
  const sync = syncModule.createHouseholdSync(async () => !fails, clock);
  sync.setPolling(true); sync.start(); await settle();
  assert.equal(clock.nextDelay(), 40000); await clock.tick(40000); assert.equal(clock.nextDelay(), 80000);
  await clock.tick(80000); assert.equal(clock.nextDelay(), 120000); await clock.tick(120000); assert.equal(clock.nextDelay(), 120000);
  fails = false; await clock.tick(120000); assert.equal(clock.nextDelay(), 20000); sync.stop();
});

test('personal mode does not poll; pause and stop abort reads; resume refreshes once', async () => {
  const clock = virtualClock(); const signals = [];
  const sync = syncModule.createHouseholdSync(async signal => { signals.push(signal); }, clock);
  sync.start(); await settle(); await clock.tick(100000); assert.equal(signals.length, 1);
  sync.setPolling(true); assert.equal(clock.nextDelay(), 20000);
  const pending = deferred(); const active = syncModule.createHouseholdSync(async signal => { signals.push(signal); await pending.promise; }, clock);
  active.start(); await settle(); const signal = signals.at(-1); active.pause(); assert.equal(signal.aborted, true);
  await active.refresh(); assert.equal(signals.length, 2); active.resume(); await settle(); assert.equal(signals.length, 3);
  active.stop(); assert.equal(signals.at(-1).aborted, true); pending.resolve(); await settle(); sync.stop(); assert.equal(clock.size, 0);
});

test('native background, web hidden tab and navigation blur suspend polling; foreground refreshes', async () => {
  for (const platform of ['web', 'ios']) {
    const h = hooks(), clock = virtualClock(); const appListeners = new Set(), documentListeners = new Map(), windowListeners = new Map();
    const native = { Platform: { OS: platform }, AppState: { currentState: 'active', addEventListener(_event, fn) { appListeners.add(fn); return { remove: () => appListeners.delete(fn) }; } } };
    const document = { visibilityState: 'visible', addEventListener: (name, fn) => documentListeners.set(name, fn), removeEventListener: name => documentListeners.delete(name) };
    const window = { addEventListener: (name, fn) => windowListeners.set(name, fn), removeEventListener: name => windowListeners.delete(name) };
    let focus, cleanupFocus; let calls = 0;
    const module = load('src/hooks/useHouseholdSync.ts', name => name === 'react' ? h.react : name === 'react-native' ? native : { useFocusEffect: fn => { focus = fn; } },
      { document, window, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
    h.render(() => module.useHouseholdSync({ scopeKey: 'home', polling: true, refresh: async () => { calls++; } }));
    cleanupFocus = focus(); await settle(); assert.equal(calls, 1);
    native.AppState.currentState = 'background'; appListeners.forEach(fn => fn('background'));
    await clock.tick(60000); assert.equal(calls, 1);
    native.AppState.currentState = 'active'; appListeners.forEach(fn => fn('active')); await settle(); assert.equal(calls, 2);
    if (platform === 'web') {
      document.visibilityState = 'hidden'; documentListeners.get('visibilitychange')(); await clock.tick(60000); assert.equal(calls, 2);
      document.visibilityState = 'visible'; documentListeners.get('visibilitychange')(); windowListeners.get('focus')(); await settle(); assert.equal(calls, 3);
    }
    const before = calls; cleanupFocus(); await clock.tick(60000); assert.equal(calls, before);
    h.cleanup(); assert.equal(clock.size, 0); assert.equal(appListeners.size, 0); assert.equal(windowListeners.size, 0);
  }
});

function inventoryModule(api = {}) {
  const toolkit = {
    createAsyncThunk(prefix, payloadCreator) { const fn = arg => ({ payloadCreator, arg, prefix }); fn.payloadCreator = payloadCreator; for (const suffix of ['pending', 'fulfilled', 'rejected']) fn[suffix] = { type: `${prefix}/${suffix}` }; return fn; },
    createSlice({ name, initialState, reducers, extraReducers }) {
      const cases = {}; const builder = { addCase(action, reducer) { cases[action.type] = reducer; return builder; } }; extraReducers(builder);
      const actions = {}; for (const [key, reducer] of Object.entries(reducers)) { const type = `${name}/${key}`; actions[key] = payload => ({ type, payload }); cases[type] = reducer; }
      return { actions, reducer(state = structuredClone(initialState), action) { const next = structuredClone(state); cases[action.type]?.(next, action); return next; } };
    },
  };
  return load('src/features/inventory/redux/inventorySlice.ts', name => name === '@reduxjs/toolkit' ? toolkit : api);
}
const event = (thunk, kind, id, payload, meta = {}) => ({ type: thunk[kind].type, payload, meta: { requestId: id, ...meta }, error: { message: 'network error' } });

test('inventory rejects superseded requests and responses from the previous household/filter', () => {
  const m = inventoryModule(); let state = m.default(undefined, { type: 'init' });
  const act = action => { state = m.default(state, action); };
  act(event(m.fetchFoods, 'pending', 'old')); act(event(m.fetchFoods, 'pending', 'new'));
  act(event(m.fetchFoods, 'fulfilled', 'old', [{ _id: 'stale' }])); assert.equal(state.items.length, 0);
  act(event(m.fetchFoods, 'fulfilled', 'new', [{ _id: 'fresh' }])); assert.equal(state.items[0]._id, 'fresh');
  act(event(m.fetchSummary, 'pending', 'summary')); act(m.setInventoryContext({ ownerType: 'HOUSEHOLD', householdId: 'B' }));
  act(event(m.fetchSummary, 'fulfilled', 'summary', { total: 99 })); assert.equal(state.summary.total, 0);
  act(event(m.fetchFoods, 'pending', 'filter')); act(m.setActiveFilter('EXPIRED'));
  act(event(m.fetchFoods, 'fulfilled', 'filter', [{ _id: 'wrong-filter' }])); assert.equal(state.items.length, 0);
});

test('revoked inventory read access clears items and totals and prevents the sibling response restoring them', () => {
  const m = inventoryModule(); let state = m.default(undefined, { type: 'init' }); const act = action => { state = m.default(state, action); };
  act(m.addFoodItem({ _id: 'shared', status: 'SAFE' })); act(event(m.fetchFoods, 'pending', 'foods')); act(event(m.fetchSummary, 'pending', 'totals'));
  act(event(m.fetchFoods, 'rejected', 'foods', { status: 403, message: 'Denied' }));
  act(event(m.fetchSummary, 'fulfilled', 'totals', { total: 100 }));
  assert.equal(state.items.length, 0); assert.equal(state.summary.total, 0); assert.equal(state.error, 'Denied');
  act(event(m.fetchFoods, 'pending', 'late')); act(m.invalidateInventoryAccess('Membership removed'));
  act(event(m.fetchFoods, 'fulfilled', 'late', [{ _id: 'leaked' }])); assert.equal(state.items.length, 0);
});

test('a pre-write read and a mutation from an old context cannot overwrite the current inventory', () => {
  const m = inventoryModule(); let state = m.default(undefined, { type: 'init' }); const act = action => { state = m.default(state, action); };
  act(event(m.fetchFoods, 'pending', 'read')); act(event(m.deleteFood, 'pending', 'write'));
  act(event(m.fetchFoods, 'fulfilled', 'read', [{ _id: 'stale' }])); assert.equal(state.items.length, 0);
  act(m.setInventoryContext({ ownerType: 'HOUSEHOLD', householdId: 'new-home' }));
  act(m.addFoodItem({ _id: 'same-id', status: 'SAFE' })); act(event(m.deleteFood, 'fulfilled', 'write', 'same-id'));
  assert.equal(state.items.length, 1); assert.equal(state.summary.total, 1);
});

test('API reads forward timeout, cancellation and explicit personal/household scope', async () => {
  const calls = []; const signal = new AbortController().signal;
  const api = { get: async (...args) => { calls.push(args); return { data: { data: [] } }; } };
  const dependencies = name => name.endsWith('apiClient') ? { apiClient: api } : {};
  const food = load('src/features/inventory/services/foodApi.ts', dependencies);
  const shopping = load('src/features/shoppingList/services/shoppingApi.ts', dependencies);
  const family = load('src/features/familyCloud/services/familyCloudApi.ts', dependencies);
  await food.getFoodsApi('SAFE', 'HOUSEHOLD', 'A', { signal, timeout: 10000 });
  await food.getFoodSummaryApi('USER', undefined, { signal, timeout: 10000 });
  await shopping.getShoppingListsApi('COMPLETED', { signal, timeout: 10000 });
  await family.getMyHouseholdsApi({ signal, timeout: 10000 });
  for (const call of calls) { assert.equal(call[1].signal, signal); assert.equal(call[1].timeout, 10000); }
  assert.equal(calls[0][1].params.householdId, 'A'); assert.equal(calls[1][1].params.ownerType, 'USER');
  assert.equal(calls[1][1].params.householdId, undefined); assert.equal(calls[2][1].params.status, 'COMPLETED');
});

function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(value => nodes(value, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
const label = tree => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(label).join('') : label(tree?.props?.children ?? '');
const button = (tree, text) => nodes(tree, node => node.type === 'TouchableOpacity' && label(node).includes(text))[0];
const rows = tree => nodes(tree, node => typeof node.type === 'function' && node.type.name === 'ShoppingItemRow');
const membership = (id = 'A', permission = {}) => ({ role: 'MEMBER', household: { _id: id, status: 'ACTIVE' }, permission: { canViewShoppingList: true, canEditShoppingList: true, ...permission } });
const list = (id, ownerType, householdId, foodName = id) => ({ _id: id, ownerType, householdId, status: 'ACTIVE', listName: id, items: [{ _id: `${id}-item`, foodName, quantity: 1, unit: 'kg', isPurchased: false }] });

function shoppingHarness({ platform = 'web', selectedHousehold = 'A' } = {}) {
  const h = hooks(), alerts = [], writes = []; let memberships = [membership()], data = [list('shared-A', 'HOUSEHOLD', 'A')];
  let refresh, controller, scopeKey; let reads = 0; let responseOverride; let detailOverride; let writeFailure; let writeOverride;
  const requests = [];
  const entitlementRequests = []; let entitlementOverride = {}, entitlementFailure;
  const paymentApi = { getHouseholdSubscriptionApi: async (householdId, options) => {
    entitlementRequests.push({ householdId, options });
    if (entitlementFailure) throw entitlementFailure;
    const member = memberships.find(item => item.household._id === householdId);
    const base = { householdId, hasFamilyAccess: true, hasPaidAccess: true, canReadSharedData: true, readOnly: false,
      canManageSubscription: member?.role === 'OWNER', memberPermission: member?.permission };
    return typeof entitlementOverride === 'function' ? entitlementOverride(base) : { ...base, ...entitlementOverride };
  } };
  const controls = { cancel() { controller?.abort(); }, pause() { controller?.abort(); }, resume() { void controls.refresh(); }, async refresh() {
    controller?.abort(); controller = new AbortController(); return refresh(controller.signal);
  } };
  const jsx = (type, props) => ({ type, props });
  const native = Object.fromEntries(['View', 'Text', 'ScrollView', 'TouchableOpacity', 'TextInput', 'ActivityIndicator'].map(name => [name, name]));
  native.Platform = { OS: platform }; native.StyleSheet = { create: styles => styles }; native.Alert = { alert: (...args) => alerts.push(args) };
  const api = { getShoppingListsApi: async (status, options) => { reads++; requests.push({ status, options }); return responseOverride ? responseOverride() : structuredClone(data.filter(item => item.status === status)); },
    getShoppingListByIdApi: async (id, options) => { reads++; requests.push({ status: 'DETAIL', id, options });
      if (detailOverride) return detailOverride(); const found = data.find(list => list._id === id);
      if (!found) throw { response: { status: 404 } }; return structuredClone(found); },
    createShoppingListApi: async payload => { writes.push(['create', payload]); const count = writes.filter(write => write[0] === 'create').length;
      const created = { ...list(count === 1 ? 'created' : `created-${count}`, payload.ownerType, payload.householdId), listName: payload.listName, items: [] };
      data.push(created); return structuredClone(created); },
    updateShoppingListItemApi: async (...args) => { writes.push(['update', ...args]); if (writeFailure) throw writeFailure; if (writeOverride) await writeOverride();
      const item = data.find(list => list._id === args[0])?.items.find(item => item._id === args[1]); if (item) Object.assign(item, args[2]); },
    addShoppingListItemApi: async (...args) => { writes.push(['add', ...args]); data.find(list => list._id === args[0])?.items.push({ _id: `${args[0]}-added`, ...args[1], isPurchased: false }); },
    deleteShoppingListItemApi: async (...args) => { writes.push(['delete', ...args]); const list = data.find(list => list._id === args[0]); if (list) list.items = list.items.filter(item => item._id !== args[1]); },
    completeShoppingListApi: async (...args) => { writes.push(['complete', ...args]); const list = data.find(list => list._id === args[0]); if (list) list.status = 'COMPLETED'; } };
  const Component = load('src/features/shoppingList/screens/ShoppingScreen.tsx', name => {
    if (name === 'react') return h.react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return native;
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ bottom: 0 }) };
    if (name.endsWith('useHouseholdSync')) return { useHouseholdSync: options => { if (scopeKey !== options.scopeKey) controls.cancel(); scopeKey = options.scopeKey; refresh = options.refresh; return controls; } };
    if (name.endsWith('/hooks') && name.includes('redux')) return { useAppSelector: fn => fn({ familyCloud: { selectedHouseholdId: selectedHousehold } }),
      useAppDispatch: () => action => { selectedHousehold = action.payload; } };
    if (name.endsWith('familyCloudSlice')) return { setSelectedHouseholdId: value => ({ payload: value }) };
    if (name.endsWith('familyCloudApi')) return { getMyHouseholdsApi: async () => structuredClone(memberships) };
    if (name.endsWith('shoppingApi')) return api;
    if (name.endsWith('paymentApi')) return paymentApi;
    if (name.endsWith('/colors')) return { COLORS: { primary: 'green', error: 'red' } };
    if (name.endsWith('.styles')) return { shoppingScreenStyles: {} };
    return { __esModule: true, default: name };
  }, { window: { alert: (...args) => alerts.push(args), confirm: () => true } }).default;
  return { render: () => h.render(() => Component()), refresh: () => controls.refresh(), blur: () => controller?.abort(), alerts, writes, requests,
    entitlementRequests, entitlement: value => { entitlementOverride = value; }, entitlementError: value => { entitlementFailure = value; },
    selectedHousehold: value => { selectedHousehold = value; },
    writeOverride: value => { writeOverride = value; },
    detailOverride: value => { detailOverride = value; },
    memberships: value => { memberships = value; }, data: value => { data = value; }, readOverride: value => { responseOverride = value; }, failWrite: value => { writeFailure = value; }, reads: () => reads };
}

const contextTab = (tree, family) => nodes(tree, node => node.props?.accessibilityLabel === (family ? 'Danh sách gia đình' : 'Danh sách cá nhân'))[0];
async function showFamily(h) {
  h.render(); await h.refresh();
  const tab = contextTab(h.render(), true); assert.ok(tab, 'Family membership makes the context available');
  tab.props.onPress(); h.render(); await h.refresh(); return h.render();
}
function chooseHousehold(h, id) {
  const selector = nodes(h.render(), node => typeof node.props?.onSelectHousehold === 'function')[0];
  assert.ok(selector); selector.props.onSelectHousehold(id); h.render();
}

test('shopping sync displays cross-client changes while keeping personal and other-household data separate', async () => {
  const h = shoppingHarness(); h.data([list('personal', 'USER'), list('other', 'HOUSEHOLD', 'B'), list('shared', 'HOUSEHOLD', 'A', 'Rice')]);
  let tree = await showFamily(h); assert.deepEqual(rows(tree).map(row => row.props.item.foodName), ['Rice']);
  h.data([list('shared', 'HOUSEHOLD', 'A', 'Changed on another client')]); await h.refresh(); tree = h.render();
  assert.equal(rows(tree)[0].props.item.foodName, 'Changed on another client');
  h.data([list('personal', 'USER'), list('other', 'HOUSEHOLD', 'B')]); await h.refresh(); assert.equal(rows(h.render()).length, 0);
  h.memberships([]); await h.refresh(); h.render(); await h.refresh(); assert.deepEqual(rows(h.render()).map(row => row.props.item.foodName), ['personal']);
});

test('revoked shopping view permission clears cached data without making a resource request', async () => {
  const h = shoppingHarness(); await showFamily(h); const oldRow = rows(h.render())[0]; const before = h.reads();
  h.memberships([membership('A', { canViewShoppingList: false })]); await h.refresh();
  assert.equal(h.reads(), before); assert.equal(rows(h.render()).length, 0);
  await oldRow.props.onToggle(); assert.equal(h.writes.length, 0);
  h.memberships([membership()]); await h.refresh(); assert.equal(rows(h.render()).length, 1);
});

test('shopping member needs view and edit while an Owner retains its existing permission override', async () => {
  for (const role of ['MEMBER', 'OWNER']) for (const view of [false, true]) for (const edit of [false, true]) {
    const h = shoppingHarness();
    h.memberships([{ ...membership('A', { canViewShoppingList: view, canEditShoppingList: edit }), role }]);
    const tree = await showFamily(h);
    const readable = role === 'OWNER' || view;
    assert.equal(rows(tree).length, readable ? 1 : 0);
    if (readable) {
      await rows(tree)[0].props.onToggle();
      assert.equal(h.writes.length, role === 'OWNER' || (view && edit) ? 1 : 0);
    } else assert.equal(h.reads(), 1, 'Only the initial Personal read is allowed');
  }
});

test('shopping denies an inactive Household even when membership reports Owner', async () => {
  const h = shoppingHarness(); await showFamily(h); const before = h.reads();
  const owner = { ...membership(), role: 'OWNER' }; owner.household.status = 'INACTIVE'; h.memberships([owner]);
  await h.refresh(); const tree = h.render();
  assert.equal(rows(tree).length, 0); assert.equal(h.reads(), before); assert.equal(h.writes.length, 0);
  assert.equal(contextTab(tree, false).props.accessibilityState.selected, true);
});

test('shopping form survives refresh but cannot submit into a different household', async () => {
  const h = shoppingHarness(); await showFamily(h); rows(h.render())[0].props.onEdit();
  let tree = h.render(); const input = nodes(tree, node => node.type === 'TextInput' && node.props.placeholder === 'VD: Cà chua bi')[0]; input.props.onChangeText('Unsaved draft');
  h.data([list('shared-A', 'HOUSEHOLD', 'A', 'Remote name')]); await h.refresh(); tree = h.render();
  assert.equal(nodes(tree, node => node.type === 'TextInput')[0].props.value, 'Unsaved draft');
  h.memberships([membership('A'), membership('B')]); h.data([list('shared-B', 'HOUSEHOLD', 'B')]); await h.refresh(); chooseHousehold(h, 'B'); await h.refresh(); tree = h.render();
  const save = button(tree, 'Lưu thay đổi'); assert.equal(save.props.disabled, true); await save.props.onPress(); assert.equal(h.writes.length, 0);
  assert.equal(nodes(tree, node => node.type === 'TextInput')[0].props.value, 'Unsaved draft');
});

test('a cancelled shopping response cannot restore the previous household data', async () => {
  const h = shoppingHarness(); await showFamily(h); const pending = deferred(); h.readOverride(() => pending.promise);
  const old = h.refresh(); await settle(); h.blur(); h.selectedHousehold('B'); h.render(); h.memberships([membership('B')]); h.data([list('new', 'HOUSEHOLD', 'B')]); h.readOverride(null);
  await h.refresh(); pending.resolve([list('old', 'HOUSEHOLD', 'A')]); await old;
  assert.deepEqual(rows(h.render()).map(row => row.props.item.foodName), ['new']);
});

test('shopping conflict reloads data and preserves the draft without retrying the write', async () => {
  const h = shoppingHarness(); await showFamily(h); rows(h.render())[0].props.onEdit(); let tree = h.render();
  nodes(tree, node => node.type === 'TextInput')[0].props.onChangeText('Keep draft'); tree = h.render();
  h.failWrite({ response: { status: 409, data: { message: 'Shopping list changed. Reload it and try again.' } } });
  const before = h.reads(); await button(tree, 'Lưu thay đổi').props.onPress(); await settle(); tree = h.render();
  assert.equal(h.writes.length, 1); assert.ok(h.reads() > before); assert.equal(nodes(tree, node => node.type === 'TextInput')[0].props.value, 'Keep draft');
  assert.ok(h.alerts.some(args => args.join(' ').includes('Reload')));
});

function inventoryHarness(server) {
  const h = hooks(); let state, sequence = 0, refresh, currentSignal, currentKey; const reads = [], writes = [];
  const api = {
    async getFoodsApi(filter, owner, householdId, options) { reads.push(['foods', owner, householdId, options]); return server.read ? server.read(owner, householdId) : structuredClone(server.data[`${owner}:${householdId ?? ''}`] ?? []); },
    async getFoodSummaryApi(owner, householdId, options) { reads.push(['summary', owner, householdId, options]); return { total: (server.data[`${owner}:${householdId ?? ''}`] ?? []).length, safe: 1, nearExpiry: 0, expired: 0 }; },
    async deleteFoodApi(id, owner, householdId) { writes.push([id, owner, householdId]); const key = `${owner}:${householdId ?? ''}`; server.data[key] = server.data[key].filter(item => item._id !== id); },
  };
  const slice = inventoryModule(api); state = slice.default(undefined, { type: 'init' });
  const dispatch = action => {
    if (!action?.payloadCreator) { state = slice.default(state, action); return action; }
    const id = `request-${++sequence}`, abort = new AbortController(), result = deferred(); let done = false;
    const emit = (kind, payload, meta = {}) => { state = slice.default(state, { type: `${action.prefix}/${kind}`, payload, meta: { requestId: id, ...meta }, error: { message: 'Failed' } }); };
    emit('pending');
    Promise.resolve().then(() => action.payloadCreator(action.arg, { getState: () => ({ inventory: state }), signal: abort.signal, rejectWithValue: failure => ({ rejected: failure }) })).then(payload => {
      if (done) return; done = true;
      if (payload?.rejected) { emit('rejected', payload.rejected); result.reject(payload.rejected); }
      else { emit('fulfilled', payload); result.resolve(payload); }
    }, error => { if (!done) { done = true; emit('rejected', undefined); result.reject(error); } });
    return { unwrap: () => result.promise, abort() { if (!done) { done = true; abort.abort(); emit('rejected', undefined, { aborted: true }); result.reject({ name: 'AbortError' }); } } };
  };
  const controls = { pause() { currentSignal?.abort(); }, resume() { void controls.refresh(); }, async refresh() {
    currentSignal?.abort(); currentSignal = new AbortController(); return refresh(currentSignal.signal);
  } };
  const jsx = (type, props) => ({ type, props });
  const native = Object.fromEntries(['View', 'Text', 'ScrollView', 'TouchableOpacity', 'ActivityIndicator', 'RefreshControl'].map(name => [name, name]));
  Object.assign(native, { Platform: { OS: 'web' }, StyleSheet: { create: styles => styles }, Alert: { alert() {} }, useWindowDimensions: () => ({ width: 1000, fontScale: 1 }) });
  const Component = load('src/features/inventory/screens/InventoryScreen.tsx', name => {
    if (name === 'react') return h.react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return native;
    if (name === '@react-navigation/native') return { useNavigation: () => ({ navigate() {} }) };
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name.endsWith('/hooks') && name.includes('redux')) return { useAppDispatch: () => dispatch, useAppSelector: fn => fn({ inventory: state }) };
    if (name.endsWith('inventorySlice')) return slice;
    if (name.endsWith('familyCloudApi')) return { getMyHouseholdsApi: async () => structuredClone(server.memberships) };
    if (name.endsWith('useHouseholdSync')) return { useHouseholdSync(options) { if (currentKey !== options.scopeKey) currentSignal?.abort(); currentKey = options.scopeKey; refresh = options.refresh; return controls; } };
    if (name.endsWith('/colors')) return { COLORS: { alpha: () => 'white' } };
    return { __esModule: true, default: name };
  }, { window: { alert() {}, confirm: () => true } }).default;
  return { render: () => h.render(() => Component()), refresh: () => controls.refresh(), state: () => state, reads, writes,
    context(value) { dispatch(slice.setInventoryContext(value)); } };
}
const inventoryServer = () => ({ memberships: [{ household: { _id: 'A' }, permission: { canViewInventory: true, canEditInventory: true } }],
  data: { 'HOUSEHOLD:A': [{ _id: 'shared', foodName: 'Rice', status: 'SAFE', quantity: 1 }], 'USER:': [{ _id: 'personal', foodName: 'Personal food', status: 'SAFE', quantity: 1 }] } });

test('two inventory consumers observe shared changes and retain separate personal inventory', async () => {
  const server = inventoryServer(), first = inventoryHarness(server), second = inventoryHarness(server);
  for (const client of [first, second]) { client.context({ ownerType: 'HOUSEHOLD', householdId: 'A' }); client.render(); await client.refresh(); }
  assert.equal(first.state().items[0]._id, 'shared'); assert.equal(second.state().items[0]._id, 'shared');
  const card = nodes(first.render(), node => node.props?.item?._id === 'shared')[0]; card.props.onDelete(); await settle();
  assert.equal(first.writes.length, 1); assert.equal(server.data['USER:'].length, 1); assert.equal(second.state().items.length, 1);
  await second.refresh(); assert.equal(second.state().items.length, 0); assert.equal(second.state().summary.total, 0);
  second.context({ ownerType: 'USER' }); second.render(); await second.refresh(); assert.equal(second.state().items[0]._id, 'personal');
  assert.equal(second.reads.at(-2)[1], 'USER'); assert.equal(second.reads.at(-2)[2], undefined);
});

test('inventory membership revocation clears cached data and avoids further food/summary reads', async () => {
  const server = inventoryServer(), h = inventoryHarness(server); h.context({ ownerType: 'HOUSEHOLD', householdId: 'A' }); h.render(); await h.refresh();
  const before = h.reads.length; server.memberships[0].permission.canViewInventory = false;
  await h.refresh(); assert.equal(h.reads.length, before); assert.equal(h.state().items.length, 0); assert.equal(h.state().summary.total, 0);
  server.memberships = []; await h.refresh(); assert.equal(h.reads.length, before);
});

test('switching inventory to personal cancels a late shared read before it can overwrite data', async () => {
  const server = inventoryServer(), h = inventoryHarness(server), pending = deferred();
  server.read = (owner, householdId) => owner === 'HOUSEHOLD' ? pending.promise : structuredClone(server.data['USER:']);
  h.context({ ownerType: 'HOUSEHOLD', householdId: 'A' }); h.render(); const old = h.refresh(); await settle();
  h.context({ ownerType: 'USER' }); h.render(); await h.refresh(); pending.resolve([{ _id: 'stale' }]); await old; await settle();
  assert.equal(h.state().items[0]._id, 'personal');
  assert.equal(h.reads.find(read => read[1] === 'HOUSEHOLD')[3].signal.aborted, true);
});

test('revoking edit alone keeps inventory and shopping readable while preventing writes', async () => {
  const server = inventoryServer(), inventory = inventoryHarness(server);
  inventory.context({ ownerType: 'HOUSEHOLD', householdId: 'A' }); inventory.render(); await inventory.refresh();
  server.memberships[0].permission.canEditInventory = false; await inventory.refresh();
  const card = nodes(inventory.render(), node => node.props?.item?._id === 'shared')[0];
  card.props.onDelete(); await settle(); assert.equal(inventory.writes.length, 0); assert.equal(inventory.state().items.length, 1);
  const shopping = shoppingHarness(); await showFamily(shopping);
  shopping.memberships([membership('A', { canEditShoppingList: false })]); await shopping.refresh();
  const row = rows(shopping.render())[0]; assert.ok(row); await row.props.onToggle(); assert.equal(shopping.writes.length, 0);
});

test('shopping cannot create a fallback list while the new household read is still pending', async () => {
  const h = shoppingHarness(); await showFamily(h); const pending = deferred();
  h.memberships([membership('B')]); h.selectedHousehold('B'); h.render(); h.readOverride(() => pending.promise); const loading = h.refresh(); await settle();
  const tree = h.render(); const add = button(tree, 'Thêm nguyên liệu');
  assert.ok(!add || add.props.disabled); if (add) add.props.onPress(); assert.equal(h.writes.length, 0);
  pending.resolve([list('shared-B', 'HOUSEHOLD', 'B')]); await loading; assert.equal(rows(h.render())[0].props.item.foodName, 'shared-B');
});

test('Personal is the default on web/mobile despite a Household selection, and creates USER lists', async () => {
  for (const platform of ['web', 'ios', 'android']) {
    const h = shoppingHarness({ platform }); h.data([]);
    h.render(); await h.refresh(); let tree = h.render();
    assert.equal(contextTab(tree, false).props.accessibilityState.selected, true);
    assert.equal(contextTab(tree, true).props.accessibilityState.selected, false);
    button(tree, 'Thêm nguyên liệu').props.onPress(); tree = h.render();
    nodes(tree, node => node.type === 'TextInput')[0].props.onChangeText('Personal rice');
    await button(h.render(), 'Thêm vào danh sách').props.onPress();
    assert.equal(h.writes[0][0], 'create'); assert.equal(h.writes[0][1].ownerType, 'USER');
    assert.equal(h.writes[0][1].householdId, undefined); assert.equal(h.writes[1][0], 'add');
  }
});

test('Personal remains visible and editable when the Household has no accessible Family lists', async () => {
  const h = shoppingHarness(); h.data([list('personal', 'USER')]);
  h.render(); await h.refresh(); let tree = h.render();
  assert.equal(rows(tree)[0].props.item.foodName, 'personal');
  await rows(tree)[0].props.onToggle(); assert.equal(h.writes[0][1], 'personal'); await settle();
  contextTab(h.render(), true).props.onPress(); h.render(); await h.refresh();
  assert.equal(rows(h.render()).length, 0);
  contextTab(h.render(), false).props.onPress(); h.render(); await h.refresh();
  assert.equal(rows(h.render())[0].props.item.foodName, 'personal');
});

test('Family is unavailable without active membership and joining does not replace Personal', async () => {
  const h = shoppingHarness(); h.memberships([]); h.data([list('mine', 'USER')]);
  h.render(); await h.refresh(); assert.equal(contextTab(h.render(), true), undefined);
  h.memberships([membership()]); await h.refresh(); const tree = h.render();
  assert.ok(contextTab(tree, true)); assert.equal(contextTab(tree, false).props.accessibilityState.selected, true);
  assert.equal(rows(tree)[0].props.item.foodName, 'mine');
});

test('context switch immediately clears rows, blocks old callbacks and keeps drafts scoped to origin', async () => {
  const h = shoppingHarness(); h.data([list('mine', 'USER'), list('family', 'HOUSEHOLD', 'A')]);
  h.render(); await h.refresh(); let tree = h.render(); const oldRow = rows(tree)[0];
  oldRow.props.onEdit(); tree = h.render();
  nodes(tree, node => node.type === 'TextInput')[0].props.onChangeText('Private draft');
  const oldSave = button(h.render(), 'Lưu thay đổi');
  contextTab(h.render(), true).props.onPress();
  await oldRow.props.onToggle(); await oldSave.props.onPress(); assert.equal(h.writes.length, 0);
  tree = h.render(); assert.equal(rows(tree).length, 0);
  await h.refresh(); tree = h.render();
  assert.equal(rows(tree)[0].props.item.foodName, 'family');
  assert.equal(nodes(tree, node => node.type === 'TextInput')[0].props.value, 'Private draft');
  assert.equal(button(tree, 'Lưu thay đổi').props.disabled, true);
  await button(tree, 'Lưu thay đổi').props.onPress(); assert.equal(h.writes.length, 0);
});

test('multiple Households require a valid selection instead of silently choosing the first', async () => {
  const h = shoppingHarness({ selectedHousehold: 'not-a-member' });
  h.memberships([membership('A'), membership('B')]);
  h.data([list('mine', 'USER'), list('familyA', 'HOUSEHOLD', 'A'), list('familyB', 'HOUSEHOLD', 'B')]);
  h.render(); await h.refresh(); contextTab(h.render(), true).props.onPress(); h.render();
  const before = h.reads(); await h.refresh(); assert.equal(h.reads(), before);
  assert.equal(rows(h.render()).length, 0);
  chooseHousehold(h, 'not-a-member'); await h.refresh(); assert.equal(rows(h.render()).length, 0);
  chooseHousehold(h, 'B'); await h.refresh(); let tree = h.render();
  assert.equal(rows(tree)[0].props.item.foodName, 'familyB');
  await rows(tree)[0].props.onToggle(); assert.equal(h.writes[0][1], 'familyB'); await settle();
  chooseHousehold(h, 'A'); await h.refresh();
  assert.equal(rows(h.render())[0].props.item.foodName, 'familyA');
});

test('Family reuses an existing valid Household selection across refreshes', async () => {
  const h = shoppingHarness({ selectedHousehold: 'B' }); h.memberships([membership('A'), membership('B')]);
  h.data([list('A', 'HOUSEHOLD', 'A'), list('B', 'HOUSEHOLD', 'B')]);
  let tree = await showFamily(h); assert.equal(rows(tree)[0].props.item.foodName, 'B');
  await h.refresh(); assert.equal(rows(h.render())[0].props.item.foodName, 'B');
});

test('creating in Family sends the selected Household and never uses USER fallback', async () => {
  const h = shoppingHarness({ selectedHousehold: 'B' }); h.memberships([membership('A'), membership('B')]); h.data([]);
  let tree = await showFamily(h); button(tree, 'Thêm nguyên liệu').props.onPress(); tree = h.render();
  nodes(tree, node => node.type === 'TextInput')[0].props.onChangeText('Family rice');
  await button(h.render(), 'Thêm vào danh sách').props.onPress();
  assert.equal(h.writes[0][1].ownerType, 'HOUSEHOLD'); assert.equal(h.writes[0][1].householdId, 'B');
  assert.equal(h.writes[1][0], 'add');
});

test('history stays in the selected context and switching retains the History tab', async () => {
  const h = shoppingHarness();
  h.data([{ ...list('Personal history', 'USER'), status: 'COMPLETED' }, { ...list('Family history', 'HOUSEHOLD', 'A'), status: 'COMPLETED' }]);
  h.render(); await h.refresh(); button(h.render(), 'Lịch sử').props.onPress(); h.render(); await h.refresh();
  let tree = h.render(); assert.ok(label(tree).includes('Personal history')); assert.equal(label(tree).includes('Family history'), false);
  contextTab(tree, true).props.onPress(); tree = h.render(); assert.equal(label(tree).includes('Personal history'), false);
  await h.refresh(); tree = h.render();
  assert.ok(label(tree).includes('Family history')); assert.equal(label(tree).includes('Personal history'), false);
  assert.equal(h.requests.at(-1).status, 'COMPLETED');
});

test('a late Personal response cannot restore data after an explicit switch to Family', async () => {
  const h = shoppingHarness(); h.data([list('mine', 'USER'), list('family', 'HOUSEHOLD', 'A')]);
  h.render(); await h.refresh(); const pending = deferred(); h.readOverride(() => pending.promise);
  const oldRead = h.refresh(); await settle(); const signal = h.requests.at(-1).options.signal;
  contextTab(h.render(), true).props.onPress(); h.render(); h.readOverride(null); await h.refresh();
  assert.equal(signal.aborted, true);
  pending.resolve([list('stale Personal', 'USER')]); await oldRead;
  assert.equal(rows(h.render())[0].props.item.foodName, 'family');
});

test('context selection is locked while a write is pending and the write retains its original target', async () => {
  const h = shoppingHarness(); h.data([list('mine', 'USER'), list('family', 'HOUSEHOLD', 'A')]);
  h.render(); await h.refresh(); const pending = deferred(); h.writeOverride(() => pending.promise);
  const writing = rows(h.render())[0].props.onToggle(); await settle(); let tree = h.render();
  assert.equal(contextTab(tree, true).props.disabled, true);
  contextTab(tree, true).props.onPress(); tree = h.render();
  assert.equal(contextTab(tree, false).props.accessibilityState.selected, true);
  assert.equal(h.writes.length, 1); assert.equal(h.writes[0][1], 'mine');
  pending.resolve(); await writing; await settle();
  assert.equal(contextTab(h.render(), false).props.accessibilityState.selected, true);
});

const namedButton = (tree, name) => nodes(tree, node => node.props?.accessibilityLabel === name)[0];
const selectShoppingList = (h, name) => { const target = namedButton(h.render(), `Chọn danh sách ${name}`); assert.ok(target); target.props.onPress(); return h.render(); };

test('selected list survives ordering changes and stale callbacks cannot mutate the previous list', async () => {
  const h = shoppingHarness(); const a = list('A', 'USER'), b = list('B', 'USER'); h.data([a, b]);
  h.render(); await h.refresh(); const oldRow = rows(h.render())[0];
  let tree = selectShoppingList(h, 'B'); assert.equal(rows(tree)[0].props.item.foodName, 'B');
  await oldRow.props.onToggle(); assert.equal(h.writes.length, 0);
  h.data([{ ...a, updatedAt: '2099-01-01' }, b]); await h.refresh(); tree = h.render();
  assert.equal(namedButton(tree, 'Chọn danh sách B').props.accessibilityState.selected, true);
  await rows(tree)[0].props.onToggle(); await settle(); assert.equal(h.writes[0][1], 'B');
});

test('draft cannot be submitted to another selected list in the same context', async () => {
  const h = shoppingHarness(); h.data([list('A', 'USER'), list('B', 'USER')]);
  h.render(); await h.refresh(); rows(h.render())[0].props.onEdit(); let tree = h.render();
  nodes(tree, node => node.type === 'TextInput')[0].props.onChangeText('Keep A draft');
  const oldSave = button(h.render(), 'Lưu thay đổi'); selectShoppingList(h, 'B');
  tree = h.render(); assert.equal(button(tree, 'Lưu thay đổi').props.disabled, true);
  await oldSave.props.onPress(); await button(tree, 'Lưu thay đổi').props.onPress();
  assert.equal(h.writes.length, 0); assert.equal(nodes(h.render(), node => node.type === 'TextInput')[0].props.value, 'Keep A draft');
});

test('explicitly creates multiple named lists and keeps the new selection through refresh', async () => {
  const h = shoppingHarness(); h.data([list('Existing', 'USER')]); h.render(); await h.refresh();
  for (const [name, id] of [['Weekend', 'created'], ['Party', 'created-2']]) {
    namedButton(h.render(), 'Tạo danh sách mới').props.onPress(); let tree = h.render();
    namedButton(tree, 'Tên danh sách mới').props.onChangeText(`  ${name}  `);
    namedButton(h.render(), 'Xác nhận tạo danh sách').props.onPress(); await settle(); tree = h.render();
    assert.equal(namedButton(tree, `Chọn danh sách ${name}`).props.accessibilityState.selected, true);
    await h.refresh(); tree = h.render();
    assert.equal(namedButton(tree, `Chọn danh sách ${name}`).props.accessibilityState.selected, true);
    assert.equal(h.writes.at(-1)[1].ownerType, 'USER'); assert.equal(h.writes.at(-1)[1].listName, name);
    button(tree, 'Thêm nguyên liệu').props.onPress(); tree = h.render();
    nodes(tree, node => node.props?.placeholder === 'VD: Cà chua bi')[0].props.onChangeText('Milk');
    await button(h.render(), 'Thêm vào danh sách').props.onPress(); await settle();
    assert.equal(h.writes.at(-1)[0], 'add'); assert.equal(h.writes.at(-1)[1], id);
  }
});

test('item edit/delete and complete consistently target the selected list, then select a valid fallback', async () => {
  const h = shoppingHarness(); h.data([list('A', 'USER'), list('B', 'USER')]); h.render(); await h.refresh();
  let tree = selectShoppingList(h, 'B'); rows(tree)[0].props.onEdit(); tree = h.render();
  nodes(tree, node => node.props?.placeholder === 'VD: Cà chua bi')[0].props.onChangeText('Edited B');
  await button(h.render(), 'Lưu thay đổi').props.onPress(); await settle();
  assert.equal(h.writes.at(-1)[1], 'B'); assert.equal(rows(h.render())[0].props.item.foodName, 'Edited B');
  const oldRow = rows(h.render())[0]; oldRow.props.onDelete(); await settle();
  assert.equal(h.writes.at(-1)[0], 'delete'); assert.equal(h.writes.at(-1)[1], 'B');
  // Complete with one remaining item using the same selected list.
  h.data([list('A', 'USER'), list('B', 'USER')]); await h.refresh();
  button(h.render(), 'Hoàn tất danh sách mua sắm').props.onPress(); await settle();
  assert.equal(h.writes.at(-1)[0], 'complete'); assert.equal(h.writes.at(-1)[1], 'B');
  tree = h.render(); assert.equal(namedButton(tree, 'Chọn danh sách A').props.accessibilityState.selected, true);
  button(tree, 'Lịch sử').props.onPress(); h.render(); await h.refresh();
  assert.ok(label(h.render()).includes('B')); assert.equal(h.requests.at(-1).status, 'COMPLETED');
});

test('Family creation and list selection remain inside the explicitly chosen Household', async () => {
  const h = shoppingHarness({ selectedHousehold: 'B' }); h.memberships([membership('A'), membership('B')]);
  h.data([list('Personal', 'USER'), list('Family A', 'HOUSEHOLD', 'A'), list('Family B', 'HOUSEHOLD', 'B')]);
  await showFamily(h); namedButton(h.render(), 'Tạo danh sách mới').props.onPress();
  namedButton(h.render(), 'Tên danh sách mới').props.onChangeText('Shared weekend');
  namedButton(h.render(), 'Xác nhận tạo danh sách').props.onPress(); await settle();
  assert.equal(h.writes[0][1].householdId, 'B'); assert.equal(h.writes[0][1].ownerType, 'HOUSEHOLD');
  assert.equal(namedButton(h.render(), 'Chọn danh sách Shared weekend').props.accessibilityState.selected, true);
  chooseHousehold(h, 'A'); let tree = h.render(); assert.equal(namedButton(tree, 'Chọn danh sách Shared weekend'), undefined);
  await h.refresh(); tree = h.render(); assert.equal(namedButton(tree, 'Chọn danh sách Family A').props.accessibilityState.selected, true);
});

test('expired Trial/Monthly/Yearly keep Family data readable while disabling every mutation control', async () => {
  for (const planCode of ['TRIAL', 'FAMILY_MONTHLY', 'FAMILY_YEARLY']) for (const role of ['OWNER', 'MEMBER']) {
    const h = shoppingHarness(); h.memberships([{ ...membership('A'), role }]);
    await showFamily(h); let tree = h.render(); const oldRow = rows(tree)[0];
    oldRow.props.onEdit(); tree = h.render();
    nodes(tree, node => node.props?.placeholder === 'VD: Cà chua bi')[0].props.onChangeText('Retain draft');
    const oldSave = button(h.render(), 'Lưu thay đổi');
    h.entitlement({ hasFamilyAccess: false, hasPaidAccess: false, readOnly: true, subscription: { planCode, status: 'EXPIRED' } });
    await h.refresh(); tree = h.render(); const row = rows(tree)[0];
    assert.ok(row); assert.equal(row.props.disabled, true); assert.ok(label(tree).includes('chế độ chỉ đọc'));
    const itemTree = row.type(row.props);
    assert.ok(nodes(itemTree, node => node.type === 'TouchableOpacity').every(node => node.props.disabled));
    assert.equal(namedButton(tree, 'Tạo danh sách mới').props.disabled, true);
    assert.equal(button(tree, 'Hoàn tất danh sách mua sắm').props.disabled, true);
    assert.equal(button(tree, 'Lưu thay đổi').props.disabled, true);
    assert.equal(nodes(tree, node => node.props?.placeholder === 'VD: Cà chua bi')[0].props.value, 'Retain draft');
    await oldRow.props.onToggle(); await oldSave.props.onPress();
    row.props.onEdit(); row.props.onDelete(); button(tree, 'Hoàn tất danh sách mua sắm').props.onPress();
    namedButton(tree, 'Tạo danh sách mới').props.onPress(); await settle();
    assert.equal(h.writes.length, 0);
  }
});

test('active trial and paid Family use backend permissions including the Owner exception', async () => {
  for (const planCode of ['TRIAL', 'FAMILY_MONTHLY', 'FAMILY_YEARLY']) for (const role of ['OWNER', 'MEMBER']) {
    const h = shoppingHarness(); h.memberships([{ ...membership('A'), role }]);
    h.entitlement({ hasFamilyAccess: true, hasPaidAccess: true, readOnly: false, subscription: { planCode, status: 'ACTIVE' } });
    const tree = await showFamily(h); assert.equal(rows(tree)[0].props.disabled, false);
    await rows(tree)[0].props.onToggle(); await settle(); assert.equal(h.writes.length, 1);
  }
  const h = shoppingHarness(); h.entitlement(base => ({ ...base, memberPermission: { canViewShoppingList: true, canEditShoppingList: false } }));
  const tree = await showFamily(h); assert.equal(rows(tree)[0].props.disabled, true);
  assert.ok(label(tree).includes('chỉ có quyền xem'));
});

test('Personal never requests Family entitlement and remains editable after Family expires', async () => {
  const h = shoppingHarness(); h.data([list('mine', 'USER'), list('family', 'HOUSEHOLD', 'A')]);
  h.entitlement({ hasFamilyAccess: false, hasPaidAccess: false, readOnly: true });
  h.render(); await h.refresh(); assert.equal(h.entitlementRequests.length, 0);
  await rows(h.render())[0].props.onToggle(); await settle(); assert.equal(h.writes[0][1], 'mine');
  contextTab(h.render(), true).props.onPress(); h.render(); await h.refresh();
  assert.equal(rows(h.render())[0].props.disabled, true);
  const before = h.entitlementRequests.length; contextTab(h.render(), false).props.onPress(); h.render(); await h.refresh();
  assert.equal(h.entitlementRequests.length, before); assert.equal(rows(h.render())[0].props.disabled, false);
  await rows(h.render())[0].props.onToggle(); assert.equal(h.writes.at(-1)[1], 'mine');
});

test('Family entitlement verification failure fails closed without losing the selected list or draft', async () => {
  const h = shoppingHarness(); await showFamily(h); rows(h.render())[0].props.onEdit();
  h.entitlementError(Error('Entitlement unavailable')); await h.refresh(); const tree = h.render();
  assert.ok(rows(tree)[0]); assert.equal(rows(tree)[0].props.disabled, true);
  assert.ok(label(tree).includes('Chưa xác minh được quyền Family'));
  assert.equal(button(tree, 'Lưu thay đổi').props.disabled, true);
  assert.equal(namedButton(tree, 'Chọn danh sách shared-A').props.accessibilityState.selected, true);
  await rows(tree)[0].props.onToggle(); assert.equal(h.writes.length, 0);
});

test('pending or late entitlement responses cannot enable writes in a different context', async () => {
  const h = shoppingHarness(); h.data([list('mine', 'USER'), list('family', 'HOUSEHOLD', 'A')]);
  await showFamily(h); const oldRow = rows(h.render())[0]; const pending = deferred(); let response;
  h.entitlement(base => { response = base; return pending.promise; }); const reading = h.refresh(); await settle();
  assert.equal(rows(h.render())[0].props.disabled, true);
  await oldRow.props.onToggle(); assert.equal(h.writes.length, 0);
  const request = h.entitlementRequests.at(-1); assert.equal(request.options.timeout, 10000);
  contextTab(h.render(), false).props.onPress(); h.render(); await h.refresh();
  assert.equal(request.options.signal.aborted, true);
  pending.resolve(response); await reading;
  assert.equal(rows(h.render())[0].props.item.foodName, 'mine'); assert.equal(rows(h.render())[0].props.disabled, false);
});

test('expired Family selection survives renewal and reordering without automatically submitting a draft', async () => {
  const h = shoppingHarness(); const a = list('A', 'HOUSEHOLD', 'A'), b = list('B', 'HOUSEHOLD', 'A'); h.data([a, b]);
  await showFamily(h); selectShoppingList(h, 'B'); rows(h.render())[0].props.onEdit();
  h.entitlement({ hasFamilyAccess: false, hasPaidAccess: false, readOnly: true }); await h.refresh();
  assert.equal(namedButton(h.render(), 'Chọn danh sách B').props.accessibilityState.selected, true);
  h.data([a, b]); h.entitlement({}); await h.refresh();
  assert.equal(namedButton(h.render(), 'Chọn danh sách B').props.accessibilityState.selected, true);
  assert.equal(button(h.render(), 'Lưu thay đổi').props.disabled, false); assert.equal(h.writes.length, 0);
});

test('unactivated Family cannot create lists but Personal remains available', async () => {
  const h = shoppingHarness(); h.entitlement({ hasFamilyAccess: false, hasPaidAccess: false, canReadSharedData: false, readOnly: false });
  const tree = await showFamily(h); assert.equal(rows(tree).length, 0);
  assert.equal(namedButton(tree, 'Tạo danh sách mới').props.disabled, true);
  assert.ok(label(tree).includes('chưa có Family Trial'));
  contextTab(tree, false).props.onPress(); h.render(); await h.refresh();
  assert.equal(namedButton(h.render(), 'Tạo danh sách mới').props.disabled, false);
});

test('Household entitlement API preserves existing calls and forwards optional abort/timeout', async () => {
  const calls = [], payload = { householdId: 'A', hasFamilyAccess: true };
  const api = load('src/features/subscription/services/paymentApi.ts', () => ({ apiClient: {
    async get(...args) { calls.push(args); return { data: { data: payload } }; },
  } }));
  assert.equal(await api.getHouseholdSubscriptionApi('A'), payload);
  const signal = new AbortController().signal;
  assert.equal(await api.getHouseholdSubscriptionApi('A', { signal, timeout: 10000 }), payload);
  assert.equal(calls[0].length, 1); assert.equal(calls[0][0], '/api/households/A/subscription');
  assert.equal(calls[1][1].signal, signal); assert.equal(calls[1][1].timeout, 10000);
});

test('manual refresh reads only the selected Personal list and preserves selection and active edits', async () => {
  const h = shoppingHarness(); h.data([list('A', 'USER'), list('B', 'USER')]); h.render(); await h.refresh();
  selectShoppingList(h, 'B'); rows(h.render())[0].props.onEdit(); let tree = h.render();
  nodes(tree, node => node.props?.placeholder === 'VD: Cà chua bi')[0].props.onChangeText('Unsaved B');
  h.data([list('A', 'USER', undefined, 'Remote A'), list('B', 'USER', undefined, 'Remote B')]);
  const before = h.reads(); namedButton(h.render(), 'Làm mới danh sách mua sắm').props.onPress(); await settle(); tree = h.render();
  assert.equal(h.reads(), before + 1); assert.equal(h.requests.at(-1).status, 'DETAIL'); assert.equal(h.requests.at(-1).id, 'B');
  assert.equal(namedButton(tree, 'Chọn danh sách B').props.accessibilityState.selected, true);
  assert.equal(rows(tree)[0].props.item.foodName, 'Remote B');
  assert.equal(nodes(tree, node => node.props?.placeholder === 'VD: Cà chua bi')[0].props.value, 'Unsaved B');
  assert.equal(h.writes.length, 0);
});

test('manual Family refresh respects entitlement and only fetches the selected Household list', async () => {
  const h = shoppingHarness(); h.data([list('Family A', 'HOUSEHOLD', 'A'), list('Family B', 'HOUSEHOLD', 'A')]);
  await showFamily(h); selectShoppingList(h, 'Family B');
  h.entitlement({ hasFamilyAccess: false, hasPaidAccess: false, readOnly: true });
  namedButton(h.render(), 'Làm mới danh sách mua sắm').props.onPress(); await settle(); const tree = h.render();
  assert.equal(h.requests.at(-1).status, 'DETAIL'); assert.equal(h.requests.at(-1).id, 'Family B');
  assert.equal(rows(tree)[0].props.disabled, true);
  assert.equal(namedButton(tree, 'Chọn danh sách Family B').props.accessibilityState.selected, true);
});

test('manual refresh deduplicates repeated clicks and is disabled while any request is pending', async () => {
  const h = shoppingHarness(); h.data([list('mine', 'USER')]); h.render(); await h.refresh(); const pending = deferred();
  h.detailOverride(() => pending.promise); const action = namedButton(h.render(), 'Làm mới danh sách mua sắm'); const before = h.reads();
  action.props.onPress(); action.props.onPress(); await settle();
  assert.equal(h.reads(), before + 1); assert.equal(namedButton(h.render(), 'Làm mới danh sách mua sắm').props.disabled, true);
  pending.resolve(list('mine', 'USER', undefined, 'Fresh data')); await settle();
  assert.equal(namedButton(h.render(), 'Làm mới danh sách mua sắm').props.disabled, false);
  assert.equal(rows(h.render())[0].props.item.foodName, 'Fresh data');
});

test('manual refresh cannot overlap a write and handles a deleted selection with a valid fallback', async () => {
  const h = shoppingHarness(); h.data([list('A', 'USER'), list('B', 'USER')]); h.render(); await h.refresh();
  const pending = deferred(); h.writeOverride(() => pending.promise); const writing = rows(h.render())[0].props.onToggle(); await settle();
  const before = h.reads(); namedButton(h.render(), 'Làm mới danh sách mua sắm').props.onPress(); assert.equal(h.reads(), before);
  pending.resolve(); await writing; await settle(); selectShoppingList(h, 'B'); h.data([list('A', 'USER')]);
  namedButton(h.render(), 'Làm mới danh sách mua sắm').props.onPress(); await settle(); const tree = h.render();
  assert.equal(namedButton(tree, 'Chọn danh sách B'), undefined);
  assert.equal(namedButton(tree, 'Chọn danh sách A').props.accessibilityState.selected, true);
});

test('manual history refresh sends only the selected context and retains the History tab', async () => {
  const h = shoppingHarness(); h.data([{ ...list('Past', 'HOUSEHOLD', 'A'), status: 'COMPLETED' }]); await showFamily(h);
  button(h.render(), 'Lịch sử').props.onPress(); h.render(); await h.refresh();
  namedButton(h.render(), 'Làm mới danh sách mua sắm').props.onPress(); await settle();
  assert.equal(h.requests.at(-1).status, 'COMPLETED'); assert.equal(h.requests.at(-1).options.context.ownerType, 'HOUSEHOLD');
  assert.equal(h.requests.at(-1).options.context.householdId, 'A'); assert.ok(label(h.render()).includes('Past'));
});

test('Shopping API forwards scoped query parameters and cancellable selected-list reads', async () => {
  const calls = [], signal = new AbortController().signal;
  const api = load('src/features/shoppingList/services/shoppingApi.ts', () => ({ apiClient: {
    async get(...args) { calls.push(args); return { data: { data: [] } }; },
  } }));
  await api.getShoppingListsApi('ACTIVE', { signal, timeout: 10000, context: { ownerType: 'HOUSEHOLD', householdId: 'A' } });
  assert.equal(calls[0][1].params.ownerType, 'HOUSEHOLD'); assert.equal(calls[0][1].params.householdId, 'A');
  assert.equal(calls[0][1].context, undefined);
  await api.getShoppingListByIdApi('selected', { signal, timeout: 10000 });
  assert.equal(calls[1][0], '/api/shopping-lists/selected'); assert.equal(calls[1][1].signal, signal);
});
