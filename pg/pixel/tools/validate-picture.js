/* 픽셀 도안 계약 검증기 — 사용법: node tools/validate-picture.js [pictureId] */
const fs = require('fs');
const path = require('path');

global.window = globalThis;
const picDir = path.join(__dirname, '..', 'pictures');
fs.readdirSync(picDir).filter(f => f.endsWith('.js')).sort()
  .forEach(f => require(path.join(picDir, f)));

const PICS = globalThis.PIXELS || [];
const only = process.argv[2];
const CATS = ['shape', 'animal', 'nature', 'vehicle', 'food', 'work'];
const HEX = /^#[0-9A-Fa-f]{6}$/;
let failed = false;

const ids = new Set();
PICS.filter(p => !only || p.id === only).forEach(pic => {
  const errs = [];
  ['id', 'name', 'emoji', 'category'].forEach(k => { if (!pic[k]) errs.push('필드 누락: ' + k); });
  if (ids.has(pic.id)) errs.push('id 중복: ' + pic.id);
  ids.add(pic.id);
  if (!CATS.includes(pic.category)) errs.push('알 수 없는 카테고리: ' + pic.category);

  if (!Array.isArray(pic.palette) || pic.palette.length < 3 || pic.palette.length > 10)
    errs.push('palette는 3~10색이어야 함 (현재 ' + (pic.palette || []).length + ')');
  else pic.palette.forEach((h, i) => { if (!HEX.test(h)) errs.push('palette[' + i + '] hex 불량: ' + h); });

  if (!Array.isArray(pic.rows) || pic.rows.length < 8 || pic.rows.length > 48) {
    errs.push('rows는 8~48행이어야 함 (현재 ' + (pic.rows || []).length + ')');
  } else {
    const W = pic.rows[0].length;
    if (W < 8 || W > 48) errs.push('열 수는 8~48이어야 함 (현재 ' + W + ')');
    const used = new Set();
    pic.rows.forEach((row, y) => {
      if (typeof row !== 'string' || row.length !== W) { errs.push('행 ' + y + ': 길이 불일치 (' + (row || '').length + ' ≠ ' + W + ')'); return; }
      for (let x = 0; x < W; x++) {
        const c = row.charCodeAt(x) - 48;
        if (c < 0 || c > 9 || c >= pic.palette.length) errs.push('행 ' + y + ' 열 ' + x + ": 잘못된 문자 '" + row[x] + "'");
        else used.add(c);
      }
    });
    pic.palette.forEach((_, c) => { if (!used.has(c)) errs.push('palette[' + c + '] (' + pic.palette[c] + ') 을 쓰는 칸이 없음'); });
  }

  if (errs.length) {
    failed = true;
    console.log('❌ ' + pic.id + ' 실패:');
    [...new Set(errs)].slice(0, 12).forEach(e => console.log('  - ' + e));
  } else {
    console.log('✅ ' + pic.id + ' — ' + pic.rows[0].length + '×' + pic.rows.length + ' · 색 ' + pic.palette.length + '개 (' + pic.name + ')');
  }
});

if (only && !PICS.some(p => p.id === only)) { console.error('❌ id="' + only + '" 도안 없음'); process.exit(1); }
if (!PICS.length) { console.error('❌ 등록된 도안 없음'); process.exit(1); }
process.exit(failed ? 1 : 0);
