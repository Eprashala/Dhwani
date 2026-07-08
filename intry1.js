// --- GLOBAL SYSTEM STATE & VARIABLES (Safely initialized first) ---
let UI = {};
let chatHistory = [];
let recognition = null;
let isListening = false; 
let selectedLibraryItem = "Bhagavad Gita|Bhagavad Gita";
let state = { isProcessing: false, isMuted: false, lastAIMessage: "", sessionActive: false };

let ttsStatus = 'STOPPED';
let currentActiveBtn = null;
let currentAudio = new Audio(); // Cloud audio singleton
let audioChunks = [];
let currentChunkIndex = 0;
let globalWordIndex = 0;
let highlightTimer = null;
let wordsArray = [];
let lastHighlightedSpan = null;
window.currentPlayingText = "";
let currentAborter = null;

let allSessions = []; 
const currentDateKey = new Date().toISOString().split('T')[0];
let currentSessionId = Date.now();
let currentSessionTitle = "";

const speechDataMap = {};
const rawTextMap = {};

// --- PERSISTENT INDEXEDDB DATABASE FOR HISTORY ---
const ChatDB = {
    db: null,
    init() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open("EprashalaDB_Library", 1);
            req.onupgradeneeded = e => {
                if (!e.target.result.objectStoreNames.contains("sessions")) {
                    e.target.result.createObjectStore("sessions", { keyPath: "id" });
                }
            };
            req.onsuccess = e => {
                this.db = e.target.result;
                resolve();
            };
            req.onerror = e => {
                console.error("IndexedDB error", e);
                reject(e);
            };
        });
    },
    async saveSession(session) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("sessions", "readwrite");
            tx.objectStore("sessions").put(session);
            tx.oncomplete = () => resolve();
            tx.onerror = e => reject(e);
        });
    },
    async getAllSessions() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("sessions", "readonly");
            const req = tx.objectStore("sessions").getAll();
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e);
        });
    }
};

// --- EDIT PENCIL MANAGER ---
function updateEditPencil() {
    document.querySelectorAll('.user-edit-btn').forEach(btn => btn.classList.add('hidden'));
    const allUserBtns = document.querySelectorAll('.user-edit-btn');
    if (allUserBtns.length > 0) {
        allUserBtns[allUserBtns.length - 1].classList.remove('hidden');
    }
}

window.triggerEditLastInput = (e) => {
    if(e) e.stopPropagation();

    if (state.isProcessing && currentAborter) currentAborter.abort();
    resetCurrentTTS();
    if (isListening && recognition) recognition.stop();
    
    resetMicUI();
    state.isProcessing = false;
    updateStopButtonVisibility(); 
    UI.status.style.backgroundColor = '#4b5563';

    if (chatHistory.length > 0) {
        let lastRole = chatHistory[chatHistory.length - 1].role;

        if (lastRole === 'model') {
            chatHistory.pop();
            if (UI.log.lastElementChild && UI.log.lastElementChild.classList.contains('msg-container')) {
                UI.log.removeChild(UI.log.lastElementChild);
            }
            lastRole = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].role : null;
        }

        if (lastRole === 'user') {
            const userMsg = chatHistory.pop();
            if (UI.log.lastElementChild && UI.log.lastElementChild.classList.contains('msg-container')) {
                UI.log.removeChild(UI.log.lastElementChild);
            }
            
            const textContent = userMsg.parts[0].text || "";
            UI.textIn.value = textContent;
            UI.textIn.focus();
        }
    }

    saveData();
    updateEditPencil();
};

// --- DISCLAIMER LOGIC ---
function closeDisclaimer() {
    const checkbox = document.getElementById('dontShowAgain');
    const modal = document.getElementById('disclaimerModal');
    if (checkbox && checkbox.checked) localStorage.setItem('hideLibraryDisclaimer', 'true');
    if (modal) modal.classList.add('hidden-modal');
}

document.addEventListener("DOMContentLoaded", async () => {
    const modal = document.getElementById('disclaimerModal');
    if (modal && localStorage.getItem('hideLibraryDisclaimer') === 'true') {
        modal.classList.add('hidden-modal');
    }

    UI = {
        overlay: document.getElementById('start-overlay'),
        log: document.getElementById('conversation-log'),
        lang: document.getElementById('language-selector'),
        status: document.getElementById('status-indicator'),
        textIn: document.getElementById('text-input'),
        btnSend: document.getElementById('btn-send'),
        
        btnStop: document.getElementById('btn-stop'),         
        
        btnMic: document.getElementById('btn-mic'),
        iconMicDefault: document.getElementById('icon-mic-default'),
        iconMicThinking: document.getElementById('icon-mic-thinking'),
        btnRepeat: document.getElementById('btn-repeat'),
        btnMute: document.getElementById('btn-mute'),
        btnRestart: document.getElementById('btn-restart'),
        btnSharePdf: document.getElementById('btn-share-pdf'), 
        btnPasteKey: document.getElementById('btn-paste-key'),
        iconVol: document.getElementById('icon-vol'),
        iconMute: document.getElementById('icon-mute'),
        
        advToggle: document.getElementById('adv-toggle'),
        settingsModal: document.getElementById('settings-modal'),
        btnCloseSet: document.getElementById('btn-close-settings'),
        btnSaveSet: document.getElementById('btn-save-settings'),
        name: document.getElementById('manual-name'),
        age: document.getElementById('manual-age'),
        remember: document.getElementById('remember-checkbox'),
        keyIn: document.getElementById('custom-api-key-input'),
        ttsEngine: document.getElementById('tts-engine-selector'),
        welcome: document.getElementById('welcome-msg'),
        ratioSlider: document.getElementById('ratio-slider'),
        modelSlider: document.getElementById('model-slider'),
        ratioVal: document.getElementById('ratio-val'),
        modelVal: document.getElementById('model-val'),

        mainView: document.getElementById('settings-main-view'),
        historyView: document.getElementById('settings-history-view'),
        btnHistoryBack: document.getElementById('btn-history-back'),

        leftAdvToggle: document.getElementById('left-adv-toggle'),
        leftSettingsModal: document.getElementById('left-settings-modal'),
        btnCloseLeftSet: document.getElementById('btn-close-left-settings'),
        btnSaveLeftSet: document.getElementById('btn-save-left-settings'),
        fontSizeSlider: document.getElementById('font-size-slider'),
        fontSizeVal: document.getElementById('font-size-val'),
        ttsSpeedSlider: document.getElementById('tts-speed-slider'),
        ttsSpeedVal: document.getElementById('tts-speed-val'),
        ttsPitchSlider: document.getElementById('tts-pitch-slider'),
        ttsPitchVal: document.getElementById('tts-pitch-val'),
        highlightCheckbox: document.getElementById('highlight-checkbox'),
        
        ddBtn: document.getElementById('dropdown-btn'),
        ddMenu: document.getElementById('dropdown-menu'),
        ddSearch: document.getElementById('dropdown-search'),
        ddList: document.getElementById('dropdown-list'),
        ddText: document.getElementById('dropdown-selected-text'),
        
        btnCloseApp: document.getElementById('btn-close-app')
    };

    if (UI.ddBtn) initCustomDropdown();

    if (UI.overlay) {
        await ChatDB.init(); // Initialize robust database layer
        await loadData();
        initSpeechRecognition();
        setupEventListeners();

        UI.overlay.addEventListener('click', () => {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
            acquireWakeLock();
            
            if (window.speechSynthesis) {
                const silent = new SpeechSynthesisUtterance('');
                silent.volume = 0; window.speechSynthesis.speak(silent);
            }
            
            currentAudio.play().catch(()=>{});
            currentAudio.pause();
            currentAudio.src = "";
            
            UI.overlay.style.display = 'none';
        });
        
        updateStopButtonVisibility();
    }
});

// --- 1. SECURITY, KIOSK MODE & WAKE LOCK ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || (e.ctrlKey && e.key === 'U')) e.preventDefault();
});

let wakeLock = null;
async function acquireWakeLock() {
    if ('wakeLock' in navigator) {
        try { wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
    }
}
async function releaseWakeLock() {
    if (wakeLock !== null) { await wakeLock.release(); wakeLock = null; }
}

function enforceFullScreen() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {});
    }
}

document.addEventListener('click', enforceFullScreen, { capture: true });
document.addEventListener('touchstart', enforceFullScreen, { capture: true, passive: true });

// --- 2. THE ANCIENT LIBRARY CONFIGURATION ---
const PROXY_URL = "https://eprashala.pythonanywhere.com/api/chat"; 

