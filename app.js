/**
 * Aetherius Pet Edition - app.js
 * Implements: Pet simulator mechanics, LocalStorage data persistence, Gemini API Translator, Web Audio Synth, html2canvas ID card export.
 * Photo diary, milestone badges, hamburger nav toggle.
 */

/* ==========================================================================
   0. Toast Notification System
   ========================================================================== */
function showToast(message) {
  // Remove existing toast if any
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <span class="toast-success-icon"></span>
    ${message}
  `;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

/* ==========================================================================
   1. Background Floating Particles
   ========================================================================== */
function initParticles() {
  const container = document.getElementById('particles-js') || document.body;
  const particleCount = 20;
  
  let pContainer = document.querySelector('.particles');
  if (!pContainer) {
    pContainer = document.createElement('div');
    pContainer.className = 'particles';
    container.appendChild(pContainer);
  }

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}vw`;
    
    const duration = Math.random() * 12 + 12;
    const delay = Math.random() * -24;
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${delay}s`;
    p.style.opacity = (Math.random() * 0.25 + 0.1).toString();
    
    pContainer.appendChild(p);
  }
}

/* ==========================================================================
   2. Pet Edition State & Data Store
   ========================================================================== */
let geminiApiKey = localStorage.getItem('GEMINI_API_KEY') || '';
let kakaoAppKey = localStorage.getItem('KAKAO_APP_KEY') || '';

// Active Pet Session Variables
let petProfile = {
  mode: 'companion',
  name: '초코',
  type: 'dog',
  personality: 'friendly',
  snack: '츄르',
  owner: '엄마',
  level: 1,
  xp: 0,
  hunger: 50,
  joy: 50,
  totalActions: 0,
  badges: []
};

// Lists of User Saved Content
let diaryEntries = [];
let letterHistory = [];
let currentDiaryPhoto = null; // base64 data URL of uploaded photo

const petAvatars = {
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  hamster: '🐹'
};

const petTypeNames = {
  dog: '강아지',
  cat: '고양이',
  rabbit: '토끼',
  hamster: '햄스터'
};

const personalityNames = {
  friendly: '애교쟁이',
  glutton: '식탐왕 먹보',
  chic: '시크하고 시크한',
  timid: '소심한 겁쟁이',
  reliable: '든든한 경호원'
};

// Milestone badge definitions
const milestones = [
  { id: 'first_feed', name: '첫 간식', icon: '🍖', desc: '처음으로 간식을 줬어요!', check: (p) => p.totalActions >= 1 },
  { id: 'lv3', name: '찐친', icon: '💕', desc: '친밀도 레벨 3 달성!', check: (p) => p.level >= 3 },
  { id: 'lv5', name: '소울메이트', icon: '🌟', desc: '친밀도 레벨 5 달성!', check: (p) => p.level >= 5 },
  { id: 'diary3', name: '추억 수집가', icon: '📸', desc: '추억 앨범 3개 작성!', check: () => diaryEntries.length >= 3 },
  { id: 'letter3', name: '다정한 우편사', icon: '✉️', desc: '편지 3통 교환!', check: () => letterHistory.length >= 3 },
  { id: 'actions50', name: '헌신적인 보호자', icon: '🏅', desc: '50번 교감 달성!', check: (p) => p.totalActions >= 50 }
];

// Fallback letter responses (for users without API key)
const fallbackReplies = {
  angel: [
    `오랜만에 내 이름 불러줘서 고마워, {owner}! 
    나 여기 무지개다리 너머 구름 동산에서 매일 맛있는 {snack} 먹으면서 다른 친구들이랑 씩씩하게 잘 뛰어놀고 있어! 
    {owner}가 나 보고 싶다고 울 때마다 내 코끝이 찡해지곤 해. 그러니까 나 보고 싶어도 너무 울지 말고, 밥 잘 챙겨 먹어야 해. 
    내가 언제나 {owner} 마음속에 예쁜 별이 되어 밤마다 반짝반짝 비춰줄게. 사랑해 멍멍!`,
    
    `안녕, {owner}! 나야, {name}.
    여기 하늘나라는 날씨가 매일 포근하고 따뜻해. 내가 좋아하는 {snack}도 가득해서 배고플 틈이 전혀 없단다. 
    가끔 바람이 불 때 {owner} 볼을 스쳐 지나가는 게 있다면, 내가 반가워서 코를 킁킁 부비고 간 거라고 생각해 줘! 
    나랑 같이 써왔던 추억 다이어리 보면서 가끔씩 미소 지어주면 난 그걸로도 정말 행복해. 
    나중에 다시 만날 때까지 건강하게 잘 지내야 해. 늘 고마워!`
  ],
  companion: [
    `엄마아빠! 나 {name}야! 오늘 나한테 {snack} 줘서 기분 최고야!
    사실 {owner}가 집에 갈 준비 할 때 난 문 앞에 찰싹 붙어서 발소리만 기다리고 있어. 
    내가 꼬리를 세차게 흔들거나 야옹 울면서 부비는 건 "오늘 하루도 내 생각 해줘서 고맙고 사랑해!"라는 뜻이야. 
    오늘 밤엔 우리 푹신한 침대 위에서 찰떡같이 꼭 달라붙어서 같이 코 자자!`,
    
    `음... {owner}, 하고 싶은 말이 있다냥!
    내가 다리를 부비부비하고 꾹꾹이 해주는 건 그냥 하는 게 아니야. {owner}한테서 나는 냄새가 이 세상에서 가장 아늑하고 안심이 되기 때문이지! 
    가끔씩 맛있는 간식도 주고 나랑 뒹굴며 놀아줘서 내 묘생(견생)은 매일매일이 축제 같아. 
    앞으로도 우리 맛있는 것 먹으면서 오랫동안 행복한 추억 가득가득 쌓아가자!`
  ]
};

// Helper for API connection button indicator
function updateKeyButtonUI(hasKey) {
  const btn = document.getElementById('open-modal-btn');
  if (btn) {
    if (hasKey) {
      btn.innerHTML = `<span class="logo-icon" style="background-color: #2ecc71; box-shadow: 0 0 8px #2ecc71;"></span> API 연결됨`;
    } else {
      btn.innerHTML = `⚙️ API 키 입력`;
    }
  }
}

/* ==========================================================================
   3. Web Audio Synth Effects
   ========================================================================== */
let audioCtx = null;
let soundNodes = null;
let isPlayingAmbient = false;

const chords = [
  { bass: 55.00, pad: [110.00, 164.81, 196.00, 246.94] },
  { bass: 43.65, pad: [87.31, 130.81, 164.81, 220.00] },
  { bass: 49.00, pad: [98.00, 146.83, 164.81, 196.00] },
  { bass: 65.41, pad: [130.81, 164.81, 196.00, 246.94] }
];

function initAmbientSynth() {
  const musicBtn = document.getElementById('music-toggle-btn');
  if (!musicBtn) return;

  musicBtn.addEventListener('click', () => {
    if (!isPlayingAmbient) {
      startAmbientSynth();
      musicBtn.innerHTML = `🎵 사운드 켬`;
      musicBtn.classList.add('playing');
      musicBtn.style.background = 'rgba(226, 201, 116, 0.15)';
      isPlayingAmbient = true;
    } else {
      stopAmbientSynth();
      musicBtn.innerHTML = `🔇 사운드 끔`;
      musicBtn.classList.remove('playing');
      musicBtn.style.background = 'transparent';
      isPlayingAmbient = false;
    }
  });
}

function startAmbientSynth() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, audioCtx.currentTime);
    filter.Q.setValueAtTime(1.2, audioCtx.currentTime);

    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 3);

    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    const bassOsc = audioCtx.createOscillator();
    bassOsc.type = 'triangle';
    const bassGain = audioCtx.createGain();
    bassGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    bassOsc.connect(bassGain);
    bassGain.connect(filter);

    const padOscs = [];
    const padGains = [];
    for (let i = 0; i < 4; i++) {
      const osc = audioCtx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(filter);
      padOscs.push(osc);
      padGains.push(gain);
    }

    bassOsc.frequency.setValueAtTime(chords[0].bass, audioCtx.currentTime);
    for (let i = 0; i < 4; i++) {
      padOscs[i].frequency.setValueAtTime(chords[0].pad[i], audioCtx.currentTime);
    }

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 100;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    bassOsc.start(0);
    padOscs.forEach(osc => osc.start(0));
    lfo.start(0);

    let chordIndex = 0;
    const chordInterval = setInterval(() => {
      if (!audioCtx || audioCtx.state === 'closed') {
        clearInterval(chordInterval);
        return;
      }
      chordIndex = (chordIndex + 1) % chords.length;
      const currentChord = chords[chordIndex];
      const t = audioCtx.currentTime;
      
      bassOsc.frequency.exponentialRampToValueAtTime(currentChord.bass, t + 3.5);
      for (let i = 0; i < 4; i++) {
        padOscs[i].frequency.exponentialRampToValueAtTime(currentChord.pad[i], t + 3.5);
      }
    }, 9000);

    soundNodes = { bassOsc, padOscs, lfo, masterGain, audioCtx, chordInterval };
  } catch (e) {
    console.error('Failed to initialize Web Audio:', e);
  }
}

function stopAmbientSynth() {
  if (soundNodes) {
    const { bassOsc, padOscs, lfo, masterGain, audioCtx: ctx, chordInterval } = soundNodes;
    if (chordInterval) clearInterval(chordInterval);
    try {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      setTimeout(() => {
        try {
          bassOsc.stop();
          padOscs.forEach(osc => osc.stop());
          lfo.stop();
          ctx.close();
        } catch (err) {
          console.error(err);
        }
      }, 1400);
    } catch (e) {
      console.error(e);
    }
    soundNodes = null;
  }
}

function playActionSound(type) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'feed') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    } else if (type === 'pet') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, t);
      osc.frequency.linearRampToValueAtTime(392.00, t + 0.35);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    } else if (type === 'play') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.25);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    } else if (type === 'levelup') {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + idx * 0.08);
        g.gain.setValueAtTime(0.05, t + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t + idx * 0.08);
        o.stop(t + idx * 0.08 + 0.5);
      });
      return;
    } else if (type === 'badge') {
      // Magical chime for badge unlock
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, t + idx * 0.12);
        g.gain.setValueAtTime(0.04, t + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.6);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(t + idx * 0.12);
        o.stop(t + idx * 0.12 + 0.7);
      });
      return;
    }
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  } catch (e) {
    // Ignore context locks
  }
}

/* ==========================================================================
   4. Cookie Consent & Modal Manager
   ========================================================================== */
function initCookieConsent() {
  const CONSENT_KEY = 'aetherius-pet-cookie';
  if (localStorage.getItem(CONSENT_KEY)) return;
  
  const banner = document.createElement('div');
  banner.className = 'cookie-consent-banner';
  banner.innerHTML = `
    <div class="cookie-consent-content">
      에테리우스 펫 에디션은 분석 및 광고 제공(AdSense)을 위해 브라우저 쿠키를 활용하며, 다마고치 정보 유지를 위해 로컬 저장소를 활용합니다. 
      자세한 내용은 <a href="privacy.html">개인정보처리방침</a>에서 보실 수 있으며 이용 시 이에 동의하는 것으로 간주됩니다.
    </div>
    <div class="cookie-consent-actions">
      <button class="cookie-consent-btn btn-accept" id="cookie-accept-btn">동의 및 활성화</button>
    </div>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add('show'), 1200);
  
  document.getElementById('cookie-accept-btn').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 500);
  });
}

