/* ============================================================
   bunnyRain.js — playful transition: a shower of bunnies fills
   the screen, then the whole pile drops away to unveil the page.
   Classic script, exposes window.BunnyRain.
   ============================================================ */
window.BunnyRain = (function () {
  "use strict";

  /* -----------------------------------------------------------
     TO USE YOUR OWN ART:
     Drop transparent-background PNGs into  assets/bunnies/  and
     list their paths below. A few poses (3–5) is plenty — the
     rain mixes sizes, rotations and flips so it feels like a
     whole crowd. Leave the array empty to use the built-in
     bunny drawing.
     ----------------------------------------------------------- */
  var SOURCES = [
    "assets/bunnies/bunny-1.png",
    "assets/bunnies/bunny-2.png",
    "assets/bunnies/bunny-3.png",
    "assets/bunnies/bunny-4.png",
    "assets/bunnies/bunny-5.png"
  ];

  /* built-in fallback: a soft little white bunny (Chicken Nugget) */
  var SVG_BUNNY =
    '<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<ellipse cx="50" cy="112" rx="26" ry="6" fill="rgba(120,80,110,.12)"/>' +
    '<path d="M34 46 C28 30 26 8 34 6 C42 4 44 26 44 44 Z" fill="#fff" stroke="#e4c7d8" stroke-width="2"/>' +
    '<path d="M66 46 C72 30 74 8 66 6 C58 4 56 26 56 44 Z" fill="#fff" stroke="#e4c7d8" stroke-width="2"/>' +
    '<path d="M37 40 C33 28 32 12 36 11 C40 10 41 26 41 40 Z" fill="#ffd6e6"/>' +
    '<path d="M63 40 C67 28 68 12 64 11 C60 10 59 26 59 40 Z" fill="#ffd6e6"/>' +
    '<ellipse cx="50" cy="72" rx="30" ry="30" fill="#fff" stroke="#e4c7d8" stroke-width="2"/>' +
    '<circle cx="40" cy="68" r="4" fill="#5b3a52"/>' +
    '<circle cx="60" cy="68" r="4" fill="#5b3a52"/>' +
    '<circle cx="34" cy="78" r="5" fill="#ffc2d8" opacity=".8"/>' +
    '<circle cx="66" cy="78" r="5" fill="#ffc2d8" opacity=".8"/>' +
    '<path d="M46 78 Q50 82 54 78" fill="none" stroke="#d38aa8" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M50 76 L50 79" stroke="#d38aa8" stroke-width="2" stroke-linecap="round"/>' +
    "</svg>";

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeBunny() {
    var b = document.createElement("div");
    b.className = "rb";
    if (SOURCES.length) {
      var img = document.createElement("img");
      img.src = SOURCES[(Math.random() * SOURCES.length) | 0];
      img.alt = "";
      img.addEventListener("error", function () { b.innerHTML = SVG_BUNNY; });
      b.appendChild(img);
    } else {
      b.innerHTML = SVG_BUNNY;
    }
    return b;
  }

  /* play the full fill -> trapdoor sequence, then call onDone */
  function play(onDone) {
    var done = typeof onDone === "function" ? onDone : function () {};
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* reuse a static #bunny-rain (covers from first paint) or create one */
    var overlay = document.getElementById("bunny-rain");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "bunny-rain";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
    }

    if (reduce) {
      overlay.classList.add("clearing");
      window.setTimeout(function () { overlay.remove(); done(); }, 500);
      return;
    }

    var W = window.innerWidth;
    var H = window.innerHeight;

    /* one uniform size makes the pile tessellate and fill cleanly */
    var SIZE = Math.max(58, Math.min(104, Math.round(W / 12)));
    var R = SIZE / 2;
    var COL_W = SIZE * 0.9;           /* slight horizontal overlap   */
    var STEP = SIZE * 0.8;            /* vertical stack spacing       */
    var nCols = Math.ceil(W / COL_W);
    var rows = Math.ceil((H + SIZE) / STEP) + 1;
    var colFill = new Array(nCols);   /* how many stacked per column */
    for (var c = 0; c < nCols; c++) colFill[c] = 0;

    var G_FILL = 3000;   /* px/s^2 while raining in      */
    var G_DROP = 3600;   /* px/s^2 once the floor opens  */
    var REST = 0.26;     /* bounce energy kept on landing */

    var bunnies = [];
    var total = nCols * rows;
    for (var i = 0; i < total; i++) {
      /* pick the column with the fewest bunnies so the pile fills evenly */
      var col = 0, min = Infinity;
      for (var k = 0; k < nCols; k++) {
        if (colFill[k] < min) { min = colFill[k]; col = k; }
      }
      var level = colFill[col];
      colFill[col]++;

      var el = makeBunny();
      el.style.width = SIZE + "px";
      overlay.appendChild(el);

      bunnies.push({
        el: el,
        x: col * COL_W + COL_W / 2 + rand(-4, 4),
        y: -SIZE - rand(0, H * 0.9),      /* staggered heights above screen */
        vy: 0,
        vx: 0,
        targetY: H - R - level * STEP,    /* stack upward from the floor */
        rot: rand(-25, 25),
        vrot: rand(-40, 40),
        flip: Math.random() < 0.5 ? -1 : 1,
        landed: false,
        released: false,
        releaseAt: rand(0, 900)           /* ms into the fill phase */
      });
    }

    function draw(b) {
      b.el.style.transform =
        "translate3d(" + (b.x - R) + "px," + (b.y - R) + "px,0) rotate(" +
        b.rot + "deg) scaleX(" + b.flip + ")";
    }
    bunnies.forEach(draw);

    var phase = "fill";        /* fill -> hold -> drop */
    var start = performance.now();
    var last = start;
    var holdUntil = 0;

    function step(now) {
      var dt = Math.min(0.028, (now - last) / 1000);
      last = now;
      var elapsed = now - start;

      if (phase === "fill") {
        var allLanded = true;
        for (var i = 0; i < bunnies.length; i++) {
          var b = bunnies[i];
          if (!b.released) {
            if (elapsed >= b.releaseAt) b.released = true;
            else { allLanded = false; continue; }
          }
          if (!b.landed) {
            allLanded = false;
            b.vy += G_FILL * dt;
            b.y += b.vy * dt;
            b.rot += b.vrot * dt;
            if (b.y >= b.targetY) {
              b.y = b.targetY;
              if (Math.abs(b.vy) < 120) {
                b.vy = 0;
                b.landed = true;
                b.vrot = 0;
              } else {
                b.vy = -b.vy * REST;   /* little bounce on landing */
                b.vrot *= 0.5;
              }
            }
            draw(b);
          }
        }
        if (allLanded || elapsed > 2200) {
          phase = "hold";
          holdUntil = now + 380;
        }
      } else if (phase === "hold") {
        if (now >= holdUntil) {
          phase = "drop";
          overlay.classList.add("dropping");   /* fades the pink veil */
          for (var j = 0; j < bunnies.length; j++) {
            var d = bunnies[j];
            d.vy = rand(-80, 30);
            d.vx = (d.x - W / 2) * 0.4 + rand(-70, 70);
            d.vrot = rand(-220, 220);
          }
        }
      } else {
        /* trapdoor: free-fall until the pile has cleared the screen */
        var gone = true;
        for (var k = 0; k < bunnies.length; k++) {
          var e = bunnies[k];
          e.vy += G_DROP * dt;
          e.y += e.vy * dt;
          e.x += e.vx * dt;
          e.rot += e.vrot * dt;
          draw(e);
          if (e.y - R < H + SIZE) gone = false;
        }
        if (gone) {
          overlay.remove();
          done();
          return;
        }
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  return { play: play, SOURCES: SOURCES };
})();
