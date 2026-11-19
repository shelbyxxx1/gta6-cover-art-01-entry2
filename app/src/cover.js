// Golden Hour Cover Studio — cover renderer.
// Draws a multi-panel GTA-style poster cover onto a canvas: photos in panels,
// a warm or neon grade, hand-drawn decorations (retro sun, palms, stars, stamp,
// halftone, vignette) and a bold caption band. Everything is drawn in code;
// no Rockstar logo, artwork, character or game font is used anywhere.

export const GRADES = {
  golden: {
    wash: ['#ff9e3d', '#ff5e8a'],
    band: ['#3d0a4e', '#c22e6d', '#ff8a3d'],
    sun: '#ffd166',
    accent: '#ffd166',
    title: '#ffffff',
    kicker: '#ffd166',
    overlay: 'rgba(255,120,40,0.16)',
    vignette: 'rgba(40,8,40,0.55)',
  },
  neon: {
    wash: ['#ff2e88', '#22d3ee'],
    band: ['#12002e', '#7a0e6e', '#ff2e88'],
    sun: '#ff5ce1',
    accent: '#22d3ee',
    title: '#ffffff',
    kicker: '#22d3ee',
    overlay: 'rgba(255,46,136,0.20)',
    vignette: 'rgba(8,4,40,0.6)',
  },
  heat: {
    wash: ['#ff3b1f', '#ffb03d'],
    band: ['#2a0500', '#8a1408', '#ff6a1f'],
    sun: '#ffcf3d',
    accent: '#ffcf3d',
    title: '#fff3d6',
    kicker: '#ffcf3d',
    overlay: 'rgba(255,60,20,0.22)',
    vignette: 'rgba(30,2,0,0.6)',
  },
  noir: {
    wash: ['#3d6b8a', '#101b2e'],
    band: ['#060a14', '#14263e', '#2e4a6b'],
    sun: '#cfe8ff',
    accent: '#cfe8ff',
    title: '#f2f7ff',
    kicker: '#9fd8ff',
    overlay: 'rgba(20,60,110,0.18)',
    vignette: 'rgba(2,4,12,0.65)',
  },
};

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

/** Panel rectangles for a layout, as fractions of the art area (above the caption band). */
export function layoutPanels(layout) {
  if (layout === 'grid') {
    return [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ];
  }
  if (layout === 'strip') {
    return [
      { x: 0, y: 0, w: 1, h: 0.55 },
      { x: 0, y: 0.55, w: 0.3333, h: 0.45 },
      { x: 0.3333, y: 0.55, w: 0.3334, h: 0.45 },
      { x: 0.6667, y: 0.55, w: 0.3333, h: 0.45 },
    ];
  }
  // poster: hero + two stacked side panels
  return [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.62, y: 0, w: 0.38, h: 0.5 },
    { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
  ];
}

function drawPhotoCover(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.ox || 0);
  const dy = rect.y + (rect.h - dh) / 2 + (panel.oy || 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawEmptyPanel(ctx, rect, grade, label) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, grade.wash[0]);
  g.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function drawRetroSun(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, grade.sun);
  g.addColorStop(1, '#ff5e3d');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20,8,30,0.55)';
  let y = cy - r * 0.1;
  let gap = r * 0.09;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap * 0.55);
    y += gap;
    gap *= 1.45;
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -60, 6, -118);
  ctx.stroke();
  ctx.translate(6, -118);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.08 + i * 0.16);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 52, Math.sin(a) * 52 - 18, Math.cos(a) * 92, Math.sin(a) * 92 + 26);
    ctx.quadraticCurveTo(Math.cos(a) * 52, Math.sin(a) * 52 + 8, 0, 0);
    ctx.fill();
  }
  ctx.restore();
}

