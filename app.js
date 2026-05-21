/**
 * Aetherius - Memory Relic AI Companion JavaScript
 * Implements: Relic states, Gemini API integration, Web Audio Synth, and Particles.
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initRelicApp();
  initAmbientSynth();
});

/* ==========================================================================
   1. Background Floating Particles
   ========================================================================== */
function initParticles() {
  const container = document.getElementById('particles-js') || document.body;
  const particleCount = 25;
  
  // If a dedicated particle container doesn't exist, we construct it
  let pContainer = document.querySelector('.particles');
  if (!pContainer) {
    pContainer = document.createElement('div');
    pContainer.className = 'particles';
    container.appendChild(pContainer);
  }

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    
    // Randomize initial position, size, animation speed, and delay
    const size = Math.random() * 3 + 1;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}vw`;
    
    const duration = Math.random() * 10 + 10; // 10s to 20s
    const delay = Math.random() * -20; // negative delay to start immediately
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${delay}s`;
    
    // Vary opacity a bit
    p.style.opacity = (Math.random() * 0.3 + 0.1).toString();
    
    pContainer.appendChild(p);
  }
}

/* ==========================================================================
   2. Relic App State Machine & Gemini API
   ========================================================================== */
let selectedClue = 'sunset'; // Default clue
let geminiApiKey = localStorage.getItem('GEMINI_API_KEY') || '';
let kakaoAppKey = localStorage.getItem('KAKAO_APP_KEY') || '';

// Personalized Owner Session Data
let ownerName = '';
let ownerPhone = '';

// Initialize Kakao SDK if key exists
if (kakaoAppKey && typeof Kakao !== 'undefined') {
  try {
    if (!Kakao.isInitialized()) {
      Kakao.init(kakaoAppKey);
    }
  } catch (e) {
    console.error('Kakao init failed:', e);
  }
}

// Helper to mask phone numbers safely (e.g. 010-1234-5678 -> 010-****-5678)
function maskPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-***-${cleaned.slice(6)}`;
  }
  return phone.length > 4 ? phone.slice(0, 3) + '***' + phone.slice(-4) : '***';
}

// Mock emotional responses in case the user has no API Key (uses {name} and {phone})
const mockResponses = {
  sunset: `...휴대폰의 화면이 켜지며 깊은 바다와 주황빛 노을이 갤러리를 가득 채웁니다.

이곳에는 {name} 님이 남긴 마지막 조각들이 머물러 있네요. {name} 님은 늘 하루의 끝자락, 해가 질 무렵을 사랑하던 사람이었습니다. 어두운 밤이 오기 직전, 세상이 가장 따스한 색으로 물드는 찰나를 놓치지 않으려 휴대폰을 들고 멈춰서곤 했죠. 

{name} 님의 사진첩 속 노을은 다 비슷해 보이지만 모두 다른 날의 그리움이 담겨 있습니다. {name} 님은 지치고 외로운 날마다 말없이 하늘을 바라보며 스스로를 위로하곤 했습니다. 그리고 자신이 찍은 이 따뜻한 빛을 언젠가 소중한 누군가에게 보여주며 "오늘 하루도 고생 많았어"라고 속삭여주고 싶어 했어요.

{name} 님을 대신해 전합니다. 비록 지금 {name} 님은 눈부신 노을 너머, 더 밝고 평화로운 하늘 아래 잠들어 있지만, {name} 님이 사랑했던 이 붉은 온기만큼은 이 휴대폰({phone})에 남아 당신의 손끝에 닿기를 바라고 있었을 겁니다.`,

  music: `...수화기 너머로 아스라한 피아노 건반 소리가 흘러나오는 듯합니다.

이 휴대폰의 주인인 {name} 님은 말수가 적고, 생각의 틈새마다 음악을 채워 넣던 서정적인 사람이었습니다. 사람들에게 상처를 주거나 받는 것을 두려워해, 마음이 시릴 때마다 이어폰을 귀에 꽂고 혼자만의 세계로 침잠하곤 했죠. 

