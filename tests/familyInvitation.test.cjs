const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { configureStore } = require('@reduxjs/toolkit');

function load(relative, overrides) {
  const filename = path.resolve(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  const module = { exports: {} };
  vm.runInNewContext(source.outputText, { module, exports: module.exports, require: overrides }, { filename });
  return module.exports;
}

test('actual Redux thunk preserves backend invitation 404/403/409 messages and resets loading', async () => {
  for (const status of [404, 403, 409]) {
    const message = status === 404 ? 'Không tìm thấy tài khoản đang hoạt động với email này.' : status === 403 ? 'Family Cloud member limit reached' : 'User already has a pending family invitation';
    const module = load('src/features/familyCloud/redux/familyCloudSlice.ts', name => {
      if (name === '@reduxjs/toolkit') return require(name);
      if (name.endsWith('familyCloudApi')) return { addHouseholdMemberApi: async () => { throw { message: `Request failed with status code ${status}`, response: { status, data: { message } } }; } };
      throw Error(name);
    });
    const store = configureStore({ reducer: { familyCloud: module.default } });
    await assert.rejects(store.dispatch(module.addFamilyMember({ householdId: 'house', payload: { email: 'existing@example.test' } })).unwrap(),
      error => error.status === status && error.message === message);
    assert.equal(store.getState().familyCloud.error, message); assert.equal(store.getState().familyCloud.saving, false);
  }
});

test('successful invitation keeps the existing payload and response contract', async () => {
  let request;
  const module = load('src/features/familyCloud/redux/familyCloudSlice.ts', name => name === '@reduxjs/toolkit' ? require(name) : {
    addHouseholdMemberApi: async (householdId, payload) => { request = { householdId, payload }; return { invitation: { _id: 'invite' } }; },
  });
  const store = configureStore({ reducer: { familyCloud: module.default } });
  const result = await store.dispatch(module.addFamilyMember({ householdId: 'house', payload: { email: 'member@example.test' } })).unwrap();
  assert.equal(request.payload.email, 'member@example.test'); assert.equal(result.householdId, 'house');
  assert.equal(result.result.invitation._id, 'invite'); assert.equal(store.getState().familyCloud.saving, false);
});

test('invitation form identifies existing accounts and configures email input for web/mobile', () => {
  const jsx = (type, props) => ({ type, props });
  const Form = load('src/features/familyCloud/components/AddMemberForm.tsx', name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return Object.fromEntries(['View', 'Text', 'TextInput', 'TouchableOpacity', 'ActivityIndicator'].map(key => [key, key]));
    if (name.endsWith('/colors')) return { COLORS: {} };
    return { familyCloudStyles: {} };
  }).default;
  const result = Form({ inviteEmail: '', saving: true, onChangeInviteEmail() {}, onSubmit() {} });
  const children = result.props.children; const input = children.find(child => child.type === 'TextInput');
  assert.equal(input.props.keyboardType, 'email-address'); assert.equal(input.props.autoCapitalize, 'none');
  assert.equal(input.props.autoCorrect, false); assert.equal(children.find(child => child.type === 'TouchableOpacity').props.disabled, true);
});
