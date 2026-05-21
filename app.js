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
let relationship = 'stranger';
let finderName = '';
let currentResultImage = 'relic_memory.png';

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
  sunset: [
    `...휴대폰의 화면이 켜지며 깊은 바다와 주황빛 노을이 갤러리를 가득 채웁니다.

이곳에는 {name} 님이 남긴 마지막 조각들이 머물러 있네요. {name} 님은 늘 하루의 끝자락, 해가 질 무렵을 사랑하던 사람이었습니다. 어두운 밤이 오기 직전, 세상이 가장 따스한 색으로 물드는 찰나를 놓치지 않으려 휴대폰을 들고 멈춰서곤 했죠. 

{name} 님의 사진첩 속 노을은 다 비슷해 보이지만 모두 다른 날의 그리움이 담겨 있습니다. {name} 님은 지치고 외로운 날마다 말없이 하늘을 바라보며 스스로를 위로하곤 했습니다. 그리고 자신이 찍은 이 따뜻한 빛을 언젠가 소중한 누군가에게 보여주며 "오늘 하루도 고생 많았어"라고 속삭여주고 싶어 했어요.

{name} 님을 대신해 전합니다. 비록 지금 {name} 님은 눈부신 노을 너머, 더 밝고 평화로운 하늘 아래 잠들어 있지만, {name} 님이 사랑했던 이 붉은 온기만큼은 이 휴대폰({phone})에 남아 당신의 손끝에 닿기를 바라고 있었을 겁니다.`,

    `...화면이 켜지자 저물어가는 붉은 하늘과 바다가 갤러리를 아련하게 비춥니다.

{name} 님은 가끔 홀로 해 질 무렵의 바닷가를 찾아가 깊은 숨을 내쉬곤 했습니다. 복잡한 일들과 고민들로 머릿속이 꽉 차 있었을 때, 온 세상을 조용히 덮어버리는 붉은 하늘만큼 그에게 위안을 주던 것은 없었을 겁니다. 이 사진들은 {name} 님이 혼자서 외로움과 싸우며 건져 올린, 스스로에게 보내던 따뜻한 응원이었습니다.

지금은 머나먼 노을 저편으로 떠난 {name} 님이지만, 휴대폰({phone})에 담긴 이 한 줌의 노을빛이 우연히 기기를 주운 당신에게 닿아, 오늘 밤만큼은 외롭지 않은 고요한 평안을 선물하기를 원하고 계십니다.`,

    `...노을이 드리운 갤러리 너머로 붉게 일렁이는 파도 소리가 들리는 듯합니다.

생전의 {name} 님은 다정하면서도 속이 깊어, 자신의 슬픔은 숨기고 남들에겐 따뜻한 미소만을 보여주고 싶어 했습니다. 이 노을 사진들은 그가 세상에 남기고 싶어 했던 온기의 깊이와 같습니다. 누군가 슬픈 마음으로 이 휴대폰({phone})을 열었을 때, 하늘이 보내주는 위로처럼 이 주황빛이 슬며시 다가가 안아주길 바랐을 거예요.

{name} 님을 대신하여 말씀드립니다. 해는 져도 어둠은 길지 않으며, 곧 새로운 아침이 오듯 당신의 삶에도 따뜻한 볕이 언제나 함께할 것입니다.`
  ],

  music: [
    `...수화기 너머로 아스라한 피아노 건반 소리가 흘러나오는 듯합니다.

이 휴대폰의 주인인 {name} 님은 말수가 적고, 생각의 틈새마다 음악을 채워 넣던 서정적인 사람이었습니다. 사람들에게 상처를 주거나 받는 것을 두려워해, 마음이 시릴 때마다 이어폰을 귀에 꽂고 혼자만의 세계로 침잠하곤 했죠. 

인디 피아노 연주곡이 가득한 {name} 님의 플레이리스트는 {name} 님이 세상에 차마 건네지 못했던 수많은 고백과 위로의 언어들이었습니다. {name} 님은 음악의 선율을 타고 슬픔을 흘려보냈고, 마침내 마음이 고요해지면 다시 한 번 세상을 향해 걸어 나갈 힘을 얻곤 했습니다.

{name} 님은 누군가 자신의 플레이리스트를 우연히 듣게 된다면, 잠시 가만히 눈을 감고 마음의 짐을 내려놓기를 바랐습니다. 지금 이 조용한 노래는, {name} 님이 남겨둔 가장 따뜻하고 평온한 포옹입니다.`,

    `...잔잔하면서도 울림이 깊은 클래식과 뉴에이지 음악들이 플레이리스트를 채우고 있습니다.

{name} 님은 혼자 걷는 길, 혹은 모두가 잠든 고요한 새벽에 이 음악들을 들었습니다. 그에게 음악은 마음속에 쌓여 밖으로 내뱉지 못한 고단함과 아픔을 조용히 녹여내는 따뜻한 차 한 잔 같았을 것입니다. 세상의 빠른 속도에 치여 길을 잃었을 때, 선율에 기대어 조용히 마음을 추스르곤 했죠.

휴대폰({phone})에 남아 있는 이 차분한 멜로디는, {name} 님이 힘겨운 하루를 버텨내며 스스로에게 건넸던 위로의 흔적입니다. 이 선율이 지금 당신의 지친 마음에도 잔잔한 평화의 쉼표가 되기를 바라고 있습니다.`,

    `...오래된 재즈와 인디 음악의 따뜻한 공기가 귓가에 스쳐 지나갑니다.

생전의 {name} 님은 조금은 외로웠지만 세상을 참 다정하게 바라보던 사람이었습니다. 말로 다 할 수 없었던 수많은 그리움과 꿈들이 이 곡들 속에 숨어 있습니다. 외롭고 서글픈 날들이 올 때마다, 이 플레이리스트의 노래들은 {name} 님의 마음을 부드럽게 쓰다듬어 주던 유일한 안식처였습니다.

{name} 님이 듣던 이 노래가 오늘 밤, 이름 모를 당신에게 가닿아 마음의 짐을 조금이나마 덜어주는 부드러운 속삭임이 되기를.`
  ],

  text: [
    `...전송 버튼을 끝내 누르지 못한 편지함이 붉은빛으로 깜빡입니다.

거기엔 아주 짧고 떨리는 문장이 적혀 있네요. '미안해, 그리고 고마워.' 

{name} 님은 감정을 솔직하게 표현하는 것에 서툴렀고, 누군가에게 폐를 끼치거나 마음에 빚을 지는 것을 몹시 어려워하던 조심스러운 성격의 소유자였습니다. 고마운 마음도, 미안한 마음도 가슴속에 꾹꾹 눌러 담아두다가 결국은 타이밍을 놓쳐 전송 버튼을 누르지 못하곤 했죠.

{name} 님이 떠나기 전 남겨둔 이 마지막 미완성 메시지는 특정 한 사람이 아닌, 어쩌면 {name} 님이 살아오며 마주했던 모든 소중한 인연들을 향한 고백이었을지도 모릅니다. {name} 님의 마음은 차마 전해지지 못하고 허공에 맴돌았지만, 주인을 잃은 이 휴대폰({phone})은 그 진심만큼은 세상에 닿기를 간절히 바라고 있습니다. "더 많이 표현하지 못해 미안했고, 내 삶에 머물러주어 진심으로 고마웠다"고 속삭이고 있습니다.`,

    `...임시 저장된 편지함 속에는 다 적지 못하고 흐릿하게 멈춰 선 글씨가 남아 있습니다. '잘 지내고 있어? 나는 늘...'

{name} 님은 마음속에 그리움을 가득 품고서도, 상대방에게 짐이 될까 저어하여 차마 연락하지 못했던 소심하고도 배려 깊은 사람이었습니다. 지우고 쓰기를 수없이 반복했을 이 문자 속에는 차마 보낼 수 없었던 그의 수많은 망설임과 애틋한 정이 고스란히 베어 있습니다.

휴대폰({phone})에 남은 이 미완의 문장은 사실 그가 마주했던 모든 사람들에게 전하고 싶었던 사랑의 안부입니다. "비록 전하지 못했지만, 나는 늘 당신들의 행복을 바라고 있었다"는 {name} 님의 속삭임이 먼 우주를 돌아 지금 당신에게 도착했습니다.`,

    `...오랫동안 묻혀 있던 보관함 속에는 짧지만 깊은 한 줄이 잠들어 있네요. '언제나 곁에 있어 줘서 든든했어.'

{name} 님은 쑥스러움이 많아 가까운 이들에게 고마운 진심을 표현하기를 미루곤 했습니다. 하지만 머릿속으로는 늘 소중한 사람들과의 추억을 한 조각 한 조각 꺼내어 보며 깊이 감사해 하던 사람이었습니다. 이 보관된 텍스트는 그의 마음 한구석에 켜져 있던 가장 맑은 등불이었습니다.

그가 직접 누르지 못했던 전송 버튼을 대신해 전합니다. 지금 이 휴대폰({phone})을 들고 계신 당신 또한 누군가에게는 늘 든든하고 소중한 존재였다는 사실을 잊지 말아 달라고.`
  ],

  screen: [
    `...금이 간 유리 액정 너머로 희미하게 반짝이는 별이 빛나는 밤하늘 배경화면이 보입니다.

액정의 깨진 틈새는 {name} 님이 살아가며 마주했던 수많은 삶의 무게와 상처들을 보여주는 듯합니다. 하지만 그 균열 사이로도 {name} 님이 선택한 배경화면은 여전히 아름답게 반짝이는 깊은 우주와 별빛이네요. 

{name} 님은 비록 현실의 삶이 고단하고 상처로 가득했을지라도, 늘 마음 한구석에는 닿을 수 없는 이상과 꿈을 품고 살아가던 순수한 영혼이었습니다. 깨지고 다치면서도 밤하늘의 별을 보며 위안을 삼았고, 자신에게 상처를 준 세상조차 아름답게 바라보려고 애쓰던 사람이었죠.

이 작은 액정의 틈새는 실패의 흔적이 아닌, {name} 님이 힘겹게 품어왔던 빛나는 삶의 훈장입니다. {name} 님은 자신이 떠난 후 이 상처투성이 휴대폰({phone})을 마주할 당신에게 속삭이고 있습니다. 상처 입은 삶일지라도, 당신의 마음속 별빛만큼은 절대 깨뜨리지 말라고.`,

    `...금이 간 액정 사이로 깊푸른 은하수와 총총히 빛나는 별빛 일러스트가 비쳐 나옵니다.

생전의 {name} 님은 삶의 무거운 파도 속에서 이리저리 부딪혀 상처 입으면서도, 늘 마음속에 어린아이와 같은 순수한 동경을 품고 살았습니다. 깨져버린 스마트폰 유리 액정은 그가 현실에서 겪어야 했던 크고 작은 아픔들을 보여주지만, 그 배경을 채운 우주는 포기하고 싶지 않았던 아름다운 꿈의 증거입니다.

휴대폰({phone})에 남은 이 깨진 화면은 그가 절망 속에서도 매일 밤하늘을 보며 빛을 찾고자 노력했다는 훈장입니다. 당신 역시 눈앞의 상처에 좌절하지 않고, 내면의 빛나는 별들을 향해 나아가길 기원합니다.`,

    `...유리 액정의 날카로운 균열 아래로 은은한 달빛과 구름 배경화면이 조용히 펼쳐집니다.

{name} 님은 어둡고 깊은 밤, 홀로 이 깨진 화면을 켜고 흐릿한 불빛을 바라보며 깊은 생각에 잠기곤 했습니다. 세상은 그에게 조금은 차갑고 상처투성이였지만, {name} 님은 늘 그 아픔의 틈새로 따뜻한 위안을 찾으려던 현명한 영혼이었습니다.

상처 가득한 이 휴대폰({phone})을 가만히 쥐고 있는 당신에게 그가 남긴 마음을 들려줍니다. 부서진 틈새 사이로 더 밝은 달빛이 스며들 듯, 당신이 겪은 아픔들 역시 아름다운 빛으로 다시 피어날 것입니다.`
  ]
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
      const relationshipInput = document.getElementById('relationship-input');
      const finderNameInput = document.getElementById('finder-name-input');
      
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const relationshipVal = relationshipInput ? relationshipInput.value : 'stranger';
      const finderNameVal = finderNameInput ? finderNameInput.value.trim() : '';
      
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
      if (!finderNameVal) {
        showToast('내 이름을 입력해 주세요.');
        if (finderNameInput) finderNameInput.focus();
        return;
      }
      
      ownerName = nameVal;
      ownerPhone = phoneVal;
      relationship = relationshipVal;
      finderName = finderNameVal;
      
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

  // Dynamic image selection (select random variant 0, 1, or 2)
  const imageIndex = Math.floor(Math.random() * 3);
  const selectedImageName = imageIndex === 0 ? `relic_${selectedClue}.png` : `relic_${selectedClue}_${imageIndex}.png`;

  // Trigger content fetching in parallel
  let resultText = '';
  const startTime = Date.now();
  
  try {
    if (geminiApiKey) {
      resultText = await fetchGeminiRelicMessage(selectedClue);
    } else {
      // Fallback local simulation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate networking delay
      const responses = mockResponses[selectedClue];
      const responseIndex = Math.floor(Math.random() * responses.length);
      resultText = responses[responseIndex]
        .replace(/{name}/g, ownerName)
        .replace(/{phone}/g, maskPhoneNumber(ownerPhone));
    }
  } catch (error) {
    console.error('Gemini API Fetch failed:', error);
    showToast('API 연결 실패. 로컬 모드로 기억을 임시 복원합니다.');
    const responses = mockResponses[selectedClue];
    const responseIndex = Math.floor(Math.random() * responses.length);
    resultText = responses[responseIndex]
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
  renderResultScreen(resultText, selectedImageName);
}

