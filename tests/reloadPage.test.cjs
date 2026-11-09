const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  vm.runInNewContext(source.outputText, { module, exports: module.exports, require: dependencies, ...globals });
  return module.exports;
}

test('web refresh reloads the document once without also invoking the data callback', () => {
  let reloads = 0, reads = 0;
  const { reloadPageOrRefresh } = load('src/utils/reloadPage.ts', () => ({ Platform: { OS: 'web' } }), {
    window: { location: { reload() { reloads++; } } },
  });
  reloadPageOrRefresh(() => reads++);
  assert.equal(reloads, 1); assert.equal(reads, 0);
});

test('native refresh and rendering without a browser use the data callback', () => {
  for (const platform of ['ios', 'android', 'web']) {
    let reads = 0;
    const { reloadPageOrRefresh } = load('src/utils/reloadPage.ts', () => ({ Platform: { OS: platform } }));
    reloadPageOrRefresh(() => reads++);
    assert.equal(reads, 1);
  }
});

test('Family Cloud header uses document reload on web and its screen callback on native', () => {
  for (const platform of ['web', 'ios']) {
    let reloads = 0, reads = 0;
    const helper = load('src/utils/reloadPage.ts', () => ({ Platform: { OS: platform } }), {
      window: { location: { reload() { reloads++; } } },
    });
    const jsx = (type, props) => ({ type, props });
    const Header = load('src/features/familyCloud/components/FamilyCloudHeader.tsx', name => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return { Text: 'Text', View: 'View', TouchableOpacity: 'Button' };
      if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
      if (name.endsWith('reloadPage')) return helper;
      if (name.endsWith('/colors')) return { COLORS: {} };
      if (name.endsWith('.styles')) return { familyCloudStyles: {} };
      throw Error(name);
    }).default;
    const tree = Header({ onBack() {}, onRefresh() { reads++; } });
    tree.props.children.find(child => child.props.accessibilityLabel === 'Làm mới trang').props.onPress();
    assert.equal(reloads, platform === 'web' ? 1 : 0);
    assert.equal(reads, platform === 'web' ? 0 : 1);
  }
});
