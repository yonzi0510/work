/* 도안: 무지개 구름 18×18 — 호는 코드로 생성 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 18, H = 18;
  // 1 하늘, 2 빨강, 3 주황, 4 노랑, 5 초록, 6 파랑, 7 보라, 8 구름 흰색, 9 구름 그늘
  const P = ['#D6EEFF', '#FF5B5B', '#FF9D3A', '#FFD93D', '#4DC94D', '#4DA6FF', '#B48CF2', '#FFFFFF', '#E3ECF7'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));

  // 무지개 반원 (중심 아래쪽)
  const CX = 8.5 + 0.5, CY = 16.5;
  const BANDS = [[13.2, 14.8, 1], [11.6, 13.2, 2], [10.0, 11.6, 3], [8.4, 10.0, 4], [6.8, 8.4, 5], [5.2, 6.8, 6]];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const r = Math.hypot(x + 0.5 - CX, y + 0.5 - CY);
      for (const [r0, r1, c] of BANDS) {
        if (r >= r0 && r < r1) { g[y][x] = c; break; }
      }
    }
  }
  // 양끝 구름 (무지개 다리 끝을 완전히 덮음)
  const cloud = (cx, cy) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const d = Math.hypot((x + 0.5 - cx) * 0.85, (y + 0.5 - cy) * 0.75);
        if (d <= 2.6) g[y][x] = (y + 0.5 > cy + 1.2) ? 8 : 7;
      }
  };
  cloud(3.2, 15.2);
  cloud(14.8, 15.2);
  // 맨 아랫줄에 구름 밖으로 삐져나온 띠 조각 정리
  for (let y = 16; y < H; y++)
    for (let x = 0; x < W; x++)
      if (g[y][x] !== 7 && g[y][x] !== 8) g[y][x] = 0;
  // 하늘의 작은 구름 두 점 (무지개 띠 밖)
  g[1][2] = 7; g[1][3] = 7; g[1][14] = 7; g[1][15] = 7;

  PIXELS.push({
    id: 'rainbow', name: '무지개 구름', emoji: '🌈', category: 'nature',
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
