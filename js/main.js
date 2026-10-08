import { submitQuote, submitFleetQuote, FORMS_LIVE } from './api.js';

/* Real reviews only. Add entries like:
   { name: 'Jordan M.', vehicle: 'BMW M3', text: '…', stars: 5, source: 'Google' } */
const REVIEWS = [];

const FACEBOOK_URL = 'https://www.facebook.com/share/1XL3MjhNh7/?mibextid=wwXIfr';
const MAX_PHOTOS = 6;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Header ---------- */
const header = $('#siteHeader');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const navToggle = $('#navToggle');
const nav = $('#mainNav');
const setNav = (open) => {
  nav.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
};
navToggle.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
$$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

/* ---------- Reveal on scroll ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach((el) => {
  // stagger siblings slightly
  const siblings = $$(':scope > .reveal', el.parentElement);
  const i = siblings.indexOf(el);
  if (i > 0) el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`;
  revealObserver.observe(el);
});

/* ---------- Zoom on hover ---------- */
$$('.zoom').forEach((zoom) => {
  const move = (x, y) => {
    const r = zoom.getBoundingClientRect();
    zoom.style.setProperty('--zx', `${((x - r.left) / r.width) * 100}%`);
    zoom.style.setProperty('--zy', `${((y - r.top) / r.height) * 100}%`);
  };
  zoom.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
  // Touch: tap to toggle zoom at the tapped point
  zoom.addEventListener('click', (e) => {
    if (window.matchMedia('(hover: hover)').matches) return;
    move(e.clientX, e.clientY);
    zoom.classList.toggle('is-zoomed');
  });
});

/* ---------- Before / After sliders ---------- */
$$('.ba-frame').forEach((frame) => {
  const range = $('.ba-range', frame);
  const set = (v) => frame.style.setProperty('--pos', `${v}%`);
  range.addEventListener('input', () => set(range.value));
  set(range.value);
});

/* ---------- Reviews ---------- */
const reviewsList = $('#reviewsList');
if (REVIEWS.length) {
  reviewsList.innerHTML = REVIEWS.map((r) => `
    <figure class="review reveal is-visible">
      <div class="review-stars" aria-label="${r.stars} out of 5 stars">${'★'.repeat(r.stars)}</div>
      <blockquote>“${escapeHtml(r.text)}”</blockquote>
      <figcaption>${escapeHtml(r.name)}${r.vehicle ? ` · ${escapeHtml(r.vehicle)}` : ''}</figcaption>
    </figure>`).join('');
} else {
  reviewsList.innerHTML = `
    <div class="reviews-empty">
      <p>We'd rather show you real words from real clients than fill this space. Reviews are on their way.</p>
      <a class="btn btn-outline" href="${FACEBOOK_URL}" target="_blank" rel="noopener">See us on Facebook</a>
    </div>`;
}

/* ---------- Quote form ---------- */
const quoteForm = $('#quoteForm');
const quoteConfirm = $('#quoteConfirm');
const photoInput = $('#photoInput');
const photoThumbs = $('#photoThumbs');
const uploadDrop = $('#uploadDrop');
let photos = [];

// Pre-select a service when a "Request a Quote" button on a service card is used
$$('[data-service]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const box = $(`input[name="services"][value="${btn.dataset.service}"]`, quoteForm);
    if (box) box.checked = true;
  });
});

// Mobile address toggle
const mobileAddress = $('#mobileAddress');
$$('input[name="locationType"]', quoteForm).forEach((radio) => {
  radio.addEventListener('change', () => {
    const isMobile = $('input[name="locationType"]:checked', quoteForm).value === 'mobile';
    mobileAddress.hidden = !isMobile;
    $('input', mobileAddress).required = isMobile;
  });
});

// Photos
const renderThumbs = () => {
  photoThumbs.innerHTML = '';
  photos.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const div = document.createElement('div');
    div.className = 'thumb';
    div.innerHTML = `<img src="${url}" alt="Uploaded photo ${i + 1}"><button type="button" aria-label="Remove photo ${i + 1}">×</button>`;
    $('img', div).onload = () => URL.revokeObjectURL(url);
    $('button', div).addEventListener('click', () => { photos.splice(i, 1); renderThumbs(); });
    photoThumbs.appendChild(div);
  });
};
const addPhotos = (files) => {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  photos = [...photos, ...images].slice(0, MAX_PHOTOS);
  renderThumbs();
};
photoInput.addEventListener('change', () => { addPhotos(photoInput.files); photoInput.value = ''; });
['dragenter', 'dragover'].forEach((ev) => uploadDrop.addEventListener(ev, (e) => { e.preventDefault(); uploadDrop.classList.add('is-drag'); }));
['dragleave', 'drop'].forEach((ev) => uploadDrop.addEventListener(ev, () => uploadDrop.classList.remove('is-drag')));
uploadDrop.addEventListener('drop', (e) => { e.preventDefault(); addPhotos(e.dataTransfer.files); });