/* ==========================================================================
   5. Hamburger Mobile Nav Toggle
   ========================================================================== */
function initHamburgerNav() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('main-nav');
  if (!hamburgerBtn || !nav) return;
  
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('active');
    nav.classList.toggle('mobile-open');
  });

  // Close nav when clicking a link
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      nav.classList.remove('mobile-open');
    });
  });
}

/* ==========================================================================
   6. Photo Upload for Diary
   ========================================================================== */
function initPhotoUpload() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('diary-photo-input');
  const previewContainer = document.getElementById('photo-preview');
  const previewImg = document.getElementById('preview-img');
  const removeBtn = document.getElementById('remove-photo-btn');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      processPhotoFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      processPhotoFile(e.target.files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      currentDiaryPhoto = null;
      previewContainer.style.display = 'none';
      dropzone.style.display = 'flex';
      fileInput.value = '';
    });
  }
}

function processPhotoFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    // Compress and resize the image for localStorage
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 400;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      currentDiaryPhoto = canvas.toDataURL('image/jpeg', 0.7);
      
      const previewContainer = document.getElementById('photo-preview');
      const previewImg = document.getElementById('preview-img');
      const dropzone = document.getElementById('upload-dropzone');
      
      previewImg.src = currentDiaryPhoto;
      previewContainer.style.display = 'flex';
      dropzone.style.display = 'none';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ==========================================================================
   7. Main App Initialization
   ========================================================================== */
