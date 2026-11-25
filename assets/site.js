const menuToggle = document.querySelector('#menu-toggle');
const primaryNav = document.querySelector('#primary-nav');

if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    primaryNav.classList.toggle('is-open', !isOpen);
  });

  primaryNav.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      menuToggle.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('is-open');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      menuToggle.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('is-open');
      menuToggle.focus();
    }
  });
}

const mapNodes = [...document.querySelectorAll('[data-map-node]')];
const mapDetailNumber = document.querySelector('#map-detail-number');
const mapDetailTitle = document.querySelector('#map-detail-title');
const mapDetailDescription = document.querySelector('#map-detail-description');

mapNodes.forEach((node) => {
  node.addEventListener('click', () => {
    mapNodes.forEach((item) => {
      const selected = item === node;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    if (mapDetailNumber) mapDetailNumber.textContent = node.dataset.mapNumber;
    if (mapDetailTitle) mapDetailTitle.textContent = node.dataset.mapTitle;
    if (mapDetailDescription) mapDetailDescription.textContent = node.dataset.mapDescription;
  });
});

const heroTitle = document.querySelector('.hero-title');

if (heroTitle) {
  const titleLines = [...heroTitle.querySelectorAll('.hero-title-line')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    const characters = [];
    titleLines.forEach((line) => {
      const spans = [...line.textContent].map((character) => {
        const span = document.createElement('span');
        span.className = 'hero-title-character';
        span.textContent = character;
        characters.push(span);
        return span;
      });
      line.replaceChildren(...spans);
    });
    heroTitle.classList.add('hero-title-typing');

    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    let audioContext = null;
    let keySound = null;

    if (AudioContextConstructor) {
      try {
        audioContext = new AudioContextConstructor();
        keySound = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * .025), audioContext.sampleRate);
        const samples = keySound.getChannelData(0);
        for (let index = 0; index < samples.length; index += 1) {
          samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
        }
        if (audioContext.state === 'suspended') {
          audioContext.resume().catch((error) => {
            if (error.name !== 'NotAllowedError') console.warn('No se pudo iniciar el sonido de teclado.', error);
          });
        }
      } catch (error) {
        console.warn('No se pudo preparar el sonido de teclado.', error);
      }
    }

    function playKeySound() {
      if (!audioContext || !keySound || audioContext.state !== 'running') return;
      const now = audioContext.currentTime;
      const source = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const volume = audioContext.createGain();
      source.buffer = keySound;
      filter.type = 'highpass';
      filter.frequency.value = 1400;
      volume.gain.setValueAtTime(.035, now);
      volume.gain.exponentialRampToValueAtTime(.001, now + .02);
      source.connect(filter);
      filter.connect(volume);
      volume.connect(audioContext.destination);
      source.start(now);
      source.stop(now + .025);
    }

    let characterIndex = 0;
    function unlockTypingAudio() {
      if (!audioContext || audioContext.state !== 'suspended' || characterIndex >= characters.length) return;
      audioContext.resume().catch((error) => {
        if (error.name !== 'NotAllowedError') console.warn('No se pudo iniciar el sonido de teclado.', error);
      });
    }

    function typeNextCharacter() {
      const character = characters[characterIndex];
      if (!character) {
        window.removeEventListener('pointerdown', unlockTypingAudio);
        window.removeEventListener('keydown', unlockTypingAudio);
        return;
      }
      character.classList.add('is-visible');
      playKeySound();
      characterIndex += 1;
      window.setTimeout(typeNextCharacter, character.textContent === '.' ? 220 : 78);
    }

    if (document.visibilityState === 'visible') {
      window.addEventListener('pointerdown', unlockTypingAudio, { once: true });
      window.addEventListener('keydown', unlockTypingAudio, { once: true });
      window.setTimeout(typeNextCharacter, 180);
    } else characters.forEach((character) => character.classList.add('is-visible'));
  }
}

const heroCanvas = document.querySelector('#hero-canvas');

