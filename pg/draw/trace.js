/* ═══════════ 그림 학습지 — 줄 따라 색칠 생성기 ═══════════
 * 얽힌 줄 여러 가닥을 눈으로 따라가며 한 가닥씩 같은 색으로 칠하는
 * 지속 주의력·시각 추적 학습지. 테마: 실타래 / 연날리기 / 리본.
 * - 도안 데이터 없음: 시드 난수(mulberry32)로 매번 절차 생성.
 *   시작점(한쪽 가장자리 등분) → 경유점 2~5개 → 끝점(반대쪽 가장자리, 셔플 순서)
 *   을 Catmull-Rom → 베지어 곡선으로 부드럽게 잇는다.
 * - 교차 표현(켈틱 매듭 기법): 각 줄을 "넓은 흰 몸통 → 검정 윤곽 → 흰 속"
 *   순서로 그려서, 나중에 그린 줄이 위로 지나가고 아래 줄은 교차점에서
 *   끊겨 보인다. 교차점 좌표 계산이 필요 없다.
 * - 품질 검사: 교차 횟수가 난이도 범위를 벗어나거나, 줄끼리 나란히 붙어
 *   가는 구간이 있거나, 남의 시작·끝 배지를 침범하면 다시 생성(최대 수십 회).
 * - 크기(mm)는 A3 세로 기본 기준. 시작 원 지름 20mm 이상(손가락을 얹는 원).
 * - 어르신 지면에는 난이도 이름을 인쇄하지 않는다.
 */