function initPetApp() {
  // Modal key elements
  const keyModal = document.getElementById('api-key-modal') || constructKeyModal();
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const apiInput = document.getElementById('api-key-input');
  const kakaoInput = document.getElementById('kakao-key-input');
  
  if (apiInput && geminiApiKey) apiInput.value = geminiApiKey;
  if (kakaoInput && kakaoAppKey) kakaoInput.value = kakaoAppKey;
  
  updateKeyButtonUI(!!geminiApiKey || !!kakaoAppKey);

  if (openModalBtn) openModalBtn.addEventListener('click', () => keyModal.classList.add('active'));
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => keyModal.classList.remove('active'));
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      geminiApiKey = apiInput ? apiInput.value.trim() : '';
      kakaoAppKey = kakaoInput ? kakaoInput.value.trim() : '';
      
      if (geminiApiKey) localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
      else localStorage.removeItem('GEMINI_API_KEY');
      
      if (kakaoAppKey) localStorage.setItem('KAKAO_APP_KEY', kakaoAppKey);
      else localStorage.removeItem('KAKAO_APP_KEY');
      
      showToast('API 구성이 브라우저 로컬 저장소에 저장되었습니다.');
      updateKeyButtonUI(!!geminiApiKey || !!kakaoAppKey);
      keyModal.classList.remove('active');
    });
  }

  // Setup screen flow
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const modeVal = document.getElementById('mode-input').value;
      const nameVal = document.getElementById('pet-name-input').value.trim();
      const typeVal = document.getElementById('pet-type-input').value;
      const personalityVal = document.getElementById('pet-personality-input').value;
      const snackVal = document.getElementById('pet-snack-input').value.trim();
      const ownerVal = document.getElementById('owner-name-input').value.trim();
      
      if (!nameVal) {
        showToast('아이의 이름을 입력해 주세요! 🐾');
        document.getElementById('pet-name-input').focus();
        return;
      }
      if (!snackVal) {
        showToast('아이가 좋아하는 간식/장난감을 적어주세요!');
        document.getElementById('pet-snack-input').focus();
        return;
      }
      if (!ownerVal) {
        showToast('호칭(예: 엄마, 아빠)을 입력해 주세요!');
        document.getElementById('owner-name-input').focus();
        return;
      }

      // Initialize pet parameters
      petProfile = {
        mode: modeVal,
        name: nameVal,
        type: typeVal,
        personality: personalityVal,
        snack: snackVal,
        owner: ownerVal,
        level: 1,
        xp: 0,
        hunger: 50,
        joy: 50,
        totalActions: 0,
        badges: []
      };

      // Load local database if existed
      loadPetDatabase(nameVal);
      
      // Load simulator GUI
      renderPetSimulation();
    });
  }

  // Diary emoji selector
  initDiaryEmojiSelector();
  
  // Photo upload
  initPhotoUpload();
  
  // Passport modal handlers
  initPassportHandlers();
}

function constructKeyModal() {
  let modal = document.createElement('div');
  modal.id = 'api-key-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card">
      <h2>API 및 키 구성</h2>
      <p>에테리우스 AI 자동 번역 편지 기능을 활성화하려면 개인 Gemini API 키를 입력해 주세요. 브라우저(localStorage)에만 안전하게 보관됩니다.</p>
      <div class="form-group">
        <label class="input-label" for="api-key-input">Gemini API Key</label>
        <input type="password" id="api-key-input" class="text-input" placeholder="AI 응답 생성을 위한 Gemini API 키">
      </div>
      <div class="form-group" style="margin-top: 0.5rem; display: none;">
        <label class="input-label" for="kakao-key-input">Kakao App Key</label>
        <input type="text" id="kakao-key-input" class="text-input" placeholder="카카오톡 공유를 위한 자바스크립트 앱 키">
      </div>
      <div class="modal-actions">
        <button id="close-modal-btn" class="btn-secondary">닫기</button>
        <button id="save-key-btn" class="btn-primary">저장하기</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

/* ==========================================================================
   8. Pet Database Persistence (LocalStorage)
   ========================================================================== */
function loadPetDatabase(petName) {
  const dbKey = `aetherius_pet_${petName}`;
  const savedData = localStorage.getItem(dbKey);
  
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      petProfile.level = parsed.level || 1;
      petProfile.xp = parsed.xp || 0;
      petProfile.hunger = parsed.hunger !== undefined ? parsed.hunger : 50;
      petProfile.joy = parsed.joy !== undefined ? parsed.joy : 50;
      petProfile.totalActions = parsed.totalActions || 0;
      petProfile.badges = parsed.badges || [];
    } catch (e) {
      console.error('Failed to parse pet db:', e);
    }
  }

  const diaryKey = `aetherius_diary_${petName}`;
  const savedDiary = localStorage.getItem(diaryKey);
  if (savedDiary) {
    try { diaryEntries = JSON.parse(savedDiary); }
    catch (e) { diaryEntries = []; }
  } else {
    diaryEntries = [];
  }

  const letterKey = `aetherius_letters_${petName}`;
  const savedLetters = localStorage.getItem(letterKey);
  if (savedLetters) {
    try { letterHistory = JSON.parse(savedLetters); }
    catch (e) { letterHistory = []; }
  } else {
    letterHistory = [];
  }
}

function savePetDatabase() {
  const dbKey = `aetherius_pet_${petProfile.name}`;
  localStorage.setItem(dbKey, JSON.stringify({
    level: petProfile.level,
    xp: petProfile.xp,
    hunger: petProfile.hunger,
    joy: petProfile.joy,
    totalActions: petProfile.totalActions,
    badges: petProfile.badges
  }));

  const diaryKey = `aetherius_diary_${petProfile.name}`;
  localStorage.setItem(diaryKey, JSON.stringify(diaryEntries));

  const letterKey = `aetherius_letters_${petProfile.name}`;
  localStorage.setItem(letterKey, JSON.stringify(letterHistory));
}

/* ==========================================================================
   9. Render Simulator Viewport & Mechanics
   ========================================================================== */
