/* ============================================================
   Weihnachtszauber mit Charlotte
   Grafiken: echte Pixel-Art PNGs (assets/game/) via pixelart MCP erstellt
   ============================================================ */

/* ==================== SOUND-EFFEKT-SYSTEM (WebAudio) ====================
   Einfacher Synthesizer mit Beeps & Noise – keine Assets nötig. */
const SFX = (() => {
  function getCtx() {
    if (!window.__sfxCtx) window.__sfxCtx = new AudioContext();
    return window.__sfxCtx;
  }

  /* Kurzer Ton: sine/tri/noise-Burst */
  function tone(freq, dur, {type='beep', vol=0.25, delay=0} = {}) {
    try {
      const C = getCtx();
      const t = C.currentTime + (delay || 0);
      const node = C.createGain();

      if (type === 'noise') {
        const src = C.createBufferSource();
        const buf = C.createBuffer(1, Math.max(2, Math.floor(dur * C.sampleRate)), C.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (dur * 500));
        src.buffer = buf;
        src.connect(node);
        src.start(t);
        node.gain.setValueAtTime(0, t);
        node.gain.exponentialRampToValueAtTime(vol * 0.6, t + 0.005);
        node.gain.exponentialRampToValueAtTime(0.001, t + dur);
        node.connect(C.destination);
        src.stop(t + dur);
      } else {
        const osc = C.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(node);
        node.gain.setValueAtTime(0, t);
        node.gain.exponentialRampToValueAtTime(vol, t + 0.002);
        node.gain.exponentialRampToValueAtTime(0.001, t + dur);
        node.connect(C.destination);
        osc.start(t); osc.stop(t + dur);
      }
    } catch (e) { /* Audio deaktivieren */ }
  }

  return {
    /* magic start */
    start() {
      tone(48, 0.08, {type: 'tri', vol: 0.22});
      tone(56, 0.14, {type: 'sine', vol: 0.3});
      tone(64, 0.3, {type: 'tri', vol: 0.35, delay: 0.2});
    },
    /* boost/tap */
    boost() { tone(74, 0.04, {type: 'sine', vol: 0.3}); },
    /* whoosh speed */
    whoosh() { tone(0.3, 0.45, {type: 'noise', vol: 0.5, delay: 0.05}); },
    /* chirp for jumping */
    jump() { tone(84, 0.08, {type: 'sine', vol: 0.2}); },
    /* obstacle near */
    obstacle(type) {
      if (type === 'rock') tone(70, 0.05, {type: 'sine', vol: 0.22});
      else tone(62, 0.09, {type: 'sine', vol: 0.2});
    },
    /* stumble */
    stumble() { tone(48, 0.09, {type: 'sine', vol: 0.25}); },
    /* bonus: klassischer Münz-Doppelpiep */
    coin() {
      tone(84, 0.05, {type: 'square', vol: 0.16});
      tone(88, 0.13, {type: 'square', vol: 0.16, delay: 0.06});
    },
    /* win */
    win() {
      tone(60, 0.1, {type: 'sine', vol: 0.3});
      tone(64, 0.1, {type: 'sine', vol: 0.3, delay: 0.12});
      tone(69, 0.5, {type: 'tri', vol: 0.35, delay: 0.28});
    }
  };
})();

// Pfade zu den Pixel-Art Assets (2x exportiert, nearest-neighbor)
const ASSETS = {
  charlotte: 'assets/game/charlotte.png',
  sled: 'assets/game/sled.png',
  sledFixed: 'assets/game/sled_fixed.png',   // reparierter Rodel mit goldener Klammer
  riderSled: 'assets/game/rider_sled.png',   // Charlotte sitzend auf dem reparierten Rodel
  tree: 'assets/game/tree_pine.png',
  christmasTree: 'assets/game/christmas_tree.png',
  tent: 'assets/game/tent.png',
  toolbox: 'assets/game/toolbox.png',
  toolboxBig: 'assets/game/toolbox_big.png',
  toolboxEmpty: 'assets/game/toolbox_empty.png',
  toolboxOpen: 'assets/game/toolbox_open.png',
  hammer: 'assets/game/hammer.png',
  birdSit: 'assets/game/bird_sit.png',
  birdFly1: 'assets/game/bird_fly1.png',
  birdFly2: 'assets/game/bird_fly2.png',
  ornament: 'assets/game/ornament.png',
  ornamentGreen: 'assets/game/ornament_green.png',
  ornamentBlue: 'assets/game/ornament_blue.png',
  ornamentPurple: 'assets/game/ornament_purple.png',
  stick: 'assets/game/stick.png',
  obstacleDrift: 'assets/game/obstacle_drift.png',
  obstacleRock: 'assets/game/obstacle_rock.png'
};

// Anzeige-Daten für Inventargegenstände (Icon + Name)
const INVENTORY_ITEMS = {
  hammer: { label: 'Hammer', icon: ASSETS.hammer },
  ornament: { label: 'Kugel', icon: ASSETS.ornament },
  stick: { label: 'Stock', icon: ASSETS.stick }
};
const REPAIR_ITEMS = ['hammer', 'ornament', 'stick'];
const WELCOME_TEXT = 'Willkommen! 🎄 Hilf Charlotte, den Rodel zu reparieren.';

// Vier Kugel-Varianten für das Bonus-Level – seltene Farben geben mehr Punkte.
const BONUS_ORNAMENTS = [
  { src: ASSETS.ornament,      points: 10, name: 'Rot' },
  { src: ASSETS.ornamentGreen, points: 15, name: 'Grün' },
  { src: ASSETS.ornamentBlue,  points: 20, name: 'Blau' },
  { src: ASSETS.ornamentPurple,points: 25, name: 'Violett' }
];
const BONUS_HIGHSCORE_KEY = 'charlotte_bonus_highscore';

