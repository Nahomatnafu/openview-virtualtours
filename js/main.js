/* OpenView Virtual Tours — site JS
   Each feature guards on its own DOM hook, so this one file is safe on every page. */

(function () {
  'use strict';

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    var setNav = function (open) {
      navLinks.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    navToggle.addEventListener('click', function () {
      setNav(!navLinks.classList.contains('is-open'));
    });
    // Escape closes it, and so does following a link
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        setNav(false);
        navToggle.focus();
      }
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    // Resizing past the drawer breakpoint must not leave a stale open state
    window.matchMedia('(min-width: 40em)').addEventListener('change', function (e) {
      if (e.matches) setNav(false);
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

    document.querySelectorAll('[data-lightbox-open][data-tour-url]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        openLightbox(link.getAttribute('data-tour-url'), link.getAttribute('data-tour-title'), link);
      });
    });

    lightbox.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
      el.addEventListener('click', closeLightbox);
    });
  }

  /* ---------- Case study: the persistent tour viewer (work page) ----------
     Every unit in the list is a real link to Kuula, so with JS off the page is
     16 working tours. JS only upgrades navigation into an in-place swap.

     Two things here are deliberate and easy to break:
     1. We never assign to iframe.src after insertion. A cross-origin src
        assignment pushes a history entry, so after browsing a few units the
        Back button would walk backwards through iframe states instead of
        leaving the page. Building a fresh <iframe> with src already set
        creates no history entry.
     2. We crossfade rather than unmount-then-mount. The new iframe is inserted
        on top at opacity 0 and the old one is removed on its load event, with
        the poster swapped synchronously underneath. No black flash, no reflow. */
  var caseStudy = document.querySelector('[data-case-study]');
  if (caseStudy) {
    var frame = caseStudy.querySelector('[data-viewer-frame]');
    var poster = caseStudy.querySelector('[data-viewer-poster]');
    var facade = caseStudy.querySelector('[data-viewer-facade]');
    var label = caseStudy.querySelector('[data-viewer-label]');
    var expand = caseStudy.querySelector('[data-viewer-expand]');
    var share = caseStudy.querySelector('[data-viewer-share]');
    var unitLinks = caseStudy.querySelectorAll('.unit-link[data-tour-url]');
    var buildingChips = caseStudy.querySelectorAll('.chip[data-building]');
    var units = caseStudy.querySelectorAll('.unit[data-building]');
    var pending = null;

    // These controls only do anything with JS, so the markup ships them hidden
    caseStudy.querySelectorAll('[data-js-only]').forEach(function (el) { el.hidden = false; });

    var mount = function (url, title) {
      /* Drop whatever is mounted straight away. The poster underneath has already
         been swapped to this unit's own door, so it is the loading state — and a
         Kuula embed can take several seconds to fire `load`. Holding the previous
         tour on screen until then would show the wrong unit after a click, and any
         embed the browser stops fetching would never be cleaned up at all. */
      var mounted = frame.querySelectorAll('iframe');
      for (var i = 0; i < mounted.length; i++) mounted[i].remove();

      var next = document.createElement('iframe');
      next.src = url;
      next.title = title || '360° virtual tour';
      next.setAttribute('allow', 'xr-spatial-tracking; gyroscope; accelerometer; fullscreen');
      next.setAttribute('allowfullscreen', '');
      pending = next;
      next.addEventListener('load', function () {
        if (pending !== next) { next.remove(); return; } // superseded by a faster click
        next.classList.add('is-ready');                  // fades in over the poster
        pending = null;
      });
      frame.appendChild(next);
      if (facade) facade.hidden = true;
    };

    var select = function (link, updateHash) {
      var url = link.getAttribute('data-tour-url');
      var title = link.getAttribute('data-tour-title');
      var text = link.getAttribute('data-label');

      // Poster swaps first, so the frame shows the right door while the tour loads
      if (poster && link.getAttribute('data-poster')) {
        poster.src = link.getAttribute('data-poster');
        poster.alt = '';
      }
      if (label) label.textContent = text;
      if (expand) {
        expand.setAttribute('data-tour-url', url);
        expand.setAttribute('data-tour-title', title);
      }
      if (share) {
        share.href = url.split('?')[0];
        share.textContent = 'Open ' + text.split(' — ')[0] + ' on its own link';
      }

      unitLinks.forEach(function (l) {
        if (l === link) { l.setAttribute('aria-current', 'true'); }
        else { l.removeAttribute('aria-current'); }
      });

      mount(url, title);

      // replaceState, never pushState — same reason we rebuild the iframe node
      var li = link.closest('.unit');
      if (updateHash && li && li.id && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + li.id);
      }
    };

    unitLinks.forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        select(link, true);
      });
    });

    // The facade starts the featured tour inline; the Full screen button opens the overlay
    if (facade) {
      facade.addEventListener('click', function (event) {
        event.preventDefault();
        mount(facade.getAttribute('data-tour-url'), facade.getAttribute('data-tour-title'));
      });
    }

    /* Filtering hides list items only. If the unit currently playing is filtered
       out it keeps playing — destroying a tour someone is dragging because they
       clicked a filter would be the worst bug on this page. */
    buildingChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-building');
        buildingChips.forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        units.forEach(function (unit) {
          unit.hidden = want !== 'all' && unit.getAttribute('data-building') !== want;
        });
      });
    });

    // Deep link: /work#unit-232W opens that unit directly
    if (window.location.hash) {
      var target = caseStudy.querySelector(window.location.hash + ' .unit-link');
      if (target) select(target, false);
    }
  }

})();