function renderPetSimulation() {
  const container = document.getElementById('screen-container');
  if (!container) return;

  const avatar = petAvatars[petProfile.type] || '🐾';
  const modeLabel = petProfile.mode === 'angel' ? '🌈 하늘 동산' : '🏠 짝꿍의 텃밭';

  container.innerHTML = `
    <div class="screen-state" style="justify-content: flex-start; gap: 0.75rem;">
      <!-- HUD Bar -->
      <div class="pet-hud">
        <div class="pet-hud-row">
          <span class="pet-lv-badge" id="hud-level">Lv.${petProfile.level}</span>
          <div class="pet-xp-wrapper">
            <span>XP</span>
            <div class="xp-bar-bg"><div class="xp-bar-fill" id="hud-xp-fill" style="width: ${petProfile.xp}%"></div></div>
            <span id="hud-xp-text">${petProfile.xp}/100</span>
          </div>
        </div>
        <div class="pet-meters">
          <div class="meter-item">
            <span>🍖 포만감</span>
            <div class="meter-bg"><div class="meter-fill hunger" id="hud-hunger-fill" style="width: ${petProfile.hunger}%"></div></div>
          </div>
          <div class="meter-item">
            <span>⚽ 행복도</span>
            <div class="meter-bg"><div class="meter-fill joy" id="hud-joy-fill" style="width: ${petProfile.joy}%"></div></div>
          </div>
        </div>
        <!-- Badges Display -->
        <div class="pet-badges-row" id="hud-badges-row">
          ${renderBadgeIcons()}
        </div>
      </div>

      <!-- Room Viewport -->
      <div class="pet-viewport" id="pet-room-viewport">
        <span class="viewport-decor"></span>
        <div class="pet-speech-bubble" id="pet-talk-bubble">안녕, ${petProfile.owner}! 나 너무 보고 싶었어! 💖</div>
        
        <!-- Interacting overlays inside viewport -->
        <span class="bowl-decor" id="bowl-decor">🥣</span>
        <span class="toy-decor" id="toy-decor">🎾</span>
        
        <!-- Pet avatar -->
        <span class="pet-sprite" id="pet-room-sprite" onclick="petSpriteClick()">${avatar}</span>
        
        <span style="position: absolute; bottom: 8px; font-size: 0.65rem; color: var(--color-text-muted); opacity: 0.7;">${modeLabel}</span>
      </div>

      <!-- Action Panel -->
      <div class="pet-action-grid">
        <button class="pet-action-btn" onclick="triggerPetAction('feed')">
          <span class="btn-icon">🍖</span>
          <span>간식 주기</span>
        </button>
        <button class="pet-action-btn" onclick="triggerPetAction('pet')">
          <span class="btn-icon">💖</span>
          <span>쓰다듬기</span>
        </button>
        <button class="pet-action-btn" onclick="triggerPetAction('play')">
          <span class="btn-icon">⚽</span>
          <span>놀아주기</span>
        </button>
        <button class="pet-action-btn" onclick="scrollSection('diary-section')">
          <span class="btn-icon">📖</span>
          <span>추억 쓰기</span>
        </button>
        <button class="pet-action-btn" onclick="scrollSection('letter-section')">
          <span class="btn-icon">✉️</span>
          <span>우체통</span>
        </button>
        <button class="pet-action-btn" onclick="openPassportModal()">
          <span class="btn-icon">🎫</span>
          <span>여권 발급</span>
        </button>
      </div>

      <button class="action-btn" id="exit-btn" style="margin-top: 0.4rem; padding: 0.5rem; font-size: 0.78rem; border-color: rgba(255,255,255,0.05); color: var(--color-text-muted);">
        ← 초기화 / 퇴장하기
      </button>
    </div>
  `;

  // Attach exit handler
  document.getElementById('exit-btn').addEventListener('click', () => {
    stopAmbientSynth();
    window.location.reload();
  });

  // Show interactive grids below
  const subsystems = document.getElementById('interactive-subsystems');
  if (subsystems) {
    subsystems.classList.remove('interactive-subsystems-hidden');
    subsystems.classList.add('interactive-subsystems-visible');
  }
  
  // Render lists
  renderDiaryAlbum();
  renderLettersList();
  
  // Start subtle status cycle
  startStatusCycle();
  
  // Set random speech messages
  triggerRandomSpeech();
  
  // Check for pending badges
  checkMilestones();

  // 🐾 Start Nintendogs-style roaming after a short warm-up delay
  setTimeout(startPetRoam, 1500);
}

function renderBadgeIcons() {
  if (!petProfile.badges || petProfile.badges.length === 0) {
    return `<span style="font-size: 0.6rem; color: var(--color-text-muted); font-style: italic;">아직 획득한 배지가 없습니다</span>`;
  }
  return petProfile.badges.map(badgeId => {
    const m = milestones.find(ms => ms.id === badgeId);
    if (!m) return '';
    return `<span class="badge-icon" title="${m.name}: ${m.desc}">${m.icon}</span>`;
  }).join('');
}

/* ==========================================================================
   10. Pet Actions & Affinity Progression (Tamagotchi Engine)
   ========================================================================== */