const GAME = {
  scene: 'outdoor',
  inventory: [],
  sledFixed: false,
  toolboxOpen: false,
  repairing: false,
  ornamentFell: false,
  stickDropped: false,
  charlotteLine: 0,

  // Rodelrennen
  raceActive: false,
  raceWon: false,
  raceHearts: 3,
  raceHits: 0,
  raceStart: 0,
  raceDuration: 10000,
  raceObstacles: [],
  raceJumping: false,
  raceJumpStartAt: 0,
  raceJumpDuration: 520,
  raceJumpHeight: 78,
  raceLoop: null,
  raceSpawnTimer: null,
  raceEnded: false,

  // Bonus-Level: Kugelregen
  bonusActive: false,
  bonusEnded: false,
  bonusScore: 0,
  bonusHighScore: 0,
  bonusCaught: 0,
  bonusMissed: 0,
  bonusDuration: 20000,
  bonusStartAt: 0,
  bonusLastTs: 0,
  bonusLoop: null,
  bonusItems: [],
  bonusSpawnAcc: 0,
  bonusPlayerX: 400,
  bonusMoveDir: 0,
  bonusPointerX: null,

  // Vogel-Zustand
  bird: null,
  birdState: 'away',      // away | flying-in | sitting | flying-out
  birdTimer: null,
  flapTimer: null,
  birdAnim: null,
  birdWillDrop: false,    // der erste Vogel bringt den Stock
  firstInteractionDone: false, // erster Klick in der Szene hat den Vogel scharf gemacht
  firstBirdDone: false,   // der erste Vogelbesuch hat stattgefunden
  birdCarryStick: false,
  birdCarryEl: null,
  birdFollowFrame: null,

  dialog: null,
  invSlots: null,
  invStatus: null,
  endScreen: null,
  restartBtn: null,
  resetBtn: null,
  fullscreenBtn: null,
  bonusBtn: null,
  bonusResult: null,
  bonusReplayBtn: null,
  bonusBackBtn: null,

  start() {
    this.dialog = document.getElementById('dialog-text');
    this.invSlots = document.getElementById('inv-slots');
    this.invStatus = document.getElementById('inv-status');
    this.endScreen = document.getElementById('end-screen');
    this.restartBtn = document.getElementById('restart-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.bonusBtn = document.getElementById('bonus-btn');
    this.bonusResult = document.getElementById('bonus-result');
    this.bonusReplayBtn = document.getElementById('bonus-replay-btn');
    this.bonusBackBtn = document.getElementById('bonus-back-btn');
    this.bonusHighScore = this.loadBonusHighScore();

    this.fitToViewport();
    window.addEventListener('resize', () => this.fitToViewport());
    window.addEventListener('orientationchange', () => setTimeout(() => this.fitToViewport(), 150));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.fitToViewport());
    }

    this.updateInventory();
    this.renderScene();
    this.setupClickHandlers();
    this.restartBtn.addEventListener('click', () => this.restart());
    this.resetBtn.addEventListener('click', () => this.restart());
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    this.bonusBtn.addEventListener('click', () => this.startBonus());
    this.bonusReplayBtn.addEventListener('click', () => this.startBonus());
    this.bonusBackBtn.addEventListener('click', () => {
      this.hideBonusResult();
      this.showEndScreen();
    });

    const fsChange = () => this.onFullscreenChange();
    document.addEventListener('fullscreenchange', fsChange);
    document.addEventListener('webkitfullscreenchange', fsChange);
    window.addEventListener('keydown', (e) => {
      const real = document.fullscreenElement || document.webkitFullscreenElement;
      if (e.key === 'Escape' && !real && this.isFullscreenActive()) this.toggleFullscreen();
    });

    // Bonus-Level: Charlotte mit Pfeiltasten oder A/D bewegen.
    window.addEventListener('keydown', (e) => {
      if (!this.bonusActive) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'arrowleft' || k === 'a') {
        this.bonusMoveDir = -1;
        this.bonusPointerX = null;
        e.preventDefault();
      } else if (k === 'arrowright' || k === 'd') {
        this.bonusMoveDir = 1;
        this.bonusPointerX = null;
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (!this.bonusActive) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') {
        this.bonusMoveDir = 0;
      }
    });

    // Tastatur für das Rodelrennen (Leertaste / Pfeil hoch)
    // Lade: Maßgebiger HOLD-Mechanismus — lange halten = hoher Sprung.
    this.raceChargeTimer = null;
    window.addEventListener('keydown', (e) => {
      const isJump = e.code === 'Space' || e.code === 'ArrowUp';
      if (!isJump) return;
      if (this.raceActive) {
        e.preventDefault();
        if (!this.raceJumping && !this.raceCharge) {
          this.raceJumpStart();
          // Charge-Timer läuft, bis wieder keyup (maximale Höhe = 1)
          if (!this.raceChargeTimer) {
            this.raceChargeTimer = setInterval(() => {
              if (!this.raceActive || this.raceEnded) { clearInterval(this.raceChargeTimer); this.raceChargeTimer = null; return; }
              if (this.raceCharge < 1) this.raceJumpCharge(420);
            }, 40);
          }
        } else if (this.raceJumping) {
          this.raceJumpBoost();
        }
      }
    });
    window.addEventListener('keyup', (e) => {
      const isJump = e.code === 'Space' || e.code === 'ArrowUp';
      if (!isJump) return;
      if (this.raceChargeTimer) { clearInterval(this.raceChargeTimer); this.raceChargeTimer = null; }
      if (this.raceActive && !this.raceEnded) this.raceJumpRelease();
    });
    this.say(WELCOME_TEXT);
  },

  renderScene() {
    const scene = document.getElementById('scene');
    this.stopBird();          // laufende Vogel-Timer/-Animationen beenden
    scene.innerHTML = '';
    scene.style.background = '';
    // Klassen für CSS-Hooks
    scene.classList.toggle('race', this.scene === 'race');
    scene.classList.toggle('bonus', this.scene === 'bonus');

    // Hintergrund (bleibt als CSS/SVG – Landschaft)
    const bg = document.createElement('div');
    bg.className = 'scene-bg';
    bg.innerHTML = this.scene === 'indoor' ? this.bgIndoor()
                  : this.scene === 'race' ? this.bgRace()
                  : this.bgOutdoor();
    scene.appendChild(bg);

    if (this.scene === 'outdoor') this.renderOutdoor(scene);
    else if (this.scene === 'indoor') this.renderIndoor(scene);
    else if (this.scene === 'race') this.renderRace(scene);
    else if (this.scene === 'bonus') this.renderBonus(scene);

    // Vignette zuletzt (über den Sprites, unter Hotspots/Dialog)
    if (this.scene !== 'race') scene.appendChild(this.vignette());
  },

  /* ---------- Hintergründe (SVG, wie zuvor) ---------- */
  bgOutdoor() {
    return `<svg width="100%" height="100%" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="skyOut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3f7fb8"/>
          <stop offset="50%" stop-color="#87c9ec"/>
          <stop offset="100%" stop-color="#e6f7fb"/>
        </linearGradient>
        <linearGradient id="snowOut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#d6ecf7"/>
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0%" stop-color="#fffce0" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#fffce0" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="starGlow">
          <stop offset="0%" stop-color="#fff8d8" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#fff8d8" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="windowGlow">
          <stop offset="0%" stop-color="#ffcf5a" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#ffcf5a" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="vignetteOut" cx="50%" cy="45%" r="78%">
          <stop offset="55%" stop-color="#0b2233" stop-opacity="0"/>
          <stop offset="100%" stop-color="#0b2233" stop-opacity="0.38"/>
        </radialGradient>
      </defs>

      <!-- Himmel & Wintersonne -->
      <rect width="800" height="312" fill="url(#skyOut)"/>
      <circle cx="690" cy="62" r="112" fill="url(#sunGlow)"/>
      <circle cx="690" cy="62" r="24" fill="#fffbe6"/>

      <!-- Drei Sterne, die sanft leuchten -->
      <g class="stars">
        <g transform="translate(96, 66)">
          <g class="star">
            <circle r="16" fill="url(#starGlow)"/>
            <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="#fff8d8"/>
          </g>
        </g>
        <g transform="translate(176, 40)">
          <g class="star">
            <circle r="12" fill="url(#starGlow)"/>
            <polygon points="0,-9 2.5,-2.5 9,0 2.5,2.5 0,9 -2.5,2.5 -9,0 -2.5,-2.5" fill="#fff8d8"/>
          </g>
        </g>
        <g transform="translate(258, 98)">
          <g class="star">
            <circle r="10" fill="url(#starGlow)"/>
            <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#fff8d8"/>
          </g>
        </g>
      </g>

      <!-- Schneebedeckte Berge im Hintergrund -->
      <path d="M0 305 L120 145 L250 305 Z" fill="#aab9c9"/>
      <polygon points="120,145 90,187 106,179 120,197 136,177 152,187" fill="#ffffff"/>
      <path d="M175 305 L325 165 L470 305 Z" fill="#b6c5d4"/>
      <polygon points="325,165 292,210 310,201 325,220 341,200 360,210" fill="#ffffff"/>
      <path d="M430 305 L585 150 L745 305 Z" fill="#aab9c9"/>
      <polygon points="585,150 552,196 570,187 585,207 603,186 621,196" fill="#ffffff"/>
      <path d="M660 305 L780 180 L800 305 Z" fill="#b6c5d4"/>

      <!-- Entferner Tannenwald am Horizont -->
      <g fill="#6f9b83" opacity="0.8">
        <polygon points="15,305 28,255 41,305"/><polygon points="38,305 50,265 62,305"/>
        <polygon points="58,305 72,250 86,305"/><polygon points="82,305 94,268 106,305"/>
        <polygon points="105,305 120,252 135,305"/><polygon points="128,305 140,270 152,305"/>
        <polygon points="255,305 268,255 281,305"/><polygon points="278,305 292,262 306,305"/>
        <polygon points="300,305 314,250 328,305"/><polygon points="322,305 335,268 348,305"/>
        <polygon points="470,305 484,252 498,305"/><polygon points="492,305 505,265 518,305"/>
        <polygon points="515,305 530,250 545,305"/><polygon points="538,305 551,268 564,305"/>
        <polygon points="745,305 758,255 771,305"/><polygon points="768,305 782,262 796,305"/>
      </g>

      <!-- Hütte 1 (links hinten) mit animiertem Rauch, Schneedach und beleuchteten Fenstern -->
      <g transform="translate(175, 213)">
        <g class="smoke">
          <circle class="puff" cx="100" cy="-26" r="9" fill="#ffffff"/>
          <circle class="puff" cx="106" cy="-43" r="12" fill="#ffffff"/>
          <circle class="puff" cx="98" cy="-62" r="14" fill="#ffffff"/>
        </g>
        <rect x="12" y="28" width="112" height="64" fill="#d8b78e" stroke="#8b6b45" stroke-width="2"/>
        <rect x="96" y="-4" width="16" height="34" fill="#9b5a2b"/>
        <rect x="94" y="-7" width="20" height="7" fill="#ffffff"/>
        <polygon points="2,30 68,-12 134,30" fill="#7a3f1d"/>
        <polygon points="2,30 68,-12 134,30 126,26 68,-5 10,26" fill="#ffffff"/>
        <rect x="26" y="48" width="28" height="28" fill="#ffdf6e" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="40" y1="48" x2="40" y2="76" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="26" y1="62" x2="54" y2="62" stroke="#7a3f1d" stroke-width="2"/>
        <rect x="82" y="48" width="28" height="28" fill="#ffdf6e" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="96" y1="48" x2="96" y2="76" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="82" y1="62" x2="110" y2="62" stroke="#7a3f1d" stroke-width="2"/>
        <rect x="54" y="58" width="26" height="34" fill="#8b5a2b"/>
        <circle cx="74" cy="75" r="2" fill="#ffd700"/>
        <!-- Eiszapfen am Dachrand -->
        <g fill="#e8f6fd" stroke="#b9d4e2" stroke-width="1">
          <polygon points="186,243 190,243 188,251"/><polygon points="206,243 210,243 208,250"/>
          <polygon points="226,243 230,243 228,252"/><polygon points="246,243 250,243 248,249"/>
          <polygon points="266,243 270,243 268,251"/><polygon points="286,243 290,243 288,250"/>
        </g>
      </g>

      <!-- Hütte 2 (mitte hinten) – sitzt auf dem Boden (y=305) -->
      <g transform="translate(360, 219)">
        <g class="smoke">
          <circle class="puff" cx="82" cy="-20" r="8" fill="#ffffff"/>
          <circle class="puff" cx="88" cy="-38" r="11" fill="#ffffff"/>
        </g>
        <rect x="10" y="26" width="100" height="60" fill="#c9a87c" stroke="#8b6b45" stroke-width="2"/>
        <rect x="76" y="-2" width="14" height="30" fill="#9b5a2b"/>
        <rect x="74" y="-5" width="18" height="6" fill="#ffffff"/>
        <polygon points="0,28 60,-10 120,28" fill="#7a3f1d"/>
        <polygon points="0,28 60,-10 120,28 112,24 60,-3 8,24" fill="#ffffff"/>
        <rect x="22" y="44" width="24" height="24" fill="#ffdf6e" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="34" y1="44" x2="34" y2="68" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="22" y1="56" x2="46" y2="56" stroke="#7a3f1d" stroke-width="2"/>
        <rect x="66" y="44" width="24" height="24" fill="#ffdf6e" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="78" y1="44" x2="78" y2="68" stroke="#7a3f1d" stroke-width="2"/>
        <line x1="66" y1="56" x2="90" y2="56" stroke="#7a3f1d" stroke-width="2"/>
        <!-- Eiszapfen am Dachrand -->
        <g fill="#e8f6fd" stroke="#b9d4e2" stroke-width="1">
          <polygon points="370,247 374,247 372,255"/><polygon points="390,247 394,247 392,254"/>
          <polygon points="410,247 414,247 412,256"/><polygon points="430,247 434,247 432,253"/>
          <polygon points="450,247 454,247 452,255"/><polygon points="470,247 474,247 472,254"/>
        </g>
      </g>

      <!-- Schneefläche (flacher, damit alles auf dem Boden steht) -->
      <path d="M0 307 Q100 303 200 306 T400 305 T600 307 T800 305 L800 450 L0 450 Z" fill="url(#snowOut)"/>
      <path d="M0 307 Q160 302 320 306 T640 305 T800 307" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.85"/>

      <!-- Warme Lichtpools der Hüttenfenster auf dem Schnee -->
      <ellipse cx="240" cy="318" rx="74" ry="14" fill="url(#windowGlow)"/>
      <ellipse cx="418" cy="316" rx="64" ry="12" fill="url(#windowGlow)"/>

      <!-- Gefrorener Teich (links, unter den Tannen) -->
      <ellipse cx="180" cy="334" rx="78" ry="14" fill="#c8e6f2" stroke="#ffffff" stroke-width="3"/>
      <path d="M130 332 Q165 326 200 334 M160 338 Q195 332 230 338" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"/>

      <!-- Schneemann im freien Feld zwischen Rodel und Zelt -->
      <g transform="translate(505, 245)">
        <ellipse cx="26" cy="60" rx="26" ry="6" fill="#b9d4e2" opacity="0.6"/>
        <ellipse cx="26" cy="44" rx="22" ry="19" fill="#ffffff" stroke="#c9dbe6" stroke-width="2"/>
        <ellipse cx="26" cy="20" rx="15" ry="14" fill="#ffffff" stroke="#c9dbe6" stroke-width="2"/>
        <circle cx="26" cy="3" r="10" fill="#ffffff" stroke="#c9dbe6" stroke-width="2"/>
        <circle cx="22" cy="1" r="1.6" fill="#333"/><circle cx="30" cy="1" r="1.6" fill="#333"/>
        <polygon points="26,4 39,7 26,9" fill="#ff8c00"/>
        <circle cx="26" cy="20" r="1.8" fill="#333"/>
        <circle cx="26" cy="29" r="1.8" fill="#333"/>
        <circle cx="26" cy="38" r="1.8" fill="#333"/>
        <path d="M6 16 L-8 6 M46 16 L60 6" stroke="#8b5a2b" stroke-width="2.5" stroke-linecap="round"/>
      </g>

      <!-- Schneewehen & Fußspuren Richtung Zelt -->
      <path d="M0 344 Q60 334 130 346 T280 342" fill="none" stroke="#eaf5fb" stroke-width="6" opacity="0.85"/>
      <g fill="#c2dbe8" opacity="0.75">
        <ellipse cx="430" cy="344" rx="7" ry="3"/><ellipse cx="452" cy="349" rx="7" ry="3"/>
        <ellipse cx="474" cy="343" rx="7" ry="3"/><ellipse cx="496" cy="349" rx="7" ry="3"/>
        <ellipse cx="518" cy="343" rx="7" ry="3"/>
      </g>

      <!-- Sanfte Sonnenstrahlen -->
      <g fill="#fffbe6" opacity="0.10">
        <polygon points="690,62 470,450 545,450"/>
        <polygon points="690,62 615,450 672,450"/>
        <polygon points="690,62 738,450 800,450"/>
      </g>

      <!-- Fallender Schnee -->
      <g fill="#ffffff">
        <circle cx="45" cy="45" r="3" opacity="0.9"/><circle cx="120" cy="88" r="2" opacity="0.7"/>
        <circle cx="195" cy="40" r="3" opacity="0.8"/><circle cx="260" cy="110" r="2" opacity="0.6"/>
        <circle cx="320" cy="55" r="3" opacity="0.9"/><circle cx="390" cy="95" r="2" opacity="0.7"/>
        <circle cx="455" cy="35" r="3" opacity="0.8"/><circle cx="520" cy="120" r="2" opacity="0.6"/>
        <circle cx="585" cy="70" r="3" opacity="0.9"/><circle cx="640" cy="140" r="2" opacity="0.7"/>
        <circle cx="725" cy="40" r="3" opacity="0.8"/><circle cx="770" cy="100" r="2" opacity="0.6"/>
        <circle cx="75" cy="165" r="2" opacity="0.7"/><circle cx="165" cy="195" r="3" opacity="0.6"/>
        <circle cx="345" cy="175" r="2" opacity="0.7"/><circle cx="430" cy="145" r="3" opacity="0.6"/>
        <circle cx="555" cy="185" r="2" opacity="0.7"/><circle cx="680" cy="200" r="3" opacity="0.6"/>
        <circle cx="30" cy="240" r="2" opacity="0.6"/><circle cx="145" cy="270" r="2" opacity="0.5"/>
        <circle cx="405" cy="250" r="2" opacity="0.6"/><circle cx="600" cy="260" r="2" opacity="0.5"/>
      </g>

      <!-- Vignette -->
      <rect width="800" height="450" fill="url(#vignetteOut)"/>
    </svg>`;
  },

  bgIndoor() {
    return `<svg width="100%" height="100%" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <!-- Warme Zeltwand mit Stoff-Streifen -->
        <pattern id="tentFabric" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#6b4a2f"/>
          <rect width="20" height="40" fill="#745233"/>
          <line x1="0" y1="0" x2="40" y2="40" stroke="#5a3d26" stroke-width="1" opacity="0.3"/>
        </pattern>
        <!-- Holz-Boden -->
        <pattern id="floorWood" width="60" height="20" patternUnits="userSpaceOnUse">
          <rect width="60" height="20" fill="#8b5a2b"/>
          <line x1="0" y1="19" x2="60" y2="19" stroke="#6b4420" stroke-width="2"/>
          <line x1="30" y1="0" x2="30" y2="19" stroke="#6b4420" stroke-width="1"/>
        </pattern>
        <!-- Wärmelicht von der Laterne -->
        <radialGradient id="warmGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#ffd700" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#ffd700" stop-opacity="0"/>
        </radialGradient>
        <!-- Punktueller warmer Lichtschein (Laterne, Kerze) -->
        <radialGradient id="lampGlow">
          <stop offset="0%" stop-color="#ffd166" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#ffd166" stop-opacity="0"/>
        </radialGradient>
        <!-- Kalter Tageslicht-Schein aus der Tür -->
        <linearGradient id="doorLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#bfe3f5" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#bfe3f5" stop-opacity="0"/>
        </linearGradient>
        <!-- Vignette -->
        <radialGradient id="vignetteIn" cx="50%" cy="45%" r="78%">
          <stop offset="55%" stop-color="#1a0f05" stop-opacity="0"/>
          <stop offset="100%" stop-color="#1a0f05" stop-opacity="0.42"/>
        </radialGradient>
      </defs>

      <!-- Zeltwand & Boden -->
      <rect width="800" height="340" fill="url(#tentFabric)"/>
      <rect y="340" width="800" height="110" fill="url(#floorWood)"/>
      <rect width="800" height="450" fill="url(#warmGlow)"/>

      <!-- Kalter Tageslicht-Schein aus der offenen Tür auf den Boden -->
      <polygon points="68,340 242,340 330,450 110,450" fill="url(#doorLight)"/>

      <!-- Zelt-First (Dachbalken oben) -->
      <polygon points="0,0 400,60 800,0 800,20 400,80 0,20" fill="#4a3220"/>
      <line x1="400" y1="60" x2="400" y2="340" stroke="#5a3d26" stroke-width="6"/>

      <!-- ==== TÜR (links, groß & deutlich sichtbar) ==== -->
      <g>
        <!-- Türrahmen (dunkel) -->
        <rect x="55" y="95" width="200" height="245" fill="#3e2a18" stroke="#2a1c10" stroke-width="4"/>
        <!-- Türöffnung: Blick nach draußen in den Schnee -->
        <rect x="68" y="108" width="174" height="232" fill="#bfe3f5"/>
        <rect x="68" y="300" width="174" height="40" fill="#ffffff"/>
        <!-- Schnee-Berge draußen -->
        <polygon points="68,300 120,250 170,300" fill="#dceaf2"/>
        <polygon points="150,300 200,255 242,300" fill="#e8f2f8"/>
        <!-- Kleine Tanne draußen -->
        <polygon points="210,300 200,265 220,265" fill="#2e7d32"/>
        <polygon points="210,275 198,300 222,300" fill="#2e7d32"/>
        <!-- Türflügel (offen, nach rechts aufgeschlagen) -->
        <rect x="242" y="108" width="14" height="232" fill="#8b5a2b" stroke="#5a3d26" stroke-width="2"/>
        <!-- Türgriff (golden, gut sichtbar) -->
        <circle cx="90" cy="225" r="7" fill="#ffd700" stroke="#b8860b" stroke-width="2"/>
        <!-- Türschild "Raus" (kleines Holzschild) -->
        <rect x="75" y="130" width="70" height="24" fill="#deb887" stroke="#8b5a2b" stroke-width="2"/>
        <text x="110" y="147" font-family="Courier New, monospace" font-size="14" font-weight="bold" fill="#5a3d26" text-anchor="middle">RAUS</text>
      </g>

      <!-- Teppich in der Mitte -->
      <rect x="270" y="330" width="280" height="80" fill="#8b0000" stroke="#ffd700" stroke-width="4" stroke-dasharray="8,6"/>
      <rect x="290" y="345" width="240" height="50" fill="none" stroke="#cda434" stroke-width="2"/>

      <!-- Warmes Licht der Laterne (Halo + Bodenlicht) -->
      <circle cx="650" cy="93" r="78" fill="url(#lampGlow)"/>
      <ellipse cx="650" cy="348" rx="160" ry="48" fill="url(#lampGlow)"/>
      <!-- Laterne (warmes Licht oben rechts) -->
      <g>
        <line x1="650" y1="40" x2="650" y2="75" stroke="#3e2a18" stroke-width="3"/>
        <rect x="636" y="75" width="28" height="36" fill="#ffd700" stroke="#b8860b" stroke-width="3" opacity="0.9"/>
        <rect x="642" y="81" width="16" height="24" fill="#fff8dc"/>
        <polygon points="632,75 668,75 650,60" fill="#3e2a18"/>
      </g>

      <!-- Regal rechts, höher gesetzt (damit Kiste + Hammer frei stehen) -->
      <rect x="590" y="195" width="150" height="10" fill="#6b4420"/>
      <rect x="600" y="155" width="20" height="40" fill="#8b4513"/>
      <rect x="625" y="165" width="16" height="30" fill="#2e8b57"/>
      <rect x="645" y="150" width="22" height="45" fill="#c0392b"/>
      <!-- Kerze auf dem Regal (animiertes Flackern) -->
      <circle class="candle-glow" cx="694" cy="162" r="38" fill="url(#lampGlow)"/>
      <rect x="690" y="165" width="8" height="30" fill="#f5f5dc"/>
      <ellipse class="candle-flame" cx="694" cy="162" rx="3" ry="6" fill="#ff9933"/>

      <!-- Vignette -->
      <rect width="800" height="450" fill="url(#vignetteIn)"/>
    </svg>`;
  },

  /* ---------- Rodelrennen-Hintergrund ---------- */
  bgRace() {
    return `<svg width="100%" height="100%" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="skyRace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2b6ea6"/>
          <stop offset="45%" stop-color="#6fb3e0"/>
          <stop offset="100%" stop-color="#d8eefb"/>
        </linearGradient>
        <linearGradient id="groundRace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#b8d4e6"/>
        </linearGradient>
        <linearGradient id="trackRace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e8f4fb"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>

      <!-- Himmel -->
      <rect width="800" height="270" fill="url(#skyRace)"/>

      <!-- Bewegungsstreifen im Himmel (Geschwindigkeit) -->
      <g stroke="#ffffff" stroke-width="2" opacity="0.35">
        <line x1="40" y1="60" x2="180" y2="60"/>
        <line x1="260" y1="90" x2="420" y2="90"/>
        <line x1="500" y1="45" x2="660" y2="45"/>
        <line x1="120" y1="130" x2="260" y2="130"/>
        <line x1="600" y1="120" x2="760" y2="120"/>
        <line x1="340" y1="170" x2="500" y2="170"/>
      </g>

      <!-- Berge in der Ferne -->
      <path d="M0 270 L160 150 L320 270 Z" fill="#9fb6c9" opacity="0.7"/>
      <path d="M260 270 L420 130 L580 270 Z" fill="#8fa8be" opacity="0.7"/>
      <path d="M520 270 L680 145 L840 270 Z" fill="#9fb6c9" opacity="0.7"/>

      <!-- Tannenwald (schnell vorbeiziehend) -->
      <g fill="#4f7f6a" opacity="0.85">
        <polygon points="20,270 34,225 48,270"/><polygon points="52,270 66,230 80,270"/>
        <polygon points="90,270 104,220 118,270"/><polygon points="130,270 144,228 158,270"/>
        <polygon points="200,270 214,222 228,270"/><polygon points="240,270 254,226 268,270"/>
        <polygon points="300,270 314,218 328,270"/><polygon points="340,270 354,224 368,270"/>
        <polygon points="400,270 414,220 428,270"/><polygon points="440,270 454,226 468,270"/>
        <polygon points="500,270 514,218 528,270"/><polygon points="540,270 554,224 568,270"/>
        <polygon points="600,270 614,220 628,270"/><polygon points="640,270 654,226 668,270"/>
        <polygon points="700,270 714,222 728,270"/><polygon points="740,270 754,228 768,270"/>
      </g>
      <!-- Schnee auf den Tannen -->
      <g fill="#ffffff" opacity="0.9">
        <polygon points="20,270 34,225 48,270" fill="none"/>
      </g>

      <!-- Schneefläche -->
      <rect y="270" width="800" height="180" fill="url(#groundRace)"/>

      <!-- Piste (mittlerer Streifen, leicht erhöht) -->
      <path d="M0 285 Q400 278 800 285 L800 450 L0 450 Z" fill="url(#trackRace)" opacity="0.85"/>

      <!-- Geschwindigkeitsstreifen auf dem Boden -->
      <g stroke="#b8d4e6" stroke-width="2" opacity="0.7">
        <line x1="0" y1="300" x2="120" y2="300"/>
        <line x1="180" y1="315" x2="320" y2="315"/>
        <line x1="360" y1="295" x2="500" y2="295"/>
        <line x1="540" y1="310" x2="680" y2="310"/>
        <line x1="720" y1="300" x2="800" y2="300"/>
        <line x1="60" y1="335" x2="200" y2="335"/>
        <line x1="260" y1="350" x2="400" y2="350"/>
        <line x1="440" y1="330" x2="580" y2="330"/>
        <line x1="620" y1="345" x2="760" y2="345"/>
        <line x1="20" y1="375" x2="160" y2="375"/>
        <line x1="220" y1="390" x2="360" y2="390"/>
        <line x1="400" y1="370" x2="540" y2="370"/>
        <line x1="580" y1="385" x2="720" y2="385"/>
      </g>

      <!-- Mittellinie (gestrichelt) -->
      <g stroke="#d32f2f" stroke-width="3" stroke-dasharray="18,14" opacity="0.6">
        <line x1="0" y1="305" x2="800" y2="305"/>
      </g>

      <!-- Zielbanner mit Schachbrettlinie ( erst kurz vor Schluss sichtbar ) -->
      <g id="race-finish-gate" class="race-finish-gate">
        <rect x="700" y="148" width="6" height="150" fill="#8b5a2b" stroke="#3d1f0f" stroke-width="2"/>
        <rect x="784" y="148" width="6" height="150" fill="#8b5a2b" stroke="#3d1f0f" stroke-width="2"/>
        <rect x="696" y="136" width="98" height="36" fill="#fff" stroke="#3d1f0f" stroke-width="3"/>
        <text x="745" y="161" font-family="'Courier New', monospace" font-size="20" font-weight="bold" text-anchor="middle" fill="#c50045">ZIEL</text>
        <g fill="#2b1a12">
          <rect x="700" y="296" width="11" height="6"/><rect x="722" y="296" width="11" height="6"/>
          <rect x="744" y="296" width="11" height="6"/><rect x="766" y="296" width="11" height="6"/>
          <rect x="711" y="302" width="11" height="6"/><rect x="733" y="302" width="11" height="6"/>
          <rect x="755" y="302" width="11" height="6"/><rect x="777" y="302" width="11" height="6"/>
        </g>
        <g fill="#fff">
          <rect x="711" y="296" width="11" height="6"/><rect x="733" y="296" width="11" height="6"/>
          <rect x="755" y="296" width="11" height="6"/><rect x="777" y="296" width="11" height="6"/>
          <rect x="700" y="302" width="11" height="6"/><rect x="722" y="302" width="11" height="6"/>
          <rect x="744" y="302" width="11" height="6"/><rect x="766" y="302" width="11" height="6"/>
        </g>
      </g>
      <!-- Startmarkierung links -->
      <rect x="55" y="298" width="8" height="14" fill="#d32f2f"/>
    </svg>`;
  },

  /* ---------- Objekte einsetzen ---------- */
  placeImage(container, src, pos, width, z = 10) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'pixel-sprite';
    Object.assign(img.style, { width, zIndex: String(z), ...pos });
    container.appendChild(img);
    return img;
  },

  /* Weicher Lichtschein (radialer Verlauf) hinter Objekten */
  placeGlow(container, pos, color, z = 9) {
    const g = document.createElement('div');
    g.className = 'glow';
    Object.assign(g.style, {
      zIndex: String(z),
      background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
      ...pos
    });
    container.appendChild(g);
    return g;
  },

  /* Vignette über der Szene */
  vignette() {
    const v = document.createElement('div');
    v.className = 'scene-vignette';
    return v;
  },

  renderOutdoor(container) {
    // Warmer Lichtschein hinter dem Zelt (liegt unter dem Zelt-Sprite)
    this.placeGlow(container, { left: '530px', bottom: '100px', width: '175px', height: '170px' },
      'rgba(255,190,90,0.55)', 9);

    // Tannen links – Wurzel exakt auf dem Schnee (Bodenlinie y≈305 → bottom 145px)
    this.placeImage(container, ASSETS.tree, { left: '40px',  bottom: '145px' }, '56px', 6);
    this.placeImage(container, ASSETS.tree, { left: '130px', bottom: '145px' }, '44px', 6);
    this.placeImage(container, ASSETS.tree, { left: '220px', bottom: '145px' }, '52px', 6);

    // Die drei kleinen Tannen sind anklickbar, haben aber keine Spielwirkung.
    // Ein Klick auf sie zählt als Interaktion und kann so den ersten Vogel holen.
    // Die erste Fläche endet bei x=84, damit sie den Stock-Hotspot nicht verdeckt.
    container.appendChild(this.hotspot('42px',  '145px', '42px', '125px', 'pine'));
    container.appendChild(this.hotspot('130px', '145px', '44px', '125px', 'pine'));
    container.appendChild(this.hotspot('220px', '145px', '52px', '125px', 'pine'));

    // Charlotte steht LINKS NEBEN dem Rodel (kein Überlappen mehr)
    const charlotte = this.placeImage(container, ASSETS.charlotte, { left: '300px', bottom: '145px' }, '72px', 12);
    charlotte.classList.add('charlotte');
    container.appendChild(this.hotspot('300px', '145px', '72px', '120px', 'charlotte'));

    // Rodel rechts daneben. Sprite hat eine transparente Fußzeile → bottom 140px
    this.placeImage(container,
      this.sledFixed ? ASSETS.sledFixed : ASSETS.sled,
      { left: '395px', bottom: '140px' }, '112px', 11);
    container.appendChild(this.hotspot('395px', '145px', '112px', '60px', 'sled'));

    // Zelt (deutlich getrennt vom Baum)
    this.placeImage(container, ASSETS.tent, { left: '555px', bottom: '145px' }, '112px', 11);
    container.appendChild(this.hotspot('555px', '145px', '112px', '80px', 'tent'));

    // Weihnachtsbaum ganz rechts (Klasse für die Dreh-Animation)
    const tree = this.placeImage(container, ASSETS.christmasTree, { left: '690px', bottom: '145px' }, '96px', 11);
    tree.classList.add('christmas-tree');
    container.appendChild(this.hotspot('690px', '145px', '96px', '125px', 'tree'));

    // Stock liegt erst nach dem ersten Vogelbesuch ganz links zwischen den Tannen
    if (this.stickDropped && !this.inventory.includes('stick')) {
      const stick = this.placeImage(container, ASSETS.stick, { left: '99px', bottom: '145px' }, '30px', 12);
      stick.classList.add('ground-stick');
      container.appendChild(this.hotspot('84px', '136px', '64px', '36px', 'stick'));
    }

    // Heruntergefallene Kugel bleibt liegen, bis Charlotte sie aufhebt
    if (this.ornamentFell && !this.inventory.includes('ornament')) {
      const ball = this.placeImage(container, ASSETS.ornament, { left: '724px', bottom: '145px' }, '20px', 13);
      ball.classList.add('ornament');
      ball.style.transform = 'rotate(320deg)';
      container.appendChild(this.hotspot('700px', '136px', '72px', '56px', 'ornament'));
    }

    // Vogel-Logik: Der erste Besuch wartet auf die erste Interaktion (+2 s).
    this.armFirstBird();
  },

  renderIndoor(container) {
    // Warmer Lichtschein hinter der Werkzeugkiste
    this.placeGlow(container, { left: '590px', bottom: '120px', width: '160px', height: '150px' },
      'rgba(255,190,90,0.5)', 10);

    // Charlotte in der Mitte (Füße auf der Bodenlinie y=340 → bottom 110px)
    const charlotte = this.placeImage(container, ASSETS.charlotte, { left: '420px', bottom: '110px' }, '72px', 12);
    charlotte.classList.add('charlotte');
    container.appendChild(this.hotspot('420px', '110px', '72px', '120px', 'charlotte'));

    // Werkzeugkiste: zunächst geschlossen, nach dem ersten Klick geöffnet
    this.placeImage(container,
      this.toolboxOpen ? ASSETS.toolboxOpen : ASSETS.toolboxEmpty,
      { left: '610px', bottom: '110px' }, '110px', 11);

    // Hammer erst sichtbar, wenn die Kiste geöffnet ist (und noch nicht eingesammelt)
    if (this.toolboxOpen && !this.inventory.includes('hammer')) {
      this.placeImage(container, ASSETS.hammer, { left: '640px', bottom: '125px' }, '68px', 13);
    }

    // Hotspot: Kiste (+ Hammer) – deckt beide Zustände ab
    container.appendChild(this.hotspot('605px', '105px', '125px', '145px', 'toolbox'));

    // Hotspot: Tür (genau über der sichtbaren Tür links, SVG y=95..340)
    const doorHot = this.hotspot('55px', '0px', '200px', '245px', 'exit');
    doorHot.style.top = '95px';
    doorHot.style.bottom = 'auto';
    container.appendChild(doorHot);
  },

  renderRace(container) {
    // Geschwindigkeitsstreifen: mehrere Ebenen mit unterschiedlichem Tempo
    [292, 314, 336, 358, 380, 402].forEach((y, i) => {
      const streak = document.createElement('div');
      streak.className = 'race-speed-streak';
      streak.style.bottom = (450 - y) + 'px';
      streak.style.opacity = (0.45 + i * 0.08).toFixed(2);
      streak.style.animationDuration = (0.42 + i * 0.05).toFixed(2) + 's';
      streak.style.animationDelay = (-i * 0.13).toFixed(2) + 's';
      container.appendChild(streak);
    });

    // Charlotte sitzt jetzt direkt auf dem Rodel (eigenes kombiniertes Sprite)
    const rider = this.placeImage(container, ASSETS.riderSled, { left: '80px', bottom: '145px' }, '128px', 12);
    rider.classList.add('race-rider');

    // Herzen (oben links)
    const hearts = document.createElement('div');
    hearts.id = 'race-hearts';
    hearts.className = 'race-hud';
    hearts.style.left = '16px';
    hearts.style.top = 'calc(52px * var(--ui-boost))';
    container.appendChild(hearts);

    // Fortschrittsbalken (oben)
    const progress = document.createElement('div');
    progress.id = 'race-progress';
    progress.className = 'race-progress';
    container.appendChild(progress);

    // Hinweis
    const hint = document.createElement('div');
    hint.id = 'race-hint';
    hint.className = 'race-hint';
    // Auf Touch-Geräten ist der Leertasten-Hinweis irritierend – tippen genügt.
    // Die Tastatursteuerung bleibt trotzdem aktiv.
    hint.textContent = 'Tippe, um zu springen!';
    container.appendChild(hint);
    setTimeout(() => { if (hint.parentNode) hint.remove(); }, 2200);

    this.raceUpdateHud();
  },

  /* ---------- Koordinaten-Helfer ---------- */
  /* getBoundingClientRect() liefert Viewport-Pixel. Unter dem CSS-scale von
     #game müssen diese Werte zurück in die festen 800x450-Szenenkoordinaten. */
  sceneCoords(el, scene) {
    const sc = scene || document.getElementById('scene');
    if (!el || !sc) return null;
    const r = el.getBoundingClientRect();
    const s = sc.getBoundingClientRect();
    const scale = s.width / (sc.offsetWidth || 800) || 1;
    return {
      left: (r.left - s.left) / scale,
      top: (r.top - s.top) / scale,
      right: (r.right - s.left) / scale,
      bottom: (s.bottom - r.bottom) / scale,
      width: r.width / scale,
      height: r.height / scale
    };
  },

  /* ---------- Hotspot-Helfer ---------- */
  // Position immer per bottom (wie die Sprites). Optional kann danach
  // style.top explizit gesetzt werden (z. B. für die Tür im SVG).
  hotspot(left, bottom, width, height, action) {
    const h = document.createElement('div');
    h.className = 'hotspot';
    h.dataset.action = action;
    Object.assign(h.style, { left, bottom, width, height });
    return h;
  },

  setupClickHandlers() {
    const scene = document.getElementById('scene');
    // Bonus-Level: Zeiger/Touch folgt der Korbfigur; Tasten werden oben
    // im keydown/keyup-Handler behandelt.
    scene.addEventListener('pointerdown', (e) => {
      if (!this.bonusActive) return;
      this.bonusPointerX = this.bonusSceneX(e.clientX);
    });
    scene.addEventListener('pointermove', (e) => {
      if (!this.bonusActive) return;
      this.bonusPointerX = this.bonusSceneX(e.clientX);
    });
    scene.addEventListener('pointerleave', () => {
      if (this.bonusActive) this.bonusPointerX = null;
    });

    scene.addEventListener('click', (e) => {
      if (this.bonusActive) {
        this.bonusPointerX = this.bonusSceneX(e.clientX);
        return;
      }
      if (this.raceActive) {
        this.raceJump();
        return;
      }
      // Jeder Klick in der Szene zählt als erste Interaktion – auch neben
      // einem Hotspot. Erst danach darf der Vogel seinen Flug planen.
      this.handleFirstInteraction();
      const hotspot = e.target.closest('.hotspot');
      if (!hotspot) return;
      this.handleAction(hotspot.dataset.action);
    });
  },

  /* Viewport-Pixel in die festen 800x450-Szenenkoordinaten umrechnen. */
  bonusSceneX(clientX) {
    const scene = document.getElementById('scene');
    if (!scene) return 400;
    const r = scene.getBoundingClientRect();
    const scale = r.width / (scene.offsetWidth || 800) || 1;
    const x = (clientX - r.left) / scale;
    return Math.max(52, Math.min(748, x));
  },

  handleFirstInteraction() {
    if (this.firstInteractionDone) return;
    this.firstInteractionDone = true;
    this.armFirstBird();
  },

  handleAction(action) {
    switch (action) {
      case 'sled': this.clickSled(); break;
      case 'tent': this.enterTent(); break;
      case 'toolbox': this.takeToolbox(); break;
      case 'exit': this.leaveTent(); break;
      case 'charlotte': this.clickCharlotte(); break;
      case 'tree': this.clickTree(); break;
      case 'pine': this.clickPine(); break;
      case 'ornament': this.takeOrnament(); break;
      case 'stick': this.takeStick(); break;
    }
  },

  /* Die kleinen Tannen sind reine Deko. Ein Klick darauf tut nichts, kann aber
     den ersten Vogelbesuch auslösen, falls er noch nicht stattgefunden hat. */
  clickPine() {
    if (!this.firstBirdDone) this.armFirstBird();
  },

  clickSled() {
    if (this.repairing) return;
    if (this.sledFixed) {
      if (this.raceWon) {
        this.showEndScreen();
      } else {
        this.startRace();
      }
      return;
    }
    const missing = REPAIR_ITEMS.filter(item => !this.inventory.includes(item));
    if (missing.length === 0) {
      this.repairSled();
    } else {
      const namen = missing.map(item => INVENTORY_ITEMS[item].label).join(', ');
      const text = missing.length === 1 ? 'Es fehlt noch: ' : 'Es fehlen noch: ';
      this.say('Der Rodel ist kaputt! ' + text + namen + '.');
    }
  },

  repairSled() {
    this.repairing = true;
    const scene = document.getElementById('scene');
    if (!scene) { this.repairing = false; return; }

    // Hammer, der auf den Rodel zuschlägt
    const hammer = document.createElement('img');
    hammer.src = ASSETS.hammer;
    hammer.alt = '';
    hammer.className = 'pixel-sprite repair-hammer';
    Object.assign(hammer.style, { left: '428px', bottom: '178px', width: '56px', zIndex: '16' });
    scene.appendChild(hammer);

    // Funken am Schlagpunkt
    const spark = document.createElement('div');
    spark.className = 'repair-spark';
    Object.assign(spark.style, { left: '442px', bottom: '205px' });
    scene.appendChild(spark);

    const anim = hammer.animate([
      { transform: 'rotate(-48deg)', offset: 0 },
      { transform: 'rotate(18deg)',  offset: 0.32 },
      { transform: 'rotate(-48deg)', offset: 0.64 },
      { transform: 'rotate(18deg)',  offset: 1 }
    ], { duration: 720, easing: 'ease-in-out', fill: 'forwards' });

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { anim.cancel(); } catch (e) { /* ignore */ }
      try { hammer.remove(); } catch (e) { /* ignore */ }
      try { spark.remove(); } catch (e) { /* ignore */ }
      this.sledFixed = true;
      this.repairing = false;
      this.renderScene();
      this.say('Hammer, Kugel und Stock eingesetzt – der Rodel ist repariert! 🎉');
    };
    anim.onfinish = finish;
    // Fallback, falls die Animation (z. B. im Hintergrund-Tab) nicht läuft
    setTimeout(finish, 820);
  },

  enterTent() {
    this.scene = 'indoor';
    this.renderScene();
    this.say('Charlotte betritt das warme Zelt. Hier sollte etwas Nützliches sein...');
  },

  leaveTent() {
    this.scene = 'outdoor';
    this.renderScene();
    this.say('Zurück in die Winterlandschaft.');
  },

  takeToolbox() {
    if (this.inventory.includes('hammer')) {
      this.say('Den Hammer habe ich bereits.');
      return;
    }
    // 1. Klick: Kiste öffnen – der Hammer wird sichtbar
    if (!this.toolboxOpen) {
      this.toolboxOpen = true;
      this.renderScene();
      this.say('Die Werkzeugkiste ist offen! Ein Hammer liegt darin.');
      return;
    }
    // 2. Klick: Hammer aufsammeln – er verschwindet aus der Kiste
    this.inventory.push('hammer');
    this.updateInventory();
    this.renderScene();
    this.say('Hammer eingepackt! Jetzt zurück zum Rodel.');
  },

  takeOrnament() {
    if (!this.ornamentFell || this.inventory.includes('ornament')) return;
    this.inventory.push('ornament');
    this.updateInventory();
    this.renderScene();
    this.say('Eine bunte Kugel! Die passt perfekt an den Rodel.');
  },

  takeStick() {
    if (!this.stickDropped || this.inventory.includes('stick')) return;
    this.inventory.push('stick');
    this.updateInventory();
    this.renderScene();
    this.say('Ein fester Stock – damit stützen wir die Kufen.');
  },

  /* ---------- Klick auf Charlotte ---------- */
  clickCharlotte() {
    const sprite = document.querySelector('.charlotte');
    if (sprite) {
      sprite.classList.remove('shrug');
      void sprite.offsetWidth;           // Animation neu starten
      sprite.classList.add('shrug');
      sprite.addEventListener('animationend', () => sprite.classList.remove('shrug'), { once: true });
      this.showQuestionBubble(sprite);
    }
    const hints = this.charlotteHints();
    const level = Math.min(this.charlotteLine, hints.length - 1);
    this.say(hints[level]);
    this.charlotteLine++;
  },

  /* Vier Stufen: vage → grob → konkrete Objekte → direkter nächster Schritt. */
  charlotteHints() {
    return [
      'Hm ... ich zucke mit den Schultern. Irgendwo hier muss es sein!',
      'Drei Dinge braucht der Rodel: eins im Zelt, eins beim Baum – und eines bringt der Vogel.',
      'Zelt → Werkzeugkiste. Baum → anklicken. Vogel → abwarten. Mehr verrate ich noch nicht ...',
      this.exactHint()
    ];
  },

  /* Der letzte Tipp richtet sich danach, was gerade noch fehlt. */
  exactHint() {
    if (REPAIR_ITEMS.every(item => this.inventory.includes(item))) {
      return 'Alles dabei! Klick direkt auf den Rodel – ich setze Hammer, Kugel und Stock ein.';
    }
    if (!this.inventory.includes('hammer')) {
      if (this.scene === 'indoor') {
        return this.toolboxOpen
          ? 'Klick noch einmal auf die offene Werkzeugkiste – dann nehme ich den Hammer.'
          : 'Klick auf die Werkzeugkiste neben mir – darin liegt der Hammer.';
      }
      return 'Geh ins Zelt rechts neben dem Rodel und klick auf die Werkzeugkiste.';
    }
    if (!this.inventory.includes('ornament')) {
      return this.ornamentFell
        ? 'Die Kugel liegt direkt vor dem Weihnachtsbaum im Schnee – klick darauf.'
        : 'Klick auf den Weihnachtsbaum ganz rechts – dann fällt eine Kugel herunter.';
    }
    if (!this.inventory.includes('stick')) {
      return this.stickDropped
        ? 'Der Stock liegt ganz links zwischen den ersten beiden Tannen – klick ihn an.'
        : 'Warte kurz auf den Vogel – er lässt den Stock gleich in die Tannen-Lücke fallen.';
    }
    return 'Klick auf den Rodel!';
  },

  showQuestionBubble(sprite) {
    const scene = document.getElementById('scene');
    if (!scene || !sprite) return;
    const p = this.sceneCoords(sprite, scene);
    if (!p) return;
    const bubble = document.createElement('div');
    bubble.className = 'question-bubble';
    bubble.textContent = '?';
    bubble.style.left = Math.round(p.left + p.width / 2 - 15) + 'px';
    bubble.style.top = Math.round(p.top - 30) + 'px';
    scene.appendChild(bubble);
    setTimeout(() => bubble.remove(), 1400);
  },

  /* ---------- Klick auf den Weihnachtsbaum ---------- */
  clickTree() {
    const tree = document.querySelector('.christmas-tree');
    if (tree) {
      tree.classList.remove('tree-spin');
      void tree.offsetWidth;
      tree.classList.add('tree-spin');
      tree.addEventListener('animationend', () => tree.classList.remove('tree-spin'), { once: true });
    }
    if (!this.ornamentFell) {
      this.ornamentFell = true;
      this.dropOrnament();
      this.say('Der Baum dreht sich einmal – und verliert eine Kugel!');
    } else if (this.inventory.includes('ornament')) {
      this.say('Der Baum dreht sich nicht mehr. Die Kugel ist schon eingepackt.');
    } else {
      this.say('Der Baum dreht sich nicht mehr. Die Kugel liegt im Schnee – klick sie an!');
    }
  },

  dropOrnament() {
    const scene = document.getElementById('scene');
    if (!scene) return;
    const ball = document.createElement('img');
    ball.src = ASSETS.ornament;
    ball.alt = '';
    ball.className = 'pixel-sprite ornament';
    Object.assign(ball.style, { left: '742px', bottom: '215px', width: '20px', zIndex: '13' });
    scene.appendChild(ball);

    // Sobald die Kugel liegt, wird sie aufhebbar.
    let hotspotPlaced = false;
    const placeHotspot = () => {
      if (hotspotPlaced || this.scene !== 'outdoor' || this.inventory.includes('ornament')) return;
      if (document.querySelector('.hotspot[data-action="ornament"]')) return;
      hotspotPlaced = true;
      scene.appendChild(this.hotspot('700px', '136px', '72px', '56px', 'ornament'));
    };

    const anim = ball.animate([
      { left: '742px', bottom: '215px', transform: 'rotate(0deg)',   offset: 0 },
      { left: '734px', bottom: '172px', transform: 'rotate(140deg)', offset: 0.5 },
      { left: '726px', bottom: '145px', transform: 'rotate(240deg)', offset: 0.8 },
      { left: '728px', bottom: '157px', transform: 'rotate(290deg)', offset: 0.9 },
      { left: '724px', bottom: '145px', transform: 'rotate(320deg)', offset: 1 }
    ], { duration: 1250, easing: 'ease-in', fill: 'forwards' });

    // Fallback: auch wenn die Animation im Hintergrund-Tab nicht läuft,
    // landet die Kugel sichtbar an ihrer finalen Position.
    let dropDone = false;
    const finishDrop = () => {
      if (dropDone) return;
      dropDone = true;
      ball.style.left = '724px';
      ball.style.bottom = '145px';
      ball.style.transform = 'rotate(320deg)';
      try { anim.cancel(); } catch (e) { /* ignore */ }
      placeHotspot();
    };
    anim.onfinish = finishDrop;
    setTimeout(finishDrop, 1400);
  },

  /* ---------- Vogel ---------- */
  /* Der erste Besuch startet erst nach der ersten Interaktion – und dann
     exakt 2 Sekunden später. Wird vorher die Szene gewechselt, löscht
     renderScene() den Timer; beim Zurückkehren wird er hier neu gesetzt. */
  armFirstBird() {
    if (!this.firstInteractionDone || this.firstBirdDone) return;
    if (this.scene !== 'outdoor') return;
    if (this.birdTimer || this.bird) return;
    // Beim ersten Besuch bringt der Vogel den Stock mit.
    this.birdWillDrop = !this.stickDropped && !this.inventory.includes('stick');
    this.birdTimer = setTimeout(() => this.birdLand(), 2000);
  },

  stopBird() {
    if (this.birdTimer) { clearTimeout(this.birdTimer); this.birdTimer = null; }
    this.stopFlap();
    if (this.birdFollowFrame) {
      cancelAnimationFrame(this.birdFollowFrame);
      this.birdFollowFrame = null;
    }
    if (this.birdCarryEl) { this.birdCarryEl.remove(); this.birdCarryEl = null; }
    this.birdCarryStick = false;
    if (this.birdAnim) {
      try { this.birdAnim.cancel(); } catch (e) { /* ignore */ }
      this.birdAnim = null;
    }
    if (this.bird) { this.bird.remove(); this.bird = null; }
    this.birdState = 'away';
  },

  birdLand() {
    if (this.scene !== 'outdoor') return;
    const scene = document.getElementById('scene');
    if (!scene) return;
    this.firstBirdDone = true;
    const willDrop = this.birdWillDrop;
    this.stopBird();
    this.birdState = 'flying-in';

    const bird = document.createElement('img');
    bird.src = ASSETS.birdFly1;
    bird.alt = '';
    bird.className = 'pixel-sprite bird flying';
    Object.assign(bird.style, { left: '-60px', bottom: '250px', width: '32px', zIndex: '14' });
    bird.addEventListener('click', (e) => {
      e.stopPropagation();
      this.scareBird();
    });
    scene.appendChild(bird);
    this.bird = bird;
    this.startFlap();

    // Erster Flug: der Vogel trägt den Stock im Schnabel bei sich.
    if (willDrop) {
      const carry = document.createElement('img');
      carry.src = ASSETS.stick;
      carry.alt = '';
      carry.className = 'pixel-sprite bird-carried-stick';
      Object.assign(carry.style, { left: '-53px', bottom: '246px', width: '20px', zIndex: '15' });
      scene.appendChild(carry);
      this.birdCarryEl = carry;
      this.birdCarryStick = true;
      this.followBirdWithStick();
    }

    this.birdAnim = bird.animate([
      { left: '-60px', bottom: '250px', offset: 0 },
      { left: '250px', bottom: '315px', offset: 0.55 },
      { left: '515px', bottom: '210px', offset: 1 }
    ], { duration: 2300, easing: 'ease-in-out', fill: 'forwards' });

    let landDone = false;
    const finishLand = () => {
      if (landDone || this.bird !== bird) return;
      landDone = true;
      try { this.birdAnim.cancel(); } catch (e) { /* ignore */ }
      bird.style.left = '515px';
      bird.style.bottom = '210px';
      this.birdSit();
    };
    this.birdAnim.onfinish = finishLand;
    setTimeout(finishLand, 2400);
  },

  birdSit() {
    if (!this.bird || this.birdState === 'flying-out') return;
    // Sicherheitsnetz: Falls der Stock noch nicht fiel, jetzt fallen lassen.
    if (this.birdCarryStick) this.dropCarriedStick();
    this.birdState = 'sitting';
    this.stopFlap();
    this.bird.src = ASSETS.birdSit;
    this.bird.classList.remove('flying');
    this.bird.classList.add('perched');
    this.birdTimer = setTimeout(() => this.birdFlyAway(false), 6000 + Math.random() * 5000);
  },

  birdFlyAway(scared) {
    if (!this.bird || this.birdState === 'flying-out') return;
    if (this.birdTimer) { clearTimeout(this.birdTimer); this.birdTimer = null; }

    const bird = this.bird;
    const scene = document.getElementById('scene');
    if (!scene) return;

    // Aktuelle Position übernehmen, damit der Abflug nahtlos beginnt
    const p = this.sceneCoords(bird, scene);
    if (!p) return;
    const startLeft = Math.round(p.left);
    const startBottom = Math.round(p.bottom);
    bird.style.left = startLeft + 'px';
    bird.style.bottom = startBottom + 'px';

    if (this.birdAnim) {
      try { this.birdAnim.cancel(); } catch (e) { /* ignore */ }
      this.birdAnim = null;
    }

    bird.classList.remove('perched');
    bird.classList.add('flying');
    this.birdState = 'flying-out';
    bird.src = ASSETS.birdFly1;
    this.startFlap();

    this.birdAnim = bird.animate([
      { left: startLeft + 'px', bottom: startBottom + 'px', offset: 0 },
      { left: (startLeft + 160) + 'px', bottom: (startBottom + 100) + 'px', offset: 0.5 },
      { left: '900px', bottom: '420px', offset: 1 }
    ], { duration: 2200, easing: 'ease-in', fill: 'forwards' });

    if (scared) this.say('Der kleine Vogel erschreckt sich und flattert davon!');

    let flyDone = false;
    const finishFly = () => {
      if (flyDone || this.bird !== bird) return;
      flyDone = true;
      try { this.birdAnim.cancel(); } catch (e) { /* ignore */ }
      bird.remove();
      this.bird = null;
      this.stopFlap();
      this.birdState = 'away';
      this.birdTimer = setTimeout(() => this.birdLand(), 9000 + Math.random() * 8000);
    };
    this.birdAnim.onfinish = finishFly;
    setTimeout(finishFly, 2300);
  },

  scareBird() {
    if (!this.bird || this.birdState === 'flying-out') return;
    if (this.birdCarryStick) this.dropCarriedStick();
    this.birdFlyAway(true);
  },

  /* Der getragene Stock bleibt dicht am Vogel, bis er über den Tannen ist. */
  followBirdWithStick() {
    if (this.birdFollowFrame) cancelAnimationFrame(this.birdFollowFrame);
    const step = () => {
      if (!this.birdCarryStick || !this.birdCarryEl || !this.bird || this.scene !== 'outdoor') return;
      const scene = document.getElementById('scene');
      if (!scene) return;
      const p = this.sceneCoords(this.bird, scene);
      if (!p) return;
      const left = Math.round(p.left + 7);
      const bottom = Math.round(p.bottom - 4);
      this.birdCarryEl.style.left = left + 'px';
      this.birdCarryEl.style.bottom = bottom + 'px';
      if (left >= 99) {
        this.dropCarriedStick();
        return;
      }
      this.birdFollowFrame = requestAnimationFrame(step);
    };
    this.birdFollowFrame = requestAnimationFrame(step);
  },

  /* Der Vogel lässt den Stock genau in die Lücke zwischen den ersten Tannen fallen. */
  dropCarriedStick() {
    if (!this.birdCarryStick || !this.birdCarryEl || this.scene !== 'outdoor') return;
    this.birdCarryStick = false;
    this.birdWillDrop = false;
    this.stickDropped = true;
    if (this.birdFollowFrame) {
      cancelAnimationFrame(this.birdFollowFrame);
      this.birdFollowFrame = null;
    }
    const scene = document.getElementById('scene');
    const stick = this.birdCarryEl;
    this.birdCarryEl = null;
    if (!scene || !stick.parentNode) return;

    const p = this.sceneCoords(stick, scene);
    if (!p) return;
    const startLeft = Math.round(p.left);
    const startBottom = Math.round(p.bottom);
    stick.style.width = '30px';
    stick.style.left = startLeft + 'px';
    stick.style.bottom = startBottom + 'px';
    stick.classList.add('ground-stick', 'falling-stick');
    this.say('Der Vogel lässt einen Stock fallen – er landet ganz links zwischen den Tannen!');

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { fallAnim.cancel(); } catch (e) { /* ignore */ }
      stick.style.left = '99px';
      stick.style.bottom = '145px';
      stick.style.transform = 'none';
      if (this.scene === 'outdoor' && !document.querySelector('.hotspot[data-action="stick"]')) {
        document.getElementById('scene').appendChild(this.hotspot('84px', '136px', '64px', '36px', 'stick'));
      }
    };
    const fallAnim = stick.animate([
      { left: startLeft + 'px', bottom: startBottom + 'px', transform: 'rotate(-12deg)', offset: 0 },
      { left: '99px', bottom: '162px', transform: 'rotate(9deg)', offset: 0.68 },
      { left: '99px', bottom: '145px', transform: 'rotate(0deg)', offset: 1 }
    ], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    fallAnim.onfinish = finish;
    setTimeout(finish, 720);
  },

  startFlap() {
    this.stopFlap();
    let frame = 0;
    this.flapTimer = setInterval(() => {
      if (!this.bird) return;
      frame = 1 - frame;
      this.bird.src = frame ? ASSETS.birdFly2 : ASSETS.birdFly1;
    }, 120);
  },

  stopFlap() {
    if (this.flapTimer) { clearInterval(this.flapTimer); this.flapTimer = null; }
  },

  /* ---------- Rodelrennen ---------- */
  startRace() {
    // Aufräumen eines evtl. laufenden Rennens
    this.raceClear();
    this.scene = 'race';
    this.raceActive = true;
    this.raceEnded = false;
    this.raceWon = false;
    this.raceHearts = 2;
    this.raceHits = 0;
    this.raceStart = performance.now();
    this.raceObstacles = [];
    this.raceJumping = false;
    this.raceCharge = 0;
    this.raceJumpStartAt = 0;
    this.raceJumpH = 0;
    this.raceJumpDuration = 500;
    this.raceBoost = 0;
    this.raceWipey = 0;
    this.raceTrailCounter = 0;
    this.raceSpeed = 230;
    this.raceWhooshed = false;
    this.raceGateShown = false;
    this.raceFinishing = false;
    this.raceFinishTimer = null;
    this.raceSnowTimer = setInterval(() => this.snowdriftEmitter(), 500);
    this.renderScene();
    SFX.boost();
    this.say('Auf die Plätze, fertig, los! Tippe, um zu springen.');
    // Erstes Hindernis
    this.raceSpawnTimer = setTimeout(() => this.spawnObstacle(), 1000);
    this.raceLoop = setTimeout(() => this.raceTick(performance.now()), 16);
  },

  snowdriftEmitter() {
    const scene = document.getElementById('scene');
    if (!scene) return;
    const rider = document.querySelector('.race-rider');
    const speed = this.raceSpeed || 230;
    const riderPos = rider ? this.sceneCoords(rider, scene) : null;
    const baseX = riderPos ? riderPos.left + 40 : 95;
    const n = 2 + Math.floor(speed / 120);
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'snow-drift';
      d.style.left = (baseX + Math.random() * 260) + 'px';
      d.style.top = (30 + Math.random() * 120) + 'px';
      d.style.opacity = (0.4 + Math.random() * 0.4) + '';
      scene.appendChild(d);
      setTimeout(() => d.remove(), 1600);
    }
  },

  raceClear() {
    if (this.raceLoop) { clearTimeout(this.raceLoop); this.raceLoop = null; }
    if (this.raceSpawnTimer) { clearTimeout(this.raceSpawnTimer); this.raceSpawnTimer = null; }
    // Hindernisse entfernen
    this.raceObstacles.forEach(o => { try { o.el.remove(); } catch (e) { /* ignore */ } });
    this.raceObstacles = [];
    this.raceActive = false;
    this.raceJumping = false;
    this.raceCharge = 0;
    this.raceBoost = 0;
    this.raceWipey = 0;
    this.raceTrailCounter = 0;
    this.raceFinishing = false;
    this.raceGateShown = false;
    if (this.raceFinishTimer) { clearTimeout(this.raceFinishTimer); this.raceFinishTimer = null; }
    if (this.raceSnowTimer) { clearInterval(this.raceSnowTimer); this.raceSnowTimer = null; }
    if (this.raceChargeTimer) { clearInterval(this.raceChargeTimer); this.raceChargeTimer = null; }
    // remove stray snowdrifts
    document.querySelectorAll('.snow-drift').forEach(el => el.remove());
  },

  /* HOLD/TAP Sprungsystem */
  /* Klick/Tap ins Spielfeld: sofortiger Sprung (zuverlässig, auch ohne Halten). */
  raceJump() {
    if (!this.raceActive || this.raceEnded) return;
    if (this.raceJumping) { this.raceJumpBoost(); return; }
    this.raceCharge = 0.35;
    this.raceJumpRelease();
  },
  raceJumpStart() {
    if (!this.raceActive || this.raceEnded) return;
    this.raceJumpStartAt = performance.now();
    this.raceCharge = 0;
  },
  raceJumpCharge(tMax) {
    if (!this.raceActive || this.raceEnded) return;
    this.raceCharge = Math.min(1, (performance.now() - this.raceJumpStartAt) / Math.max(1, tMax || 420));
  },
  raceJumpRelease() {
    if (!this.raceActive || this.raceEnded) return;
    if (this.raceJumping) { this.raceJumpBoost(); return; }
    this.raceJumping = true;
    const c = Math.min(1, this.raceCharge);
    this.raceCharge = 0;
    this.raceJumpStartAt = performance.now();
    this.raceJumpH = this.raceJumpHeight * c + 36;
    this.raceJumpDuration = 500;
    SFX.jump();
  },
  raceJumpBoost() {
    if (!this.raceActive || this.raceEnded || !this.raceJumping) return;
    this.raceJumpStartAt = performance.now();
    this.raceJumpH = Math.min(140, this.raceJumpH + 22);
    this.raceBoost = 1;
    SFX.jump();
  },

  spawnObstacle() {
    if (!this.raceActive || this.raceEnded) return;
    const scene = document.getElementById('scene');
    if (!scene) return;
    const types = ['drift', 'rock'];
    const type = types[Math.floor(Math.random() * types.length)];
    const src = type === 'drift' ? ASSETS.obstacleDrift : ASSETS.obstacleRock;
    const w = type === 'drift' ? 40 : 32;
    const h = 24;
    const el = document.createElement('img');
    el.src = src;
    el.alt = '';
    el.className = 'pixel-sprite race-obstacle';
    Object.assign(el.style, { left: '820px', bottom: '145px', width: w + 'px', zIndex: '11' });
    scene.appendChild(el);
    this.raceObstacles.push({ el, x: 820, w, h, type, hit: false, passed: false });

    // Nächstes Hindernis
    const next = 1000 + Math.random() * 300;
    this.raceSpawnTimer = setTimeout(() => this.spawnObstacle(), next);
  },

  raceTick(now) {
    if (!this.raceActive || this.raceFinishing) return;
    const elapsed = now - this.raceStart;
    const rider = document.querySelector('.race-rider');
    let jumpY = 0;
    this.raceWipey = Math.max(0, this.raceWipey - 1);

    if (this.raceJumping) {
      const t = (now - this.raceJumpStartAt) / this.raceJumpDuration;
      if (t >= 1) {
        this.raceJumping = false;
        this.raceWipey = 8; // Squash-Effekt bei der Landung
      } else {
        jumpY = 4 * this.raceJumpH * t * (1 - t);
      }
    }

    // Geschwindigkeit steigt nach 3 s leicht an
    let speed = this.raceSpeed || 230;
    if (elapsed > 3000) speed = Math.min(340, speed + (elapsed - 3000) / 1000 * 0.35);
    this.raceSpeed = speed;
    if (speed > 330 && !this.raceWhooshed) { SFX.whoosh(); this.raceWhooshed = true; }
    const move = speed * (16 / 1000);
    const sledLeft = 96;
    const sledRight = 196;

    if (rider) rider.style.bottom = (145 + jumpY) + 'px';
    if (rider) rider.classList.toggle('race-fast', speed >= 330);
    this.raceEmitTrail(rider, speed);

    if (rider && this.raceWipey > 0) {
      rider.classList.add('race-squash');
      setTimeout(() => rider.classList.remove('race-squash'), 300);
    }

    this.raceObstacles.forEach(o => {
      const prevX = o.x;
      o.x -= move;
      o.el.style.left = o.x + 'px';
      if (o.hit || o.passed) return;
      const crossed = (prevX + o.w > sledLeft && o.x < sledRight) ||
                      (prevX >= sledRight && o.x + o.w <= sledLeft);
      if (!crossed) return;
      if (jumpY < 28) {
        o.hit = true;
        this.raceHits++;
        this.raceHearts = Math.max(0, this.raceHearts - 1);
        this.raceUpdateHud();
        if (rider) {
          rider.classList.remove('stumble');
          void rider.offsetWidth;
          rider.classList.add('stumble');
          setTimeout(() => rider.classList.remove('stumble'), 450);
        }
        const scene = document.getElementById('scene');
        if (scene && rider) {
          const p = this.sceneCoords(rider, scene);
          if (p) {
            for (let k = 0; k < 4; k++) {
              const sp = document.createElement('div');
              sp.className = 'race-sparkle';
              sp.style.left = (p.left + Math.random() * p.width) + 'px';
              sp.style.bottom = (p.bottom + 2) + 'px';
              scene.appendChild(sp);
              setTimeout(() => sp.remove(), 900);
            }
          }
        }
        if (this.raceHearts <= 0) { this.endRace(false); return; }
      } else {
        SFX.obstacle(o.type);
      }
      o.passed = true;
    });

    this.raceObstacles = this.raceObstacles.filter(o => {
      if (o.x + o.w < -40) {
        try { o.el.remove(); } catch (e) { /* ignore */ }
        return false;
      }
      return true;
    });

    // Ziel erst kurz vor dem Ende einblenden – während der Fahrt bleibt es weg.
    if (!this.raceGateShown && elapsed >= this.raceDuration - 1400) {
      this.raceGateShown = true;
      const gate = document.getElementById('race-finish-gate');
      if (gate) gate.classList.add('race-gate-visible');
      this.say('Das Ziel ist in Sicht! Halte dich fest! 🏁');
    }

    // Zeit vorbei → Rodel fährt jetzt sichtbar ins Ziel
    if (elapsed >= this.raceDuration) {
      this.startRaceFinish();
      return;
    }

    this.raceUpdateProgress(elapsed);
    this.raceLoop = setTimeout(() => this.raceTick(performance.now()), 16);
  },

  /* Letzte Sekunde: Rodel rast nach rechts durch das Zielbanner. */
  startRaceFinish() {
    if (this.raceEnded || this.raceFinishing) return;
    this.raceFinishing = true;
    this.raceGateShown = true;
    const gate = document.getElementById('race-finish-gate');
    if (gate) gate.classList.add('race-gate-visible');
    if (this.raceSpawnTimer) { clearTimeout(this.raceSpawnTimer); this.raceSpawnTimer = null; }
    this.raceObstacles.forEach(o => { try { o.el.remove(); } catch (e) { /* ignore */ } });
    this.raceObstacles = [];
    this.raceUpdateProgress(this.raceDuration);

    const rider = document.querySelector('.race-rider');
    if (rider) {
      rider.classList.remove('race-squash', 'race-fast');
      rider.classList.add('race-finish-run');
    }
    this.raceSpeed = 360;
    SFX.whoosh();
    this.say('Ziel im Sicht! Charlotte rast ins Ziel! 🏁');

    const scene = document.getElementById('scene');
    if (scene && rider) {
      const p = this.sceneCoords(rider, scene);
      if (p) {
        for (let k = 0; k < 10; k++) {
          const sp = document.createElement('div');
          sp.className = 'race-sparkle';
          sp.style.left = (p.left + Math.random() * p.width) + 'px';
          sp.style.bottom = (p.bottom + Math.random() * 12) + 'px';
          sp.style.animationDelay = (k * 0.06) + 's';
          scene.appendChild(sp);
          setTimeout(() => sp.remove(), 1100);
        }
      }
    }
    this.raceFinishTimer = setTimeout(() => this.endRace(true), 1250);
  },

  raceUpdateHud() {
    const heartsEl = document.getElementById('race-hearts');
    if (heartsEl) {
      const hearts = Math.max(0, Math.min(2, this.raceHearts));
      heartsEl.innerHTML = '❤️'.repeat(hearts) + '🖤'.repeat(2 - hearts);
    }
  },

  /* Schnee-Streifen & Sparkle hinter dem Rodel */
  raceEmitTrail(sled, speed) {
    if (!sled) return;
    if (!this.raceTrailCounter) this.raceTrailCounter = 0;
    this.raceTrailCounter = (this.raceTrailCounter + 1) % 2;
    if (this.raceTrailCounter || speed < 260) return;

    const scene = document.getElementById('scene');
    if (!scene) return;
    const base = this.sceneCoords(sled, scene);
    if (!base || base.right > 800 + 60) return; // unsichtbar

    const dust = document.createElement('div');
    dust.className = 'race-trail-dust';
    const w = 8 + Math.random() * 12;
    dust.style.width = w + 'px';
    dust.style.height = w + 'px';
    dust.style.background = `radial-gradient(circle, #fffbe0 0%, #ff9 0%, rgba(255,200,0,0) 70%)`;
    dust.style.left = (base.left - 20) + 'px';
    dust.style.bottom = (base.bottom + Math.random() * 8) + 'px';
    dust.style.zIndex = '10';
    dust.style.opacity = '0.75';
    scene.appendChild(dust);

    // Faden: sanft abfadeichten
    const t0 = performance.now();
    const go = () => {
      const el = dust;
      if (!el.parentNode) return;
      const alpha = Math.max(0, 1 - (performance.now() - t0) / 400);
      el.style.opacity = (0.75 * alpha) + '';
      if (alpha > 0.02) requestAnimationFrame(go);
      else el.remove();
    };
    requestAnimationFrame(go);
  },

  raceUpdateProgress(elapsed) {
    const bar = document.getElementById('race-progress');
    if (bar) {
      const pct = Math.min(100, (elapsed / this.raceDuration) * 100);
      bar.style.width = pct + '%';
    }
  },

  endRace(win) {
    if (this.raceEnded) return;
    this.raceEnded = true;
    this.raceActive = false;
    this.raceClear();
    // raceClear setzt raceActive=false und entfernt Hindernisse, aber wir wollen die Szene behalten
    this.scene = 'race';
    if (win) {
      this.raceWon = true;
      SFX.win();
      this.say('Gewonnen! Charlotte rast ins Ziel! 🎉');
      setTimeout(() => this.showEndScreen(), 900);
    } else {
      SFX.stumble();
      this.say('Autsch! Nochmal versuchen?');
      // Retry-Overlay
      const scene = document.getElementById('scene');
      if (scene) {
        const overlay = document.createElement('div');
        overlay.id = 'race-retry';
        overlay.className = 'race-retry';
        overlay.innerHTML = '<div class="race-retry-box">Autsch! 💥<br><button id="race-retry-btn">Nochmal versuchen</button></div>';
        scene.appendChild(overlay);
        const btn = overlay.querySelector('#race-retry-btn');
        if (btn) btn.addEventListener('click', () => {
          overlay.remove();
          this.startRace();
        });
      }
    }
  },

  showEndScreen() {
    const title = document.getElementById('end-title');
    const msg = document.getElementById('end-message');
    const dist = document.getElementById('end-stat-dist');
    const stats = document.getElementById('end-stats');
    // Erst sichtbar machen, sonst liefert getBoundingClientRect() Nullwerte
    // und die Funken landen außerhalb der Szene.
    this.endScreen.style.display = 'flex';
    if (this.raceWon) {
      title.textContent = '🎄 FROHE WEIHNACHTEN! 🎄';
      msg.textContent = 'Charlotte hat das Rodel bis zum Ziel gerollt! 🎉';
      dist.textContent = 'Geschwindigkeit: ' + (this.raceSpeed || 230).toFixed(0) + ' km/h';
      stats.style.display = 'flex';
      this.fireworkOnEnd();
    } else {
      title.textContent = '🎄 Frohe Weihnachten! 🎄';
      msg.textContent = 'Autsch! Du hast heruntergefallen. Versuche es erneut!';
      stats.style.display = 'none';
    }
    this.spawnEndDrifts();
  },

  hideEndScreen() {
    this.endScreen.style.display = 'none';
    if (this.endDriftTimer) { clearInterval(this.endDriftTimer); this.endDriftTimer = null; }
    document.querySelectorAll('.snow-drift').forEach(el => el.remove());
  },

  /* ==================== BONUS-LEVEL: KUGELREGEN ==================== */
  /* Vier Kugelfarben fallen von oben. Charlotte läuft mit Pfeiltasten/A-D
     oder folgt dem Finger; der Highscore bleibt im localStorage gespeichert. */

  loadBonusHighScore() {
    try {
      const value = parseInt(localStorage.getItem(BONUS_HIGHSCORE_KEY) || '0', 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch (e) { return 0; }
  },

  saveBonusHighScore(value) {
    try { localStorage.setItem(BONUS_HIGHSCORE_KEY, String(value)); } catch (e) { /* ignore */ }
  },

  renderBonus(container) {
    const player = document.createElement('img');
    player.id = 'bonus-player';
    player.src = ASSETS.charlotte;
    player.alt = '';
    player.className = 'pixel-sprite bonus-player';
    Object.assign(player.style, {
      width: '80px', bottom: '145px', left: (this.bonusPlayerX - 40) + 'px', zIndex: '12'
    });
    container.appendChild(player);

    const basket = document.createElement('div');
    basket.id = 'bonus-basket';
    basket.className = 'bonus-basket';
    basket.style.left = (this.bonusPlayerX - 48) + 'px';
    basket.style.bottom = '145px';
    container.appendChild(basket);

    const hud = document.createElement('div');
    hud.id = 'bonus-hud';
    hud.className = 'bonus-hud';
    container.appendChild(hud);

    const legend = document.createElement('div');
    legend.id = 'bonus-legend';
    legend.className = 'bonus-legend';
    legend.innerHTML = BONUS_ORNAMENTS.map(o =>
      '<span><img src="' + o.src + '" alt="">+' + o.points + '</span>'
    ).join('');
    container.appendChild(legend);

    const hint = document.createElement('div');
    hint.id = 'bonus-hint';
    hint.className = 'bonus-hint';
    hint.textContent = 'Kugeln fangen! Tippen & ziehen oder ← →';
    container.appendChild(hint);
    setTimeout(() => { if (hint.parentNode) hint.remove(); }, 2600);

    this.bonusUpdateHud();
  },

  startBonus() {
    this.stopBonus();
    this.hideEndScreen();
    this.hideBonusResult();
    this.scene = 'bonus';
    this.bonusActive = true;
    this.bonusEnded = false;
    this.bonusScore = 0;
    this.bonusCaught = 0;
    this.bonusMissed = 0;
    this.bonusItems = [];
    this.bonusSpawnAcc = 0;
    this.bonusPlayerX = 400;
    this.bonusMoveDir = 0;
    this.bonusPointerX = null;
    this.bonusStartAt = performance.now();
    this.bonusLastTs = 0;
    this.renderScene();
    this.say('Fange die fallenden Weihnachtskugeln! 🎁');
    SFX.start();
    this.bonusLoop = requestAnimationFrame(t => this.bonusTick(t));
  },

  bonusUpdateHud() {
    const hud = document.getElementById('bonus-hud');
    if (!hud) return;
    const left = Math.max(0, this.bonusDuration - (performance.now() - this.bonusStartAt));
    hud.innerHTML = '<span>Punkte: <b>' + this.bonusScore + '</b></span>' +
      '<span>Zeit: <b>' + Math.ceil(left / 1000) + 's</b></span>' +
      '<span>Rekord: <b>' + this.bonusHighScore + '</b></span>';
  },

  bonusTick(ts) {
    if (!this.bonusActive) return;
    if (!this.bonusLastTs) this.bonusLastTs = ts;
    const dt = Math.min(0.05, (ts - this.bonusLastTs) / 1000);
    this.bonusLastTs = ts;

    const elapsed = performance.now() - this.bonusStartAt;
    const progress = Math.min(1, elapsed / this.bonusDuration);
    if (elapsed >= this.bonusDuration) {
      this.endBonus();
      return;
    }

    // Spieler bewegen: Tasten haben Vorrang, sonst folgt er dem Zeiger.
    let nextX = this.bonusPlayerX;
    if (this.bonusMoveDir) {
      nextX += this.bonusMoveDir * 430 * dt;
    } else if (this.bonusPointerX != null) {
      const diff = this.bonusPointerX - nextX;
      nextX += Math.sign(diff) * Math.min(Math.abs(diff), 900 * dt);
    }
    this.bonusPlayerX = Math.max(52, Math.min(748, nextX));
    const player = document.getElementById('bonus-player');
    const basket = document.getElementById('bonus-basket');
    if (player) player.style.left = (this.bonusPlayerX - 40) + 'px';
    if (basket) basket.style.left = (this.bonusPlayerX - 48) + 'px';

    // Kugeln nachziehen – das Tempo nimmt leicht zu.
    this.bonusSpawnAcc += dt;
    const interval = 0.72 - 0.36 * progress;
    if (this.bonusSpawnAcc >= interval) {
      this.bonusSpawnAcc -= interval;
      this.spawnBonusOrnament(progress);
    }

    for (let i = this.bonusItems.length - 1; i >= 0; i--) {
      const item = this.bonusItems[i];
      item.y += item.vy * dt;
      item.wobble += item.wobbleSpeed * dt;
      item.x += Math.sin(item.wobble) * 10 * dt;
      item.angle += item.spin * dt;
      item.el.style.left = (item.x - 13) + 'px';
      item.el.style.top = (item.y - 16) + 'px';
      item.el.style.transform = 'rotate(' + item.angle.toFixed(1) + 'deg)';

      if (Math.abs(item.x - this.bonusPlayerX) < 50 && item.y >= 255 && item.y <= 305) {
        this.collectBonusOrnament(i);
      } else if (item.y > 330) {
        item.el.remove();
        this.bonusItems.splice(i, 1);
        this.bonusMissed++;
      }
    }

    this.bonusUpdateHud();
    this.bonusLoop = requestAnimationFrame(t => this.bonusTick(t));
  },

  spawnBonusOrnament(progress) {
    const scene = document.getElementById('scene');
    if (!scene) return;
    const variant = BONUS_ORNAMENTS[Math.floor(Math.random() * BONUS_ORNAMENTS.length)];
    const el = document.createElement('img');
    el.src = variant.src;
    el.alt = '';
    el.className = 'pixel-sprite bonus-ornament';
    el.style.width = '26px';
    const x = 40 + Math.random() * 720;
    const y = -30;
    el.style.left = (x - 13) + 'px';
    el.style.top = (y - 16) + 'px';
    el.style.zIndex = '14';
    scene.appendChild(el);
    this.bonusItems.push({
      el: el, x: x, y: y,
      vy: 150 + progress * 140 + Math.random() * 70,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 220,
      wobble: Math.random() * 6,
      wobbleSpeed: 2 + Math.random() * 2,
      points: variant.points
    });
  },

  collectBonusOrnament(index) {
    const item = this.bonusItems[index];
    if (!item) return;
    this.bonusScore += item.points;
    this.bonusCaught++;
    SFX.coin();
    this.bonusPop(item.x, item.y, '+' + item.points);
    item.el.remove();
    this.bonusItems.splice(index, 1);
  },

  bonusPop(x, y, text) {
    const scene = document.getElementById('scene');
    if (!scene) return;
    const pop = document.createElement('div');
    pop.className = 'bonus-pop';
    pop.textContent = text;
    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
    scene.appendChild(pop);
    setTimeout(() => { if (pop.parentNode) pop.remove(); }, 750);
  },

  endBonus() {
    if (!this.bonusActive) return;
    this.stopBonus();

    const record = this.bonusScore > this.bonusHighScore;
    if (record) {
      this.bonusHighScore = this.bonusScore;
      this.saveBonusHighScore(this.bonusScore);
      SFX.win();
    } else {
      SFX.coin();
    }

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set('bonus-result-title', record ? '🎉 Neuer Rekord!' : '🎁 Bonus-Level beendet!');
    set('bonus-result-score', 'Punkte: ' + this.bonusScore);
    set('bonus-result-high', 'Highscore: ' + this.bonusHighScore);
    set('bonus-result-extra', 'Gefangen: ' + this.bonusCaught + ' Kugeln · Verpasst: ' + this.bonusMissed);
    if (this.bonusResult) this.bonusResult.style.display = 'flex';
    this.say('Bonus-Level geschafft! Dein Highscore: ' + this.bonusHighScore + ' Punkte.');
  },

  stopBonus() {
    this.bonusActive = false;
    this.bonusEnded = true;
    if (this.bonusLoop) { cancelAnimationFrame(this.bonusLoop); this.bonusLoop = null; }
    this.bonusItems.forEach(item => item.el.remove());
    this.bonusItems = [];
    this.bonusMoveDir = 0;
    this.bonusPointerX = null;
  },

  hideBonusResult() {
    if (this.bonusResult) this.bonusResult.style.display = 'none';
  },

  spawnEndDrifts() {
    const scene = document.getElementById('scene');
    if (!scene) return;
    for (let i = 0; i < 8; i++) {
      const d = document.createElement('div');
      d.className = 'snow-drift';
      d.style.left = (20 + Math.random() * 700) + 'px';
      d.style.top = Math.random() * 450 + 'px';
      d.style.animationDuration = (1.0 + Math.random() * 1.5) + 's';
      d.style.opacity = (0.3 + Math.random() * 0.6) + '';
      scene.appendChild(d);
    }
    if (!this.endDriftTimer) {
      this.endDriftTimer = setInterval(() => {
        const scene = document.getElementById('scene');
        if (!scene) return;
        const d = document.createElement('div');
        d.className = 'snow-drift';
        d.style.left = (20 + Math.random() * 760) + 'px';
        d.style.top = '30px';
        d.style.animationDuration = (1.0 + Math.random() * 1.5) + 's';
        d.style.opacity = (0.3 + Math.random() * 0.6) + '';
        scene.appendChild(d);
        setTimeout(() => d.remove(), 2000);
      }, 700);
    }
  },

  /* Ende-Sprühwechsel: kleine Funken über dem Titel */
  fireworkOnEnd() {
    const scene = document.getElementById('scene');
    if (!scene) return;
    const title = document.getElementById('end-title');
    const r = this.sceneCoords(title, scene);
    if (!r) return;
    const area = document.getElementById('end-sparkle-area');
    if (!area) return;
    area.querySelectorAll('.end-spark').forEach(sp => sp.remove());
    for (let i = 0; i < 12; i++) {
      const sp = document.createElement('div');
      sp.className = 'end-spark';
      sp.style.left = (r.left + r.width * 0.5 + (Math.random() - 0.5) * r.width * 1.2) + 'px';
      sp.style.top = (r.top - 10) + 'px';
      const d = 20 + Math.random() * 70;
      const a = Math.random() * Math.PI * 2;
      sp.style.setProperty('--dx', Math.cos(a) * d + 'px');
      sp.style.setProperty('--dy', Math.sin(a) * d + 'px');
      sp.style.setProperty('--dur', (0.4 + Math.random() * 1.2) + 's');
      area.appendChild(sp);
      setTimeout(() => sp.remove(), 1500);
    }
  },

  /* ---------- Vollbildmodus ---------- */
  isFullscreenActive() {
    const shell = document.getElementById('game-shell');
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
      (shell && shell.classList.contains('is-pseudo-fullscreen')));
  },

  updateFullscreenButton(active) {
    const btn = this.fullscreenBtn;
    if (!btn) return;
    btn.textContent = active ? '✕' : '⛶';
    btn.setAttribute('aria-label', active ? 'Vollbild beenden' : 'Vollbildmodus');
    btn.setAttribute('title', active ? 'Vollbild beenden' : 'Vollbild');
  },

  refitAfterFullscreenChange() {
    requestAnimationFrame(() => this.fitToViewport());
    setTimeout(() => this.fitToViewport(), 120);
  },

  enterPseudoFullscreen() {
    const shell = document.getElementById('game-shell');
    if (!shell || shell.classList.contains('is-pseudo-fullscreen')) return;
    shell.classList.add('is-pseudo-fullscreen');
    this.updateFullscreenButton(true);
    this.refitAfterFullscreenChange();
  },

  toggleFullscreen() {
    const shell = document.getElementById('game-shell');
    if (!shell) return;

    if (this.isFullscreenActive()) {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) {
          try {
            const p = exit.call(document);
            if (p && p.catch) p.catch(() => {});
          } catch (e) { /* ignore */ }
        }
        try {
          if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
        } catch (e) { /* ignore */ }
      } else {
        shell.classList.remove('is-pseudo-fullscreen');
      }
      this.updateFullscreenButton(false);
      this.refitAfterFullscreenChange();
      return;
    }

    const request = shell.requestFullscreen || shell.webkitRequestFullscreen;
    // iOS Safari kennt kein Element-Fullscreen → CSS-Vollbild als Fallback.
    if (!request) {
      this.enterPseudoFullscreen();
      return;
    }
    try {
      const p = request.call(shell);
      let settled = false;
      const fallback = () => {
        if (settled || this.isFullscreenActive()) return;
        settled = true;
        this.enterPseudoFullscreen();
      };
      if (p && p.then) {
        p.then(() => { settled = true; }, fallback);
      }
      // Manche Browser bleiben bei file:// oder iOS ohne Promise hängen.
      setTimeout(fallback, 500);
      // Auf Mobilgeräten im Vollbild quer formatieren, wo unterstützt.
      if (screen.orientation && screen.orientation.lock) {
        try {
          const lock = screen.orientation.lock('landscape');
          if (lock && lock.catch) lock.catch(() => {});
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      this.enterPseudoFullscreen();
    }
  },

  onFullscreenChange() {
    const shell = document.getElementById('game-shell');
    const real = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (real && shell) shell.classList.remove('is-pseudo-fullscreen');
    const pseudo = !!(shell && shell.classList.contains('is-pseudo-fullscreen'));
    if (real || pseudo) {
      this.updateFullscreenButton(true);
    } else {
      this.updateFullscreenButton(false);
    }
    this.refitAfterFullscreenChange();
  },

  /* Skaliert die feste 800x450-Szene passgenau in jedes Display.
     Optional mit width/height aufrufbar – praktisch für Tests. */
  fitToViewport(width, height) {
    const game = document.getElementById('game');
    if (!game) return;
    const vw = width || (window.visualViewport ? window.visualViewport.width : window.innerWidth);
    const vh = height || (window.visualViewport ? window.visualViewport.height : window.innerHeight);
    const pad = 12;
    const raw = Math.min((vw - pad) / 800, (vh - pad) / 450, 1);
    const scale = Math.max(0.2, raw);
    // UI-Schrift wächst bei kleiner Scale mit, damit sie lesbar bleibt.
    const uiBoost = Math.min(2.2, Math.max(1, 0.62 / scale));
    const strongBoost = Math.min(2.8, Math.max(1, 0.85 / scale));
    // Endbildschirm darf nicht zu hoch werden – daher ein gedeckelter Boost.
    const endBoost = Math.min(1.35, uiBoost);
    const endStrong = Math.min(1.6, strongBoost);
    game.style.transform = 'scale(' + scale + ')';
    game.dataset.scale = scale.toFixed(3);
    game.style.setProperty('--ui-boost', uiBoost.toFixed(3));
    game.style.setProperty('--ui-boost-strong', strongBoost.toFixed(3));
    game.style.setProperty('--end-boost', endBoost.toFixed(3));
    game.style.setProperty('--end-strong', endStrong.toFixed(3));
    game.style.setProperty('--bottom-h', Math.round(90 * uiBoost) + 'px');
    game.style.setProperty('--inv-w', Math.round(168 * uiBoost) + 'px');
  },

  restart() {
    this.scene = 'outdoor';
    this.inventory = [];
    this.sledFixed = false;
    this.toolboxOpen = false;
    this.ornamentFell = false;
    this.stickDropped = false;
    this.birdWillDrop = false;
    this.firstInteractionDone = false;
    this.firstBirdDone = false;
    this.charlotteLine = 0;
    this.repairing = false;
    this.raceActive = false;
    this.raceWon = false;
    this.raceEnded = false;
    this.raceClear();
    this.stopBird();
    this.stopBonus();
    this.updateInventory();
    this.hideEndScreen();
    this.hideBonusResult();
    this.renderScene();
    this.say(WELCOME_TEXT);
  },

  say(text) {
    this.dialog.textContent = text;
  },

  updateInventory() {
    if (!this.invSlots) return;
    this.invSlots.innerHTML = '';

    // Drei feste Plätze – wie ein kleiner Werkzeuggürtel.
    const slotCount = 3;
    for (let i = 0; i < slotCount; i++) {
      const slot = document.createElement('div');
      const item = this.inventory[i];
      const info = item ? INVENTORY_ITEMS[item] : null;

      if (info) {
        slot.className = 'inv-slot is-filled';
        slot.dataset.label = info.label;
        slot.title = info.label;
        const img = document.createElement('img');
        img.src = info.icon;
        img.alt = info.label;
        img.className = 'inv-item-img';
        slot.appendChild(img);
      } else {
        slot.className = 'inv-slot is-empty';
      }
      this.invSlots.appendChild(slot);
    }

    const namen = this.inventory
      .map(item => INVENTORY_ITEMS[item] && INVENTORY_ITEMS[item].label)
      .filter(Boolean);
    if (this.invStatus) {
      this.invStatus.textContent = namen.length ? namen.join(', ') : 'Noch nichts gefunden';
    }
  }
};

// Start
GAME.start();
