/* 도안: 대나무 팬더 32×32 — 어려움 단계 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 32, H = 32;
  // 1 배경, 2 흰 얼굴, 3 검정, 4 회색 그늘, 5 분홍 볼, 6 대나무, 7 진초록(마디·잎)
  const P = ['#EAF6FF', '#FFFFFF', '#3A3A44', '#E2E6EF', '#FFB3C7', '#4DB56A', '#2F9152'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));
  const d = (x, y, cx, cy) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
  const ell = (x, y, cx, cy, rx, ry) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    return dx * dx + dy * dy;
  };

  // 대나무 (왼쪽·오른쪽 뒤 배경)
  for (let y = 2; y < H; y++) {
    g[y][2] = (y % 6 === 0) ? 6 : 5; g[y][3] = (y % 6 === 0) ? 6 : 5;
    g[y][29] = (y % 6 === 3) ? 6 : 5; g[y][30] = (y % 6 === 3) ? 6 : 5;
  }
  // 대나무 잎
  [[4, 5], [5, 6], [4, 14], [5, 15], [28, 9], [27, 10], [28, 20], [27, 21]].forEach(([x, y]) => { g[y][x] = 6; });

  // 귀 (머리보다 먼저)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (d(x, y, 9.5, 9.5) <= 3.6) g[y][x] = 2;
      if (d(x, y, 22.5, 9.5) <= 3.6) g[y][x] = 2;
    }
  // 머리 (아래쪽 살짝 회색 그늘)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dd = d(x, y, 16, 18);
      if (dd <= 10.2) g[y][x] = (dd > 9.2 && y + 0.5 > 22) ? 3 : 1;
    }
  // 눈 주위 검은 무늬 (타원)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (ell(x, y, 11.8, 16.2, 2.8, 3.6) <= 1) g[y][x] = 2;
      if (ell(x, y, 20.2, 16.2, 2.8, 3.6) <= 1) g[y][x] = 2;
    }
  // 눈 (흰 점 + 검은 점)
  g[15][11] = 1; g[16][12] = 1; g[15][20] = 1; g[16][19] = 1;
  // 코·입
  g[20][15] = 2; g[20][16] = 2; g[21][15] = 2; g[21][16] = 2;
  g[23][14] = 2; g[24][15] = 2; g[24][16] = 2; g[23][17] = 2;
  // 볼
  g[20][9] = 4; g[20][10] = 4; g[20][21] = 4; g[20][22] = 4;

  PIXELS.push({
    id: 'panda', name: '대나무 팬더', emoji: '🐼', category: 'animal', level: 3,
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
