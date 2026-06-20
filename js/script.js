// State Management
const state = {
  audioContext: null,
  masterGain: null,
  isMuted: false,
  isBlown: false,
  melodyTimeout: null,
  activeOscillators: [],
};

// Canvas Settings
const canvas = document.getElementById('celebration-canvas');
const ctx = canvas.getContext('2d');
let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

// Particles & Fireworks arrays
let backgroundItems = []; // Ambient floating cakes and chocolates

// Preload background images
const bgCakeImg = new Image();
bgCakeImg.src = 'images/bg_cake.png';
const bgChocImg = new Image();
bgChocImg.src = 'images/bg_chocolate.png';

// Particles & Fireworks arrays
let particles = [];
let homingSparks = [];
let confetti = [];
let rockets = [];
let wishTexts = [];
let animationFrameId = null;

// 10-language birthday wishes pool
const BIRTHDAY_WISHES = [
  { text: 'Happy Birthday! 🎂', lang: 'English' },
  { text: 'Joyeux Anniversaire! 🎉', lang: 'French' },
  { text: 'Feliz Cumpleaños! 🎊', lang: 'Spanish' },
  { text: 'Alles Gute zum Geburtstag! 🎈', lang: 'German' },
  { text: 'お誕生日おめでとう! 🌸', lang: 'Japanese' },
  { text: 'जन्मदिन मुबारक हो! ✨', lang: 'Hindi' },
  { text: 'عيد ميلاد سعيد! 🌟', lang: 'Arabic' },
  { text: 'С Днём Рождения! 🎁', lang: 'Russian' },
  { text: '생일 축하해요! 🎶', lang: 'Korean' },
  { text: 'Buon Compleanno! 🍰', lang: 'Italian' },
];

// Track active timeouts to clear them on reset
let activeTimeouts = [];