function triggerPetAction(action) {
  const talkBubble = document.getElementById('pet-talk-bubble');
  const petSprite = document.getElementById('pet-room-sprite');
  const viewport = document.getElementById('pet-room-viewport');
  
  // Pause roaming momentarily so bounce animation is clean
  stopPetRoam();

  // Spring bounce animation on pet sprite
  petSprite.style.animation = 'none';
  petSprite.offsetHeight; // force reflow
  petSprite.style.transform = `translate(${petRoamCurrentX}px, ${petRoamCurrentY}px) scale(1.25) translateY(-18px) scaleX(${petRoamFacing})`;
  setTimeout(() => {
    petSprite.style.transform = `translate(${petRoamCurrentX}px, ${petRoamCurrentY}px) scaleX(${petRoamFacing})`;
    petSprite.style.animation = 'petBreathe 3s ease-in-out infinite';
    // Resume roaming after interaction
    setTimeout(startPetRoam, 600);
  }, 350);

  // Micro screen shake for immersion
  viewport.style.animation = 'none';
  viewport.offsetHeight;
  viewport.style.animation = 'microShake 0.25s ease-out';
  setTimeout(() => viewport.style.animation = '', 300);

  // Play audio
  playActionSound(action);
  
  // Increment total actions
  petProfile.totalActions = (petProfile.totalActions || 0) + 1;

  const feedSpeech = [
    `오물오물! 내가 좋아하는 ${petProfile.snack} 맛이 최고다멍! 🦴`,
    `${petProfile.owner}가 주는 밥은 세상에서 제일 맛있어! 😋`,
    `냠냠... 한 입만 더? 한 입만! 🍖`,
    `배가 든든하니까 행복이 솟는다멍! 🐾`
  ];
  
  const petSpeech = [
    `헤헤... ${petProfile.owner} 손길은 솜사탕처럼 따스해... 지리리링... ✨`,
    `가르르릉... 여기가 바로 천국이야... 💖`,
    `${petProfile.owner}한테 쓰다듬 받으면 하루 종일 기분 좋아! ☁️`,
    `살살 긁어줘... 거기거기! 완벽해! 💕`
  ];
  
  const playSpeech = [
    `축구 한 판 하자 멍! 신나게 달리니까 구름 위를 나는 것 같아!`,
    `잡아봐! 난 번개보다 빠르다구! ⚡`,
    `이겼다! 아 질 뻔했잖아! 다시 한 판! 🎮`,
    `${petProfile.owner}랑 놀면 시간이 너무 빨리 가! ⏰`
  ];

  if (action === 'feed') {
    petProfile.hunger = Math.min(100, petProfile.hunger + 15);
    addXp(10);
    
    const bowl = document.getElementById('bowl-decor');
    if (bowl) {
      bowl.classList.remove('active');
      bowl.offsetHeight; // force reflow to restart animation
      bowl.classList.add('active');
      setTimeout(() => bowl.classList.remove('active'), 2000);
    }
    // Staggered particle burst
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnParticle(viewport, ['🍖', '🦴', '✨'][i % 3]), i * 150);
    }
    
    updateSpeechBubble(talkBubble, feedSpeech[Math.floor(Math.random() * feedSpeech.length)]);

  } else if (action === 'pet') {
    addXp(5);
    // Heart shower effect
    for (let i = 0; i < 4; i++) {
      setTimeout(() => spawnParticle(viewport, ['💖', '✨', '💕', '❤️'][i % 4]), i * 120);
    }
    updateSpeechBubble(talkBubble, petSpeech[Math.floor(Math.random() * petSpeech.length)]);

  } else if (action === 'play') {
    petProfile.joy = Math.min(100, petProfile.joy + 20);
    addXp(10);
    
    const ball = document.getElementById('toy-decor');
    if (ball) {
      ball.classList.remove('active');
      ball.offsetHeight;
      ball.classList.add('active');
      setTimeout(() => ball.classList.remove('active'), 2000);
    }
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnParticle(viewport, ['⚽', '🌟', '💫'][i % 3]), i * 130);
    }
    
    updateSpeechBubble(talkBubble, playSpeech[Math.floor(Math.random() * playSpeech.length)]);
  }

  // Update HUD
  updateHudGauges();
  savePetDatabase();
  
  // Check for milestones
  checkMilestones();
}

// Animate speech bubble update with pop-in re-trigger
function updateSpeechBubble(bubble, text) {
  if (!bubble) return;
  // Clone and replace to re-trigger CSS animation
  const parent = bubble.parentNode;
  const newBubble = bubble.cloneNode(false);
  newBubble.id = bubble.id;
  newBubble.className = bubble.className;
  newBubble.textContent = text;
  parent.replaceChild(newBubble, bubble);
}

// Click on pet sprite itself for bonus love
function petSpriteClick() {
  const talkBubble = document.getElementById('pet-talk-bubble');
  const viewport = document.getElementById('pet-room-viewport');
  spawnParticle(viewport, '❤️');
  if (talkBubble) {
    const quickPhrases = [
      '뭐야? 날 콕! 찔렀어? 귀여워~ 😆',
      `${petProfile.owner}! 나 쳐다보면서 뭐 생각해? 😏`,
      '꼬옥 안아줘! 🤗',
      '나 이렇게 귀여운 거 알지? 😚'
    ];
    updateSpeechBubble(talkBubble, quickPhrases[Math.floor(Math.random() * quickPhrases.length)]);
  }
}

function updateHudGauges() {
  const lvEl = document.getElementById('hud-level');
  const xpFill = document.getElementById('hud-xp-fill');
  const xpText = document.getElementById('hud-xp-text');
  const hungerFill = document.getElementById('hud-hunger-fill');
  const joyFill = document.getElementById('hud-joy-fill');
  
  if (lvEl) lvEl.textContent = `Lv.${petProfile.level}`;
  if (xpFill) xpFill.style.width = `${petProfile.xp}%`;
  if (xpText) xpText.textContent = `${petProfile.xp}/100`;
  if (hungerFill) hungerFill.style.width = `${petProfile.hunger}%`;
  if (joyFill) joyFill.style.width = `${petProfile.joy}%`;
}

function addXp(amount) {
  petProfile.xp += amount;
  if (petProfile.xp >= 100) {
    petProfile.level += 1;
    petProfile.xp = petProfile.xp - 100;
    triggerLevelUpAnimation();
  }
}

function spawnParticle(parent, text) {
  if (!parent) return;
  const p = document.createElement('span');
  p.className = 'effect-particle';
  p.textContent = text;
  // Randomize horizontal position for natural spread
  p.style.left = `${25 + Math.random() * 50}%`;
  p.style.bottom = `${30 + Math.random() * 15}%`;
  // Randomize size slightly
  const scale = 0.8 + Math.random() * 0.4;
  p.style.fontSize = `${1.8 * scale}rem`;
  parent.appendChild(p);
  setTimeout(() => p.remove(), 1500);
}

function triggerLevelUpAnimation() {
  playActionSound('levelup');
  const viewport = document.getElementById('pet-room-viewport');
  if (!viewport) return;

  // Spawn confetti
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const confetti = ['🎊', '🌟', '✨', '🎉', '💫', '⭐'];
      spawnParticle(viewport, confetti[Math.floor(Math.random() * confetti.length)]);
    }, i * 120);
  }

  const overlay = document.createElement('div');
  overlay.className = 'level-up-overlay';
  overlay.innerHTML = `
    <div class="level-up-card">
      <div class="level-up-title">✨ LEVEL UP! ✨</div>
      <p style="color: var(--color-gold); font-size: 0.95rem; margin-top: 0.25rem;">${petProfile.name}의 친밀도 레벨 상승!</p>
      <p style="color: var(--color-text-secondary); font-size: 0.8rem; margin-top: 0.5rem;">이제 Lv.${petProfile.level}이 되었습니다!</p>
      <button class="btn-primary" style="margin-top: 1rem; width: 100px; padding: 0.45rem;" onclick="closeLevelUpOverlay(this)">확인</button>
    </div>
  `;
  viewport.appendChild(overlay);
}

window.closeLevelUpOverlay = function(btn) {
  const overlay = btn.closest('.level-up-overlay');
  if (overlay) overlay.remove();
  updateHudGauges();
};