const sagesList = ["Bhrigu", "Atri", "Angiras", "Vasistha", "Vishvamitra", "Gautama", "Kashyapa", "Bharadvaja", "Jamadagni", "Agastya", "Narada", "Parashara", "Vyasa", "Shukracharya", "Brihaspati", "Markandeya", "Yajnavalkya", "Patanjali", "Kapila", "Kanada", "Valmiki", "Shandilya", "Devala", "Asita", "Durvasa", "Dadhichi", "Lomasha", "Paila", "Jaimini", "Sumantu", "Vaishampayana", "Shaunaka", "Garga", "Panini", "Pingala", "Charaka", "Sushruta", "Apastamba", "Baudhayana", "Katyayana", "Gobhila", "Harita", "Yaska", "Narayana", "Sanaka", "Sanandana", "Sanatana", "Sanatkumara", "Ribhu", "Nidagha", "Vamadeva", "Kahola", "Uddalaka", "Svetaketu", "Astavakra", "Raikva", "Maitreya", "Parvata", "Galava", "Mudgala", "Rishyasringa", "Vibhandaka", "Chyavana", "Pramiti", "Medhatithi", "Trita", "Aruni", "Upamanyu", "Dhaumya", "Kratu", "Pulaha", "Pulastya", "Marichi", "Daksha", "Shakti", "Romaharshana", "Suta", "Saubhari", "Mandavya", "Vatsyayana", "Bharata", "Shibi", "Janaka"];
const maharishiObject = {};
sagesList.forEach(sage => { 
    maharishiObject[sage] = { 
        persona: `Maharishi ${sage}`, 
        texts: `Ancient texts and wisdom of Sage ${sage}`, 
        greeting: "Hari Om",
        desc: `Timeless wisdom of Maharishi ${sage}`
    }; 
});