// Audio Note Frequencies for Music Box
const NOTES = {
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
  'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

// Melody: [NoteName, Duration in beats]
const MELODY = [
  ['G4', 0.75], ['G4', 0.25], ['A4', 1.0], ['G4', 1.0], ['C5', 1.0], ['B4', 2.0],
  ['G4', 0.75], ['G4', 0.25], ['A4', 1.0], ['G4', 1.0], ['D5', 1.0], ['C5', 2.0],
  ['G4', 0.75], ['G4', 0.25], ['G5', 1.0], ['E5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 2.0],
  ['F5', 0.75], ['F5', 0.25], ['E5', 1.0], ['C5', 1.0], ['D5', 1.0], ['C5', 2.0]
];

// Resize Handler
window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// Initialize Audio Context on user tap
function initAudio() {
  if (state.audioContext) return;
  
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  state.audioContext = new AudioContextClass();
  state.masterGain = state.audioContext.createGain();
  state.masterGain.gain.value = state.isMuted ? 0 : 0.5;
  state.masterGain.connect(state.audioContext.destination);
}

// Toggle Sound Setting
const soundToggle = document.getElementById('sound-toggle');
soundToggle.addEventListener('click', () => {
  state.isMuted = !state.isMuted;
  
  if (state.isMuted) {
    soundToggle.classList.add('muted');
    soundToggle.querySelector('.icon').innerText = '🔇';
    soundToggle.querySelector('.text').innerText = 'Music Off';
    if (state.masterGain) {
      state.masterGain.gain.setValueAtTime(0, state.audioContext.currentTime);
    }
  } else {
    soundToggle.classList.remove('muted');
    soundToggle.querySelector('.icon').innerText = '🔊';
    soundToggle.querySelector('.text').innerText = 'Music On';
    
    // Resume audio context if suspended
    if (state.audioContext && state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
    
    // Create audio context if it doesn't exist
    initAudio();
    
    if (state.masterGain) {
      state.masterGain.gain.setValueAtTime(0.5, state.audioContext.currentTime);
    }
  }
});

/* ====================
   SYNTHESIZER SOUND GENERATORS
   ==================== */

// Synthesize Candle Blow sound (filtered noise puff)
function playBlowSound() {
  if (!state.audioContext || state.isMuted) return;
  
  const bufferSize = state.audioContext.sampleRate * 0.4;
  const buffer = state.audioContext.createBuffer(1, bufferSize, state.audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = state.audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  
  const filter = state.audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, state.audioContext.currentTime);
  filter.frequency.exponentialRampToValueAtTime(10, state.audioContext.currentTime + 0.4);
  
  const gainNode = state.audioContext.createGain();
  gainNode.gain.setValueAtTime(1, state.audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, state.audioContext.currentTime + 0.4);
  
  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(state.masterGain);
  
  noiseSource.start();
}

// Synthesize Firework Launch sound (whoosh)
function playLaunchSound() {
  if (!state.audioContext || state.isMuted) return;
  
  const now = state.audioContext.currentTime;
  const osc = state.audioContext.createOscillator();
  const gainNode = state.audioContext.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(60, now);
  osc.frequency.exponentialRampToValueAtTime(750, now + 0.55);
  
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(0.12, now + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  
  osc.connect(gainNode);
  gainNode.connect(state.masterGain);
  
  osc.start(now);
  osc.stop(now + 0.6);
}

// Synthesize Firework Explosion sound (deep boom + crackles)
function playExplosionSound() {
  if (!state.audioContext || state.isMuted) return;
  
  const now = state.audioContext.currentTime;
  
  // Deep sub-bass boom
  const osc = state.audioContext.createOscillator();
  const gainNode = state.audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
  
  gainNode.gain.setValueAtTime(0.7, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  
  osc.connect(gainNode);
  gainNode.connect(state.masterGain);
  
  osc.start(now);
  osc.stop(now + 0.55);
  
  // Followed closely by crackling sparks sound
  setTimeout(() => {
    if (state.isBlown) {
      playCrackleSound();
    }
  }, 120);
}

// Synthesize Firecracker sound (rapid crackles)
function playCrackleSound(delay = 0) {
  if (!state.audioContext || state.isMuted) return;
  
  const now = state.audioContext.currentTime + delay;
  const numCrackles = 6 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < numCrackles; i++) {
    const popTime = now + i * 0.07 + Math.random() * 0.04;
    
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, popTime);
    osc.frequency.exponentialRampToValueAtTime(100, popTime + 0.04);
    
    gain.gain.setValueAtTime(0.2, popTime);
    gain.gain.exponentialRampToValueAtTime(0.01, popTime + 0.04);
    
    osc.connect(gain);
    gain.connect(state.masterGain);
    
    osc.start(popTime);
    osc.stop(popTime + 0.05);
  }
}

// Synthesize a Music Box note
function playMusicBoxNote(freq, time, duration) {
  if (!state.audioContext || state.isMuted) return;

  const osc1 = state.audioContext.createOscillator();
  const osc2 = state.audioContext.createOscillator();
  const gainNode = state.audioContext.createGain();
  
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, time);
  
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, time);
  
  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.linearRampToValueAtTime(0.35, time + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.07, time + 0.35);
  gainNode.gain.linearRampToValueAtTime(0, time + duration);
  
  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(state.masterGain);
  
  osc1.start(time);
  osc2.start(time);
  
  osc1.stop(time + duration);
  osc2.stop(time + duration);
  
  state.activeOscillators.push(osc1, osc2);
}

// Play synthesized Happy Birthday melody
function playMelody() {
  if (!state.audioContext || state.isMuted) return;
  
  let time = state.audioContext.currentTime + 0.2;
  const tempo = 135;
  const beatDuration = 60 / tempo;
  
  MELODY.forEach(([noteName, duration]) => {
    const freq = NOTES[noteName];
    const durationSeconds = duration * beatDuration;
    
    playMusicBoxNote(freq, time, durationSeconds + 0.4);
    time += durationSeconds;
  });
  
  const totalDuration = MELODY.reduce((acc, curr) => acc + curr[1] * beatDuration, 0) + 1.0;
  state.melodyTimeout = setTimeout(() => {
    if (state.isBlown && !state.isMuted) {
      playMelody();
    }
  }, totalDuration * 1000);
}

// Stop all synthesized sounds
function stopMusic() {
  clearTimeout(state.melodyTimeout);
  state.activeOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  state.activeOscillators = [];
}

// Synthesize miniature crackle sound for secondary particle bursts
function playMiniCrackle() {
  if (!state.audioContext || state.isMuted) return;
  const now = state.audioContext.currentTime;
  
  const osc = state.audioContext.createOscillator();
  const gainNode = state.audioContext.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(2000, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);
  
  gainNode.gain.setValueAtTime(0.04, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
  
  osc.connect(gainNode);
  gainNode.connect(state.masterGain);
  
  osc.start(now);
  osc.stop(now + 0.03);
}

/* ====================
   FIREWORKS & PARTICLE CLASSES
   ==================== */

// Upgraded Particle class supporting trails & child explosions
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 1.5;
    
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = 0.08;
    this.friction = 0.96;
    this.alpha = 1.0;
    this.fade = Math.random() * 0.015 + 0.008;
    this.size = Math.random() * 3 + 1.5;
    this.twinkle = false;
    
    // Upgrades: history for flares, child explosions for secondary crackles
    this.history = [];
    this.useTrail = false;
    this.childExplosion = false;
    this.hasExploded = false;
  }
  
  update() {
    if (this.useTrail) {
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > 5) {
        this.history.shift();
      }
    }
    
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.fade;
    
    // Secondary child explosion upon fading
    if (this.childExplosion && !this.hasExploded && this.alpha < 0.35) {
      this.hasExploded = true;
      const numGoldSparks = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numGoldSparks; i++) {
        const gp = new Particle(this.x, this.y, '#ffd700'); // gold sparks
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.2 + 0.8;
        gp.vx = Math.cos(angle) * speed;
        gp.vy = Math.sin(angle) * speed;
        gp.size = Math.random() * 1.5 + 0.8;
        gp.fade = Math.random() * 0.045 + 0.025; // fade quickly
        particles.push(gp);
      }
      
      // Play a mini crackling sound
      if (Math.random() < 0.25) {
        playMiniCrackle();
      }
    }
  }
  
  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    
    let currentAlpha = this.alpha;
    if (this.twinkle && Math.random() < 0.35) {
      currentAlpha = Math.max(0.08, this.alpha * 0.25);
    }
    
    ctx.globalAlpha = currentAlpha;
    
    if (this.useTrail && this.history.length >= 2) {
      // Draw a wider outer faint trail (glow)
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.lineWidth = this.size * 2.8;
      ctx.lineCap = 'round';
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = currentAlpha * 0.25;
      ctx.stroke();

      // Draw the bright inner core trail
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.lineWidth = this.size * 1.2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = currentAlpha;
      ctx.stroke();
    } else {
      // Draw outer larger semi-transparent glow circle
      ctx.fillStyle = this.color;
      ctx.globalAlpha = currentAlpha * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw inner solid spark core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = currentAlpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Spark traveling from corner to target title
class HomingSpark {
  constructor(startX, startY, targetX, targetY, delay, color) {
    this.startX = startX;
    this.startY = startY;
    this.x = startX;
    this.y = startY;
    this.targetX = targetX + (Math.random() * 140 - 70);
    this.targetY = targetY + (Math.random() * 40 - 20);
    this.color = color;
    this.delay = delay;
    
    this.progress = 0;
    this.duration = Math.random() * 35 + 50; // frames
    this.offset = Math.random() * Math.PI * 2;
    this.frequency = Math.random() * 2.5 + 2;
    this.amplitude = Math.random() * 30 + 15;
    this.history = [];
    this.size = Math.random() * 2.5 + 2.5;
  }
  
  update() {
    if (this.delay > 0) {
      this.delay--;
      return false;
    }
    
    this.progress += 1 / this.duration;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      return true;
    }
    
    const t = this.progress;
    const easeT = t * t * (3 - 2 * t);
    
    const targetX = this.startX + (this.targetX - this.startX) * easeT;
    const targetY = this.startY + (this.targetY - this.startY) * easeT;
    
    const wave = Math.sin(t * Math.PI * this.frequency + this.offset) * this.amplitude * (1 - t);
    
    const dx = this.targetX - this.startX;
    const dy = this.targetY - this.startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;
    
    this.x = targetX + nx * wave;
    this.y = targetY + ny * wave;
    
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > 12) {
      this.history.shift();
    }
    return false;
  }
  
  draw() {
    if (this.delay > 0 || this.history.length < 2) return;
    
    ctx.save();
    // Glow trail
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    ctx.lineWidth = this.size * 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    
    // Core trail
    ctx.lineWidth = this.size;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    ctx.restore();
  }
}

