/* ═══════════ 숫자 색칠 — 도안 데이터 7종 ═══════════
 * 어르신께 친숙한 소재(무궁화·감·장독대·돛단배·기와집·국화·조각보)를
 * 기본 도형 조합(원·타원·베지어 몇 개)으로 그린 숫자 색칠 도안 모음. 유아 만화체 없음.
 *
 * 스키마:
 *  { id, name, emoji, level(1~4), viewBox:[w,h],
 *    regions:[{ path(d문자열), color(의미에 맞는 자연색 hex), label:[x,y], labelSize? }],
 *    outlines?:[{ path, width?(mm) }],       // 색칠하지 않는 장식 선(꼭지 줄·문살 등)
 *    gen?: function(rand) → regions }        // 조각보: 절차 생성(시드 난수, 무한 변형)
 *
 * 규칙:
 *  - color는 colornum.js가 색연필 12색으로 근사 매핑한 뒤 번호를 배정한다.
 *    같은 색 = 같은 번호이므로, 같은 색 영역끼리는 서로 맞닿지 않게 설계한다.
 *  - regions 순서 = 그리는 순서(painter). 겹치는 영역은 뒤에 온 것이 위에 그려진다.
 *  - label은 그 영역의 "보이는 부분" 안에 숫자가 들어가도록 손수 보정한 좌표다.
 *  - 좌표는 도안 자체 단위(u). 숫자 최소 크기(mm)는 colornum.js가 난이도별로 보장한다.
 */