인디 피아노 연주곡이 가득한 {name} 님의 플레이리스트는 {name} 님이 세상에 차마 건네지 못했던 수많은 고백과 위로의 언어들이었습니다. {name} 님은 음악의 선율을 타고 슬픔을 흘려보냈고, 마침내 마음이 고요해지면 다시 한 번 세상을 향해 걸어 나갈 힘을 얻곤 했습니다.

{name} 님은 누군가 자신의 플레이리스트를 우연히 듣게 된다면, 잠시 가만히 눈을 감고 마음의 짐을 내려놓기를 바랐습니다. 지금 이 조용한 노래는, {name} 님이 남겨둔 가장 따뜻하고 평온한 포옹입니다.`,

  text: `...전송 버튼을 끝내 누르지 못한 편지함이 붉은빛으로 깜빡입니다.

거기엔 아주 짧고 떨리는 문장이 적혀 있네요. '미안해, 그리고 고마워.' 

{name} 님은 감정을 솔직하게 표현하는 것에 서툴렀고, 누군가에게 폐를 끼치거나 마음에 빚을 지는 것을 몹시 어려워하던 조심스러운 성격의 소유자였습니다. 고마운 마음도, 미안한 마음도 가슴속에 꾹꾹 눌러 담아두었다가 결국은 타이밍을 놓쳐 전송 버튼을 누르지 못하곤 했죠.

{name} 님이 떠나기 전 남겨둔 이 마지막 미완성 메시지는 특정 한 사람이 아닌, 어쩌면 {name} 님이 살아오며 마주했던 모든 소중한 인연들을 향한 고백이었을지도 모릅니다. {name} 님의 마음은 차마 전해지지 못하고 허공에 맴돌았지만, 주인을 잃은 이 휴대폰({phone})은 그 진심만큼은 세상에 닿기를 간절히 바라고 있습니다. "더 많이 표현하지 못해 미안했고, 내 삶에 머물러주어 진심으로 고마웠다"고 속삭이고 있습니다.`,

  screen: `...금이 간 유리 액정 너머로 희미하게 반짝이는 별이 빛나는 밤하늘 배경화면이 보입니다.

액정의 깨진 틈새는 {name} 님이 살아가며 마주했던 수많은 삶의 무게와 상처들을 보여주는 듯합니다. 하지만 그 균열 사이로도 {name} 님이 선택한 배경화면은 여전히 아름답게 반짝이는 깊은 우주와 별빛이네요. 

{name} 님은 비록 현실의 삶이 고단하고 상처로 가득했을지라도, 늘 마음 한구석에는 닿을 수 없는 이상과 꿈을 품고 살아가던 순수한 영혼이었습니다. 깨지고 다치면서도 밤하늘의 별을 보며 위안을 삼았고, 자신에게 상처를 준 세상조차 아름답게 바라보려고 애쓰던 사람이었죠.

