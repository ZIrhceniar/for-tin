(() => {
  const VALID_ANSWERS = new Set(["three", "3", "three years", "3 years", "tatlo"]);
  const TOTAL_PHOTOS = 36;

  // DOM References
  const lockScreen = document.getElementById("lock-screen");
  const lockCard = document.getElementById("lock-card");
  const unlockForm = document.getElementById("unlock-form");
  const passwordInput = document.getElementById("password-input");
  const lockError = document.getElementById("lock-error");
  const parallaxItems = document.querySelectorAll(".bg-pol");

  const scrapbook = document.getElementById("scrapbook");
  const dockJumpBtns = document.querySelectorAll(".dock-btn[data-jump]");
  const lightsBtn = document.getElementById("lights-btn");
  const lightsLabel = document.getElementById("lights-label");

  const envelopeBox = document.getElementById("envelope-box");
  const waxSeal = document.getElementById("wax-seal");
  const envelopeActionBtn = document.getElementById("envelope-action-btn");

  const polaroidBoard = document.getElementById("polaroid-board");
  const modeScatterBtn = document.getElementById("mode-scatter-btn");
  const modeGridBtn = document.getElementById("mode-grid-btn");
  const reshuffleBtn = document.getElementById("reshuffle-btn");

  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCount = document.getElementById("lb-count");
  const lbClose = document.getElementById("lb-close");
  const lbPrev = document.getElementById("lb-prev");
  const lbNext = document.getElementById("lb-next");

  const fxCanvas = document.getElementById("fx-canvas");
  const ctx = fxCanvas ? fxCanvas.getContext("2d") : null;

  let topZ = 20;
  let activePhotoIndex = 0;
  const polaroidElements = [];

  // ==================== 1. LOCK SCREEN PARALLAX & PASSWORD ====================
  const baseRotations = [-9, 8, 6, -7, -12, 11];
  window.addEventListener("mousemove", (e) => {
    if (!lockScreen || lockScreen.classList.contains("hidden")) return;
    const cx = (e.clientX / window.innerWidth - 0.5) * 2;
    const cy = (e.clientY / window.innerHeight - 0.5) * 2;
    parallaxItems.forEach((el, idx) => {
      const depth = parseFloat(el.dataset.depth || "0.04") * 420;
      const rot = baseRotations[idx % baseRotations.length];
      el.style.transform = `translate(${(cx * depth).toFixed(1)}px, ${(cy * depth).toFixed(1)}px) rotate(${rot}deg)`;
    });
  });

  function unlockScrapbook() {
    lockError.textContent = "";
    document.title = "Happy 3rd Anniversary, Bebe ♥";
    burstHearts(window.innerWidth / 2, window.innerHeight / 2, 52);

    lockScreen.classList.add("unlocking");
    scrapbook.classList.remove("hidden");
    scrapbook.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
      scatterPolaroids();
    });

    setTimeout(() => {
      lockScreen.classList.add("hidden");
    }, 650);
  }

  unlockForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = (passwordInput.value || "").trim().toLowerCase();
    if (VALID_ANSWERS.has(raw)) {
      unlockScrapbook();
    } else {
      lockError.textContent = "Luh?";
      lockCard.classList.remove("shake");
      void lockCard.offsetWidth;
      lockCard.classList.add("shake");
      passwordInput.select();
    }
  });

  // ==================== 2. TOP DOCK & CINEMA LIGHTS TOGGLE ====================
  dockJumpBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      dockJumpBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = document.querySelector(btn.dataset.jump);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  lightsBtn.addEventListener("click", () => {
    const dimmed = document.body.classList.toggle("lights-dimmed");
    lightsBtn.classList.toggle("active", dimmed);
    lightsLabel.textContent = dimmed ? "Lights On" : "Dim Lights";
  });

  // ==================== 3. INTERACTIVE 3D WAX-SEAL ENVELOPE ====================
  function toggleEnvelope() {
    const isOpen = envelopeBox.classList.toggle("is-open");
    envelopeActionBtn.textContent = isOpen
      ? "Tuck letter back into envelope"
      : "Tap the wax seal to open your letter";

    if (isOpen) {
      const rect = envelopeBox.getBoundingClientRect();
      burstHearts(rect.left + rect.width / 2, rect.top + rect.height * 0.45, 26);
    }
  }

  waxSeal.addEventListener("click", toggleEnvelope);
  envelopeActionBtn.addEventListener("click", toggleEnvelope);
  envelopeBox.addEventListener("click", (e) => {
    if (!envelopeBox.classList.contains("is-open") && e.target !== waxSeal) {
      toggleEnvelope();
    }
  });

  // ==================== 4. INTERACTIVE DRAGGABLE POLAROID BOARD ====================
  function initPolaroidBoard() {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < TOTAL_PHOTOS; i++) {
      const num = String(i + 1).padStart(2, "0");
      const card = document.createElement("div");
      card.className = "board-polaroid";
      card.dataset.index = String(i);

      const img = document.createElement("img");
      img.src = `assets/photos/memory_${num}.jpg`;
      img.alt = `Memory ${i + 1}`;
      img.loading = "lazy";

      const tag = document.createElement("span");
      tag.className = "board-polaroid-num";
      tag.textContent = `#${i + 1}`;

      card.appendChild(img);
      card.appendChild(tag);
      enablePolaroidInteraction(card, i);

      polaroidElements.push(card);
      frag.appendChild(card);
    }

    polaroidBoard.appendChild(frag);
  }

  function scatterPolaroids() {
    if (!polaroidBoard.classList.contains("is-scattered")) return;

    const isMobile = window.innerWidth <= 640;
    const boardRect = polaroidBoard.getBoundingClientRect();
    const bw = Math.max(boardRect.width || (isMobile ? 350 : 1080), 280);
    const bh = Math.max(boardRect.height || (isMobile ? 820 : 760), 560);
    const cardW = isMobile ? 118 : 195;
    const cardH = isMobile ? 146 : 235;

    const maxX = Math.max(12, bw - cardW - 10);
    const maxY = Math.max(12, bh - cardH - 10);

    const cols = isMobile ? 3 : 6;
    const rows = isMobile ? 12 : 6;
    const slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({ r, c });
      }
    }
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    polaroidElements.forEach((card, idx) => {
      const slot = slots[idx % slots.length];
      const cellW = maxX / cols;
      const cellH = maxY / rows;

      const jitterX = (Math.random() - 0.5) * cellW * 0.65;
      const jitterY = (Math.random() - 0.5) * cellH * 0.65;

      const x = Math.min(maxX, Math.max(6, slot.c * cellW + cellW * 0.18 + jitterX));
      const y = Math.min(maxY, Math.max(6, slot.r * cellH + cellH * 0.18 + jitterY));
      const rot = (Math.random() * 22 - 11).toFixed(1);

      card.dataset.rot = rot;
      card.style.left = `${Math.round(x)}px`;
      card.style.top = `${Math.round(y)}px`;
      card.style.transform = `rotate(${rot}deg)`;
      card.style.zIndex = String(1 + (idx % 18));
    });
  }

  function enablePolaroidInteraction(card, index) {
    let isDown = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;
    let lastTap = 0;

    card.addEventListener("pointerdown", (e) => {
      if (polaroidBoard.classList.contains("is-grid")) {
        return;
      }
      isDown = true;
      moved = false;
      topZ += 1;
      card.style.zIndex = String(topZ);
      card.classList.add("is-dragging");

      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseFloat(card.style.left || "0");
      origTop = parseFloat(card.style.top || "0");

      const rot = card.dataset.rot || "0";
      card.style.transform = `rotate(${rot}deg) scale(1.05)`;
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 5) {
        moved = true;
      }
      card.style.left = `${origLeft + dx}px`;
      card.style.top = `${origTop + dy}px`;
    });

    function finishPointer(e) {
      if (!isDown) return;
      isDown = false;
      card.classList.remove("is-dragging");
      const rot = card.dataset.rot || "0";
      card.style.transform = `rotate(${rot}deg)`;
      try {
        card.releasePointerCapture(e.pointerId);
      } catch (_) {}

      if (!moved) {
        const now = Date.now();
        if (now - lastTap < 340) {
          openLightbox(index);
          lastTap = 0;
        } else {
          lastTap = now;
        }
      }
    }

    card.addEventListener("pointerup", finishPointer);
    card.addEventListener("pointercancel", finishPointer);

    card.addEventListener("click", () => {
      if (polaroidBoard.classList.contains("is-grid")) {
        openLightbox(index);
      }
    });

    card.addEventListener("dblclick", () => {
      openLightbox(index);
    });
  }

  modeScatterBtn.addEventListener("click", () => {
    modeScatterBtn.classList.add("active");
    modeGridBtn.classList.remove("active");
    polaroidBoard.classList.remove("is-grid");
    polaroidBoard.classList.add("is-scattered");
    scatterPolaroids();
  });

  modeGridBtn.addEventListener("click", () => {
    modeGridBtn.classList.add("active");
    modeScatterBtn.classList.remove("active");
    polaroidBoard.classList.remove("is-scattered");
    polaroidBoard.classList.add("is-grid");
    polaroidElements.forEach((card, idx) => {
      const tilt = idx % 2 === 0 ? -1.4 : 1.4;
      card.style.transform = `rotate(${tilt}deg)`;
    });
  });

  reshuffleBtn.addEventListener("click", () => {
    if (polaroidBoard.classList.contains("is-grid")) {
      modeScatterBtn.click();
    } else {
      scatterPolaroids();
    }
  });

  // ==================== 5. LIGHTBOX VIEWER ====================
  function openLightbox(index) {
    activePhotoIndex = (index + TOTAL_PHOTOS) % TOTAL_PHOTOS;
    const num = String(activePhotoIndex + 1).padStart(2, "0");
    lbImg.src = `assets/photos/memory_${num}.jpg`;
    lbCount.textContent = `${activePhotoIndex + 1} / ${TOTAL_PHOTOS}`;
    lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
  }

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => openLightbox(activePhotoIndex - 1));
  lbNext.addEventListener("click", () => openLightbox(activePhotoIndex + 1));

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  let lbTouchStartX = 0;
  lightbox.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length === 1) {
      lbTouchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    if (!lbTouchStartX || !e.changedTouches || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - lbTouchStartX;
    if (Math.abs(dx) > 45) {
      openLightbox(dx < 0 ? activePhotoIndex + 1 : activePhotoIndex - 1);
    }
    lbTouchStartX = 0;
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(activePhotoIndex - 1);
    if (e.key === "ArrowRight") openLightbox(activePhotoIndex + 1);
  });

  // ==================== 6. PAPER HEART CONFETTI FX ====================
  const particles = [];
  let animId = null;

  function resizeCanvas() {
    if (!fxCanvas) return;
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function burstHearts(x, y, count = 36) {
    if (!ctx) return;
    const colors = ["#B84A39", "#D46A59", "#E39774", "#C85A48", "#8F3224"];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.2 + Math.random() * 6.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2,
        size: 7 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.12,
        color: colors[i % colors.length],
        alpha: 1
      });
    }
    if (!animId) {
      animId = requestAnimationFrame(stepParticles);
    }
  }

  function stepParticles() {
    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.14;
      p.rot += p.vrot;
      p.alpha -= 0.014;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.6, -s * 0.3, -s, s * 0.2, 0, s);
      ctx.bezierCurveTo(s, s * 0.2, s * 0.6, -s * 0.3, 0, s * 0.3);
      ctx.fill();
      ctx.restore();
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(stepParticles);
    } else {
      animId = null;
    }
  }

  initPolaroidBoard();
})();