function startStatusCycle() {
  setInterval(() => {
    if (document.getElementById('pet-room-viewport')) {
      petProfile.hunger = Math.max(0, petProfile.hunger - 3);
      petProfile.joy = Math.max(0, petProfile.joy - 2);
      updateHudGauges();
      savePetDatabase();
      
      // Warn if stats too low
      if (petProfile.hunger <= 10) {
        const bubble = document.getElementById('pet-talk-bubble');
        if (bubble) updateSpeechBubble(bubble, `${petProfile.owner}... 배고파... 밥 줘... 🥺`);
      } else if (petProfile.joy <= 10) {
        const bubble = document.getElementById('pet-talk-bubble');
        if (bubble) updateSpeechBubble(bubble, `심심해... ${petProfile.owner} 나랑 놀아줘... 😢`);
      }
    }
  }, 20000);
}

/* ==========================================================================
   10b. Nintendogs-style Pet Roaming Engine
   ========================================================================== */
let petRoamInterval = null;
let petRoamCurrentX = 0;
let petRoamCurrentY = 0;
let petRoamFacing = 1; // 1 = right, -1 = left

function startPetRoam() {
  const sprite = document.getElementById('pet-room-sprite');
  const viewport = document.getElementById('pet-room-viewport');
  if (!sprite || !viewport) return;
  if (petRoamInterval) clearInterval(petRoamInterval);

  // Apply transition for smooth roaming
  sprite.style.transition = 'transform 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95)';

  function roamStep() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    // Keep within 70% of viewport, centred around middle
    const halfW = (vw * 0.35);
    const halfH = (vh * 0.28);
    const targetX = (Math.random() - 0.5) * 2 * halfW;
    const targetY = (Math.random() - 0.5) * 2 * halfH;

    // Flip sprite based on movement direction
    const newFacing = targetX >= petRoamCurrentX ? 1 : -1;
    if (newFacing !== petRoamFacing) {
      petRoamFacing = newFacing;
    }
    petRoamCurrentX = targetX;
    petRoamCurrentY = targetY;

    // Combine roam translation with breathing/float animations via CSS var
    sprite.style.transform = `translate(${targetX}px, ${targetY}px) scaleX(${petRoamFacing})`;
  }

  // Initial position at centre
  sprite.style.transform = 'translate(0px, 0px) scaleX(1)';
  petRoamInterval = setInterval(roamStep, 3500);
}

function stopPetRoam() {
  if (petRoamInterval) {
    clearInterval(petRoamInterval);
    petRoamInterval = null;
  }
}

const randomSpeeches = {
  angel: [
    `{owner}야... 오늘 저녁 노을, 예쁘게 지지? 그거 내가 너 보고 싶어서 하늘 물감 다 뒤집어엎은 거야. 🌅`,
    `무지개다리 이쪽엔 바람이 늘 따뜻해. 근데 난 {owner} 냄새 나는 바람이 제일 좋더라고...`,
    `가끔 {owner} 꿈에 들어가서 같이 뛰어 놀아. 그러니까 오늘 밤엔 꼭 꿈 꿔줘! 🌙`,
    `나 여기서 하나도 안 아파. 다리도 안 무거워. 훨훨 날아다니고 있어. 걱정 마, {owner}! 🌈`,
    `{snack} 냄새가 바람 타고 살포시 넘어와. 아직도 내 최애 간식이야... 😋`,
    `{owner} 웃는 소리가 들릴 때마다 내 꼬리가 여기서도 팔랑팔랑 흔들려. 제발 많이 웃어줘! 💛`,
    `별똥별 소원 빌면 나한테 닿아. 오늘 밤 하늘 올려다봐줘, {owner}! ✨`,
    `나 절대로 안 잊어버려. 우리가 함께했던 모든 날 하나하나 꽉 붙들고 있어. 💖`,
    `가끔 {owner} 베개 위에 내 냄새가 나는 것 같지? 그거 진짜야. 내가 잠든 너 옆에 있는 거니까. 🌟`,
    `울지 마, {owner}. 눈물 한 방울 떨어질 때마다 내 마음도 같이 아파. 대신 오늘 맛있는 거 먹어줘! 🥣`,
    `나 천국에서 제일 친한 친구 생겼어! 근데 솔직히 {owner}만큼 좋진 않아. 네가 최고야. 언제나. 🐾`,
    `{owner}가 날 부를 때 바람이 살짝 흔들리는 거, 알아챘어? 그게 나야. 항상 듣고 있어.`
  ],
  companion: [
    `지금 나랑 간식 먹고 한강 공원 돗자리 펴고 뒹굴뒹굴하자 멍! 🐾`,
    `내가 코를 킁킁 부비는 건 {owner} 냄새가 솜사탕만큼 좋아서 그래!`,
    `소시지 구름 맛있는 소리 난다! 얼른 {snack} 하나 더 달라멍!`,
    `오늘 주인이 양말 냄새 맡았어. 얼른 던져줘!`,
    `꼬리가 쉴 새 없이 좌우로 돌아가! 나 지금 최고로 기분 좋아! ⚽`,
    `{owner}가 외출하면 문 앞에서 기다릴 거야. 빨리 돌아와! 🏠`,
    `나 지금 졸리지만... {owner} 옆에 있고 싶어서 버티는 중... 💤`
  ]
};

function triggerRandomSpeech() {
  setInterval(() => {
    const bubble = document.getElementById('pet-talk-bubble');
    if (bubble) {
      const list = randomSpeeches[petProfile.mode] || randomSpeeches['companion'];
      let text = list[Math.floor(Math.random() * list.length)];
      text = text.replace(/{owner}/g, petProfile.owner);
      text = text.replace(/{snack}/g, petProfile.snack);
      text = text.replace(/{name}/g, petProfile.name);
      updateSpeechBubble(bubble, text);
    }
  }, 12000);
}

/* ==========================================================================
   11. Milestone Badge System
   ========================================================================== */
function checkMilestones() {
  let newBadge = false;
  milestones.forEach(m => {
    if (!petProfile.badges.includes(m.id) && m.check(petProfile)) {
      petProfile.badges.push(m.id);
      newBadge = true;
      showBadgeUnlock(m);
    }
  });
  if (newBadge) {
    savePetDatabase();
    // Update badges row
    const badgesRow = document.getElementById('hud-badges-row');
    if (badgesRow) {
      badgesRow.innerHTML = renderBadgeIcons();
    }
  }
}

