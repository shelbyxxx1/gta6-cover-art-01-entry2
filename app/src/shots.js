// Fixed scenes for screenshots: ?shot=cover shows the cover alone at full bleed,
// ?shot=editor shows the editor with photos loaded.
// Query params: layout (poster|grid|strip), grade, size, kicker, title, tagline,
// photo (hero sample), photo2, photo3. window.__shotReady is set once painted.
export async function runShot(shot, query, loadImage, state, placePhoto) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout') || 'poster';
  const grade = query.get('grade') || 'golden';
  const size = query.get('size') || '1080x1080';
  document.querySelectorAll('#layoutSeg button').forEach((b) => b.classList.toggle('active', b.dataset.layout === layout));
  document.querySelectorAll('#gradeSeg button').forEach((b) => b.classList.toggle('active', b.dataset.grade === grade));
  document.querySelectorAll('#sizeSeg button').forEach((b) => b.classList.toggle('active', b.dataset.size === size));
  state.layout = layout;
  state.grade = grade;
  state.size = size;
  const kicker = document.getElementById('kicker');
  const title = document.getElementById('title');
  const tagline = document.getElementById('tagline');
  if (query.get('kicker')) kicker.value = query.get('kicker');
  if (query.get('title')) title.value = query.get('title');
  if (query.get('tagline')) tagline.value = query.get('tagline');

  const photos = [
    query.get('photo') || 'photos/woman-convertible.jpg',
    query.get('photo2') || 'photos/fisherman-pier.jpg',
    query.get('photo3') || 'photos/neon-street.jpg',
    query.get('photo4') || 'samples/boulevard.jpg',
  ];
  for (let i = 0; i < photos.length; i++) {
    try {
      placePhoto(await loadImage(photos[i]), i);
    } catch (err) {
      console.warn('shot photo failed', photos[i], err);
    }
  }
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