(function () {
  'use strict';

  window.CBN_PICS = window.CBN_PICS || [];
  var P = window.CBN_PICS;

  /* ─────────── 경로 도우미 ─────────── */
  function f(v) { return Math.round(v * 10) / 10; }
  function pt(p) { return f(p[0]) + ' ' + f(p[1]); }
  function circle(cx, cy, r) {
    return 'M ' + f(cx - r) + ' ' + f(cy) +
           ' A ' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(cx + r) + ' ' + f(cy) +
           ' A ' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(cx - r) + ' ' + f(cy) + ' Z';
  }
  function ellipse(cx, cy, rx, ry) {
    return 'M ' + f(cx - rx) + ' ' + f(cy) +
           ' A ' + f(rx) + ' ' + f(ry) + ' 0 1 0 ' + f(cx + rx) + ' ' + f(cy) +
           ' A ' + f(rx) + ' ' + f(ry) + ' 0 1 0 ' + f(cx - rx) + ' ' + f(cy) + ' Z';
  }
  function poly(pts) {
    return 'M ' + pts.map(pt).join(' L ') + ' Z';
  }

  /* 둥근 꽃잎: 중심 (cx,cy)에서 각도 aDeg(도) 방향, 안쪽 r0 → 끝 r1, 반폭 halfW */
  function petal(cx, cy, aDeg, r0, r1, halfW) {
    var a = aDeg * Math.PI / 180;
    var ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    function at(m, c) { return [cx + ux * m + px * c, cy + uy * m + py * c]; }
    var P0 = at(r0, -halfW * 0.55), P1 = at(r0, halfW * 0.55);
    var mid = r0 + (r1 - r0) * 0.42;
    return 'M ' + pt(P0) +
           ' C ' + pt(at(mid, -halfW * 1.35)) + ', ' + pt(at(r1 * 0.97, -halfW * 0.75)) + ', ' + pt(at(r1, 0)) +
           ' C ' + pt(at(r1 * 0.97, halfW * 0.75)) + ', ' + pt(at(mid, halfW * 1.35)) + ', ' + pt(P1) + ' Z';
  }
  function petalLabel(cx, cy, aDeg, r0, r1) {
    var a = aDeg * Math.PI / 180;
    var m = r0 + (r1 - r0) * 0.56;
    return [f(cx + Math.cos(a) * m), f(cy + Math.sin(a) * m)];
  }

  /* 햇살 삼각형: 해 중심 c에서 각도 aDeg, 밑 r0 → 끝 r1, 반폭 halfW */
  function ray(cx, cy, aDeg, r0, r1, halfW) {
    var a = aDeg * Math.PI / 180;
    var ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    return poly([
      [cx + ux * r0 - px * halfW, cy + uy * r0 - py * halfW],
      [cx + ux * r1, cy + uy * r1],
      [cx + ux * r0 + px * halfW, cy + uy * r0 + py * halfW]
    ]);
  }
  function rayLabel(cx, cy, aDeg, r0, r1) {
    var a = aDeg * Math.PI / 180;
    var m = r0 + (r1 - r0) * 0.3;
    return [f(cx + Math.cos(a) * m), f(cy + Math.sin(a) * m)];
  }

  /* ═══════════ ① 무궁화 한 송이 — level 1 (영역 9 · 색 4) ═══════════ */
  (function () {
    var c = [100, 86], ANG = [-90, -18, 54, 126, 198];
    var regions = [
      // 줄기·잎 먼저(꽃이 위에 얹힘)
      { path: poly([[92.5, 104], [107.5, 104], [107.5, 232], [92.5, 232]]),
        color: '#388E3C', label: [100, 222] },                                   // 줄기
      { path: 'M 93 158 C 72 146, 46 152, 40 168 C 46 184, 74 186, 93 172 Z',
        color: '#8BC34A', label: [66, 166] },                                    // 왼 잎
      { path: 'M 107 186 C 128 174, 154 180, 160 196 C 154 212, 126 214, 107 200 Z',
        color: '#8BC34A', label: [134, 194] }                                    // 오른 잎
    ];
    ANG.forEach(function (a) {                                                   // 꽃잎 5장
      regions.push({ path: petal(c[0], c[1], a, 24, 66, 15),
                     color: '#F48FB1', label: petalLabel(c[0], c[1], a, 24, 66) });
    });
    regions.push({ path: circle(c[0], c[1], 21), color: '#E53935', label: [100, 86] }); // 꽃심
    P.push({
      id: 'mugunghwa', name: '무궁화', emoji: '🌺', level: 1,
      viewBox: [200, 250], regions: regions
    });
  })();

  /* ═══════════ ② 감 두 개 달린 가지 — level 1 (영역 7 · 색 4) ═══════════ */
  P.push({
    id: 'gam', name: '감나무 가지', emoji: '🍊', level: 1,
    viewBox: [240, 232],
    regions: [
      { path: 'M 6 26 C 70 14, 160 10, 234 18 L 234 36 C 160 28, 70 32, 6 44 Z',
        color: '#6D4C41', label: [34, 33] },                                     // 가지
      { path: ellipse(80, 168, 46, 44), color: '#F57C00', label: [80, 172] },    // 감 1
      { path: ellipse(172, 128, 40, 39), color: '#F57C00', label: [172, 132] },  // 감 2
      { path: 'M 80 100 C 92 100, 104 106, 106 116 C 96 124, 88 125, 80 125 C 72 125, 64 124, 54 116 C 56 106, 68 100, 80 100 Z',
        color: '#388E3C', label: [80, 112] },                                    // 꼭지 1
      { path: 'M 172 70 C 183 70, 194 75, 196 84 C 187 91, 179 92, 172 92 C 165 92, 157 91, 148 84 C 150 75, 161 70, 172 70 Z',
        color: '#388E3C', label: [172, 80] },                                    // 꼭지 2
      { path: 'M 124 26 C 145 30, 154 48, 147 68 C 126 66, 112 44, 124 26 Z',
        color: '#8BC34A', label: [134, 47] },                                    // 잎 1
      { path: 'M 212 30 C 230 38, 236 56, 230 72 C 212 68, 202 46, 212 30 Z',
        color: '#8BC34A', label: [219, 50] }                                     // 잎 2
    ],
    outlines: [
      { path: 'M 82 34 C 81 58, 80 80, 80 100', width: 2 },                      // 감 1 꼭지 줄
      { path: 'M 172 28 C 171 42, 172 56, 172 70', width: 2 },                   // 감 2 꼭지 줄
      { path: 'M 64 136 C 59 158, 59 184, 64 204  M 96 136 C 101 158, 101 184, 96 204', width: 0.8 }, // 감 1 골
      { path: 'M 158 100 C 154 118, 154 140, 158 156  M 186 100 C 190 118, 190 140, 186 156', width: 0.8 } // 감 2 골
    ]
  });

  /* ═══════════ ③ 장독대 — level 2 (영역 14 · 색 5) ═══════════ */
  (function () {
    var regions = [
      { path: poly([[6, 16], [254, 16], [254, 38], [6, 38]]),
        color: '#212121', label: [128, 28] },                                    // 담장 기와
      { path: poly([[14, 38], [246, 38], [246, 96], [14, 96]]),
        color: '#FFCC99', label: [128, 53] },                                    // 담장
      { path: poly([[8, 176], [252, 176], [252, 200], [8, 200]]),
        color: '#212121', label: [130, 189] }                                    // 장독대 단
    ];
    var outlines = [];
    // 기와 물결(장식 선)
    var sc = 'M 14 38';
    for (var x = 14; x + 24 <= 246; x += 24) sc += ' A 12 7 0 0 0 ' + (x + 24) + ' 38';
    outlines.push({ path: sc, width: 0.8 });

    [46, 118, 190].forEach(function (cx, i) {
      // 항아리 몸통
      regions.push({
        path: 'M ' + (cx - 15) + ' 86 C ' + (cx - 31) + ' 94, ' + (cx - 34) + ' 124, ' + (cx - 27) + ' 150' +
              ' C ' + (cx - 23) + ' 168, ' + (cx - 16) + ' 176, ' + cx + ' 176' +
              ' C ' + (cx + 16) + ' 176, ' + (cx + 23) + ' 168, ' + (cx + 27) + ' 150' +
              ' C ' + (cx + 34) + ' 124, ' + (cx + 31) + ' 94, ' + (cx + 15) + ' 86 Z',
        color: '#6D4C41', label: [cx, 104]
      });
      // 배 띠(무늬 줄)
      regions.push({
        path: 'M ' + (cx - 30) + ' 116 L ' + (cx + 30) + ' 116 C ' + (cx + 31) + ' 122, ' + (cx + 31) + ' 128, ' + (cx + 30) + ' 134' +
              ' L ' + (cx - 30) + ' 134 C ' + (cx - 31) + ' 128, ' + (cx - 31) + ' 122, ' + (cx - 30) + ' 116 Z',
        color: '#FFCC99', label: [cx, 126]
      });
      // 뚜껑
      regions.push({
        path: 'M ' + (cx - 21) + ' 88 C ' + (cx - 18) + ' 72, ' + (cx + 18) + ' 72, ' + (cx + 21) + ' 88' +
              ' C ' + (cx + 10) + ' 91, ' + (cx - 10) + ' 91, ' + (cx - 21) + ' 88 Z',
        color: '#212121', label: [cx, 84]
      });
      outlines.push({ path: circle(cx, 74, 3), width: 0.8 });                    // 뚜껑 꼭지
    });

    // 장독대 옆 붉은 꽃(맨드라미) — 줄기+잎은 한 영역(겹경로)
    regions.push({
      path: poly([[234, 128], [242, 128], [242, 176], [234, 176]]) +
            ' M 234 148 C 222 140, 206 142, 202 152 C 206 162, 224 164, 234 158 Z' +
            ' M 242 152 C 252 144, 260 148, 259 156 C 255 164, 246 164, 242 158 Z',
      color: '#388E3C', label: [218, 152]
    });
    regions.push({
      path: 'M 238 90 C 250 94, 256 106, 252 120 C 246 128, 230 128, 224 120 C 220 106, 226 94, 238 90 Z',
      color: '#E53935', label: [238, 109]
    });
    P.push({
      id: 'jangdok', name: '장독대', emoji: '🏺', level: 2,
      viewBox: [260, 210], regions: regions, outlines: outlines
    });
  })();

  /* ═══════════ ④ 돛단배와 해 — level 2 (영역 14 · 색 6) ═══════════ */
  (function () {
    var sun = [205, 52], RAYS = [-175, -135, -90, -45, 5];
    // 물결 윗선(가로 물결 경로)
    function wave(y, amp) {
      var d = 'M 0 ' + y + ' Q 12.5 ' + (y - amp * 2) + ', 25 ' + y;
      for (var x = 25; x < 250; x += 25) d += ' T ' + (x + 25) + ' ' + y;
      return d;
    }
    var regions = [
      { path: circle(sun[0], sun[1], 22), color: '#E53935', label: [205, 52] }   // 해
    ];
    RAYS.forEach(function (a) {                                                  // 햇살 5개
      regions.push({ path: ray(sun[0], sun[1], a, 27, 44, 7.5),
                     color: '#F57C00', label: rayLabel(sun[0], sun[1], a, 27, 44) });
    });
    regions.push(
      { path: poly([[121, 14], [130, 14], [130, 156], [121, 156]]),
        color: '#6D4C41', label: [125.5, 27] },                                  // 돛대
      { path: poly([[121, 14], [88, 25], [121, 36]]),
        color: '#E53935', label: [112, 25] },                                    // 깃발
      { path: 'M 121 40 C 118 72, 113 106, 105 140 L 44 140 C 64 112, 90 74, 121 40 Z',
        color: '#FDD835', label: [92, 114] },                                    // 왼 돛
      { path: 'M 130 36 C 133 70, 137 106, 143 142 L 206 142 C 188 110, 160 70, 130 36 Z',
        color: '#4FC3F7', label: [162, 116] },                                   // 오른 돛
      { path: poly([[36, 150], [214, 150], [208, 165], [42, 165]]),
        color: '#F57C00', label: [70, 158] },                                    // 뱃전(윗단)
      { path: poly([[42, 165], [208, 165], [186, 198], [64, 198]]),
        color: '#6D4C41', label: [125, 181] },                                   // 배 몸통
      { path: wave(203, 4) + ' L 250 214 L 0 214 Z',
        color: '#4FC3F7', label: [12.5, 206.5] },                                // 물결 1
      { path: wave(212, 4) + ' L 250 220 L 0 220 Z',
        color: '#1976D2', label: [12.5, 215] }                                   // 물결 2
    );
    P.push({
      id: 'boat', name: '돛단배와 해', emoji: '⛵', level: 2,
      viewBox: [250, 220], regions: regions,
      outlines: [
        { path: 'M 60 158 L 190 158', width: 0.8 }                               // 뱃전 널빤지 선
      ]
    });
  })();

  /* ═══════════ ⑤ 기와집과 나무 — level 3 (영역 28 · 색 9) ═══════════ */
  (function () {
    var sun = [40, 34], RAYS = [-170, -125, -80, -35, 10];
    var regions = [
      { path: poly([[0, 202], [260, 202], [260, 236], [0, 236]]),
        color: '#8BC34A', label: [18, 220] },                                    // 마당(풀밭)
      { path: poly([[30, 185], [188, 185], [188, 202], [30, 202]]),
        color: '#212121', label: [60, 194] },                                    // 기단(댓돌)
      { path: ellipse(70, 218, 12, 9), color: '#212121', label: [70, 218] },     // 돌 1
      { path: ellipse(103, 224, 9, 7), color: '#212121', label: [103, 224] },    // 돌 2
      { path: poly([[148, 28], [164, 28], [164, 52], [148, 52]]),
        color: '#6D4C41', label: [156, 38] },                                    // 굴뚝
      { path: poly([[47, 48], [168, 48], [163, 58], [52, 58]]),
        color: '#212121', label: [108, 53] },                                    // 용마루
      { path: 'M 22 86 C 70 94, 145 94, 193 86 L 163 58 L 52 58 Z',
        color: '#1976D2', label: [108, 74] },                                    // 기와지붕
      { path: 'M 22 86 C 70 94, 145 94, 193 86 L 193 95 C 145 103, 70 103, 22 95 Z',
        color: '#212121', label: [50, 93] },                                     // 처마
      { path: poly([[38, 95], [48, 95], [48, 185], [38, 185]]),
        color: '#6D4C41', label: [43, 120] },                                    // 기둥 1
      { path: poly([[82, 95], [92, 95], [92, 185], [82, 185]]),
        color: '#6D4C41', label: [87, 120] },                                    // 기둥 2
      { path: poly([[126, 95], [136, 95], [136, 185], [126, 185]]),
        color: '#6D4C41', label: [131, 120] },                                   // 기둥 3
      { path: poly([[170, 95], [180, 95], [180, 185], [170, 185]]),
        color: '#6D4C41', label: [175, 120] },                                   // 기둥 4
      { path: poly([[48, 95], [82, 95], [82, 185], [48, 185]]),
        color: '#FFCC99', label: [65, 165] },                                    // 왼쪽 벽
      { path: poly([[136, 95], [170, 95], [170, 185], [136, 185]]),
        color: '#FFCC99', label: [153, 165] },                                   // 오른쪽 벽
      { path: poly([[54, 108], [76, 108], [76, 140], [54, 140]]),
        color: '#FDD835', label: [65, 124] },                                    // 왼쪽 창
      { path: poly([[142, 108], [164, 108], [164, 140], [142, 140]]),
        color: '#FDD835', label: [153, 124] },                                   // 오른쪽 창
      { path: poly([[92, 95], [126, 95], [126, 185], [92, 185]]),
        color: '#FDD835', label: [109, 166] },                                   // 문
      { path: circle(sun[0], sun[1], 16), color: '#E53935', label: [40, 34] }    // 해
    ];
    RAYS.forEach(function (a) {                                                  // 햇살 5개
      regions.push({ path: ray(sun[0], sun[1], a, 20, 33, 6),
                     color: '#F57C00', label: rayLabel(sun[0], sun[1], a, 20, 33) });
    });
    regions.push(
      { path: poly([[216, 150], [230, 150], [230, 206], [216, 206]]),
        color: '#6D4C41', label: [223, 192] },                                   // 나무 기둥
      { path: 'M 223 26 C 232 34, 239 46, 242 54 C 230 59, 216 59, 204 54 C 207 46, 214 34, 223 26 Z',
        color: '#388E3C', label: [223, 48] },                                    // 솔잎 1(꼭대기)
      { path: 'M 223 65 C 236 69, 247 79, 251 91 C 233 97, 213 97, 195 91 C 199 79, 210 69, 223 65 Z',
        color: '#388E3C', label: [223, 84] },                                    // 솔잎 2
      { path: 'M 223 103 C 239 107, 252 119, 257 133 C 235 140, 211 140, 189 133 C 194 119, 207 107, 223 103 Z',
        color: '#388E3C', label: [223, 124] },                                   // 솔잎 3
      { path: 'M 223 146 C 240 150, 254 162, 258 176 C 234 184, 212 184, 188 176 C 192 162, 206 150, 223 146 Z',
        color: '#388E3C', label: [223, 167] }                                    // 솔잎 4
    );
    P.push({
      id: 'hanok', name: '기와집과 나무', emoji: '🏡', level: 3,
      viewBox: [260, 240], regions: regions,
      outlines: [
        // 문살(세로 2 + 가로 4, 문 위쪽 절반)
        { path: 'M 103.3 97 L 103.3 148  M 114.7 97 L 114.7 148' +
                '  M 94 110 L 124 110  M 94 123 L 124 123  M 94 136 L 124 136  M 94 148 L 124 148', width: 0.8 },
        // 창살(십자)
        { path: 'M 65 110 L 65 138  M 56 124 L 74 124  M 153 110 L 153 138  M 144 124 L 162 124', width: 0.8 }
      ]
    });
  })();

  /* ═══════════ ⑥ 국화 꽃다발 — level 3 (영역 34 · 색 7) ═══════════ */
  (function () {
    var flowers = [
      { c: [70, 80],  R: 46, off: 0,    color: '#FDD835', cr: 13 },              // 노랑 국화
      { c: [172, 68], R: 44, off: 22.5, color: '#7B1FA2', cr: 12 },              // 보라 국화
      { c: [122, 142], R: 44, off: 11,  color: '#F48FB1', cr: 12 }               // 분홍 국화
    ];
    var regions = [
      // 잎 4장 (꽃·포장지가 위에 얹힘)
      { path: 'M 54 134 C 36 134, 20 148, 16 164 C 32 168, 50 158, 56 142 Z',
        color: '#388E3C', label: [36, 151] },
      { path: 'M 186 130 C 204 130, 220 144, 224 160 C 208 164, 190 154, 184 140 Z',
        color: '#388E3C', label: [204, 147] },
      { path: 'M 84 172 C 66 172, 50 182, 46 196 C 60 202, 78 194, 86 180 Z',
        color: '#388E3C', label: [65, 186] },
      { path: 'M 158 170 C 176 170, 192 180, 196 194 C 182 200, 164 192, 156 178 Z',
        color: '#388E3C', label: [177, 184] }
    ];
    flowers.forEach(function (fl) {                                              // 꽃잎 8장 + 꽃심
      for (var i = 0; i < 8; i++) {
        var a = fl.off + i * 45;
        regions.push({ path: petal(fl.c[0], fl.c[1], a, 16, fl.R, 7),
                       color: fl.color, label: petalLabel(fl.c[0], fl.c[1], a, 16, fl.R) });
      }
      regions.push({ path: circle(fl.c[0], fl.c[1], fl.cr),
                     color: '#F57C00', label: [fl.c[0], fl.c[1]] });
    });
    regions.push(
      { path: poly([[52, 190], [188, 190], [169, 216], [74, 216]]),
        color: '#FFCC99', label: [121, 203] },                                   // 포장지 위
      { path: poly([[74, 216], [169, 216], [161, 230], [82, 230]]),
        color: '#E53935', label: [121, 223] },                                   // 리본 띠
      { path: 'M 82 230 L 161 230 L 138 260 C 126 265, 116 265, 104 260 Z',
        color: '#FFCC99', label: [121, 242] }                                    // 포장지 아래
    );
    P.push({
      id: 'mums', name: '국화 꽃다발', emoji: '💐', level: 3,
      viewBox: [240, 270], regions: regions,
      outlines: [
        { path: 'M 100 232 L 96 256  M 143 232 L 147 256', width: 0.8 }          // 포장지 주름
      ]
    });
  })();

  /* ═══════════ ⑦ 조각보 무늬 — level 4 (절차 생성 · 영역 48~62 · 색 8~10) ═══════════
   * 격자 이분할을 반복해 크기가 다른 사각 칸을 만들고, 일부 칸을 대각선으로
   * 갈라 삼각 조각을 섞는다. 색은 인접 칸끼리 겹치지 않게 배정(시드 난수).
   * [🔀 색 바꾸기]를 누르면 무늬 자체가 새로 생성된다(무한 변형).
   */
  (function () {
    var W = 240, H = 264, MIN = 25;
    var COLORS = ['#E53935', '#F57C00', '#FDD835', '#8BC34A', '#388E3C',
                  '#4FC3F7', '#1976D2', '#7B1FA2', '#F48FB1', '#FFCC99'];

    function shuffle(arr, rand) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(rand() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    }

    // 변을 조금이라도 공유하거나, 꼭짓점끼리(또는 꼭짓점-변이) 1.5u 안으로
    // 만나면 "인접"으로 본다 — 모서리 한 점에서 만나는 같은 색도 금지한다.
    function edgeOverlap(p1, p2, q1, q2) {
      var dx = p2[0] - p1[0], dy = p2[1] - p1[1];
      var len = Math.hypot(dx, dy);
      if (!len) return 0;
      var ux = dx / len, uy = dy / len;
      function off(p) { return Math.abs((p[0] - p1[0]) * uy - (p[1] - p1[1]) * ux); }
      if (off(q1) > 0.5 || off(q2) > 0.5) return 0;
      function t(p) { return (p[0] - p1[0]) * ux + (p[1] - p1[1]) * uy; }
      var b0 = t(q1), b1 = t(q2);
      if (b0 > b1) { var tmp = b0; b0 = b1; b1 = tmp; }
      return Math.min(len, b1) - Math.max(0, b0);
    }
    function pointSegDist(p, a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var d2 = dx * dx + dy * dy;
      var t = d2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d2)) : 0;
      return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
    }
    function touches(A, B) {
      var i, j;
      for (i = 0; i < A.length; i++) {
        var a1 = A[i], a2 = A[(i + 1) % A.length];
        for (j = 0; j < B.length; j++) {
          if (edgeOverlap(a1, a2, B[j], B[(j + 1) % B.length]) >= 0.5) return true;
        }
      }
      for (i = 0; i < A.length; i++) {
        for (j = 0; j < B.length; j++) {
          if (pointSegDist(A[i], B[j], B[(j + 1) % B.length]) < 1.5) return true;
          if (pointSegDist(B[j], A[i], A[(i + 1) % A.length]) < 1.5) return true;
        }
      }
      return false;
    }

    function attempt(rand) {
      var ri = function (a, b) { return a + Math.floor(rand() * (b - a + 1)); };
      var target = ri(48, 62);
      var rectTarget = target - ri(8, 12);

      // ── 이분할 반복: 크기가 다른 사각 칸 ──
      var leaves = [{ x: 0, y: 0, w: W, h: H }];
      var guard = 0;
      while (leaves.length < rectTarget && guard++ < 400) {
        var bi = -1, best = 0;
        for (var i = 0; i < leaves.length; i++) {
          var L0 = leaves[i];
          if (L0.w < MIN * 2 && L0.h < MIN * 2) continue;
          var a = L0.w * L0.h * (0.75 + rand() * 0.5);
          if (a > best) { best = a; bi = i; }
        }
        if (bi < 0) break;
        var L = leaves.splice(bi, 1)[0];
        var vert = L.w >= L.h;
        if (L.w >= MIN * 2 && L.h >= MIN * 2 && rand() < 0.42) vert = !vert;
        if (vert && L.w < MIN * 2) vert = false;
        if (!vert && L.h < MIN * 2) vert = true;
        var t = 0.35 + rand() * 0.3;
        if (vert) {
          var w1 = Math.max(MIN, Math.min(L.w - MIN, Math.round(L.w * t)));
          leaves.push({ x: L.x, y: L.y, w: w1, h: L.h },
                      { x: L.x + w1, y: L.y, w: L.w - w1, h: L.h });
        } else {
          var h1 = Math.max(MIN, Math.min(L.h - MIN, Math.round(L.h * t)));
          leaves.push({ x: L.x, y: L.y, w: L.w, h: h1 },
                      { x: L.x, y: L.y + h1, w: L.w, h: L.h - h1 });
        }
      }

      // ── 일부 칸을 대각선 분할(삼각 조각) ──
      var polys = [];
      var want = target - leaves.length;
      shuffle(leaves, rand).forEach(function (L2) {
        var a = [L2.x, L2.y], b = [L2.x + L2.w, L2.y];
        var c = [L2.x + L2.w, L2.y + L2.h], d = [L2.x, L2.y + L2.h];
        if (want > 0 && L2.w >= MIN + 3 && L2.h >= MIN + 3) {
          want--;
          (rand() < 0.5 ? [[a, b, d], [b, c, d]] : [[a, b, c], [a, c, d]])
            .forEach(function (tri) { polys.push(tri); });
        } else polys.push([a, b, c, d]);
      });

      // ── 인접 그래프 ──
      var n = polys.length, adj = [];
      for (var x = 0; x < n; x++) adj.push([]);
      for (x = 0; x < n; x++) for (var y = x + 1; y < n; y++) {
        if (touches(polys[x], polys[y])) { adj[x].push(y); adj[y].push(x); }
      }

      // ── 채색: 이웃 많은 칸부터, 안 쓴 색 우선 → 8~10색이 고루 나온다 ──
      var idx = [];
      for (x = 0; x < n; x++) idx.push(x);
      idx.sort(function (a2, b2) { return adj[b2].length - adj[a2].length; });
      var colorIdx = [], used = [];
      for (x = 0; x < n; x++) colorIdx.push(-1);
      for (x = 0; x < COLORS.length; x++) used.push(0);
      var ok = true;
      idx.forEach(function (r2) {
        var banned = {};
        adj[r2].forEach(function (nb) { if (colorIdx[nb] >= 0) banned[colorIdx[nb]] = 1; });
        var fresh = [], any = [];
        for (var c2 = 0; c2 < COLORS.length; c2++) {
          if (banned[c2]) continue;
          any.push(c2);
          if (!used[c2]) fresh.push(c2);
        }
        if (!any.length) { ok = false; return; }
        var pickFrom = fresh.length ? fresh : any;
        var pick = pickFrom[Math.floor(rand() * pickFrom.length)];
        colorIdx[r2] = pick; used[pick]++;
      });
      var distinct = 0;
      used.forEach(function (u) { if (u > 0) distinct++; });
      if (!ok || distinct < 8) return null;

      return polys.map(function (pts, i2) {
        var cx = 0, cy = 0;
        pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
        cx /= pts.length; cy /= pts.length;
        return { path: poly(pts), color: COLORS[colorIdx[i2]], label: [f(cx), f(cy)] };
      });
    }

    P.push({
      id: 'jogakbo', name: '조각보', emoji: '🧵', level: 4,
      viewBox: [W, H],
      gen: function (rand) {
        for (var t = 0; t < 40; t++) {
          var r = attempt(rand);
          if (r) return r;
        }
        return attempt(function () { return Math.random(); }) || [];             // 이론상 도달하지 않음
      }
    });
  })();
})();