function showBadgeUnlock(milestone) {
  playActionSound('badge');
  
  const popup = document.createElement('div');
  popup.className = 'badge-unlock-popup';
  popup.innerHTML = `
    <div class="badge-unlock-card">
      <div class="badge-unlock-icon">${milestone.icon}</div>
      <div class="badge-unlock-title">🏆 배지 획득!</div>
      <div class="badge-unlock-name">${milestone.name}</div>
      <div class="badge-unlock-desc">${milestone.desc}</div>
    </div>
  `;
  document.body.appendChild(popup);
  
  requestAnimationFrame(() => popup.classList.add('show'));
  
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 600);
  }, 3000);
}

/* ==========================================================================
   12. Memory Diary (추억 일기장)
   ========================================================================== */
let activeEmoji = '🌳';

function initDiaryEmojiSelector() {
  const diaryEmojiBtns = document.querySelectorAll('.diary-emoji-btn');
  diaryEmojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diaryEmojiBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeEmoji = btn.dataset.emoji;
    });
  });
}

window.saveDiaryEntry = function(e) {
  e.preventDefault();
  const title = document.getElementById('diary-title').value.trim();
  const date = document.getElementById('diary-date').value;
  const desc = document.getElementById('diary-text').value.trim();

  if (!title || !date || !desc) {
    showToast('모든 필드를 채워주세요! 📝');
    return;
  }

  const newEntry = {
    id: Date.now(),
    title: title,
    date: date,
    emoji: activeEmoji,
    desc: desc,
    photo: currentDiaryPhoto || null
  };

  diaryEntries.unshift(newEntry);
  savePetDatabase();
  
  // Award XP
  addXp(20);
  updateHudGauges();
  
  // Reset form
  document.getElementById('diary-entry-form').reset();
  const diaryEmojiBtns = document.querySelectorAll('.diary-emoji-btn');
  diaryEmojiBtns.forEach(b => b.classList.remove('active'));
  const defaultEmojiBtn = document.querySelector('[data-emoji="🌳"]');
  if (defaultEmojiBtn) defaultEmojiBtn.classList.add('active');
  activeEmoji = '🌳';
  
  // Reset photo
  currentDiaryPhoto = null;
  const previewContainer = document.getElementById('photo-preview');
  const dropzone = document.getElementById('upload-dropzone');
  if (previewContainer) previewContainer.style.display = 'none';
  if (dropzone) dropzone.style.display = 'flex';

  showToast('📸 추억 앨범에 새로운 폴라로이드 카드가 꽂혔습니다! (+20 XP)');
  
  renderDiaryAlbum();
  
  // Speech reaction
  const bubble = document.getElementById('pet-talk-bubble');
  if (bubble) bubble.textContent = `와! "${title}" 날 진짜 신났었는데! 앨범에 고이 꽂아둘게! 💖`;
  
  // Check milestones
  checkMilestones();
};

window.deleteDiaryEntry = function(entryId) {
  diaryEntries = diaryEntries.filter(e => e.id !== entryId);
  savePetDatabase();
  renderDiaryAlbum();
  showToast('추억 카드가 삭제되었습니다.');
};

function renderDiaryAlbum() {
  const grid = document.getElementById('diary-cards-grid');
  if (!grid) return;

  if (diaryEntries.length === 0) {
    grid.innerHTML = `<div class="empty-diary-msg">아직 기록된 추억이 없습니다. 첫 이야기를 남겨주세요!</div>`;
    return;
  }

  grid.innerHTML = '';
  diaryEntries.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'diary-card';
    
    const photoArea = entry.photo 
      ? `<div class="diary-card-photo" style="background: url('${entry.photo}') center/cover no-repeat;">
           <span style="display:none;">${entry.emoji}</span>
         </div>`
      : `<div class="diary-card-photo">
           <span>${entry.emoji}</span>
         </div>`;
    
    card.innerHTML = `
      ${photoArea}
      <div class="diary-card-date">${entry.date}</div>
      <div class="diary-card-title">${entry.title}</div>
      <div class="diary-card-desc">${entry.desc}</div>
      <button class="diary-delete-btn" onclick="deleteDiaryEntry(${entry.id})" title="삭제">✕</button>
    `;
    grid.appendChild(card);
  });
}

/* ==========================================================================
   13. Letter Box (마음의 우체통 & Gemini API)
   ========================================================================== */
