/* ============================================================
   hub.js — gift hub: open/close the four gifts (2x2)
   1 cookie · 2 note · 3 nyc fireworks · 4 blue tulips
   ============================================================ */
(function () {
  "use strict";

  var SCENES = "assets/scenes/";
  var FLOWERS_DIR = SCENES + "flowers/";
  var FLOWER_COUNT = 19; /* drop flower-1.jpg ... flower-19.jpg into assets/scenes/flowers/ */

  /* detect which flower photos actually exist (skip any not uploaded yet) */
  var flowerPhotos = [];
  (function detectFlowers() {
    for (var i = 1; i <= FLOWER_COUNT; i++) {
      (function (n) {
        var img = new Image();
        img.onload = function () { flowerPhotos.push(FLOWERS_DIR + "flower-" + n + ".jpg"); };
        img.src = FLOWERS_DIR + "flower-" + n + ".jpg";
      })(i);
    }
  })();

  /* a small, stable "randomish" tilt per photo so the polaroid always
     leans the same charming way each time you see it */
  function tiltFor(i) {
    var seq = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3.5];
    return seq[i % seq.length];
  }

  /* show a cute cream placeholder instead of a broken image if a photo
     hasn't been uploaded yet */
  function showPhotoOrPlaceholder(stage, src, emoji) {
    var img = document.createElement("img");
    img.className = "scene-photo";
    img.alt = "";
    img.onerror = function () {
      stage.innerHTML = '<div class="stage-placeholder">' + emoji + '<span>photo coming soon</span></div>';
    };
    img.src = src;
    stage.innerHTML = "";
    stage.appendChild(img);
  }

  /* each gift's enlarged scene (note opens its own overlay instead) */
  var GIFTS = {
    cookie: {
      /* TODO (personal): replace this line with your own message */
      line: "heyy, so i got a new job at your favourite cookie place, and i baked your favourite dark chocolate cookies for you",
      build: function (stage) { showPhotoOrPlaceholder(stage, SCENES + "manascookies.png"); }
    },
    fireworks: {
      /* TODO (personal): replace this line with your own message */
      line: "heyy look, it's us in nyc, watching fireworks over the new york skyline together",
      build: function (stage) { showPhotoOrPlaceholder(stage, SCENES + "usinNYC.png"); }
    },
    tulip: {
      line: "a few of the flowers that reminded me of you :)",
      build: buildFlowerGallery
    }
  };

  var galleryIndex = 0;
  function buildFlowerGallery(stage) {
    galleryIndex = 0;
    if (!flowerPhotos.length) {
      stage.innerHTML = '<div class="stage-placeholder"><span>photos coming soon</span></div>';
      return;
    }
    stage.innerHTML =
      '<div class="flower-gallery">' +
        '<button type="button" class="fg-nav fg-prev" aria-label="previous photo">‹</button>' +
        '<div class="polaroid"><div class="polaroid-photo"><img class="fg-img" alt="" /></div></div>' +
        '<button type="button" class="fg-nav fg-next" aria-label="next photo">›</button>' +
      "</div>" +
      '<span class="fg-counter"></span>';

    var img = stage.querySelector(".fg-img");
    var polaroid = stage.querySelector(".polaroid");
    var counter = stage.querySelector(".fg-counter");

    function show(i) {
      galleryIndex = (i + flowerPhotos.length) % flowerPhotos.length;
      img.src = flowerPhotos[galleryIndex];
      polaroid.style.setProperty("--tilt", tiltFor(galleryIndex) + "deg");
      counter.textContent = "" + (galleryIndex + 1) + " / " + flowerPhotos.length;
    }
    stage.querySelector(".fg-prev").addEventListener("click", function () { show(galleryIndex - 1); });
    stage.querySelector(".fg-next").addEventListener("click", function () { show(galleryIndex + 1); });
    show(0);
  }

  var scene = document.getElementById("gift-scene");
  var stage = document.getElementById("scene-stage");
  var line = document.getElementById("scene-line");
  var note = document.getElementById("note");

  function openNote() {
    note.classList.add("open");
    note.setAttribute("aria-hidden", "false");
  }
  function closeNote() {
    note.classList.remove("open");
    note.setAttribute("aria-hidden", "true");
  }

  var clearStageTimer = null;

  function openGift(key) {
    if (key === "note") { openNote(); return; }
    var g = GIFTS[key];
    if (!g) return;
    clearTimeout(clearStageTimer); /* cancel any pending clear from a just-closed gift */
    g.build(stage);
    line.textContent = g.line;
    scene.classList.add("open");
    scene.setAttribute("aria-hidden", "false");
  }
  function closeGift() {
    scene.classList.remove("open");
    scene.setAttribute("aria-hidden", "true");
    clearTimeout(clearStageTimer);
    clearStageTimer = window.setTimeout(function () { stage.innerHTML = ""; }, 350);
  }

  var gifts = document.querySelectorAll(".gift");
  for (var i = 0; i < gifts.length; i++) {
    (function (btn) {
      btn.addEventListener("click", function () { openGift(btn.getAttribute("data-gift")); });
    })(gifts[i]);
  }
  document.getElementById("scene-back").addEventListener("click", closeGift);

  document.getElementById("note-close").addEventListener("click", closeNote);
  note.addEventListener("click", function (e) { if (e.target === note) closeNote(); });

  /* Esc closes whatever is open */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (scene.classList.contains("open")) closeGift();
    if (note.classList.contains("open")) closeNote();
  });

  /* back to the previous page, with the shared fade */
  var backBtn = document.getElementById("hub-back");
  if (backBtn) {
    backBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var fade = document.getElementById("fade");
      if (fade) fade.classList.add("on");
      window.setTimeout(function () { window.location.href = backBtn.href; }, 420);
    });
  }

  /* easter egg: scroll cue down to the video section, and back up again */
  var down = document.getElementById("scroll-down");
  var up = document.getElementById("scroll-up");
  if (down) down.addEventListener("click", function () {
    var target = document.querySelector(".video-page");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
  if (up) up.addEventListener("click", function () {
    var target = document.querySelector(".hub-page");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });

  /* twinkling stars */
  if (window.Stars) {
    Stars.fill(document.getElementById("hub-stars"), 70);
    Stars.fill(document.querySelector("#gift-scene .hub-stars"), 50);
  }
})();