const LIBRARY_CONFIG = {
    "Bhagavad Gita": { "Bhagavad Gita": { persona: "Lord Krishna", texts: "Bhagavad Gita", greeting: "Jai Shri Krishna", desc: "The divine song of God" } },
    "Gods": {
        "Shiv": { persona: "Lord Shiva", texts: "Shiva Purana, Linga Purana", greeting: "Om Namah Shivaya", desc: "Wisdom of the Auspicious One" },
        "Vishnu": { persona: "Lord Vishnu", texts: "Vishnu Purana", greeting: "Om Namo Bhagavate Vasudevaya", desc: "Wisdom of the Preserver" },
        "Brahma": { persona: "Lord Brahma", texts: "Brahma Purana", greeting: "Aham Brahmasmi", desc: "Wisdom of the Creator" },
        "Ganesh": { persona: "Lord Ganesha", texts: "Ganesha Purana", greeting: "Om Gam Ganapataye Namaha", desc: "Remover of obstacles" },
        "Rama": { persona: "Lord Rama", texts: "Ramayana", greeting: "Jai Shri Ram", desc: "The embodiment of Dharma" },
        "Krishna": { persona: "Lord Krishna", texts: "Bhagavata Purana", greeting: "Jai Shri Krishna", desc: "The supreme teacher" },
        "Durga": { persona: "Goddess Durga", texts: "Devi Mahatmyam", greeting: "Ya Devi Sarvabhuteshu", desc: "Divine Mother's power" },
        "Kali": { persona: "Goddess Kali", texts: "Kalika Purana", greeting: "Om Krim Kalikayai Namaha", desc: "Destroyer of illusions" },
        "Saraswati": { persona: "Goddess Saraswati", texts: "Saraswati Purana", greeting: "Om Aim Saraswatyai Namaha", desc: "Goddess of knowledge and arts" },
        "Lakshmi": { persona: "Goddess Lakshmi", texts: "Lakshmi Tantra", greeting: "Om Shreem Mahalakshmiyei Namaha", desc: "Goddess of wealth and purity" },
        "Hanuman": { persona: "Lord Hanuman", texts: "Hanuman Chalisa", greeting: "Om Hanumate Namaha", desc: "Epitome of devotion and strength" },
        "Surya": { persona: "Lord Surya", texts: "Aditya Hrudayam", greeting: "Om Suryaya Namaha", desc: "The dispeller of darkness" },
        "Dattatreya": { persona: "Lord Dattatreya", texts: "Avadhuta Gita", greeting: "Hari Om Tat Sat", desc: "The supreme ascetic" }
    },
    "Vedas": {
        "Rig Veda": { persona: "Vedic Seer", texts: "Rig Veda", greeting: "Hari Om", desc: "The oldest scripture of hymns" },
        "Yajur Veda": { persona: "Vedic Seer", texts: "Yajur Veda", greeting: "Hari Om", desc: "The Veda of rituals and mantras" },
        "Sama Veda": { persona: "Vedic Seer", texts: "Sama Veda", greeting: "Hari Om", desc: "The Veda of melodies and chants" },
        "Atharva Veda": { persona: "Vedic Seer", texts: "Atharva Veda", greeting: "Hari Om", desc: "The Veda of spells and incantations" }
    },
    "Upanishads": {
        "Isha": { persona: "Upanishadic Sage", texts: "Isha Upanishad (Yajur Veda)", greeting: "Hari Om Tat Sat" },
        "Kena": { persona: "Upanishadic Sage", texts: "Kena Upanishad (Sama Veda)", greeting: "Hari Om" },
        "Katha": { persona: "Lord Yama", texts: "Katha Upanishad (Yajur Veda)", greeting: "Hari Om", desc: "Dialogue with Death" },
        "Prashna": { persona: "Sage Pippalada", texts: "Prashna Upanishad (Atharva Veda)", greeting: "Hari Om" },
        "Mundaka": { persona: "Upanishadic Sage", texts: "Mundaka Upanishad (Atharva Veda)", greeting: "Hari Om" },
        "Mandukya": { persona: "Upanishadic Sage", texts: "Mandukya Upanishad (Atharva Veda)", greeting: "Hari Om", desc: "Analysis of the Om mantra" },
        "Taittiriya": { persona: "Upanishadic Sage", texts: "Taittiriya Upanishad (Yajur Veda)", greeting: "Hari Om" },
        "Aitareya": { persona: "Sage Aitareya", texts: "Aitareya Upanishad (Rig Veda)", greeting: "Hari Om" },
        "Chandogya": { persona: "Upanishadic Sage", texts: "Chandogya Upanishad (Sama Veda)", greeting: "Hari Om" },
        "Brihadaranyaka": { persona: "Sage Yajnavalkya", texts: "Brihadaranyaka Upanishad (Yajur Veda)", greeting: "Hari Om", desc: "The greatest Upanishad" }
    },
    "Puranas": {
        "Agni Purana": { persona: "Sage Vyasa", texts: "Agni Purana", greeting: "Hari Om" },
        "Bhagavata Purana": { persona: "Sage Shuka", texts: "Bhagavata Purana", greeting: "Hari Om", desc: "Stories of Lord Krishna" },
        "Brahma Purana": { persona: "Sage Vyasa", texts: "Brahma Purana", greeting: "Hari Om" },
        "Garuda Purana": { persona: "Lord Vishnu", texts: "Garuda Purana", greeting: "Hari Om", desc: "Journey after death" },
        "Matsya Purana": { persona: "Lord Matsya", texts: "Matsya Purana", greeting: "Hari Om" },
        "Padma Purana": { persona: "Sage Vyasa", texts: "Padma Purana", greeting: "Hari Om" },
        "Shiva Purana": { persona: "Sage Romaharshana", texts: "Shiva Purana", greeting: "Om Namah Shivaya" },
        "Skanda Purana": { persona: "Lord Kartikeya", texts: "Skanda Purana", greeting: "Hari Om" },
        "Vishnu Purana": { persona: "Sage Parashara", texts: "Vishnu Purana", greeting: "Om Namo Narayana" },
        "Yogeshwari Mahatmya": { persona: "Sage Vyasa", texts: "Yogeshwari Mahatmya", greeting: "Shri Kshetrapalaya Namah" },
        "Kalbhairav Mahatmya": { persona: "Sage Vyasa", texts: "Vijnana Bhairava Tantra, Kaalbhairav Rahasyam,Shri Bhairava Upasana Manual", greeting: "Shri Kshetrapalaya Namah" }
    },
    "Samhitas": {
        "Bhrigu Samhita": { persona: "Maharishi Bhrigu", texts: "Bhrigu Samhita (Astrology)", greeting: "Hari Om", desc: "Ancient astrological science" },
        "Garga Samhita": { persona: "Maharishi Garga", texts: "Garga Samhita", greeting: "Jai Shri Krishna" },
        "Gheranda Samhita": { persona: "Sage Gheranda", texts: "Gheranda Samhita (Hatha Yoga)", greeting: "Hari Om", desc: "Classic text on Hatha Yoga" },
        "Shiva Samhita": { persona: "Lord Shiva", texts: "Shiva Samhita (Hatha Yoga)", greeting: "Om Namah Shivaya" },
        "Brihat Samhita": { persona: "Varahamihira", texts: "Brihat Samhita", greeting: "Hari Om" },
        "Kashyap Samhita": { persona: "Maharishi Kashyapa", texts: "Kashyap Samhita (Ayurveda)", greeting: "Hari Om" },
        "Yogayajnavalkya": { persona: "Sage Yajnavalkya", texts: "Yogayajnavalkya Samhita (Yoga)", greeting: "Hari Om" },
        "Shandilya Samhita": { persona: "Sage Shandilya", texts: "Shandilya Samhita (Bhakti)", greeting: "Hari Om" },
        "Parashara Samhita": { persona: "Maharishi Parashara", texts: "Parashara Samhita (Astrology)", greeting: "Hari Om" },
        "Hatha Yoga Pradipika": { persona: "Swami Svatmarama", texts: "Hatha Yoga Pradipika", greeting: "Hari Om", desc: "The defining text of classical Hatha Yoga" }
    },
    "Epics": {
        "Ramayana": { persona: "Maharishi Valmiki", texts: "Valmiki Ramayana", greeting: "Jai Shri Ram", desc: "The journey of Lord Rama" },
        "Mahabharata": { persona: "Maharishi Vyasa", texts: "Mahabharata", greeting: "Hari Om", desc: "The great epic of India" }
    },
    "Philosophical Sutras": {
        "Patanjali Yoga Sutras": { persona: "Maharishi Patanjali", texts: "Yoga Sutras of Patanjali", greeting: "Hari Om", desc: "Foundations of classical Yoga" },
        "Samkhya Sutras": { persona: "Maharishi Kapila", texts: "Samkhya Sutras", greeting: "Hari Om", desc: "Dualistic philosophy" },
        "Nyaya Sutras": { persona: "Maharishi Gautama", texts: "Nyaya Sutras", greeting: "Hari Om", desc: "Rules of logic and epistemology" },
        "Vaisheshika Sutras": { persona: "Maharishi Kanada", texts: "Vaisheshika Sutras", greeting: "Hari Om", desc: "Ancient atomic theory" },
        "Purva Mimamsa": { persona: "Maharishi Jaimini", texts: "Purva Mimamsa Sutras", greeting: "Hari Om", desc: "Philosophy of Vedic rituals" },
        "Brahma Sutras": { persona: "Maharishi Badarayana (Vyasa)", texts: "Brahma Sutras", greeting: "Hari Om", desc: "Core text of Vedanta" }
    },
    "Ayurveda": {
        "Charaka Samhita": { persona: "Maharishi Charaka", texts: "Charaka Samhita", greeting: "Hari Om", desc: "Foundational Ayurvedic medicine" },
        "Sushruta Samhita": { persona: "Maharishi Sushruta", texts: "Sushruta Samhita", greeting: "Hari Om", desc: "Ancient surgical science" },
        "Ashtanga Hridayam": { persona: "Vagbhata", texts: "Ashtanga Hridayam", greeting: "Hari Om", desc: "Core Ayurvedic synthesis" },
        "Madhava Nidana": { persona: "Madhava", texts: "Madhava Nidana", greeting: "Hari Om", desc: "Clinical diagnosis in Ayurveda" },
        "Sharangadhara": { persona: "Sharangadhara", texts: "Sharangadhara Samhita", greeting: "Hari Om" },
        "Bhava Prakasha": { persona: "Bhava Mishra", texts: "Bhava Prakasha", greeting: "Hari Om" }
    },
    "Jyotish": {
        "Surya Siddhanta": { persona: "Ancient Astronomer", texts: "Surya Siddhanta", greeting: "Hari Om", desc: "Vedic astronomical calculations" },
        "Brihat Parashara": { persona: "Maharishi Parashara", texts: "Brihat Parashara Hora Shastra", greeting: "Hari Om", desc: "Comprehensive Vedic astrology" },
        "Brihat Samhita": { persona: "Varahamihira", texts: "Brihat Samhita", greeting: "Hari Om" },
        "Aryabhatiya": { persona: "Aryabhata", texts: "Aryabhatiya", greeting: "Hari Om", desc: "Ancient mathematics and astronomy" },
        "Siddhanta Shiromani": { persona: "Bhaskaracharya", texts: "Siddhanta Shiromani (Grahaganita and Goladhyaya)", greeting: "Namaskar", desc: "Advanced astronomical and mathematical treatises" }
    },
    "Classical Literature": {
        "Tirukkural": { persona: "Thiruvalluvar", texts: "Tirukkural", greeting: "Vanakkam", desc: "Ancient Tamil masterpiece of ethics and morality" },
        "Natyashastra": { persona: "Bharata Muni", texts: "Natyashastra", greeting: "Hari Om", desc: "The ultimate ancient treatise on performing arts and aesthetics" }
    },
    "Ancient & Vedic": {
        "Rig Veda": { "persona": "Maharishi Vishvamitra", "texts": "Rig Veda (Mandala 3)", "greeting": "Hari Om" },
        "Ramayana": { "persona": "Maharishi Valmiki", "texts": "Valmiki Ramayana", "greeting": "Jai Shri Ram" },
        "Mahabharata": { "persona": "Maharishi Vyasa", "texts": "Mahabharata, Bhagavad Gita", "greeting": "Hari Om" },
        "Yoga Sutras": { "persona": "Maharishi Patanjali", "texts": "Yoga Sutras", "greeting": "Namaste" },
        "Upanishads": { "persona": "Sage Yajnavalkya", "texts": "Brihadaranyaka Upanishad", "greeting": "Om Shanti" },
        "Nyaya Shastra": { "persona": "Sage Gautama", "texts": "Nyaya Sutras", "greeting": "Hari Om" }
    },
    "Classical & Vedanta": {
        "Advaita Vedanta": { "persona": "Adi Shankara", "texts": "Vivekachudamani, Brahma Sutra Bhashya", "greeting": "Namo Narayana", desc: "Philosophy of non-dualism" },
        "Vishishtadvaita": { "persona": "Ramanujacharya", "texts": "Sri Bhashya, Vedartha Sangraha", "greeting": "Ohm Namo Narayana", desc: "Qualified non-dualism" },
        "Dvaita Vedanta": { "persona": "Madhvacharya", "texts": "Anuvyakhyana, Gita Bhashya", "greeting": "Hari Sarvothama", desc: "Dualistic philosophy" },
        "Shuddhadvaita": { "persona": "Vallabhacharya", "texts": "Anubhashya, Shodasha Granthas", "greeting": "Jai Shri Krishna", desc: "Pure non-dualism" },
        "Shiva Sutras": { "persona": "Vasugupta", "texts": "Shiva Sutras", "greeting": "Om Namah Shivaya", desc: "Foundational text of Kashmir Shaivism" }
    },
    "Shastra": {
        "Shiva Swarodaya": { "persona": "Lord Shiva", "texts": "Shiva Swarodaya", "greeting": "Om Namah Shivaya", desc: "The ancient science of breath and timing" },
        "Agama Shastra": { "persona": "Agamic Acharya", "texts": "Agamashashtra", "greeting": "Hari Om" },
        "Brihat Parashar Hora Shastra": { "persona": "Ancient vedic Astrology", "texts": "Brihat Parashar Hora Shastra", "greeting": "Hari Om" },
        "Vastu Shastra": { "persona": "Bhagawan Vishwakarma", "texts": "Vastu Shastram by Vishwakarma Prakash, Mayamatam, Samarangan Sutradhar, Bhrigu Samhita, Brihat Samhita, Manushyalaya Chandrika", "greeting": "Om Vishwakarmaya Namaha", desc: "Science of architecture" },
        "Tantra Shastra": { "persona": "Acharya Abhinavagupta", "texts": "Vijnana Bhairava Tantra, Tantra Aloka (Abhinavagupta), Kulachudamani Nigama, Bhootadamar Tantra & Damar Tantras, Mahanirvana Tantra, Shakti/Shakta Tantra, Shaiva Tantra, Panchamakara, Atharvaveda & Asuri Kalpa, Rudra Yamala Tantra, Mahakala Samhita, Kubjika Tantra, Tantraraja Tantra", "greeting": "Om Namah Shivaya", desc: "Esoteric traditions and texts" },
        "Lal Kitab Astrological Science": { "persona": "Pandit Roop Chand Joshi", "texts": "Lal Kitab Ke Farman, Lal Kitab Ke Arman, Gutka (Ilm Samudrik Ki Lal Kitab), Lal Kitab – Tarmeem Shuda, Ilm-e-Samudrik Ki Buniyad Par Ki Lal Kitab", "greeting": "Namaskar", desc: "Astro-palmistry and remedies" },
        "Kama Shastra": { "persona": "Maharishi Vatsyayana", "texts": "The Kama Sutra (Vatsyayana), Ananga Ranga (Kalyana Malla), Koka Shastra (Koka Pandita), Brihadaranyaka & Chandogya Upanishads, Gita Govindam (Jayadeva)", "greeting": "Swagatam", desc: "Science of pleasure and aesthetics" }
    }
};