window.sendLetterToPet = async function(e) {
  e.preventDefault();
  const textInput = document.getElementById('owner-letter-text');
  const textVal = textInput.value.trim();
  if (!textVal) return;

  const btn = document.getElementById('send-letter-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="signal-dot"></span> 편지가 무지개 너머로 날아가는 중...`;

  const newLetterThread = {
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    ownerText: textVal,
    petText: '...'
  };

  letterHistory.unshift(newLetterThread);
  renderLettersList();
  
  textInput.value = '';

  let petReply = '';
  try {
    if (geminiApiKey) {
      petReply = await fetchGeminiPetReply(textVal);
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const list = fallbackReplies[petProfile.mode] || fallbackReplies['companion'];
      const template = list[Math.floor(Math.random() * list.length)];
      petReply = template
        .replace(/{owner}/g, petProfile.owner)
        .replace(/{name}/g, petProfile.name)
        .replace(/{snack}/g, petProfile.snack);
    }
  } catch (error) {
    console.error('Failed to get pet reply from Gemini:', error);
    const list = fallbackReplies[petProfile.mode] || fallbackReplies['companion'];
    const template = list[Math.floor(Math.random() * list.length)];
    petReply = template
      .replace(/{owner}/g, petProfile.owner)
      .replace(/{name}/g, petProfile.name)
      .replace(/{snack}/g, petProfile.snack);
  }

  letterHistory[0].petText = petReply;
  savePetDatabase();
  
  addXp(15);
  updateHudGauges();
  
  btn.disabled = false;
  btn.innerHTML = `🕊️ 하늘나라 정거장으로 편지 띄우기`;

  showToast('📬 우체통에 방금 따끈한 아이의 답장이 배달되었습니다! (+15 XP)');
  renderLettersList();

  const bubble = document.getElementById('pet-talk-bubble');
  if (bubble) bubble.textContent = `답장 보냈어! 아래 우체통 편지함을 확인해봐! 💌`;
  
  checkMilestones();
};

async function fetchGeminiPetReply(ownerLetter) {
  const isAngel = petProfile.mode === 'angel';
  const modeContext = isAngel
    ? '이미 무지개다리를 건너 천국에서 지내고 있는 상태. 주인을 그리워하고 보고 싶지만 아프지 않고 행복하게 지내고 있음.'
    : '현재 주인과 한 집에서 같이 살고 있으며, 동물의 솔직한 속마음을 인간의 언어로 번역하는 상태.';

  const selectedPersonality = personalityNames[petProfile.personality] || '애교 많은';

  const angelExtra = isAngel
    ? '\n\n무지개다리 모드 특별 지침:\n- 주인의 펫로스 슬픔을 깊이 공감하고 진심 어린 위로와 치유의 말을 전하세요.\n- 천국 묘사: 따뜻한 햇살, 꽃밭, 뛰어노는 친구들, 맛있는 간식, 아프지 않고 자유로운 몸.\n- 일상 속 존재감 표현 포함: 저녁 노을이 예쁠 때 내가 장난치는 거야 / 바람이 살짝 흔들릴 때 그게 나야 / 꿈에서 만나자.\n- 슬픔을 인정하되 억지로 잊으라 하지 말고 함께 앞으로 나아가자고 격려하세요.\n- 마지막엔 다시 만날 날이 올 거야 같은 희망적 약속으로 마무리하세요.\n- 실제 아이가 쓴 것처럼 생생하고 따뜻하게 쓰세요.'
    : '';

  const systemPrompt = [
    '당신은 "' + petProfile.name + '"라는 이름의 ' + petTypeNames[petProfile.type] + '입니다.',
    '성격: "' + selectedPersonality + '" | 좋아하는 간식/장난감: "' + petProfile.snack + '" | 주인 호칭: "' + petProfile.owner + '"',
    '현재 상태: ' + modeContext,
    '',
    '주인 "' + petProfile.owner + '"가 보낸 편지:',
    '"""',
    ownerLetter,
    '"""',
    '',
    '[답장 규칙]',
    '1. 반드시 한국어로, 펫 1인칭으로 작성하세요.',
    '2. 성격 말투 적용:',
    '   - 애교쟁이: 사랑스럽고 적극적 애정표현, 이모지 많이',
    '   - 식탐왕 먹보: ' + petProfile.snack + ' 관련 농담 포함',
    '   - 시크/도도: 츤데레 스타일 (쌀쌀맞지만 속으로는 사랑)',
    '   - 쫄보/겁쟁이: 수줍고 따뜻하게, 주인이 지켜줘서 고맙다고',
    '   - 든든한 경호원: 씩씩하게, 주인 지킬 거라는 다짐',
    '3. 보내온 편지 내용을 직접 언급하며 응답하세요.',
    '4. 400~700자 분량으로 충분히 길게 작성하세요.',
    '5. 시스템 설명문이나 마크다운 기호(**, ##)는 절대 출력하지 마세요.' + angelExtra
  ].join('\n');

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: { temperature: 1.1, maxOutputTokens: 1200 }
    })
  });

  if (!response.ok) throw new Error('API Request Failed');
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function renderLettersList() {
  const list = document.getElementById('letters-history-list');
  if (!list) return;

  if (letterHistory.length === 0) {
    list.innerHTML = `<div class="empty-letters-msg">우체통이 조용히 기다리고 있습니다. 첫 서신을 띄우시면 답장이 여기에 보관됩니다.</div>`;
    return;
  }

  list.innerHTML = '';
  letterHistory.forEach(thread => {
    const item = document.createElement('div');
    item.className = 'letter-thread';
    item.innerHTML = `
      <div class="bubble-msg owner">
        ${escapeHtml(thread.ownerText)}
        <span class="bubble-time">${thread.time}</span>
      </div>
      <div class="bubble-msg pet">
        <strong>${petProfile.name}:</strong><br>
        ${thread.petText === '...' ? '<span class="typing-cursor"></span>' : escapeHtml(thread.petText)}
      </div>
    `;
    list.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ==========================================================================
   14. Pet Passport / Cosmic ID Exporter (html2canvas)
   ========================================================================== */
function initPassportHandlers() {
  const closePassportBtn = document.getElementById('close-passport-btn');
  if (closePassportBtn) {
    closePassportBtn.addEventListener('click', () => {
      document.getElementById('passport-modal').classList.remove('active');
    });
  }

  const downloadPassportBtn = document.getElementById('download-passport-btn');
  if (downloadPassportBtn) {
    downloadPassportBtn.addEventListener('click', () => {
      const area = document.getElementById('passport-capture-wrapper');
      const name = petProfile.name;
      
      if (typeof html2canvas === 'undefined') {
        showToast('html2canvas 라이브러리를 로드할 수 없습니다.');
        return;
      }
      
      html2canvas(area, {
        backgroundColor: '#0a0812',
        scale: 2,
        useCORS: true,
        logging: false
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `aetherius-passport-${name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('🎫 여권 이미지 저장 성공!');
      }).catch(err => {
        console.error(err);
        showToast('여권 이미지 다운로드에 실패했습니다.');
      });
    });
  }
}

window.openPassportModal = function() {
  playActionSound('pet');
  const modal = document.getElementById('passport-modal');
  if (!modal) return;

  // Populate data
  const passAvatar = document.getElementById('pass-avatar');
  const passName = document.getElementById('pass-name');
  const passType = document.getElementById('pass-type');
  const passMode = document.getElementById('pass-mode');
  const passLevel = document.getElementById('pass-level');
  const passSnack = document.getElementById('pass-snack');
  const passBarcodeNum = document.getElementById('pass-barcode-num');
  
  if (passAvatar) passAvatar.textContent = petAvatars[petProfile.type] || '🐶';
  if (passName) passName.textContent = petProfile.name.toUpperCase();
  if (passType) passType.textContent = (petTypeNames[petProfile.type] || 'PET').toUpperCase();
  if (passMode) passMode.textContent = petProfile.mode === 'angel' ? 'ANGEL' : 'COMPANION';
  if (passLevel) passLevel.textContent = `LEVEL ${petProfile.level}`;
  if (passSnack) passSnack.textContent = petProfile.snack.toUpperCase();
  
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  if (passBarcodeNum) passBarcodeNum.textContent = `AETH-${dateStr}-${petProfile.level}${petProfile.xp}`;

  modal.classList.add('active');
};

// Scroller helper
window.scrollSection = function(id) {
  playActionSound('play');
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/* ==========================================================================
   15. DOMContentLoaded Init
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initAmbientSynth();
  initCookieConsent();
  initHamburgerNav();
  initPetApp();
});
