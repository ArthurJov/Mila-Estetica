/* =====================================================
   LUDMILA PAIXÃO ESTÉTICA — main.js
   Autor: Arthur Vieira | v1.0 | 2026
   ===================================================== */

'use strict';

/* ─── CONFIGURAÇÃO ────────────────────────────────────── */
const cfg = {
  // Número do WhatsApp (apenas dígitos, com DDI)
  whatsappNumber: '5571982080832',
  // Instagram (sem o @)
  instagram: 'ludmilapaixao',
  // Mensagem padrão enviada pelo WhatsApp
  whatsappDefaultMsg: 'Olá, Ludmila! Vim pelo seu site e gostaria de tirar algumas dúvidas'
};

const WA_BASE = cfg.whatsappNumber
  ? `https://api.whatsapp.com/send?phone=${cfg.whatsappNumber.replace(/\D/g, '')}&text=${encodeURIComponent(cfg.whatsappDefaultMsg || '')}`
  : '#';

// Substitui dinamicamente todos os hrefs de WhatsApp no HTML
document.querySelectorAll('a[data-wa]').forEach(el => {
  el.setAttribute('href', WA_BASE);
  // Adiciona listener redundante garantido (corrige bloqueios passivos)
  el.addEventListener('click', (e) => {
    // Se href for válido, permite navegação normal, senão não faz nada
    if (WA_BASE !== '#') {
      // Deixa o browser abrir o link, evita interferência de outros JSs globais em alguns browsers
    } else {
      e.preventDefault();
    }
  });
});

document.querySelectorAll('a[data-ig]').forEach(el => {
  if (cfg.instagram) {
    el.setAttribute('href', `https://instagram.com/${cfg.instagram}`);
  }
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

/*
 * Scroll Lock:
 * - Trava via classe no <html> (nunca no body — body.overflow quebra position:fixed em mobile)
 * - NÃO chamamos window.scrollTo ao destravar: o browser preserva scrollY automaticamente
 *   quando overflow:hidden está no html. Chamar scrollTo aqui causava conflito com o
 *   scroll suave dos links de navegação.
 */
function lockScroll() {
  document.documentElement.classList.add('menu-open');
}

function unlockScroll() {
  document.documentElement.classList.remove('menu-open');
}

function toggleMenu(open) {
  const wasOpen = navMenu.classList.contains('open');
  if (open === wasOpen) return;

  hamburgerBtn.classList.toggle('open', open);
  navMenu.classList.toggle('open', open);
  hamburgerBtn.setAttribute('aria-expanded', String(open));
  hamburgerBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');

  open ? lockScroll() : unlockScroll();
}

hamburgerBtn.addEventListener('click', () => {
  toggleMenu(!navMenu.classList.contains('open'));
});

document.getElementById('nav-close-btn')?.addEventListener('click', () => {
  toggleMenu(false);
});

/*
 * Navegação interna do menu mobile:
 * Toda a lógica de fechar + rolar fica aqui (event delegation no navMenu).
 *
 * Fluxo para links internos (#secao):
 *   1. e.preventDefault() — evita o jump nativo do <a>
 *   2. toggleMenu(false)  — remove html.menu-open (scroll destravado)
 *   3. requestAnimationFrame — aguarda o browser processar o unlock
 *   4. window.scrollTo({ smooth }) — rola até a seção
 *
 * Fluxo para links externos (WhatsApp CTA etc.):
 *   Só fecha o menu, deixa o browser navegar normalmente.
 */
navMenu.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href') || '';

  if (href.startsWith('#') && href.length > 1) {
    // Link interno: gerenciamos tudo aqui
    e.preventDefault();
    const targetId = href.slice(1);
    const targetEl = document.getElementById(targetId);

    toggleMenu(false); // destravar scroll

    requestAnimationFrame(() => {
      if (!targetEl) return;
      const headerH = header.offsetHeight;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - headerH - 4;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  } else {
    // Link externo (WhatsApp, Instagram etc.): só fecha o menu
    toggleMenu(false);
  }
});

// Fecha com ESC — foca o botão hamburguer de volta
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('open')) {
    toggleMenu(false);
    hamburgerBtn.focus();
  }
});

