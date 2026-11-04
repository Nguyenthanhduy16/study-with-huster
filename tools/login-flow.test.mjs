import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const loginSource = app.slice(app.indexOf('  function login(prof)'), app.indexOf('  function roomClosed()'));

// A minimal DOM executes the real login renderer and submit handler without WebGL.
function fixture(saved = {}, profile = null, registerResult = { ok: true, profile: {} }) {
  const all = [];
  class Element {
    constructor(tag) { this.tagName = tag; this.nodeType = 1; this.children = []; this.attrs = {}; this.events = {}; this.style = {}; this.value = ''; this.checked = false; this.hidden = false; this.disabled = false; this.innerHTML = ''; this.classList = { add() {}, toggle() {} }; all.push(this); }
    setAttribute(k, v) { this.attrs[k] = v; if (k === 'value') this.value = String(v); if (k === 'checked') this.checked = true; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    addEventListener(k, f) { this.events[k] = f; }
    set textContent(value) { this.children = [String(value)]; }
    get textContent() { return this.children.map(c => typeof c === 'string' ? c : c.textContent).join(''); }
  }
  const document = { createElement: tag => new Element(tag), createTextNode: text => ({ nodeType: 3, textContent: String(text) }) };
  const util = fs.readFileSync(new URL('../js/util.js', import.meta.url), 'utf8');
  const utilCtx = vm.createContext({ document });
  vm.runInContext(util.slice(util.indexOf('  const U = {};'), util.indexOf('  U.sleep =')) + '\nglobalThis.U=U;', utilCtx);
  const { U } = utilCtx, root = new Element('div'), logo = new Element('div');
  const state = { saved, calls: [], entered: [], stopped: false, style: null };
  Object.assign(U, { titleName: name => name.trim(), checkName: name => name.trim() ? null : 'required', checkMssv: mssv => /^202\d{5}$/.test(mssv) ? null : 'invalid' });
  const store = { get: () => saved, set: (key, value) => { state.saved = value; } };
  const A = { banned: [], profile: null };
  const ctx = vm.createContext({ U, h: U.h, A, APP: { disclaimer: 'Bản demo' }, store, $: selector => selector === '#po-login' ? root : logo,
    net: { mode: 'online', async register(data) { state.calls.push(data); if (registerResult instanceof Error) throw registerResult; return registerResult; } },
    avatarPicker(style) { state.style = style; return { el: new Element('div'), get: () => style || { equipped: { hair: 'toc-ngan' } }, stop: () => { state.stopped = true; } }; },
    enterRoom: zone => state.entered.push(zone) });
  vm.runInContext(loginSource + '\nlogin(globalThis.profile);', Object.assign(ctx, { profile }));
  const form = all.find(e => e.tagName === 'form'), button = all.find(e => e.tagName === 'button' && e.attrs.type === 'submit');
  return { root, button, all, state, A, async submit() { await form.events.submit({ preventDefault() {} }); }, input: id => all.find(e => e.id === id || e.attrs.id === id) };
}

test('new login shows Học ngay, omits destination/quiz controls and starts in courtyard', async () => {
  const f = fixture();
  assert.equal(f.button.textContent, 'Học ngay');
  assert.doesNotMatch(f.root.textContent, /Bắt đầu ở đâu|Nhận câu hỏi|Vào thẳng thư viện/);
  assert.equal(f.all.filter(e => e.tagName === 'input' && e.attrs.type === 'checkbox').length, 2, 'only privacy switches remain');
  f.input('f-name').value = 'Nguyễn Văn An'; f.input('f-mssv').value = '20231111';
  await f.submit();
  assert.deepEqual(f.state.entered, ['campus']); assert.equal(f.state.calls[0].quiz, false);
  assert.equal(f.state.saved.start, 'campus'); assert.equal(f.state.saved.quiz, false); assert.equal(f.state.stopped, true);
});

test('returning profile and saved library/quiz choices cannot bypass courtyard defaults', async () => {
  const style = { equipped: { hair: 'toc-dau-moi' } };
  const profile = { full_name: 'Nguyễn Văn An', display_name: 'Nguyễn Văn An', mssv: '20231111', quiz: true, hide_rank: true, hide_status: true, style };
  const f = fixture({ start: 'library', quiz: true, name: 'Saved name', style: { equipped: { hair: 'toc-cua' } } }, profile, { ok: true, profile });
  assert.equal(f.button.textContent, 'Học ngay'); assert.equal(f.state.style, style);
  await f.submit();
  assert.deepEqual(f.state.entered, ['campus']); assert.equal(f.state.saved.start, 'campus');
  const data = f.state.calls[0]; assert.equal(data.quiz, false); assert.equal(data.hideRank, true); assert.equal(data.hideStatus, true); assert.equal(data.style, style);
  assert.equal(f.A.profile, profile); assert.equal(data.name, profile.full_name);
});

test('registration failure leaves login available with the same Học ngay button label', async () => {
  for (const result of [{ ok: false, field: 'name', error: 'Tên chưa hợp lệ' }, new Error('Mất kết nối')]) {
    const f = fixture({ name: 'Nguyễn Văn An', mssv: '20231111', start: 'library' }, null, result);
    await f.submit();
    assert.equal(f.button.disabled, false); assert.equal(f.button.textContent, 'Học ngay');
    assert.equal(f.root.hidden, false); assert.deepEqual(f.state.entered, []); assert.equal(f.state.stopped, false);
  }
});
