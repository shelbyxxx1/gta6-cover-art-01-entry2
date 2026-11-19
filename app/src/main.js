// Golden Hour Cover Studio — page wiring.
// Loads photos, keeps per-panel crop state (drag to pan, wheel to zoom, sliders),
// redraws the live preview and exports the cover as a PNG.
// `?shot=cover|editor` sets up a fixed scene for screenshots.
import { drawCover, layoutPanels, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const kickerEl = document.getElementById('kicker');
const titleEl = document.getElementById('title');
const taglineEl = document.getElementById('tagline');
const panelList = document.getElementById('panelList');

const state = {
  layout: 'poster',
  grade: 'golden',
  size: '1080x1080',
  panels: [],
  selected: 0,
};

function panelCount() {
  return layoutPanels(state.layout).length;
}

function ensurePanels() {
  while (state.panels.length < panelCount()) {
    state.panels.push({ img: null, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = panelCount();
  if (state.selected >= state.panels.length) state.selected = 0;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadFonts() {
  try {
    const anton = new FontFace('Anton', 'url(fonts/Anton-Regular.ttf)');
    const pacifico = new FontFace('Pacifico', 'url(fonts/Pacifico-Regular.ttf)');
    const [a, p] = await Promise.all([anton.load(), pacifico.load()]);
    document.fonts.add(a);
    document.fonts.add(p);
    await document.fonts.ready;
  } catch (err) {
    // Fall back to system fonts; the cover still draws.
    console.warn('font load failed', err);
  }
}

export function redraw() {
  ensurePanels();
  drawCover(canvas, {
    layout: state.layout,
    grade: state.grade,
    size: state.size,
    kicker: kickerEl.value,
    title: titleEl.value,
    tagline: taglineEl.value,
    panels: state.panels,
  });
}

function renderPanelList() {
  ensurePanels();
  panelList.innerHTML = '';
  const names = ['Hero', 'Panel 2', 'Panel 3', 'Panel 4'];
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.selected ? ' selected' : '');
    row.innerHTML =
      `<div class="row-head"><span>${names[i]}</span><span>${panel.img ? 'photo loaded' : 'empty'}</span></div>` +
      `<label>Zoom <input type="range" min="1" max="3" step="0.05" value="${panel.zoom}" data-kind="zoom"></label>` +
      `<label>Pan X <input type="range" min="-300" max="300" step="1" value="${panel.ox}" data-kind="ox"></label>` +
      `<label>Pan Y <input type="range" min="-300" max="300" step="1" value="${panel.oy}" data-kind="oy"></label>`;
    row.addEventListener('click', () => {
      state.selected = i;
      renderPanelList();
    });
    row.querySelectorAll('input').forEach((input) => {
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('input', () => {
        panel[input.dataset.kind] = parseFloat(input.value);
        redraw();
      });
    });
    panelList.appendChild(row);
  });
}

function bindSegment(id, key) {
  document.getElementById(id).addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll(`#${id} button`).forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const value = btn.dataset[key];
    if (key === 'layout') state.layout = value;
    if (key === 'grade') state.grade = value;
    if (key === 'size') state.size = value;
    renderPanelList();
    redraw();
  });
}

bindSegment('layoutSeg', 'layout');
bindSegment('gradeSeg', 'grade');
bindSegment('sizeSeg', 'size');

[kickerEl, titleEl, taglineEl].forEach((el) => el.addEventListener('input', redraw));

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  ensurePanels();
  state.panels[state.selected] = { img, zoom: 1, ox: 0, oy: 0 };
  status.textContent = `Photo loaded into ${state.selected === 0 ? 'the hero panel' : 'panel ' + (state.selected + 1)} — drag it to frame, then export.`;
  renderPanelList();
  redraw();
  e.target.value = '';
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const img = await loadImage(btn.dataset.sample);
    ensurePanels();
    state.panels[state.selected] = { img, zoom: 1, ox: 0, oy: 0 };
    status.textContent = `Sample photo loaded into ${state.selected === 0 ? 'the hero panel' : 'panel ' + (state.selected + 1)}.`;
    renderPanelList();
    redraw();
  });
});

document.getElementById('export').addEventListener('click', () => {
  const off = document.createElement('canvas');
  drawCover(off, {
    layout: state.layout,
    grade: state.grade,
    size: state.size,
    kicker: kickerEl.value,
    title: titleEl.value,
    tagline: taglineEl.value,
    panels: state.panels,
  });
  const [w, h] = SIZES[state.size];
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `golden-hour-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved golden-hour-cover-${w}x${h}.png`;
  }, 'image/png');
});

// Drag to pan + wheel to zoom on the preview canvas.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top) * scaleY;
  const bandFrac = state.size === '1920x1080' ? 0.30 : 0.26;
  const artH = canvas.height * (1 - bandFrac);
  const rects = layoutPanels(state.layout).map((f) => ({
    x: f.x * canvas.width,
    y: f.y * artH,
    w: f.w * canvas.width,
    h: f.h * artH,
  }));
  const hit = rects.findIndex((r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h);
  if (hit < 0) return;
  state.selected = hit;
  renderPanelList();
  drag = { panel: state.panels[hit], startX: px, startY: py, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  drag.panel.ox = drag.ox + (px - drag.startX);
  drag.panel.oy = drag.oy + (py - drag.startY);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  ensurePanels();
  const panel = state.panels[state.selected];
  panel.zoom = Math.min(3, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  renderPanelList();
  redraw();
}, { passive: false });

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
await loadFonts();
if (shot) {
  await runShot(shot, params, loadImage, state, (img, slot) => {
    ensurePanels();
    state.panels[slot] = { img, zoom: 1, ox: 0, oy: 0 };
  });
  renderPanelList();
  redraw();
} else {
  // Default scene: three original photos, one per panel.
  const defaults = ['photos/woman-convertible.jpg', 'photos/fisherman-pier.jpg', 'photos/neon-street.jpg'];
  for (let i = 0; i < Math.min(defaults.length, panelCount()); i++) {
    try {
      state.panels[i] = { img: await loadImage(defaults[i]), zoom: 1, ox: 0, oy: 0 };
    } catch (err) {
      console.warn('default photo failed', defaults[i], err);
    }
  }
  renderPanelList();
  redraw();
}
window.__studioReady = true;
