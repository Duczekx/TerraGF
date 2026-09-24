const viewer = document.querySelector('#fork-model');
const rotate = document.querySelector('#rotate-toggle');
const reset = document.querySelector('#reset-view');
const status = document.querySelector('#model-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function setRotation(on) {
  viewer.toggleAttribute('auto-rotate', on);
  rotate.setAttribute('aria-pressed', String(on));
  rotate.setAttribute('aria-label', on ? i18n.t('Zatrzymaj automatyczny obrót') : i18n.t('Włącz automatyczny obrót'));
  rotate.title = rotate.getAttribute('aria-label');
  rotate.firstElementChild.textContent = on ? 'Ⅱ' : '▷';
}
setRotation(!reducedMotion.matches);
reducedMotion.addEventListener('change', () => setRotation(!reducedMotion.matches));
rotate.addEventListener('click', () => setRotation(!viewer.hasAttribute('auto-rotate')));
reset.addEventListener('click', () => {
  viewer.cameraOrbit = `140deg 68deg ${modelRadius}m`;
  viewer.fieldOfView = '30deg';
  viewer.resetTurntableRotation?.();
  i18n.message(status, 'Przywrócono widok początkowy.');
});
viewer.addEventListener('progress', event => {
  document.querySelector('.model-loading span').style.width = `${event.detail.totalProgress * 100}%`;
});
viewer.addEventListener('load', () => {
  document.querySelector('.model-loading').hidden = true;
  i18n.message(status, 'Model 3D gotowy. Możesz obracać go myszą, dotykiem lub klawiszami strzałek.');
});
function modelError() {
  document.querySelector('.viewer-error').hidden = false;
  document.querySelector('.model-loading').hidden = true;
  rotate.disabled = true;
  reset.disabled = true;
}
viewer.addEventListener('error', modelError);
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu(){ menuButton.setAttribute('aria-expanded','false'); mobileNav.hidden = true; }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape') closeMenu(); });
matchMedia('(min-width: 1021px)').addEventListener('change',closeMenu);

const workFilm = document.querySelector('#work-film');
const workStart = document.querySelector('#work-film-start');
const motionFilm = document.querySelector('#motion-film');
const motionToggle = document.querySelector('#motion-toggle');
const filmStatus = document.querySelector('#film-status');
let motionVisible = false;
let motionUserPaused = false;
const saveData = navigator.connection?.saveData === true;
function syncMotionButton() {
  const playing = !motionFilm.paused;
  motionToggle.setAttribute('aria-pressed', String(playing));
  motionToggle.setAttribute('aria-label', playing ? i18n.t('Zatrzymaj krótki film') : i18n.t('Odtwórz krótki film'));
  motionToggle.firstElementChild.textContent = playing ? 'Ⅱ' : '▶';
}
async function playMotion() {
  if (!motionFilm.getAttribute('src')) motionFilm.src = motionFilm.dataset.src;
  try { await motionFilm.play(); } catch { syncMotionButton(); }
}
workStart.addEventListener('click', async () => {
  filmStatus.textContent = ''; delete filmStatus.dataset.message;
  workStart.disabled = true;
  try { await workFilm.play(); }
  catch { i18n.message(filmStatus, 'Nie udało się odtworzyć filmu. Spróbuj ponownie lub otwórz nagranie bezpośrednio.'); }
  finally { workStart.disabled = false; }
});
workFilm.addEventListener('play', () => { workStart.hidden = true; motionFilm.pause(); });
workFilm.addEventListener('ended', () => { workStart.hidden = false; });
workFilm.addEventListener('error', () => {
  workStart.hidden = false;
  i18n.message(filmStatus, 'Film jest chwilowo niedostępny. Odśwież stronę, aby spróbować ponownie.');
});
motionToggle.addEventListener('click', () => {
  if (motionFilm.paused) { motionUserPaused = false; playMotion(); }
  else { motionUserPaused = true; motionFilm.pause(); }
});
motionFilm.addEventListener('play', syncMotionButton);
motionFilm.addEventListener('pause', syncMotionButton);
motionFilm.addEventListener('error', () => {
  syncMotionButton();
  i18n.message(filmStatus, 'Krótki film jest chwilowo niedostępny.');
});
if ('IntersectionObserver' in window) {
  const filmObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === motionFilm) {
        motionVisible = entry.isIntersecting && entry.intersectionRatio >= .35;
        if (motionVisible && !reducedMotion.matches && !saveData && !motionUserPaused && workFilm.paused && !document.hidden) playMotion();
        else if (!motionVisible) motionFilm.pause();
      } else if (!entry.isIntersecting) workFilm.pause();
    }
  }, {threshold:[0,.35]});
  filmObserver.observe(motionFilm);
  filmObserver.observe(workFilm);
}
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) motionFilm.pause(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { workFilm.pause(); motionFilm.pause(); }
  else if (motionVisible && !motionUserPaused && !reducedMotion.matches && !saveData) playMotion();
});