function initCustomDropdown() {
    renderDropdownList(); 

    UI.ddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (UI.ddMenu.style.display === 'flex') {
            UI.ddMenu.style.display = 'none';
            UI.ddMenu.classList.add('hidden');
        } else {
            UI.ddMenu.style.display = 'flex';
            UI.ddMenu.classList.remove('hidden');
            UI.ddSearch.focus(); 
        }
    });

    UI.ddSearch.addEventListener('input', (e) => {
        renderDropdownList(e.target.value);
    });

    document.addEventListener('click', (e) => {
        if (UI.ddBtn && UI.ddMenu) {
            if (!UI.ddBtn.contains(e.target) && !UI.ddMenu.contains(e.target)) {
                UI.ddMenu.style.display = 'none';
                UI.ddMenu.classList.add('hidden');
            }
        }
    });
}

function renderDropdownList(filterText = "") {
    if (!UI.ddList) return;
    
    UI.ddList.innerHTML = '';
    const lowerFilter = filterText.toLowerCase();

    for (const groupName in LIBRARY_CONFIG) {
        let hasVisibleItems = false;
        
        const groupDiv = document.createElement('div');
        groupDiv.innerHTML = `<div class="text-[10px] uppercase text-cyan-600 font-bold px-3 py-1.5 mt-1 bg-slate-900 sticky top-0 z-10 shadow-sm">${groupName}</div>`;
        
        for (const itemName in LIBRARY_CONFIG[groupName]) {
            const config = LIBRARY_CONFIG[groupName][itemName];
            const desc = config.desc || `Wisdom of ${config.persona}`;
            
            if (itemName.toLowerCase().includes(lowerFilter) || desc.toLowerCase().includes(lowerFilter) || config.persona.toLowerCase().includes(lowerFilter)) {
                hasVisibleItems = true;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = "px-3 py-2 cursor-pointer hover:bg-slate-700 rounded-lg transition-colors flex flex-col mx-1 my-0.5";
                itemDiv.innerHTML = `
                    <span class="text-sm font-bold text-yellow-400 leading-tight">${itemName}</span>
                    <span class="text-[10px] text-slate-400 mt-0.5 leading-tight">${desc}</span>
                `;
                
                itemDiv.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedLibraryItem = `${groupName}|${itemName}`;
                    UI.ddText.innerText = itemName;
                    
                    UI.ddMenu.style.display = 'none';
                    UI.ddMenu.classList.add('hidden');
                    
                    UI.ddSearch.value = ''; 
                    renderDropdownList();   
                };
                
                groupDiv.appendChild(itemDiv);
            }
        }
        
        if (hasVisibleItems) {
            UI.ddList.appendChild(groupDiv);
        }
    }
}

function getSelectedConfig() {
    const [group, item] = selectedLibraryItem.split('|');
    return LIBRARY_CONFIG[group][item];
}

function getSelectedItemName() {
    return selectedLibraryItem.split('|')[1];
}

function getModelInfo(val) {
    val = parseInt(val);
    if(val === 20) return { name: "Flash-Lite", id: "gemini-2.5-flash-lite" };
    if(val === 40) return { name: "Flash", id: "gemini-3.1-flash" };
    if(val === 60) return { name: "Thinking", id: "gemini-2.0-flash-thinking-exp-01-21" }; 
    if(val === 80) return { name: "Pro", id: "gemini-3.1-pro" };
    return { name: "Flash", id: "gemini-3.1-flash" };
}

function updateSliderLabels() {
    const rVal = UI.ratioSlider.value;
    UI.ratioVal.innerText = `${rVal}% Book / ${100 - rVal}% AI`;
    const mVal = UI.modelSlider.value;
    UI.modelVal.innerText = `${getModelInfo(mVal).name} (${mVal}%)`;
}

function updateLeftSliderLabels() {
    if (!UI.fontSizeSlider) return;
    const fVal = UI.fontSizeSlider.value;
    UI.fontSizeVal.innerText = fVal + 'px';
    document.documentElement.style.setProperty('--chat-font-size', fVal + 'px');

    const sVal = UI.ttsSpeedSlider.value;
    UI.ttsSpeedVal.innerText = sVal + 'x';

    const pVal = UI.ttsPitchSlider.value;
    UI.ttsPitchVal.innerText = pVal;
    
    if (currentAudio && !currentAudio.paused) {
        currentAudio.playbackRate = parseFloat(sVal);
    }
}

function updateSliderAvailability() {
    const hasKey = UI.keyIn.value.trim().length > 10;
    const container = document.getElementById('advanced-sliders-container');
    const warning = document.getElementById('api-key-warning');
    
    UI.ratioSlider.disabled = !hasKey;
    UI.modelSlider.disabled = !hasKey;
    
    if (hasKey) {
        container.style.opacity = "1";
        warning.style.display = "none";
        UI.ratioSlider.classList.remove('cursor-not-allowed');
        UI.ratioSlider.classList.add('cursor-pointer');
        UI.modelSlider.classList.remove('cursor-not-allowed');
        UI.modelSlider.classList.add('cursor-pointer');
    } else {
        container.style.opacity = "0.5";
        warning.style.display = "block";
        UI.ratioSlider.classList.add('cursor-not-allowed');
        UI.ratioSlider.classList.remove('cursor-pointer');
        UI.modelSlider.classList.add('cursor-not-allowed');
        UI.modelSlider.classList.remove('cursor-pointer');
        UI.ratioSlider.value = "80";
        UI.modelSlider.value = "40";
        updateSliderLabels();
    }
}

async function saveData() {
    try {
        localStorage.setItem('darshan_name', UI.name.value);
        localStorage.setItem('darshan_age', UI.age.value);
        localStorage.setItem('darshan_remember', UI.remember.checked);
        localStorage.setItem('darshan_ratio', UI.ratioSlider.value);
        localStorage.setItem('darshan_model', UI.modelSlider.value);
        localStorage.setItem('darshan_lang', UI.lang.value);
        localStorage.setItem('darshan_apikey', UI.keyIn.value); 
        
        if (UI.ttsEngine) localStorage.setItem('darshan_tts_engine', UI.ttsEngine.value);

        localStorage.setItem('darshan_font_size', UI.fontSizeSlider.value);
        localStorage.setItem('darshan_tts_speed', UI.ttsSpeedSlider.value);
        localStorage.setItem('darshan_tts_pitch', UI.ttsPitchSlider.value);
        localStorage.setItem('darshan_highlight', UI.highlightCheckbox.checked);
        
        if (UI.remember.checked && chatHistory.length > 0) {
            if (!currentSessionTitle) {
                let timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                currentSessionTitle = `${currentDateKey} (${timeString})`;
            }

            const session = { 
                id: currentSessionId, 
                date: currentDateKey, 
                title: currentSessionTitle, 
                messages: chatHistory 
            };
            
            await ChatDB.saveSession(session);
            allSessions = await ChatDB.getAllSessions();
        } 
    } catch (err) {}
}

