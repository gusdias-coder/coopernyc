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

/* Crossfade fixed photos to avoid camera movement on the cover. */
const cover = document.querySelector('.hero-media');
const coverPhoto = cover.querySelector('.hero-crossfade');
const coverToggle = cover.querySelector('.cover-toggle');
let coverVisible = true;
let coverPaused = false;

function syncCover() {
  const enabled = coverPhoto.complete && coverPhoto.naturalWidth > 0
    && !reduced.matches && !navigator.connection?.saveData;
  cover.classList.toggle('cover-animated', enabled);
  cover.classList.toggle('cover-running', enabled && coverVisible && !coverPaused && !document.hidden);
  coverToggle.hidden = !enabled;
  coverToggle.setAttribute('aria-label', coverPaused ? 'Retomar animação da capa' : 'Pausar animação da capa');
  coverToggle.querySelector('use').setAttribute('href', coverPaused ? '#play' : '#pause');
}
coverToggle.addEventListener('click', () => {
  coverPaused = !coverPaused;
  syncCover();
});
coverPhoto.addEventListener('load', syncCover);
reduced.addEventListener('change', syncCover);
document.addEventListener('visibilitychange', syncCover);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    coverVisible = entry.isIntersecting;
    syncCover();
  }).observe(cover);
}
syncCover();

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
const previous = dialog.querySelector('[data-dialog-prev]');
const next = dialog.querySelector('[data-dialog-next]');
let photoIndex = 0;
let mode = 'gallery';
let opener;

function renderMedia(url, label, desc = '') {
  const photo = new Image();
  photo.src = url;
  dialog.dataset.reference = url;
  photo.alt = label;
  dialogFrame.replaceChildren(photo);
  dialogCaption.textContent = label;
  dialogDesc.textContent = desc;
  dialogDesc.hidden = !desc;
  previous.hidden = next.hidden = mode !== 'gallery';
  dialogCount.textContent = mode === 'gallery' ? (photoIndex + 1) + ' de ' + gallery.length : '';
  document.querySelector('#save-reference').textContent='Salvar referência';
  document.querySelector('#media-actions').hidden = !['result', 'tone'].includes(mode);
}

function galleryStep(number) {
  if (mode !== 'gallery') return;
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
dialog.addEventListener('close', () => { if (!document.querySelector('#booking-dialog').open) opener?.focus(); });
previous.addEventListener('click', () => galleryStep(photoIndex - 1));
next.addEventListener('click', () => galleryStep(photoIndex + 1));
dialog.addEventListener('keydown', event => {
  if (mode !== 'gallery' || !['ArrowRight','ArrowLeft'].includes(event.key)) return;
  event.preventDefault();
  galleryStep(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
});
addSwipe(dialogFrame, direction => galleryStep(photoIndex + direction));

/* Local opening hours use Porto Alegre time, independent of the device zone. */
const scheduleExceptions = Object.freeze({
  // 'YYYY-MM-DD': null para fechado ou [600, 1200] para horários especiais, em minutos.
});
const localDate = now => new Intl.DateTimeFormat('sv-SE', {
  timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit',
}).format(now);
function openingStatus(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:'America/Sao_Paulo', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23',
  }).formatToParts(now);
  const { hour, minute } = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const minutes = Number(hour) * 60 + Number(minute);
  const today = localDate(now);
  const slot = date => Object.hasOwn(scheduleExceptions, date) ? scheduleExceptions[date]
    : [2,3,4,5,6].includes(new Date(date + 'T12:00:00Z').getUTCDay()) ? [600,1200] : null;
  const time = value => Math.floor(value / 60) + 'h' + (value % 60 ? String(value % 60).padStart(2,'0') : '');
  const hours = slot(today);
  if (hours && minutes >= hours[0] && minutes < hours[1]) return { open:true, text:'Aberto agora · Fecha às ' + time(hours[1]) };
  if (hours && minutes < hours[0]) return { open:false, text:'Fechado agora · Abre hoje às ' + time(hours[0]) };
  const nextDay = new Date(today + 'T12:00:00Z');
  for (let offset = 1; offset <= 370; offset++) {
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextHours = slot(nextDay.toISOString().slice(0,10));
    if (!nextHours) continue;
    const day = offset === 1 ? 'amanhã' : new Intl.DateTimeFormat('pt-BR', { weekday:'long', timeZone:'UTC' }).format(nextDay);
    return { open:false, text:'Fechado agora · Abre ' + day + ' às ' + time(nextHours[0]) };
  }
  return { open:false, text:'Confirma o próximo horário com a equipe.' };
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

/* Service discovery and appointment requests */
const search = document.querySelector('#service-search');
const category = document.querySelector('#service-category');
const catalog = [...document.querySelectorAll('[data-service-card]')];
const chips = document.querySelector('#category-chips');
const suggestions = document.querySelector('#search-suggestions');
const clean = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
const terms = {
  'Mechas':'mexas luzes iluminar clarear loiro cabelo',
  'Balayage':'balaiagem iluminar degradê',
  'Morena iluminada':'iluminar luzes castanho raiz suave',
  'Babylights':'luzes finas mechas discretas',
  'Coloração':'pintar cor tintura',
  'Coloração de raiz':'retocar retoque pintar raiz',
  'Penteado solto':'casamento festa noiva evento ondas',
  'Penteado preso':'casamento festa noiva evento coque',
  'Maquiagem':'make casamento festa noiva',
  'Formol free':'progressiva alisar alisamento sem formol',
  'Tratamento capilar':'hidratação reconstrução nutrição',
};
const descriptions = {
  'Mechas':'Iluminação personalizada com tratamento e finalização inclusos. A avaliação define a técnica e o valor.',
  'Balayage':'Iluminação em degradê, com transição suave entre raiz e comprimento.',
  'Morena iluminada':'Reflexos em base castanha, preservando profundidade na raiz.',
  'Babylights':'Mechas finas e delicadas, com contraste suave.',
  'Coloração de raiz':'Retoque para alinhar a raiz à cor do comprimento.',
  'Corte feminino':'A equipe considera textura, formato e rotina para definir o corte.',
  'Manutenção de franja':'Gratuita para clientes da Cooper.',
  'Formol free':'A equipe avalia os fios e orienta sobre o acabamento esperado.',
  'Lifting':'Consulta para avaliar a opção e o acabamento indicado para o cabelo.',
};

function distance(a,b) {
  let previous = Array.from({length:b.length+1},(_,i)=>i);
  for (let i=1;i<=a.length;i++) {
    const row=[i];
    for (let j=1;j<=b.length;j++) row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+Number(a[i-1]!==b[j-1]));
    previous=row;
  }
  return previous[b.length];
}

