/* ============================================================
   stars.js — fills a .hub-stars container with twinkling dots.
   Shared by ask.html and meadow.html.
   ============================================================ */
window.Stars = (function () {
  "use strict";
  function fill(container, count) {
    if (!container) return;
    for (var i = 0; i < (count || 60); i++) {
      var el = document.createElement("span");
      el.className = "hub-star";
      el.style.left = Math.random() * 100 + "vw";
      el.style.top = Math.random() * 100 + "vh";
      el.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
      container.appendChild(el);
    }
  }
  return { fill: fill };
})();
