/* Interaction layer. The page and all direct WhatsApp links work without it. */
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 760px)');
const topBar = document.querySelector('.top');
const nav = document.querySelector('.nav');
const menu = document.querySelector('.menu-toggle');
const ctaBar = document.querySelector('.mobile-bar');
const booking = document.querySelector('#agendar');
const float = document.querySelector('#float-wa');
const backTop = document.querySelector('#back-top');
const targets = [...document.querySelectorAll('[data-context]')];
const whatsapp = 'https://wa.me/5551995617292?text=';
const money = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });
const wa = message => whatsapp + encodeURIComponent(message);
root.classList.add('js');

function setMenu(open, restore = false) {
  nav.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  menu.querySelector('use').setAttribute('href', open ? '#close' : '#menu');
  if (open) nav.querySelector('a').focus();
  if (restore) menu.focus();
}

menu.addEventListener('click', () => {
  const open = nav.classList.contains('open');
  setMenu(!open, open);
});
topBar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  if (!nav.classList.contains('open')) return;
  setMenu(false);
  const destination = document.getElementById(link.hash.slice(1));
  if (destination) {
    destination.tabIndex = -1;
    destination.focus({ preventScroll:true });
  }
}));
mobile.addEventListener('change', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (!nav.classList.contains('open')) return;
  if (event.key === 'Escape') setMenu(false, true);
  if (event.key !== 'Tab') return;
  const links = [...topBar.querySelectorAll('a,button')];
  const first = links[0];
  const last = links.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

/* Reading position, contextual booking and gentle image parallax. */
let frame = 0;
let activeSection = null;
const parallax = [...document.querySelectorAll('[data-parallax]')];
function scrollState() {
  frame = 0;
  const height = innerHeight;
  const range = root.scrollHeight - height;
  const position = scrollY;
  const relative = range > 0 ? Math.min(1, Math.max(0, position / range)) : 0;
  topBar.classList.toggle('scrolled', position > 24);
  topBar.querySelector('.progress').style.transform = 'scaleX(' + relative + ')';
  backTop.hidden = position < height;
  const bounds = booking.getBoundingClientRect();
  ctaBar.hidden = bounds.top < height * .75 && bounds.bottom > 90;

  const current = targets.findLast(section => {
    const box = section.getBoundingClientRect();
    return box.top < height * .53 && box.bottom > height * .15;
  }) ?? null;
  if (current !== activeSection) {
    activeSection = current;
    float.href = wa('Olá, vim do site da Cooper NYC e quero ' + (current?.dataset.context ?? 'agendar um horário') + '.');
    nav.querySelectorAll('a').forEach(link => {
      if (current && link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  if (!reduced.matches && !mobile.matches) {
    for (const figure of parallax) {
      const rect = figure.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height) continue;
      const offset = Math.max(-12, Math.min(12, (rect.top + rect.height / 2 - height / 2) * -.035));
      figure.style.setProperty('--parallax', offset.toFixed(1) + 'px');
    }
  }
}

function queueScroll() {
  if (!frame) frame = requestAnimationFrame(scrollState);
}
addEventListener('scroll', queueScroll, { passive:true });
addEventListener('resize', queueScroll);
document.addEventListener('toggle', queueScroll, true);
scrollState();

if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      element.classList.add('shown');
      const limit = Number(element.dataset.count);
      if (limit && !reduced.matches) {
        const start = performance.now();
        const paint = time => {
          const progress = Math.min((time - start) / 700, 1);
          element.textContent = Math.round(limit * (1 - (1 - progress) ** 3));
          if (progress < 1) requestAnimationFrame(paint);
        };
        requestAnimationFrame(paint);
      }
      reveal.unobserve(element);
    }
  }, { threshold:.12 });
  document.querySelectorAll('[data-reveal],[data-count],.squirrel').forEach(element => reveal.observe(element));
} else {
  document.querySelectorAll('[data-reveal]').forEach(element => element.classList.add('shown'));
}

