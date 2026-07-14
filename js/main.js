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

  /* ---------- Portfolio: click-to-load Kuula facade (demos page) ----------
     Posters are plain links to Kuula (the no-JS fallback). JS upgrades them:
     clicking mounts the live iframe in place, inside a fixed-aspect container
     so there is zero layout shift. Only one live tour at a time — opening
     another unmounts the previous and restores its poster, so filtering
     never has to re-order live iframes. */
  var activeTour = null; // { media, loadLink }

  document.querySelectorAll('a.tour-load[data-tour-url]').forEach(function (loadLink) {
    loadLink.addEventListener('click', function (event) {
      event.preventDefault();

      var media = loadLink.closest('.tour-media');
      if (!media) return;

      if (activeTour) {
        var oldIframe = activeTour.media.querySelector('iframe');
        if (oldIframe) oldIframe.remove();
        activeTour.loadLink.hidden = false;
      }

      var iframe = document.createElement('iframe');
      iframe.src = loadLink.getAttribute('data-tour-url');
      iframe.title = loadLink.getAttribute('data-tour-title') || '360° virtual tour';
      iframe.setAttribute('allow', 'xr-spatial-tracking; gyroscope; accelerometer; fullscreen');
      iframe.setAttribute('allowfullscreen', '');
      media.appendChild(iframe);

      loadLink.hidden = true;
      activeTour = { media: media, loadLink: loadLink };
    });
  });

  /* ---------- Hero reveal — the one orchestrated GSAP moment (homepage) ----------
     Horizon draws across, tour frame opens up from the line, copy rises in.
     GSAP is progressive enhancement: content is fully visible without it. */
  var hero = document.querySelector('[data-hero-reveal]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hero && window.gsap && !reduceMotion) {
    var tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(hero.querySelectorAll('.hero-copy > *'), {
        y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.09
      })
      .from(hero.querySelector('.hero-tour-wrap .horizon'), {
        scaleX: 0, transformOrigin: 'left center', duration: 0.5
      }, '-=0.3')
      .from(hero.querySelector('.tour-frame'), {
        scaleY: 0, transformOrigin: 'top center', duration: 0.65
      }, '-=0.1')
      .from(hero.querySelector('.drag-hint'), {
        autoAlpha: 0, y: 8, duration: 0.4
      }, '-=0.15');
  }
})();