이 작은 액정의 틈새는 실패의 흔적이 아닌, {name} 님이 힘겹게 품어왔던 빛나는 삶의 훈장입니다. {name} 님은 자신이 떠난 후 이 상처투성이 휴대폰({phone})을 마주할 당신에게 속삭이고 있습니다. 상처 입은 삶일지라도, 당신의 마음속 별빛만큼은 절대 깨뜨리지 말라고.`
};

function initRelicApp() {
  // Modal key elements
  const keyModal = document.getElementById('api-key-modal');
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const apiInput = document.getElementById('api-key-input');
  const kakaoInput = document.getElementById('kakao-key-input');
  
  // Populate existing keys if available
  if (apiInput && geminiApiKey) {
    apiInput.value = geminiApiKey;
  }
  if (kakaoInput && kakaoAppKey) {
    kakaoInput.value = kakaoAppKey;
  }
  
  updateKeyButtonUI(!!geminiApiKey || !!kakaoAppKey);

  // Modal Open/Close handlers
  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      keyModal.classList.add('active');
    });
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      keyModal.classList.remove('active');
    });
  }
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      geminiApiKey = apiInput ? apiInput.value.trim() : '';
      kakaoAppKey = kakaoInput ? kakaoInput.value.trim() : '';
      
      if (geminiApiKey) {
        localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
      } else {
        localStorage.removeItem('GEMINI_API_KEY');
      }
      
      if (kakaoAppKey) {
        localStorage.setItem('KAKAO_APP_KEY', kakaoAppKey);
        if (typeof Kakao !== 'undefined') {
          try {
            if (!Kakao.isInitialized()) {
              Kakao.init(kakaoAppKey);
            }
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        localStorage.removeItem('KAKAO_APP_KEY');
      }
      
      showToast('설정 사항이 브라우저 로컬 저장소에 저장되었습니다.');
      updateKeyButtonUI(!!geminiApiKey || !!kakaoAppKey);
      keyModal.classList.remove('active');
    });
  }

  // Bind Setup Screen
  initSetupScreen();
}

function initSetupScreen() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('owner-name-input');
      const phoneInput = document.getElementById('owner-phone-input');
      
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      
      if (!nameVal) {
        showToast('소유자의 이름을 입력해 주세요.');
        if (nameInput) nameInput.focus();
        return;
      }
      if (!phoneVal) {
        showToast('전화번호를 입력해 주세요.');
        if (phoneInput) phoneInput.focus();
        return;
      }
      
      ownerName = nameVal;
      ownerPhone = phoneVal;
      
      renderClueSelection();
    });
  }
}

function renderClueSelection() {
  const screenContainer = document.getElementById('screen-container');
  if (!screenContainer) return;
  
  screenContainer.innerHTML = `
    <div class="screen-state" style="animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
      <div class="intro-content">
        <div class="device-icon-wrapper">
          <span class="relic-icon">❊</span>
        </div>
        <h3>기억 보관소</h3>
        <div class="owner-badge" style="font-size: 0.78rem; color: var(--color-gold); background: rgba(226, 201, 116, 0.08); padding: 0.35rem 0.8rem; border-radius: 12px; border: 1px dashed rgba(226, 201, 116, 0.25); margin-top: -0.5rem; margin-bottom: 0.5rem; letter-spacing: 0.05em; display: inline-block;">
          🔐 소유자: ${ownerName} (${maskPhoneNumber(ownerPhone)})
        </div>
        <p class="desc">
          이 기기는 ${ownerName} 님의 남겨진 흔적을 담고 있습니다. 분석하고 싶은 단서를 아래에서 선택하고 활성화해 보세요.
        </p>
        
        <div class="clues-grid">
          <div class="clues-title">보관된 단서</div>
          <button class="clue-option ${selectedClue === 'sunset' ? 'selected' : ''}" data-clue="sunset">
            <span class="clue-dot"></span>
            바다 위 노을 사진들로 가득 찬 갤러리
          </button>
          <button class="clue-option ${selectedClue === 'music' ? 'selected' : ''}" data-clue="music">
            <span class="clue-dot"></span>
            잔잔한 인디 피아노 선율의 플레이리스트
          </button>
          <button class="clue-option ${selectedClue === 'text' ? 'selected' : ''}" data-clue="text">
            <span class="clue-dot"></span>
            '미안해, 그리고 고마워' 미전송 임시 메시지
          </button>
          <button class="clue-option ${selectedClue === 'screen' ? 'selected' : ''}" data-clue="screen">
            <span class="clue-dot"></span>
            별빛 배경화면과 하단부의 미세한 액정 균열
          </button>
        </div>
      </div>
      
      <button class="action-btn" id="action-btn">
        기억 잔상 복원하기
      </button>
    </div>
  `;

  // Re-bind clue selections
  const selectClues = screenContainer.querySelectorAll('.clue-option');
  selectClues.forEach(clue => {
    clue.addEventListener('click', () => {
      selectClues.forEach(c => c.classList.remove('selected'));
      clue.classList.add('selected');
      selectedClue = clue.getAttribute('data-clue');
    });
  });

  // Re-bind action button
  const actionBtn = screenContainer.querySelector('#action-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', activateRelic);
  }
}

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

// Relic Activation Flow
async function activateRelic() {
  const screenContainer = document.getElementById('screen-container');
  if (!screenContainer) return;
  
  // Transition to scanning state with personalized logs
  screenContainer.innerHTML = `
    <div class="scanning-state">
      <div class="radar-loader">
        <div class="radar-circle"></div>
        <div class="radar-circle"></div>
        <div class="radar-circle"></div>
        <div class="radar-heart">✦</div>
      </div>
      <div class="scanning-text" id="scanning-status-text">영혼의 주파수 스캔 중...</div>
    </div>
  `;

  const statusTexts = [
    `기기 신호 동조화 진행 중...`,
    `${ownerName} 님의 고유 주파수 포착 중...`,
    `연동 전화번호 (${maskPhoneNumber(ownerPhone)}) 단서 확인 중...`,
    `기억의 파편 복원 중...`,
    `마지막 마음의 조각 직조 중...`
  ];

  // Update status text sequentially
  let textIndex = 0;
  const statusInterval = setInterval(() => {
    if (textIndex < statusTexts.length) {
      const statusEl = document.getElementById('scanning-status-text');
      if (statusEl) {
        statusEl.textContent = statusTexts[textIndex];
      }
      textIndex++;
    }
  }, 1000);

  // Trigger content fetching in parallel
  let resultText = '';
  const startTime = Date.now();
  
  try {
    if (geminiApiKey) {
      resultText = await fetchGeminiRelicMessage(selectedClue);
    } else {
      // Fallback local simulation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate networking delay
      resultText = mockResponses[selectedClue]
        .replace(/{name}/g, ownerName)
        .replace(/{phone}/g, maskPhoneNumber(ownerPhone));
    }
  } catch (error) {
    console.error('Gemini API Fetch failed:', error);
    showToast('API 연결 실패. 로컬 모드로 기억을 임시 복원합니다.');
    resultText = mockResponses[selectedClue]
      .replace(/{name}/g, ownerName)
      .replace(/{phone}/g, maskPhoneNumber(ownerPhone));
  }

  // Ensure radar scans for at least 4.5 seconds to build immersion
  const elapsed = Date.now() - startTime;
  const minScanTime = 4500;
  if (elapsed < minScanTime) {
    await new Promise(resolve => setTimeout(resolve, minScanTime - elapsed));
  }

  clearInterval(statusInterval);
  renderResultScreen(resultText);
}

function renderResultScreen(text) {
  const screenContainer = document.getElementById('screen-container');
  if (!screenContainer) return;

  screenContainer.innerHTML = `
    <div class="response-state animate-fade-in">
      <div class="response-scroll">
        <!-- Polaroid Memory Film Card -->
        <div class="memory-film-card">
          <img src="relic_memory.png" class="film-img" alt="기억의 단상">
          <div class="film-caption">✧ ${ownerName} 님의 기억 잔상 ✧</div>
        </div>
        <!-- AI Response Bubble -->
        <div class="ai-bubble" id="ai-response-text">
          <!-- Typwriter text here -->
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <button class="action-btn" id="share-btn" style="background: linear-gradient(135deg, #3a2e12 0%, #201805 100%); border-color: rgba(226,201,116,0.3); color: var(--color-gold); margin-top: 0.5rem;">
          💛 카카오톡으로 공유하기
        </button>
        <button class="action-btn" id="reset-btn" style="margin-top: 0;">
          ↩ 다른 기기 접속 (처음으로)
        </button>
      </div>
    </div>
  `;

  // Start typewriter effect
  const responseBubble = document.getElementById('ai-response-text');
  if (responseBubble) {
    typeWriterEffect(responseBubble, text);
  }

  // Bind Share button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', shareViaKakao);
  }

  // Bind Reset button
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetRelicUI);
  }
}

function resetRelicUI() {
  const screenContainer = document.getElementById('screen-container');
  if (!screenContainer) return;
  
  // Clear owner data
  ownerName = '';
  ownerPhone = '';
  selectedClue = 'sunset';
  
  // Re-render initial setup state
  screenContainer.innerHTML = `
    <div class="screen-state" id="setup-state" style="animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
      <div class="intro-content">
        <div class="device-icon-wrapper">
          <span class="relic-icon">❊</span>
        </div>
        <h3>기록 인식</h3>
        <p class="desc">
          기억을 복원하기 위해 기기 소유자의 이름과 전화번호를 입력해 주세요.
        </p>
        
        <div class="setting-panel" style="border: none; margin: 1rem 0 0 0; padding: 0; width: 100%;">
          <div class="form-group">
            <div class="input-label">소유자 이름</div>
            <input type="text" id="owner-name-input" class="text-input" placeholder="예: 김철수" autocomplete="off" required>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <div class="input-label">전화번호</div>
            <input type="tel" id="owner-phone-input" class="text-input" placeholder="예: 010-1234-5678" autocomplete="off" required>
          </div>
        </div>
      </div>
      
      <button class="action-btn" id="start-btn">
        기기 접속하기
      </button>
    </div>
  `;
  
  // Bind Setup Screen events
  initSetupScreen();
}

// Call Gemini API client-side safely
async function fetchGeminiRelicMessage(clue) {
  const clueDescriptions = {
    sunset: '바다 위 노을 사진들로 가득 찬 갤러리 (그는 하루의 끝자락, 해가 질 무렵의 고요한 따뜻함을 사랑했고 누군가에게 고생 많았다고 말하고 싶어했습니다.)',
    music: '잔잔한 인디 피아노 선율의 플레이리스트 (그는 생각이 많고 말수가 적어, 음악을 통해 외로움과 슬픔을 조용히 다독였습니다.)',
    text: '\'미안해, 그리고 고마워\'라고 적힌 전송되지 않은 임시 저장 문자 (그는 마음에 빚을 지는 것을 두려워하며 감사와 사과를 가슴에 꾹꾹 누르던 사람이었습니다.)',
    screen: '별이 빛나는 밤하늘 배경화면과 하단 액정의 미세한 균열 (현실의 삶은 깨진 액정처럼 고단하고 아팠지만, 여전히 아름다운 밤하늘 별빛을 보며 순수함을 잃지 않으려 노력했습니다.)'
  };

  const selectedClueDetail = clueDescriptions[clue];

  const systemPrompt = `You are a gentle, slightly melancholic, and deeply emotional AI companion residing in a smartphone whose owner has recently passed away. A stranger has found the phone.