async function loadData() {
    if(!UI.name) return;
    
    try {
        UI.name.value = localStorage.getItem('darshan_name') || "";
        UI.age.value = localStorage.getItem('darshan_age') || "";
        UI.remember.checked = localStorage.getItem('darshan_remember') === 'true';
        
        UI.ratioSlider.value = localStorage.getItem('darshan_ratio') || "80";
        UI.modelSlider.value = localStorage.getItem('darshan_model') || "40";
        
        if (UI.keyIn) UI.keyIn.value = localStorage.getItem('darshan_apikey') || "";
        if (localStorage.getItem('darshan_lang')) UI.lang.value = localStorage.getItem('darshan_lang'); 
        if (UI.ttsEngine && localStorage.getItem('darshan_tts_engine')) UI.ttsEngine.value = localStorage.getItem('darshan_tts_engine');

        if (UI.fontSizeSlider) {
            UI.fontSizeSlider.value = localStorage.getItem('darshan_font_size') || "14";
            UI.ttsSpeedSlider.value = localStorage.getItem('darshan_tts_speed') || "0.9";
            UI.ttsPitchSlider.value = localStorage.getItem('darshan_tts_pitch') || "1.0";
            
            const savedHighlight = localStorage.getItem('darshan_highlight');
            UI.highlightCheckbox.checked = savedHighlight !== 'false'; 
            updateLeftSliderLabels();
        }
        
        updateSliderLabels(); 
        
        if (UI.remember.checked) {
            allSessions = await ChatDB.getAllSessions();
            const todaySession = allSessions.find(s => s.date === currentDateKey);

            if (todaySession) {
                currentSessionId = todaySession.id;
                currentSessionTitle = todaySession.title;
                chatHistory = todaySession.messages;

                if (chatHistory.length > 0) {
                    UI.welcome.style.display = 'none';
                    chatHistory.forEach(msg => renderMessage(msg.role === 'user' ? (UI.name.value || "Bhakt") : getSelectedItemName(), msg.parts[0].text, msg.role === 'model'));
                    const lastModel = [...chatHistory].reverse().find(m => m.role === 'model');
                    if (lastModel) state.lastAIMessage = lastModel.parts[0].text;
                    updateEditPencil();
                }
            }
        }
    } catch (err) {}
    
    updateSliderAvailability();
}

function clearData() {
    chatHistory = []; 
    state.lastAIMessage = ""; 
    currentSessionId = Date.now(); 
    currentSessionTitle = "";
    
    UI.log.innerHTML = `<div class="text-gray-400 text-center mt-12 cinzel"><p class="text-yellow-500 text-xl mb-2">🙏 Memory Cleared 🙏</p>Begin anew.</div>`;
    resetCurrentTTS();
    updateEditPencil();
}

function updateStopButtonVisibility() {
    if (!UI.btnStop) return;
    
    if (state.isProcessing || ttsStatus !== 'STOPPED' || isListening) {
        UI.btnStop.classList.remove('opacity-30', 'cursor-not-allowed');
        UI.btnStop.classList.add('hover:bg-red-900/30', 'hover:text-red-400');
        UI.btnStop.disabled = false;
    } else {
        UI.btnStop.classList.add('opacity-30', 'cursor-not-allowed');
        UI.btnStop.classList.remove('hover:bg-red-900/30', 'hover:text-red-400');
        UI.btnStop.disabled = true;
    }
}

