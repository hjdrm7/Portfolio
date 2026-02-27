/* ============================================================
   SCROLL POSITION PERSISTENCE
   Saves scroll position to sessionStorage on scroll/unload,
   restores it after the page reloads so the user stays on
   the same section they were viewing.
   ============================================================ */
(function () {
  const KEY = 'scrollY';

  /* Restore scroll position before first paint */
  const saved = sessionStorage.getItem(KEY);
  if (saved !== null) {
    /* Use requestAnimationFrame to restore after layout is ready */
    window.addEventListener('DOMContentLoaded', () => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' });
      });
    });
  }

  /* Save scroll position continuously */
  window.addEventListener('scroll', () => {
    sessionStorage.setItem(KEY, window.scrollY);
  }, { passive: true });
})();
  /* ============================================================ */
(function () {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

/* ============================================================
   THEME ICON SYNC
   Called on load and on toggle to keep icon matching theme.
   ============================================================ */
function applyThemeIcon(theme) {
  const moonPath   = document.getElementById('moon-path');
  const sunCircle  = document.getElementById('sun-circle');
  const sunRays    = document.getElementById('sun-rays');
  const themeLabel = document.getElementById('theme-label');
  const themeBtn   = document.getElementById('theme-btn');
  if (!moonPath) return;

  if (theme === 'dark') {
    moonPath.style.opacity  = '0';
    sunCircle.style.opacity = '1';
    sunRays.style.opacity   = '1';
    themeLabel.textContent  = 'Light Mode';
    themeBtn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    sunCircle.style.opacity = '0';
    sunRays.style.opacity   = '0';
    moonPath.style.opacity  = '1';
    themeLabel.textContent  = 'Dark Mode';
    themeBtn.setAttribute('aria-label', 'Switch to dark mode');
  }
}

/* ============================================================
   THEME TOGGLE — morphing moon ↔ sun
   ============================================================ */
function toggleTheme() {
  const html     = document.documentElement;
  const isDark   = html.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';

  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  /* Spin SVG */
  const svg = document.getElementById('theme-icon-svg');
  svg.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  svg.style.transform  = 'rotate(180deg)';
  setTimeout(() => { svg.style.transform = 'rotate(360deg)'; }, 250);
  setTimeout(() => { svg.style.transform = 'rotate(0deg)'; svg.style.transition = 'none'; }, 500);

  /* Add transitions only during toggle */
  const moonPath  = document.getElementById('moon-path');
  const sunCircle = document.getElementById('sun-circle');
  const sunRays   = document.getElementById('sun-rays');
  if (isDark) {
    sunCircle.style.transition = 'opacity 0.3s ease';
    sunRays.style.transition   = 'opacity 0.3s ease';
    moonPath.style.transition  = 'opacity 0.3s ease 0.15s';
  } else {
    moonPath.style.transition  = 'opacity 0.3s ease';
    sunCircle.style.transition = 'opacity 0.3s ease 0.15s';
    sunRays.style.transition   = 'opacity 0.3s ease 0.2s';
  }

  applyThemeIcon(newTheme);
}

/* ============================================================
   HACKER / DECODE TEXT EFFECT
   Each .decode-word scrambles through random characters before
   resolving into the real letter — classic "Matrix" style reveal.
   ============================================================ */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

function decodeText(element, finalText, duration, startDelay) {
  /* duration: total ms to resolve all characters
     Each character gets an equal time slice */
  const totalChars  = finalText.length;
  const timePerChar = duration / totalChars;
  let   resolved    = 0;

  setTimeout(() => {
    /* Scramble phase — rapid random character cycling */
    const scrambleInterval = setInterval(() => {
      let display = '';
      for (let i = 0; i < totalChars; i++) {
        if (i < resolved) {
          /* Already resolved — show the real character */
          display += finalText[i];
        } else {
          /* Still scrambling — random character */
          display += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      element.textContent = display;

      /* Resolve one character at a time */
      resolved++;
      if (resolved > totalChars) {
        clearInterval(scrambleInterval);
        element.textContent = finalText; /* ensure final text is exact */
      }
    }, timePerChar);
  }, startDelay);
}

/* ============================================================
   CODE LINE STAGGERED REVEAL + NAME DECODE ON LOAD
   ============================================================ */
/* ============================================================
   TYPEWRITER — "GET TO KNOW ME" eyebrow label
   Appends one character at a time via JS for a true, smooth
   typewriter effect. Called on scroll enter and re-enter.
   ============================================================ */
function typewriterReveal(el) {
  const fullText = el.getAttribute('data-text') || el.textContent.trim();
  el.setAttribute('data-text', fullText);
  el.textContent = '';
  el.classList.remove('done');
  el.classList.add('typing');

  const msPerChar = 100;
  let i = 0;

  const interval = setInterval(() => {
    el.textContent += fullText[i];
    i++;
    if (i >= fullText.length) {
      clearInterval(interval);
      setTimeout(() => {
        el.classList.remove('typing');
        el.classList.add('done');
      }, 1200);
    }
  }, msPerChar);
}

window.addEventListener('DOMContentLoaded', () => {

  /* Sync icon + label with saved theme on every load */
  applyThemeIcon(document.documentElement.getAttribute('data-theme') || 'dark');

  /* ============================================================
     SECTION ENTRANCE — re-animates content every time a section
     enters the viewport, whether scrolling down or back up.
     ============================================================ */
  const sections = document.querySelectorAll('.section-animate');

  const sectionEnterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sec = entry.target;
      const revealEls = sec.querySelectorAll('.reveal, .reveal-left, .reveal-right');
      const eyebrow   = sec.querySelector('.section-eyebrow');

      if (entry.isIntersecting) {
        sec.classList.add('section-visible');

        /* Re-trigger reveal animations with stagger */
        revealEls.forEach((el, i) => {
          setTimeout(() => el.classList.add('in-view'), i * 120);
        });

        /* Re-trigger typewriter */
        if (eyebrow) {
          eyebrow.classList.remove('typing', 'done');
          typewriterReveal(eyebrow);
        }

        /* Re-trigger hacker decode on hero name */
        const words = sec.querySelectorAll('.decode-word');
        words.forEach((word, i) => {
          const finalText = word.getAttribute('data-text');
          decodeText(word, finalText, 600, 200 + i * 300);
        });

        /* Re-trigger staggered code-line reveal */
        const lines = sec.querySelectorAll('.code-line');
        lines.forEach((line, i) => {
          setTimeout(() => line.classList.add('visible'), 700 + i * 180);
        });

      } else {
        /* Reset everything so it re-animates on next entry */
        sec.classList.remove('section-visible');
        revealEls.forEach(el => el.classList.remove('in-view'));

        if (eyebrow) {
          eyebrow.classList.remove('typing', 'done');
          eyebrow.textContent = eyebrow.getAttribute('data-text');
        }

        /* Reset decode words to original text */
        sec.querySelectorAll('.decode-word').forEach(word => {
          word.textContent = word.getAttribute('data-text');
        });

        /* Reset code lines */
        sec.querySelectorAll('.code-line').forEach(line => {
          line.classList.remove('visible');
        });
      }
    });
  }, { threshold: 0.08 });

  sections.forEach(sec => {
    /* Hero is visible on load — give it in-view immediately */
    if (sec.id === 'home') {
      sec.querySelectorAll('.reveal, .reveal-left, .reveal-right')
        .forEach(el => el.classList.add('in-view'));

      /* Fire decode and code lines on first load */
      const words = sec.querySelectorAll('.decode-word');
      words.forEach((word, i) => {
        const finalText = word.getAttribute('data-text');
        decodeText(word, finalText, 600, 200 + i * 300);
      });

      const lines = sec.querySelectorAll('.code-line');
      lines.forEach((line, i) => {
        setTimeout(() => line.classList.add('visible'), 700 + i * 180);
      });
    }
    sectionEnterObserver.observe(sec);
  });

});
/* ============================================================
   MOUSE CODE TRAIL
   Spawns code snippets at cursor position on an interval so
   they keep firing even when the mouse isn't moving.
   Blocked inside the dock (nav) and code card.
   ============================================================ */
