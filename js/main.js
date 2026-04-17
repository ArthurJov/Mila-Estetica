/* =====================================================
   LUDMILA PAIXÃO ESTÉTICA — main.js
   Autor: Arthur Vieira | v1.0 | 2026
   ===================================================== */

'use strict';

/* ─── CONFIGURAÇÃO (lida do config.js) ──────────────────── */
// Se o config.js não for carregado (ex: ambiente de dev sem o arquivo),
// usamos valores vazios para não quebrar a página.
const cfg = (typeof SITE_CONFIG !== 'undefined')
  ? SITE_CONFIG
  : { whatsappNumber: '', instagram: '', whatsappDefaultMsg: '' };

const WA_BASE = cfg.whatsappNumber
  ? `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(cfg.whatsappDefaultMsg)}`
  : '#';

// Substitui dinamicamente todos os hrefs de WhatsApp e Instagram no HTML
document.querySelectorAll('a[data-wa]').forEach(el => {
  el.href = WA_BASE;
});
document.querySelectorAll('a[data-ig]').forEach(el => {
  if (cfg.instagram) el.href = `https://instagram.com/${cfg.instagram}`;
});

/* ─── HEADER SCROLL ─────────────────────────────────── */
const header = document.getElementById('header');

function handleHeaderScroll() {
  header.classList.toggle('scrolled', window.scrollY > 60);
}

window.addEventListener('scroll', handleHeaderScroll, { passive: true });
handleHeaderScroll();

/* ─── MENU HAMBURGUER ────────────────────────────────── */
const hamburgerBtn = document.getElementById('hamburger-btn');
const navMenu      = document.getElementById('nav-menu');
const navLinks     = document.querySelectorAll('.nav__link');

/*
 * Scroll Lock robusto:
 * - Salva scrollY antes de travar para não perder posição
 * - Usa overflow: hidden no <html> (não no body — body.style.overflow
 *   num browser mobile cria novo containing block e quebra position:fixed)
 */
let scrollLockY = 0;

function lockScroll() {
  scrollLockY = window.scrollY;
  document.documentElement.classList.add('menu-open');
}

function unlockScroll() {
  document.documentElement.classList.remove('menu-open');
  // Restaura posição sem animação visual
  window.scrollTo({ top: scrollLockY, behavior: 'instant' });
}

function toggleMenu(open) {
  const wasOpen = navMenu.classList.contains('open');
  if (open === wasOpen) return; // sem mudança

  hamburgerBtn.classList.toggle('open', open);
  navMenu.classList.toggle('open', open);
  hamburgerBtn.setAttribute('aria-expanded', String(open));
  hamburgerBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');

  if (open) {
    lockScroll();
  } else {
    unlockScroll();
  }
}

hamburgerBtn.addEventListener('click', () => {
  toggleMenu(!navMenu.classList.contains('open'));
});

// Fecha ao clicar em qualquer link dentro do nav (links + CTA)
navMenu.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    toggleMenu(false);
  }
});

// Fecha com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('open')) {
    toggleMenu(false);
    hamburgerBtn.focus();
  }
});


/* ─── SCROLL SUAVE ───────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const headerH = header.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ─── INTERSECTION OBSERVER (animações reveal) ───────── */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Pequeno delay escalonado para grupos de elementos
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, idx * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ─── CARROSSEL DE DEPOIMENTOS ───────────────────────── */
const track      = document.getElementById('testimonials-track');
const cards      = Array.from(track?.querySelectorAll('.testimonial-card') ?? []);
const dotsWrap   = document.getElementById('testimonials-dots');
const prevBtn    = document.getElementById('carousel-prev');
const nextBtn    = document.getElementById('carousel-next');

let currentSlide = 0;
let autoplayTimer = null;

