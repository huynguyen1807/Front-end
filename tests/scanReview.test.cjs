const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function loadTs(relative, overrides = {}) {
  const file = path.join(__dirname, '..', relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  const module = { exports: {} };
  vm.runInNewContext(compiled.outputText, { module, exports: module.exports, Date, Math, Set, Map, console, ...overrides }, { filename: file });
  return module.exports;
}
const utils = loadTs('src/features/scan/utils/scanReview.ts');
const food = (name, guide = null) => ({ foodRecognition: { productName: name, confidence: 0.95, visibility: 'CLEAR', foodState: 'RAW', categoryId: 'cat', estimatedQuantity: { quantity: 5, unit: 'quả' }, boundingBox: [100, 100, 500, 500], storageGuide: guide }, storageSuggestion: { storageType: 'FREEZER' }, aiPredictedDays: 3 });
const batch = (id, results) => ({ scanResultId: id, jobId: id, width: 1600, height: 1000, imageUrl: `file:///${id}.jpg`, capturedAt: new Date().toISOString(), inventoryContext: { ownerType: 'USER' }, warnings: [], results });

test('new drafts do not copy guessed AI expiry when no reliable guide is available', () => {
  const review = utils.createReview(batch('root', [food('Cà chua')]));
  assert.equal(review.items[0].expiryDate, '');
  assert.equal(review.items[0].selected, false);
  assert.equal(review.items[0].expiryBasis, 'USER');
});

test('review status explains the missing field instead of mixing edit actions with readiness', () => {
  const review = utils.createReview(batch('root', [food('Táo')])), item = review.items[0];
  assert.equal(utils.draftReadiness(item, review.purchaseDate).label, 'Chọn ngày nhắc');
  assert.equal(utils.draftReadiness({ ...item, identityConfirmed: false }, review.purchaseDate).label, 'Xác nhận tên món');
  assert.equal(utils.draftReadiness({ ...item, categoryId: '' }, review.purchaseDate).label, 'Chọn danh mục');
  assert.equal(utils.draftReadiness({ ...item, expiryDate: utils.addCalendarDays(review.purchaseDate, 3) }, review.purchaseDate).label, 'Đủ thông tin');
  assert.equal(utils.draftReadiness({ ...item, expiryDate: review.purchaseDate, quantity: '0' }, review.purchaseDate).ready, false);
  assert.equal(utils.draftReadiness({ ...item, saved: true }, review.purchaseDate).label, 'Đã lưu');
});

test('the initial result list leaves every editor closed, including incomplete foods', () => {
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  const cache = new Map();
  const box = ({ children, accessibilityRole, accessibilityLabel }) => React.createElement('div', { role: accessibilityRole, 'aria-label': accessibilityLabel }, children);
  const native = { View: box, Text: box, ScrollView: box, Pressable: box, Image: () => null, TextInput: box, ActivityIndicator: () => null, Modal: () => null, StyleSheet: { create: (styles) => styles }, Linking: { openURL: () => {} } };
  const resolve = (id) => {
    if (id === 'react' || id === 'react/jsx-runtime') return require(id);
    if (id === 'react-native') return native;
    if (id === '@expo/vector-icons') return { Ionicons: () => null };
    if (id.endsWith('/colors')) return { COLORS: { alpha: () => '#fff' } };
    if (id.endsWith('/scanReview')) return utils;
    if (id.endsWith('/scanBatchApi')) return {};
    if (id === './ScanCropEditor') return { __esModule: true, default: () => null, CropThumbnail: () => null };
    if (id === './ScanDateField') return { __esModule: true, default: ({ label }) => React.createElement('div', null, label) };
    if (id === './ScanStorageGuidance') return { __esModule: true, default: () => React.createElement('div', null, 'EDITOR_GUIDANCE') };
    if (id === './ScanReviewItem') {
      if (!cache.has(id)) cache.set(id, loadTs('src/features/scan/components/ScanReviewItem.tsx', { require: resolve }));
      return cache.get(id);
    }
    throw Error(`Unexpected rendering import ${id}`);
  };
  const Result = loadTs('src/features/scan/components/ScanResultCard.tsx', { require: resolve }).default;
  const review = utils.createReview(batch('root', [food('Táo'), food('Cá hồi', { minDays: 60, maxDays: 90 })]));
  const markup = renderToStaticMarkup(React.createElement(Result, { review, onChange: () => {}, onRescan: () => {}, onNewBatch: () => {}, onSaved: () => {}, persistedSources: new Set(), onSaveState: () => {} }));
  assert.match(markup, /Chọn ngày nhắc/);
  assert.match(markup, /Đủ thông tin/);
  assert.match(markup, /Sửa \/ xem chi tiết/);
  assert.doesNotMatch(markup, /Tên thực phẩm|EDITOR_GUIDANCE|Cần bổ sung/);
});

test('guidance lookup sends the user-confirmed product type and opening state', async () => {
  let sent;
  const api = loadTs('src/features/scan/services/scanBatchApi.ts', { require: (id) => {
    if (id === 'react-native') return { Platform: { OS: 'android' } };
    if (id.endsWith('/apiClient')) return { apiClient: { post: async (_, payload) => { sent = payload; return { data: { guide: null, profiles: [], message: 'test' } }; } } };
    throw Error(`Unexpected import ${id}`);
  } });
  const item = { ...utils.createReview(batch('root', [food('Phô mai')])).items[0], storageProfile: 'HARD_CHEESE', packaging: 'OPENED' };
  await api.fetchStorageAdvice(item);
  assert.equal(sent.storageProfile, 'HARD_CHEESE');
  assert.equal(sent.packaging, 'OPENED');
});

test('reference dates keep their purchase or handling anchor when batch dates change', () => {
  const purchase = '2026-11-01', handling = '2026-11-05';
  const guide = { minDays: 7, maxDays: 7, dateAnchor: 'PURCHASE' };
  assert.equal(utils.guidanceDate(guide, purchase, handling), '2026-11-08');
  assert.equal(utils.guidanceDate({ ...guide, dateAnchor: 'HANDLING' }, purchase, handling), '2026-11-12');
  const review = utils.createReview(batch('root', [food('Sữa tươi')]));
  review.purchaseDate = purchase;
  review.items[0] = { ...review.items[0], guide, expiryBasis: 'REFERENCE', storageStartedAt: handling };
  const changed = utils.changeReviewPurchaseDate(review, '2026-11-02');
  assert.equal(changed.items[0].storageStartedAt, handling);
  assert.equal(changed.items[0].expiryDate, '2026-11-09');
  review.items[0].guide = { ...guide, dateAnchor: 'HANDLING' };
  assert.equal(utils.changeReviewPurchaseDate(review, '2026-11-02').items[0].expiryDate, '2026-11-12');
});
test('supplementary scan preserves root photo, saved items and pending drafts', () => {
  const review = utils.createReview(batch('root', [food('Táo'), food('Cá hồi')]));
  review.items[0].saved = true;
  const result = utils.appendScan(review, batch('extra', [food('Cải thìa')]), review.items[1].clientItemId);
  assert.equal(result.root.scanResultId, 'root');
  assert.equal(result.items[0].saved, true);
  assert.equal(result.items[1].sourceScanId, 'extra');
  assert.equal(result.sources.root.imageUrl, 'file:///root.jpg');
  assert.equal(result.sources.extra.imageUrl, 'file:///extra.jpg');
  const noMatch = utils.appendScan(review, batch('empty', []), review.items[1].clientItemId);
  assert.equal(noMatch.items.length, 2, 'An unsuccessful rescan cannot remove the original draft');
});
test('a duplicate supplemental identity is not silently selected twice', () => {
  const review = utils.createReview(batch('root', [food('Táo')]));
  const next = utils.appendScan(review, batch('extra', [food('Táo')]));
  assert.equal(next.items[1].selected, false);
  assert(next.items[1].error);
});
test('portion splitting conserves quantities, generates stable distinct keys and labels', () => {
  const item = utils.createReview(batch('root', [food('Táo')])).items[0];
  const portions = utils.splitDraft(item);
  assert.equal(Number(portions[0].quantity) + Number(portions[1].quantity), 5);
  assert.equal(portions[0].quantity, '2');
  assert.equal(portions[1].quantity, '3');
  assert.notEqual(portions[0].clientItemId, portions[1].clientItemId);
  assert.notEqual(portions[0].containerLabel, portions[1].containerLabel);
  assert.equal(utils.splitDraft({ ...item, quantity: '1' }).length, 0);
  const weighted = utils.splitDraft({ ...item, quantity: '0.75', unit: 'kg' });
  assert.equal(Number(weighted[0].quantity) + Number(weighted[1].quantity), 0.75);
});
test('manual missing foods remain in the batch and need actual review data', () => {
  const review = utils.createReview(batch('root', []));
  const manual = utils.manualDraft(review);
  assert.equal(manual.sourceScanId, 'root');
  assert.equal(manual.manual, true);
  assert.equal(manual.imageMode, 'NONE');
  assert(utils.validateDraft(manual, review.purchaseDate));
  assert.equal(utils.validateDraft({ ...manual, foodName: 'Cà chua', categoryId: 'cat', expiryDate: utils.addCalendarDays(review.purchaseDate, 3), quantity: '1,5' }, review.purchaseDate), null);
});
test('calendar validation rejects impossible dates and does not reset storage age', () => {
  assert.equal(utils.isCalendarDate('2026-02-31'), false);
  assert.equal(utils.addCalendarDays('2026-12-31', 1), '2027-01-01');
  const review = utils.createReview(batch('root', [food('Cá hồi')]));
  const item = { ...review.items[0], expiryDate: review.purchaseDate, storageStartedAt: utils.addCalendarDays(review.purchaseDate, 1) };
  assert(utils.validateDraft(item, review.purchaseDate));
});

test('batch API uploads one original per source and sends only selected unsaved rows', async () => {
  const calls = [], posts = [];
  class Form { append(...args) { calls.push(args); } }
  const api = loadTs('src/features/scan/services/scanBatchApi.ts', { FormData: Form, require: (id) => {
    if (id === 'react-native') return { Platform: { OS: 'android' } };
    if (id.endsWith('/apiClient')) return { apiClient: { post: async (url, payload) => { posts.push([url, payload]); return { data: { results: [] } }; } } };
    throw Error(`Unexpected import ${id}`);
  } });
  const review = utils.createReview(batch('root', [food('Táo'), food('Cá hồi'), food('Cải')]));
  review.items[0].selected = true;
  review.items[1].selected = false;
  review.items[2].selected = true; review.items[2].saved = true;
  const persisted = new Set();
  await api.saveSelectedScanItems(review, persisted, () => {});
  await api.saveSelectedScanItems(review, persisted, () => {});
  assert.equal(posts.filter(([url]) => url.endsWith('/image')).length, 1);
  const saves = posts.filter(([url]) => url.endsWith('/items'));
  assert.equal(saves[0][1].items.length, 1);
  assert.equal(saves[0][1].items[0].clientItemId, saves[1][1].items[0].clientItemId);
  assert.equal(saves[0][1].items[0].foodName, 'Táo');
});

test('draft storage deduplicates source photos and isolates drafts by account', async () => {
  const storage = new Map([['userInfo', JSON.stringify({ _id: 'account-a' })]]);
  const mocked = { getItem: async (key) => storage.get(key) ?? null, setItem: async (key, value) => { await new Promise((resolve) => setTimeout(resolve, 5)); storage.set(key, value); }, removeItem: async (key) => { storage.delete(key); } };
  const persistence = loadTs('src/features/scan/services/scanDraftStorage.ts', { require: () => ({ __esModule: true, default: mocked }) });
  const review = utils.createReview(batch('root', [food('Táo'), food('Cá hồi')]));
  const encoded = persistence.encodeScanDraft(review);
  assert.equal(encoded.split('file:///root.jpg').length - 1, 1);
  const decoded = persistence.decodeScanDraft(encoded);
  assert.equal(decoded.items.length, 2); assert.equal(decoded.root.scanResultId, 'root');
  assert.equal(await persistence.scanDraftKey(), 'freshfriends:scan-draft:v1:account-a');
  const pending = persistence.writeScanDraft('draft', review);
  assert(await persistence.readScanDraft('draft'), 'Reads wait for pending writes when the screen remounts');
  await pending;
  storage.set('userInfo', JSON.stringify({ _id: 'account-b' }));
  assert.equal(await persistence.scanDraftKey(), 'freshfriends:scan-draft:v1:account-b');
  await persistence.writeScanDraft('draft', null); assert.equal(await persistence.readScanDraft('draft'), null);
  assert.equal(persistence.decodeScanDraft('{"version":1,"sources":{},"items":[{}]}'), null);
});

test('an ambiguous save response blocks splitting/replacing a possibly saved row', () => {
  const review = utils.createReview(batch('root', [food('Cá hồi')]));
  review.items[0].saveUncertain = true;
  assert.match(utils.validateDraft(review.items[0], review.purchaseDate), /đối chiếu/);
  const appended = utils.appendScan(review, batch('next', [food('Cá hồi')]), review.items[0].clientItemId);
  assert.equal(appended.items[0].clientItemId, review.items[0].clientItemId);
});
