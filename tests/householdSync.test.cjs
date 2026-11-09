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
const membership = (id = 'A', permission = {}) => ({ household: { _id: id }, permission: { canViewShoppingList: true, canEditShoppingList: true, ...permission } });
const list = (id, ownerType, householdId, foodName = id) => ({ _id: id, ownerType, householdId, status: 'ACTIVE', listName: id, items: [{ _id: `${id}-item`, foodName, quantity: 1, unit: 'kg', isPurchased: false }] });

function shoppingHarness() {
  const h = hooks(), alerts = [], writes = []; let memberships = [membership()], data = [list('shared-A', 'HOUSEHOLD', 'A')];
  let refresh, controller; let reads = 0; let responseOverride; let writeFailure;
  const controls = { pause() { controller?.abort(); }, resume() { void controls.refresh(); }, async refresh() {
    controller?.abort(); controller = new AbortController(); return refresh(controller.signal);
  } };
  const jsx = (type, props) => ({ type, props });
  const native = Object.fromEntries(['View', 'Text', 'ScrollView', 'TouchableOpacity', 'TextInput', 'ActivityIndicator'].map(name => [name, name]));
  native.Platform = { OS: 'web' }; native.StyleSheet = { create: styles => styles }; native.Alert = { alert: (...args) => alerts.push(args) };
  const api = { getShoppingListsApi: async () => { reads++; return responseOverride ? responseOverride() : structuredClone(data); },
    createShoppingListApi: async payload => { writes.push(['create', payload]); return list('created', payload.ownerType, payload.householdId); },
    updateShoppingListItemApi: async (...args) => { writes.push(['update', ...args]); if (writeFailure) throw writeFailure; },
    addShoppingListItemApi: async (...args) => { writes.push(['add', ...args]); }, deleteShoppingListItemApi: async (...args) => { writes.push(['delete', ...args]); },
    completeShoppingListApi: async (...args) => { writes.push(['complete', ...args]); } };
  const Component = load('src/features/shoppingList/screens/ShoppingScreen.tsx', name => {
    if (name === 'react') return h.react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return native;
    if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ bottom: 0 }) };
    if (name.endsWith('useHouseholdSync')) return { useHouseholdSync: options => { refresh = options.refresh; return controls; } };
    if (name.endsWith('familyCloudApi')) return { getMyHouseholdsApi: async () => structuredClone(memberships) };
    if (name.endsWith('shoppingApi')) return api;
    if (name.endsWith('/colors')) return { COLORS: { primary: 'green', error: 'red' } };
    if (name.endsWith('.styles')) return { shoppingScreenStyles: {} };
    return { __esModule: true, default: name };
  }, { window: { alert: (...args) => alerts.push(args), confirm: () => true } }).default;
  return { render: () => h.render(() => Component()), refresh: () => controls.refresh(), blur: () => controller?.abort(), alerts, writes,
    memberships: value => { memberships = value; }, data: value => { data = value; }, readOverride: value => { responseOverride = value; }, failWrite: value => { writeFailure = value; }, reads: () => reads };
}

test('shopping sync displays cross-client changes while keeping personal and other-household data separate', async () => {
  const h = shoppingHarness(); h.data([list('personal', 'USER'), list('other', 'HOUSEHOLD', 'B'), list('shared', 'HOUSEHOLD', 'A', 'Rice')]);
  h.render(); await h.refresh(); let tree = h.render(); assert.deepEqual(rows(tree).map(row => row.props.item.foodName), ['Rice']);
  h.data([list('shared', 'HOUSEHOLD', 'A', 'Changed on another client')]); await h.refresh(); tree = h.render();
  assert.equal(rows(tree)[0].props.item.foodName, 'Changed on another client');
  h.data([list('personal', 'USER'), list('other', 'HOUSEHOLD', 'B')]); await h.refresh(); assert.equal(rows(h.render()).length, 0);
  h.memberships([]); await h.refresh(); assert.deepEqual(rows(h.render()).map(row => row.props.item.foodName), ['personal']);
});

test('revoked shopping view permission clears cached data without making a resource request', async () => {
  const h = shoppingHarness(); h.render(); await h.refresh(); const oldRow = rows(h.render())[0]; const before = h.reads();
  h.memberships([membership('A', { canViewShoppingList: false })]); await h.refresh();
  assert.equal(h.reads(), before); assert.equal(rows(h.render()).length, 0);
  await oldRow.props.onToggle(); assert.equal(h.writes.length, 0);
  h.memberships([membership()]); await h.refresh(); assert.equal(rows(h.render()).length, 1);
});

test('shopping form survives refresh but cannot submit into a different household', async () => {
  const h = shoppingHarness(); h.render(); await h.refresh(); rows(h.render())[0].props.onEdit();
  let tree = h.render(); const input = nodes(tree, node => node.type === 'TextInput' && node.props.placeholder === 'VD: Cà chua bi')[0]; input.props.onChangeText('Unsaved draft');
  h.data([list('shared-A', 'HOUSEHOLD', 'A', 'Remote name')]); await h.refresh(); tree = h.render();
  assert.equal(nodes(tree, node => node.type === 'TextInput')[0].props.value, 'Unsaved draft');
  h.memberships([membership('B')]); h.data([list('shared-B', 'HOUSEHOLD', 'B')]); await h.refresh(); tree = h.render();
  const save = button(tree, 'Lưu thay đổi'); assert.equal(save.props.disabled, true); await save.props.onPress(); assert.equal(h.writes.length, 0);
  assert.equal(nodes(tree, node => node.type === 'TextInput')[0].props.value, 'Unsaved draft');
});

test('a cancelled shopping response cannot restore the previous household data', async () => {
  const h = shoppingHarness(); h.render(); const pending = deferred(); h.readOverride(() => pending.promise);
  const old = h.refresh(); await settle(); h.blur(); h.memberships([membership('B')]); h.data([list('new', 'HOUSEHOLD', 'B')]); h.readOverride(null);
  await h.refresh(); pending.resolve([list('old', 'HOUSEHOLD', 'A')]); await old;
  assert.deepEqual(rows(h.render()).map(row => row.props.item.foodName), ['new']);
});

test('shopping conflict reloads data and preserves the draft without retrying the write', async () => {
  const h = shoppingHarness(); h.render(); await h.refresh(); rows(h.render())[0].props.onEdit(); let tree = h.render();
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
  const shopping = shoppingHarness(); shopping.render(); await shopping.refresh();
  shopping.memberships([membership('A', { canEditShoppingList: false })]); await shopping.refresh();
  const row = rows(shopping.render())[0]; assert.ok(row); await row.props.onToggle(); assert.equal(shopping.writes.length, 0);
});

test('shopping cannot create a fallback list while the new household read is still pending', async () => {
  const h = shoppingHarness(); h.render(); await h.refresh(); const pending = deferred();
  h.memberships([membership('B')]); h.readOverride(() => pending.promise); const loading = h.refresh(); await settle();
  const tree = h.render(); const add = button(tree, 'Thêm nguyên liệu'); assert.equal(add.props.disabled, true);
  add.props.onPress(); assert.equal(h.writes.length, 0);
  pending.resolve([list('shared-B', 'HOUSEHOLD', 'B')]); await loading; assert.equal(rows(h.render())[0].props.item.foodName, 'shared-B');
});