/* Motion cover. Keep the poster for reduced motion or data saving. */
const video = document.querySelector('.hero-media video');
const videoToggle = document.querySelector('.video-toggle');
let videoVisible = true;
let videoOptOut = false;
function controlVideo() {
  if (!video.src && !reduced.matches && !navigator.connection?.saveData) video.src = video.dataset.src;
  if (!video.src) return;
  if (videoVisible && !videoOptOut && !reduced.matches && !document.hidden) {
    video.play().catch(() => { videoToggle.hidden = true; });
  } else {
    video.pause();
    if (reduced.matches) {
      video.classList.remove('playing');
      videoToggle.hidden = true;
    }
  }
}
video.addEventListener('playing', () => {
  video.classList.add('playing');
  videoToggle.hidden = false;
  videoToggle.setAttribute('aria-label', 'Pausar vídeo');
  videoToggle.querySelector('use').setAttribute('href', '#pause');
});
video.addEventListener('pause', () => {
  videoToggle.setAttribute('aria-label', 'Reproduzir vídeo');
  videoToggle.querySelector('use').setAttribute('href', '#play');
});
videoToggle.addEventListener('click', () => {
  videoOptOut = !video.paused;
  controlVideo();
});
reduced.addEventListener('change', controlVideo);
document.addEventListener('visibilitychange', controlVideo);
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(([entry]) => {
    videoVisible = entry.isIntersecting;
    controlVideo();
  });
  videoObserver.observe(video);
}
if (document.readyState === 'complete') setTimeout(controlVideo, 350);
else addEventListener('load', () => setTimeout(controlVideo, 350), { once:true });

/* Photo strips and swipe support. */
function addSwipe(target, step) {
  let start;
  target.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') start = { x:event.clientX, y:event.clientY };
  }, { passive:true });
  target.addEventListener('pointercancel', () => { start = null; });
  target.addEventListener('pointerup', event => {
    if (!start) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    start = null;
    if (Math.abs(x) > 46 && Math.abs(x) > Math.abs(y) * 1.4) step(x > 0 ? -1 : 1);
  }, { passive:true });
}

for (const carousel of document.querySelectorAll('[data-carousel]')) {
  const stage = carousel.querySelector('.carousel-stage');
  const slides = [...stage.querySelectorAll('figure')];
  const controls = carousel.querySelector('.carousel-controls');
  const dots = [...controls.querySelectorAll('[data-slide]')];
  const play = controls.querySelector('[data-play]');
  let index = 0;
  let interval;
  let visible = false;
  let paused = false;
  let hover = false;

  function show(number) {
    index = (number + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.classList.toggle('current', i === index);
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  }
  function syncTimer() {
    clearInterval(interval);
    if (!play || !visible || paused || hover || carousel.contains(document.activeElement) || reduced.matches || document.hidden) return;
    interval = setInterval(() => show(index + 1), 5700);
  }
  controls.hidden = false;
  controls.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
  controls.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.slide))));
  addSwipe(stage, direction => show(index + direction));
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(index + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  if (!play) continue;
  play.hidden = reduced.matches;
  play.addEventListener('click', () => {
    paused = !paused;
    play.setAttribute('aria-label', paused ? 'Reproduzir carrossel' : 'Pausar reprodução');
    play.querySelector('use').setAttribute('href', paused ? '#play' : '#pause');
    syncTimer();
  });
  carousel.addEventListener('mouseenter', () => { hover = true; syncTimer(); });
  carousel.addEventListener('mouseleave', () => { hover = false; syncTimer(); });
  carousel.addEventListener('focusin', syncTimer);
  carousel.addEventListener('focusout', () => setTimeout(syncTimer, 0));
  document.addEventListener('visibilitychange', syncTimer);
  reduced.addEventListener('change', () => { play.hidden = reduced.matches; syncTimer(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncTimer();
    }, { threshold:.3 }).observe(carousel);
  }
}

