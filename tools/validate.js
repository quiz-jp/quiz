// 問題データ (index.html 内の `const questions = [...]`) の整合性チェック
// 使い方: node tools/validate.js
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/const questions = (\[[\s\S]*?\n\]);/);
if (!m) { console.error('NG: const questions = [...] が見つかりません'); process.exit(1); }

let questions;
try { questions = eval(m[1]); }
catch (e) { console.error('NG: 問題データの構文エラー: ' + e.message); process.exit(1); }

const GROUPS   = ['電気・電子理論','有線・線路施工','無線・放送','ネットワーク・情報','施工管理','法規'];
const CHAPTERS = { '1章':5, '2章':5, '3章':4, '4章':4, '5章':2, '6章':1, '基礎':0 };
const errors = [];
const seen = new Set();

questions.forEach((q, i) => {
    const at = `#${i} (${q.id})`;
    if (!/^q\d+$/.test(q.id || '')) errors.push(`${at}: id は 'q数字' 形式にする`);
    if (seen.has(q.id)) errors.push(`${at}: id が重複`);
    seen.add(q.id);
    if (!GROUPS.includes(q.group)) errors.push(`${at}: group が不正 "${q.group}"`);
    if (!(q.chapter in CHAPTERS)) errors.push(`${at}: chapter が不正 "${q.chapter}"`);
    else if (q.stars !== CHAPTERS[q.chapter]) errors.push(`${at}: stars(${q.stars}) が chapter ${q.chapter} の重要度(${CHAPTERS[q.chapter]})と不一致`);
    for (const k of ['category','question','explanation'])
        if (typeof q[k] !== 'string' || !q[k].trim()) errors.push(`${at}: ${k} が空`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${at}: options は4つ必要`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`${at}: answer は 0〜3`);
    if (q.choiceNotes !== undefined && (!Array.isArray(q.choiceNotes) || q.choiceNotes.length !== 4))
        errors.push(`${at}: choiceNotes は options と同じ4要素`);
    if (q.figure !== undefined && !/^<(svg|table)[\s\S]*<\/\1>$/.test(q.figure.trim()))
        errors.push(`${at}: figure は <svg> または <table> の HTML 文字列`);
});

if (errors.length) {
    console.error(errors.join('\n'));
    console.error(`\nNG: ${errors.length} 件のエラー`);
    process.exit(1);
}
console.log(`OK: ${questions.length} 問`);