// Validation helper shared by both forms
function validate(form, extra = () => true) {
  let ok = true;
  $$('input, select, textarea', form).forEach((el) => {
    if (el.type === 'radio' || el.type === 'checkbox' || el.type === 'file') return;
    const bad = !el.checkValidity();
    el.classList.toggle('is-invalid', bad);
    if (bad) ok = false;
  });
  if (!extra()) ok = false;
  if (!ok) {
    const first = $('.is-invalid', form);
    first?.focus({ preventScroll: true });
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return ok;
}
$$('form').forEach((form) => form.addEventListener('input', (e) => {
  if (e.target.classList.contains('is-invalid') && e.target.checkValidity()) e.target.classList.remove('is-invalid');
}));

function setStatus(form, msg, type = '') {
  const el = $('.form-status', form);
  el.textContent = msg;
  el.className = `form-status ${type ? `is-${type}` : ''}`;
}

quoteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const servicesWrap = $('input[name="services"]', quoteForm).closest('.chips');
  const ok = validate(quoteForm, () => {
    const picked = $$('input[name="services"]:checked', quoteForm).length > 0;
    servicesWrap.classList.toggle('is-invalid', !picked);
    return picked;
  });
  if (!ok) { setStatus(quoteForm, 'Please check the highlighted fields.', 'error'); return; }

  const fd = new FormData(quoteForm);
  const data = {
    name: fd.get('name').trim(),
    phone: fd.get('phone').trim(),
    email: fd.get('email').trim(),
    customerType: fd.get('customerType'),
    make: fd.get('make').trim(),
    model: fd.get('model').trim(),
    year: Number(fd.get('year')),
    size: fd.get('size'),
    services: fd.getAll('services'),
    condition: fd.get('condition').trim(),
    locationType: fd.get('locationType'),
    address: fd.get('locationType') === 'mobile' ? fd.get('address').trim() : '',
  };

  const btn = $('button[type="submit"]', quoteForm);
  btn.disabled = true;
  setStatus(quoteForm, 'Sending…');
  try {
    await submitQuote(data, photos);
    $('#confirmName').textContent = data.name ? `, ${data.name.split(' ')[0]}` : '';
    $('#confirmNote').innerHTML = FORMS_LIVE ? '' :
      'Preview mode: online requests aren\'t live yet. For now, please call <a href="tel:+61458811873">0458 811 873</a> or email <a href="mailto:Kaiden@StoneysElitedetail.com">Kaiden@StoneysElitedetail.com</a>.';
    quoteForm.hidden = true;
    quoteConfirm.hidden = false;
    quoteConfirm.focus();
    quoteConfirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error(err);
    setStatus(quoteForm, 'Something went wrong. Please try again, or call us on 0458 811 873.', 'error');
  } finally {
    btn.disabled = false;
  }
});

$('#quoteAgain').addEventListener('click', () => {
  quoteForm.reset();
  photos = [];
  renderThumbs();
  mobileAddress.hidden = true;
  setStatus(quoteForm, '');
  quoteConfirm.hidden = true;
  quoteForm.hidden = false;
});

/* ---------- Fleet form ---------- */
const fleetForm = $('#fleetForm');
fleetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate(fleetForm)) { setStatus(fleetForm, 'Please check the highlighted fields.', 'error'); return; }
  const fd = new FormData(fleetForm);
  const data = {
    business: fd.get('business').trim(),
    name: fd.get('name').trim(),
    phone: fd.get('phone').trim(),
    email: fd.get('email').trim(),
    vehicleCount: Number(fd.get('vehicleCount')),
    vehicleTypes: fd.getAll('vehicleTypes'),
    frequency: fd.get('frequency'),
    notes: fd.get('notes').trim(),
  };
  const btn = $('button[type="submit"]', fleetForm);
  btn.disabled = true;
  setStatus(fleetForm, 'Sending…');
  try {
    await submitFleetQuote(data);
    fleetForm.reset();
    setStatus(fleetForm, FORMS_LIVE
      ? 'Thank you. Your fleet request is in. We\'ll be in touch shortly.'
      : 'Preview mode: online requests aren\'t live yet. Please call 0458 811 873 for fleet enquiries.', 'success');
  } catch (err) {
    console.error(err);
    setStatus(fleetForm, 'Something went wrong. Please try again, or call us on 0458 811 873.', 'error');
  } finally {
    btn.disabled = false;
  }
});

/* ---------- Misc ---------- */
$('#year').textContent = new Date().getFullYear();

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