(function () {
  'use strict';

  var S = window.Sheet;
  var $ = function (id) { return document.getElementById(id); };

  /* 색연필 색 — pg/pixel 12색 계열 중 서로 뚜렷이 구분되는 7색만 */
  var COLORS = ['#E53935', '#1976D2', '#F57C00', '#388E3C', '#7B1FA2', '#6D4C41', '#F48FB1'];

  /* ─────────── 난이도 설계 (인지학습지개발팀 확정, A3 기준 mm) ───────────
   * strands 가닥 수, cross 전체 교차 횟수 범위, band 색칠 띠 폭(mm),
   * way 경유점 수, loops 고리(되감기) 수, gentle 완만한 곡선 여부 */
  /* mix: 경유점이 자기 직선 경로에서 벗어나는 정도(가로축 비율) —
   * 교차가 범위를 벗어나면 makeProblem이 이 값을 늘리거나 줄여 재시도한다. */
  var LEVELS = {
    easy: { strands: [2, 2], cross: [2, 4],   band: 14, way: [2, 2], loops: [0, 0], mix: 0.32 },
    mid:  { strands: [3, 3], cross: [6, 10],  band: 11, way: [2, 3], loops: [0, 0], mix: 0.55 },
    hard: { strands: [4, 5], cross: [12, 20], band: 8,  way: [3, 4], loops: [1, 2], mix: 0.55 },
    max:  { strands: [6, 7], cross: [25, 40], band: 6,  way: [4, 5], loops: [2, 3], mix: 0.5 }
  };

  /* 테마 — axis h: 왼쪽→오른쪽(실타래·리본), v: 아래→위(연날리기).
   * startM 시작 원 중심, startDeco/endDeco 장식 중심, endBadge 끝 배지 중심(진행축 mm) */
  var THEMES = {
    yarn:   { name: '실타래',   axis: 'h', startM: 24, startDeco: 9, endBadge: 22, endDeco: 10 },
    kite:   { name: '연날리기', axis: 'v', startM: 24, startDeco: 8, endBadge: 26, endDeco: 12 },
    ribbon: { name: '리본',     axis: 'h', startM: 24, startDeco: 9, endBadge: 22, endDeco: 10 }
  };

  var EDGE_PAD = 16;    // 시작·끝 원의 가로축(줄 배열 방향) 최소 여백(mm)
  var OW = 0.9;         // 검정 윤곽 두께(mm)
  var GAPW = 1.7;       // 교차점에서 아래 줄이 끊겨 보이는 흰 틈(한쪽, mm)
  var START_R = 10.5;   // 시작 원 반지름 — 지름 21mm(20mm 이상 유지)
  var END_R = 6;        // 끝 번호 배지 반지름
  var SAMP = 18;        // 베지어 한 구간당 표본 수(품질 검사용)
  var TRIES = 110;      // 품질 검사 재생성 한도 (시도당 1~2ms)

  var state = {
    theme: 'yarn',
    level: 'mid',
    seed: S.randomSeed(),
    nameDate: true,
    showAnswer: false,
    dirty: true
  };

  /* ─────────── 작은 도우미 ─────────── */
  function fx(v) { return (Math.round(v * 100) / 100).toString(); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ri(rand, a, b) { return a + Math.floor(rand() * (b - a + 1)); }
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* Catmull-Rom → 베지어. 경로 문자열과 품질 검사용 표본점을 함께 만든다. */
  function catmull(P) {
    var pts = [P[0]].concat(P, [P[P.length - 1]]);
    var d = 'M ' + fx(P[0][0]) + ' ' + fx(P[0][1]);
    var samples = [P[0]];
    for (var i = 1; i < pts.length - 2; i++) {
      var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ' C ' + fx(c1[0]) + ' ' + fx(c1[1]) + ', ' + fx(c2[0]) + ' ' + fx(c2[1]) +
           ', ' + fx(p2[0]) + ' ' + fx(p2[1]);
      for (var t = 1; t <= SAMP; t++) {
        var u = t / SAMP, v = 1 - u;
        samples.push([
          v * v * v * p1[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p2[0],
          v * v * v * p1[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p2[1]
        ]);
      }
    }
    return { d: d, samples: samples };
  }

  function segCross(p, q, r, s) {
    var d1 = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    var d2 = (q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]);
    var d3 = (s[0] - r[0]) * (p[1] - r[1]) - (s[1] - r[1]) * (p[0] - r[0]);
    var d4 = (s[0] - r[0]) * (q[1] - r[1]) - (s[1] - r[1]) * (q[0] - r[0]);
    return d1 * d2 < 0 && d3 * d4 < 0;
  }

  // 두 표본 폴리라인의 교차 수 (표본 2개씩 건너 굵은 선분으로 검사)
  function countCrossings(A, B, self, out) {
    var c = 0;
    for (var i = 2; i < A.length; i += 2) {
      var j0 = self ? i + 6 : 2;             // 자기 교차: 이웃 선분은 건너뜀
      for (var j = j0; j < B.length; j += 2) {
        if (segCross(A[i - 2], A[i], B[j - 2], B[j])) {
          c++;
          if (out) out.push([(A[i - 2][0] + A[i][0] + B[j - 2][0] + B[j][0]) / 4,
                             (A[i - 2][1] + A[i][1] + B[j - 2][1] + B[j][1]) / 4]);
        }
      }
    }
    return c;
  }

  // 두 줄이 thresh(mm)보다 가깝게 "나란히"(방향 차 25도 이내) 이어 달리는
  // 최장 구간 길이(mm). 교차점 부근은 방향이 엇갈리므로 걸리지 않는다.
  function parallelRun(A, B, thresh) {
    var t2 = thresh * thresh;
    var run = 0, maxRun = 0;
    for (var i = 2; i < A.length - 2; i += 2) {
      var p = A[i], best = Infinity, bj = 0;
      for (var j = 0; j < B.length; j += 2) {
        var dx = p[0] - B[j][0], dy = p[1] - B[j][1];
        var d = dx * dx + dy * dy;
        if (d < best) { best = d; bj = j; }
      }
      var near = false;
      if (best < t2) {
        var a0 = A[i - 2], a1 = A[i + 2];
        var b0 = B[Math.max(0, bj - 2)], b1 = B[Math.min(B.length - 1, bj + 2)];
        var ax = a1[0] - a0[0], ay = a1[1] - a0[1];
        var bx = b1[0] - b0[0], by = b1[1] - b0[1];
        var dot = Math.abs(ax * bx + ay * by);
        var lab = Math.hypot(ax, ay) * Math.hypot(bx, by) || 1;
        near = dot / lab > 0.906;                    // cos 25° — 거의 같은 방향
      }
      if (near) {
        run += Math.hypot(A[i][0] - A[i - 2][0], A[i][1] - A[i - 2][1]);
        if (run > maxRun) maxRun = run;
      } else run = 0;
    }
    return maxRun;
  }

  /* ─────────── 한 번의 생성 시도 (amp: 흔들림 배율) ─────────── */
  function attempt(rand, cfg, th, n, band, W, H, amp) {
    var horiz = th.axis === 'h';
    var L = horiz ? W : H;              // 진행축 길이
    var Wc = horiz ? H : W;             // 가로축(줄 배열 방향) 길이
    function MP(m, c) { return horiz ? [m, c] : [c, H - m]; }

    var lane = (Wc - EDGE_PAD * 2) / n;
    var perm = [];
    for (var i0 = 0; i0 < n; i0++) perm.push(i0);
    shuffle(perm, rand);                 // 끝점은 셔플 순서

    var m0 = th.startM + START_R + 10;   // 경유점 진행축 범위
    var m1 = L - th.endBadge - END_R - 8;
    var cPad = 13 + band / 2;            // 경유점 가로축 여백
    var endMM = L - th.endBadge;

    var strands = [];
    for (var i = 0; i < n; i++) {
      var sc = EDGE_PAD + lane * (i + 0.5);
      var ec = EDGE_PAD + lane * (perm[i] + 0.5);
      var nw = ri(rand, cfg.way[0], cfg.way[1]);
      var P = [[th.startM, sc]];
      var span = m1 - m0;
      for (var k = 0; k < nw; k++) {
        var m = m0 + span * (k + 0.5) / nw + (rand() * 2 - 1) * (span / nw) * 0.3;
        // 자기 직선 경로(corridor)에서 mix·amp 만큼 벗어난다
        var base = sc + (ec - sc) * ((m - th.startM) / (endMM - th.startM));
        var c = base + (rand() * 2 - 1) * Wc * cfg.mix * amp;
        P.push([clamp(m, m0, m1), clamp(c, cPad, Wc - cPad)]);
      }
      P.push([endMM, ec]);
      strands.push({ i: i, P: P, sc: sc, ec: ec });
    }

    // 고리·되감기 삽입 (어려움·도전): 경유점 하나를 원 궤도 5점으로 바꾼다
    var nl = ri(rand, cfg.loops[0], cfg.loops[1]);
    for (var l = 0; l < nl; l++) {
      var st = strands[Math.floor(rand() * n)];
      if (st.P.length < 3) continue;
      var wi = 1 + Math.floor(rand() * (st.P.length - 2));
      var r = band + 9;
      var lm = clamp(st.P[wi][0], m0 + r, m1 - r);
      var lc = clamp(st.P[wi][1], cPad + r, Wc - cPad - r);
      var dir = rand() < 0.5 ? 1 : -1;
      st.P.splice(wi, 1,
        [lm - r, lc], [lm, lc - r * dir], [lm + r, lc],
        [lm, lc + r * dir], [lm - r * 0.85, lc + r * 0.3 * dir]);
    }

    // 페이지 좌표로 사상 후 곡선·표본 생성
    strands.forEach(function (st) {
      var cur = catmull(st.P.map(function (p) { return MP(p[0], p[1]); }));
      st.d = cur.d;
      st.samples = cur.samples;
      st.start = MP(th.startM, st.sc);
      st.end = MP(endMM, st.ec);
      st.startDeco = MP(th.startDeco, st.sc);
      st.endDeco = MP(L - th.endDeco, st.ec);
    });

    // ── 품질 검사 ──
    var crossings = 0, crossPts = [];
    var perStrand = [];
    var thresh = band + 2;               // 두 띠가 이보다 가까우면 "붙었다"
    var okProx = true;
    for (var a = 0; a < n; a++) perStrand.push(0);
    for (a = 0; a < n; a++) {
      var cs = countCrossings(strands[a].samples, strands[a].samples, true, crossPts);
      crossings += cs; perStrand[a] += cs;
      for (var b = a + 1; b < n; b++) {
        var cp = countCrossings(strands[a].samples, strands[b].samples, false, crossPts);
        crossings += cp; perStrand[a] += cp; perStrand[b] += cp;
        if (okProx && parallelRun(strands[a].samples, strands[b].samples, thresh) >
            Math.max(20, thresh * 1.6)) {
          okProx = false;                // 나란히 붙어 가는 구간 금지
        }
      }
    }

    // 남의 시작 원·끝 배지를 지나가면 안 됨
    var okAnchor = true;
    outer:
    for (var x = 0; x < n; x++) {
      for (var y = 0; y < n; y++) {
        if (x === y) continue;
        var s1 = strands[y].start, e1 = strands[y].end;
        var rs = START_R + band / 2, re = END_R + band / 2;
        var sm = strands[x].samples;
        for (var q = 0; q < sm.length; q += 2) {
          if (Math.hypot(sm[q][0] - s1[0], sm[q][1] - s1[1]) < rs ||
              Math.hypot(sm[q][0] - e1[0], sm[q][1] - e1[1]) < re) {
            okAnchor = false; break outer;
          }
        }
      }
    }

    return { strands: strands, n: n, crossings: crossings, crossPts: crossPts,
             perStrand: perStrand, okProx: okProx, okAnchor: okAnchor };
  }

  /* ─────────── 품질 검사를 통과할 때까지 재생성 ─────────── */
  function makeProblem(W, H) {
    var cfg = LEVELS[state.level];
    var th = THEMES[state.theme];
    var rand = S.mulberry32(state.seed);
    var band = Math.max(4.5, cfg.band * S.PAGE.w / 297);   // A4는 띠 폭을 비례 축소
    var n = ri(rand, cfg.strands[0], cfg.strands[1]);

    var best = null, bestPen = Infinity, amp = 1;
    for (var t = 0; t < TRIES; t++) {
      var at = attempt(rand, cfg, th, n, band, W, H, amp);
      var pen = 0;
      if (at.crossings < cfg.cross[0]) pen += (cfg.cross[0] - at.crossings) * 2;
      if (at.crossings > cfg.cross[1]) pen += at.crossings - cfg.cross[1];
      if (!at.okProx) pen += 60;
      if (!at.okAnchor) pen += 30;
      // 보통부터: 한 번도 엇갈리지 않는 "심심한 줄"이 없게 (어려움·도전은 2회 이상)
      var minPer = state.level === 'easy' ? 0 : (state.level === 'mid' ? 1 : 2);
      at.perStrand.forEach(function (c) { if (c < minPer) pen += (minPer - c) * 8; });
      if (pen < bestPen) { bestPen = pen; best = at; best.tries = t + 1; best.pen = pen; }
      if (pen === 0) break;
      // 교차가 많으면 흔들림을 줄이고, 적으면 키워서 범위 안으로 유도
      if (at.crossings > cfg.cross[1]) amp = Math.max(0.25, amp * 0.85);
      else if (at.crossings < cfg.cross[0]) amp = Math.min(1.6, amp * 1.15);
    }
    best.band = band;
    best.theme = th;
    return best;
  }

  /* ─────────── 테마 장식 (간단 SVG — 유아 만화 눈·웃는 얼굴 없음) ─────────── */
  function decoPath(g, d, attrs) {
    var a = { d: d, fill: 'none', stroke: '#333', 'stroke-width': 0.7,
              'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    if (attrs) for (var k in attrs) a[k] = attrs[k];
    g.appendChild(S.svg('path', a));
  }

  function buildDeco(theme, side, color, idx) {
    var g = S.svg('g');
    if (theme === 'yarn' && side === 'start') {           // 실타래: 겹친 원 + 감긴 실 빗금
      g.appendChild(S.svg('circle', { r: 7, fill: '#fff' }));
      g.appendChild(S.svg('circle', { r: 7, fill: color, 'fill-opacity': 0.22,
                                      stroke: '#333', 'stroke-width': 0.9 }));
      ['M -6 -2.5 Q 0 -5.5 6 -2.5', 'M -6.3 0.8 Q 0 -2.2 6.3 0.8', 'M -5.5 3.8 Q 0 1.2 5.5 3.8',
       'M -2.5 -6.4 Q -5.5 0 -2.5 6.4', 'M 2.5 -6.4 Q 5.5 0 2.5 6.4'
      ].forEach(function (d) { decoPath(g, d, { 'stroke-width': 0.55 }); });
    } else if (theme === 'yarn') {                        // 바늘(귀 구멍 있는 실바늘)
      var ng = S.svg('g', { transform: 'rotate(-38)' });
      ng.appendChild(S.svg('line', { x1: -8.5, y1: 0, x2: 8.5, y2: 0,
                                     stroke: '#333', 'stroke-width': 1.1, 'stroke-linecap': 'round' }));
      ng.appendChild(S.svg('ellipse', { cx: -5.8, cy: 0, rx: 2.1, ry: 1,
                                        fill: '#fff', stroke: '#333', 'stroke-width': 0.7 }));
      g.appendChild(ng);
    } else if (theme === 'kite' && side === 'start') {    // 얼레(실감개): 틀 + 십자 + 손잡이
      g.appendChild(S.svg('rect', { x: -6, y: -4.5, width: 12, height: 9, rx: 0.8,
                                    fill: '#fff', stroke: '#333', 'stroke-width': 0.9 }));
      decoPath(g, 'M -6 -4.5 L 6 4.5 M -6 4.5 L 6 -4.5', { 'stroke-width': 0.55 });
      g.appendChild(S.svg('circle', { r: 1.2, fill: '#333' }));
      g.appendChild(S.svg('line', { x1: 7, y1: 0, x2: 10, y2: 0,
                                    stroke: '#333', 'stroke-width': 0.9, 'stroke-linecap': 'round' }));
    } else if (theme === 'kite') {
      if (idx % 2 === 0) {                                // 방패연: 사각 + 방구멍 + 살
        g.appendChild(S.svg('rect', { x: -7.5, y: -10, width: 15, height: 20, rx: 0.6,
                                      fill: color, 'fill-opacity': 0.2,
                                      stroke: '#333', 'stroke-width': 1 }));
        decoPath(g, 'M -7.5 -10 L 7.5 10 M -7.5 10 L 7.5 -10 M 0 -10 L 0 10', { 'stroke-width': 0.5 });
        g.appendChild(S.svg('circle', { r: 3.2, fill: '#fff', stroke: '#333', 'stroke-width': 0.8 }));
      } else {                                            // 가오리연: 마름모 + 꼬리
        decoPath(g, 'M 0 -9.5 L 7.5 -1.5 L 0 3.5 L -7.5 -1.5 Z',
                 { fill: color, 'fill-opacity': 0.2, 'stroke-width': 1 });
        decoPath(g, 'M 0 3.5 q 2.5 3.5 0 6.5 q -2.5 3 0 6');
      }
    } else if (theme === 'ribbon' && side === 'start') {  // 나비매듭 실루엣
      var bg = S.svg('g', { transform: 'scale(0.85)' });
      decoPath(bg, 'M -1.2 0 C -5 -6, -11.5 -4.5, -10 0 C -11.5 4.5, -5 6, -1.2 0 Z',
               { fill: color, 'fill-opacity': 0.22, 'stroke-width': 0.9 });
      decoPath(bg, 'M 1.2 0 C 5 -6, 11.5 -4.5, 10 0 C 11.5 4.5, 5 6, 1.2 0 Z',
               { fill: color, 'fill-opacity': 0.22, 'stroke-width': 0.9 });
      decoPath(bg, 'M -1.6 2 L -4.5 8 M 1.6 2 L 4.5 8', { 'stroke-width': 0.8 });
      bg.appendChild(S.svg('circle', { r: 2.2, fill: color, 'fill-opacity': 0.35,
                                       stroke: '#333', 'stroke-width': 0.8 }));
      g.appendChild(bg);
    } else if (theme === 'ribbon') {                      // 선물상자: 사각 + 리본줄
      g.appendChild(S.svg('rect', { x: -8, y: -6.5, width: 16, height: 3.5,
                                    fill: color, 'fill-opacity': 0.3, stroke: '#333', 'stroke-width': 0.9 }));
      g.appendChild(S.svg('rect', { x: -6.5, y: -3, width: 13, height: 9.5,
                                    fill: color, 'fill-opacity': 0.15, stroke: '#333', 'stroke-width': 0.9 }));
      g.appendChild(S.svg('line', { x1: 0, y1: -6.5, x2: 0, y2: 6.5,
                                    stroke: color, 'stroke-width': 1.6 }));
      g.appendChild(S.svg('circle', { cx: -2, cy: -8, r: 1.7, fill: 'none', stroke: '#333', 'stroke-width': 0.8 }));
      g.appendChild(S.svg('circle', { cx: 2, cy: -8, r: 1.7, fill: 'none', stroke: '#333', 'stroke-width': 0.8 }));
    }
    return g;
  }

  /* ─────────── 시트 렌더 ─────────── */
  function render() {
    var cfg = LEVELS[state.level];
    var simple = state.level === 'easy' || state.level === 'mid';
    var body = S.frameInto($('sheet-line'), {
      title: '줄 따라 색칠',
      instruction: '줄을 끝까지 따라가며 색칠해 보세요.' +
                   (simple ? ' 시작 동그라미의 색으로 칠해 주세요.' : ''),
      nameDate: state.nameDate
    });

    var pxPerMm = 96 / 25.4;
    var W = S.PAGE.w - S.PAGE.pad * 2;
    var H = body.clientHeight
      ? body.clientHeight / pxPerMm - 1
      : S.PAGE.h - S.PAGE.pad * 2 - 36 - 8 - 4;

    var prob = makeProblem(W, H);
    var band = prob.band;

    var svg = S.svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W + 'mm', height: H + 'mm' });

    // 줄이 테두리를 넘지 않게 안쪽으로 클리핑
    var defs = S.svg('defs');
    var clip = S.svg('clipPath', { id: 'trace-clip' });
    clip.appendChild(S.svg('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 2 }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    // ── 줄(가닥) — 켈틱 매듭 기법: 흰 넓은 몸통 → 검정 윤곽 → 흰 속 ──
    var gs = S.svg('g', { 'clip-path': 'url(#trace-clip)' });
    prob.strands.forEach(function (st, idx) {
      var color = COLORS[idx % COLORS.length];
      var base = { d: st.d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
      function pass(stroke, w, extra) {
        var a = { d: base.d, fill: 'none', stroke: stroke, 'stroke-width': fx(w),
                  'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
        if (extra) for (var k in extra) a[k] = extra[k];
        gs.appendChild(S.svg('path', a));
      }
      pass('#fff', band + OW * 2 + GAPW * 2);        // ① 아래 줄을 여유 있게 지우는 흰 몸통
      pass('#111', band + OW * 2);                   // ② 검정 윤곽(양쪽 2줄이 된다)
      pass('#fff', band);                            // ③ 흰 속(색칠할 띠)
      if (state.showAnswer) {                        // 정답 보기 — 화면 전용(인쇄 안 됨)
        pass(color, band, { 'stroke-opacity': 0.4, 'class': 'trace-answer' });
      }
    });
    svg.appendChild(gs);

    // 테두리(클립 바깥에 그려 줄에 지워지지 않게)
    svg.appendChild(S.svg('rect', {
      x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 3,
      fill: 'none', stroke: '#9aa2ad', 'stroke-width': 1
    }));

    // ── 장식·배지 (줄 위에 얹음) ──
    prob.strands.forEach(function (st, idx) {
      var color = COLORS[idx % COLORS.length];
      var num = String(idx + 1);

      // 장식과 배지를 잇는 가는 실
      svg.appendChild(S.svg('line', {
        x1: fx(st.startDeco[0]), y1: fx(st.startDeco[1]), x2: fx(st.start[0]), y2: fx(st.start[1]),
        stroke: '#666', 'stroke-width': 0.5
      }));
      svg.appendChild(S.svg('line', {
        x1: fx(st.end[0]), y1: fx(st.end[1]), x2: fx(st.endDeco[0]), y2: fx(st.endDeco[1]),
        stroke: '#666', 'stroke-width': 0.5
      }));

      var dS = buildDeco(state.theme, 'start', color, idx);
      dS.setAttribute('transform', 'translate(' + fx(st.startDeco[0]) + ' ' + fx(st.startDeco[1]) + ')');
      svg.appendChild(dS);
      var dE = buildDeco(state.theme, 'end', color, idx);
      dE.setAttribute('transform', 'translate(' + fx(st.endDeco[0]) + ' ' + fx(st.endDeco[1]) + ')');
      svg.appendChild(dE);

      // 끝 번호 배지 (시작과 같은 번호·색 테두리 — 짝 확인용)
      svg.appendChild(S.svg('circle', {
        cx: fx(st.end[0]), cy: fx(st.end[1]), r: END_R,
        fill: '#fff', stroke: color, 'stroke-width': 1.2
      }));
      var tE = S.svg('text', {
        x: fx(st.end[0]), y: fx(st.end[1]), dy: 2.3,
        'text-anchor': 'middle', 'font-size': 6.5, 'font-weight': 700, fill: '#111'
      });
      tE.textContent = num;
      svg.appendChild(tE);

      // 시작 원 — 지름 21mm, 손가락을 얹는 원. 큰 번호 + 색 견본 동그라미
      svg.appendChild(S.svg('circle', {
        cx: fx(st.start[0]), cy: fx(st.start[1]), r: START_R,
        fill: '#fff', stroke: color, 'stroke-width': 1.8
      }));
      var tS = S.svg('text', {
        x: fx(st.start[0]), y: fx(st.start[1] - 2.6), dy: 3.2,
        'text-anchor': 'middle', 'font-size': 9, 'font-weight': 900, fill: '#111'
      });
      tS.textContent = num;
      svg.appendChild(tS);
      svg.appendChild(S.svg('circle', {
        cx: fx(st.start[0]), cy: fx(st.start[1] + 5.6), r: 3.4,
        fill: color, stroke: '#333', 'stroke-width': 0.4
      }));
    });

    body.appendChild(svg);
    fit();

    // 검증·디버그용(화면 표시 없음)
    window.TraceTab._debug = { crossings: prob.crossings, crossPts: prob.crossPts,
                               W: W, H: H, n: prob.n, band: band,
                               tries: prob.tries, pen: prob.pen };
  }

  function fit() { S.fitPair($('line-wrap'), $('sheet-line')); }
  function visible() { return !$('workspace-line').hidden; }
  function refresh() {
    if (visible()) { state.dirty = false; render(); }
    else state.dirty = true;
  }

  /* ─────────── 화면 컨트롤 ─────────── */
  $('line-themes').addEventListener('click', function (e) {
    var btn = e.target.closest('.pic-btn');
    if (!btn) return;
    state.theme = btn.dataset.theme;
    document.querySelectorAll('#line-themes .pic-btn').forEach(function (b) {
      b.classList.toggle('sel', b === btn);
    });
    refresh();
  });

  $('line-level-btns').addEventListener('click', function (e) {
    var btn = e.target.closest('.level-btn');
    if (!btn) return;
    state.level = btn.dataset.level;
    document.querySelectorAll('#line-level-btns .level-btn').forEach(function (b) {
      b.classList.toggle('sel', b === btn);
    });
    refresh();
  });

  $('line-btn-new').addEventListener('click', function () {
    state.seed = S.randomSeed();
    refresh();
  });

  $('line-opt-namedate').addEventListener('change', function (e) {
    state.nameDate = e.target.checked;
    refresh();
  });

  $('line-opt-answer').addEventListener('change', function (e) {
    state.showAnswer = e.target.checked;
    refresh();
  });

  document.querySelectorAll('input[name="paper-line"]').forEach(function (r) {
    r.addEventListener('change', function (e) {
      if (e.target.checked) S.setPaper(e.target.value);
    });
  });
  S.onPaper(function (p) {
    document.querySelectorAll('input[name="paper-line"]').forEach(function (r) {
      r.checked = r.value === p;
    });
    refresh();
  });

  S.bindPrint('line-btn-print');
  window.addEventListener('resize', function () { if (visible()) fit(); });

  // 탭에서 이 화면을 열 때 (count.js의 탭 전환이 호출)
  window.TraceTab = {
    show: function () {
      if (state.dirty) { state.dirty = false; render(); }
      else fit();
    },
    _debug: null
  };
})();