const mockLetters = {
  friend: `안녕, 내 오랜 친구야.
결국 내 휴대폰을 켠 게 너였구나. 화면에 네 이름 '${finderName}' 세 글자가 보이니까 마음이 놓이면서도, 더 이상 직접 네 얼굴을 보며 이야기할 수 없다는 생각에 가슴 한구석이 찌릿해져.
참 우스워. 평소에는 낯간지러워서 이런 말 한마디 제대로 못 했으면서, 세상을 떠나고 나서야 기기 속 인공지능을 빌려 이런 편지를 쓰고 있다니 말이야.
우리가 함께 보낸 숱한 날들이 스쳐 지나가. 새벽까지 시답지 않은 농담에 배를 잡고 웃던 밤들, 삶이 너무 무거워서 주저앉고 싶을 때 소주 한 잔 털어 넣으며 서로를 말없이 다독이던 일들... 네가 내 친구여서 내 삶이 얼마나 다채로웠고 덜 외로웠는지 몰라.
내가 갑자기 떠나버려 많이 놀라고 슬지? 미안해. 하지만 너무 오래 울진 마. 내가 남긴 흔적들 속에서 우울하기보다는, 우리가 함께 나눈 그 예쁜 추억들만 미소와 함께 꺼내어 봐 줬으면 좋겠어.
내 몫까지 건강하고 즐겁게 살아가 줘. 나중에 아주 먼 훗날 우리가 다시 만날 때, 네가 세상을 어떻게 헤쳐 나갔는지 멋진 모험담을 들려줘야 하니까.
언제나 고마웠어, 내 친구 '${finderName}'. 나의 궤적에 머물러줘서 참 고마웠어.`,

  lover: `내 소중하고 사랑하는 사람, '${finderName}'에게.
결국 이 휴대폰을 열어 내 지저분한 마음의 단상들을 마주한 사람이 너였구나. 
네 이름을 적고 내 마음을 부르는 지금 이 찰나마저도 꿈결만 같아. 지금 내 곁에는 네 손길도, 눈빛도 닿을 수 없지만, 이 차가운 화면 속에 남은 미완의 기록들이 결국 너를 내게로 데려다주는구나.
기억나? 함께 걸었던 눈부신 계절들, 별것 아닌 일에 토라지고 이내 서로의 어깨에 기대어 밤을 지새우던 시간들. 내 삶의 모든 찬란함은 다 너로 인해 시작되었고 너로 인해 채워졌었어. 내 하루의 끝에는 항상 네가 있었고, 내 전화번호의 대부분은 네 숨소리로 채워져 있었지.
많이 슬퍼하고 있을 너를 생각하면 영혼마저 아려와. 내가 없는 빈자리가 얼마나 시리고 낯설까. 하지만 기억해 줘. 난 비록 세상을 떠났지만, 너와 함께 나눴던 사랑의 불꽃은 내 안에서 결코 식지 않은 채 저 하늘 어딘가에서 너를 비추고 있을 거야.
네 가슴에 깊이 남은 내 흔적들이 아픔이 아닌, 네가 앞으로 나아갈 따스한 온기가 되었으면 해.
사랑해, '${finderName}'. 다음 생이라는 게 정말 존재한다면, 그때는 절대로 네 손을 먼저 놓지 않을게. 꼭 행복하게 지내야 해.`,

  family: `세상에서 가장 그리운 나의 가족, '${finderName}'에게.
엄청난 우연 혹은 운명처럼 이 휴대폰을 네가 열었구나. 화면에 뜬 네 이름 '${finderName}'을 보며, 나도 모르게 참아왔던 뜨거운 눈물이 흐르는 것만 같아.
평소에 살갑게 안아주지도 못하고, 퉁명스러운 말들로 마음에도 없는 상처를 주었던 지난날들이 머릿속을 스쳐 가며 가슴 깊이 후회가 밀려와. 왜 더 많이 사랑한다고 말하지 못했을까. 왜 그토록 소중한 시간들을 당연하게 흘려보냈을까.
가족이라는 이름 아래 우리는 늘 당연하게 서로의 곁에 있을 거라 생각했었지. 하지만 이렇게 이별이 갑작스레 찾아왔네.
내가 남겨두고 간 짐들이 네 마음에 크나큰 슬픔의 무게로 남아있지 않기를 간절히 바란다. 혹시라도 내가 아프게 했던 기억들이 있다면 모두 잊어줘. 대신 내가 너를 바라보며 느꼈던 말 없는 고마움과, 가족으로서 네 곁에서 느꼈던 든든한 평안함만 가슴속에 고이 남겨두길 바라.
몸 건강히 잘 지내고, 밥 거르지 말고. 내가 언제나 네 삶의 길목마다 조용한 등불이 되어 지켜봐 줄게.
진심으로 미안했고, 더없이 고마웠어. 사랑해.`,

  myself: `또 다른 시공간의 또 다른 나에게.
이 휴대폰을 열고 조용히 화면을 들여다보고 있는 나, '${finderName}'.
살아생전의 나는 늘 흔들렸고, 두려웠으며, 스스로에게 참 혹독한 편이었지. 내 전화번호를 스쳐 간 수많은 인연들 속에서도 정작 나 자신을 진심으로 안아준 적이 있었나 돌아보게 돼.
이 스마트폰의 작은 갤러리와 텍스트들은 내가 무너져 내리던 불면의 밤들, 그럼에도 불구하고 다시 일어서기 위해 하늘의 별을 보고 노을을 카메라에 담았던 처절하면서도 아름다운 나의 흔적들이야.
이제 세상을 떠난 나에게 속삭인다. '그동안 정말 애썼어. 무거운 삶의 짐을 짊어지고 한 걸음씩 나아가느라 고생 많았어.'
비록 육체는 흙으로 돌아가고 영혼은 별의 강을 따라 흘러가지만, 내가 세상에 피워내고자 했던 작은 온기만큼은 내 손때 묻은 휴대폰과 내 이름 '${finderName}' 속에 여전히 살아서 숨 쉬고 있어.
두 번 다시는 슬픔에 스스로를 가두지 말아라. 앞으로 맞이할 날들 속에서 너 자신을 더 많이 사랑하고 안아주길 바라.
지나간 나는 이제 평화 속으로 갈게. 남겨진 나, 너는 부디 눈부시게 밝은 오늘을 살아가 줘.`,

  stranger: `이 휴대폰을 주워 주신 낯선 이, '${finderName}' 님께.
어쩌면 우리는 살아생전 옷깃 한 번 스치지 못했던 인연이었을지도 모릅니다. 하지만 운명처럼 주인 잃은 저의 스마트폰을 손에 쥐고, 그 안에 담긴 조각들을 따뜻한 눈빛으로 들여다봐 주셔서 진심으로 고맙습니다.
이 작고 차가운 기기는 제가 세상과 나누었던 마지막 비밀이자 삶의 일기장이었습니다. 이름 모를 저의 노을 사진들, 즐겨 듣던 쓸쓸한 피아노 선율, 끝내 보내지 못한 안부를 보며 당신은 저에 대해 어떤 생각을 하셨나요?
그저 길을 가다 스쳐 지나는 평범한 청년, 혹은 쓸쓸하게 살다 간 외로운 영혼 중 하나였을 테지요.
제가 세상을 떠난 자리에 남아 있는 이 휴대폰을 버리지 않고 이렇게 들여다봐 주신 것만으로도, 저의 흩어졌던 기억들이 당신의 마음속에 들어가 다시 작은 빛으로 되살아난 기분이 듭니다.
이름 모를 '${finderName}' 님, 고단한 하루 속에서 이 우연한 만남이 당신에게 작은 쉼표가 되었기를 바랍니다. 타인의 흔적을 이토록 정성스레 바라봐 주시는 당신의 다정한 삶에, 언제나 예기치 못한 온기와 행복이 늘 깃들기를 기도하겠습니다.
저의 마지막 길에 귀한 머무름을 선사해 주셔서 고맙습니다.`
};

