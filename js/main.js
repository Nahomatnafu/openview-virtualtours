/* OpenView Virtual Tours — site JS
   Each feature guards on its own DOM hook, so this one file is safe on every page. */

(function () {
  'use strict';

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Referral → Calendly flow (contact page) ----------
     Live business logic. Behavior must stay identical:
     1. Read ?ref= from the URL.
     2. If present, persist it to localStorage under "refCode".
     3. On load, read refCode back (survives navigation within the visit).
     4. Build the Calendly URL — with a ref code, append it as prefilled
        custom question (a1=) AND into the event text= field. Without one,
        use the plain base URL. No empty name=&email= params (deliberately
        removed in a prior commit).
     5. Create the .calendly-inline-widget div, then inject Calendly's
        external widget script. */
  var calendlyContainer = document.getElementById('calendly-container');
  if (calendlyContainer) {
    var urlParams = new URLSearchParams(window.location.search);
    var refFromURL = urlParams.get('ref');
    if (refFromURL) {
      localStorage.setItem('refCode', refFromURL);
    }

    var refCode = localStorage.getItem('refCode');

    var calendlyBase = 'https://calendly.com/nahomg116/30min';
    var calendlyUrl = refCode
      ? calendlyBase + '?a1=' + encodeURIComponent(refCode) +
        '&text=Virtual+Tour+Booking+(Ref:+' + encodeURIComponent(refCode) + ')'
      : calendlyBase;

    var widgetDiv = document.createElement('div');
    widgetDiv.className = 'calendly-inline-widget';
    widgetDiv.setAttribute('data-url', calendlyUrl);
    widgetDiv.style.minWidth = '320px';
    widgetDiv.style.height = '700px';
    calendlyContainer.appendChild(widgetDiv);

    var calendlyScript = document.createElement('script');
    calendlyScript.src = 'https://assets.calendly.com/assets/external/widget.js';
    calendlyScript.async = true;
    document.body.appendChild(calendlyScript);
  }

  /* ---------- Portfolio: category filter (demos page) ---------- */
  var tourGrid = document.querySelector('[data-tour-grid]');
  if (tourGrid) {
    var chips = document.querySelectorAll('.chip[data-filter]');
    var cards = tourGrid.querySelectorAll('[data-category]');
    var emptyState = document.querySelector('[data-filter-empty]');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var filter = chip.getAttribute('data-filter');
        var visible = 0;

        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });

        cards.forEach(function (card) {
          var hide = filter !== 'all' && card.getAttribute('data-category') !== filter;
          card.hidden = hide;
          if (!hide) visible++;
        });

        if (emptyState) emptyState.hidden = visible > 0;
      });
    });
  }

  /* ---------- Tour lightbox (demos page) ----------
     Posters are plain links to Kuula (the no-JS fallback). JS upgrades them:
     clicking opens a full-viewport overlay and mounts the embed inside it.
     Deliberately NOT the Fullscreen API — iOS Safari doesn't support
     requestFullscreen() on arbitrary elements, and most traffic is phones.
     One tour at a time; the embed is destroyed on close. */
  var lightbox = document.getElementById('tour-lightbox');
  if (lightbox) {
    var lightboxMedia = lightbox.querySelector('[data-lightbox-media]');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var lastTrigger = null;

    var onLightboxKeydown = function (e) {
      if (e.key === 'Escape') {
        closeLightbox();
        return;
      }
      if (e.key !== 'Tab') return;
      // Trap focus between the close button and the tour iframe
      var focusables = [closeBtn, lightboxMedia.querySelector('iframe')].filter(Boolean);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!lightbox.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };

    var openLightbox = function (url, title, trigger) {
      var iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.title = title || '360° virtual tour';
      iframe.setAttribute('allow', 'xr-spatial-tracking; gyroscope; accelerometer; fullscreen');
      iframe.setAttribute('allowfullscreen', '');
      lightboxMedia.appendChild(iframe);

      lightbox.hidden = false;
      document.body.classList.add('no-scroll');
      lastTrigger = trigger;
      closeBtn.focus();
      document.addEventListener('keydown', onLightboxKeydown);
    };

    var closeLightbox = function () {
      lightboxMedia.innerHTML = ''; // destroy the embed so a closed tour isn't running in the background
      lightbox.hidden = true;
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onLightboxKeydown);
      if (lastTrigger) lastTrigger.focus();
      lastTrigger = null;
    };

    document.querySelectorAll('a.tour-load[data-tour-url]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        openLightbox(link.getAttribute('data-tour-url'), link.getAttribute('data-tour-title'), link);
      });
    });

    lightbox.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
      el.addEventListener('click', closeLightbox);
    });
  }

  /* ---------- Hero reveal — the one orchestrated GSAP moment (homepage) ----------
     The horizon draws across, then the tour frame descends through it —
     motion that explains the signature. GSAP is progressive enhancement:
     content is fully visible without it. */
  var hero = document.querySelector('[data-hero-reveal]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hero && window.gsap && !reduceMotion) {
    var tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(hero.querySelectorAll('.hero-copy > *'), {
        y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.09
      })
      .from(hero.querySelector('.hero-crossing .horizon'), {
        scaleX: 0, transformOrigin: 'left center', duration: 0.5
      }, '-=0.3')
      .from(hero.querySelector('.tour-frame'), {
        y: -44, autoAlpha: 0, duration: 0.65
      }, '-=0.1')
      .from(hero.querySelector('.drag-hint'), {
        autoAlpha: 0, y: 8, duration: 0.4
      }, '-=0.15');
  }
})();
