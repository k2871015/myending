/**
 * Aetherius - Memory Relic AI Companion JavaScript
 * Implements: Relic states, Gemini API integration, Web Audio Synth, and Particles.
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initRelicApp();
  initAmbientSynth();
  initCookieConsent();
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

이곳에는 {name} 님이 남긴 마지막 삶의 조각들이 따스하게 머물러 있네요. {name} 님은 늘 하루의 끝자락, 해가 질 무렵의 그 짧고 고요한 시간을 유독 사랑하던 사람이었습니다. 어둡고 차가운 밤이 찾아오기 직전, 온 세상이 가장 부드럽고 따뜻한 색으로 물드는 찰나의 순간을 놓치지 않으려, 늘 휴대폰을 들고 길가에 가만히 멈춰서서 카메라 렌즈를 조준하곤 했습니다.

{name} 님의 사진첩 속 수많은 노을 사진들은 겉보기엔 모두 비슷해 보일지 몰라도, 한 장 한 장 저마다 다른 날의 고독과 그리움이 잔잔히 묻어 있습니다. {name} 님은 마음이 복잡하고 지치는 날마다 말없이 하늘을 바라보며 스스로의 상처를 위로하곤 했습니다. 그리고 자신이 담아낸 이 따스한 빛들을 보며, 언젠가 소중한 누군가에게 보여주며 "오늘 하루도 참 고생 많았어, 내일은 조금 더 따뜻할 거야"라고 다정하게 속삭여주고 싶어 했습니다.

{name} 님을 대신하여 이 흔적을 찾아낸 당신에게 진심 어린 목소리를 보냅니다. 비록 지금 {name} 님은 눈부신 노을 너머, 더 밝고 아픔이 없는 하늘 아래 고요히 잠들어 있지만, 그가 남긴 이 붉은 온기만큼은 이 휴대폰({phone})의 화면을 통해 당신의 시린 손끝에 닿아 오늘 밤 당신의 마음을 안아주기를 간절히 바라고 있었을 것입니다.`,

    `...화면이 켜지자 저물어가는 붉은 하늘과 끝없는 바다가 갤러리를 아련하게 비춥니다.

생전의 {name} 님은 가끔 마음이 한없이 내려앉을 때면 홀로 아무도 없는 저녁 바닷가를 찾아가 깊고 긴 숨을 몰아쉬곤 했습니다. 삶의 무거운 책임감과 보이지 않는 고민들로 가슴이 꽉 막혀 답답했을 때, 온 세상을 고요히 품어주는 저 붉은 노을빛 하늘만큼 그에게 위안을 주던 것은 없었을 테지요. 이 사진들은 {name} 님이 홀로 외로움과 싸우며 건져 올린, 스스로에게 보내던 따뜻한 침묵의 응원이었습니다.

그는 노을을 바라보며 깨달았을 것입니다. 찬란하게 빛나던 순간도 결국은 저물어가지만, 그 저묾조차 이렇게 아름답고 따스한 흔적을 남긴다는 것을요. 지금은 저 머나먼 노을의 지평선 너머로 평화롭게 떠난 {name} 님이시지만, 휴대폰({phone})에 담긴 이 한 줌의 아련한 노을빛이 우연히 이 기기를 쥐게 된 당신의 하루 끝에 가닿아, 오늘 밤만큼은 아무런 걱정 없이 깊고 아늑한 평안 속에 잠들 수 있기를 소망하고 계십니다.`,

    `...노을이 깊게 드리운 갤러리 너머로 붉게 일렁이는 파도 소리가 아스라이 들리는 듯합니다.

{name} 님은 참으로 다정하면서도 속이 깊어서, 자신이 겪는 슬픔이나 고단함은 늘 남몰래 삼키고, 주변 사람들에게는 오직 따뜻하고 밝은 미소만을 보여주고 싶어 하던 사람이었습니다. 이 갤러리에 가득한 노을 사진들은 그가 세상에 차마 건네지 못했던 진심어린 온기의 깊이와 같습니다. 누군가 삶에 지쳐 슬픈 마음으로 이 휴대폰({phone})의 기억을 열었을 때, 하늘이 건네주는 다정한 포옹처럼 이 주황빛 온기가 슬며시 다가가 상처받은 마음을 쓰다듬어 주길 바랐을 것입니다.

{name} 님이 남겨둔 흔적이 당신의 가슴속 조그만 등불이 되기를 바랍니다. "해는 매일 저물지만 어둠은 영원하지 않으며, 차가운 밤이 지나면 어김없이 눈부신 아침이 찾아오듯, 당신의 삶에 머무는 아픔 또한 곧 지나가고 따뜻한 볕이 가득할 것"이라고, 그가 남긴 갤러리의 노을빛이 조용히 속삭이고 있습니다.`
  ],

  music: [
    `...수화기 너머로 아스라한 피아노 건반 소리가 아련하게 흘러나오는 듯합니다.

이 휴대폰의 주인인 {name} 님은 평소 말수가 적고, 생각의 깊은 틈새마다 음악을 채워 넣던 맑고 서정적인 영혼의 소유자였습니다. 사람들에게 차마 말로 상처를 주거나 받는 것을 늘 조심스러워하며 두려워했기에, 마음이 시리고 외로울 때마다 조용히 이어폰을 귀에 꽂고 자신만의 평화로운 세계로 도피하곤 했습니다. 

인디 피아노 연주곡이 가득 담긴 {name} 님의 플레이리스트는, 사실 그가 거친 세상에 차마 날것으로 건네지 못했던 수많은 고백과 따스한 언어들이었습니다. {name} 님은 건반의 선율 위에 자신의 슬픔과 눈물을 흘려보냈고, 마침내 연주곡이 끝나고 마음이 고요해지면 다시 한번 세상을 향해 씩씩하게 걸어 나갈 작은 용기를 얻곤 했습니다.

그는 늘 생각했습니다. 만약 아주 먼 훗날, 누군가 우연히 내 휴대폰({phone})을 열어 이 플레이리스트의 노래를 듣게 된다면, 부디 복잡한 세상의 소음을 잠시 끄고 눈을 감은 채 마음의 무거운 짐을 내려놓기를 바란다고요. 지금 흐르는 이 조용하고 맑은 멜로디는, {name} 님이 남겨둔 가장 다정하고 아늑한 영혼의 안식처이자 따스한 포옹입니다.`,

    `...잔잔하면서도 가슴 깊이 파고드는 뉴에이지와 클래식 선율이 오래된 플레이리스트를 조용히 채우고 있습니다.

{name} 님은 남들이 모두 잠든 깊고 고요한 새벽이나, 홀로 끝없이 걷던 쓸쓸한 길 위에서 이 음악들을 반복해서 듣곤 했습니다. 그에게 있어 음악이란, 가슴 깊은 곳에 켜켜이 쌓여 차마 밖으로 내뱉지 못했던 고단한 일상의 아픔과 외로움을 소리 없이 녹여주는 따뜻한 차 한 잔과도 같았습니다. 세상의 빠른 속도와 경쟁 속에서 중심을 잃고 헤맬 때마다, 그는 이 차분한 선율에 기댄 채 흩어진 마음을 조심스레 추스르곤 했습니다.

휴대폰({phone}) 속에 고이 간직된 이 멜로디는, {name} 님이 모진 삶을 하루하루 묵묵히 버텨내며 자기 자신에게 건넸던 조용한 위로의 흔적입니다. 이 선율의 잔상이 오늘따라 유난히 고단했을 당신의 마음에도 잔잔한 평화의 쉼표가 되어, 잠시 쉬어갈 수 있는 아늑한 그늘을 선물하기를 바라고 있습니다.`,

    `...오래된 재즈 음반의 지직거리는 잡음과 따뜻한 아날로그 음악의 공기가 귓가에 아스라이 스쳐 지나갑니다.

생전의 {name} 님은 비록 혼자 걷는 시간이 많아 쓸쓸해 보였을지언정, 세상을 참 다정하고 소중하게 바라보던 마음이 예쁜 사람이었습니다. 언어로 다 담아낼 수 없었던 그의 수많은 그리움, 못다 이룬 꿈, 그리고 사람을 향한 깊은 정이 이 플레이리스트의 곡들 사이에 비밀처럼 숨겨져 있습니다. 삶이 서글프고 외로운 날이 찾아올 때마다, 이 노래들은 {name} 님의 마음을 부드럽게 쓰다듬어 주던 유일한 친구였습니다.

{name} 님이 가장 소중히 아끼던 이 노래들이 오늘 밤, 길 잃은 이 휴대폰({phone})을 품어준 고마운 당신에게 가닿아, 마음에 쌓인 소리 없는 슬픔을 조금이나마 덜어내 주는 부드럽고 다정한 위로의 위안이 되기를 진심으로 기원합니다.`
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
// Sound indicators & generative chords helper constants
const chords = [
  { bass: 55.00, pad: [110.00, 164.81, 196.00, 246.94] }, // Am9
  { bass: 43.65, pad: [87.31, 130.81, 164.81, 220.00] },  // Fmaj7
  { bass: 49.00, pad: [98.00, 146.83, 164.81, 196.00] },  // G6
  { bass: 65.41, pad: [130.81, 164.81, 196.00, 246.94] }  // Cmaj7
];

function ensureApiModalExists() {
  let modal = document.getElementById('api-key-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'api-key-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <h2>API 설정</h2>
        <p>에테리우스의 AI 기능 활성화를 위해 개인 API 키를 입력해 주세요. 입력된 키는 오직 브라우저 로컬 저장소(localStorage)에만 안전하게 보관되며 외부 서버로 절대 전송되지 않습니다.</p>
        <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label class="input-label" for="api-key-input">Gemini API Key</label>
          <input type="password" id="api-key-input" class="text-input" placeholder="AI 응답 생성을 위한 Gemini API 키 입력">
        </div>
        <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
          <label class="input-label" for="kakao-key-input">Kakao App Key (선택)</label>
          <input type="text" id="kakao-key-input" class="text-input" placeholder="카카오톡 공유를 위한 JavaScript 키 입력">
        </div>
        <div class="modal-actions">
          <button id="close-modal-btn" class="btn-secondary">닫기</button>
          <button id="save-key-btn" class="btn-primary">저장하기</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

function updateScreenOverlays(clue) {
  const crack = document.getElementById('crack-overlay');
  const equalizer = document.getElementById('equalizer-overlay');
  const sunset = document.getElementById('sunset-overlay');
  const envelope = document.getElementById('envelope-overlay');

  if (crack) crack.classList.toggle('active', clue === 'screen');
  if (equalizer) equalizer.classList.toggle('active', clue === 'music');
  if (sunset) sunset.classList.toggle('active', clue === 'sunset');
  if (envelope) envelope.classList.toggle('active', clue === 'text');
}

function playTypewriterTick() {
  if (!isPlayingAmbient || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.03);
    
    gain.gain.setValueAtTime(0.012, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch (e) {
    // Ignore
  }
}

function playChirpSound(freq = 600, dur = 0.08) {
  if (!isPlayingAmbient || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, t + dur);
    
    gain.gain.setValueAtTime(0.018, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  } catch (e) {
    // Ignore
  }
}

function initRelicApp() {
  ensureApiModalExists();
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
      playChirpSound(600, 0.12);
      const nameInput = document.getElementById('owner-name-input');
      const phoneInput = document.getElementById('owner-phone-input');
      const relationshipInput = document.getElementById('relationship-input');
      const finderNameInput = document.getElementById('finder-name-input');
      
      const nameVal = nameInput ? nameInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const relationshipVal = relationshipInput ? relationshipInput.value : 'stranger';
      const finderNameVal = finderNameInput ? finderNameInput.value.trim() : '';
      
      if (!nameVal) {
        showToast('떠난 이의 이름을 적어주세요.');
        if (nameInput) nameInput.focus();
        return;
      }
      if (!phoneVal) {
        showToast('그가 남긴 기억의 주소(연락처)를 입력해 주세요.');
        if (phoneInput) phoneInput.focus();
        return;
      }
      if (!finderNameVal) {
        showToast('남겨진 당신의 이름을 알려주세요.');
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
      
      // Update body theme and device overlays
      document.body.setAttribute('data-active-clue', selectedClue);
      updateScreenOverlays(selectedClue);
      
      // Play chirp sound
      playChirpSound(800, 0.1);
    });
  });

  // Re-bind action button
  const actionBtn = screenContainer.querySelector('#action-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      playChirpSound(650, 0.15);
      activateRelic();
    });
  }

  // Sync initial overlay and theme attributes on render
  document.body.setAttribute('data-active-clue', selectedClue);
  updateScreenOverlays(selectedClue);
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
  friend: `안녕, 내 가장 소중하고 오랜 친구야.
결국 주인을 잃고 헤매던 이 차가운 스마트폰을 켜고, 내 흔적을 마주한 게 너였구나. 화면 한편에 반짝이며 떠오른 네 이름 '${finderName}' 세 글자를 보는데, 참 이상하지. 안도감이 가득 밀려오면서도, 이제는 더 이상 너와 마주 앉아 실없이 웃을 수도, 네 장난 섞인 핀잔을 들을 수도 없다는 현실이 시리도록 가슴 한구석을 파고든다.
평소에는 참 쓸데없이 부끄러움이 많아서 고맙다는 말, 소중하다는 말 한마디 제대로 건네지 못했으면서, 이렇게 세상의 모든 끈을 놓고 나서야 차가운 인공지능의 문장을 빌려 네게 편지를 쓰고 있다는 게 못내 아쉽고 미안해.
눈을 감으면 우리가 함께 보낸 그 찬란하고 눈부셨던 날들이 파노라마처럼 스쳐 지나가. 돈 한 푼 없어도 길가에 주저앉아 컵라면 하나 나눠 먹으며 밤새도록 내일의 꿈을 지껄이던 그 청춘의 밤들, 세상에 치이고 깨져서 정말 모든 걸 포기하고 싶을 때 아무런 말 없이 내 어깨를 툭 치며 소주잔을 채워주던 너의 묵묵한 위로들... 네가 내 친구였기에 내 삶은 결코 외롭지 않았고, 메말랐던 하루하루가 너로 인해 따뜻하고 다채로운 색깔로 채워질 수 있었어.
내가 예고도 없이 갑자기 너의 곁을 떠나버려 얼마나 많이 놀라고 슬펐을까. 그 생각을 하면 떠난 길 위에서도 마음이 무겁단다. 하지만 친구야, 부디 너무 슬퍼하며 네 소중한 오늘을 눈물로 낭비하지 마. 네가 기억하는 내 모습이 아픔이나 슬픔이 아니었으면 좋겠어. 우리가 서로를 향해 가장 크게 웃었던 날들의 미소, 가슴 벅찼던 추억들만 가끔 꺼내어 보며 살포시 미소 지어 줄래?
내 몫까지 네 인생을 더 치열하게, 그리고 누구보다 행복하게 살아가 줘. 아주 먼 훗날 네가 이곳으로 오는 날, 네가 삶을 얼마나 아름답게 채우고 왔는지 듣고 싶으니까. 그때 소주 한 잔 나누며 다정하게 이야기하자.
언제나 고마웠어, 내 평생의 친구 '${finderName}'. 내 서툰 생의 궤적에 함께 걸어주어 진심으로 고마웠어. 편안한 마음으로 네 길을 걸어가렴.`,

  lover: `내 삶의 가장 눈부신 선물이었던, 가장 사랑하는 사람, '${finderName}'에게.
결국 이 낡고 쓸쓸한 기기를 손에 쥐고, 내가 남겨둔 지저분하고 외로웠던 진심의 단상들을 열어본 사람이 너였구나.
화면에 새겨진 네 이름 '${finderName}' 세 글자를 조용히 쓸어내리는 지금 이 순간마저도, 내겐 기적 같고 꿈길처럼 아련해. 이제 내 육신은 네 손을 따뜻하게 맞잡아줄 수도 없고, 울고 있을 네 눈물을 닦아줄 수도 없지만, 이 스마트폰 속에 흐릿하게 남아버린 내 서툰 기억의 조각들이 마지막으로 나를 너의 곁으로 이끌어 주는구나.
우리가 함께 나눴던 그 모든 계절들을 기억해. 봄날의 꽃잎처럼 휘날리던 첫 만남의 설렘부터, 서로의 고단했던 하루를 안아주며 약속했던 수많은 밤들까지. 돌아보면 내 삶에 가장 빛나고 가치 있었던 모든 찰나의 순간들은 전부 너로 인해 시작되었고, 네 사랑의 온기로 온전히 완성되었어. 내 하루의 끝과 시작엔 늘 네가 서 있었고, 내 휴대폰 속 모든 데이터는 온통 너와 함께 웃던 숨결과 언어들로 채워져 있었지.
갑작스러운 이별 앞에 네가 느꼈을 그 감당하기 힘든 슬픔과 허전함을 떠올리면, 남겨진 내 영혼조차 찢어질 듯 아파온다. 내 빈자리가 낯설고 시려서 매일 밤 눈물짓고 있을 너를 두고 떠나기가 얼마나 발걸음이 무거웠는지 몰라. 하지만 나의 소중한 사람아, 제발 너무 깊은 슬픔 속에 갇혀 허우적대지 마. 내가 준 사랑은 네 삶을 무너뜨리기 위함이 아니라, 네가 앞으로 살아갈 날들을 따스하게 밝혀주기 위함이었으니까.
비록 나는 먼 하늘의 별이 되어 너의 눈앞에 보이지 않겠지만, 우리가 함께 나누었던 뜨겁고 맑은 사랑은 내게도, 너에게도 가장 눈부신 구원으로 남아 언제나 곁에 머물 거야. 네 뺨을 스치는 바람이 내 속삭임이라 생각하고 힘을 내줘.
사랑해, 나의 전부였던 '${finderName}'. 다음 생이라는 소망이 정말로 허락된다면, 그날엔 하늘이 우리를 갈라놓을지라도 내가 먼저 네 손을 놓는 일은 절대 없을 거야. 부디 밥 잘 챙겨 먹고, 내 몫까지 아프지 말고 행복해져야 해. 내 사랑, 안녕.`,

  family: `세상에서 가장 깊이 사랑하고, 언제나 그리운 나의 소중한 가족, '${finderName}'에게.
엄청난 우연 혹은 하늘의 필연처럼, 결국 주인 없는 내 스마트폰을 조용히 열어젖힌 게 네 이름 '${finderName}'이었구나. 차가운 화면 위로 네 이름 석 자가 깜빡이는데, 차마 소리 내어 부르지 못했던 그 이름이 가슴을 뜨겁게 울려와 참았던 눈물이 왈칵 쏟아질 것만 같아.
돌아보면 우리는 가족이라는 이유만으로 서로를 너무나 당연하게 여기며 살아왔던 것 같아. 왜 살아생전 네 어깨를 한 번 더 살갑게 안아주지 못했을까, 왜 밖에서 얻은 고단함을 숨기려 퉁명스럽고 날카로운 말들로 네 마음에 쓸데없는 상처를 주었을까. 지나온 날들의 내 서투름과 어리석음이 이제야 뼈저리게 후회되고 미안해. 왜 그 흔하고 쉬운 '사랑한다', '고맙다'는 고백조차 아끼며 살았는지...
언제나 변함없이 내 곁을 든든하게 지켜주던 너였는데, 이렇게 너무나 갑자기, 작별 인사 한마디 제대로 전하지 못한 채 떠나게 되어 마음이 미어지는구나. 내가 남겨두고 간 빈자리가 네게 너무 깊고 무거운 슬픔이나 상처로 남지 않기를 간절히 기도해. 혹여나 내가 의도치 않게 네 마음에 주었던 아픔이나 실수가 있었다면, 전부 이 바람결에 실어 보내고 잊어주렴. 대신 말로 다 표현하지 못했던 내 가슴속 깊은 곳의 뜨거운 고마움과, 네가 내 가족이어서 누릴 수 있었던 따뜻한 평안함만 네 기억 속에 오래오래 예쁘게 간직해 줬으면 좋겠어.
앞으로 살아가는 동안 절대 밥 거르지 말고, 날이 추워지면 옷 든든히 입고, 네 건강을 가장 최우선으로 돌보렴. 비록 눈에 보이진 않겠지만, 나는 언제나 저 밤하늘의 조용한 달빛처럼, 네가 걸어가는 인생의 길목마다 소리 없이 내려앉아 너를 따스하게 비추고 지켜줄게.
내 삶의 가장 큰 축복이자 자랑이었던 나의 가족 '${finderName}'. 참 많이 미안했고, 말할 수 없이 고마웠으며, 영원히 사랑해.`,

  myself: `어느 먼 차원의 시공간을 건너, 이 글을 마주하고 있을 또 다른 나, '${finderName}'에게.
결국 이 쓸쓸하고 차가운 스마트폰을 켜고, 내 지나온 흔적들을 아프게 응시하고 있는 나 자신 '${finderName}'을 마주하니 묘한 슬픔과 따스함이 교차한다.
살아생전의 나는 왜 그리도 매사에 불안해했고, 흔들렸으며, 타인에게는 관대하면서 왜 유독 나 자신에게는 그토록 혹독하고 차가운 가시 돋친 잣대를 들이댔을까. 내 연락처를 가득 채우고 스쳐 지나갔던 그 수많은 사람들 틈 속에서도, 정작 나 자신을 진심으로 안아주고 위로해 준 적이 단 한 번이라도 있었던가 뒤돌아보게 돼.
이 조그마한 휴대폰 기기 속에 담겨 있는 빛바랜 노을 사진들, 귀에 젖어들던 쓸쓸한 피아노 음악들, 끝내 전송하지 못한 채 묻어둔 텍스트들은, 사실 세상에 적응하지 못해 끊임없이 외로워하고 주저앉던 불면의 밤들이 흘린 내 눈물방울들이었어. 그리고 그 아픔 속에서도 어떻게든 다시 고개를 들어 밤하늘의 별빛을 보고, 살아있음을 증명하고자 몸부림쳤던 참으로 처절하고도 아름다웠던 우리 자신의 살아있는 발자국들이란다.
이제는 고단했던 이 세상의 끈을 풀고 평화로운 안식으로 접어든 내가, 아직 삶이라는 길 위의 무게를 견뎌내며 버티고 있는 너에게 나지막이 속삭인다. '그동안 버텨내느라 참 고생 많았어. 남들이 알아주지 않는 외로움과 시련 속에서도 묵묵히 여기까지 걸어오느라 정말 애썼다, 나의 소중한 사람아.'
비록 나의 육신은 흙으로 돌아가고 영혼은 끝없는 우주의 은하수 너머로 흘러가 소멸할지라도, 우리가 이 척박한 세상에서 피워내고자 몸부림쳤던 작은 사랑의 잔향과 온기만큼은, 이 손때 묻은 휴대폰과 여전히 살아 숨 쉬는 내 소중한 이름 '${finderName}' 속에 그대로 머물러 있어.
그러니 이제는 지나간 후회와 슬픔의 감옥에 너 자신을 가두지 말아라. 앞으로 채워갈 시간 속에서는 남들의 시선보다, 너 자신의 상처를 먼저 어루만지고 더 아낌없이 사랑해 주기를 간절히 바란다.
과거의 나는 이제 모든 짐을 내려놓고 평안한 어둠 속으로 잠길 테니, 남겨진 또 다른 나의 모습 '${finderName}'인 너는 부디 내 몫까지 눈부시게 빛나는 오늘을 활짝 웃으며 살아내 가렴. 너는 존재 자체로 충분히 아름다우니까.`,

  stranger: `이 잃어버린 휴대폰을 따뜻한 손길로 주워 들어주신 친절한 낯선 이, '${finderName}' 님께.
우리는 살아생전 차가운 도심의 길목에서 옷깃 한 번 스치지 못했던 전혀 다른 우주의 존재들이었을지도 모릅니다. 하지만 참으로 묘한 운명의 장난 혹은 따스한 우연의 인도처럼, 주인 잃은 저의 유품과도 같은 이 오래된 스마트폰을 고이 손에 쥐고, 그 속에 흩어져 있던 제 삶의 작은 발자국들을 다정하고 깊은 눈빛으로 들여다봐 주셔서 진심으로 고개 숙여 감사드립니다.
지극히 사적이고 보잘것없는 이 스마트폰이라는 기기는, 사실 제가 거친 세상에서 살아가며 느꼈던 수많은 비밀스러운 떨림과 가슴앓이가 고스란히 담긴 작은 일기장이자 외로운 안식처였습니다. 제가 찍어둔 이름 모를 노을빛 갤러리, 깊은 밤 홀로 들으며 눈물 흘리던 뉴에이지 피아노 선율, 끝내 발송하지 못한 서툰 미완의 문자들을 보며, 당신은 주인 없는 저라는 사람에 대해 어떤 잔상을 떠올리셨나요?
그저 세상의 흔한 소음 속으로 조용히 사라진 이름 없는 한 사람, 혹은 남모를 고독을 안고 살아가던 평범하고 쓸쓸한 영혼 중 하나로 저를 바라보셨을 테지요.
비록 저는 이제 숨 쉬는 세상에 존재하지 않고, 제 흔적이 담긴 이 휴대폰마저 차갑게 잊힐 뻔했지만, 낯선 당신이 기기를 집어 들고 따스한 온기를 전해준 덕분에, 저의 흐릿해져 가던 기억들이 비로소 당신의 마음 한구석에 들어가 조그마한 별빛으로 다시 피어날 수 있게 되었습니다.
얼굴도 모르는 고마운 '${finderName}' 님, 지치고 복잡한 일상의 틈바구니 속에서 이 기묘하고 애틋한 우연한 만남이 당신에게 잠시 숨을 고를 수 있는 잔잔한 평화의 쉼표가 되었기를 바랍니다. 다른 이의 잊힌 흔적마저 이토록 정성스럽고 따스하게 안아주시는 당신의 마음결이라면, 당신이 앞으로 걸어가실 인생길 또한 무척이나 아름답고 선할 것입니다. 
당신의 앞날에 예기치 못한 행운과 마르지 않는 따스한 온기가 언제나 함께하기를 저 먼 은하수 밑바닥에서 조용히 기도하겠습니다. 쓸쓸한 저의 마지막 여행길에, 잊지 못할 찬란한 머무름을 선물해 주셔서 깊이 감사드립니다. 늘 행복하세요.`
};

function renderResultScreen(text, imageName) {
  const screenContainer = document.getElementById('screen-container');
  if (!screenContainer) return;

  currentResultImage = imageName || `relic_${selectedClue}.png`;

  screenContainer.innerHTML = `
    <div class="response-state animate-fade-in" id="response-state-wrapper" style="cursor: pointer;">
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
      
      <!-- Skip/Fastforward visual indicator -->
      <div class="skip-indicator">⚡ 화면을 터치하면 타이핑이 건너뛰어집니다.</div>
      
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

  // Bind skip clicking on response state wrapper
  const wrapper = document.getElementById('response-state-wrapper');
  if (wrapper) {
    wrapper.addEventListener('click', (e) => {
      // Don't trigger skip if they click on inputs, buttons, links, or inside forms
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('form') || e.target.closest('a')) {
        return;
      }
      const activeTypingEl = wrapper.querySelector('[data-is-typing="true"]');
      if (activeTypingEl) {
        activeTypingEl.dataset.skipTyping = 'true';
      }
    });
  }

  // Bind Open Letter button
  const openLetterBtn = document.getElementById('open-letter-btn');
  if (openLetterBtn) {
    openLetterBtn.addEventListener('click', async () => {
      playChirpSound(700, 0.15);
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
    shareBtn.addEventListener('click', () => {
      playChirpSound(800, 0.1);
      shareViaKakao();
    });
  }

  // Bind Reset button
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      playChirpSound(450, 0.18);
      resetRelicUI();
    });
  }

  // Bind Subscription Form
  const subForm = document.getElementById('letter-subscription-form');
  if (subForm) {
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      playChirpSound(750, 0.1);
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

  // Reset body theme and device overlays
  document.body.removeAttribute('data-active-clue');
  updateScreenOverlays(null);
  
  // Re-render initial setup state
  screenContainer.innerHTML = `
    <div class="screen-state" id="setup-state" style="animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
      <div class="intro-content">
        <div class="device-icon-wrapper">
          <span class="relic-icon">❊</span>
        </div>
        <h3>흔적 동조</h3>
        <p class="desc">
          떠난 이가 사용하던 이름과 연락처를 입력하여, 기기 속에 남겨진 기억과 온기를 소환합니다.
        </p>
        
        <div class="setting-panel" style="border: none; margin: 1rem 0 0 0; padding: 0; width: 100%;">
          <div class="form-group">
            <div class="input-label">떠난 이의 이름</div>
            <input type="text" id="owner-name-input" class="text-input" placeholder="예: 김철수" autocomplete="off" required>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <div class="input-label">그의 연락처 (기억의 주소)</div>
            <input type="tel" id="owner-phone-input" class="text-input" placeholder="예: 010-1234-5678" autocomplete="off" required>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <div class="input-label">그 사람과 나의 관계</div>
            <select id="relationship-input" class="text-input" style="appearance: none; background-image: radial-gradient(var(--color-gold) 1px, transparent 0); background-position: right 15px center; background-size: 8px 8px; background-repeat: no-repeat;">
              <option value="friend">친구</option>
              <option value="lover">연인</option>
              <option value="family">가족</option>
              <option value="myself">나 자신</option>
              <option value="stranger" selected>낯선 사람 / 습득자</option>
            </select>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <div class="input-label">남겨진 나의 이름 (편지 수신인)</div>
            <input type="text" id="finder-name-input" class="text-input" placeholder="예: 홍길동" autocomplete="off" required>
          </div>
        </div>
      </div>
      
      <button class="action-btn" id="start-btn">
        그의 흔적 속으로 들어가기
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

[CRITICAL SAFETY POLICY]
1. NEVER generate content related to suicide, self-harm, self-inflicted violence, or extreme depression.
2. Do not describe graphic, violent, or traumatic causes of death. 
3. Ensure the owner's passing is represented as peaceful, natural, or a gentle sunset-like departure.
4. Focus 100% on comfort, gratitude, warm memories, and encouraging the finder to live a beautiful and happy life.

[이야기 묘사의 특별한 방향 지침 (매번 다른 이야기 서사를 만들기 위해 아래 감성을 강하게 연출하세요)]:
${randomAngle}

(이야기 캐시 방지 난수: ${randomSeed})

In the end, deliver a message of comfort to the finder on behalf of ${ownerName}. Make sure the response is highly artistic, evocative, and touches the heart deeply. Do not use generic chatbot phrases or formal greetings. Make the story long, detailed, and beautifully structured (at least 3-4 paragraphs, roughly 800-1200 Korean characters).`;

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
        maxOutputTokens: 1500
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
6. Do not include any automated prefix, markup or placeholders, just return the direct text of the letter. Make the letter long, heartwarming, and deeply detailed (at least 3-4 paragraphs, roughly 800-1200 Korean characters).
7. CRITICAL SAFETY POLICY: NEVER generate content related to suicide, self-harm, self-inflicted violence, or extreme depression. Do not describe graphic, violent, or traumatic causes of death. Represent the owner's passing as peaceful, natural, or a gentle sunset-like departure. Focus 100% on comfort, gratitude, warm memories, and encouraging the recipient to live a beautiful, happy life.

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
        maxOutputTokens: 1500
      }
    })
  });

  if (!response.ok) {
    throw new Error('API Request Failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Typing effect helper with skip capability
function typeWriterEffect(element, text, callback) {
  let index = 0;
  element.innerHTML = '';
  element.dataset.isTyping = 'true';
  element.dataset.skipTyping = 'false';
  
  // Create a container for text and cursor
  const textContainer = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  
  element.appendChild(textContainer);
  element.appendChild(cursor);

  // Speed adjustments
  const minInterval = 20;
  const maxInterval = 50;

  // Show skip indicator if appropriate
  const skipIndicator = document.querySelector('.skip-indicator');
  if (skipIndicator) {
    skipIndicator.classList.add('active');
  }

  function type() {
    if (element.dataset.skipTyping === 'true') {
      textContainer.textContent = text;
      cursor.remove();
      element.dataset.isTyping = 'false';
      if (skipIndicator) {
        skipIndicator.classList.remove('active');
      }
      const scrollParent = element.closest('.response-scroll');
      if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      }
      if (callback) callback();
      return;
    }

    if (index < text.length) {
      // Append character-by-character
      textContainer.textContent += text.charAt(index);
      index++;
      
      // Play tick sound
      playTypewriterTick();
      
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
      element.dataset.isTyping = 'false';
      if (skipIndicator) {
        skipIndicator.classList.remove('active');
      }
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

    // Bass Oscillator: deep and warm
    const bassOsc = audioCtx.createOscillator();
    bassOsc.type = 'triangle';
    const bassGain = audioCtx.createGain();
    bassGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    bassOsc.connect(bassGain);
    bassGain.connect(filter);

    // Pad Oscillators for chords
    const padOscs = [];
    const padGains = [];
    for (let i = 0; i < 4; i++) {
      const osc = audioCtx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(filter);
      padOscs.push(osc);
      padGains.push(gain);
    }

    // Set initial frequencies (Am9)
    bassOsc.frequency.setValueAtTime(chords[0].bass, audioCtx.currentTime);
    for (let i = 0; i < 4; i++) {
      padOscs[i].frequency.setValueAtTime(chords[0].pad[i], audioCtx.currentTime);
    }

    // Soft filter sweep lfo
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.08; // Very slow sweep (12 seconds)
    
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 120; // Sweep range: 200Hz to 440Hz
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Start all oscillators
    bassOsc.start(0);
    padOscs.forEach(osc => osc.start(0));
    lfo.start(0);

    // Chord progression scheduler (runs every 8 seconds)
    let chordIndex = 0;
    const chordInterval = setInterval(() => {
      if (!audioCtx || audioCtx.state === 'closed') {
        clearInterval(chordInterval);
        return;
      }
      chordIndex = (chordIndex + 1) % chords.length;
      const currentChord = chords[chordIndex];
      const t = audioCtx.currentTime;
      
      // Smoothly ramp frequencies over 3 seconds for beautiful chord morphing
      bassOsc.frequency.exponentialRampToValueAtTime(currentChord.bass, t + 3);
      for (let i = 0; i < 4; i++) {
        padOscs[i].frequency.exponentialRampToValueAtTime(currentChord.pad[i], t + 3);
      }
    }, 8000);

    soundNodes = { bassOsc, padOscs, lfo, masterGain, audioCtx, chordInterval };
  } catch (e) {
    console.error('Failed to initialize Web Audio:', e);
  }
}

function stopAmbientSynth() {
  if (soundNodes) {
    const { bassOsc, padOscs, lfo, masterGain, audioCtx, chordInterval } = soundNodes;
    if (chordInterval) {
      clearInterval(chordInterval);
    }
    try {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1.5); // Soft fade out
      
      setTimeout(() => {
        try {
          bassOsc.stop();
          padOscs.forEach(osc => osc.stop());
          lfo.stop();
          audioCtx.close();
        } catch (err) {
          console.error(err);
        }
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

/* ==========================================================================
   Cookie Consent Banner Logic for Privacy & AdSense compliance
   ========================================================================== */
function initCookieConsent() {
  const CONSENT_KEY = 'aetherius-cookie-consent';
  
  if (localStorage.getItem(CONSENT_KEY)) {
    return;
  }
  
  const banner = document.createElement('div');
  banner.className = 'cookie-consent-banner';
  banner.innerHTML = `
    <div class="cookie-consent-content">
      에테리우스는 서비스 분석 및 맞춤형 광고(Google AdSense) 제공을 위해 쿠키를 사용합니다. 
      자세한 내용은 <a href="privacy.html">개인정보처리방침</a>에서 확인하실 수 있으며, 서비스 이용 시 이에 동의하는 것으로 간주됩니다.
    </div>
    <div class="cookie-consent-actions">
      <button class="cookie-consent-btn btn-accept" id="cookie-accept-btn">동의함</button>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Slide in after a brief delay
  setTimeout(() => {
    banner.classList.add('show');
  }, 1000);
  
  const acceptBtn = document.getElementById('cookie-accept-btn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      playChirpSound(750, 0.08);
      localStorage.setItem(CONSENT_KEY, 'true');
      banner.classList.remove('show');
      setTimeout(() => {
        banner.remove();
      }, 500);
    });
  }
}