/* Drag comparison and modal for the salon gallery and color samples. */
const compare = document.querySelector('.compare-window input');
compare.addEventListener('input', () => {
  compare.parentElement.style.setProperty('--split', compare.value + '%');
  compare.setAttribute('aria-valuetext', compare.value + '% do segundo trabalho');
});
const dialog = document.querySelector('#media-dialog');
const gallery = [...document.querySelectorAll('[data-gallery]')];
const dialogFrame = dialog.querySelector('.dialog-image');
const dialogCaption = dialog.querySelector('#dialog-title');
const dialogDesc = dialog.querySelector('.dialog-desc');
const dialogCount = dialog.querySelector('[data-dialog-count]');
const zoomButton = dialog.querySelector('[data-dialog-zoom]');
const previous = dialog.querySelector('[data-dialog-prev]');
const next = dialog.querySelector('[data-dialog-next]');
let photoIndex = 0;
let mode = 'gallery';
let opener;

function setZoom(zoomed) {
  dialogFrame.classList.toggle('zoomed', zoomed);
  zoomButton.setAttribute('aria-pressed', String(zoomed));
  zoomButton.setAttribute('aria-label', zoomed ? 'Reduzir foto' : 'Ampliar foto');
}

function renderMedia(url, label, desc = '') {
  const photo = new Image();
  photo.src = url;
  photo.alt = label;
  dialogFrame.replaceChildren(photo);
  dialogCaption.textContent = label;
  dialogDesc.textContent = desc;
  dialogDesc.hidden = !desc;
  previous.hidden = next.hidden = mode !== 'gallery';
  dialogCount.textContent = mode === 'gallery' ? (photoIndex + 1) + ' de ' + gallery.length : '';
  setZoom(false);
}

function galleryStep(number) {
  if (mode !== 'gallery' || dialogFrame.classList.contains('zoomed')) return;
  photoIndex = (number + gallery.length) % gallery.length;
  const tile = gallery[photoIndex];
  renderMedia(tile.href, tile.querySelector('img').alt);
}
if (typeof dialog.showModal === 'function') {
  gallery.forEach((tile, i) => tile.addEventListener('click', event => {
    event.preventDefault();
    opener = tile;
    mode = 'gallery';
    galleryStep(i);
    dialog.showModal();
  }));
  document.querySelectorAll('[data-tone]').forEach(tone => tone.addEventListener('click', () => {
    opener = tone;
    mode = 'tone';
    renderMedia(tone.dataset.image, tone.dataset.title, tone.dataset.description);
    dialog.showModal();
  }));
}
dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { setZoom(false); opener?.focus(); });
zoomButton.addEventListener('click', () => setZoom(!dialogFrame.classList.contains('zoomed')));
previous.addEventListener('click', () => galleryStep(photoIndex - 1));
next.addEventListener('click', () => galleryStep(photoIndex + 1));
dialog.addEventListener('keydown', event => {
  if (mode !== 'gallery' || !['ArrowRight','ArrowLeft'].includes(event.key)) return;
  event.preventDefault();
  galleryStep(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
});
addSwipe(dialogFrame, direction => galleryStep(photoIndex + direction));

/* Catalogue, budget calculator and WhatsApp contact. */
const search = document.querySelector('#service-search');
const category = document.querySelector('#service-category');
const catalogue = [...document.querySelectorAll('[data-service-card]')];
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
function filterServices() {
  const query = normalize(search.value);
  let count = 0;
  for (const card of catalogue) {
    const matches = (!category.value || card.dataset.category === category.value) && normalize(card.dataset.name).includes(query);
    card.hidden = !matches;
    count += Number(matches);
  }
  document.querySelector('#service-count').textContent = count ? count + (count === 1 ? ' serviço' : ' serviços') : 'Nenhum serviço encontrado.';
  queueScroll();
}
search.addEventListener('input', filterServices);
category.addEventListener('change', filterServices);
document.querySelector('.catalog-tools').hidden = false;
filterServices();

const budgetOptions = [...document.querySelectorAll('[data-budget-service]')];
const budgetLink = document.querySelector('#budget-link');
function updateBudget() {
  const selected = budgetOptions.filter(option => option.checked);
  const total = selected.reduce((sum, option) => sum + Number(option.value), 0);
  document.querySelector('#budget-total').textContent = 'Total inicial: ' + money.format(total);
  budgetLink.href = wa(selected.length
    ? 'Olá, vim do site e quero consultar ' + selected.map(option => option.dataset.budgetService).join(', ') + '. O total inicial exibido foi ' + money.format(total) + '.'
    : 'Olá, vim do site e quero consultar valores na Cooper NYC.');
}
budgetOptions.forEach(option => option.addEventListener('change', updateBudget));

const form = document.querySelector('#contact-form');
const send = form.querySelector('#contact-send');
form.hidden = false;
form.addEventListener('input', () => { send.hidden = true; });
form.addEventListener('submit', event => {
  event.preventDefault();
  const name = form.elements.name.value.trim();
  if (!name) {
    form.elements.name.setCustomValidity('Informa teu nome.');
    form.elements.name.reportValidity();
    return;
  }
  const { service, day } = form.elements;
  send.href = wa('Olá, vim do site da Cooper NYC. Meu nome é ' + name + ' e quero agendar ' + service.value + '.' + (day.value ? ' Meu melhor dia é ' + day.value + '.' : ''));
  send.hidden = false;
  send.focus();
});
form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));