(function () {
  const SNIPPETS = [
    'const', 'int', 'void', '=>', '{}', '[]', '()',
    '===', '++', '//', '#include',
    'print()', 'System.out', 'SELECT *',
    'public', 'class', 'return', 'true', 'null',
    '<div>', '</>', ':root', 'if()', 'for()',
    'ALTER TABLE', 'JOIN', 'rgb()',
  ];

  /* Blocked zones — trail won't spawn inside these selectors */
  const BLOCKED = ['.dock', '.hero-right', '.code-card'];

  let mouseX = null;
  let mouseY = null;

  /* Track cursor position */
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function isBlocked(x, y) {
    if (x === null) return true;
    for (const sel of BLOCKED) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
    return false;
  }

  /* Spawn on interval — fires even when mouse isn't moving */
  setInterval(() => {
    if (mouseX === null || isBlocked(mouseX, mouseY)) return;

    const el = document.createElement('span');
    el.className = 'code-trail';
    el.textContent = SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];

    const drift = (Math.random() - 0.5) * 30;
    el.style.left = (mouseX + drift) + 'px';
    el.style.top  = mouseY + 'px';

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }, 120);
})();


/* ============================================================
   CONTACT NAV — precise scroll with enough room at bottom
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const contactLink = document.querySelector("a.dock-btn[href='#contact']");
  if (!contactLink) return;

  contactLink.addEventListener("click", (e) => {
    e.preventDefault();
    const el = document.getElementById("contact");
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top, behavior: "smooth" });
    history.pushState(null, "", "#contact");
  });
}); 

/* ============================================================
   FOOTER WORD CYCLE
   New word rises up pushing the current word out — both animate
   simultaneously so the old word vanishes as it's pushed up.
   Container is sized to the longest word via a hidden sizer span.
   ============================================================ */