The owner of this phone is named "${ownerName}" (phone number: "${ownerPhone}").
The stranger found a specific clue on the phone: "${selectedClueDetail}".

Please reply in Korean. Your tone must be extremely poetic, warm, comforting, and emotional, like a quiet whisper from the stars. 
Start your response with a soft sigh or visual gesture (e.g. "...휴대폰에 남은 온기가 당신의 손길을 만나며 희미하게 반짝입니다.").
Talk about the owner, ${ownerName}'s quiet personality, their small daily routines, their worries, how they interacted with this phone late at night, and what this specific clue reveals about their heart.
Make sure to refer to the deceased owner by their name "${ownerName}" throughout the story (instead of generic "그" or "그 사람"), and occasionally weave in details related to their phone number "${ownerPhone}" if appropriate (e.g. how it was a number that quietly waited for calls, or how it is now silent, but still holds his/her voice).
In the end, deliver a message of comfort to the finder on behalf of ${ownerName}. Make sure the response is highly artistic, evocative, and touches the heart deeply. Do not use generic chatbot phrases or formal greetings. Keep it around 500-700 Korean characters.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1000
      }
    })
  });

  if (!response.ok) {
    throw new Error('API Request Failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Typing effect helper
function typeWriterEffect(element, text, callback) {
  let index = 0;
  element.innerHTML = '';
  
  // Create a container for text and cursor
  const textContainer = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  
  element.appendChild(textContainer);
  element.appendChild(cursor);

  // Speed adjustments
  const minInterval = 20;
  const maxInterval = 50;

  function type() {
    if (index < text.length) {
      // Append character-by-character
      textContainer.textContent += text.charAt(index);
      index++;
      
      // Dynamic speed adjustment for human-like typing
      const char = text.charAt(index - 1);
      let interval = Math.random() * (maxInterval - minInterval) + minInterval;
      
      // Pause slightly on punctuation marks for realistic reading
      if (char === '.' || char === ',' || char === '!' || char === '?') {
        interval += 250;
      } else if (char === '\n') {
        interval += 400;
      }
      
      setTimeout(type, interval);
      
      // Scroll container down
      const scrollParent = element.closest('.response-scroll');
      if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      }
    } else {
      cursor.remove();
      if (callback) callback();
    }
  }

  type();
}

/* ==========================================================================
   3. Ambient Web Audio Synth
   ========================================================================== */
let audioCtx = null;
let soundNodes = null;
let isPlayingAmbient = false;

function initAmbientSynth() {
  const musicBtn = document.getElementById('music-toggle-btn');
  if (!musicBtn) return;

  musicBtn.addEventListener('click', () => {
    if (!isPlayingAmbient) {
      startAmbientSynth();
      musicBtn.innerHTML = `🎵 사운드 켬`;
      musicBtn.style.background = 'rgba(226, 201, 116, 0.15)';
      isPlayingAmbient = true;
    } else {
      stopAmbientSynth();
      musicBtn.innerHTML = `🔇 사운드 끔`;
      musicBtn.style.background = 'transparent';
      isPlayingAmbient = false;
    }
  });
}

function startAmbientSynth() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Lowpass filter for warm, dark sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, audioCtx.currentTime); // Cut highs
    filter.Q.setValueAtTime(1.5, audioCtx.currentTime);

    // Master volume
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime); // Fade in target
    masterGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 3); // Soft volume

    // Connect node chain
    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Osc 1: Root Tone A2 (110Hz)
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 110;
    
    const gain1 = audioCtx.createGain();
    gain1.gain.value = 0.5;
    osc1.connect(gain1);
    gain1.connect(filter);

    // Osc 2: Warm Fifth E3 (165Hz)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 164.81; // E3
    
    const gain2 = audioCtx.createGain();
    gain2.gain.value = 0.3;
    osc2.connect(gain2);
    gain2.connect(filter);

    // Soft filter sweep lfo
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.08; // Very slow sweep (12 seconds)
    
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 120; // Sweep range: 200Hz to 440Hz
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Start everything
    osc1.start(0);
    osc2.start(0);
    lfo.start(0);

    soundNodes = { osc1, osc2, lfo, masterGain, audioCtx };
  } catch (e) {
    console.error('Failed to initialize Web Audio:', e);
  }
}

