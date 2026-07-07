/* 도안: 꼬마 로켓 22×22 — 코드로 생성 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 22, H = 22;
  // 1 우주, 2 별, 3 로켓 몸, 4 빨강, 5 창문, 6 불꽃 주황, 7 불꽃 노랑(달), 8 보라 행성
  const P = ['#232F52', '#FFF3B8', '#E8EEF7', '#FF5B5B', '#7CC7F5', '#FF7A00', '#FFD93D', '#B48CF2'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));
  const CX = 10.5 + 0.5; // 로켓 중심 x=11
  const disk = (cx, cy, r, c) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) g[y][x] = c;
  };

  // 별
  [[2, 8], [4, 17], [8, 2], [16, 15], [19, 9], [18, 20], [1, 13], [14, 1], [20, 2]].forEach(([x, y]) => { g[y][x] = 1; });
  // 달 + 보라 행성
  disk(3.2, 3.2, 2.3, 6);
  disk(18.6, 5.4, 2.0, 7);
  // 로켓 코 (빨강 삼각)
  for (let y = 3; y <= 6; y++) {
    const half = (y - 2.4) * 0.85;
    for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - CX) <= half) g[y][x] = 3;
  }
  // 몸통
  for (let y = 7; y <= 14; y++)
    for (let x = 0; x < W; x++)
      if (Math.abs(x + 0.5 - CX) <= 2.9) g[y][x] = 2;
  // 창문 (테두리 빨강 + 유리)
  disk(CX, 9.6, 2.2, 3);
  disk(CX, 9.6, 1.3, 4);
  // 빨간 줄무늬
  for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - CX) <= 2.9) g[13][x] = 3;
  // 날개 (좌우 삼각)
  for (let y = 11; y <= 15; y++) {
    const ext = y - 10; // 아래로 갈수록 넓게
    for (let k = 1; k <= ext && k <= 4; k++) {
      const lx = Math.round(CX - 0.5 - 2.9 - k + 0.4), rx = Math.round(CX - 0.5 + 2.9 + k - 0.4);
      if (y <= 15 && lx >= 0) g[y][lx] = 3;
      if (y <= 15 && rx < W) g[y][rx] = 3;
    }
  }
  // 노즐
  for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - CX) <= 1.9) g[15][x] = 3;
  // 불꽃 (주황 밖 + 노랑 안)
  for (let y = 16; y <= 19; y++) {
    const half = (20.2 - y) * 0.75;
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x + 0.5 - CX);
      if (d <= half) g[y][x] = d <= half * 0.5 ? 6 : 5;
    }
  }

  PIXELS.push({
    id: 'rocket', name: '꼬마 로켓', emoji: '🚀', category: 'vehicle',
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