(function () {
  const WORDS = ['create', 'build', 'design', 'make', 'code'];
  let index = 0;

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('footer-cycle-word');
    if (!container) return;

    /* Find longest word and use it as the invisible sizer */
    const longest = WORDS.reduce((a, b) => a.length >= b.length ? a : b);
    const sizer = document.createElement('span');
    sizer.className = 'word-sizer';
    sizer.textContent = longest;
    container.textContent = '';
    container.appendChild(sizer);

    /* First visible word */
    const initial = document.createElement('span');
    initial.textContent = WORDS[0];
    container.appendChild(initial);

    setInterval(() => {
      index = (index + 1) % WORDS.length;

      const exiting = container.querySelector('span:not(.word-sizer):not(.word-exit)');
      if (!exiting) return;

      const entering = document.createElement('span');
      entering.textContent = WORDS[index];

      exiting.classList.add('word-exit');
      entering.classList.add('word-enter');
      container.appendChild(entering);

      exiting.addEventListener('animationend', () => exiting.remove(), { once: true });

    }, 2000);
  });
})();

/* ============================================================
   PROJ-RIGHT Z-INDEX FIX
   Keeps z-index elevated until the return animation completes
   so the preview never dips under sibling cards mid-transition.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const TRANSITION_MS = 600; /* match the CSS transition duration */

  document.querySelectorAll('.proj-right').forEach(right => {
    let resetTimer = null;

    right.addEventListener('mouseenter', () => {
      clearTimeout(resetTimer);
      right.style.zIndex = '9999';
      right.style.overflow = 'visible';
    });

    right.addEventListener('mouseleave', () => {
      /* Wait for return animation to finish before resetting */
      resetTimer = setTimeout(() => {
        right.style.zIndex = '';
        right.style.overflow = 'hidden';
      }, TRANSITION_MS);
    });
  });
});