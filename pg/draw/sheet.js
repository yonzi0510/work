/* ═══════════ 그림 학습지 — 공통 시트·인쇄 엔진 ═══════════
 * 1단계: 용지는 A4 세로 고정.
 * 역할:
 *  - mm 단위 시트(#sheet) 골격 그리기: 머리글(제목·지시문 / 이름·날짜) + 본문 + 꼬리글
 *  - @page 크기 주입 → 브라우저 인쇄 대화상자가 용지를 따라감 (pg/pixel 방식)
 *  - 화면 미리보기 배율 자동 맞춤
 *  - 시드 난수(mulberry32) 등 공용 도우미
 * 다음 단계 학습지(도형 배열 등)도 이 엔진 위에 올린다.
 */
window.Sheet = (function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // A4 세로 (mm). pad는 시트 안쪽 여백 — print.css의 .sheet padding과 같아야 한다.
  var PAGE = { w: 210, h: 297, pad: 12 };

  /* ─────────── 시드 난수 (pg/pixel과 동일 계열) ─────────── */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2E239D | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function randomSeed() {
    return (Math.random() * 4294967296) >>> 0;
  }

  /* ─────────── DOM 도우미 ─────────── */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ─────────── 시트 골격 렌더 ───────────
   * opts: { title, instruction, nameDate }
   * 반환: 본문(.sheet-body) 요소 — 각 학습지가 여기에 내용을 그린다.
   * 난이도 이름 등 직원용 정보는 시트에 넣지 않는다(어르신 지면).
   */
  function renderFrame(opts) {
    var ps = document.getElementById('page-style');
    if (ps) ps.textContent = '@page { size: ' + PAGE.w + 'mm ' + PAGE.h + 'mm; margin: 0; }';

    var sheet = document.getElementById('sheet');
    sheet.style.width = PAGE.w + 'mm';
    sheet.style.height = PAGE.h + 'mm';
    sheet.innerHTML = '';

    var head = el('div', 'sheet-head');
    var left = el('div', 'sheet-head-left');
    left.appendChild(el('div', 'sheet-title', opts.title || ''));
    if (opts.instruction) left.appendChild(el('div', 'sheet-instr', opts.instruction));
    head.appendChild(left);

    if (opts.nameDate) {
      var f = el('div', 'sheet-fields');
      f.innerHTML =
        '이름 <span class="blank w-name"></span><br>' +
        '날짜 <span class="blank w-num"></span>년 <span class="blank w-num"></span>월 <span class="blank w-num"></span>일';
      head.appendChild(f);
    }
    sheet.appendChild(head);

    var body = el('div', 'sheet-body');
    sheet.appendChild(body);

    sheet.appendChild(el('div', 'sheet-foot', 'Day:음 인지학습지'));

    fitPreview();
    return body;
  }

  /* ─────────── 화면 미리보기 배율 ─────────── */
  function fitPreview() {
    var wrap = document.getElementById('preview-wrap');
    var sheet = document.getElementById('sheet');
    if (!wrap || !sheet) return;
    var pxPerMm = 96 / 25.4;
    var availW = Math.max(260, wrap.clientWidth - 16);
    var s = Math.min(1, availW / (PAGE.w * pxPerMm));
    sheet.style.transform = 'scale(' + s + ')';
    wrap.style.height = (PAGE.h * pxPerMm * s + 24) + 'px';
  }
  window.addEventListener('resize', fitPreview);

  /* ─────────── 인쇄 버튼 ─────────── */
  function bindPrint(btnId) {
    var b = document.getElementById(btnId);
    if (b) b.addEventListener('click', function () { window.print(); });
  }

  return {
    PAGE: PAGE,
    SVG_NS: SVG_NS,
    mulberry32: mulberry32,
    randomSeed: randomSeed,
    el: el,
    svg: svg,
    renderFrame: renderFrame,
    fitPreview: fitPreview,
    bindPrint: bindPrint
  };
})();