// Falling celebration confetti
class Confetti {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * -100 - 20;
    
    const colors = [
      '#ff4766', '#ff8fa3', '#ffd700', '#00f2fe', '#8b5cf6', 
      '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ffffff'
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    this.sizeWidth = Math.random() * 8 + 5;
    this.sizeHeight = Math.random() * 11 + 7;
    this.vy = Math.random() * 2 + 1.2;
    this.vx = Math.random() * 1.6 - 0.8;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.04 - 0.02;
    this.oscillationSpeed = Math.random() * 0.025 + 0.01;
    this.oscillationDistance = Math.random() * 25 + 8;
    this.counter = Math.random() * 100;
  }
  
  update() {
    this.counter += this.oscillationSpeed;
    this.y += this.vy;
    this.x += this.vx + Math.sin(this.counter) * 0.4;
    this.rotation += this.rotationSpeed;
  }
  
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.sizeWidth / 2, -this.sizeHeight / 2, this.sizeWidth, this.sizeHeight);
    ctx.restore();
  }
}

/* ====================
   WISH TEXT CLASS — LANE-BASED, NON-COLLIDING, BEHIND CRACKERS
   ==================== */

// Each wish lives in its own vertical lane — screen is divided into BIRTHDAY_WISHES.length equal strips
const WISH_LANES = 10;   // matches BIRTHDAY_WISHES.length