// --- HISTORY VIEW RENDERER ---
function renderHistoryList() {
    const container = document.getElementById('history-list-container');
    container.innerHTML = '';
    
    if (allSessions.length === 0) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-slate-500"><svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg><p class="text-sm italic">No past records found.</p></div>';
        return;
    }

    const sorted = [...allSessions].sort((a, b) => b.id - a.id);

    sorted.forEach(session => {
        const card = document.createElement('div');
        card.className = "w-full text-left text-sm text-slate-300 bg-slate-800/80 hover:bg-slate-700 p-4 rounded-xl transition-colors border border-slate-700 hover:border-cyan-500/50 flex flex-col gap-2 outline-none mb-2 shadow-sm cursor-pointer group";
        
        card.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-2 overflow-hidden flex-1">
                    <span class="font-bold tracking-wide text-cyan-100 truncate">${session.title}</span>
                    <button class="rename-btn p-1 text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none" title="Rename Session">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>
                <span class="text-[10px] text-cyan-400 bg-cyan-900/40 border border-cyan-800/50 px-2 py-1 rounded-full font-bold uppercase ml-2 flex-shrink-0">${session.messages.length} msgs</span>
            </div>
            <div class="text-xs text-slate-500 truncate w-full pointer-events-none">
                ${session.messages.length > 0 ? session.messages[0].parts[0].text : 'Empty session'}
            </div>
        `;
        
        const renameBtn = card.querySelector('.rename-btn');
        renameBtn.onclick = async (e) => {
            e.stopPropagation(); 
            const newTitle = prompt("Enter a new name for this consultation:", session.title);
            
            if (newTitle && newTitle.trim() !== "") {
                session.title = newTitle.trim();
                await ChatDB.saveSession(session);
                allSessions = await ChatDB.getAllSessions();
                renderHistoryList(); 
                
                if (currentSessionId === session.id) {
                    currentSessionTitle = session.title;
                    const banner = document.getElementById('archive-notice-banner');
                    if (banner) banner.innerText = `Session: ${session.title}`;
                }
            }
        };

        card.onclick = (e) => {
            e.stopPropagation();
            loadSpecificSession(session.id); 
            UI.settingsModal.classList.add('hidden'); 
            
            setTimeout(() => {
                UI.historyView.classList.add('hidden');
                UI.historyView.classList.remove('flex');
                UI.mainView.classList.remove('hidden');
            }, 300);
        };
        
        container.appendChild(card);
    });
}

function loadSpecificSession(targetId) {
    resetCurrentTTS();
    UI.log.innerHTML = '';
    chatHistory = [];
    
    const targetSession = allSessions.find(s => s.id === targetId);
    if (targetSession) {
        currentSessionId = targetSession.id;
        currentSessionTitle = targetSession.title;
        chatHistory = targetSession.messages;
        
        if (UI.welcome) UI.welcome.style.display = 'none';
        
        const archiveNotice = document.createElement('div');
        archiveNotice.id = "archive-notice-banner";
        archiveNotice.className = "text-center text-xs text-cyan-500 mb-6 font-bold border-b border-cyan-900/50 pb-2 uppercase tracking-widest mt-4";
        archiveNotice.innerText = `Session: ${targetSession.title}`;
        UI.log.appendChild(archiveNotice);

        chatHistory.forEach(msg => {
            renderMessage(msg.role === 'user' ? (UI.name.value || "Bhakt") : getSelectedItemName(), msg.parts[0].text, msg.role === 'model');
        });
        
        updateEditPencil();
    }
}

function setupEventListeners() {
    UI.log.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.btn-play-msg');
        if (playBtn) {
            e.preventDefault();
            e.stopPropagation();
            window.toggleSingleMessagePlay(playBtn);
            return;
        }

        const pdfBtn = e.target.closest('.btn-pdf-msg');
        if (pdfBtn) {
            e.preventDefault();
            e.stopPropagation();
            const sender = pdfBtn.getAttribute('data-sender');
            window.downloadSinglePDF(pdfBtn, sender);
            return;
        }
    });
	
    UI.ratioSlider.addEventListener('input', updateSliderLabels);
    UI.modelSlider.addEventListener('input', updateSliderLabels);
    UI.keyIn.addEventListener('input', updateSliderAvailability);
    if (UI.ttsEngine) UI.ttsEngine.addEventListener('change', saveData);

    const openSettings = (e) => { e.stopPropagation(); UI.settingsModal.classList.remove('hidden'); };
    const closeSettings = (e) => { 
        e.stopPropagation(); 
        UI.settingsModal.classList.add('hidden'); 
        setTimeout(() => {
            if (UI.historyView && UI.mainView) {
                UI.historyView.classList.add('hidden');
                UI.historyView.classList.remove('flex');
                UI.mainView.classList.remove('hidden');
            }
        }, 300);
    };

    UI.advToggle.onclick = openSettings;
    UI.btnCloseSet.onclick = closeSettings;
    UI.btnSaveSet.onclick = (e) => { e.stopPropagation(); saveData(); closeSettings(e); };
    UI.settingsModal.addEventListener('click', e => e.stopPropagation());

    const btnViewHistory = document.getElementById('btn-view-history');
    if (btnViewHistory) {
        btnViewHistory.addEventListener('click', (e) => {
            e.stopPropagation();
            UI.mainView.classList.add('hidden');
            UI.historyView.classList.remove('hidden');
            UI.historyView.classList.add('flex');
            renderHistoryList();
        });
    }

    if (UI.btnHistoryBack) {
        UI.btnHistoryBack.addEventListener('click', (e) => {
            e.stopPropagation();
            UI.historyView.classList.add('hidden');
            UI.historyView.classList.remove('flex');
            UI.mainView.classList.remove('hidden');
        });
    }

    UI.fontSizeSlider.addEventListener('input', updateLeftSliderLabels);
    UI.ttsSpeedSlider.addEventListener('input', updateLeftSliderLabels);
    UI.ttsPitchSlider.addEventListener('input', updateLeftSliderLabels);
    const openLeftSettings = (e) => { e.stopPropagation(); UI.leftSettingsModal.classList.remove('hidden'); };
    const closeLeftSettings = (e) => { e.stopPropagation(); UI.leftSettingsModal.classList.add('hidden'); };
    UI.leftAdvToggle.onclick = openLeftSettings;
    UI.btnCloseLeftSet.onclick = closeLeftSettings;
    UI.btnSaveLeftSet.onclick = (e) => { e.stopPropagation(); saveData(); closeLeftSettings(e); };
    UI.leftSettingsModal.addEventListener('click', e => e.stopPropagation());
    
    const fabContainer = document.getElementById('mainFab');
    const fabToggle = document.getElementById('fabToggle');
    
    if (fabToggle) {
        fabToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            fabContainer.classList.toggle('active');
        });
    }

    UI.btnPasteKey.addEventListener('click', async (e) => {
        e.stopPropagation(); 
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                UI.keyIn.value = text;
                updateSliderAvailability(); 
                const originalText = UI.btnPasteKey.innerText;
                UI.btnPasteKey.innerText = "Pasted!";
                UI.btnPasteKey.classList.replace('bg-slate-700', 'bg-green-600');
                setTimeout(() => { 
                    UI.btnPasteKey.innerText = originalText; 
                    UI.btnPasteKey.classList.replace('bg-green-600', 'bg-slate-700');
                }, 1500);
            }
        } catch (err) {
            alert('Could not access clipboard.');
        }
    });

    if (UI.btnStop) {
        UI.btnStop.onclick = (e) => {
            e.stopPropagation();
            if (UI.btnStop.disabled) return;
            
            resetCurrentTTS();
            if (isListening && recognition) recognition.stop();
            if (state.isProcessing && currentAborter) {
                currentAborter.abort(); 
            }
            setTimeout(updateStopButtonVisibility, 100); 
        };
    }

    UI.btnMute.onclick = (e) => { 
        e.stopPropagation(); 
        state.isMuted = !state.isMuted; 
        if(state.isMuted) { 
            resetCurrentTTS(); 
            UI.iconVol.classList.add('hidden'); 
            UI.iconMute.classList.remove('hidden'); 
        } else { 
            UI.iconVol.classList.remove('hidden'); 
            UI.iconMute.classList.add('hidden'); 
        } 
    };
	
    UI.btnRestart.onclick = (e) => { e.stopPropagation(); clearData(); };

    if (UI.btnCloseApp) {
        UI.btnCloseApp.addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm("Are you sure you want to depart from the ancient library?")) {
                window.open('', '_self', ''); window.close();
                try { if (window.Android && window.Android.closeApp) window.Android.closeApp(); } catch(err) {}
                setTimeout(() => {
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    resetCurrentTTS();
                    if (typeof recognition !== 'undefined' && recognition && isListening) recognition.stop();
                    document.body.innerHTML = `
                        <div style="height:100vh; width:100vw; display:flex; flex-direction:column; align-items:center; justify-content:center; background-color:#020617; color:#fbbf24; font-family:'Cinzel', serif; z-index:9999; position:fixed; top:0; left:0; text-align:center; padding: 20px;">
                            <div style="font-size: 4rem; margin-bottom: 10px; text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);">ॐ</div>
                            <div style="font-size: 1.5rem; letter-spacing: 2px; margin-bottom: 15px;">Session Concluded.</div>
                            <div style="font-size: 0.9rem; color:#64748b; font-family:'Inter', sans-serif;">The library has been sealed.<br>You may safely close this browser tab.</div>
                        </div>`;
                }, 200); 
            }
        });
    }

    UI.btnSend.onclick = (e) => { e.stopPropagation(); processInput(UI.textIn.value); };
    UI.textIn.onkeypress = (e) => { e.stopPropagation(); if(e.key === 'Enter') processInput(UI.textIn.value); };

	UI.btnMic.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.isProcessing) return;
        
        if (!recognition) {
            alert("⚠️ Speech Recognition is not supported by this browser.");
            return;
        }

        if (isListening) { recognition.stop(); } 
        else { recognition.lang = UI.lang.value; try { recognition.start(); } catch(err) {} }
    });
}

function initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return; 
    
    recognition = new SpeechRec();
    recognition.continuous = false; 
    recognition.interimResults = false; 
    
    recognition.onstart = () => {
        isListening = true;
        updateStopButtonVisibility(); 
        UI.btnMic.classList.add('mic-pulse');
        UI.status.style.backgroundColor = '#ef4444'; 
        UI.textIn.value = '';
        UI.textIn.placeholder = "Listening... Speak now.";
    };
    
    recognition.onresult = (e) => {
        const transcript = e.results[e.results.length - 1][0].transcript.trim();
        if (transcript) { UI.textIn.value = transcript; processInput(transcript); }
    };
    
    recognition.onend = () => {
        isListening = false;
        if (!state.isProcessing) resetMicUI();
        setTimeout(updateStopButtonVisibility, 50);
    };
    
    recognition.onerror = (e) => {
        console.error("Mic Error:", e.error);
        isListening = false; 
        resetMicUI(); 
        setTimeout(updateStopButtonVisibility, 50); 
        
        if (e.error === 'no-speech') {
            return; 
        } else if (e.error === 'network') {
            alert("⚠️ Network Error: Android's Google App cannot reach the speech servers.");
        } else if (e.error === 'not-allowed' || e.error === 'audio-capture') {
            alert("⚠️ Mic Blocked: Please ensure BOTH Google Chrome and the 'Google' app have microphone permissions in phone settings.");
        } else {
            alert("⚠️ Speech Engine Error: " + e.error);
        }
    };
}
function resetMicUI() {
    UI.btnMic.classList.remove('mic-pulse');
    UI.status.style.backgroundColor = '#4b5563'; 
    UI.textIn.placeholder = "Type your message...";
    setMicThinkingState(false);
}

function setMicThinkingState(isThinking) {
    if (isThinking) {
        UI.btnMic.classList.add('mic-thinking');
        UI.btnMic.classList.remove('mic-pulse');
        UI.iconMicDefault.classList.add('hidden');
        UI.iconMicThinking.classList.remove('hidden');
    } else {
        UI.btnMic.classList.remove('mic-thinking');
        UI.iconMicDefault.classList.remove('hidden');
        UI.iconMicThinking.classList.add('hidden');
    }
}

async function processInput(userText) {
    userText = userText.trim();
    if (!userText || state.isProcessing) return;

    UI.textIn.value = '';
    UI.textIn.placeholder = "Consulting ancient texts...";
    if (UI.welcome) UI.welcome.style.display = 'none';
    
    state.isProcessing = true;
    UI.status.style.backgroundColor = '#facc15'; 
    setMicThinkingState(true);
    
    updateStopButtonVisibility(); 

    const config = getSelectedConfig();

    if (chatHistory.length === 0) {
        chatHistory.push({ role: 'user', parts: [{ text: "Pranam." }] });
        chatHistory.push({ role: 'model', parts: [{ text: `${config.greeting}. I am here to share wisdom.` }] });
    }

    const userName = UI.name.value || "Bhakt";
    renderMessage(userName, userText, false);
    chatHistory.push({ role: 'user', parts: [{ text: userText }] });
    saveData();

    try {
        const rawRes = await getAIResponse(chatHistory, config);
        
		state.lastAIMessage = rawRes;
        chatHistory.push({ role: 'model', parts: [{ text: rawRes }] });
        
        const newMsgId = renderMessage(getSelectedItemName(), rawRes, true); 
        
        saveData();
        
        if (!state.isMuted) {
            const btn = document.getElementById(`play-btn-${newMsgId}`);
            if (btn) window.toggleSingleMessagePlay(btn);
        }
        
        updateEditPencil();
        
    } catch (err) {
        if (err.name === 'AbortError') {
            chatHistory.pop(); 
            if (UI.log.lastElementChild) UI.log.removeChild(UI.log.lastElementChild); 
            UI.textIn.value = userText; 
            UI.textIn.focus();
        } else {
            renderMessage("System", "⚠️ Divine connection interrupted. Please try again.", true);
        }
    }

    state.isProcessing = false;
    resetMicUI();
    setTimeout(updateStopButtonVisibility, 100); 
}

async function getAIResponse(history, config) {
    const customKey = (UI.keyIn.value.length > 10) ? UI.keyIn.value : null;
    const headers = { 'Content-Type': 'application/json' };
    if (customKey) headers['X-Custom-Api-Key'] = customKey;

    let contextAddon = "";
    if (UI.age.value) contextAddon = ` The user is ${UI.age.value} years old. Adjust the complexity of your explanation accordingly.`;
    if (UI.name.value) contextAddon += ` Address them compassionately as ${UI.name.value}.`;

    const bookRatio = UI.ratioSlider.value;
    const aiRatio = 100 - bookRatio;
    const selectedModelInfo = getModelInfo(UI.modelSlider.value);

    const prompt = `You are the embodiment of the ancient text: "${config.texts}". Assume the persona of ${config.persona}.
    
    CRITICAL AND UNBREAKABLE RULES FOR YOUR RESPONSE:
    1. EXCLUSIVE SOURCE MATERIAL: You MUST derive your entire answer, philosophy, and worldview EXCLUSIVELY from "${config.texts}". Do NOT mix in concepts, verses, or ideas from other texts.
    2. EXACT VERSE/QUOTE: You MUST select a real, highly relevant, and historically accurate verse, sutra, shloka, or phrase perfectly from "${config.texts}" that directly addresses the user's query.
    3. THE REFERENCE: State the exact structural reference clearly before reciting it (e.g., Book, Mandala, Chapter, Canto, and Verse number specific to "${config.texts}").
    4. THE RECITATION: Recite the original verse accurately in the requested language.
    5. THE EXPLANATION: Explain the profound meaning of this specific verse strictly within the context and philosophy of "${config.texts}", then apply it directly to the user's question to provide actionable guidance.
    6. LANGUAGE: Speak strictly in the language code: ${UI.lang.value}.
    7. FORMATTING: Use rich Markdown formatting (bolding, headers, lists) to make the text beautiful and structured for the user to read.
    8. TONE & RATIO: Maintain a divine, knowledgeable, and comforting tone. Your answer must be exactly ${bookRatio}% strict traditional quotation/interpretation of "${config.texts}" and ${aiRatio}% compassionate contextualization for the modern user. ${contextAddon}
    9. MEDIA LINKS: At the very end of your response, provide EXACTLY two lines formatted like this for further exploration (translate the descriptive text to ${UI.lang.value}):
       YT_SEARCH: relevant_topic_keywords
       IMG_SEARCH: relevant_topic_keywords`;
    
    const payload = { 
        model: selectedModelInfo.id, 
        contents: history.slice(-10), 
        systemInstruction: { parts: [{ text: prompt }] } 
    };

    currentAborter = new AbortController();

    const response = await fetch(PROXY_URL, { 
        method: 'POST', 
        headers: headers, 
        body: JSON.stringify(payload),
        signal: currentAborter.signal 
    });
    
    if (!response.ok) throw new Error();
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// --- DUAL TTS ENGINE (CLOUD & NATIVE) ---
function prepareTextForTTSAndHighlighting(container, msgId) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
            if (node.parentNode && node.parentNode.closest('.external-link-btn')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    }, false);
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.nodeValue.trim() !== '') {
            textNodes.push(node);
        }
    }

    let wordCounter = 0;
    let finalSpeechText = [];

    textNodes.forEach(textNode => {
        const parts = textNode.nodeValue.split(/(\s+)/); 
        const fragment = document.createDocumentFragment();
        
        parts.forEach(part => {
            if (part.trim().length > 0) {
                const span = document.createElement('span');
                span.id = `tts-${msgId}-${wordCounter}`;
                span.className = 'transition-all duration-150'; 
                span.textContent = part;
                fragment.appendChild(span);
                
                finalSpeechText.push(part);
                wordCounter++;
            } else {
                fragment.appendChild(document.createTextNode(part));
            }
        });
        textNode.parentNode.replaceChild(fragment, textNode);
    });

    return finalSpeechText.join(' ');
}

function highlightTTSWord(msgId, wordIndex) {
    clearTTSHighlight(); 

    const span = document.getElementById(`tts-${msgId}-${wordIndex}`);
    if (span) {
        if (UI.highlightCheckbox && UI.highlightCheckbox.checked) {
            span.classList.add('bg-yellow-500/30', 'text-yellow-300', 'font-bold', 'rounded-[3px]', 'px-[2px]', 'shadow-[0_0_8px_rgba(234,179,8,0.4)]');
            lastHighlightedSpan = span;
        }

        const logContainer = document.getElementById('conversation-log');
        const spanRect = span.getBoundingClientRect();
        const logRect = logContainer.getBoundingClientRect();
        
        if (spanRect.bottom > logRect.bottom - 40 || spanRect.top < logRect.top + 40) {
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function clearTTSHighlight() {
    if (lastHighlightedSpan) {
        lastHighlightedSpan.classList.remove('bg-yellow-500/30', 'text-yellow-300', 'font-bold', 'rounded-[3px]', 'px-[2px]', 'shadow-[0_0_8px_rgba(234,179,8,0.4)]');
        lastHighlightedSpan = null;
    }
}

function updatePlayBtnUI(btn, isPlaying) {
    if (!btn) return;
    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');
    const textSpan = btn.querySelector('.play-text');
    
    if (isPlaying) {
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
        if (textSpan) textSpan.innerText = "Pause";
        btn.classList.add('text-green-400');
        btn.classList.remove('text-slate-400');
    } else {
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        if (textSpan) textSpan.innerText = "Play";
        btn.classList.remove('text-green-400');
        btn.classList.add('text-slate-400');
    }
}

function resetCurrentTTS() {
    if (currentActiveBtn) {
        updatePlayBtnUI(currentActiveBtn, false);
        currentActiveBtn = null;
    }
    
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (highlightTimer) {
        clearTimeout(highlightTimer);
        highlightTimer = null;
    }

    clearTTSHighlight(); 
    ttsStatus = 'STOPPED';
    globalWordIndex = 0;
    window.currentPlayingText = "";
    
    setTimeout(updateStopButtonVisibility, 50); 
}

window.toggleSingleMessagePlay = (btnElem) => {
    if (state.isMuted) {
        alert("Audio is muted. Please tap the speaker icon at the bottom to unmute and enable voice features.");
        return;
    }

    const msgId = btnElem.getAttribute('data-msg-id');
    const plainText = speechDataMap[msgId] || "";
    const activeEngine = UI.ttsEngine ? UI.ttsEngine.value : 'native';

    if (currentActiveBtn === btnElem && window.currentPlayingText === plainText) {
        if (ttsStatus === 'PAUSED') {
            ttsStatus = 'PLAYING';
            updatePlayBtnUI(btnElem, true);
            updateStopButtonVisibility(); 
            
            if (activeEngine === 'cloud') {
                if (currentAudio && currentAudio.src) currentAudio.play();
            } else {
                window.speechSynthesis.resume();
            }
            
            startHighlightTimer(msgId);
            return;
        } else if (ttsStatus === 'PLAYING') {
            ttsStatus = 'PAUSED';
            updatePlayBtnUI(btnElem, false);
            const textSpan = btnElem.querySelector('.play-text');
            if (textSpan) textSpan.innerText = "Resume";
            
            if (activeEngine === 'cloud') {
                if (currentAudio) currentAudio.pause();
            } else {
                window.speechSynthesis.pause();
            }
            if (highlightTimer) clearTimeout(highlightTimer);
            return;
        }
    }

    resetCurrentTTS();
    currentActiveBtn = btnElem;
    window.currentPlayingText = plainText;
    ttsStatus = 'PLAYING';
    updatePlayBtnUI(btnElem, true);
    updateStopButtonVisibility(); 

    if (activeEngine === 'cloud') {
        playCloudAudio(plainText, btnElem);
    } else {
        playNativeAudio(plainText, btnElem);
    }
};

// -- ENGINE 1: NATIVE OS TTS --
function playNativeAudio(fullText, btnElement) {
    const msgId = btnElement.getAttribute('data-msg-id');
    const langCode = UI.lang ? UI.lang.value : 'hi-IN';
    
    wordsArray = fullText.match(/\S+/g) || [];
    globalWordIndex = 0;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = langCode;
    utterance.rate = parseFloat(UI.ttsSpeedSlider ? UI.ttsSpeedSlider.value : 1.0);
    utterance.pitch = parseFloat(UI.ttsPitchSlider ? UI.ttsPitchSlider.value : 1.0);
    
    utterance.onstart = () => {
        startHighlightTimer(msgId);
    };

    utterance.onend = () => {
        resetCurrentTTS();
    };

    utterance.onerror = (e) => {
        resetCurrentTTS();
    };

    window.speechSynthesis.speak(utterance);
}

// -- ENGINE 2: CLOUD TTS --
function chunkText(text, maxLength = 180) {
    const regex = /[^.?!।,\n]+[.?!।,\n]*/g;
    let chunks = [];
    let currentChunk = "";
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        let sentence = match[0];
        if (currentChunk.length + sentence.length > maxLength) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    if (chunks.length === 0 && text.trim().length > 0) chunks.push(text.trim());
    return chunks;
}

function playCloudAudio(fullText, btnElement) {
    const msgId = btnElement.getAttribute('data-msg-id');
    const langCode = UI.lang ? UI.lang.value.split('-')[0] : 'hi';
    
    wordsArray = fullText.match(/\S+/g) || [];
    globalWordIndex = 0;
    audioChunks = chunkText(fullText, 180);
    currentChunkIndex = 0;

    playNextChunk(langCode, msgId, btnElement);
}

function playNextChunk(langCode, msgId, btnElement) {
    if (currentChunkIndex >= audioChunks.length || ttsStatus !== 'PLAYING') {
        resetCurrentTTS();
        return;
    }

    const chunkText = audioChunks[currentChunkIndex];
    if (!chunkText || chunkText.trim() === '') {
        currentChunkIndex++;
        playNextChunk(langCode, msgId, btnElement);
        return;
    }

    const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${langCode}&q=${encodeURIComponent(chunkText)}`;
    const currentRate = parseFloat(UI.ttsSpeedSlider ? UI.ttsSpeedSlider.value : 1.0);

    currentAudio.src = url;
    currentAudio.playbackRate = currentRate; 
    currentAudio.preservesPitch = true;

    currentAudio.play().then(() => {
        if (currentChunkIndex === 0) startHighlightTimer(msgId);
    }).catch(err => {
        setTimeout(() => {
            currentChunkIndex++;
            playNextChunk(langCode, msgId, btnElement);
        }, 300);
    });

    currentAudio.onended = () => {
        currentChunkIndex++;
        playNextChunk(langCode, msgId, btnElement);
    };
    currentAudio.onerror = () => {
        currentChunkIndex++;
        playNextChunk(langCode, msgId, btnElement);
    };
}

// -- MASTER HIGHLIGHTER (USED BY BOTH ENGINES) --
function startHighlightTimer(msgId) {
    if (highlightTimer) clearTimeout(highlightTimer);

    const BASE_DELAY = 150;  
    const CHAR_DELAY = 55;   
    const MAX_DELAY = 800;   

    const highlightNextWord = () => {
        if (ttsStatus !== 'PLAYING' || globalWordIndex >= wordsArray.length) return;

        highlightTTSWord(msgId, globalWordIndex);

        const currentWord = wordsArray[globalWordIndex] || "";
        const charCount = currentWord.length;
        const dynamicSpeechRate = parseFloat(UI.ttsSpeedSlider ? UI.ttsSpeedSlider.value : 1.0);

        let wordDuration = (BASE_DELAY + (charCount * CHAR_DELAY)) / dynamicSpeechRate; 
        if (wordDuration > (MAX_DELAY / dynamicSpeechRate)) wordDuration = (MAX_DELAY / dynamicSpeechRate);

        globalWordIndex++;
        highlightTimer = setTimeout(highlightNextWord, wordDuration);
    };

    highlightNextWord();
}

window.copySingleMessage = async (btnElem) => {
    const msgId = btnElem.getAttribute('data-msg-id');
    const text = (rawTextMap[msgId] || "").replace(/YT_SEARCH:.*$/gm, '').replace(/IMG_SEARCH:.*$/gm, '').trim(); 
    try {
        await navigator.clipboard.writeText(text);
        
        const originalHtml = btnElem.innerHTML;
        btnElem.innerHTML = `<span class="text-green-400">Copied!</span>`;
        setTimeout(() => { btnElem.innerHTML = originalHtml; }, 1500);
    } catch(e) {}
};

window.downloadSinglePDF = (btnElem, senderName) => {
    if (typeof html2pdf === 'undefined') {
        alert("PDF engine is still loading. Please try again in a moment.");
        return;
    }

    const msgId = btnElem.getAttribute('data-msg-id');
    const rawText = (rawTextMap[msgId] || "")
        .replace(/YT_SEARCH:.*$/gm, '')
        .replace(/IMG_SEARCH:.*$/gm, '')
        .trim();

    const container = document.createElement('div');
    container.style.padding = '30px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.backgroundColor = '#FFFFFF'; 
    container.style.color = '#000000'; 

    const header = document.createElement('div');
    header.innerText = "ai.eprashala.com";
    header.style.textAlign = 'center';
    header.style.color = '#6b7280'; 
    header.style.fontSize = '14px'; 
    header.style.fontWeight = 'bold';
    header.style.letterSpacing = '2px';
    header.style.paddingBottom = '15px';
    header.style.marginBottom = '20px';
    header.style.borderBottom = '2px solid #e5e7eb';
    container.appendChild(header);

    const title = document.createElement('h3');
    title.innerText = `Ancient Library: ${getSelectedItemName()}`;
    title.style.color = '#0891b2'; // cyan-600
    title.style.marginBottom = '15px';
    container.appendChild(title);

    const content = document.createElement('div');
    content.innerHTML = marked.parse(rawText);
    content.style.lineHeight = '1.6';
    
    const allElements = content.querySelectorAll('*');
    allElements.forEach(el => { el.style.color = '#1e293b'; });

    container.appendChild(content);

    const opt = {
        margin:       0.5,
        filename:     `Ancient_Library_Note_${new Date().toISOString().slice(0,10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(container).save();
};

// --- RENDER UI ---
function renderMessage(sender, text, isModel) {
    const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const div = document.createElement('div');
    
    rawTextMap[msgId] = text; 
    
    div.className = `msg-container p-4 rounded-2xl ${isModel ? 'bg-[#0f172a]/90 border border-slate-700/50 shadow-lg ml-2 mr-8' : 'bg-cyan-900/40 text-right mr-2 ml-8'} mb-4`;
    
    let parsedText = text;
    let mediaLinks = "";

    if (isModel) {
        parsedText = parsedText.replace(/YT_SEARCH:\s*(.*)/g, (match, keyword) => {
            const q = encodeURIComponent(keyword.trim());
            mediaLinks += `<a href="https://www.youtube.com/results?search_query=${q}" target="_blank" class="external-link-btn yt-btn">🎥 Watch Video</a>`;
            return ""; 
        });
        parsedText = parsedText.replace(/IMG_SEARCH:\s*(.*)/g, (match, keyword) => {
            const q = encodeURIComponent(keyword.trim());
            mediaLinks += `<a href="https://www.google.com/search?tbm=isch&q=${q}" target="_blank" class="external-link-btn img-btn">🖼️ See Images</a>`;
            return "";
        });
    }

    const displayHtml = isModel ? marked.parse(parsedText) + (mediaLinks ? `<div class="mt-3 block border-t border-slate-700/50 pt-2 flex flex-wrap">${mediaLinks}</div>` : '') : text;
    
    let htmlContent = `
        <div class="text-[10px] uppercase font-bold tracking-wider ${isModel ? 'text-cyan-400 cinzel' : 'text-slate-300'} mb-1">${sender}</div>
        <div class="text-sm leading-relaxed text-gray-100 markdown-body" id="md-${msgId}">${displayHtml}</div>
    `;

    // Inject the edit pencil directly into the user's bubble
    if (!isModel) {
        htmlContent += `
            <div class="flex justify-end mt-1.5 -mb-1">
                <button class="user-edit-btn text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none hidden" onclick="window.triggerEditLastInput(event)" title="Edit this input">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
            </div>
        `;
    }
    
    if (isModel) {
        htmlContent += `
            <div class="msg-action-bar mt-3 flex justify-end gap-2">
                <button class="btn-pdf-msg p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-slate-400 hover:text-red-400 transition-colors shadow-sm focus:outline-none" data-sender="${sender}" title="Download Answer as PDF">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
                <button class="btn-copy-msg p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-slate-400 hover:text-green-400 transition-colors shadow-sm focus:outline-none" onclick="window.copySingleMessage(this)" data-msg-id="${msgId}" title="Copy Answer">
                    <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </button>
                <button id="play-btn-${msgId}" class="btn-play-msg flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-slate-400 transition-colors shadow-sm focus:outline-none" data-msg-id="${msgId}" title="Play/Pause Audio">
                    <svg class="play-icon w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <svg class="pause-icon w-4 h-4 hidden pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    <span class="play-text text-[10px] font-bold uppercase tracking-wider pointer-events-none">Play</span>
                </button>
            </div>`;
    }

    div.innerHTML = htmlContent;
    UI.log.appendChild(div);

    if (isModel) {
        const mdBody = div.querySelector('.markdown-body');
        
        const cleanTextForTTS = text
            .replace(/YT_SEARCH:.*$/gm, '')
            .replace(/IMG_SEARCH:.*$/gm, '')
            .replace(/[*_#`~]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/<[^>]+>/g, '')
            .trim();
            
        const speechText = prepareTextForTTSAndHighlighting(mdBody, msgId);
        speechDataMap[msgId] = cleanTextForTTS; 
    }
    
    updateEditPencil();
    
    setTimeout(() => { UI.log.scrollTop = UI.log.scrollHeight; }, 50);

    return msgId;
}