function action(label, callback) {
  const button=document.createElement('button');
  button.type='button';
  button.textContent=label;
  button.addEventListener('click',callback);
  return button;
}

function preferences(key,fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function savePreference(key,value) {
  try { localStorage.setItem(key,JSON.stringify(value)); } catch { /* Continue in memory. */ }
}
async function copy(text,status) {
  try {
    await navigator.clipboard.writeText(text);
    status.textContent='Copiado.';
  } catch {
    status.textContent='Seleciona e copia o conteúdo manualmente.';
    return false;
  }
  return true;
}

let saved=preferences('cooper-favorites',[]);
if (!Array.isArray(saved)) saved=[];
const compared=new Set();
const savedPanel=document.querySelector('#saved-services');
const savedList=document.querySelector('#saved-list');
const comparison=document.querySelector('#service-comparison');
const resultStatus=document.querySelector('#service-count');
const cardName=card=>card.dataset.name;

function toggleSaved(label, reference='') {
  const index=saved.findIndex(item=>item.label===label && item.reference===reference);
  if (index>=0) saved.splice(index,1);
  else saved.push({label,reference});
  savePreference('cooper-favorites',saved);
  renderSelections();
}

function renderSelections() {
  savedPanel.hidden=!saved.length;
  savedList.replaceChildren(...saved.map(item=>action('Remover: '+item.label,()=>toggleSaved(item.label,item.reference))));
  for (const card of catalog) {
    card.querySelector('[data-favorite]').setAttribute('aria-pressed',String(saved.some(item=>item.label===cardName(card) && !item.reference)));
    card.querySelector('[data-compare]').setAttribute('aria-pressed',String(compared.has(card)));
  }
  comparison.hidden=!compared.size;
  const title=document.createElement('h3');
  title.textContent='Comparar até dois serviços';
  const list=document.createElement('div');
  list.className='ux-compare';
  for (const card of compared) {
    const item=document.createElement('div');
    item.textContent=[cardName(card),card.querySelector('.price-chip').textContent,card.querySelector('.small').textContent,descriptions[cardName(card)] || 'Confirma os detalhes com a equipe.'].join(' · ');
    list.append(item,action('Retirar '+cardName(card),()=>{compared.delete(card);renderSelections();}));
  }
  comparison.replaceChildren(title,list);
}

for (const card of catalog) {
  const name=cardName(card);
  const details=document.createElement('details');
  const summary=document.createElement('summary');
  summary.textContent='Detalhes do serviço';
  const detail=document.createElement('p');
  detail.textContent=descriptions[name] || 'A equipe confirma o que está incluso, o tempo de atendimento e o valor para o teu caso.';
  details.append(summary,detail);
  const buttons=document.createElement('div');
  buttons.className='ux-chips';
  const favorite=action('Salvar',()=>toggleSaved(name));
  favorite.dataset.favorite='';
  favorite.setAttribute('aria-label','Salvar '+name);
  const compare=action('Comparar',()=>{
    if (!compared.delete(card)) {
      if (compared.size===2) {
        resultStatus.textContent='Retira um serviço da comparação antes de adicionar outro.';
        comparison.scrollIntoView({block:'nearest'});
        return;
      }
      compared.add(card);
    }
    renderSelections();
  });
  compare.dataset.compare='';
  compare.setAttribute('aria-label','Comparar '+name);
  buttons.append(favorite,compare);
  card.querySelector('a').dataset.service=name;
  card.insertBefore(details,card.querySelector('a'));
  card.append(buttons);
}

const startParams=new URLSearchParams(location.search);
search.value=startParams.get('q')?.slice(0,100) ?? '';
if ([...category.options].some(option=>option.value===startParams.get('categoria'))) category.value=startParams.get('categoria');
const categories=[...category.options].map(option=>{
  const button=action(option.value?option.textContent:'Todos',()=>{category.value=option.value;filterServices();});
  chips.append(button);
  return [option.value,button];
});

const catalogHeading = document.querySelector('#catalog-heading');
const serviceGrid = document.querySelector('#service-grid');
const firstStandardCard = catalog.find(card => !card.hasAttribute('data-featured'));
for (const card of catalog.filter(card => card.hasAttribute('data-featured'))) {
  serviceGrid.insertBefore(card, firstStandardCard);
}
const catalogToggle = document.querySelector('#catalog-toggle');
let catalogExpanded = false;

function filterServices() {
  const query=clean(search.value).slice(0,100);
  const tokens=query.split(/\s+/).filter(word=>word.length>2 && !['para','com','quero','meu','cabelo'].includes(word));
  const available=catalog.filter(card=>!category.value || card.dataset.category===category.value);
  const exact=available.filter(card=>!query || clean(cardName(card)).includes(query)
    || (tokens.length>0 && tokens.every(token=>clean((terms[cardName(card)] || '')+' '+cardName(card)).includes(token))));
  const nearby=query && !exact.length ? available.map(card=>{
    const words=clean(cardName(card)+' '+(terms[cardName(card)] || '')).split(' ');
    const score=tokens.reduce((sum,token)=>sum+Math.min(...words.map(word=>distance(token,word))),0);
    return {card,score};
  }).filter(item=>tokens.length && item.score<=Math.min(3,tokens.length+1)).sort((a,b)=>a.score-b.score).slice(0,4).map(item=>item.card) : [];
  const matches=exact.length?exact:nearby;
  const filtering = Boolean(query || category.value);
  const featuredOnly = !filtering && !catalogExpanded;
  const visibleCards = featuredOnly ? matches.filter(card => card.hasAttribute('data-featured')) : matches;
  catalog.forEach(card => { card.hidden = !visibleCards.includes(card); });
  catalogHeading.textContent = filtering ? 'Resultados do catálogo' : featuredOnly ? 'Mais procurados' : 'Todos os serviços';
  catalogToggle.hidden = filtering;
  catalogToggle.setAttribute('aria-expanded', String(catalogExpanded));
  catalogToggle.querySelector('span').textContent = catalogExpanded ? 'Ver menos serviços' : 'Ver mais serviços';
  categories.forEach(([value,button])=>button.setAttribute('aria-pressed',String(value===category.value)));
  resultStatus.textContent=nearby.length?'Resultados semelhantes à tua busca.':visibleCards.length?visibleCards.length+(visibleCards.length === 1 ? ' serviço' : ' serviços'):'Nenhum serviço encontrado.';
  suggestions.replaceChildren();
  if (nearby.length) for (const card of nearby) suggestions.append(action('Buscar '+cardName(card),()=>{search.value=cardName(card);filterServices();}));
  if (query || category.value) suggestions.append(action('Limpar filtros',()=>{search.value='';category.value='';filterServices();search.focus();}));
  const url=new URL(location.href);
  for (const [key,value] of [['q',search.value.trim()],['categoria',category.value]]) {
    if (value) url.searchParams.set(key,value);
    else url.searchParams.delete(key);
  }
  try { history.replaceState(null,'',url); } catch { /* Local file preview. */ }
  queueScroll();
}
catalogToggle.addEventListener('click', () => {
  catalogExpanded = !catalogExpanded;
  filterServices();
  if (catalogExpanded) {
    firstStandardCard?.querySelector('summary').focus();
  } else {
    catalogHeading.focus();
  }
});
search.maxLength=100;
search.addEventListener('input',filterServices);
category.addEventListener('change',filterServices);
document.querySelector('.catalog-tools').hidden=false;
suggestions.after(action('Copiar link dos filtros',()=>{
  const url=new URL(location.href);
  url.hash='servicos';
  copy(url.href,resultStatus);
}));
filterServices();
renderSelections();

const budgetOptions=[...document.querySelectorAll('[data-budget-service]')];
const budgetLink=document.querySelector('#budget-link');
function updateBudget(changed) {
  if (changed?.checked && ['Formol free','Lifting'].includes(changed.dataset.budgetService)) {
    budgetOptions.filter(option=>option!==changed && ['Formol free','Lifting'].includes(option.dataset.budgetService)).forEach(option=>{option.checked=false;});
  }
  const selected=budgetOptions.filter(option=>option.checked);
  const total=selected.reduce((sum,option)=>sum+Number(option.value),0);
  document.querySelector('#budget-total').textContent='Subtotal inicial: '+money.format(total)+'. Serviços sob consulta ficam fora deste valor.';
  budgetLink.dataset.bookingNote=selected.length?selected.map(option=>option.dataset.budgetService).join(', ')+' · Subtotal inicial: '+money.format(total):'';
}
budgetOptions.forEach(option=>option.addEventListener('change',()=>updateBudget(option)));
updateBudget();

const bookingDialog=document.querySelector('#booking-dialog');
const form=document.querySelector('#contact-form');
const preview=document.querySelector('#booking-preview');
const message=document.querySelector('#booking-message');
const send=document.querySelector('#contact-send');
const feedback=document.querySelector('#booking-feedback');
const bookingContext=document.querySelector('#booking-context');
let bookingOpener;
let bookingNote='';
let lastService='';
const serviceForSection={mechas:'Mechas',cortes:'Corte feminino',coloracao:'Coloração',alisamentos:'Formol free',eventos:'Penteado preso'};
function openBooking(trigger, service='', note='') {
  bookingOpener=trigger;
  bookingNote=note;
  const choice=service || lastService;
  form.elements.service.value=[...form.elements.service.options].some(option=>option.value===choice)?choice:'';
  form.elements.date.min=localDate(new Date());
  form.elements.date.setCustomValidity('');
  bookingContext.textContent=note;
  bookingContext.hidden=!note;
  preview.hidden=true;
  feedback.textContent='';
  bookingDialog.showModal();
  (form.elements.name.value?form.elements.service:form.elements.name).focus();
  recordIntent('booking-open');
}

document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if (!link || link===send || !bookingDialog.showModal || event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.hash!=='#agendar' && !link.href.startsWith('https://wa.me/5551995617292')) return;
  event.preventDefault();
  const section=link===float || link.closest('.mobile-bar') ? activeSection : link.closest('section');
  const service=link.dataset.service || (link===budgetLink?'Consultar seleção ou orçamento':serviceForSection[section?.id]);
  const note=link.dataset.bookingNote || (section?.id==='eventos'?'Penteado para noiva ou evento.':'');
  openBooking(link,service,note);
});
document.querySelector('#close-booking').addEventListener('click',()=>bookingDialog.close());
bookingDialog.addEventListener('close',()=>bookingOpener?.focus());
form.addEventListener('input',()=>{
  form.elements.name.setCustomValidity('');
  form.elements.date.setCustomValidity('');
  preview.hidden=true;
});
form.addEventListener('submit',event=>{
  event.preventDefault();
  const name=form.elements.name.value.trim();
  const date=form.elements.date.value;
  const period=form.elements.period.value;
  const service=form.elements.service.value;
  form.elements.name.setCustomValidity(name?'':'Informa teu nome.');
  const weekday=date?new Date(date+'T12:00:00Z').getUTCDay():null;
  const closed=date && (Object.hasOwn(scheduleExceptions,date)?!scheduleExceptions[date]:weekday<2);
  form.elements.date.setCustomValidity(closed?'Escolhe uma data de atendimento. O salão atende de terça a sábado.':'');
  if (!form.reportValidity()) return;
  lastService=service;
  message.value=['Olá, vim do site da Cooper NYC.', 'Meu nome é '+name+'.','Serviço: '+service+'.',
    date?'Data de preferência: '+date.split('-').reverse().join('/')+'.':'',period?'Período: '+period+'.':'',bookingNote].filter(Boolean).join('\n');
  send.href=wa(message.value);
  preview.hidden=false;
  send.focus();
});
document.querySelector('#copy-message').addEventListener('click',async()=>{if (!await copy(message.value,feedback)) {message.focus();message.select();}});
document.querySelector('#copy-number').addEventListener('click',async()=>{if (!await copy('+55 51 99561-7292',feedback)) feedback.textContent='Número: +55 51 99561-7292';});
document.querySelector('[data-book-selection]').addEventListener('click',event=>{
  openBooking(event.currentTarget,'Consultar seleção ou orçamento',saved.map(item=>item.label+(item.reference?' · '+item.reference:'')).join('\n'));
});