if (heroCanvas instanceof HTMLCanvasElement) {
  const context = heroCanvas.getContext('2d');
  if (context) {
    const destinations = [
      { label: 'Diseñar', href: 'modulo-1-tareas-competenciales/index.html', color: '#ff5a36', startX: .18, startY: .4 },
      { label: 'Idear', href: 'modulo-4-ideas-clase/index.html', color: '#2563eb', startX: .41, startY: .46 },
      { label: 'Explorar', href: 'modulo-5-laboratorio/index.html', color: '#f59e0b', startX: .67, startY: .38 },
      { label: 'Jugar', href: 'modulo-9-gamificacion/index.html', color: '#10b981', startX: .82, startY: .44 }
    ];
    const balls = destinations.map((item, index) => ({
      ...item,
      vx: (index % 2 ? -1 : 1) * (.13 + index * .025),
      vy: (index % 2 ? 1 : -1) * (.16 + index * .02),
      radius: 34
    }));
    const motionSetting = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let scale = 1;
    let selectedIndex = 0;
    let dragging = null;
    let pointer = { x: 0, y: 0, active: false };
    let animationFrame = 0;
    let previousFrame = 0;
    let introStartedAt = 0;
    let introFinished = motionSetting.matches;

    function finishIntro() {
      balls.forEach((ball) => {
        ball.x = width * ball.startX;
        ball.y = height * ball.startY;
        ball.launchProgress = 1;
        ball.introDone = true;
      });
      introFinished = true;
    }

    function resizeCanvas() {
      const bounds = heroCanvas.getBoundingClientRect();
      const previousWidth = width;
      const previousHeight = height;
      width = bounds.width;
      height = bounds.height;
      scale = Math.min(window.devicePixelRatio || 1, 2);
      heroCanvas.width = Math.round(width * scale);
      heroCanvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const radius = Math.max(25, Math.min(37, width * .085));
      balls.forEach((ball, index) => {
        ball.radius = radius;
        if (previousWidth && previousHeight) {
          ball.x *= width / previousWidth;
          ball.y *= height / previousHeight;
          if (!introFinished && ball.launchX !== undefined) {
            ball.launchX *= width / previousWidth;
            ball.launchY *= height / previousHeight;
          }
        } else if (introFinished) {
          ball.x = width * ball.startX;
          ball.y = height * ball.startY;
        } else {
          ball.x = width * (.32 + index * .12);
          const layerHeight = Math.max(10, Math.min(15, height * .035));
          ball.y = height * .78 - layerHeight * 5 + radius * .28;
          ball.launchX = ball.x;
          ball.launchY = ball.y;
        }
        ball.x = Math.min(width - radius - 4, Math.max(radius + 4, ball.x));
        ball.y = Math.min(height - radius - 22, Math.max(radius + 38, ball.y));
      });
      drawScene();
    }

    function drawScene() {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      context.save();
      context.strokeStyle = 'rgba(20,20,19,.07)';
      context.lineWidth = 1;
      context.setLineDash([2, 6]);
      context.beginPath();
      context.ellipse(width * .5, height * .53, width * .35, height * .28, -.16, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      drawBooksAndPlants();

      balls.forEach((ball) => {
        const progress = ball.launchProgress || 0;
        if (progress <= 0 || progress >= 1) return;
        context.save();
        context.globalAlpha = (1 - progress) * .32;
        context.fillStyle = ball.color;
        for (let bubble = 0; bubble < 3; bubble += 1) {
          const radius = Math.max(2, ball.radius * (.12 - bubble * .025));
          const offset = ball.radius * (.72 + bubble * .5);
          const drift = Math.sin(progress * 5 + bubble + ball.startX * 10) * radius * 2;
          context.beginPath();
          context.arc(ball.x + drift, ball.y + offset, radius, 0, Math.PI * 2);
          context.fill();
        }
        context.restore();
      });

      balls.forEach((ball, index) => {
        const selected = index === selectedIndex;
        context.save();
        context.shadowColor = 'rgba(20,20,19,.18)';
        context.shadowBlur = selected ? 19 : 12;
        context.shadowOffsetY = 7;
        const gradient = context.createRadialGradient(
          ball.x - ball.radius * .34, ball.y - ball.radius * .38, ball.radius * .08,
          ball.x, ball.y, ball.radius * 1.15
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(.17, ball.color);
        gradient.addColorStop(1, ball.color);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowColor = 'transparent';
        context.strokeStyle = selected ? 'rgba(20,20,19,.78)' : 'rgba(20,20,19,.16)';
        context.lineWidth = selected ? 2 : 1;
        context.stroke();
        context.fillStyle = 'rgba(255,255,255,.52)';
        context.beginPath();
        context.ellipse(ball.x - ball.radius * .3, ball.y - ball.radius * .37, ball.radius * .16, ball.radius * .09, -.55, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#141413';
        context.font = `600 ${Math.max(10, ball.radius * .31)}px "DM Sans", sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(ball.label, ball.x, ball.y + ball.radius * .1);
        context.restore();
      });
    }

    function drawBooksAndPlants() {
      const centerX = width * .5;
      const bottom = height * .78;
      const bookWidth = Math.min(width * .72, 340);
      const layerHeight = Math.max(10, Math.min(15, height * .035));
      const widths = [.94, 1, .9, .97, .84];
      const bookColors = ['#d27659', '#4f73ad', '#d2a44e', '#668765', '#554b76'];

      function drawLeaf(x, y, angle, length, color) {
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(0, 0);
        context.quadraticCurveTo(length * .35, -length * .42, length, 0);
        context.quadraticCurveTo(length * .42, length * .35, 0, 0);
        context.fill();
        context.strokeStyle = 'rgba(32,74,50,.34)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(length * .78, 0);
        context.stroke();
        context.restore();
      }

      function drawPlant(baseX, direction) {
        const baseY = bottom - 8;
        const stemHeight = height * .31;
        const stemX = baseX + direction * 7;
        context.save();
        context.strokeStyle = '#527d59';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(baseX, baseY);
        context.quadraticCurveTo(baseX + direction * 15, baseY - stemHeight * .45, stemX, baseY - stemHeight);
        context.stroke();
        for (let leaf = 0; leaf < 4; leaf += 1) {
          const progress = .24 + leaf * .16;
          const x = baseX + direction * 7 * progress;
          const y = baseY - stemHeight * progress;
          const size = Math.min(40, width * .14) * (1 - leaf * .06);
          drawLeaf(x, y, direction < 0 ? Math.PI + .18 : -.18, size, leaf % 2 ? '#89a96e' : '#6f9867');
          drawLeaf(x, y + 2, direction < 0 ? -.52 : Math.PI + .52, size * .82, leaf % 2 ? '#739663' : '#9bb67d');
        }
        context.restore();
      }

      function drawRoundedBook(x, y, bookWidth, bookHeight, color) {
        const radius = Math.min(6, bookHeight * .3);
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + bookWidth - radius, y);
        context.quadraticCurveTo(x + bookWidth, y, x + bookWidth, y + radius);
        context.lineTo(x + bookWidth, y + bookHeight - radius);
        context.quadraticCurveTo(x + bookWidth, y + bookHeight, x + bookWidth - radius, y + bookHeight);
        context.lineTo(x + radius, y + bookHeight);
        context.quadraticCurveTo(x, y + bookHeight, x, y + bookHeight - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.fill();
      }

      drawPlant(centerX - bookWidth * .44, -1);
      drawPlant(centerX + bookWidth * .44, 1);

      bookColors.forEach((color, index) => {
        const layerWidth = bookWidth * widths[index];
        const offset = index % 2 ? bookWidth * .025 : -bookWidth * .025;
        const x = centerX - layerWidth * .5 + offset;
        const y = bottom - layerHeight * (index + 1);
        context.save();
        context.shadowColor = 'rgba(20,20,19,.14)';
        context.shadowBlur = 7;
        context.shadowOffsetY = 3;
        drawRoundedBook(x, y, layerWidth, layerHeight - 2, color);
        context.shadowColor = 'transparent';
        context.fillStyle = '#fff8e9';
        context.fillRect(x + 7, y + layerHeight * .43, layerWidth - 14, layerHeight * .28);
        context.fillStyle = color;
        context.fillRect(x + 5, y + layerHeight * .72, layerWidth - 10, layerHeight * .17);
        context.fillStyle = 'rgba(255,255,255,.55)';
        context.fillRect(x + 13, y + 3, 2, layerHeight - 8);
        context.restore();
      });
    }

    function animate(timestamp) {
      if (motionSetting.matches) {
        if (!introFinished) finishIntro();
        drawScene();
        animationFrame = 0;
        return;
      }
      if (!introFinished) {
        if (!introStartedAt) introStartedAt = timestamp;
        const elapsed = timestamp - introStartedAt;
        balls.forEach((ball, index) => {
          if (ball.introDone || (dragging && dragging.index === index)) return;
          const launchProgress = Math.max(0, Math.min(1, (elapsed - 650 - index * 150) / 760));
          ball.launchProgress = launchProgress;
          if (launchProgress < 1) {
            const easedProgress = 1 - (1 - launchProgress) * (1 - launchProgress) * (1 - launchProgress);
            const sidewaysKick = Math.sin(launchProgress * Math.PI) * (index % 2 ? 1 : -1) * Math.min(14, width * .03);
            ball.x = ball.launchX + (width * ball.startX - ball.launchX) * easedProgress + sidewaysKick;
            ball.y = ball.launchY + (height * ball.startY - ball.launchY) * easedProgress
              - Math.sin(launchProgress * Math.PI) * Math.min(115, height * .28);
          } else {
            ball.x = width * ball.startX;
            ball.y = height * ball.startY;
            ball.launchProgress = 1;
            ball.introDone = true;
          }
        });
        if (balls.every((ball) => ball.introDone)) {
          introFinished = true;
          previousFrame = timestamp;
        }
        drawScene();
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }
      const delta = Math.min((timestamp - (previousFrame || timestamp)) / 1000, .032);
      previousFrame = timestamp;
      const gravity = 34 * delta;
      balls.forEach((ball, index) => {
        if (dragging && dragging.index === index) return;
        if (pointer.active) {
          const dx = ball.x - pointer.x;
          const dy = ball.y - pointer.y;
          const distance = Math.max(45, Math.hypot(dx, dy));
          const force = Math.max(0, 1 - distance / 190) * 55 * delta;
          ball.vx += dx / distance * force;
          ball.vy += dy / distance * force;
        }
        ball.vy += gravity * .08;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= .994;
        ball.vy *= .994;
        const left = ball.radius + 3;
        const right = width - ball.radius - 3;
        const top = ball.radius + 33;
        const bottom = height - ball.radius - 24;
        if (ball.x < left || ball.x > right) { ball.x = Math.max(left, Math.min(right, ball.x)); ball.vx *= -.78; }
        if (ball.y < top || ball.y > bottom) { ball.y = Math.max(top, Math.min(bottom, ball.y)); ball.vy *= -.78; }
      });
      for (let first = 0; first < balls.length; first += 1) {
        for (let second = first + 1; second < balls.length; second += 1) {
          const a = balls[first];
          const b = balls[second];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy) || 1;
          const minimum = a.radius + b.radius + 5;
          if (distance < minimum) {
            const overlap = (minimum - distance) * .5;
            const nx = dx / distance;
            const ny = dy / distance;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            a.vx -= nx * .12;
            a.vy -= ny * .12;
            b.vx += nx * .12;
            b.vy += ny * .12;
          }
        }
      }
      drawScene();
      animationFrame = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!animationFrame && !motionSetting.matches) animationFrame = window.requestAnimationFrame(animate);
      else if (motionSetting.matches) drawScene();
    }

    function pointerPosition(event) {
      const bounds = heroCanvas.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    heroCanvas.addEventListener('pointerdown', (event) => {
      const point = pointerPosition(event);
      const hitIndex = balls.findIndex((ball) => Math.hypot(point.x - ball.x, point.y - ball.y) <= ball.radius);
      if (hitIndex < 0) return;
      selectedIndex = hitIndex;
      balls[hitIndex].introDone = true;
      dragging = { index: hitIndex, startX: point.x, startY: point.y, moved: false };
      heroCanvas.setPointerCapture(event.pointerId);
      drawScene();
    });

    heroCanvas.addEventListener('pointermove', (event) => {
      const point = pointerPosition(event);
      pointer = { ...point, active: true };
      if (!dragging) return;
      const ball = balls[dragging.index];
      if (Math.hypot(point.x - dragging.startX, point.y - dragging.startY) > 5) dragging.moved = true;
      ball.x = Math.max(ball.radius, Math.min(width - ball.radius, point.x));
      ball.y = Math.max(ball.radius + 30, Math.min(height - ball.radius - 20, point.y));
      ball.vx = 0;
      ball.vy = 0;
      drawScene();
    });

    heroCanvas.addEventListener('pointerup', (event) => {
      if (!dragging) return;
      const { index, moved } = dragging;
      dragging = null;
      if (!moved) window.location.href = balls[index].href;
      else startAnimation();
      if (heroCanvas.hasPointerCapture(event.pointerId)) heroCanvas.releasePointerCapture(event.pointerId);
    });

    heroCanvas.addEventListener('pointercancel', () => { dragging = null; startAnimation(); });
    heroCanvas.addEventListener('pointerleave', () => { pointer.active = false; });
    heroCanvas.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') selectedIndex = (selectedIndex + 1) % balls.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') selectedIndex = (selectedIndex - 1 + balls.length) % balls.length;
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.location.href = balls[selectedIndex].href;
        return;
      } else return;
      event.preventDefault();
      drawScene();
    });
    heroCanvas.addEventListener('focus', () => {
      if (selectedIndex < 0) selectedIndex = 0;
      drawScene();
    });
    heroCanvas.addEventListener('blur', () => { selectedIndex = -1; drawScene(); });
    motionSetting.addEventListener('change', () => {
      if (motionSetting.matches && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        if (!introFinished) finishIntro();
        drawScene();
      } else startAnimation();
    });

    if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(heroCanvas);
    else window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    startAnimation();
  }
}