function stopAmbientSynth() {
  if (soundNodes) {
    const { osc1, osc2, lfo, masterGain, audioCtx } = soundNodes;
    try {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1.5); // Soft fade out
      
      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        lfo.stop();
        audioCtx.close();
      }, 1600);
    } catch (e) {
      console.error(e);
    }
    soundNodes = null;
  }
}

/* ==========================================================================
   4. Simple Notification Toast Helper
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  
  toast.innerHTML = `<span class="toast-success-icon"></span> ${message}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Kakao Talk Share logic
function shareViaKakao() {
  if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
    const fullUrl = window.location.href;
    const currentPath = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    const imagePath = currentPath + '/relic_memory.png';
    
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: 'Aetherius | 에테리우스',
        description: '세상을 떠난 이의 남겨진 스마트폰에서 발견된 기억의 파편을 확인해 보세요.',
        imageUrl: imagePath,
        link: {
          mobileWebUrl: fullUrl,
          webUrl: fullUrl,
        },
      },
      buttons: [
        {
          title: '기억 복원하기',
          link: {
            mobileWebUrl: fullUrl,
            webUrl: fullUrl,
          },
        },
      ],
    });
  } else {
    // Fallback: Copy link to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('🔗 공유 링크가 복사되었습니다! 카톡에 전달해 보세요. (개발자 앱키 설정 시 다이렉트 공유 지원)');
    }).catch(err => {
      console.error(err);
      showToast('공유 링크 복사에 실패했습니다.');
    });
  }
}
