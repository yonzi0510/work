/* 도안: 딸기 26×26 — 보통 단계 */
(() => {
  window.PIXELS = window.PIXELS || [];
  const W = 26, H = 26;
  // 1 배경, 2 빨강, 3 진빨강(그늘), 4 씨앗 노랑, 5 잎 초록, 6 진초록(꼭지), 7 흰 반짝
  const P = ['#FFF7E0', '#FF4D5E', '#D93A50', '#FFE08A', '#4DB56A', '#2F9152', '#FFFFFF'];
  const g = Array.from({ length: H }, () => new Array(W).fill(0));
  const CX = 13;

  // 딸기 몸: 위쪽 원 + 아래로 갈수록 좁아지는 쐐기
  const inBerry = (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    if (Math.hypot(px - CX, py - 13.2) <= 8.3 && py >= 8.6) return true;
    if (py >= 13.2 && py <= 23.6) {
      const half = 8.3 * (23.6 - py) / 10.4;
      if (Math.abs(px - CX) <= half) return true;
    }
    return false;
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (inBerry(x, y)) g[y][x] = (x + 0.5 - CX > 3.4 || y >= 21) ? 2 : 1;

  // 씨앗 (격자 무늬, 몸 안쪽만)
  for (let y = 10; y <= 21; y++)
    for (let x = 0; x < W; x++)
      if (g[y][x] && (x + y * 2) % 5 === 0 && inBerry(x, y) &&
          inBerry(x - 1, y) && inBerry(x + 1, y) && inBerry(x, y + 1)) g[y][x] = 3;

  // 흰 반짝 (왼쪽 위)
  g[10][9] = 6; g[11][9] = 6; g[11][10] = 6;

  // 잎 왕관 + 꼭지
  for (let x = CX - 5; x <= CX + 5; x++) g[7][x] = 4;
  for (let x = CX - 6; x <= CX + 6; x++) g[8][x] = (x % 2 === 0) ? 4 : 5;
  [CX - 5, CX - 2, CX + 1, CX + 4].forEach(x => { g[6][x] = 4; g[6][x + 1] = 4; });
  g[4][CX] = 5; g[5][CX] = 5; g[4][CX + 1] = 5; g[3][CX + 1] = 5;

  PIXELS.push({
    id: 'strawberry', name: '딸기', emoji: '🍓', category: 'food', level: 2,
    palette: P,
    rows: g.map(r => r.join(''))
  });
})();
