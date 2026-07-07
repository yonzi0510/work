/* 도안: 아이스크림 20×20 — 스쿱 원은 코드로 생성 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 20, H = 20;
  // 1 배경, 2 콘, 3 콘 무늬, 4 초코, 5 딸기, 6 민트, 7 크림, 8 체리, 9 스프링클 파랑
  const P = ['#FFEFF5', '#F0B45C', '#C98A3A', '#9C6B4A', '#FF9FBB', '#A8E8C0', '#FFFFFF', '#FF4D6D', '#6FB9F0'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));
  const disk = (cx, cy, r, c) => {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) g[y][x] = c;
  };

  // 콘 (역삼각형 + 대각 와플 무늬)
  for (let y = 11; y <= 18; y++) {
    const half = (18.7 - y) / 7.7 * 5.6;
    for (let x = 0; x < W; x++) {
      if (Math.abs(x + 0.5 - 10) <= half) g[y][x] = ((x + y) % 3 === 0) ? 2 : 1;
    }
  }
  // 스쿱: 딸기(왼) · 민트(오른) → 크림(위) → 초코(가운데 아래)
  disk(6.6, 7.6, 3.6, 4);
  disk(13.4, 7.6, 3.6, 5);
  disk(10, 4.8, 3.3, 6);
  disk(10, 9.2, 4.2, 3);
  // 체리 + 꼭지
  g[1][11] = 2; g[0][12] = 2;
  disk(10.4, 1.9, 1.3, 7);
  // 스프링클
  [[5, 6, 8], [8, 6, 7], [12, 6, 8], [15, 8, 7], [4, 9, 8], [10, 3, 8], [9, 7, 6], [11, 11, 5]].forEach(([x, y, c]) => {
    if (g[y][x] !== 0) g[y][x] = c;
  });

  PIXELS.push({
    id: 'icecream', name: '아이스크림', emoji: '🍦', category: 'food',
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
