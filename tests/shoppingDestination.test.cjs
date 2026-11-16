const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const module = { exports: {} }; vm.runInNewContext(source.outputText, { module, exports: module.exports, AbortController,
    require: dependencies }); return module.exports;
}
const settle = async () => { for (let i = 0; i < 25; i++) await Promise.resolve(); };
const text = tree => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join('') : text(tree?.props?.children ?? '');
function nodes(tree, filter) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, filter));
  return [...(filter(tree) ? [tree] : []), ...nodes(tree.props?.children, filter)];
}
function harness({ writable = true } = {}) {
  const slots = []; let cursor = 0, effects = [], visible = true; const changes = [];
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ?? (slots[i] = { current: initial }); },
    useEffect(fn, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, index) => value !== previous.deps[index])) {
      slots[i] = { deps }; effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
    } },
  };
  const jsx = (type, props) => ({ type, props });
  const Picker = load('src/features/shoppingList/components/ShoppingDestinationPicker.tsx', name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return Object.fromEntries(['View', 'Text', 'ScrollView', 'TouchableOpacity', 'ActivityIndicator'].map(name => [name, name]));
    if (name.endsWith('/hooks')) return { useAppSelector: fn => fn({ familyCloud: { selectedHouseholdId: 'B' } }) };
    if (name.endsWith('/colors')) return { COLORS: {} };
    if (name.endsWith('HouseholdSelector')) return { __esModule: true, default: 'HouseholdSelector' };
    if (name.endsWith('familyCloudApi')) return { getMyHouseholdsApi: async () => ['A', 'B'].map(id => ({ household: { _id: id, status: 'ACTIVE' } })) };
    if (name.endsWith('shoppingApi')) return { getShoppingListsApi: async () => [
      { _id: 'personal', ownerType: 'USER', listName: 'Private list', status: 'ACTIVE' },
      { _id: 'familyA', ownerType: 'HOUSEHOLD', householdId: 'A', listName: 'Family A', status: 'ACTIVE' },
      { _id: 'familyB', ownerType: 'HOUSEHOLD', householdId: 'B', listName: 'Family B', status: 'ACTIVE' },
    ] };
    if (name.endsWith('paymentApi')) return { getHouseholdSubscriptionApi: async householdId => ({ householdId,
      hasFamilyAccess: writable, hasPaidAccess: writable, readOnly: !writable, canManageSubscription: false,
      memberPermission: { canViewShoppingList: true, canEditShoppingList: true } }) };
    throw Error(name);
  }).default;
  return { render() { cursor = 0; const tree = Picker({ visible, disabled: false, onChange: (destination, ready) => changes.push({ destination, ready }) });
    const pending = effects; effects = []; pending.forEach(fn => fn()); return tree; },
    changes, hide() { visible = false; }, show() { visible = true; } };
}
const button = (tree, label) => nodes(tree, node => node.type === 'TouchableOpacity' && text(node) === label)[0];

test('Planner defaults to Personal independently of the preferred Household and allows an explicit Personal list', async () => {
  const h = harness(); h.render(); await settle(); let tree = h.render(); await settle();
  assert.equal(h.changes.at(-1).destination, undefined); assert.equal(h.changes.at(-1).ready, true);
  assert.equal(button(tree, 'Family B'), undefined);
  button(tree, 'Private list').props.onPress(); h.render(); await settle();
  assert.equal(h.changes.at(-1).destination.ownerType, 'USER'); assert.equal(h.changes.at(-1).destination.listId, 'personal');
});

test('Family destination requires explicit context and list, then backend entitlement confirmation', async () => {
  for (const writable of [true, false]) {
    const h = harness({ writable }); h.render(); await settle(); let tree = h.render(); await settle();
    button(tree, 'Gia đình').props.onPress(); tree = h.render();
    assert.equal(h.changes.at(-1).ready, false); assert.equal(button(tree, 'Private list'), undefined);
    assert.equal(button(tree, 'Family A'), undefined); button(tree, 'Family B').props.onPress();
    h.render(); await settle();
    const result = h.changes.at(-1); assert.equal(result.destination.ownerType, 'HOUSEHOLD');
    assert.equal(result.destination.householdId, 'B'); assert.equal(result.destination.listId, 'familyB'); assert.equal(result.ready, writable);
  }
});

test('Planner destination API keeps the legacy payload and forwards an explicit destination without inventory context', async () => {
  const calls = []; const api = load('src/features/planner/services/plannerApi.ts', () => ({ apiClient: {
    async post(...args) { calls.push(args); return { data: { data: {} } }; },
  } }));
  const items = [{ ingredientName: 'Rice', quantity: 1, unit: 'kg' }];
  await api.addMissingIngredientsToShoppingListApi(items);
  assert.equal(JSON.stringify(calls[0][1]), JSON.stringify({ items }));
  const destination = { ownerType: 'HOUSEHOLD', householdId: 'B', listId: 'familyB' };
  await api.addMissingIngredientsToShoppingListApi(items, destination);
  assert.equal(calls[1][0], '/api/shopping-lists/missing-ingredients'); assert.equal(calls[1][1].destination, destination);
});
