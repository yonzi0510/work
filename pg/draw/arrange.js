/* ═══════════ 그림 학습지 — 도형 배열 생성기 ═══════════
 * 색 도형 조각을 가위로 오려(또는 직원이 미리 오려 주고) 윤곽 위에 붙이는 활동지.
 * 한 도안 = 인쇄 2장:
 *  - 1장 조각판: 조각을 색 채움 + 절취 점선으로 격자 배치 (조각 사이 여백 9mm, 상단 ✂ 표시)
 *  - 2장 붙임판: 같은 조각들의 완성 자리 (난이도별 힌트가 다름)
 * 가장 중요한 규칙: 두 장이 완전히 같은 mm 배율(k) — 조각과 자리가 실물 크기로 일치한다.
 * 난이도:
 *  🌱 쉬움  3~4조각 · 자리에 같은 색(20% 투명)과 같은 번호
 *  🌟 보통  5~7조각 · 자리에 조각별 점선만
 *  🔥 어려움 7~9조각 · 바깥 실루엣 점선만
 *  💪 도전  10조각 이상 · 바깥 실루엣 점선만, 조각이 작고 많음
 * 어르신 지면에는 난이도 이름을 인쇄하지 않는다.
 */
(function () {
  'use strict';

  var S = window.Sheet;
  var PICS = window.SHAPE_PICS || [];
  if (!PICS.length) return;
  var $ = function (id) { return document.getElementById(id); };

  /* ─────────── 난이도 설계 ─────────── */
  var LEVELS = {
    easy: { rots: [0],                board: 'guide' },
    mid:  { rots: [0, 90],            board: 'lines' },
    hard: { rots: [0, 90, 180, 270],  board: 'outline' },
    max:  { rots: [0, 90, 180, 270],  board: 'outline' }
  };

  var GAP = 9;          // 조각 사이 오리기 여백(mm) — 8mm 이상
  var INSET = 4;        // 패널 테두리 안쪽 여백(mm)
  var CUT_TOP = 13;     // 조각판 위 ✂ 절취 안내 줄 높이(mm)
  var CUT_SW = 1.1;     // 절취 점선 굵기(mm)
  var GUIDE_SW = 1.0;   // 붙임판 점선 굵기(mm)

  var state = {
    picId: PICS[0].id,
    level: 'easy',
    seed: S.randomSeed(),
    nameDate: true,
    showDone: false,
    dirty: true          // 탭이 숨겨진 동안 변경되면 다시 그릴 표시
  };

  function getPic() {
    for (var i = 0; i < PICS.length; i++) if (PICS[i].id === state.picId) return PICS[i];
    return PICS[0];
  }

  /* ─────────── 기하 도우미 ─────────── */
  function bboxOf(ptsList) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ptsList.forEach(function (p) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function rotPts(pts, deg) {
    var r = deg * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
    return pts.map(function (p) { return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; });
  }
  function centroidOf(pts) {          // 다각형 면적 중심 (번호 배지 위치)
    var a = 0, cx = 0, cy = 0, n = pts.length;
    for (var i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n];
      var cr = p[0] * q[1] - q[0] * p[1];
      a += cr; cx += (p[0] + q[0]) * cr; cy += (p[1] + q[1]) * cr;
    }
    if (Math.abs(a) < 1e-6) { var bb = bboxOf(pts); return [bb.x + bb.w / 2, bb.y + bb.h / 2]; }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function pointIn(pts, x, y) {        // 광선 교차 판정
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function distToEdges(pts, x, y) {    // 다각형 변까지 최소 거리
    var best = Infinity;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var ax = pts[j][0], ay = pts[j][1], bx = pts[i][0], by = pts[i][1];
      var dx = bx - ax, dy = by - ay;
      var t = (dx || dy) ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
      var d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
      if (d < best) best = d;
    }
    return best;
  }
  // 번호 배지 자리: 면적 중심이 다각형 밖(오목 조각)이거나 변에 너무 붙으면
  // 안쪽에서 변과 가장 먼 점을 찾아 쓴다.
  function labelPos(pts) {
    var c = centroidOf(pts);
    if (pointIn(pts, c[0], c[1]) && distToEdges(pts, c[0], c[1]) >= 6.5) return c;
    var bb = bboxOf(pts), best = c, bestD = -1, N = 24;
    for (var i = 1; i < N; i++) for (var j = 1; j < N; j++) {
      var x = bb.x + bb.w * i / N, y = bb.y + bb.h * j / N;
      if (!pointIn(pts, x, y)) continue;
      var d = distToEdges(pts, x, y);
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
    return best;
  }
  function ptsAttr(pts) {
    return pts.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ');
  }
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ─────────── 조각판 채우기(선반 포장) ───────────
   * items: {w,h}(mm). 높이 큰 것부터 줄을 채우고, 줄·조각 사이 GAP 확보. 실패하면 null.
   */
  function pack(items, availW, availH) {
    var sorted = items.slice().sort(function (a, b) { return b.h - a.h; });
    var rows = [], row = { items: [], w: 0, h: 0 };
    sorted.forEach(function (it) {
      var need = row.items.length ? row.w + GAP + it.w : it.w;
      if (need > availW && row.items.length) {
        rows.push(row); row = { items: [], w: 0, h: 0 };
        need = it.w;
      }
      row.items.push(it); row.w = need; if (it.h > row.h) row.h = it.h;
    });
    rows.push(row);
    if (rows.some(function (r) { return r.w > availW; })) return null;
    var totH = rows.reduce(function (s, r) { return s + r.h; }, 0) + GAP * (rows.length - 1);
    if (totH > availH) return null;

    var out = [];
    var y = (availH - totH) / 2;
    rows.forEach(function (r) {
      var x = (availW - r.w) / 2;
      r.items.forEach(function (it) {
        out.push({ ref: it, x: x, y: y + (r.h - it.h) / 2 });
        x += it.w + GAP;
      });
      y += r.h + GAP;
    });
    return out;
  }

  /* ─────────── 렌더 ─────────── */
  function render() {
    var pic = getPic();
    var pieces = pic.piecesByLevel[state.level] || pic.piecesByLevel.hard;
    var cfg = LEVELS[state.level];
    var rand = S.mulberry32(state.seed);

    // 시트 골격 2장 (조각판에는 이름·날짜 칸 없음 — 오려서 없어지는 종이)
    var bodyP = S.frameInto($('sheet-pieces'), {
      title: '도형 붙이기 ① 조각판 — ' + pic.name,
      instruction: '점선을 따라 색 조각을 오려 주세요.',
      nameDate: false
    });
    var bodyB = S.frameInto($('sheet-board'), {
      title: '도형 붙이기 ② 붙임판 — ' + pic.name,
      instruction: '색 도형을 오려서 모양에 맞게 붙여 보세요.',
      nameDate: state.nameDate
    });

    // 본문 크기(mm) — 실제 렌더 높이를 재고, 숨겨져 있으면 추정치 사용
    var pxPerMm = 96 / 25.4;
    var W = S.PAGE.w - S.PAGE.pad * 2;
    var estH = S.PAGE.h - S.PAGE.pad * 2 - 36 - 8;
    var Hp = bodyP.clientHeight ? bodyP.clientHeight / pxPerMm - 1 : estH;
    var Hb = bodyB.clientHeight ? bodyB.clientHeight / pxPerMm - 1 : estH;

    // 조각 준비: 시드 회전 + 자체 bbox 기준 정규화
    var prep = pieces.map(function (pc, i) {
      var rset = cfg.rots;
      var rot = rset[Math.floor(rand() * rset.length)];
      var rp = rotPts(pc.points, rot);
      var bb = bboxOf(rp);
      return {
        i: i, color: pc.color, rot: rot,
        pts: rp.map(function (p) { return [p[0] - bb.x, p[1] - bb.y]; }),
        w: bb.w, h: bb.h
      };
    });

    // 완성 도안 bbox
    var allPts = [];
    pieces.forEach(function (pc) { allPts = allPts.concat(pc.points); });
    var abb = bboxOf(allPts);

    // 배율 k(mm/u) 결정 — 붙임판에 들어가는 최대치에서 시작해 조각판에 들어갈 때까지 축소.
    // 두 장 모두 같은 k를 쓴다(조각=자리 실물 일치).
    var pAvailW = W - INSET * 2, pAvailH = Hp - CUT_TOP - INSET * 2;
    var bAvailW = W - INSET * 2, bAvailH = Hb - INSET * 2;
    var k = Math.min(bAvailW / abb.w, bAvailH / abb.h, 3.4);
    var placed = null;
    while (k > 0.5) {
      placed = pack(prep.map(function (p) { return { p: p, w: p.w * k, h: p.h * k }; }), pAvailW, pAvailH);
      if (placed) break;
      k *= 0.95;
    }
    if (!placed) placed = [];   // 이론상 도달하지 않음

    /* ── 1장: 조각판 ── */
    var svgP = S.svg('svg', {
      viewBox: '0 0 ' + W + ' ' + Hp, width: W + 'mm', height: Hp + 'mm',
      'data-k': k.toFixed(4), 'data-sheet': 'pieces'
    });
    svgP.appendChild(S.svg('rect', {
      x: 0.5, y: 0.5, width: W - 1, height: Hp - 1, rx: 3,
      fill: 'none', stroke: '#9aa2ad', 'stroke-width': 0.6
    }));
    // 상단 ✂ 절취 안내 줄
    var sciss = S.svg('text', { x: INSET + 2, y: CUT_TOP - 4, 'font-size': 8, fill: '#333' });
    sciss.textContent = '✂';
    svgP.appendChild(sciss);
    svgP.appendChild(S.svg('line', {
      x1: INSET + 13, y1: CUT_TOP - 6.5, x2: W - INSET, y2: CUT_TOP - 6.5,
      stroke: '#777', 'stroke-width': 0.5, 'stroke-dasharray': '4 3'
    }));

    placed.forEach(function (pl) {
      var p = pl.ref.p;
      var ox = INSET + pl.x, oy = CUT_TOP + INSET + pl.y;
      var abs = p.pts.map(function (q) { return [q[0] * k + ox, q[1] * k + oy]; });
      svgP.appendChild(S.svg('polygon', {
        points: ptsAttr(abs),
        fill: p.color,
        stroke: '#222', 'stroke-width': CUT_SW,
        'stroke-dasharray': '3.2 2.4', 'stroke-linejoin': 'round',
        'data-idx': p.i
      }));
      if (cfg.board === 'guide') addBadge(svgP, labelPos(abs), p.i + 1);
    });
    bodyP.appendChild(svgP);

    /* ── 2장: 붙임판 ── */
    var svgB = S.svg('svg', {
      viewBox: '0 0 ' + W + ' ' + Hb, width: W + 'mm', height: Hb + 'mm',
      'data-k': k.toFixed(4), 'data-sheet': 'board'
    });
    var ox2 = (W - abb.w * k) / 2, oy2 = (Hb - abb.h * k) / 2;
    function T(pts) {
      return pts.map(function (p) { return [(p[0] - abb.x) * k + ox2, (p[1] - abb.y) * k + oy2]; });
    }

    if (cfg.board === 'outline') {
      (pic.outlines || []).forEach(function (poly) {
        svgB.appendChild(S.svg('polygon', {
          points: ptsAttr(T(poly)),
          fill: 'none', stroke: '#333', 'stroke-width': GUIDE_SW + 0.1,
          'stroke-dasharray': '3.6 2.6', 'stroke-linejoin': 'round'
        }));
      });
    } else {
      pieces.forEach(function (pc, i) {
        var abs = T(pc.points);
        var attrs = {
          points: ptsAttr(abs),
          stroke: cfg.board === 'guide' ? '#555' : '#444',
          'stroke-width': GUIDE_SW,
          'stroke-dasharray': '3 2.2', 'stroke-linejoin': 'round',
          'data-idx': i
        };
        if (cfg.board === 'guide') { attrs.fill = pc.color; attrs['fill-opacity'] = 0.2; }
        else attrs.fill = 'none';
        svgB.appendChild(S.svg('polygon', attrs));
        if (cfg.board === 'guide') addBadge(svgB, labelPos(abs), i + 1);
      });
    }
    bodyB.appendChild(svgB);

    renderDone(pic, pieces);
    fit();
  }

  // 번호 배지 (쉬움: 조각과 자리에 같은 번호)
  function addBadge(svg, c, num) {
    svg.appendChild(S.svg('circle', {
      cx: c[0].toFixed(2), cy: c[1].toFixed(2), r: 6,
      fill: '#fff', stroke: '#333', 'stroke-width': 0.5
    }));
    var t = S.svg('text', {
      x: c[0].toFixed(2), y: c[1].toFixed(2), dy: 2.6,
      'text-anchor': 'middle', 'font-size': 7.5, 'font-weight': 700, fill: '#1F3864'
    });
    t.textContent = String(num);
    svg.appendChild(t);
  }

  // 완성 그림 미리보기 (직원 확인용 — 화면 전용)
  function renderDone(pic, pieces) {
    var box = $('arr-done-svg');
    box.innerHTML = '';
    var allPts = [];
    pieces.forEach(function (pc) { allPts = allPts.concat(pc.points); });
    var bb = bboxOf(allPts);
    var svg = S.svg('svg', {
      viewBox: (bb.x - 2) + ' ' + (bb.y - 2) + ' ' + (bb.w + 4) + ' ' + (bb.h + 4)
    });
    pieces.forEach(function (pc) {
      svg.appendChild(S.svg('polygon', {
        points: ptsAttr(pc.points), fill: pc.color,
        stroke: '#fff', 'stroke-width': 0.8, 'stroke-linejoin': 'round'
      }));
    });
    box.appendChild(svg);
  }

  function fit() {
    S.fitPair($('arr-wrap-pieces'), $('sheet-pieces'));
    S.fitPair($('arr-wrap-board'), $('sheet-board'));
  }
  function visible() { return !$('workspace-arr').hidden; }
  function refresh() {
    if (visible()) { state.dirty = false; render(); }
    else state.dirty = true;
  }

  /* ─────────── 화면 컨트롤 ─────────── */
  // 도안 버튼 생성
  var picList = $('arr-pics');
  PICS.forEach(function (pic) {
    var b = S.el('button', 'pic-btn' + (pic.id === state.picId ? ' sel' : ''));
    b.dataset.pic = pic.id;
    b.appendChild(S.el('span', 'pic-emoji', pic.emoji));
    b.appendChild(S.el('span', 'pic-name', pic.name));
    picList.appendChild(b);
  });
  picList.addEventListener('click', function (e) {
    var btn = e.target.closest('.pic-btn');
    if (!btn) return;
    state.picId = btn.dataset.pic;
    picList.querySelectorAll('.pic-btn').forEach(function (b) {
      b.classList.toggle('sel', b === btn);
    });
    refresh();
  });

  $('arr-level-btns').addEventListener('click', function (e) {
    var btn = e.target.closest('.level-btn');
    if (!btn) return;
    state.level = btn.dataset.level;
    document.querySelectorAll('#arr-level-btns .level-btn').forEach(function (b) {
      b.classList.toggle('sel', b === btn);
    });
    refresh();
  });

  $('arr-btn-new').addEventListener('click', function () {
    state.seed = S.randomSeed();
    refresh();
  });

  $('arr-opt-namedate').addEventListener('change', function (e) {
    state.nameDate = e.target.checked;
    refresh();
  });

  $('arr-opt-done').addEventListener('change', function (e) {
    state.showDone = e.target.checked;
    $('arr-done').hidden = !state.showDone;
  });

  document.querySelectorAll('input[name="paper-arr"]').forEach(function (r) {
    r.addEventListener('change', function (e) {
      if (e.target.checked) S.setPaper(e.target.value);
    });
  });
  S.onPaper(function (p) {
    document.querySelectorAll('input[name="paper-arr"]').forEach(function (r) {
      r.checked = r.value === p;
    });
    refresh();
  });

  S.bindPrint('arr-btn-print');
  window.addEventListener('resize', function () { if (visible()) fit(); });

  // 탭에서 이 화면을 열 때 (count.js의 탭 전환이 호출)
  window.ArrangeTab = {
    show: function () {
      if (state.dirty) { state.dirty = false; render(); }
      else fit();
    }
  };
})();