/* Full-size photos stay on the page, with native focus trapping and Escape. */
const gallery = document.querySelector('#photo-gallery');
const photoLinks = [...document.querySelectorAll('a[href$="-1920.webp"]')];
const galleryImage = document.querySelector('#gallery-image');
const galleryError = document.querySelector('#gallery-error');
let photoIndex = 0;
let galleryOrigin;
function showPhoto(index) {
  photoIndex = (index + photoLinks.length) % photoLinks.length;
  const link = photoLinks[photoIndex];
  galleryError.hidden = true;
  galleryImage.alt = link.querySelector('img').alt;
  galleryImage.src = link.href;
  document.querySelector('#gallery-count').textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(photoLinks.length).padStart(2, '0')}`;
}
photoLinks.forEach((link, index) => {
  link.removeAttribute('target');
  link.setAttribute('aria-haspopup', 'dialog');
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    galleryOrigin = link;
    showPhoto(index);
    gallery.showModal();
    document.body.classList.add('gallery-open');
    workFilm.pause(); motionFilm.pause();
    document.querySelector('.gallery-close').focus();
  });
});
function closeGallery() { gallery.close(); }
document.querySelector('.gallery-close').addEventListener('click', closeGallery);
gallery.addEventListener('click', event => { if (event.target === gallery || event.target.classList.contains('gallery-image-wrap')) closeGallery(); });
gallery.addEventListener('close', () => {
  document.body.classList.remove('gallery-open');
  galleryOrigin?.focus({preventScroll:true});
});
gallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
document.querySelector('#gallery-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
document.querySelector('#gallery-next').addEventListener('click', () => showPhoto(photoIndex + 1));
galleryImage.addEventListener('error', () => { galleryError.hidden = false; });
let touchStart;
galleryImage.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, {passive:true});
galleryImage.addEventListener('touchend', event => {
  const delta = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(delta) > 65) showPhoto(photoIndex + (delta < 0 ? 1 : -1));
}, {passive:true});

// Animate only as content enters view; content remains readable without JS.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.animate([{opacity:.35, transform:'translateY(22px)'},{opacity:1, transform:'translateY(0)'}], {duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
        reveal.unobserve(entry.target);
      }
    });
  }, {threshold:.12});
  document.querySelectorAll('.section-heading,.construction-layout,.film-card,.field-photo,.technical-intro,.contact-layout').forEach(el => reveal.observe(el));
}

// Fit the bounding sphere to the smaller viewport dimension at any rotation.
let modelRadius = 6;
function fitModel() {
  const rect = viewer.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const halfFov = Math.atan(Math.tan(Math.PI / 12) * Math.min(1, rect.width / rect.height));
  const sphere = Math.hypot(1.9065, 1.5962, 1.2046) / 2;
  modelRadius = sphere / Math.sin(halfFov) * 1.025;
  const orbit = viewer.getCameraOrbit?.();
  const theta = orbit ? `${orbit.theta}rad` : '140deg';
  const phi = orbit ? `${orbit.phi}rad` : '68deg';
  viewer.cameraOrbit = `${theta} ${phi} ${modelRadius}m`;
  viewer.minCameraOrbit = `auto 55deg ${modelRadius}m`;
  viewer.maxCameraOrbit = `auto 80deg ${modelRadius}m`;
}
customElements.whenDefined('model-viewer').then(() => {
  fitModel();
  new ResizeObserver(fitModel).observe(viewer);
});
viewer.addEventListener('load', fitModel);

document.addEventListener('languagechange', () => {
  setRotation(viewer.hasAttribute('auto-rotate'));
  syncMotionButton();
  if (gallery.open) galleryImage.alt = photoLinks[photoIndex].querySelector('img').alt;
});
