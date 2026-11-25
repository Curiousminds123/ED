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
      window.setTimeout(typeNextCharacter, character.textContent === '.' ? 145 : 42);
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
    let bookOpen = motionSetting.matches ? 1 : 0;

    function finishIntro() {
      bookOpen = 1;
      balls.forEach((ball) => {
        ball.x = width * ball.startX;
        ball.y = height * ball.startY;
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
          ball.y = height * .7;
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

      drawBook();

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

    function drawBook() {
      const centerX = width * .5;
      const bottom = height * .78;
      const bookWidth = Math.min(width * .72, 340);
      const pageHeight = Math.min(height * .22, 98);
      const closedAmount = 1 - bookOpen;

      if (closedAmount > 0) {
        context.save();
        context.globalAlpha = closedAmount;
        context.translate(centerX, bottom - 6);
        context.rotate(-.035);
        context.fillStyle = '#29453c';
        context.beginPath();
        context.moveTo(-bookWidth * .48, -pageHeight * .42);
        context.quadraticCurveTo(-bookWidth * .5, -pageHeight * .48, -bookWidth * .46, -pageHeight * .5);
        context.lineTo(bookWidth * .46, -pageHeight * .5);
        context.quadraticCurveTo(bookWidth * .5, -pageHeight * .48, bookWidth * .48, -pageHeight * .42);
        context.lineTo(bookWidth * .45, 0);
        context.lineTo(-bookWidth * .45, 0);
        context.closePath();
        context.fill();
        context.fillStyle = '#fffdf6';
        context.fillRect(-bookWidth * .43, -pageHeight * .38, bookWidth * .86, pageHeight * .27);
        context.fillStyle = '#d7bc7e';
        context.fillRect(-bookWidth * .48, -pageHeight * .42, bookWidth * .96, 3);
        context.restore();
      }

      if (bookOpen <= 0) return;

      context.save();
      context.globalAlpha = bookOpen;
      const spread = bookWidth * .5 * bookOpen;
      const top = bottom - pageHeight * (.35 + .65 * bookOpen);
      const pageBase = bottom - 10;

      context.shadowColor = 'rgba(20,20,19,.2)';
      context.shadowBlur = 12;
      context.shadowOffsetY = 5;
      context.fillStyle = '#29453c';
      context.beginPath();
      context.moveTo(centerX, pageBase + 5);
      context.quadraticCurveTo(centerX - spread * .68, pageBase + 2, centerX - spread - 5, top + pageHeight * .15);
      context.lineTo(centerX - spread - 4, top - 4);
      context.quadraticCurveTo(centerX - spread * .45, top - pageHeight * .12, centerX, top + pageHeight * .05);
      context.quadraticCurveTo(centerX + spread * .45, top - pageHeight * .12, centerX + spread + 4, top - 4);
      context.lineTo(centerX + spread + 5, top + pageHeight * .15);
      context.quadraticCurveTo(centerX + spread * .68, pageBase + 2, centerX, pageBase + 5);
      context.closePath();
      context.fill();
      context.shadowColor = 'transparent';

      context.fillStyle = '#fffdf7';
      context.strokeStyle = '#d9d4c8';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(centerX, pageBase);
      context.quadraticCurveTo(centerX - spread * .48, pageBase - 10, centerX - spread, top + pageHeight * .15);
      context.quadraticCurveTo(centerX - spread * .55, top - pageHeight * .08, centerX, top + pageHeight * .06);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(centerX, pageBase);
      context.quadraticCurveTo(centerX + spread * .48, pageBase - 10, centerX + spread, top + pageHeight * .15);
      context.quadraticCurveTo(centerX + spread * .55, top - pageHeight * .08, centerX, top + pageHeight * .06);
      context.closePath();
      context.fill();
      context.stroke();

      context.strokeStyle = 'rgba(80,69,55,.16)';
      context.lineWidth = 1;
      for (let line = 0; line < 3; line += 1) {
        const lineY = top + pageHeight * (.3 + line * .15);
        context.beginPath();
        context.moveTo(centerX - spread * .83, lineY);
        context.quadraticCurveTo(centerX - spread * .48, lineY + 2, centerX - 7, lineY + 4);
        context.stroke();
        context.beginPath();
        context.moveTo(centerX + 7, lineY + 4);
        context.quadraticCurveTo(centerX + spread * .48, lineY + 2, centerX + spread * .83, lineY);
        context.stroke();
      }

      context.strokeStyle = '#29453c';
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(centerX, top + pageHeight * .08);
      context.lineTo(centerX, pageBase + 3);
      context.stroke();
      context.restore();
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
        const openProgress = Math.min(1, elapsed / 620);
        bookOpen = openProgress * openProgress * (3 - 2 * openProgress);
        balls.forEach((ball, index) => {
          if (ball.introDone || (dragging && dragging.index === index)) return;
          const launchProgress = Math.max(0, Math.min(1, (elapsed - 430 - index * 125) / 720));
          if (launchProgress < 1) {
            const easedProgress = 1 - (1 - launchProgress) * (1 - launchProgress);
            ball.x = ball.launchX + (width * ball.startX - ball.launchX) * easedProgress;
            ball.y = ball.launchY + (height * ball.startY - ball.launchY) * easedProgress
              - Math.sin(launchProgress * Math.PI) * Math.min(100, height * .24);
          } else {
            ball.x = width * ball.startX;
            ball.y = height * ball.startY;
            ball.introDone = true;
          }
        });
        if (balls.every((ball) => ball.introDone)) {
          bookOpen = 1;
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

const speechButton = document.querySelector('#speech-toggle');
const soundPlayer = document.querySelector('.sound-player');
const soundStatus = document.querySelector('#sound-status');

if (speechButton && soundPlayer && soundStatus) {
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    speechButton.disabled = true;
    speechButton.setAttribute('aria-label', 'El audio no está disponible en este navegador');
    soundStatus.textContent = 'AUDIO NO DISPONIBLE';
  } else {
    let audioContext = null;
    let isPlaying = false;
    const notes = [392, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 392];
    const noteDuration = .48;

    function updateAudioControl(playing, status) {
      isPlaying = playing;
      speechButton.setAttribute('aria-pressed', String(playing));
      speechButton.setAttribute('aria-label', playing ? 'Pausar el interludio' : 'Reproducir el interludio');
      speechButton.querySelector('.sound-icon').textContent = playing ? 'Ⅱ' : '▶';
      soundPlayer.classList.toggle('is-playing', playing);
      soundStatus.textContent = status;
    }

    function playMelody() {
      const startAt = audioContext.currentTime + .04;
      notes.forEach((frequency, index) => {
        const start = startAt + index * noteDuration;
        const oscillator = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        envelope.gain.setValueAtTime(.0001, start);
        envelope.gain.exponentialRampToValueAtTime(.075, start + .035);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + noteDuration * .9);
        oscillator.connect(envelope);
        envelope.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + noteDuration);
        if (index === notes.length - 1) {
          oscillator.addEventListener('ended', () => {
            if (isPlaying) {
              updateAudioControl(false, 'PISTA LOCAL · 00:04');
              audioContext.suspend();
            }
          }, { once: true });
        }
      });
    }

    speechButton.addEventListener('click', async () => {
      try {
        if (!audioContext) audioContext = new AudioContextConstructor();
        if (isPlaying) {
          await audioContext.suspend();
          updateAudioControl(false, 'EN PAUSA');
          return;
        }
        await audioContext.resume();
        if (soundStatus.textContent !== 'EN PAUSA') playMelody();
        updateAudioControl(true, 'REPRODUCIENDO · 00:04');
      } catch (error) {
        updateAudioControl(false, 'NO SE PUDO REPRODUCIR');
        console.error('Error al reproducir el interludio:', error);
      }
    });

    window.addEventListener('pagehide', () => {
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    }, { once: true });
  }
}