/* Local opening hours use Porto Alegre time, independent of the device zone. */
function openingStatus(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:'America/Sao_Paulo', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23',
  }).formatToParts(now);
  const { weekday, hour, minute } = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const minutes = Number(hour) * 60 + Number(minute);
  const workday = ['Tue','Wed','Thu','Fri','Sat'].includes(weekday);
  if (workday && minutes >= 600 && minutes < 1200) return { open:true, text:'Aberto agora · Fecha às 20h' };
  if (workday && minutes < 600) return { open:false, text:'Fechado agora · Abre hoje às 10h' };
  if (weekday === 'Sat' || weekday === 'Sun') return { open:false, text:'Fechado agora · Abre terça às 10h' };
  return { open:false, text:'Fechado agora · Abre amanhã às 10h' };
}
const statusLabel = document.querySelector('#open-status');
function renderStatus() {
  const status = openingStatus();
  statusLabel.classList.toggle('open', status.open);
  statusLabel.textContent = status.text;
  statusLabel.hidden = false;
}
renderStatus();
setInterval(renderStatus, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderStatus(); });

/* Mouse-only accent. The native pointer remains available. */
if (matchMedia('(pointer: fine)').matches) {
  const ring = document.querySelector('.cursor-ring');
  let pointerFrame = 0;
  let point;
  addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    point = event;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      ring.style.setProperty('--x', point.clientX + 'px');
      ring.style.setProperty('--y', point.clientY + 'px');
      ring.classList.add('active');
      ring.classList.toggle('large', !!point.target.closest?.('a, button, img, video'));
    });
  }, { passive:true });
  document.documentElement.addEventListener('pointerleave', () => ring.classList.remove('active'));
}

/* Keep the structured FAQ in sync if its HTML content is edited. */
const schemaNode = document.querySelector('#local-schema');
const schema = JSON.parse(schemaNode.textContent);
const faq = schema['@graph'].find(node => node['@type'] === 'FAQPage');
faq.mainEntity = Array.from(document.querySelectorAll('#faq details'), entry => ({
  '@type':'Question',
  name:entry.querySelector('summary').textContent.trim(),
  acceptedAnswer:{ '@type':'Answer', text:entry.querySelector('p').textContent.trim() },
}));
schemaNode.textContent = JSON.stringify(schema);