// Polyfill for rounded rectangle in older browsers
function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 4-pointed star drawing helper for sparkles (optimized: no expensive shadowBlur)
function drawStarSparkle(ctx, cx, cy, spikes, outerRadius, innerRadius, color, alpha, angle) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / spikes;

  ctx.moveTo(0, -outerRadius);
  for (let i = 0; i < spikes; i++) {
    let x = Math.cos(rot) * outerRadius;
    let y = Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = Math.cos(rot) * innerRadius;
    y = Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(0, -outerRadius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

class WishText {
  /**
   * @param {object} wishData  - { text, lang }
   * @param {number} laneIndex - 0..9, determines horizontal position
   * @param {number} colorIdx  - index into colorSets
   * @param {number} vertStart - fraction of height where it spawns (0=top, 1=bottom)
   */
  constructor(wishData, laneIndex, colorIdx, vertStart) {
    const laneCount = WISH_LANES;
    const laneWidth = width / laneCount;

    // Store lane index so the recycler can identify this wish's lane
    this._lane = laneIndex;

    // Center of this lane horizontal position
    this.laneX = laneWidth * laneIndex + laneWidth / 2;
    this.x = this.laneX + (Math.random() - 0.5) * laneWidth * 0.15;

    // Vertical start below visible screen
    this.y = height * (vertStart !== undefined ? vertStart : (0.85 + Math.random() * 0.25));

    this.text = wishData.text;
    this.lang = wishData.lang;

    // Color palette — one distinct pair per lane
    const colorSets = [
      ['#ffd700', '#ff8fa3'],   // 0 gold→rose
      ['#00f2fe', '#8b5cf6'],   // 1 cyan→purple
      ['#ff4766', '#ffd700'],   // 2 red→gold
      ['#10b981', '#00f2fe'],   // 3 teal→cyan
      ['#ff8fa3', '#ff4766'],   // 4 rose→red
      ['#8b5cf6', '#10b981'],   // 5 purple→teal
      ['#ffd700', '#8b5cf6'],   // 6 gold→purple
      ['#00f2fe', '#ff4766'],   // 7 cyan→red
      ['#f59e0b', '#10b981'],   // 8 amber→teal
      ['#ec4899', '#ffd700'],   // 9 pink→gold
    ];
    const cs = colorSets[colorIdx % colorSets.length];
    this.colorFrom = cs[0];
    this.colorTo   = cs[1];

    this.fontSize = 20 + Math.random() * 5;  // 20–25px
    this.labelFontSize = 10;

    // Measure the text width dynamically to determine card dimensions
    ctx.save();
    ctx.font = `500 ${this.fontSize}px 'Dancing Script', 'Outfit', 'Noto Sans', sans-serif`;
    const metrics = ctx.measureText(this.text);
    this.width = metrics.width + 42; // pad horizontally
    this.height = this.fontSize + 30; // height of capsule
    ctx.restore();

    // Upward float speed — steady
    this.baseVy = -(0.55 + Math.random() * 0.25);
    this.vy = this.baseVy;
    this.vx = 0;

    // Gentle sinusoidal sway WITHIN the lane
    this.swayCounter  = Math.random() * Math.PI * 2;
    this.swaySpeed    = 0.007 + Math.random() * 0.005;
    this.swayAmp      = 5 + Math.random() * 5; // gentle horizontal sway

    // Scale-in pop animation
    this.scale     = 0.15;
    this.targetScale = 1.0;
    this.scaleSpeed  = 0.06;

    // Opacity lifecycle
    this.alpha     = 0;
    this.peakAlpha = 0.72 + Math.random() * 0.16;
    this.fadeSpeed = 0.015;
    this.fadeIn    = true;
    this.fadeOut   = false;

    // Local sparkles array
    this.sparkles = [];
    this.dead = false;
  }

  update(allWishes) {
    // Scale-in pop
    if (this.scale < this.targetScale) {
      this.scale = Math.min(this.targetScale, this.scale + this.scaleSpeed);
    }

    // Opacity: fade in, hold, fade out near top
    if (this.fadeIn) {
      this.alpha = Math.min(this.peakAlpha, this.alpha + this.fadeSpeed);
      if (this.alpha >= this.peakAlpha) this.fadeIn = false;
    }
    if (!this.fadeIn && this.y < height * 0.26) this.fadeOut = true;
    if (this.fadeOut) {
      this.alpha -= this.fadeSpeed * 0.85;
      if (this.alpha <= 0) { this.dead = true; return; }
    }

    // Gentle sway calculation
    this.swayCounter += this.swaySpeed;
    const sway = Math.sin(this.swayCounter) * this.swayAmp;
    const targetX = this.laneX + sway;

    // Bubble-like collision avoidance (repulsion forces)
    let ax = 0;
    let ay = 0;

    if (!this.dead && this.alpha > 0.1) {
      for (let other of allWishes) {
        if (other === this || other.dead || other.alpha <= 0.1) continue;

        const dx = this.x - other.x;
        const dy = this.y - other.y;
        
        const minX = (this.width + other.width) / 2 + 18; // spacing buffer X
        const minY = (this.height + other.height) / 2 + 12; // spacing buffer Y

        if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
          // Repulsion force vector
          const overlapX = minX - Math.abs(dx);
          const overlapY = minY - Math.abs(dy);
          
          // Push horizontally (primary direction of separation)
          const dirX = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(dx);
          ax += dirX * overlapX * 0.006; // gentle acceleration push

          // Push vertically slightly to adjust speed
          const dirY = dy === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(dy);
          ay += dirY * overlapY * 0.004;
        }
      }
    }

    // Apply sway target pull force
    const swayForceX = (targetX - this.x) * 0.008;
    this.vx += ax + swayForceX;
    this.vy += ay;

    // Apply friction/damping
    this.vx *= 0.94;
    
    // Gently ease vertical speed back to base float speed
    this.vy = this.vy * 0.96 + this.baseVy * 0.04;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Keep within screen bounds
    const halfWidth = this.width / 2;
    if (this.x - halfWidth < 12) {
      this.x = 12 + halfWidth;
      this.vx = 0;
    }
    if (this.x + halfWidth > width - 12) {
      this.x = width - 12 - halfWidth;
      this.vx = 0;
    }

    // Spawn sparkles
    if (Math.random() < 0.22 && this.alpha > 0.15 && !this.fadeOut) {
      this.sparkles.push({
        x: (Math.random() - 0.5) * this.width * 0.8,
        y: (Math.random() - 0.5) * this.height * 0.8,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 0.5 - 0.35, // float upward relative to badge
        size: Math.random() * 5 + 4, // outer radius
        alpha: 1.0,
        fade: Math.random() * 0.02 + 0.015,
        color: Math.random() < 0.5 ? this.colorFrom : this.colorTo,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08
      });
    }

    // Update sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= s.fade;
      s.angle += s.spin;
      if (s.alpha <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  draw() {
    if (this.alpha <= 0 || this.dead) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.alpha;

    // 1. Draw sparkles first (behind the badge for depth)
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      // A 4-pointed star spikes = 4, inner radius = outer / 3.2
      drawStarSparkle(ctx, s.x, s.y, 4, s.size, s.size / 3.2, s.color, s.alpha, s.angle);
    }

    // 2. Draw cute pill badge
    const w = this.width;
    const h = this.height;
    const rx = -w / 2;
    const ry = -h / 2;
    const radius = 18;

    drawRoundRect(ctx, rx, ry, w, h, radius);
    
    // Glassmorphic dark pastel background fill
    const bgGrad = ctx.createLinearGradient(rx, ry, rx, ry + h);
    bgGrad.addColorStop(0, 'rgba(15, 12, 30, 0.72)');
    bgGrad.addColorStop(1, 'rgba(8, 6, 18, 0.88)');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Double-gradient glow border
    const borderGrad = ctx.createLinearGradient(rx, ry, rx + w, ry + h);
    borderGrad.addColorStop(0, this.colorFrom);
    borderGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.35)');
    borderGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
    borderGrad.addColorStop(1, this.colorTo);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 3. Draw text and labels
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Glow halo + Light Text Gradient pass (single optimized draw)
    ctx.shadowColor = this.colorFrom;
    ctx.shadowBlur  = 5; // soft glowing theme outline
    ctx.font        = `500 ${this.fontSize}px 'Dancing Script', 'Outfit', 'Noto Sans', sans-serif`;

    const textGrad = ctx.createLinearGradient(-w / 3, 0, w / 3, 0);
    textGrad.addColorStop(0,   '#f8fafc'); // light pastel slate
    textGrad.addColorStop(0.5, '#ffffff'); // bright clean white
    textGrad.addColorStop(1,   '#f1f5f9'); // light slate
    
    ctx.fillStyle  = textGrad;
    ctx.fillText(this.text, 0, -5);
    ctx.shadowBlur = 0; // reset shadow immediately

    // Language sub-label (optimized: no shadow blur)
    ctx.globalAlpha = this.alpha * 0.65;
    ctx.font        = `600 ${this.labelFontSize}px 'Outfit', sans-serif`;
    ctx.fillStyle   = this.colorTo;
    ctx.fillText(this.lang, 0, this.fontSize / 2 + 3);

    ctx.restore();
  }
}
// Ambient Background cake and chocolate floating item
class BackgroundFloatingItem {
  constructor(yOffset = 0) {
    this.x = Math.random() * width;
    this.y = height + Math.random() * 120 + yOffset;
    this.isCake = Math.random() < 0.5;
    this.img = this.isCake ? bgCakeImg : bgChocImg;
    this.size = Math.random() * 30 + 35; // 35px to 65px (larger image sizes)
    this.speed = Math.random() * 0.6 + 0.3; // slow floating upward
    this.alpha = Math.random() * 0.22 + 0.08; // semi-transparent background blend
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.015 - 0.0075;
    this.oscillationSpeed = Math.random() * 0.015 + 0.005;
    this.counter = Math.random() * 100;
  }
  
  update() {
    this.counter += this.oscillationSpeed;
    this.y -= this.speed;
    this.x += Math.sin(this.counter) * 0.15;
    this.rotation += this.rotationSpeed;
    
    // Reset if it floats off-screen top
    if (this.y < -this.size * 1.5) {
      this.y = height + this.size * 1.5;
      this.x = Math.random() * width;
      this.alpha = Math.random() * 0.22 + 0.08;
      this.isCake = Math.random() < 0.5;
      this.img = this.isCake ? bgCakeImg : bgChocImg;
    }
  }
  
  draw() {
    if (!this.img.complete || this.img.naturalWidth === 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

// Rising Firework Rocket
class Rocket {
  constructor(startX, startY, targetX, targetY, color) {
    this.startX = startX;
    this.startY = startY;
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.color = color;
    
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Duration in animation frames
    this.duration = Math.max(35, Math.min(65, distance / 7.5));
    this.progress = 0;
    
    this.history = [];
    this.trailLength = 8;
    
    playLaunchSound();
  }
  
  update() {
    this.progress += 1 / this.duration;
    if (this.progress >= 1.0) {
      this.progress = 1.0;
      return true; // Explode!
    }
    
    // Quadratic ease-out so it slows down near peak
    const t = this.progress;
    const easeT = 1 - (1 - t) * (1 - t);
    
    this.x = this.startX + (this.targetX - this.startX) * easeT;
    this.y = this.startY + (this.targetY - this.startY) * easeT;
    
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > this.trailLength) {
      this.history.shift();
    }
    
    // Spawn trailing firework sparks
    if (Math.random() < 0.45) {
      const trailSpark = new Particle(this.x, this.y, this.color);
      trailSpark.vx = Math.random() * 1.5 - 0.75;
      trailSpark.vy = Math.random() * 1.5 + 0.8;
      trailSpark.fade = Math.random() * 0.035 + 0.025;
      trailSpark.size = Math.random() * 1.8 + 0.8;
      particles.push(trailSpark);
    }
    
    return false;
  }
  
  draw() {
    if (this.history.length < 2) return;
    
    ctx.save();
    // Glow trail
    ctx.beginPath();
    ctx.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 1; i < this.history.length; i++) {
      ctx.lineTo(this.history[i].x, this.history[i].y);
    }
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    
    // Core trail
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    ctx.restore();
  }
}

/* ====================
   CELEBRATION DYNAMICS
   ==================== */

// Create beautiful rocket explosions
function explodeRocket(x, y, color) {
  playExplosionSound();
  
  const colors = ['#ffd700', '#ff4766', '#00f2fe', '#ff8fa3', '#8b5cf6', '#10b981', '#ff5722'];
  const finalColor = color || colors[Math.floor(Math.random() * colors.length)];
  const style = Math.random();
  
  if (style < 0.35) {
    // 1. Double Ring Shell Burst with Secondary Gold Crackles
    const numRing = 48;
    const baseSpeed = Math.random() * 3.5 + 3.8;
    for (let i = 0; i < numRing; i++) {
      const angle = (i / numRing) * Math.PI * 2;
      
      // Outer ring (Color particles that split into crackles!)
      const p1 = new Particle(x, y, finalColor);
      p1.vx = Math.cos(angle) * baseSpeed;
      p1.vy = Math.sin(angle) * baseSpeed;
      p1.size = Math.random() * 2.2 + 1.8;
      p1.fade = Math.random() * 0.012 + 0.009;
      p1.gravity = 0.05;
      p1.useTrail = true;
      p1.childExplosion = (Math.random() < 0.7); // 70% chance to crackle split!
      particles.push(p1);
      
      // Inner ring (White sparks)
      const p2 = new Particle(x, y, '#ffffff');
      p2.vx = Math.cos(angle) * (baseSpeed * 0.58);
      p2.vy = Math.sin(angle) * (baseSpeed * 0.58);
      p2.size = Math.random() * 1.5 + 1.0;
      p2.fade = Math.random() * 0.015 + 0.01;
      p2.gravity = 0.05;
      particles.push(p2);
    }
  } else if (style < 0.68) {
    // 2. Shimmering Golden Willow (drooping golden flare trail)
    const numWillow = 65;
    for (let i = 0; i < numWillow; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 1.2;
      
      const p = new Particle(x, y, '#ffd700'); // gold
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.friction = 0.94; // slightly heavier air resistance
      p.gravity = 0.14; // curves downwards
      p.fade = Math.random() * 0.007 + 0.004; // floats long
      p.size = Math.random() * 2.5 + 1.0;
      p.useTrail = true; // flares!
      p.twinkle = true;
      particles.push(p);
    }
  } else {
    // 3. Twinkling Rainbow Chrysanthemum with Trail Flares
    const numChrys = 80;
    const colorsList = [finalColor, '#ffffff', '#ffd700', '#00f2fe', '#ff4766'];
    for (let i = 0; i < numChrys; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7.5 + 2.0;
      const randColor = colorsList[Math.floor(Math.random() * colorsList.length)];
      
      const p = new Particle(x, y, randColor);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = Math.random() * 2.8 + 1.0;
      p.friction = 0.95;
      p.fade = Math.random() * 0.016 + 0.009;
      p.twinkle = true;
      p.useTrail = (Math.random() < 0.4); // 40% chance of trail lines
      particles.push(p);
    }
  }
}

// Standard simple corner explosion
function triggerFirecracker(side) {
  const x = side === 'left' ? 30 : width - 30;
  const y = 30;
  const colors = ['#ffd700', '#ff4766', '#00f2fe', '#ff8fa3', '#8b5cf6'];
  
  playExplosionSound();
  
  for (let i = 0; i < 40; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const p = new Particle(x, y, color);
    p.size = Math.random() * 3 + 1.5;
    particles.push(p);
  }
}

// Auto launches fireworks during the initial show
function runInitialFireworksShow() {
  const colors = ['#ffd700', '#ff4766', '#00f2fe', '#ff8fa3', '#8b5cf6', '#10b981', '#ff5722'];
  let rocketCount = 0;
  
  const launchNextRocket = () => {
    if (!state.isBlown) return;
    
    let startX, targetX;
    if (width < 600) {
      // Center clustering for mobile screens
      startX = (width / 2) + (Math.random() * 100 - 50);
      targetX = (width / 2) + (Math.random() * 140 - 70);
    } else {
      startX = Math.random() * (width - 240) + 120;
      targetX = startX + (Math.random() * 120 - 60);
    }
    
    const startY = height + 10;
    const targetY = Math.random() * (height / 2.5) + 65;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    rockets.push(new Rocket(startX, startY, targetX, targetY, color));
    rocketCount++;
    
    // Launch up to 8 rockets over the duration
    if (rocketCount < 9 && state.isBlown) {
      const nextDelay = 350 + Math.random() * 350;
      const timeoutId = setTimeout(launchNextRocket, nextDelay);
      activeTimeouts.push(timeoutId);
    }
  };
  
  // Start first rocket immediately
  launchNextRocket();
}

// Initiate homing sparks to fly towards the Title
function launchHomingSparks() {
  const titleScreen = document.getElementById('celebration-screen');
  const anchor = document.getElementById('sparkle-anchor');
  
  // Temporarily set display to compute offset values
  titleScreen.style.display = 'flex';
  titleScreen.style.opacity = '0';
  
  const rect = anchor.getBoundingClientRect();
  const targetX = rect.left + rect.width / 2;
  const targetY = rect.top + rect.height / 2;
  
  // Hide again before transition
  titleScreen.style.display = '';
  titleScreen.style.opacity = '';
  
  const colors = ['#ffd700', '#ff4766', '#00f2fe', '#ff8fa3', '#8b5cf6'];
  
  // Launch sparks from Left Corner
  for (let i = 0; i < 18; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = i * 4;
    homingSparks.push(new HomingSpark(20, 20, targetX, targetY, delay, color));
  }
  
  // Launch sparks from Right Corner
  for (let i = 0; i < 18; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = i * 4;
    homingSparks.push(new HomingSpark(width - 20, 20, targetX, targetY, delay, color));
  }
}

// Spawn wish texts in 10 dedicated lanes — one per language, non-colliding
let wishSpawnIndex = 0;
let wishSpawnInterval = null;


function spawnWishInLane(lane) {
  const wishData = BIRTHDAY_WISHES[lane % BIRTHDAY_WISHES.length];
  const wt = new WishText(wishData, lane, lane, undefined);
  wt.y = height + 50 + Math.random() * 60; // start just below screen
  wishTexts.push(wt);
}

function startWishCycle() {
  const totalLanes = BIRTHDAY_WISHES.length; // 10

  // ── Phase 1: staggered initial reveal — one lane at a time, 700ms apart ──
  // Each wish appears at a different vertical position so the screen fills
  // gradually from bottom-right wrapping around (a wave effect).
  const initialVertPositions = [
    0.88, 0.72, 0.56, 0.40, 0.80,   // lanes 0-4
    0.64, 0.48, 0.92, 0.68, 0.52,   // lanes 5-9
  ];

  for (let lane = 0; lane < totalLanes; lane++) {
    const tid = setTimeout(() => {
      if (!state.isBlown) return;
      const wishData = BIRTHDAY_WISHES[lane];
      const wt = new WishText(wishData, lane, lane, initialVertPositions[lane]);
      wishTexts.push(wt);
    }, lane * 700);
    activeTimeouts.push(tid);
  }

  // ── Phase 2: continuous recycling — after a wish dies, its lane respawns ──
  // Poll every 400ms; if any lane has no living wish, spawn one for it.
  wishSpawnInterval = setInterval(() => {
    if (!state.isBlown) {
      clearInterval(wishSpawnInterval);
      return;
    }

    // Build a set of lanes currently alive
    const aliveLanes = new Set();
    wishTexts.forEach(wt => {
      if (!wt.dead) aliveLanes.add(wt._lane);
    });

    // Respawn dead/missing lanes one at a time per tick to avoid burst
    for (let lane = 0; lane < totalLanes; lane++) {
      if (!aliveLanes.has(lane)) {
        spawnWishInLane(lane);
        break; // one respawn per interval tick for smooth staggering
      }
    }

    // Safety cap
    if (wishTexts.length > 30) wishTexts.splice(0, wishTexts.length - 30);
  }, 400);
}

// Reveal main celebration message and cycle languages
function revealCelebration() {
  const introScreen = document.getElementById('intro-screen');
  const celebrationScreen = document.getElementById('celebration-screen');
  
  introScreen.classList.remove('active');
  celebrationScreen.classList.add('active');
  
  // Spawn continuous confetti falling
  for (let i = 0; i < 80; i++) {
    const c = new Confetti();
    c.y = Math.random() * height;
    confetti.push(c);
  }
  
  // Start multilingual wish text floating behind crackers
  startWishCycle();
  
  // Play music loop
  playMelody();
}

/* ====================
   ANIMATION LOOP
   ==================== */

function updateAndRender() {
  ctx.clearRect(0, 0, width, height);
  
  // 0. Update and draw background floating items (cakes and chocolates)
  for (let i = 0; i < backgroundItems.length; i++) {
    backgroundItems[i].update();
    backgroundItems[i].draw();
  }

  // 0.5 Draw multilingual wish texts BEHIND fireworks/crackers
  for (let i = wishTexts.length - 1; i >= 0; i--) {
    wishTexts[i].update(wishTexts);
    wishTexts[i].draw();
    if (wishTexts[i].dead) wishTexts.splice(i, 1);
  }

  // 1. Particles (Firecracker explosions)
  if (particles.length > 250) {
    particles.splice(0, particles.length - 250);
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
  
  // 2. Rockets update
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    const exploded = r.update();
    r.draw();
    if (exploded) {
      explodeRocket(r.targetX, r.targetY, r.color);
      rockets.splice(i, 1);
    }
  }
  
  // 3. Homing Sparks (Trails flowing to title)
  for (let i = homingSparks.length - 1; i >= 0; i--) {
    const hs = homingSparks[i];
    const landed = hs.update();
    hs.draw();
    
    if (landed) {
      for (let j = 0; j < 5; j++) {
        const landingSpark = new Particle(hs.targetX, hs.targetY, hs.color);
        landingSpark.size = Math.random() * 2 + 1;
        landingSpark.vy -= 1.8;
        particles.push(landingSpark);
      }
      homingSparks.splice(i, 1);
    }
  }
  
  // 4. Falling Confetti
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.update();
    c.draw();
    
    if (c.y > height + 20) {
      confetti[i] = new Confetti();
    }
  }
  
  animationFrameId = requestAnimationFrame(updateAndRender);
}

/* ====================
   MAIN PAGE TRIGGERS
   ==================== */

// Blow Candle Action
const blowBtn    = document.getElementById('blow-btn');
const allCandles = document.querySelectorAll('[data-candle]');
const introScreen = document.getElementById('intro-screen');

blowBtn.addEventListener('click', () => {
  if (state.isBlown) return;
  state.isBlown = true;

  // 1. Init audio & play blow sound
  initAudio();
  playBlowSound();

  // 2. Extinguish candles one by one with a small stagger
  allCandles.forEach((candle, idx) => {
    const tid = setTimeout(() => {
      candle.classList.add('extinguished');
    }, idx * 80);
    activeTimeouts.push(tid);
  });

  // 3. Start canvas loop
  if (!animationFrameId) updateAndRender();

  // 4. Fade out cake intro content
  introScreen.classList.add('blow-triggered');

  // 5. Trigger automated firework rocket show
  runInitialFireworksShow();

  // 6. Launch homing sparkles (at 3.8s)
  const timeoutSparks = setTimeout(() => {
    if (state.isBlown) launchHomingSparks();
  }, 3800);
  activeTimeouts.push(timeoutSparks);

  // 7. Transition to celebration screen (at 4.6s)
  const timeoutReveal = setTimeout(() => {
    if (state.isBlown) revealCelebration();
  }, 4600);
  activeTimeouts.push(timeoutReveal);
});


// Interactive firecracker burst on screen clicks/taps
window.addEventListener('click', (e) => {
  // Only trigger if the candle is blown
  if (!state.isBlown) return;
  // If clicked a button, ignore
  if (e.target.closest('button') || e.target.closest('.btn')) return;
  
  const targetX = e.clientX;
  const targetY = e.clientY;
  
  // 1. Play explosion sound
  playExplosionSound();
  
  // 2. Spawn firecracker burst particles directly at tap position
  const colors = ['#ffd700', '#ff4766', '#00f2fe', '#ff8fa3', '#8b5cf6', '#10b981', '#ff5722'];
  const finalColor = colors[Math.floor(Math.random() * colors.length)];
  
  const numParticles = 28 + Math.floor(Math.random() * 12); // 28-40 particles
  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5.5 + 1.8;
    
    const p = new Particle(targetX, targetY, finalColor);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = Math.random() * 2.6 + 1.4;
    p.fade = Math.random() * 0.024 + 0.016;
    p.useTrail = (Math.random() < 0.38); // 38% chance of trail lines
    p.childExplosion = (Math.random() < 0.5); // 50% chance of secondary crackles
    particles.push(p);
  }
});

// Replay / Reset Action
const replayBtn = document.getElementById('replay-btn');
replayBtn.addEventListener('click', () => {
  state.isBlown = false;
  stopMusic();
  
  // Clear all pending transition and rocket sequence timeouts
  activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  activeTimeouts = [];
  
  // Empty canvas arrays (except background items so they keep floating!)
  particles = [];
  homingSparks = [];
  confetti = [];
  rockets = [];
  wishTexts = [];

  if (wishSpawnInterval) {
    clearInterval(wishSpawnInterval);
    wishSpawnInterval = null;
  }
  wishSpawnIndex = 0;
  
  // Reset CSS visibility states — re-light all candles
  allCandles.forEach(c => c.classList.remove('extinguished'));

  introScreen.classList.remove('blow-triggered');
  document.getElementById('celebration-screen').classList.remove('active');
  document.getElementById('intro-screen').classList.add('active');
});

// Initialize background floating cakes and chocolates
for (let i = 0; i < 15; i++) {
  // Distribute Y values across the screen height initially
  const yOffset = -height * (i / 15);
  backgroundItems.push(new BackgroundFloatingItem(yOffset));
}

// Start the animation loop immediately to show floating items in the background
if (!animationFrameId) {
  updateAndRender();
}
