/* ═══════════ 그림 학습지 — 숫자 색칠 생성기 ═══════════
 * 그림이 영역으로 나뉘어 있고 각 영역에 숫자가 적혀 있어, 위쪽 범례(숫자→색연필 색)를
 * 보고 같은 색으로 칠하는 학습지. 도안은 pics-cbn.js(window.CBN_PICS)에 내장.
 * - 영역 색(자연색)은 색연필 12색으로 근사 매핑(pg/pixel print.js의 redmean 방식 복사 —
 *   pixel 파일을 참조하지 않는다). 같은 색연필 = 같은 번호.
 * - 번호 배정만 시드 난수로 셔플: [🔀 색 바꾸기]마다 1번이 다른 색이 된다.
 *   인접 영역 같은 번호 금지는 도안 설계(인접 동색 없음)로 보장된다.
 * - 인쇄 지면: 영역은 흰 바탕 + 검정 윤곽(A3 기준 1.1mm) + 가운데 큰 숫자.
 *   숫자 최소 크기(A3): 1단계 12mm / 2단계 9mm / 3단계 7mm / 4단계 6mm.
 * - 난이도 = 도안별 태그(level 1~4). 난이도 버튼을 누르면 그 단계의 도안 목록이 나온다.
 * - 완성 견본 보기(직원용)는 화면 전용 — 인쇄물에는 나오지 않는다(print.css).
 * - 어르신 지면에는 난이도 이름을 인쇄하지 않는다.
 */