function buildDots() {
  if (!dotsWrap) return;
  dotsWrap.innerHTML = '';
  cards.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = `testimonials__dot${i === 0 ? ' active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
    btn.setAttribute('aria-selected', String(i === 0));
    btn.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(btn);
  });
}

function goToSlide(idx) {
  cards[currentSlide].classList.remove('active');
  dotsWrap?.querySelectorAll('.testimonials__dot')[currentSlide]
    ?.classList.remove('active');

  currentSlide = (idx + cards.length) % cards.length;

  cards[currentSlide].classList.add('active');
  const dots = dotsWrap?.querySelectorAll('.testimonials__dot');
  dots?.forEach((d, i) => {
    d.classList.toggle('active', i === currentSlide);
    d.setAttribute('aria-selected', String(i === currentSlide));
  });
}

function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 5500);
}

function stopAutoplay() {
  clearInterval(autoplayTimer);
}

if (cards.length) {
  buildDots();
  cards[0].classList.add('active');
  prevBtn?.addEventListener('click', () => { goToSlide(currentSlide - 1); startAutoplay(); });
  nextBtn?.addEventListener('click', () => { goToSlide(currentSlide + 1); startAutoplay(); });
  track?.addEventListener('mouseenter', stopAutoplay);
  track?.addEventListener('mouseleave', startAutoplay);
  startAutoplay();
}

/* Touch/Swipe no carrossel */
let touchStartX = 0;
track?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
track?.addEventListener('touchend', e => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
    startAutoplay();
  }
}, { passive: true });

/* ─── LIGHTBOX DA GALERIA ────────────────────────────── */
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose   = document.getElementById('lightbox-close');
const lightboxPrev    = document.getElementById('lightbox-prev');
const lightboxNext    = document.getElementById('lightbox-next');
const lightboxBg      = document.getElementById('lightbox-backdrop');
const galleryBtns     = Array.from(document.querySelectorAll('.gallery__btn'));

const galleryData = galleryBtns.map(btn => ({
  src:     btn.querySelector('.gallery__img').src,
  alt:     btn.querySelector('.gallery__img').alt,
  caption: btn.querySelector('.gallery__overlay span')?.textContent ?? '',
}));

let currentLightbox = 0;

function openLightbox(idx) {
  currentLightbox = idx;
  updateLightbox();
  lightbox.removeAttribute('hidden');
  lightboxBg?.removeAttribute('hidden');
  document.documentElement.classList.add('menu-open');
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.setAttribute('hidden', '');
  lightboxBg?.setAttribute('hidden', '');
  document.documentElement.classList.remove('menu-open');
  galleryBtns[currentLightbox]?.focus();
}

function updateLightbox() {
  const data = galleryData[currentLightbox];
  lightboxImg.src     = data.src;
  lightboxImg.alt     = data.alt;
  lightboxCaption.textContent = data.caption;
}

galleryBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => openLightbox(i));
});

lightboxClose?.addEventListener('click', closeLightbox);
lightboxBg?.addEventListener('click', closeLightbox);

lightboxPrev?.addEventListener('click', () => {
  currentLightbox = (currentLightbox - 1 + galleryData.length) % galleryData.length;
  updateLightbox();
});

lightboxNext?.addEventListener('click', () => {
  currentLightbox = (currentLightbox + 1) % galleryData.length;
  updateLightbox();
});

document.addEventListener('keydown', e => {
  if (!lightbox || lightbox.hasAttribute('hidden')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   { currentLightbox = (currentLightbox - 1 + galleryData.length) % galleryData.length; updateLightbox(); }
  if (e.key === 'ArrowRight')  { currentLightbox = (currentLightbox + 1) % galleryData.length; updateLightbox(); }
});

/* ─── FAQ ACCORDION ──────────────────────────────────── */
const faqQuestions = document.querySelectorAll('.faq__question');

faqQuestions.forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen   = btn.getAttribute('aria-expanded') === 'true';
    const answerId = btn.getAttribute('aria-controls');
    const answer   = document.getElementById(answerId);

    // Fecha todos os outros
    faqQuestions.forEach(other => {
      if (other !== btn) {
        other.setAttribute('aria-expanded', 'false');
        const otherId = other.getAttribute('aria-controls');
        document.getElementById(otherId)?.setAttribute('hidden', '');
      }
    });

    btn.setAttribute('aria-expanded', String(!isOpen));
    if (isOpen) {
      answer.setAttribute('hidden', '');
    } else {
      answer.removeAttribute('hidden');
    }
  });
});

/* ─── FORMULÁRIO DE CONTATO → WhatsApp ───────────────── */
const contactForm = document.getElementById('contact-form');

contactForm?.addEventListener('submit', e => {
  e.preventDefault();

  const name    = document.getElementById('form-name').value.trim();
  const phone   = document.getElementById('form-phone').value.trim();
  const service = document.getElementById('form-service').value;
  const message = document.getElementById('form-message').value.trim();

  if (!name || !phone || !service) {
    alert('Por favor, preencha seu nome, telefone e serviço de interesse.');
    return;
  }

  let text = `Olá, Ludmila! Me chamo *${name}* e tenho interesse no serviço de *${service}*.`;
  if (phone) text += ` Meu contato é ${phone}.`;
  if (message) text += ` Mensagem: ${message}`;
  text += ` Vi seu site e gostaria de agendar um atendimento.`;

  const url = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
});

/* ─── LINK ATIVO NO NAV AO ROLAR ────────────────────── */
const sections    = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav__link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      allNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.style.color = href === `#${id}` ? 'var(--color-gold)' : '';
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ─── YEAR AUTOMÁTICO NO FOOTER ─────────────────────── */
const yearEls = document.querySelectorAll('.footer__copy');
const currentYear = new Date().getFullYear();
yearEls.forEach(el => {
  el.innerHTML = el.innerHTML.replace(/\d{4}/, currentYear);
});
