import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function offline() {
  let now = Date.parse('2026-11-04T03:01:00Z');
  class Clock extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const memory = new Map();
  const ctx = { console, Date: Clock, crypto, atob, matchMedia: () => ({ matches: false }), innerWidth: 1200,
    setTimeout, clearTimeout, document: {},
    localStorage: { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) }
  };
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of ['config.js', 'js/util.js', 'js/questions-bank.js', 'js/net.js']) vm.runInContext(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'), ctx, { filename: f });
  return { net: ctx.createNet(), ctx, advance: ms => { now += ms; }, at: t => { now = t; } };
}

test('offline profile, study accounting, quizzes and star wallet', async () => {
  const h = offline(), { net, ctx } = h;
  assert.equal(net.mode, 'offline'); await net.init();
  assert.equal((await net.register({ name: 'Nguyễn Văn An', mssv: 'bad', quiz: true, style: {} })).ok, false);
  assert.equal((await net.register({ name: 'Nguyễn Văn An', mssv: '20231111', quiz: true, style: {} })).ok, true);
  await net.startSession('lib_a'); await net.heartbeat('lib_a', 'hoc'); h.advance(60000);
  await net.heartbeat('lib_a', 'nghi');
  assert.equal((await net.myProfile()).today.seconds, 60, 'only prior studying interval earns time');
  h.advance(30000); await net.heartbeat('lib_a', 'hoc');
  assert.equal((await net.myProfile()).today.seconds, 60, 'break earns no study time');
  assert.equal((await net.buyItem('coffee')).ok, false, 'cannot overspend');
  assert.equal((await net.buyItem('water')).ok, true);
  for (let i = 0; i < 2; i++) {
    const initial = await net.getRound(); h.at(initial.next_at + 1000);
    const round = await net.getRound(); assert.equal(round.eligible, true);
    const question = ctx.QUESTION_BANK.find(q => q.id === round.question.id);
    assert.equal((await net.submitAnswer(round.id, question.dap)).ok, true);
    assert.equal((await net.submitAnswer(round.id, question.dap)).ok, false, 'cannot answer twice');
    assert.equal((await net.getRoundResult(round.id)).ok, false, 'answer hidden until close');
    h.at(round.closes_at + 1000);
    assert.equal((await net.getRoundResult(round.id)).my_correct, true);
  }
  assert.equal((await net.myProfile()).wallet, 2);
  const purchase = await net.buyItem('coffee'); assert.equal(purchase.ok, true);
  assert.equal(purchase.profile.wallet, 0); assert.equal(purchase.profile.today.stars, 2, 'spending preserves earned-star ranking');
  assert.equal((await net.leaderboard('stars', 'today')).me.v, 2);
  assert.match((await net.profileCard(net.me.id)).mssv, /\*/);
});

test('offline chat cooldown, questions, feedback and game reward limits', async () => {
  const h = offline(), { net, ctx } = h; await net.init();
  await net.register({ name: 'Trần Thị Bình', mssv: '20232222', style: {} });
  assert.equal((await net.sendMessage('campus', 'Xin chào cả phòng')).ok, true);
  assert.equal((await net.sendMessage('campus', 'Gửi quá nhanh')).ok, false);
  assert.equal((await net.recentMessages('campus')).length, 1);
  assert.equal((await net.sendDm('other', 0)).ok, false);
  const asked = await net.qaAsk('GT1', 'Giới hạn dãy số', 'Mọi người giải thích giúp mình bài này');
  assert.equal(asked.ok, true);
  h.advance(1000);
  assert.equal((await net.qaReply(asked.id, 'Thử xét tính đơn điệu của dãy')).ok, true);
  assert.equal((await net.qaAnswers(asked.id)).length, 1);
  assert.equal((await net.qaList())[0].answers_count, 1);
  assert.equal((await net.sendFeedback('bug', 'Báo lỗi kiểm thử')).ok, true);
  assert.equal(ctx.U.store.get('local:feedback', []).length, 1);
  assert.equal((await net.claimMango()).ok, true);
  assert.equal((await net.claimMango()).already, true);
  assert.equal((await net.pickTrash()).ok, true);
  assert.equal((await net.pickTrash()).ok, false);
  for (let i = 1; i < 30; i++) { h.advance(8001); assert.equal((await net.pickTrash()).ok, true); }
  h.advance(8001); assert.equal((await net.pickTrash()).ok, false, 'daily cap applies');
  await net.signOut(); assert.equal(await net.myProfile(), null);
});
