/* 도안: 무당벌레 14×14 — 원은 코드로 생성 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 14, H = 14;
  // 1 잎사귀 배경, 2 빨강, 3 진빨강(그늘), 4 검정, 5 흰 눈, 6 연둣잎
  const P = ['#EFF9E3', '#FF5252', '#D63A3A', '#383842', '#FFFFFF', '#7CC257'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));
  const dist = (x, y, cx, cy) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // 모서리 잎사귀
      if (x + y <= 2 || (W - 1 - x) + (H - 1 - y) <= 2) g[y][x] = 5;
      // 몸통 (아래쪽 그늘)
      const d = dist(x, y, 7, 8.2);
      if (d <= 4.9) g[y][x] = (y >= 11 || (x >= 10 && y >= 9)) ? 2 : 1;
      // 머리
      if (dist(x, y, 7, 3.6) <= 2.1) g[y][x] = 3;
    }
  }
  // 등 가운데 줄
  for (let y = 5; y <= 12; y++) if (dist(7, y, 7, 8.2) <= 4.9) g[y][7] = 3;
  // 점무늬
  [[4, 6], [9, 6], [3, 9], [10, 9], [5, 11], [9, 11]].forEach(([x, y]) => {
    if (g[y][x] === 1 || g[y][x] === 2) g[y][x] = 3;
  });
  // 눈
  g[3][5] = 4; g[3][8] = 4;

  PIXELS.push({
    id: 'ladybug', name: '무당벌레', emoji: '🐞', category: 'animal',
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
