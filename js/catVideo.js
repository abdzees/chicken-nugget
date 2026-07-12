/* ============================================================
   catVideo.js — draw the talking-cat video to a canvas and key
   out its white background so the cat floats on the page.
   ============================================================ */
(function () {
  "use strict";

  var v = document.getElementById("cat-video");
  var c = document.getElementById("cat-canvas");
  if (!v || !c) return;
  var cx = c.getContext("2d", { willReadFrequently: true });

  var DISPLAY_W = 260;              /* internal keying resolution */

  function size() {
    if (!v.videoWidth) return;
    c.width = DISPLAY_W;
    c.height = Math.round(DISPLAY_W * v.videoHeight / v.videoWidth);
  }
  v.addEventListener("loadedmetadata", size);

  /* autoplay (muted) */
  v.muted = true;
  var p = v.play();
  if (p && p.catch) p.catch(function () {});

  /* white -> transparent, with a soft feather on the edge */
  var LO = 222, HI = 246;          /* min-channel thresholds */

  function frame() {
    if (v.readyState >= 2 && c.width) {
      cx.drawImage(v, 0, 0, c.width, c.height);
      try {
        var img = cx.getImageData(0, 0, c.width, c.height);
        var d = img.data;
        for (var i = 0; i < d.length; i += 4) {
          var m = Math.min(d[i], d[i + 1], d[i + 2]);
          if (m > LO) {
            var a = m >= HI ? 0 : (HI - m) / (HI - LO);
            d[i + 3] = Math.round(d[i + 3] * a);
          }
        }
        cx.putImageData(img, 0, 0);
      } catch (e) { /* frame not ready */ }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