(function () {
  'use strict';

  var S = window.Sheet;
  var PICS = window.CBN_PICS || [];
  if (!PICS.length) return;
  var $ = function (id) { return document.getElementById(id); };

  /* 색연필 12색 — pg/pixel print.js와 같은 목록·같은 이름 */
  var PENCILS = [
    { name: '빨강',   hex: '#E53935' },
    { name: '주황',   hex: '#F57C00' },
    { name: '노랑',   hex: '#FDD835' },
    { name: '연두',   hex: '#8BC34A' },
    { name: '초록',   hex: '#388E3C' },
    { name: '하늘색', hex: '#4FC3F7' },
    { name: '파랑',   hex: '#1976D2' },
    { name: '보라',   hex: '#7B1FA2' },
    { name: '분홍',   hex: '#F48FB1' },
    { name: '살구색', hex: '#FFCC99' },
    { name: '고동색', hex: '#6D4C41' },
    { name: '검정',   hex: '#212121' }
  ];

  function hexRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  // redmean 근사 색 거리 — 사람 눈 기준으로 가까운 색연필을 고른다
  function colorDist(a, b) {
    var A = hexRgb(a), B = hexRgb(b);
    var rm = (A[0] + B[0]) / 2;
    var dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2];
    return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
  }
  function nearestPencil(hex) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < PENCILS.length; i++) {
      var d = colorDist(hex, PENCILS[i].hex);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /* ─────────── 난이도(도안 태그) — num: A3 기준 숫자 최소 크기(mm) ─────────── */
  var LEVELS = { 1: { num: 12 }, 2: { num: 9 }, 3: { num: 7 }, 4: { num: 6 } };
  var OW_MM = 1.1;          // 검정 윤곽 굵기(A3 기준 mm, 1mm 이상)

  var state = {
    level: 1,
    picId: null,
    seed: S.randomSeed(),
    nameDate: true,
    showSample: false,
    dirty: true
  };

  function picsOf(level) {
    return PICS.filter(function (p) { return p.level === level; });
  }
  state.picId = picsOf(state.level)[0].id;
  function getPic() {
    for (var i = 0; i < PICS.length; i++) if (PICS[i].id === state.picId) return PICS[i];
    return PICS[0];
  }

  function fx(v) { return (Math.round(v * 100) / 100).toString(); }
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ─────────── 시트 렌더 ─────────── */
  function render() {
    var pic = getPic();
    var rand = S.mulberry32(state.seed);
    var regions = pic.gen ? pic.gen(rand) : pic.regions;   // 조각보는 시드로 무늬 생성

    // 영역 색 → 색연필 → 번호 (등장한 색연필에 1..K를 시드 셔플로 배정)
    var uniq = [], slot = {};
    var pencilOf = regions.map(function (r) {
      var pi = nearestPencil(r.color);
      if (slot[pi] == null) { slot[pi] = true; uniq.push(pi); }
      return pi;
    });
    var order = [];
    for (var i = 0; i < uniq.length; i++) order.push(i);
    shuffle(order, rand);
    var numOf = {};                                        // 색연필 index → 번호
    order.forEach(function (u, pos) { numOf[uniq[u]] = pos + 1; });
    var legend = order.map(function (u) { return PENCILS[uniq[u]]; });

    var body = S.frameInto($('sheet-cbn'), {
      title: '숫자 색칠',
      instruction: '숫자와 같은 색을 찾아 칠해 보세요.',
      nameDate: state.nameDate
    });

    // ── 범례: [숫자] 색칩 색이름 — 그림 위쪽에 크게 ──
    var leg = S.el('div', 'cbn-legend');
    legend.forEach(function (p, li) {
      var it = S.el('div', 'cbn-leg-item');
      it.appendChild(S.el('span', 'cbn-leg-num', String(li + 1)));
      var chip = S.el('span', 'cbn-leg-chip');
      chip.style.background = p.hex;
      chip.dataset.hex = p.hex;
      it.appendChild(chip);
      it.appendChild(S.el('span', 'cbn-leg-name', p.name));
      leg.appendChild(it);
    });
    body.appendChild(leg);

    var art = S.el('div', 'cbn-art');
    body.appendChild(art);

    // ── 그림 배율(mm) — 남은 지면에 최대로 ──
    var pxPerMm = 96 / 25.4;
    var W = S.PAGE.w - S.PAGE.pad * 2;
    var H = art.clientHeight
      ? art.clientHeight / pxPerMm - 1
      : S.PAGE.h - S.PAGE.pad * 2 - 36 - 8 - 8 - (Math.ceil(legend.length / 6) * 18 + 4);
    var vb = pic.viewBox;
    var k = Math.min(W / vb[0], H / vb[1]);
    // 숫자·윤곽은 A3 기준 배율로 환산 — A4에서는 그림과 함께 비례 축소된다
    var kBase = Math.min(285 / vb[0], 300 / vb[1]);
    var fontU = LEVELS[pic.level].num / kBase;
    var swU = OW_MM / kBase;

    var svg = S.svg('svg', {
      viewBox: '0 0 ' + vb[0] + ' ' + vb[1],
      width: fx(vb[0] * k) + 'mm', height: fx(vb[1] * k) + 'mm'
    });

    // ① 영역: 흰 바탕 + 검정 윤곽 (regions 순서 = painter 순서)
    regions.forEach(function (r, ri) {
      svg.appendChild(S.svg('path', {
        d: r.path, fill: '#fff', stroke: '#111',
        'stroke-width': fx(swU), 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        'class': 'cbn-region', 'data-i': ri,
        'data-num': numOf[pencilOf[ri]], 'data-pencil': PENCILS[pencilOf[ri]].hex
      }));
    });

    // ② 완성 견본(직원용) — 화면 전용, 인쇄 시 print.css가 숨긴다
    if (state.showSample) {
      var gS = S.svg('g', { 'class': 'cbn-sample' });
      regions.forEach(function (r, ri) {
        gS.appendChild(S.svg('path', {
          d: r.path, fill: PENCILS[pencilOf[ri]].hex,
          stroke: '#111', 'stroke-width': fx(swU), 'stroke-linejoin': 'round'
        }));
      });
      svg.appendChild(gS);
    }

    // ③ 장식 윤곽선(꼭지 줄·문살 등 — 색칠 영역 아님)
    (pic.outlines || []).forEach(function (o) {
      svg.appendChild(S.svg('path', {
        d: o.path, fill: 'none', stroke: '#111',
        'stroke-width': fx((o.width || 1) / kBase),
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
    });

    // ④ 숫자 (영역 가운데, 크게)
    regions.forEach(function (r, ri) {
      var fs = fontU * (r.labelSize || 1);
      var t = S.svg('text', {
        x: fx(r.label[0]), y: fx(r.label[1]), dy: fx(fs * 0.36),
        'text-anchor': 'middle', 'font-size': fx(fs), 'font-weight': 900,
        fill: '#111', 'data-i': ri
      });
      t.textContent = String(numOf[pencilOf[ri]]);
      svg.appendChild(t);
    });

    art.appendChild(svg);
    fit();

    // 검증·디버그용(화면 표시 없음)
    window.ColorNumTab._debug = {
      id: pic.id, regions: regions.length, colors: legend.length,
      k: k, kBase: kBase, fontU: fontU, swU: swU,
      legend: legend.map(function (p) { return p.name; })
    };
  }

  function fit() { S.fitPair($('cbn-wrap'), $('sheet-cbn')); }
  function visible() { return !$('workspace-cbn').hidden; }
  function refresh() {
    if (visible()) { state.dirty = false; render(); }
    else state.dirty = true;
  }

  /* ─────────── 화면 컨트롤 ─────────── */
  // 난이도 → 그 단계의 도안 목록
  function rebuildPics() {
    var list = $('cbn-pics');
    list.innerHTML = '';
    var arr = picsOf(state.level);
    if (!arr.some(function (p) { return p.id === state.picId; })) state.picId = arr[0].id;
    arr.forEach(function (pic) {
      var b = S.el('button', 'pic-btn' + (pic.id === state.picId ? ' sel' : ''));
      b.dataset.pic = pic.id;
      b.appendChild(S.el('span', 'pic-emoji', pic.emoji));
      b.appendChild(S.el('span', 'pic-name', pic.name));
      list.appendChild(b);
    });
  }
  rebuildPics();

  $('cbn-level-btns').addEventListener('click', function (e) {
    var btn = e.target.closest('.level-btn');
    if (!btn) return;
    state.level = parseInt(btn.dataset.level, 10);
    document.querySelectorAll('#cbn-level-btns .level-btn').forEach(function (b) {
      b.classList.toggle('sel', b === btn);
    });
    rebuildPics();
    refresh();
  });

  $('cbn-pics').addEventListener('click', function (e) {
    var btn = e.target.closest('.pic-btn');
    if (!btn) return;
    state.picId = btn.dataset.pic;
    $('cbn-pics').querySelectorAll('.pic-btn').forEach(function (b) {
      b.classList.toggle('sel', b === btn);
    });
    refresh();
  });

  $('cbn-btn-new').addEventListener('click', function () {
    state.seed = S.randomSeed();                           // 번호 셔플(조각보는 무늬도 새로)
    refresh();
  });

  $('cbn-opt-namedate').addEventListener('change', function (e) {
    state.nameDate = e.target.checked;
    refresh();
  });

  $('cbn-opt-sample').addEventListener('change', function (e) {
    state.showSample = e.target.checked;
    refresh();
  });

  document.querySelectorAll('input[name="paper-cbn"]').forEach(function (r) {
    r.addEventListener('change', function (e) {
      if (e.target.checked) S.setPaper(e.target.value);
    });
  });
  S.onPaper(function (p) {
    document.querySelectorAll('input[name="paper-cbn"]').forEach(function (r) {
      r.checked = r.value === p;
    });
    refresh();
  });

  S.bindPrint('cbn-btn-print');
  window.addEventListener('resize', function () { if (visible()) fit(); });

  // 탭에서 이 화면을 열 때 (count.js의 탭 전환이 호출)
  window.ColorNumTab = {
    show: function () {
      if (state.dirty) { state.dirty = false; render(); }
      else fit();
    },
    _debug: null
  };
})();
