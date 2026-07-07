/* ═══════════ 픽셀 도안 인쇄 툴 ═══════════
 * 기존 도안(js/pictures/*.js)을 A4/A3 종이에 숫자 도안(문제지) + 번호별 색 범례로 출력.
 * 어르신 인지학습용 — 칸과 숫자를 용지에 최대한 크게 배치한다.
 * 화면에는 실제 인쇄 모습 그대로 미리보기를 보여 준다.
 */
(() => {
  const PICS = window.PIXELS || [];
  const $ = id => document.getElementById(id);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const PAPERS = { A4: [210, 297], A3: [297, 420] };   // [짧은 변, 긴 변] mm
  const PAD = 12;                                       // 시트 여백 mm (print.css와 동일)

  const LEVELS = {
    1: { name: '쉬움', emoji: '🌱' },
    2: { name: '보통', emoji: '🌟' },
    3: { name: '어려움', emoji: '🔥' }
  };
  const picLevel = pic => LEVELS[pic.level] ? pic.level : 1;

  const state = {
    picId: PICS.length ? PICS[0].id : null,
    paper: 'A4',
    orient: 'auto',        // auto | portrait | landscape
    nameDate: true,
    bgFill: false          // 배경도 색칠 (빈 칸을 여러 색 번호로 채움 — 활동지 스타일)
  };

  /* ─────────── 색연필 12색 ─────────── */
  const PENCILS = [
    { name: '빨강',   hex: '#E53935' },
    { name: '주황',   hex: '#F57C00' },
    { name: '노랑',   hex: '#FDD835' },
    { name: '연두',   hex: '#8BC34A' },
    { name: '초록',   hex: '#388E3C' },
    { name: '하늘색', hex: '#4FC3F7' },
    { name: '파랑',   hex: '#1976D2' },
    { name: '보라',   hex: '#7B1FA2' },
    { name: '분홍',   hex: '#F48FB1' },
    { name: '살구색', hex: '#FFCC99' },
    { name: '고동색', hex: '#6D4C41' },
    { name: '검정',   hex: '#212121' }
  ];
  const WHITE = '#FFFFFF';   // 흰색에 가까우면 "칠하지 않는 칸"

  function hexRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  // redmean 근사 색 거리 — 사람 눈 기준으로 가까운 색을 고른다
  function colorDist(a, b) {
    const [r1, g1, b1] = hexRgb(a), [r2, g2, b2] = hexRgb(b);
    const rm = (r1 + r2) / 2;
    const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
    return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
  }

  // 팔레트 → 색연필 매핑. map[i] = 0(칠하지 않음) 또는 새 번호(1..k)
  function mapPalette(pic) {
    const map = [], legend = [], byPencil = {};
    pic.palette.forEach((hex, i) => {
      let best = 0, bd = Infinity;
      PENCILS.forEach((p, pi) => {
        const d = colorDist(hex, p.hex);
        if (d < bd) { bd = d; best = pi; }
      });
      if (colorDist(hex, WHITE) < bd) { map[i] = 0; return; }
      if (byPencil[best] == null) {
        byPencil[best] = legend.length + 1;
        legend.push({ name: PENCILS[best].name, hex: PENCILS[best].hex });
      }
      map[i] = byPencil[best];
    });
    return { map, legend };
  }

  // 배경 채움에 쓸 색연필 후보 (그림에 안 쓰인 밝은 색 우선, 최대 4색)
  const BG_PREFER = ['노랑', '분홍', '하늘색', '연두', '주황', '보라', '살구색', '초록', '파랑', '빨강'];
  function bgPencils(legend) {
    const used = new Set(legend.map(e => e.name));
    return BG_PREFER.filter(n => !used.has(n)).slice(0, 4)
      .map(n => PENCILS.find(p => p.name === n));
  }

  // 도안 id 기반 시드 난수 — 같은 도안은 항상 같은 배경 배치로 인쇄
  function seed32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return () => {
      a |= 0; a = a + 0x6D2E239D | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // 시트에 그릴 데이터: 범례 항목 + 칸별 번호(배경 채움 시) + 빈 칸 여부
  // 항상 색연필 12색 기준 (비슷한 색은 합치고, 흰색에 가까운 칸은 비움)
  function sheetData(pic) {
    const { map, legend } = mapPalette(pic);
    let hasBlank = map.some(n => n === 0);
    let cellNums = null;
    if (state.bgFill && hasBlank) {
      const bgs = bgPencils(legend);
      const base = legend.length;
      bgs.forEach(b => legend.push({ name: b.name, hex: b.hex }));
      const { W, H, target } = parsePic(pic);
      const rand = mulberry32(seed32(pic.id));
      cellNums = new Array(W * H);
      let k = 0;
      for (let i = 0; i < W * H; i++) {
        const n = map[target[i]];
        if (n > 0) cellNums[i] = n;
        else { cellNums[i] = base + 1 + (k < bgs.length ? k : Math.floor(rand() * bgs.length)); k++; }
      }
      hasBlank = false;
    }
    return { legend, map, cellNums, hasBlank };
  }

  function legendCount(pic) {
    return sheetData(pic).legend.length;
  }

  /* ─────────── 도안 파싱 · 썸네일 (엔진과 동일 규칙) ─────────── */
  function parsePic(pic) {
    const H = pic.rows.length, W = pic.rows[0].length;
    const target = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        target[y * W + x] = pic.rows[y].charCodeAt(x) - 48;
    return { W, H, target };
  }

  function makeThumb(pic) {
    const { W, H, target } = parsePic(pic);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let i = 0; i < W * H; i++) {
      g.fillStyle = pic.palette[target[i]];
      g.fillRect(i % W, (i / W) | 0, 1, 1);
    }
    return c;
  }

  /* ─────────── 도안 선택 목록 ─────────── */
  function renderList() {
    const box = $('pic-list');
    box.innerHTML = '';
    [1, 2, 3].forEach(lv => {
      const pics = PICS.filter(p => picLevel(p) === lv);
      if (!pics.length) return;
      const head = document.createElement('div');
      head.className = 'level-head';
      head.textContent = LEVELS[lv].emoji + ' ' + LEVELS[lv].name;
      box.appendChild(head);
      const row = document.createElement('div');
      row.className = 'pic-row';
      pics.forEach(pic => {
        const { W, H } = parsePic(pic);
        const card = document.createElement('div');
        card.className = 'pic-card' + (pic.id === state.picId ? ' sel' : '');
        card.dataset.pic = pic.id;
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        const thumb = document.createElement('div');
        thumb.className = 'pic-thumb';
        thumb.appendChild(makeThumb(pic));
        card.appendChild(thumb);
        card.insertAdjacentHTML('beforeend',
          '<div class="pic-card-label">' + pic.emoji + ' ' + pic.name + '</div>' +
          '<div class="pic-card-size">' + W + '×' + H + ' · 색 ' + pic.palette.length + '개</div>');
        const pick = () => { state.picId = pic.id; renderList(); renderSheet(); };
        card.addEventListener('click', pick);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
        row.appendChild(card);
      });
      box.appendChild(row);
    });
  }

  /* ─────────── 레이아웃 계산 (mm) ─────────── */
  // 격자 위에 놓이는 고정 요소들의 높이 추정 — 실제 인쇄와 살짝 달라도
  // 격자는 flex로 남은 공간에 들어가므로 넘치지 않는다.
  function fixedHeights(pic, innerW) {
    const headH = 11;                                    // 제목/이름·날짜 줄
    const hintH = 8;                                     // 안내 문구
    const itemW = 43;                                    // 범례 1개(간격 포함, 색연필 이름 표시)
    const perRow = Math.max(1, Math.floor((innerW + 5) / itemW));
    const rows = Math.ceil(legendCount(pic) / perRow);
    const legendH = rows * 10 + (rows - 1) * 2.5 + 3;
    const footH = 6.5;
    const gridGap = 3;
    return headH + hintH + legendH + footH + gridGap;
  }

  // 주어진 용지 방향에서 칸 크기(mm)
  function cellSize(pic, pw, ph) {
    const { W, H } = parsePic(pic);
    const innerW = pw - PAD * 2, innerH = ph - PAD * 2;
    const availH = innerH - fixedHeights(pic, innerW);
    return Math.min(innerW / W, availH / H);
  }

  // 자동 방향: 칸이 더 커지는 쪽
  function paperDims(pic) {
    const [s, l] = PAPERS[state.paper];
    if (state.orient === 'portrait') return [s, l];
    if (state.orient === 'landscape') return [l, s];
    return cellSize(pic, s, l) >= cellSize(pic, l, s) ? [s, l] : [l, s];
  }

  /* ─────────── 숫자 격자 SVG ─────────── */
  // map: 팔레트 인덱스 → 표시 번호 (0이면 숫자 없음)
  // cellNums: 칸별 번호 배열 (배경 채움 모드 — map보다 우선)
  function buildGridSvg(pic, cellMm, map, cellNums) {
    const { W, H, target } = parsePic(pic);
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', (cellMm * W) + 'mm');
    svg.setAttribute('height', (cellMm * H) + 'mm');

    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('width', W); bg.setAttribute('height', H);
    bg.setAttribute('fill', '#fff');
    svg.appendChild(bg);

    // 칸 숫자 (색연필 매핑 번호, 0은 빈 칸)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const num = cellNums ? cellNums[i] : (map ? map[target[i]] : target[i] + 1);
        if (!num) continue;
        const t = document.createElementNS(SVG_NS, 'text');
        t.setAttribute('x', x + 0.5);
        t.setAttribute('y', y + 0.5);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        t.setAttribute('font-size', num >= 10 ? 0.44 : 0.55);
        t.setAttribute('font-weight', '700');
        t.setAttribute('font-family', "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif");
        t.setAttribute('fill', '#111');
        t.textContent = num;
        svg.appendChild(t);
      }
    }

    // 격자선: 얇은 선 + 5칸마다 굵은 선(위치 찾기 도움) + 외곽선
    const thin = [], major = [];
    for (let x = 1; x < W; x++) (x % 5 ? thin : major).push('M' + x + ' 0V' + H);
    for (let y = 1; y < H; y++) (y % 5 ? thin : major).push('M0 ' + y + 'H' + W);
    const mkPath = (d, w, color) => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('stroke', color);
      p.setAttribute('stroke-width', w);
      p.setAttribute('fill', 'none');
      return p;
    };
    if (thin.length) svg.appendChild(mkPath(thin.join(''), 0.03, '#b5b5b5'));
    if (major.length) svg.appendChild(mkPath(major.join(''), 0.07, '#7a7a7a'));
    const border = document.createElementNS(SVG_NS, 'rect');
    border.setAttribute('width', W); border.setAttribute('height', H);
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', '#222');
    border.setAttribute('stroke-width', 0.12);
    svg.appendChild(border);
    return svg;
  }

  /* ─────────── 시트(종이) 렌더 ─────────── */
  function renderSheet() {
    const pic = PICS.find(p => p.id === state.picId);
    if (!pic) return;
    const [pw, ph] = paperDims(pic);

    // @page 크기 주입 → 브라우저 인쇄 대화상자가 용지·방향을 따라감
    $('page-style').textContent =
      '@page { size: ' + pw + 'mm ' + ph + 'mm; margin: 0; }';

    const sheet = $('sheet');
    sheet.style.width = pw + 'mm';
    sheet.style.height = ph + 'mm';
    sheet.innerHTML = '';

    // 제목 + 이름/날짜
    const head = document.createElement('div');
    head.className = 'sheet-head';
    const title = document.createElement('div');
    title.className = 'sheet-title';
    title.textContent = pic.emoji + ' ' + pic.name;
    head.appendChild(title);
    if (state.nameDate) {
      const fields = document.createElement('div');
      fields.className = 'sheet-fields';
      fields.innerHTML = '이름<span class="blank"></span>' +
        '날짜<span class="blank short"></span>월 <span class="blank short"></span>일';
      head.appendChild(fields);
    }
    sheet.appendChild(head);

    // 색연필 12색 모드: 비슷한 색은 하나로 합치고, 흰색 칸은 비우거나(기본) 배경색으로 채움
    const data = sheetData(pic);

    const hint = document.createElement('div');
    hint.className = 'sheet-hint';
    hint.textContent = '칸에 적힌 번호와 같은 색을 찾아 칠해 보세요.' +
      (data.hasBlank ? ' 숫자가 없는 칸은 칠하지 않아요.' : '');
    sheet.appendChild(hint);

    // 번호별 색 범례 (12색 모드는 색연필 이름 표시)
    const legend = document.createElement('div');
    legend.className = 'legend';
    data.legend.forEach((en, i) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = '<span class="legend-num">' + (i + 1) + '</span>' +
        '<span class="legend-swatch" style="background:' + en.hex + '"></span>' +
        '<span class="legend-name">' + en.name + '</span>';
      legend.appendChild(item);
    });
    sheet.appendChild(legend);

    // 숫자 격자 — 남은 공간에 최대 크기
    const cell = cellSize(pic, pw, ph);
    const box = document.createElement('div');
    box.className = 'grid-box';
    box.appendChild(buildGridSvg(pic, cell, data.map, data.cellNums));
    sheet.appendChild(box);

    const foot = document.createElement('div');
    foot.className = 'sheet-foot';
    foot.textContent = '인지학습지';
    sheet.appendChild(foot);

    fitPreview(pw, ph);
  }

  /* ─────────── 화면 미리보기 배율 ─────────── */
  function fitPreview(pw, ph) {
    const wrap = $('preview-wrap');
    const sheet = $('sheet');
    const pxPerMm = 96 / 25.4;
    const availW = Math.max(280, wrap.clientWidth - 32);
    const s = Math.min(1, availW / (pw * pxPerMm));
    sheet.style.transform = 'scale(' + s + ')';
    wrap.style.height = (ph * pxPerMm * s + 46) + 'px';
  }

  /* ─────────── 컨트롤 ─────────── */
  function bindSeg(boxId, dataKey, apply) {
    $(boxId).addEventListener('click', e => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      $(boxId).querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('sel', b === btn));
      apply(btn.dataset[dataKey]);
      renderSheet();
    });
  }
  bindSeg('paper-btns', 'paper', v => { state.paper = v; });
  bindSeg('orient-btns', 'orient', v => { state.orient = v; });
  bindSeg('namedate-btns', 'namedate', v => { state.nameDate = v === 'on'; });
  bindSeg('bgfill-btns', 'bgfill', v => { state.bgFill = v === 'on'; });

  $('btn-print').addEventListener('click', () => window.print());
  window.addEventListener('resize', () => {
    const pic = PICS.find(p => p.id === state.picId);
    if (pic) { const [pw, ph] = paperDims(pic); fitPreview(pw, ph); }
  });

  renderList();
  renderSheet();
})();
