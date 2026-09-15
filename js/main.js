(() => {
  "use strict";
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#nav-links");
  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle?.addEventListener("click", () =>
    setNav(toggle.getAttribute("aria-expanded") !== "true"),
  );
  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle?.getAttribute("aria-expanded") === "true"
    ) {
      setNav(false);
      toggle.focus();
    }
  });
  matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) setNav(false);
  });

  // Manual activation tabs: arrows move focus; Enter/Space activates.
  const tabs = [...document.querySelectorAll("[data-step]")];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute("aria-controls")).hidden =
          !selected;
      });
    });
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        tabs[next].focus();
      }
    });
  });

  // Native dialog handles modal focus, Escape, and focus restoration.
  const dialog = document.querySelector(".tour-dialog");
  const media = dialog?.querySelector(".dialog-media");
  let lastTourTrigger;
  document.querySelectorAll("[data-tour]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        !dialog?.showModal ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      const id = link.dataset.tour;
      if (!/^[a-zA-Z0-9]+$/.test(id)) return;
      lastTourTrigger = link;
      const title = link.dataset.title || "360° virtual tour";
      dialog.querySelector("#tour-title").textContent = title;
      dialog.querySelector("[data-tour-direct]").href =
        `https://kuula.co/share/collection/${id}`;
      const loading = document.createElement("p");
      loading.className = "dialog-loading";
      loading.textContent = "Opening your view…";
      loading.setAttribute("role", "status");
      const iframe = document.createElement("iframe");
      iframe.title = title;
      iframe.src = `https://kuula.co/share/collection/${id}?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1`;
      iframe.allow =
        "xr-spatial-tracking; gyroscope; accelerometer; fullscreen";
      iframe.allowFullscreen = true;
      iframe.addEventListener("load", () => loading.remove(), { once: true });
      media.replaceChildren(loading, iframe);
      dialog.showModal();
      document.body.classList.add("no-scroll");
      dialog.querySelector(".dialog-close").focus();
    });
  });
  dialog
    ?.querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog?.addEventListener("close", () => {
    media.replaceChildren();
    document.body.classList.remove("no-scroll");
    lastTourTrigger?.focus();
  });

  // Storage denial must not interrupt booking; preserve URL referrals as well.
  const params = new URLSearchParams(location.search);
  let ref = params.get("ref");
  try {
    if (ref) localStorage.setItem("refCode", ref);
    ref = ref || localStorage.getItem("refCode");
  } catch {
    /* Keep the current URL referral when storage is unavailable. */
  }
  if (ref)
    document.querySelectorAll('a[href^="contact.html"]').forEach((link) => {
      const url = new URL(link.getAttribute("href"), location.href);
      url.searchParams.set("ref", ref);
      link.href = url.pathname + url.search + url.hash;
    });
  const calendly = new URL("https://calendly.com/nahomg116/30min");
  if (ref) {
    calendly.searchParams.set("a1", ref);
    calendly.searchParams.set("text", `Virtual Tour Booking (Ref: ${ref})`);
  }
  document.querySelectorAll("[data-calendly-link]").forEach((link) => {
    link.href = calendly.href;
  });
  const calendar = document.querySelector("#calendly-container");
  if (calendar) {
    const widget = document.createElement("div");
    widget.className = "calendly-inline-widget";
    widget.dataset.url = calendly.href;
    calendar.appendChild(widget);
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);
  }
  const form = document.querySelector("#shoot-form");
  if (form) {
    const now = new Date();
    form.elements.date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const body = `Hello OpenView,\n\nI’d like to arrange a 360° tour.\n\nName: ${data.get("name")}\nPreferred date: ${data.get("date")}\nProperty: ${data.get("property")}\nDetails: ${data.get("details") || "None added"}${ref ? `\nReferral: ${ref}` : ""}\n\nPlease confirm availability and pricing. Thank you!`;
      const url = `mailto:openviewhomesmn@gmail.com?subject=${encodeURIComponent("360° tour — shoot date request")}&body=${encodeURIComponent(body)}`;
      const status = document.querySelector("#request-status");
      status.replaceChildren(
        document.createTextNode(
          "Your email draft is ready. Send it from your email app to request the date. ",
        ),
      );
      const retry = document.createElement("a");
      retry.href = url;
      retry.textContent = "Open the email draft again";
      status.append(retry);
      location.href = url;
    });
  }
})();
