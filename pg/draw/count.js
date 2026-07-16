/* ═══════════ 그림 학습지 — 개수 세기 생성기 ═══════════
 * 장면 박스에 그림을 흩어 놓고, 아래 답칸에 종류별 개수를 쓰는 학습지.
 * - 그리드 지터 배치: 가상 격자 셀당 그림 1개 → 절대 겹치지 않음
 *   (셀 안 랜덤 오프셋 + 회전 + 크기 변주, 난이도별로 정도 조절)
 * - 시드 난수(mulberry32) → 같은 시드면 항상 같은 문제
 * - 어려움·도전 난이도: 세지 않는 방해 그림 + "모두 몇 개?" 합계 칸
 * - 크기(mm)는 A3 세로 기본 기준 — 어르신 시력을 위해 크고 뚜렷하게.
 * - 어르신 지면에는 난이도 이름을 인쇄하지 않는다.
 */
(function () {
  'use strict';

  var S = window.Sheet;
  var ICONS = window.COUNT_ICONS || [];
  var $ = function (id) { return document.getElementById(id); };

  /* ─────────── 난이도 설계 (인지학습지개발팀 확정, A3 기준 mm) ─────────── */
  var LEVELS = {
    easy: { kinds: [2, 2], per: [2, 4], total: [6, 8],  minMm: 28, maxMm: 46,
            jitter: 0.15, rot: 4,  sizeVar: 0.04, tidy: true,  distract: [0, 0], sum: false },
    mid:  { kinds: [3, 4], per: [3, 7], total: [10, 16], minMm: 20, maxMm: 32,
            jitter: 0.9,  rot: 10, sizeVar: 0.10, tidy: false, distract: [0, 0], sum: false },
    hard: { kinds: [5, 6], per: [5, 10], total: [25, 35], minMm: 15, maxMm: 24,
            jitter: 1.0,  rot: 15, sizeVar: 0.15, tidy: false, distract: [1, 2], sum: true },
    // 도전: I Spy처럼 종이가 그림으로 가득 — 작아도 12mm 밑으로는 내려가지 않는다(A3)
    max:  { kinds: [7, 9], per: [6, 12], total: [70, 110], minMm: 12, maxMm: 16,
            jitter: 1.0,  rot: 20, sizeVar: 0.18, tidy: false, distract: [2, 3], sum: true }
  };

  // 지면 세로 예산 (mm) — 본문 높이는 실제 렌더를 재서 쓰고, 이 값들은 예비 추정치
  var HEAD_H = 36;    // 제목 + 지시문 + 이름·날짜 (A3)
  var FOOT_H = 8;     // 꼬리글
  var GAPS   = 8;     // 위아래 간격

  var state = {
    level: 'mid',
    seed: S.randomSeed(),
    nameDate: true,
    showAnswer: false,
    dirty: false
  };

  /* ─────────── 문제 생성 ─────────── */
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function makeProblem() {
    var cfg = LEVELS[state.level];
    var rand = S.mulberry32(state.seed);
    var ri = function (a, b) { return a + Math.floor(rand() * (b - a + 1)); };

    var pool = shuffle(ICONS.slice(), rand);
    var nKinds = ri(cfg.kinds[0], cfg.kinds[1]);
    var kinds = pool.slice(0, nKinds);
    var nDis = ri(cfg.distract[0], cfg.distract[1]);
    var distractors = pool.slice(nKinds, nKinds + nDis);

    // 종류별 개수 — 범위 안에서 뽑고, 전체 합이 목표 범위에 들도록 보정
    var counts = kinds.map(function () { return ri(cfg.per[0], cfg.per[1]); });
    var sum = counts.reduce(function (a, b) { return a + b; }, 0);
    var guard = 0;
    while (sum > cfg.total[1] && guard++ < 99) {
      var i1 = counts.indexOf(Math.max.apply(null, counts));
      if (counts[i1] <= cfg.per[0]) break;
      counts[i1]--; sum--;
    }
    guard = 0;
    while (sum < cfg.total[0] && guard++ < 99) {
      var i2 = counts.indexOf(Math.min.apply(null, counts));
      if (counts[i2] >= cfg.per[1]) break;
      counts[i2]++; sum++;
    }

    // 방해 그림은 소량(2~3개)만 — 답칸에는 넣지 않는다
    var dCounts = distractors.map(function () { return ri(2, 3); });

    var items = [];
    kinds.forEach(function (ic, k) {
      for (var i = 0; i < counts[k]; i++) items.push({ icon: ic, kind: k });
    });
    distractors.forEach(function (ic, k) {
      for (var i = 0; i < dCounts[k]; i++) items.push({ icon: ic, kind: -1 });
    });

    return { cfg: cfg, rand: rand, kinds: kinds, counts: counts, sum: sum,
             distractors: distractors, items: items };
  }

  /* ─────────── 아이콘 SVG 조각 ─────────── */
  function iconG(icon, sizeMm, cx, cy, rot) {
    var k = sizeMm / 100;   // viewBox 100 → mm
    var g = S.svg('g', {
      transform: 'translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ') rotate(' + rot.toFixed(1) +
                 ') scale(' + k.toFixed(4) + ') translate(-50 -50)'
    });
    icon.paths.forEach(function (p) {
      var base = p.sw == null ? 3 : p.sw;
      // 작은 그림도 선이 인쇄에서 뚜렷하게: 최소 0.58mm 굵기를 보장 (가는 선 금지)
      var sw = base === 0 ? 0 : Math.max(base, 58 / sizeMm);
      g.appendChild(S.svg('path', {
        d: p.d,
        fill: p.fill || 'none',
        stroke: base === 0 ? 'none' : '#111',
        'stroke-width': sw,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      }));
    });
    return g;
  }

  /* ─────────── 장면(그림 흩어 놓기) ─────────── */
  function buildScene(prob, W, H) {
    var cfg = prob.cfg;
    var rand = prob.rand;
    var svg = S.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W + 'mm', height: H + 'mm' });

    // 테두리 1mm 회색
    svg.appendChild(S.svg('rect', {
      x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 3,
      fill: 'none', stroke: '#9aa2ad', 'stroke-width': 1
    }));

    var inset = 5;                       // 테두리 안쪽 여백
    var gw = W - inset * 2, gh = H - inset * 2;

    // 배치 순서: 쉬움은 종류별로 줄 맞춰, 그 외에는 무작위
    var items = prob.items.slice();
    if (!cfg.tidy) shuffle(items, rand);
    var n = items.length;
    if (!n) return svg;

    // 가상 격자 — 가장 넉넉한 셀이 나오는 행×열 선택
    var best = { cell: 0, cols: 1, rows: n };
    for (var c = 1; c <= n; c++) {
      var r = Math.ceil(n / c);
      var cell = Math.min(gw / c, gh / r);
      if (cell > best.cell) best = { cell: cell, cols: c, rows: r };
    }
    var cols = best.cols, rows = Math.ceil(n / cols);
    var cellW = gw / cols, cellH = gh / rows;

    // 그림 크기: 셀에 여유 있게 들어가는 크기 (회전·확대해도 셀 안 유지 → 겹침 없음)
    var fit = Math.min(cellW, cellH) * 0.78 / (1 + cfg.sizeVar);
    var size = Math.min(cfg.maxMm, Math.max(cfg.minMm, fit));
    if (size > fit) size = fit;          // 겹침 금지가 최우선

    // 셀 고르기: 쉬움은 앞에서부터(줄 맞춤 + 마지막 줄 가운데), 그 외엔 전체 셀 중 무작위
    var positions = [];
    if (cfg.tidy) {
      var idx = 0;
      for (var rr = 0; rr < rows && idx < n; rr++) {
        var inRow = Math.min(cols, n - idx);
        var xoff = (gw - inRow * cellW) / 2;
        for (var cc = 0; cc < inRow; cc++, idx++) {
          positions.push({ x: inset + xoff + cc * cellW + cellW / 2, y: inset + rr * cellH + cellH / 2 });
        }
      }
    } else {
      var cells = [];
      for (var ci = 0; ci < cols * rows; ci++) cells.push(ci);
      shuffle(cells, rand);
      cells.slice(0, n).forEach(function (ci2) {
        positions.push({
          x: inset + (ci2 % cols) * cellW + cellW / 2,
          y: inset + Math.floor(ci2 / cols) * cellH + cellH / 2
        });
      });
    }

    // 셀 안 지터 + 회전 + 크기 변화
    items.forEach(function (it, i) {
      var sc = 1 + (rand() * 2 - 1) * cfg.sizeVar;
      var s2 = size * sc;
      var freeX = Math.max(0, (cellW - s2 * 1.22) / 2);   // 회전 여유 포함
      var freeY = Math.max(0, (cellH - s2 * 1.22) / 2);
      var x = positions[i].x + (rand() * 2 - 1) * freeX * cfg.jitter;
      var y = positions[i].y + (rand() * 2 - 1) * freeY * cfg.jitter;
      var rot = (rand() * 2 - 1) * cfg.rot;
      svg.appendChild(iconG(it.icon, s2, x, y, rot));
    });

    return svg;
  }

  /* ─────────── 답칸 표 ─────────── */
  function buildAnswers(prob) {
    var row = S.el('div', 'answer-row');
    prob.kinds.forEach(function (ic, k) {
      var item = S.el('div', 'ans-item');
      var sample = S.svg('svg', { viewBox: '0 0 100 100', 'class': 'ans-sample' });
      sample.appendChild(iconG(ic, 100, 50, 50, 0));
      item.appendChild(sample);
      item.appendChild(S.el('div', 'ans-name', ic.name));
      var box = S.el('div', 'ans-box');
      if (state.showAnswer) box.appendChild(S.el('span', 'ans-val', String(prob.counts[k])));
      item.appendChild(box);
      row.appendChild(item);
    });
    if (prob.cfg.sum) {
      var sumItem = S.el('div', 'ans-item ans-sum');
      var q = S.el('div', 'ans-sum-label');
      q.innerHTML = '모두<br>몇 개?';
      sumItem.appendChild(q);
      var sbox = S.el('div', 'ans-box');
      if (state.showAnswer) sbox.appendChild(S.el('span', 'ans-val', String(prob.sum)));
      sumItem.appendChild(sbox);
      row.appendChild(sumItem);
    }
    return row;
  }

  /* ─────────── 시트 전체 렌더 ─────────── */
  function render() {
    var body = S.renderFrame({
      title: '개수 세기',
      instruction: '그림이 몇 개 있는지 세어서 빈칸에 써 보세요. (세면서 그림에 ○표 하시면 좋습니다.)',
      nameDate: state.nameDate
    });

    var prob = makeProblem();
    var W = S.PAGE.w - S.PAGE.pad * 2;

    // 본문 높이는 실제 렌더를 잰다(숨겨진 탭이면 추정치). 답칸 표는 종류가 많으면 2줄로 감긴다.
    var pxPerMm = 96 / 25.4;
    var bodyH = body.clientHeight
      ? body.clientHeight / pxPerMm
      : (S.PAGE.h - S.PAGE.pad * 2 - HEAD_H - FOOT_H - GAPS);
    var a4 = S.getPaper() === 'a4';
    var itemW = a4 ? 26 : 34, itemH = a4 ? 46 : 57, gapX = 5, gapY = 4;
    var nAns = prob.kinds.length + (prob.cfg.sum ? 1 : 0);
    var perRow = Math.max(1, Math.floor((W + gapX) / (itemW + gapX)));
    var ansRows = Math.ceil(nAns / perRow);
    var ansH = ansRows * itemH + (ansRows - 1) * gapY + 4;
    var H = Math.max(60, bodyH - ansH - 4);

    var sceneBox = S.el('div', 'scene-box');
    sceneBox.appendChild(buildScene(prob, W, H));
    body.appendChild(sceneBox);
    body.appendChild(buildAnswers(prob));

    S.fitPreview();
  }

  /* ─────────── 화면 컨트롤 ─────────── */
  $('level-btns').addEventListener('click', function (e) {
    var btn = e.target.closest('.level-btn');
    if (!btn) return;
    state.level = btn.dataset.level;
    document.querySelectorAll('.level-btn').forEach(function (b) {
      b.classList.toggle('sel', b === btn);
    });
    render();
  });

  $('btn-new').addEventListener('click', function () {
    state.seed = S.randomSeed();
    render();
  });

  $('opt-namedate').addEventListener('change', function (e) {
    state.nameDate = e.target.checked;
    render();
  });

  $('opt-answer').addEventListener('change', function (e) {
    state.showAnswer = e.target.checked;
    $('print-warn').hidden = !state.showAnswer;
    render();
  });

  // 용지 선택 (A3 기본 / A4 예비) — 도형 배열 탭과 공유되는 설정
  document.querySelectorAll('input[name="paper-count"]').forEach(function (r) {
    r.addEventListener('change', function (e) {
      if (e.target.checked) S.setPaper(e.target.value);
    });
  });
  S.onPaper(function (p) {
    document.querySelectorAll('input[name="paper-count"]').forEach(function (r) {
      r.checked = r.value === p;
    });
    if ($('workspace').hidden) state.dirty = true;
    else render();
  });

  S.bindPrint('btn-print');

  /* ─────────── 탭 전환 (개수 세기 · 도형 배열 동작, 나머지는 준비 중) ─────────── */
  $('tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('sel', t === tab);
    });
    var which = tab.dataset.tab;
    var ready = which === 'count' || which === 'array';
    $('coming').hidden = ready;
    $('workspace').hidden = which !== 'count';
    $('workspace-arr').hidden = which !== 'array';
    if (which === 'count') {
      if (state.dirty) { state.dirty = false; render(); }
      else S.fitPreview();
    }
    if (which === 'array' && window.ArrangeTab) window.ArrangeTab.show();
  });

  render();
})();