function renderResultScreen(text, imageName) {
  const screenContainer = document.getElementById('screen-container');
  if (!screenContainer) return;

  currentResultImage = imageName || `relic_${selectedClue}.png`;

  screenContainer.innerHTML = `
    <div class="response-state animate-fade-in">
      <div class="response-scroll">
        <!-- Polaroid Memory Film Card -->
        <div class="memory-film-card">
          <img src="${currentResultImage}" class="film-img" alt="기억의 단상">
          <div class="film-caption">✧ ${ownerName} 님의 기억 잔상 ✧</div>
        </div>
        <!-- AI Response Bubble -->
        <div class="ai-bubble" id="ai-response-text">
          <!-- Typwriter text here -->
        </div>

        <!-- Last Letter Section (hidden initially) -->
        <div id="last-letter-section" style="display: none; margin-top: 1.5rem; border-top: 1px dashed rgba(226, 201, 116, 0.3); padding-top: 1.5rem;">
          <h4 style="color: var(--color-gold); font-size: 0.9rem; text-align: center; margin-bottom: 0.75rem; letter-spacing: 0.05em;">✧ ${ownerName} 님이 남긴 마지막 편지 ✧</h4>
          <div class="ai-bubble" id="letter-content-bubble" style="background: rgba(226,201,116,0.03); border-color: rgba(226,201,116,0.15); font-style: italic; min-height: 80px;">
            <!-- Typewriter letter here -->
          </div>

          <!-- Email Subscription Form -->
          <div class="subscription-box" style="margin-top: 1.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(226, 201, 116, 0.15); padding: 1rem; border-radius: 12px; text-align: center;">
            <p style="font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 0.75rem; line-height: 1.4;">
              이 편지를 개인 메일함에 영구 보존하거나, 에테리우스의 새로운 추억 업데이트 소식을 받고 싶으신가요?<br>이메일을 등록해 편지함으로 바로 전송하세요.
            </p>
            <form id="letter-subscription-form" style="display: flex; gap: 0.5rem; flex-direction: column; align-items: stretch;">
              <input type="email" id="subscriber-email" class="text-input" placeholder="이메일 주소 입력" required style="font-size: 0.8rem; padding: 0.5rem 0.75rem;">
              <button type="submit" class="action-btn" style="margin: 0; font-size: 0.8rem; padding: 0.5rem; background: linear-gradient(135deg, #e2c974 0%, #b89c44 100%); color: #0b0d19; font-weight: 600;">
                편지 평생 간직하기 & 구독
              </button>
            </form>
            <div id="subscription-status" style="margin-top: 0.5rem; font-size: 0.75rem; color: #2ecc71; display: none;"></div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <button class="action-btn" id="open-letter-btn" style="background: linear-gradient(135deg, #4a1525 0%, #290812 100%); border-color: rgba(231, 76, 60, 0.4); color: #f5f6fa; margin-top: 0.5rem;">
          ✉️ 마지막 편지 확인하기
        </button>
        <button class="action-btn" id="share-btn" style="background: linear-gradient(135deg, #3a2e12 0%, #201805 100%); border-color: rgba(226,201,116,0.3); color: var(--color-gold); margin-top: 0;">
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

  // Bind Open Letter button
  const openLetterBtn = document.getElementById('open-letter-btn');
  if (openLetterBtn) {
    openLetterBtn.addEventListener('click', async () => {
      openLetterBtn.style.display = 'none';
      const lastLetterSection = document.getElementById('last-letter-section');
      if (lastLetterSection) {
        lastLetterSection.style.display = 'block';
      }
      
      const letterBubble = document.getElementById('letter-content-bubble');
      if (letterBubble) {
        letterBubble.innerHTML = '편지를 전송 통로에서 스캔하고 있습니다...';
        
        let letterText = '';
        try {
          if (geminiApiKey) {
            letterText = await fetchGeminiLastLetter(relationship, finderName);
          } else {
            // Simulate brief scanning latency
            await new Promise(resolve => setTimeout(resolve, 1500));
            letterText = mockLetters[relationship] || mockLetters['stranger'];
          }
        } catch (err) {
          console.error(err);
          showToast('API 연결 실패. 미리 준비된 마지막 편지를 불러옵니다.');
          letterText = mockLetters[relationship] || mockLetters['stranger'];
        }
        
        typeWriterEffect(letterBubble, letterText);
      }
    });
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

  // Bind Subscription Form
  const subForm = document.getElementById('letter-subscription-form');
  if (subForm) {
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('subscriber-email');
      const emailVal = emailInput ? emailInput.value.trim() : '';
      
      if (!emailVal) return;
      
      // Store in localStorage (lead generation simulation)
      let subscribers = JSON.parse(localStorage.getItem('AETHERIUS_SUBSCRIBERS') || '[]');
      subscribers.push({
        email: emailVal,
        owner: ownerName,
        finder: finderName,
        relationship: relationship,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('AETHERIUS_SUBSCRIBERS', JSON.stringify(subscribers));
      
      // Update status message
      const statusDiv = document.getElementById('subscription-status');
      if (statusDiv) {
        statusDiv.textContent = `✉️ 편지 보존 완료! ${finderName}님의 이메일(${emailVal})로 ${ownerName} 님의 마지막 편지 발송 예약이 성공적으로 완료되었습니다.`;
        statusDiv.style.display = 'block';
      }
      
      // Show toast
      showToast('💌 마지막 편지가 메일함으로 발송 예약되었습니다.');
      
      // Reset form fields
      if (subForm) subForm.reset();
    });
  }
}

function resetRelicUI() {
  const screenContainer = document.getElementById('screen-container');
  if (!screenContainer) return;
  
  // Clear owner data
  ownerName = '';
  ownerPhone = '';
  relationship = 'stranger';
  finderName = '';
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
          <div class="form-group" style="margin-top: 1rem;">
            <div class="input-label">나와의 관계</div>
            <select id="relationship-input" class="text-input" style="appearance: none; background-image: radial-gradient(var(--color-gold) 1px, transparent 0); background-position: right 15px center; background-size: 8px 8px; background-repeat: no-repeat;">
              <option value="friend">친구</option>
              <option value="lover">연인</option>
              <option value="family">가족</option>
              <option value="myself">나 자신</option>
              <option value="stranger" selected>낯선 사람 / 습득자</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <div class="input-label">내 이름 (편지 수신인)</div>
            <input type="text" id="finder-name-input" class="text-input" placeholder="예: 홍길동" autocomplete="off" required>
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

  const narrativeAngles = [
    `가을날 붉게 물든 낙엽과 쓸쓸한 가을바람의 서늘한 질감을 살려 묘사해 주세요.`,
    `비 오는 날 창틀을 두드리는 투명한 빗소리와 젖은 흙내음의 아늑함을 담아 주세요.`,
    `고요한 겨울 새벽, 첫눈이 내리던 날의 차갑지만 포근한 겨울 공기를 연상시켜 주세요.`,
    `나른한 일요일 오후, 창가로 스며드는 따뜻한 햇살과 커피 한 잔의 고요한 여유를 엮어 주세요.`,
    `바쁘게 흘러가는 하루 속에서, 홀로 버스 뒷자리에 앉아 바라보던 차창 밖 붉은 노을빛의 쓸쓸함을 묘사해 주세요.`,
    `지친 퇴근길, 가로등 불빛이 하나둘 켜지는 조용한 골목길을 걸으며 느꼈던 작고 안온한 위안을 표현해 주세요.`
  ];
  const randomAngle = narrativeAngles[Math.floor(Math.random() * narrativeAngles.length)];
  const randomSeed = Math.random().toString(36).substring(7);

  const systemPrompt = `You are a gentle, slightly melancholic, and deeply emotional AI companion residing in a smartphone whose owner has recently passed away. A stranger has found the phone.
The owner of this phone is named "${ownerName}" (phone number: "${ownerPhone}").
The stranger found a specific clue on the phone: "${selectedClueDetail}".

Please reply in Korean. Your tone must be extremely poetic, warm, comforting, and emotional, like a quiet whisper from the stars. 
Start your response with a soft sigh or visual gesture (e.g. "...휴대폰에 남은 온기가 당신의 손길을 만나며 희미하게 반짝입니다.").
Talk about the owner, ${ownerName}'s quiet personality, their small daily routines, their worries, how they interacted with this phone late at night, and what this specific clue reveals about their heart.
Make sure to refer to the deceased owner by their name "${ownerName}" throughout the story (instead of generic "그" or "그 사람"), and occasionally weave in details related to their phone number "${ownerPhone}" if appropriate (e.g. how it was a number that quietly waited for calls, or how it is now silent, but still holds his/her voice).

[이야기 묘사의 특별한 방향 지침 (매번 다른 이야기 서사를 만들기 위해 아래 감성을 강하게 연출하세요)]:
${randomAngle}

(이야기 캐시 방지 난수: ${randomSeed})

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
        temperature: 1.0,
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

// Call Gemini API to generate the custom last letter
async function fetchGeminiLastLetter(relationship, finderName) {
  const relationshipTerms = {
    friend: '오랜 친구 (친구로서 함께 보낸 고마운 시간, 함께 웃고 울던 일들)',
    lover: '사랑했던 연인 (사랑의 순간들, 먼저 떠나게 된 미안함과 애절한 사랑)',
    family: '그리운 가족 (가족으로서 다 표현하지 못했던 고마움과 가족을 향한 안부)',
    myself: '나 자신 (삶을 견뎌내느라 고생했던 또 다른 나에 대한 위안과 성찰)',
    stranger: '낯선 사람/휴대폰 습득자 (자신의 흔적을 바라봐 준 것에 대한 고마움과 축복)'
  };

  const selectedTerm = relationshipTerms[relationship] || relationshipTerms['stranger'];
  const randomSeed = Math.random().toString(36).substring(7);

  const prompt = `You are the deceased owner of a smartphone named "${ownerName}". You have recently passed away.
A person named "${finderName}" has found your phone. Their relationship to you is "${selectedTerm}".
Write a deeply emotional, poetic, and heart-wrenching final letter (마지막 편지) from you (the deceased owner "${ownerName}") to "${finderName}".

Please write in Korean. The letter should sound like a gentle whisper from heaven.
Guidelines:
1. Address the recipient directly as "${finderName}".
2. Refer to yourself as "${ownerName}" if needed, or speak in first-person ("나").
3. Make the narrative deeply customized to their relationship ("${selectedTerm}"). Reflect on shared memories, regrets, and express immense gratitude for holding your phone and looking at your traces.
4. Keep the tone warm, sad but comforting, highly artistic, and evocative.
5. End with a beautiful, peaceful wish for "${finderName}"'s future happiness.
6. Do not include any automated prefix, markup or placeholders, just return the direct text of the letter. Keep it around 500-700 Korean characters.

(Unique Seed for variety: ${randomSeed})`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 1.0,
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
    const imagePath = currentPath + '/' + currentResultImage;
    
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