function drawStars(ctx, w, y, n, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = w * (0.5 + (i - (n - 1) / 2) * 0.055);
    drawStar(ctx, x, y, size, size * 0.42);
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, rOuter, rInner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHalftone(ctx, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(14, w * 0.014);
  for (let y = h * 0.62; y < h; y += step) {
    for (let x = (y / step % 2) * step / 2; x < w; x += step) {
      const r = 1.1 + ((y - h * 0.62) / (h * 0.38)) * 2.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStamp(ctx, x, y, r, text, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.16);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `700 ${r * 0.34}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -r * 0.16);
  ctx.font = `700 ${r * 0.2}px system-ui, sans-serif`;
  ctx.fillText('EST. 2026', 0, r * 0.3);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

/**
 * Draws the whole cover.
 * opts: { layout, grade, size, kicker, title, tagline, panels: [{img, zoom, ox, oy}] }
 */
export function drawCover(canvas, opts) {
  const [W, H] = SIZES[opts.size] || SIZES['1080x1080'];
  const grade = GRADES[opts.grade] || GRADES.golden;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const u = W / 1080; // scale unit
  const bandH = H * (opts.size === '1920x1080' ? 0.30 : 0.26);
  const artH = H - bandH;
  const gutter = Math.max(6, 10 * u);

  // Frame
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, W, H);

  // Panels
  const rects = layoutPanels(opts.layout);
  rects.forEach((frac, i) => {
    const rect = {
      x: frac.x * W + (frac.x === 0 ? gutter : gutter / 2),
      y: frac.y * artH + (frac.y === 0 ? gutter : gutter / 2),
      w: frac.w * W - gutter,
      h: frac.h * artH - gutter,
    };
    const panel = opts.panels[i] || {};
    if (panel.img) drawPhotoCover(ctx, panel.img, rect, panel);
    else drawEmptyPanel(ctx, rect, grade, `PANEL ${i + 1}`);
    // warm wash over every panel
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = grade.overlay;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });

  // Decorations on the hero panel
  const hero = rects[0];
  const heroRect = {
    x: hero.x * W + gutter,
    y: hero.y * artH + gutter,
    w: hero.w * W - gutter,
    h: hero.h * artH - gutter,
  };
  drawRetroSun(ctx, heroRect.x + heroRect.w * 0.78, heroRect.y + heroRect.h * 0.22, heroRect.w * 0.13, grade);
  drawPalm(ctx, heroRect.x + heroRect.w * 0.06, heroRect.y + heroRect.h * 0.98, Math.max(0.5, heroRect.w / 900), 'rgba(12,6,20,0.85)');
  drawPalm(ctx, heroRect.x + heroRect.w * 0.16, heroRect.y + heroRect.h * 0.98, Math.max(0.35, heroRect.w / 1300), 'rgba(12,6,20,0.7)');
  drawHalftone(ctx, W, artH, 'rgba(255,255,255,0.10)');

  // Vignette over the art area
  const vig = ctx.createRadialGradient(W / 2, artH / 2, Math.min(W, artH) * 0.35, W / 2, artH / 2, Math.max(W, artH) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, grade.vignette);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, artH);

  // Caption band
  const band = ctx.createLinearGradient(0, artH, W, artH + bandH);
  band.addColorStop(0, grade.band[0]);
  band.addColorStop(0.55, grade.band[1]);
  band.addColorStop(1, grade.band[2]);
  ctx.fillStyle = band;
  ctx.fillRect(0, artH, W, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, artH, W, Math.max(2, 3 * u));

  const pad = 44 * u;
  const cx = W / 2;
  const wide = opts.size === '1920x1080';
  let ty = artH + bandH * 0.12;

  // Kicker (capped so it stays clear of the title on wide covers)
  const kicker = (opts.kicker || '').toUpperCase();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = grade.kicker;
  ctx.letterSpacing = `${Math.max(3, 6 * u)}px`;
  fitFont(ctx, kicker, W - pad * 2, Math.min(34 * u, 40), "'Anton', sans-serif", 400);
  ctx.fillText(kicker, cx, ty);
  ctx.letterSpacing = '0px';
  ty += bandH * (wide ? 0.22 : 0.18);

  // Title with dark outline
  const title = (opts.title || 'GOLDEN HOUR').toUpperCase();
  const titleStart = wide ? 110 * u : (opts.size === '1080x1350' ? 150 : 140) * u;
  const titlePx = fitFont(ctx, title, W - pad * 2, titleStart, "'Anton', sans-serif", 400);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,6,30,0.9)';
  ctx.lineWidth = Math.max(4, titlePx * 0.07);
  ctx.strokeText(title, cx, ty + titlePx * 0.30);
  ctx.fillStyle = grade.title;
  ctx.fillText(title, cx, ty + titlePx * 0.30);
  ty += titlePx * 0.70;

  // Tagline in script
  const tagline = opts.tagline || '';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  fitFont(ctx, tagline, W - pad * 2, (opts.size === '1920x1080' ? 44 : 52) * u, "'Pacifico', cursive", 400);
  ctx.fillText(tagline, cx, ty + bandH * 0.08);

  // Stamp
  const stampR = 46 * u;
  const stampX = W - 64 * u;
  const stampY = artH - 64 * u;
  ctx.save();
  ctx.fillStyle = 'rgba(10,5,20,0.35)';
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR * 1.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawStamp(ctx, stampX, stampY, stampR, 'VOL. 01', grade.accent);
}