/* Curated, verified photo references already present on the site. */
const results=[
  ['Iluminação','Mechas','mechas','Mechas douradas'],
  ['Iluminação','Morena iluminada','cor-ondas','Ondas e raiz suave'],
  ['Iluminação','Mechas','cor-luz','Loiro iluminado'],
  ['Cortes','Corte feminino','cortes','Corte curto com textura'],
  ['Cortes','Corte feminino','corte-editorial','Franja editorial'],
  ['Lisos','Formol free','alisamento','Acabamento liso em cabelo loiro'],
];
const resultFilters=document.querySelector('#result-filters');
const photoResults=document.querySelector('#result-photos');
let referenceService='';
let referenceOpener;
function renderResults(filter) {
  for (const button of resultFilters.children) button.setAttribute('aria-pressed',String(button.textContent===filter));
  photoResults.replaceChildren();
  for (const [group,service,photo,label] of results) {
    if (filter!=='Todas' && group!==filter) continue;
    const url=new URL('img/'+photo+'.webp',location.href).href;
    const tile=action(label,()=>{
      opener=tile;
      referenceOpener=tile;
      referenceService=service;
      mode='result';
      renderMedia(url,label);
      dialog.showModal();
    });
    const image=new Image();
    image.src=url;
    image.alt='';
    image.loading='lazy';
    image.width=480;
    image.height=480;
    tile.prepend(image);
    photoResults.append(tile);
  }
}
for (const label of ['Todas','Iluminação','Cortes','Lisos']) resultFilters.append(action(label,()=>renderResults(label)));
if (dialog.showModal) {
  document.querySelector('#result-gallery').hidden=false;
  renderResults('Todas');
}
document.querySelector('#book-reference').addEventListener('click',()=>{
  const trigger=mode==='result'?referenceOpener:opener;
  const service=mode==='result'?referenceService:'Coloração';
  const url=new URL(dialog.dataset.reference,location.href);
  const note='Referência: '+dialogCaption.textContent+' · '+url.href;
  dialog.close();
  openBooking(trigger,service,note);
});
document.querySelector('#save-reference').addEventListener('click',event=>{
  toggleSaved(dialogCaption.textContent,new URL(dialog.dataset.reference,location.href).href);
  event.currentTarget.textContent=saved.some(item=>item.reference===new URL(dialog.dataset.reference,location.href).href)?'Remover referência salva':'Salvar referência';
});

const loadMap=document.querySelector('#load-map');
loadMap.addEventListener('click',()=>{
  const map=loadMap.nextElementSibling;
  map.src=map.dataset.src;
  map.hidden=false;
  loadMap.hidden=true;
  map.focus();
  recordIntent('map-load');
});
function recordIntent(name) {
  // Optional local measurements. Enable only during a moderated test.
  if (!preferences('cooper-ux-test',false)) return;
  const counters=preferences('cooper-ux-counts',{});
  counters[name]=(counters[name] || 0)+1;
  savePreference('cooper-ux-counts',counters);
}
send.addEventListener('click',()=>recordIntent('whatsapp-open'));
document.querySelectorAll('a[href*="google.com/maps/dir"]').forEach(link=>link.addEventListener('click',()=>recordIntent('maps-route')));
