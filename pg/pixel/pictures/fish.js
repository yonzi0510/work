/* 도안: 바닷속 물고기 26×26 — 보통 단계 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 26, H = 26;
  // 1 물 위, 2 물 중간, 3 물 깊은 곳, 4 모래, 5 물고기 주황, 6 진주황(지느러미),
  // 7 흰색, 8 남색(눈), 9 해초 초록
  const P = ['#A8DEFF', '#7CC7F5', '#58AFE8', '#F6E0A8', '#FF9D3A', '#E8712C', '#FFFFFF', '#33475E', '#57B368'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));
  const ell = (x, y, cx, cy, rx, ry) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    return dx * dx + dy * dy;
  };

  // 물 3단 + 모래
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      g[y][x] = y < 9 ? 0 : y < 17 ? 1 : y < 22 ? 2 : 3;

  // 해초 (양쪽, 지그재그)
  for (let y = 15; y <= 23; y++) {
    const sway = (y % 2 === 0) ? 0 : 1;
    g[y][2 + sway] = 8; g[y][22 + (1 - sway)] = 8;
  }
  // 모래 둔덕
  for (let x = 6; x <= 12; x++) g[21][x] = 3;

  // 큰 물고기: 꼬리 → 몸 → 무늬 → 지느러미 → 눈
  for (let y = 9; y <= 17; y++) {
    const t = Math.abs(y + 0.5 - 13.5);
    for (let x = 18; x <= 22; x++)
      if (x - 18 >= t * 1.1 - 1) g[y][x] = 5;               // 꼬리 (삼각)
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (ell(x, y, 11.5, 13.5, 7.2, 4.6) <= 1) g[y][x] = 4; // 몸
  for (let y = 9; y <= 18; y++)
    for (const sx of [9, 13]) {                              // 흰 줄무늬 2개
      if (ell(sx, y, 11.5, 13.5, 7.2, 4.6) <= 0.92) g[y][sx] = 6;
      if (ell(sx + 1, y, 11.5, 13.5, 7.2, 4.6) <= 0.92) g[y][sx + 1] = 6;
    }
  for (let x = 9; x <= 13; x++) { g[7][x] = 5; if (x >= 10 && x <= 12) g[8][x] = 5; }  // 등지느러미
  for (let x = 10; x <= 13; x++) { g[19][x] = 5; if (x >= 11) g[20][x] = 5; }          // 배지느러미
  g[12][5] = 7; g[13][5] = 7;                                // 눈
  g[12][6] = 6;                                              // 눈 반짝

  // 물방울
  [[20, 4], [22, 6], [19, 2], [8, 6]].forEach(([x, y]) => { g[y][x] = 6; });
  // 작은 물고기 친구 (왼쪽 위): 진주황 몸 + 꼬리, 남색 눈
  g[3][3] = 5; g[3][4] = 5; g[4][3] = 5; g[4][4] = 5;
  g[3][5] = 5; g[4][5] = 5;
  g[3][3] = 7;

  PIXELS.push({
    id: 'fish', name: '바닷속 물고기', emoji: '🐠', category: 'animal', level: 2,
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
