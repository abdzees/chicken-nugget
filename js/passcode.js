/* ============================================================
   passcode.js — iOS-style keypad gate + tulip curtain transition
   Classic script (no modules) so it works on file:// and https.
   ============================================================ */
(function () {
  "use strict";

  var PASSCODE = "2007";
  var LEN = 4;

  var keypad = document.getElementById("keypad");
  var dotsWrap = document.getElementById("dots");
  var dots = dotsWrap ? dotsWrap.querySelectorAll(".dot") : [];
  var deleteBtn = keypad ? keypad.querySelector('[data-action="delete"]') : null;
  var transition = document.getElementById("transition");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var entry = "";
  var unlocked = false;
  var locked = false; /* brief input lock during shake/unlock */

  /* ---- render dots + toggle delete key ---- */
  function render() {
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("filled", i < entry.length);
    }
    if (deleteBtn) deleteBtn.hidden = entry.length === 0;
  }

  function press(digit) {
    if (locked || unlocked || entry.length >= LEN) return;
    entry += digit;
    render();
    if (entry.length === LEN) {
      window.setTimeout(check, 140);
    }
  }

  function del() {
    if (locked || unlocked || entry.length === 0) return;
    entry = entry.slice(0, -1);
    render();
  }

  function check() {
    if (entry === PASSCODE) {
      unlock();
    } else {
      wrong();
    }
  }

  function wrong() {
    locked = true;
    dotsWrap.classList.remove("shake");
    void dotsWrap.offsetWidth; /* reflow to restart animation */
    dotsWrap.classList.add("shake");
    if (navigator.vibrate) navigator.vibrate([12, 40, 12]);
    window.setTimeout(function () {
      entry = "";
      render();
      dotsWrap.classList.remove("shake");
      locked = false;
    }, reduceMotion ? 200 : 520);
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (navigator.vibrate) navigator.vibrate(18);

    if (reduceMotion) {
      go();
      return;
    }
    transition.classList.add("active");
    /* brief pink veil, then the meadow takes over with the bunny rain */
    window.setTimeout(go, 470);
  }

  function go() {
    try {
      sessionStorage.setItem("mushu:reveal", "1");
    } catch (e) {
      /* private mode — fall back to query flag */
    }
    window.location.href = "ask.html?reveal=1";
  }

  /* ---- pointer input with a tactile "pressed" flash ---- */
  keypad.addEventListener("click", function (e) {
    var btn = e.target.closest(".key");
    if (!btn) return;
    if (btn.dataset.action === "delete") {
      del();
      return;
    }
    if (btn.dataset.key) {
      btn.classList.add("pressed");
      window.setTimeout(function () { btn.classList.remove("pressed"); }, 130);
      press(btn.dataset.key);
    }
  });

  /* ---- physical keyboard support ---- */
  document.addEventListener("keydown", function (e) {
    if (e.key >= "0" && e.key <= "9") {
      var btn = keypad.querySelector('[data-key="' + e.key + '"]');
      if (btn) {
        btn.classList.add("pressed");
        window.setTimeout(function () { btn.classList.remove("pressed"); }, 130);
      }
      press(e.key);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      del();
    }
  });

  render();
})();
