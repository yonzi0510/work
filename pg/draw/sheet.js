/* ═══════════ 그림 학습지 — 공통 시트·인쇄 엔진 ═══════════
 * 용지: A3 세로(297×420mm) 기본, A4 세로(210×297mm) 예비 — 고급 옵션에서 선택.
 *       (어르신 시력을 위해 크게 인쇄하는 것이 기본이다.)
 * 역할:
 *  - mm 단위 시트 골격 그리기: 머리글(제목·지시문 / 이름·날짜) + 본문 + 꼬리글
 *    (frameInto: 아무 시트 요소에나 골격을 그림 — 도형 배열처럼 2장짜리 학습지용)
 *  - @page 크기 주입 → 브라우저 인쇄 대화상자가 용지를 따라감 (pg/pixel 방식)
 *  - 화면 미리보기 배율 자동 맞춤 (fitPair: 시트별)
 *  - 시드 난수(mulberry32) 등 공용 도우미
 */
window.Sheet = (function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ─────────── 용지 ───────────
   * PAGE는 항상 같은 객체를 재사용한다(참조 유지). pad는 시트 안쪽 여백(mm) —
   * 여백을 최소로 줄여 내용이 종이를 꽉 채우게 한다. print.css의 .sheet padding과 같아야 한다.
   */
  var PAPERS = {
    a3: { w: 297, h: 420 },
    a4: { w: 210, h: 297 }
  };
  var paperKey = 'a3';
  var PAGE = { w: 297, h: 420, pad: 6 };
  var paperCbs = [];

  function setPaper(key) {
    if (!PAPERS[key] || key === paperKey) return;
    paperKey = key;
    PAGE.w = PAPERS[key].w;
    PAGE.h = PAPERS[key].h;
    paperCbs.forEach(function (f) { f(key); });
  }
  function getPaper() { return paperKey; }
  function onPaper(f) { paperCbs.push(f); }

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
   * frameInto(sheetEl, opts): 주어진 시트 요소에 골격을 그린다.
   * opts: { title, instruction, nameDate }
   * 반환: 본문(.sheet-body) 요소 — 각 학습지가 여기에 내용을 그린다.
   * 난이도 이름 등 직원용 정보는 시트에 넣지 않는다(어르신 지면).
   */
  function frameInto(sheet, opts) {
    var ps = document.getElementById('page-style');
    if (ps) ps.textContent = '@page { size: ' + PAGE.w + 'mm ' + PAGE.h + 'mm; margin: 0; }';

    sheet.style.width = PAGE.w + 'mm';
    sheet.style.height = PAGE.h + 'mm';
    sheet.style.padding = PAGE.pad + 'mm';
    sheet.classList.toggle('paper-a4', paperKey === 'a4');
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
    return body;
  }

  // 기존 호출부(개수 세기) 호환: #sheet에 그리고 미리보기 배율까지 맞춘다.
  function renderFrame(opts) {
    var body = frameInto(document.getElementById('sheet'), opts);
    fitPreview();
    return body;
  }

  /* ─────────── 화면 미리보기 배율 ─────────── */
  function fitPair(wrap, sheet) {
    if (!wrap || !sheet) return;
    if (!wrap.clientWidth) return;           // 숨겨진 탭이면 건너뜀
    var pxPerMm = 96 / 25.4;
    var availW = Math.max(260, wrap.clientWidth - 16);
    var s = Math.min(1, availW / (PAGE.w * pxPerMm));
    sheet.style.transform = 'scale(' + s + ')';
    wrap.style.height = (PAGE.h * pxPerMm * s + 24) + 'px';
  }
  function fitPreview() {
    fitPair(document.getElementById('preview-wrap'), document.getElementById('sheet'));
  }
  window.addEventListener('resize', fitPreview);

  /* ─────────── 인쇄 버튼 ─────────── */
  function bindPrint(btnId) {
    var b = document.getElementById(btnId);
    if (b) b.addEventListener('click', function () { window.print(); });
  }

  return {
    PAGE: PAGE,
    PAPERS: PAPERS,
    SVG_NS: SVG_NS,
    setPaper: setPaper,
    getPaper: getPaper,
    onPaper: onPaper,
    mulberry32: mulberry32,
    randomSeed: randomSeed,
    el: el,
    svg: svg,
    frameInto: frameInto,
    renderFrame: renderFrame,
    fitPair: fitPair,
    fitPreview: fitPreview,
    bindPrint: bindPrint
  };
})();