/* ─── SCROLL SUAVE (links fora do menu mobile) ───────── */
// Seleciona todos os links âncora, mas EXCLUI explicitamente os botões do WhatsApp e Instagram para evitar que o smooth scroll trave seu clique via event.preventDefault() acidental.
document.querySelectorAll('a[href^="#"]:not([data-wa]):not([data-ig])').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    /*
     * Se o menu mobile está aberto, o handler acima (navMenu delegation)
     * já gerenciou o preventDefault + scroll. Não interferir aqui.
     */
    if (navMenu.classList.contains('open')) return;

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
  const service = document.getElementById('form-service').value;
  const message = document.getElementById('form-message').value.trim();

  if (!name || !service) {
    alert('Por favor, preencha seu nome e serviço de interesse.');
    return;
  }

  let text = `Olá, Ludmila! 😊%0A%0AMe chamo *${name}* e tenho interesse em *${service}*.`;
  if (message) text += `%0A%0A${message}`;

  const cleanPhone = cfg.whatsappNumber ? cfg.whatsappNumber.replace(/\D/g, '') : '';
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
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

/* ─── EXPERIÊNCIA AUTOMÁTICA (ANOS) ─────────────────── */
const expEls = document.querySelectorAll('.dynamic-exp-years');
expEls.forEach(el => {
  const startYear = parseInt(el.getAttribute('data-start-year') || '2023', 10);
  const diff = currentYear - startYear;
  if (diff > 0) el.textContent = `${diff}+`;
});

/* ─── HERO IMAGE SEQUENCE ────────────────────────────── */
class HeroSequence {
  constructor() {
    this.canvas = document.getElementById('hero-sequence-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
    this.frameCount = 80;
    
    // Playback speed: how many sequence images advance per second.
    // 16 images/sec gives a slow, calming 5-second loop.
    this.playbackSpeed = 16; 
    
    this.images = [];
    this.loadedCount = 0;
    
    this.virtualFrame = 0;
    this.lastTime = 0;
    this.isPlaying = false;
    this.isVisible = true;
    this.animationId = null;
    
    this.initObserver();
    
    this.init();
  }

  initObserver() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && this.isPlaying) {
          this.lastTime = performance.now();
          this.animate();
        } else if (!this.isVisible && this.animationId) {
          cancelAnimationFrame(this.animationId);
          this.animationId = null;
        }
      });
    }, { threshold: 0 });
    
    observer.observe(heroSection);
  }

  init() {
    for (let i = 0; i < this.frameCount; i++) {
      const img = new Image();
      const numStr = i.toString().padStart(3, '0');
      img.src = `assets/images/hero-sequence-webp/${numStr}.webp`;
      
      const frameData = { img, loaded: false };
      this.images.push(frameData);
      
      img.onload = () => {
        frameData.loaded = true;
        this.loadedCount++;
        
        // Start animation once we have a buffer of 15 frames
        if (this.loadedCount > 15 && !this.isPlaying) {
          this.canvas.classList.add('loaded'); // fade in canvas over the fallback background
          this.isPlaying = true;
          this.lastTime = performance.now();
          this.animate();
        }
      };
    }
  }

  animate(time) {
    if (!this.isPlaying || !this.isVisible) return;
    
    // Request animation frame immediately runs at monitor's native refresh rate (e.g., 60fps or 120fps)
    this.animationId = requestAnimationFrame((t) => this.animate(t));
    
    if (!time) time = performance.now();
    const elapsed = time - this.lastTime;
    this.lastTime = time;
    
    // Advance the virtual frame based on elapsed time and target playback speed
    this.virtualFrame += (elapsed / 1000) * this.playbackSpeed;
    if (this.virtualFrame >= this.frameCount) {
      this.virtualFrame %= this.frameCount; // loop seamlessly
    }
    
    const index1 = Math.floor(this.virtualFrame);
    const index2 = (index1 + 1) % this.frameCount;
    const blendFactor = this.virtualFrame % 1;
    
    const frame1 = this.images[index1];
    const frame2 = this.images[index2];
    
    // Only draw if both frames are fully loaded to avoid flickering
    if (frame1 && frame1.loaded && frame2 && frame2.loaded) {
      const img1 = frame1.img;
      const img2 = frame2.img;
      
      // Keep canvas internal resolution matched to image resolution
      if (this.canvas.width !== img1.width) {
        this.canvas.width = img1.width;
        this.canvas.height = img1.height;
      }
      
      // Draw base frame
      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(img1, 0, 0);
      
      // Blend next frame over it based on the fractional progress
      // This creates an ultra-smooth cinematic transition regardless of how slow the speed is
      this.ctx.globalAlpha = blendFactor;
      this.ctx.drawImage(img2, 0, 0);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HeroSequence());
} else {
  new HeroSequence();
}
