/* 도안: 나비 26×26 — 보통 단계. 반쪽만 만들고 거울 대칭 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 26, H = 26;
  // 1 하늘, 2 분홍 날개, 3 진분홍 테두리, 4 보라 날개, 5 진보라 테두리,
  // 6 몸통, 7 노랑 점, 8 흰색, 9 풀밭
  const P = ['#CFEBFF', '#FF8FB2', '#E8548A', '#B48CF2', '#8F63D6', '#6B4A3A', '#FFD93D', '#FFFFFF', '#9FDB76'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));

  // 타원 판정: 테두리(rim)와 속을 나눠 칠한다
  const ell = (x, y, cx, cy, rx, ry) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    return dx * dx + dy * dy;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < 13; x++) {  // 왼쪽 절반만
      let c = 0;
      // 위 날개 (분홍, 테두리 진분홍)
      let e = ell(x, y, 7.2, 9.2, 5.9, 4.9);
      if (e <= 1) c = e > 0.58 ? 2 : 1;
      // 아래 날개 (보라, 테두리 진보라)
      e = ell(x, y, 8.6, 16.6, 4.6, 4.0);
      if (e <= 1) c = e > 0.58 ? 4 : 3;
      // 위 날개 속 점무늬 자리
      if (ell(x, y, 6.8, 8.8, 2.2, 1.8) <= 1) c = 6;
      if (ell(x, y, 8.3, 16.4, 1.6, 1.4) <= 1) c = 7;
      if (c) { g[y][x] = c; g[y][W - 1 - x] = c; }
    }
  }
  // 풀밭 (날개 아래)
  for (let y = 22; y < H; y++) for (let x = 0; x < W; x++) if (!g[y][x]) g[y][x] = 8;
  // 풀밭 꽃 점
  [[3, 23], [8, 24], [17, 24], [22, 23]].forEach(([x, y]) => { g[y][x] = 6; });

  // 몸통·머리 (가운데 두 칸)
  for (let y = 8; y <= 19; y++) { g[y][12] = 5; g[y][13] = 5; }
  for (let y = 5; y <= 7; y++) { g[y][12] = 5; g[y][13] = 5; }
  // 눈 (머리 위)
  g[6][12] = 7; g[6][13] = 7;
  // 더듬이
  g[4][11] = 5; g[3][10] = 5; g[4][14] = 5; g[3][15] = 5;
  g[2][10] = 6; g[2][15] = 6;
  // 구름
  [[3, 2], [4, 2], [5, 2], [4, 1], [20, 3], [21, 3], [22, 3], [21, 2]].forEach(([x, y]) => { g[y][x] = 7; });

  PIXELS.push({
    id: 'butterfly', name: '나비', emoji: '🦋', category: 'animal', level: 2,
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
