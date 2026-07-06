/* 도안: 아기 공룡 32×32 — 어려움 단계 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 32, H = 32;
  // 1 하늘, 2 몸 초록, 3 배 연두, 4 진초록(발·꼬리끝), 5 등뼈 주황, 6 남색(눈),
  // 7 풀밭, 8 흰 구름, 9 볼 분홍
  const P = ['#D6F0FF', '#5FC96B', '#C8F0B8', '#3FA352', '#FF9D3A', '#33475E', '#9FDB76', '#FFFFFF', '#FF8FB2'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));
  const disk = (cx, cy, r, c, cond) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r && (!cond || cond(g[y][x]))) g[y][x] = c;
  };
  const ell = (x, y, cx, cy, rx, ry) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    return dx * dx + dy * dy;
  };

  // 하늘 → 풀밭
  for (let y = 27; y < H; y++) for (let x = 0; x < W; x++) g[y][x] = 6;

  // 구름
  [[4, 4], [5, 4], [6, 4], [5, 3], [25, 6], [26, 6], [27, 6], [26, 5]].forEach(([x, y]) => { g[y][x] = 7; });

  // 다리 (몸보다 먼저 → 아랫부분만 보임)
  for (let y = 22; y <= 27; y++) {
    for (let x = 9; x <= 12; x++) g[y][x] = 1;
    for (let x = 16; x <= 19; x++) g[y][x] = 1;
  }
  for (let x = 9; x <= 12; x++) g[27][x] = 3;
  for (let x = 16; x <= 19; x++) g[27][x] = 3;

  // 꼬리 (왼쪽으로 가늘어짐)
  disk(6.5, 21.5, 3.0, 1);
  disk(3.8, 19.8, 2.0, 1);
  disk(2.2, 18.4, 1.3, 3);

  // 몸 + 배
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (ell(x, y, 14.5, 20, 8.2, 6.2) <= 1) g[y][x] = 1;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (ell(x, y, 13, 21.5, 4.6, 4.2) <= 1 && g[y][x] === 1) g[y][x] = 2;
    }

  // 목·머리
  disk(20, 15, 2.9, 1);
  disk(21, 10.5, 3.4, 1);
  disk(23.5, 12, 2.2, 1);   // 주둥이
  // 눈·볼·콧구멍
  g[9][22] = 5; g[9][23] = 7;
  g[12][24] = 8;
  g[11][25] = 5;
  // 등 가시: 각 열의 몸 윗선을 찾아 바로 위 칸에 얹는다
  [6, 9, 12, 15, 18, 21].forEach(x => {
    for (let y = 0; y < H; y++) {
      if (g[y][x] === 1) { if (y > 0) g[y - 1][x] = 4; break; }
    }
  });

  PIXELS.push({
    id: 'dino', name: '아기 공룡', emoji: '🦕', category: 'animal', level: 3,
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
