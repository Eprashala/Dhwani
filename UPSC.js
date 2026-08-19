/**
 * upsc.eprashala.com - AI Teacher & Interactive Exam Engine
 */

// --- 0. SECURITY, WAKE LOCK, VISIBILITY & FULLSCREEN ---
document.addEventListener('contextmenu', event => event.preventDefault());
// --- DYNAMIC VIEWPORT FIX FOR ANDROID ---
function updateViewportHeight() {
    // Calculates 1% of the true visible window height
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    document.body.style.height = `calc(var(--vh, 1vh) * 100)`;
}
window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', updateViewportHeight);
updateViewportHeight(); // Run immediately on load

let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) { }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        requestWakeLock();
    }
});

function enforceFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        const docElm = document.documentElement;
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen().catch(() => {});
        } else if (docElm.webkitRequestFullscreen) { 
            docElm.webkitRequestFullscreen().catch(() => {});
        } else if (docElm.msRequestFullscreen) { 
            docElm.msRequestFullscreen().catch(() => {});
        }
    }
}

// Aggressively capture all interactions to ensure fullscreen stays locked
['click', 'touchstart', 'touchend', 'keydown'].forEach(eventType => {
    window.addEventListener(eventType, enforceFullscreen, { capture: true, passive: true });
    document.addEventListener(eventType, enforceFullscreen, { capture: true, passive: true });
});

const CONFIG = {
    PROXY_URL: "https://eprashala.pythonanywhere.com/api/chat", // Added the required endpoint path
};

// --- DOM REFERENCES ---
const UI = {
    overlay: document.getElementById('start-overlay'),
    btnStart: document.getElementById('btn-start'),
    langSelector: document.getElementById('lang-selector'),
    yearSelector: document.getElementById('year-selector'),
    paperTypeSelector: document.getElementById('paper-type-selector'),
    btnStartExam: document.getElementById('btn-start-exam'),
    randomCheckbox: document.getElementById('random-checkbox'),
    scoreCounter: document.getElementById('score-counter'),
	examTimer: document.getElementById('exam-timer'),
    lblRandom: document.getElementById('lbl-random'),
	btnCamera: document.getElementById('btn-camera'),
    cameraInput: document.getElementById('camera-input'),
    cropModal: document.getElementById('crop-modal'),
    cropImage: document.getElementById('crop-image'),
    btnCropRetake: document.getElementById('btn-crop-retake'),
    btnCropDone: document.getElementById('btn-crop-done'),
    
    // Question Card
    qIndexBadge: document.getElementById('q-index-badge'),
    qSubjectBadge: document.getElementById('q-subject-badge'),
    qStatement: document.getElementById('q-statement'),
    optionsContainer: document.getElementById('options-container'),
    
    // Dhwani Box
    dhwaniMentorBox: document.getElementById('dhwani-mentor-box'),
    dhwaniExplanation: document.getElementById('dhwani-explanation'),
    btnNextQuestion: document.getElementById('btn-next-question'),
    lblUnderstandingPrompt: document.getElementById('lbl-understanding-prompt'),
	btnAskDhwaniIas: document.getElementById('btn-ask-dhwani-ias'),
    chatStream: document.getElementById('chat-stream'),
    mainScroll: document.getElementById('main-scroll-area'),
    
    // Doubt Input & Voice
    userDoubtInput: document.getElementById('user-doubt-input'),
    btnVoiceMic: document.getElementById('btn-voice-mic'),
    btnSendDoubt: document.getElementById('btn-send-doubt'),
	btnExportPdf: document.getElementById('btn-export-pdf'),

    // Settings
    settingsModal: document.getElementById('settings-modal'),
    btnSettingsOpen: document.getElementById('btn-settings-open'),
    btnSettingsClose: document.getElementById('btn-settings-close'),
    btnSettingsSave: document.getElementById('btn-settings-save'),
    cfgUserName: document.getElementById('cfg-user-name'),
    cfgCustomKey: document.getElementById('cfg-custom-key'),
    cfgTtsSpeed: document.getElementById('cfg-tts-speed'),
	
	// Inside const UI = { ... }
    rememberCheckbox: document.getElementById('remember-checkbox'),
	highlightCheckbox: document.getElementById('highlight-checkbox'),
    mainView: document.getElementById('settings-main-view'),
    historyView: document.getElementById('settings-history-view'),
    btnViewHistory: document.getElementById('btn-view-history'),
    btnHistoryBack: document.getElementById('btn-history-back'),
    historyListContainer: document.getElementById('history-list-container'),
};

// --- APP STATE ---
let papersDatabase = {};
let activePaperKey = "";
let currentQuestionList = [];
let currentQuestionIndex = 0;
let userScore = 0;
let isAnswerEvaluated = false;
let chatHistory = [];
let currentAudio = new Audio();
let recognition = null;
let isRecording = false;
let ttsStatus = 'STOPPED';
let currentActiveBtn = null;
let currentMsgId = null;
const rawTextMap = {};
let wordsArray = [];
let globalWordIndex = 0;
let highlightTimer = null;
let lastHighlightedSpan = null;
const speechDataMap = {};
let activeExamSeconds = 0;
let examTimerInterval = null;
let allSessions = []; 
const currentDateKey = new Date().toISOString().split('T')[0];
let currentSessionId = Date.now();
let upscDB = null;
let pendingImageData = null; 
let cropper = null;

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    loadPreferences();
    await initIndexedDB();
    await loadAllSessionsFromDB();
    populateYearDropdown(); // Populate dropdown immediately without waiting for a download
    initSpeechEngine();
    setupEventListeners();
});

function loadPreferences() {
    UI.cfgUserName.value = localStorage.getItem('upsc_user_name') || "Aspirant";
    UI.cfgCustomKey.value = localStorage.getItem('upsc_api_key') || "";
    UI.cfgTtsSpeed.value = localStorage.getItem('upsc_tts_speed') || "1.0";
    if (localStorage.getItem('upsc_lang')) {
        UI.langSelector.value = localStorage.getItem('upsc_lang');
    }
    UI.rememberCheckbox.checked = localStorage.getItem('upsc_remember') !== 'false';
	UI.highlightCheckbox.checked = localStorage.getItem('upsc_highlight') === 'true';
}

function savePreferences() {
    localStorage.setItem('upsc_user_name', UI.cfgUserName.value.trim());
    localStorage.setItem('upsc_api_key', UI.cfgCustomKey.value.trim());
    localStorage.setItem('upsc_tts_speed', UI.cfgTtsSpeed.value);
    localStorage.setItem('upsc_lang', UI.langSelector.value);
    localStorage.setItem('upsc_remember', UI.rememberCheckbox.checked);
	localStorage.setItem('upsc_highlight', UI.highlightCheckbox.checked);
}

// --- UI SETUP ---
function populateYearDropdown() {
    UI.yearSelector.innerHTML = '';
    // Populate from 2026 down to 2000
    for (let y = 2026; y >= 2000; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = `UPSC Year - ${y}`;
        UI.yearSelector.appendChild(option);
    }
}

function savePreferences() {
    localStorage.setItem('upsc_user_name', UI.cfgUserName.value.trim());
    localStorage.setItem('upsc_api_key', UI.cfgCustomKey.value.trim());
    localStorage.setItem('upsc_tts_speed', UI.cfgTtsSpeed.value);
    localStorage.setItem('upsc_lang', UI.langSelector.value);
    localStorage.setItem('upsc_remember', UI.rememberCheckbox.checked);
}

// --- INDEXEDDB SETUP (upsc.db) ---
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('upsc_db', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('sessions')) {
                db.createObjectStore('sessions', { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => {
            upscDB = e.target.result;
            resolve(upscDB);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveSessionToDB() {
    if (!UI.rememberCheckbox.checked || chatHistory.length === 0) return;
    if (!upscDB) await initIndexedDB();

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const paperName = activePaperKey ? activePaperKey.replace('_', ' ') : "Practice Session";
    
    // Check if session exists in memory to maintain custom renamed titles
    let existingSession = allSessions.find(s => s.id === currentSessionId);
    let displayTitle = existingSession ? existingSession.title : `${paperName} (${currentDateKey} - ${timeString})`;

    const sessionData = { 
        id: currentSessionId, 
        date: currentDateKey, 
        title: displayTitle, 
        messages: chatHistory,
        score: userScore,
        timer: activeExamSeconds
    };

    return new Promise((resolve, reject) => {
        const tx = upscDB.transaction('sessions', 'readwrite');
        const store = tx.objectStore('sessions');
        store.put(sessionData);
        tx.oncomplete = () => {
            // Update RAM cache
            const index = allSessions.findIndex(s => s.id === currentSessionId);
            if (index > -1) allSessions[index] = sessionData;
            else allSessions.push(sessionData);
            resolve();
        };
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function loadAllSessionsFromDB() {
    if (!upscDB) await initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = upscDB.transaction('sessions', 'readonly');
        const store = tx.objectStore('sessions');
        const request = store.getAll();
        request.onsuccess = () => {
            allSessions = request.result;
            resolve(allSessions);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

async function deleteSessionFromDB(id) {
    if (!upscDB) await initIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = upscDB.transaction('sessions', 'readwrite');
        const store = tx.objectStore('sessions');
        store.delete(id);
        tx.oncomplete = () => {
            allSessions = allSessions.filter(s => s.id !== id);
            resolve();
        };
        tx.onerror = (e) => reject(e.target.error);
    });
}


// --- LOCAL DATABASE / HISTORY VAULT ---
function renderHistoryList() {
    UI.historyListContainer.innerHTML = '';
    
    if (allSessions.length === 0) {
        UI.historyListContainer.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-slate-500"><svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg><p class="text-sm italic">No past records found.</p></div>';
        return;
    }

    const sorted = [...allSessions].sort((a, b) => b.id - a.id);

    sorted.forEach(session => {
        const card = document.createElement('div');
        card.className = "w-full text-left text-sm text-slate-300 bg-slate-800/80 hover:bg-slate-700 p-4 rounded-xl transition-colors border border-slate-700 hover:border-orange-500/50 flex flex-col gap-2 outline-none mb-2 shadow-sm cursor-pointer group";
        
        card.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-2 overflow-hidden flex-1">
                    <span class="font-bold tracking-wide text-white truncate">${session.title}</span>
                    <button class="rename-btn p-1 text-slate-500 hover:text-orange-400 transition-colors focus:outline-none" title="Rename Session">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                </div>
                <span class="text-[10px] text-green-400 bg-green-900/40 border border-green-800/50 px-2 py-1 rounded-full font-bold uppercase ml-2 flex-shrink-0">Score: ${session.score || 0}</span>
            </div>
            <div class="text-xs text-slate-400 truncate w-full pointer-events-none flex justify-between">
                <span>${session.paperKey || 'UPSC Exam'}</span>
                <span>${session.messages ? session.messages.length : 0} interactions</span>
            </div>
        `;
        
        const renameBtn = card.querySelector('.rename-btn');
        renameBtn.onclick = (e) => {
            e.stopPropagation();
            const newTitle = prompt("Enter a new name for this exam session:", session.title);
            if (newTitle && newTitle.trim() !== "") {
                session.title = newTitle.trim();
                localStorage.setItem('upsc_all_history', JSON.stringify(allSessions));
                renderHistoryList(); 
                if (currentSessionId === session.id) {
                    const banner = document.getElementById('archive-notice-banner');
                    if (banner) banner.innerText = `Archived Exam: ${session.title}`;
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
        
        UI.historyListContainer.appendChild(card);
    });
}

function loadSpecificSession(targetId) {
    stopTTS();
    UI.chatStream.innerHTML = '';
    chatHistory = [];
    
    const targetSession = allSessions.find(s => s.id === targetId);
    if (targetSession) {
        currentSessionId = targetSession.id;
        chatHistory = targetSession.messages || [];
        currentQuestionList = targetSession.questionList || [];
        activePaperKey = targetSession.paperKey || "";
        userScore = targetSession.score || 0;
        activeExamSeconds = targetSession.activeTime || 0;
        currentQuestionIndex = targetSession.qIndex || 0;
        
        if (activePaperKey) {
            const parts = activePaperKey.split('_');
            if (parts.length === 2) {
                UI.yearSelector.value = parts[0];
                UI.paperTypeSelector.value = parts[1];
            }
        }
        
        updateScoreUI();
        updateTimerDisplay();
        stopExamTimer(); // Don't run timer for an archived session
        
        // Render archive banner
        let banner = document.getElementById('archive-notice-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = "archive-notice-banner"; 
            banner.className = "text-center text-xs text-orange-400 mb-6 font-bold border-b border-orange-900/50 pb-2 uppercase tracking-widest mt-4";
            UI.chatStream.parentElement.insertBefore(banner, UI.chatStream);
        }
        banner.innerText = `Archived Exam: ${targetSession.title}`;

        // Re-render the locked question state safely
        if (currentQuestionList.length > 0) {
            isAnswerEvaluated = true; // Lock the UI to prevent edits
            
            const total = currentQuestionList.length;
            const currentLang = UI.langSelector.value;
            const qData = currentQuestionList[currentQuestionIndex];
            const localized = currentLang === 'hi' ? qData.hi : qData.en;

            UI.qIndexBadge.textContent = currentLang === 'hi' 
                ? `प्रश्न ${currentQuestionIndex + 1} / ${total} (Archived)` 
                : `Question ${currentQuestionIndex + 1} of ${total} (Archived)`;
            UI.qSubjectBadge.textContent = qData.subject || "General Studies";
            UI.qStatement.textContent = localized.question;

            UI.optionsContainer.innerHTML = '';
            const letters = ['A', 'B', 'C', 'D'];

            localized.options.forEach((optText, idx) => {
                const optBtn = document.createElement('div');
                optBtn.className = 'option-card disabled'; 
                if (idx === qData.correct_option) optBtn.classList.add('correct');
                
                optBtn.innerHTML = `
                    <span class="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-xs text-sky-400 flex-shrink-0">${letters[idx]}</span>
                    <span class="flex-1">${optText}</span>
                `;
                UI.optionsContainer.appendChild(optBtn);
            });
        }

        // Render Chat History
        chatHistory.forEach(msg => {
            appendChatMessage(msg.role, msg.text, true); 
        });
        
        UI.dhwaniMentorBox.classList.remove('hidden');
    }
}



// --- LOAD PAPERS JSON & UI SETUP ---
async function loadPaperDatabase() {
    try {
        const response = await fetch('./upsc_papers.json');
        if (!response.ok) throw new Error("Could not load upsc_papers.json");
        papersDatabase = await response.json();
        populateYearDropdown();
    } catch (e) {
        console.error("Paper load error:", e);
        UI.qStatement.innerHTML = `<span class="text-rose-400 font-bold">Failed to load question database. Please ensure upsc_papers.json is present.</span>`;
    }
}

function populateYearDropdown() {
    UI.yearSelector.innerHTML = '';
    // Populate from 2026 down to 2000
    for (let y = 2026; y >= 2000; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = `UPSC Year - ${y}`;
        UI.yearSelector.appendChild(option);
    }
}

// --- DYNAMIC LAZY-LOADING ENGINE ---
async function loadPaperQuestions() {
    const selectedYear = UI.yearSelector.value;
    const selectedPaper = UI.paperTypeSelector.value;
    activePaperKey = `${selectedYear}_${selectedPaper}`; // e.g., "2026_GS1"

    // 1. Check if we already downloaded this year's file to save RAM & Internet Data
    if (!papersDatabase[selectedYear]) {
        UI.qStatement.innerHTML = `<span class="text-sky-400 font-bold animate-pulse">Downloading ${selectedYear} papers securely...</span>`;
        UI.optionsContainer.innerHTML = '';
        
        try {
            // Dynamically fetch the specific year's file
            const response = await fetch(`./${selectedYear}_upsc_papers.json`);
            if (!response.ok) throw new Error("File not found on server");
            
            // Cache the downloaded year into memory
            papersDatabase[selectedYear] = await response.json();
        } catch (e) {
            console.warn(`Missing file: ${selectedYear}_upsc_papers.json`);
            UI.qStatement.innerHTML = `<span class="text-orange-400 font-bold">The ${selectedYear} papers are not available yet on the server.</span>`;
            return;
        }
    }

    // 2. Extract the data from the cached year
    const yearData = papersDatabase[selectedYear];
    
    // This allows the JSON keys inside the file to be either "2026_GS1" OR just "GS1"
    const paperData = yearData[activePaperKey] || yearData[selectedPaper];

    if (!paperData || !paperData.questions || paperData.questions.length === 0) {
        UI.qStatement.innerHTML = `<span class="text-orange-400 font-bold">The ${selectedPaper} for ${selectedYear} is not currently available.</span>`;
        UI.optionsContainer.innerHTML = '';
        return;
    }
    
    // 3. Deep clone the questions so our shuffles don't alter the master cache
    currentQuestionList = JSON.parse(JSON.stringify(paperData.questions));
    
    if (UI.randomCheckbox.checked) {
        shuffleQuestionsAndOptions(currentQuestionList);
    }

    currentQuestionIndex = 0;
    userScore = 0;
    updateScoreUI();
    resetExamTimer();
    currentSessionId = Date.now(); // Generate new unique ID for the vault
    chatHistory = [];
    renderCurrentQuestion();
}

function shuffleQuestionsAndOptions(qList) {
    // 1. Shuffle the order of the questions
    for (let i = qList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qList[i], qList[j]] = [qList[j], qList[i]];
    }

    // 2. Shuffle the 4 options inside each question
    qList.forEach(q => {
        // Create an index array representing A,B,C,D
        let indices = [0, 1, 2, 3];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Track where the original correct answer moved to
        let newCorrectIndex = indices.indexOf(q.correct_option);
        q.correct_option = newCorrectIndex;

        // Apply the same shuffle pattern to English options
        if (q.en && q.en.options) {
            let newEnOptions = [];
            indices.forEach(idx => newEnOptions.push(q.en.options[idx]));
            q.en.options = newEnOptions;
        }
        
        // Apply the exact same shuffle pattern to Hindi options to keep them perfectly synced
        if (q.hi && q.hi.options) {
            let newHiOptions = [];
            indices.forEach(idx => newHiOptions.push(q.hi.options[idx]));
            q.hi.options = newHiOptions;
        }
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- QUESTION RENDERING ---
function renderCurrentQuestion() {
    isAnswerEvaluated = false;
    stopTTS();
    UI.dhwaniMentorBox.classList.add('hidden');
    UI.chatStream.innerHTML = '';
    chatHistory = [];

    const total = currentQuestionList.length;
    if (total === 0) {
        UI.qStatement.textContent = "No questions found in this paper set.";
        return;
    }

    const currentLang = UI.langSelector.value;
    const qData = currentQuestionList[currentQuestionIndex];
    const localized = currentLang === 'hi' ? qData.hi : qData.en;

    UI.qIndexBadge.textContent = currentLang === 'hi' 
        ? `प्रश्न ${currentQuestionIndex + 1} / ${total}` 
        : `Question ${currentQuestionIndex + 1} of ${total}`;
        
    UI.qSubjectBadge.textContent = qData.subject || "General Studies";
    UI.qStatement.textContent = localized.question;

    UI.optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    localized.options.forEach((optText, idx) => {
        const optBtn = document.createElement('div');
        optBtn.className = 'option-card';
        optBtn.innerHTML = `
            <span class="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-xs text-sky-400 flex-shrink-0">
                ${letters[idx]}
            </span>
            <span class="flex-1">${optText}</span>
        `;
        optBtn.onclick = () => evaluateAnswer(idx, optBtn);
        UI.optionsContainer.appendChild(optBtn);
    });

    UI.mainScroll.scrollTop = 0;
	startExamTimer();
}

// --- ANSWER EVALUATION & DHWANI TRIGGER ---
async function evaluateAnswer(selectedIndex, selectedBtn) {
    if (isAnswerEvaluated) return;
    isAnswerEvaluated = true;
	stopExamTimer();

    const qData = currentQuestionList[currentQuestionIndex];
    const isCorrect = (selectedIndex === qData.correct_option);
    const options = UI.optionsContainer.querySelectorAll('.option-card');
    
    // Disable all options and show colors
    options.forEach((btn, idx) => {
        btn.classList.add('disabled');
        if (idx === qData.correct_option) {
            btn.classList.add('correct');
        }
    });

    if (!isCorrect) {
        selectedBtn.classList.add('wrong');
    } else {
        userScore += 2; // Standard UPSC Prelims +2
        updateScoreUI();
    }

    // Trigger Dhwani AI Response
    await triggerDhwaniResponse(isCorrect, selectedIndex);
}

// --- DHWANI AI PEDAGOGY LOGIC ---
async function triggerDhwaniResponse(isCorrect, userSelectionIndex) {
    UI.dhwaniMentorBox.classList.remove('hidden');
    UI.dhwaniExplanation.innerHTML = `<span class="text-sky-400 animate-pulse text-xs">Dhwani AI Teacher is preparing explanation...</span>`;
    UI.mainScroll.scrollTop = UI.mainScroll.scrollHeight;

    const currentLang = UI.langSelector.value;
    const qData = currentQuestionList[currentQuestionIndex];
    const localized = currentLang === 'hi' ? qData.hi : qData.en;
    const candidateName = localStorage.getItem('upsc_user_name') || "Aspirant";

    const systemPrompt = `You are Dhwani AI, an elite UPSC Civil Services mentor at upsc.eprashala.com.
Target Language: ${currentLang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}.
Candidate Name: ${candidateName}.
Subject: ${qData.subject}.

Question Context:
Question: ${localized.question}
Options:
A) ${localized.options[0]}
B) ${localized.options[1]}
C) ${localized.options[2]}
D) ${localized.options[3]}

Correct Option: ${['A', 'B', 'C', 'D'][qData.correct_option]}
Candidate Selected: ${['A', 'B', 'C', 'D'][userSelectionIndex]} (Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'})

INSTRUCTIONS:
1. IF CORRECT: 
   - Warmly greet ${candidateName} and praise the logical accuracy.
   - Provide a concise 2-3 sentence high-yield summary of key UPSC facts to remember.
   - Invite them to proceed to the next question.
2. IF INCORRECT:
   - Politely acknowledge the mistake with encouraging words.
   - Deliver a clear, deep, and structured conceptual explanation of why the correct option is right and why their chosen option fails.
   - Point out common traps UPSC sets for this topic.
   - End by asking if they have understood or want further clarification on any specific sub-point.
3. FORMAT: Clean Markdown with bold highlights. Keep it engaging and intellectually sharp.`;

    try {
        const aiMessage = await queryGeminiDirectOrProxy([{ text: "Evaluate question" }], systemPrompt);
        const msgId = 'msg-' + Date.now();
        rawTextMap[msgId] = aiMessage;
        
        UI.dhwaniExplanation.innerHTML = marked.parse(aiMessage) + generateActionBar(msgId);
        
        // Wrap the text in highlight tracking spans
        const speechText = prepareTextForTTSAndHighlighting(UI.dhwaniExplanation, msgId);
        speechDataMap[msgId] = speechText;

        chatHistory.push({ role: 'model', text: aiMessage });
        saveSessionToDB();

        // Auto trigger the floating TTS
        setTimeout(() => { window.toggleSingleMessagePlay(msgId); }, 100);
        UI.mainScroll.scrollTop = UI.mainScroll.scrollHeight;
    } catch (err) {
        console.error("AI Generation Error:", err);
        UI.dhwaniExplanation.innerHTML = marked.parse(localized.explanation || "Correct Answer Explanation unavailable offline.");
    }

}


// --- GEMINI API / PROXY CALL (IMPLEMENTING EXACT TIER LOGIC) ---
async function queryGeminiDirectOrProxy(messages, systemInstruction) {
    const userKey = localStorage.getItem('upsc_api_key') || "";
    const modelId = "gemini-flash-lite-latest"; // Main model
    
    // Construct the base payload (Now handling image parts!)
    let payloadObject = {
        contents: messages.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: m.parts ? m.parts : [{ text: m.text }] // Uses multimodal parts if available
        })),
        systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    // TIER 1: User Direct Route (Personal API Key)
    if (userKey && userKey.length > 10) {
        
        // STRICT REQUIREMENT: Remove 'model' from the JSON body or Google will reject it.
        delete payloadObject.model;

        const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadObject)
        };

        try {
            console.log(`Direct Route Active: Targeting ${modelId}...`);
            const primaryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${userKey}`;
            const primaryResponse = await fetch(primaryUrl, fetchOptions);
            
            if (!primaryResponse.ok) throw new Error(`Primary model status: ${primaryResponse.status}`);
            
            const data = await primaryResponse.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.warn("Primary channel unavailable. Falling back to Flash...", error);
            
            // UPDATED FALLBACK: Pointing to standard Flash Latest
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${userKey}`;
            
            const fallbackResponse = await fetch(fallbackUrl, fetchOptions);
            if (!fallbackResponse.ok) throw new Error(`Fallback model status: ${fallbackResponse.status}`);
            
            const fallbackData = await fallbackResponse.json();
            return fallbackData.candidates[0].content.parts[0].text;
        }
    } 
    
    // TIER 2: Proxy Gateway (No Personal Key - Uses Server Key)
    else {
        console.log(`Proxy Route Active: Forwarding request for ${modelId} to Central Gateway...`);
        
        // ONLY inject the model name here, because your Python proxy expects it.
        payloadObject.model = modelId;
        
        const proxyOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadObject)
        };

        const response = await fetch(CONFIG.PROXY_URL, proxyOptions);
        if (!response.ok) throw new Error(`Proxy model status: ${response.status}`);
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}

// --- USER DOUBT SUBMISSION ---
// --- USER DOUBT SUBMISSION (MULTIMODAL) ---
async function submitUserDoubt() {
    const text = UI.userDoubtInput.value.trim();
    if (!text && !pendingImageData) return; // Stop if completely empty
    
    UI.userDoubtInput.value = '';
    UI.userDoubtInput.placeholder = "Ask Dhwani AI any doubt regarding this question...";
    
    // Create UI Display String
    const displayMsg = text + (pendingImageData ? " 📷 [Image attached]" : "");
    appendChatMessage('user', displayMsg);

    // Build the multimodal data array for Gemini
    let userMessageParts = [];
    if (text) userMessageParts.push({ text: text });
    if (!text && pendingImageData) userMessageParts.push({ text: "Please analyze this image in the context of the active UPSC question." });
    if (pendingImageData) {
        userMessageParts.push({ inlineData: { mimeType: "image/jpeg", data: pendingImageData } });
    }

    // Reset UI Camera State immediately
    pendingImageData = null;
    UI.btnCamera.classList.remove('text-orange-400');
    UI.btnCamera.classList.add('text-slate-400');

    const currentLang = UI.langSelector.value;
    const qData = currentQuestionList[currentQuestionIndex];
    const candidateName = localStorage.getItem('upsc_user_name') || "Aspirant";

    const systemPrompt = `You are Dhwani AI, UPSC mentor at upsc.eprashala.com.
You are clarifying a doubt for ${candidateName} regarding the active UPSC question (${qData.subject}).
Language: ${currentLang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}.
Maintain high conceptual clarity, cite standard sources (NCERT, Laxmikanth, PMFIAS, Economic Survey) where relevant. If the user attached an image, integrate its analysis thoroughly.`;

    // SAFELY FORMAT HISTORY
    let formattedHistory = [];
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
        formattedHistory.push({ role: 'user', text: "Here is my previous test evaluation." });
    }
    
    // Attach old history, and append the NEW message containing the image payload
    formattedHistory = formattedHistory.concat(chatHistory.map(m => ({ text: m.text, role: m.role })));
    formattedHistory.push({ role: 'user', parts: userMessageParts, text: displayMsg });

    try {
        const aiResponse = await queryGeminiDirectOrProxy(formattedHistory, systemPrompt);
        
        // Log plain text in DB so we don't bloat local storage with giant image base64s
        chatHistory.push({ role: 'user', text: displayMsg });
        chatHistory.push({ role: 'model', text: aiResponse });
        saveSessionToDB();

        appendChatMessage('model', aiResponse);
    } catch (e) {
        console.error("Custom Doubt API Error:", e);
        appendChatMessage('system', "⚠️ Network interrupted. Please try again.");
    }
}

function appendChatMessage(role, text, isRestoring = false) {
    const div = document.createElement('div');
    if (role === 'user') {
        div.className = 'glass-card p-3 rounded-xl bg-sky-950/40 text-right ml-8 border-sky-800/40 text-xs text-sky-200';
        div.textContent = text;
	} else if (role === 'model') {
        const msgId = 'msg-' + Date.now();
        rawTextMap[msgId] = text;
        
        div.className = 'glass-card p-3.5 rounded-xl bg-slate-900/90 mr-8 border-slate-700 text-xs text-slate-200 markdown-body';
        div.innerHTML = marked.parse(text) + generateActionBar(msgId);
        
        // Wrap the text in highlight tracking spans
        const speechText = prepareTextForTTSAndHighlighting(div, msgId);
        speechDataMap[msgId] = speechText;

        // Auto trigger floating TTS only for live exams, not history loads
        if (!isRestoring) {
            setTimeout(() => { window.toggleSingleMessagePlay(msgId); }, 100);
        }
    } else {
        div.className = 'text-center text-xs text-rose-400 my-1';
        div.textContent = text;
    }
    UI.chatStream.appendChild(div);
    UI.mainScroll.scrollTop = UI.mainScroll.scrollHeight;
}

// --- SPEECH RECOGNITION (MIC INPUT) ---
function initSpeechEngine() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        UI.btnVoiceMic.classList.add('mic-listening');
        UI.userDoubtInput.placeholder = "Listening to your doubt...";
    };

    recognition.onresult = (e) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
            transcript += e.results[i][0].transcript;
        }
        UI.userDoubtInput.value = transcript;
    };

    recognition.onend = () => {
        isRecording = false;
        UI.btnVoiceMic.classList.remove('mic-listening');
        UI.userDoubtInput.placeholder = "Ask Dhwani AI any doubt regarding this question...";
        if (UI.userDoubtInput.value.trim().length > 0) {
            submitUserDoubt();
        }
    };

    recognition.onerror = () => {
        isRecording = false;
        UI.btnVoiceMic.classList.remove('mic-listening');
    };
}

// --- WORD HIGHLIGHTING ENGINE ---
function prepareTextForTTSAndHighlighting(container, msgId) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
            if (node.parentNode && node.parentNode.closest('.msg-action-bar')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    }, false);
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.nodeValue.trim() !== '') textNodes.push(node);
    }

    let wordCounter = 0;
    let finalSpeechText = [];
    let insideBracket = false;

    textNodes.forEach(textNode => {
        const parts = textNode.nodeValue.split(/(\s+)/); 
        const fragment = document.createDocumentFragment();
        
        parts.forEach(part => {
            if (part.trim().length > 0) {
                const span = document.createElement('span');
                span.className = 'transition-all duration-150'; 
                span.textContent = part;
                
                let skipThisWord = false;
                if (/[\(\[\{]/.test(part)) insideBracket = true;
                if (insideBracket) skipThisWord = true;
                if (/[\)\]\}]/.test(part)) insideBracket = false;

                if (!skipThisWord) {
                    span.id = `tts-${msgId}-${wordCounter}`;
                    let spokenWord = part.replace(/[:;]/g, '.');
                    finalSpeechText.push(spokenWord);
                    wordCounter++;
                }
                fragment.appendChild(span);
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
        // ONLY apply visual orange highlights if the user checked the setting
        if (UI.highlightCheckbox.checked) {
            span.classList.add('bg-orange-500/30', 'text-orange-300', 'font-bold', 'rounded-[3px]', 'px-[2px]', 'shadow-[0_0_8px_rgba(249,115,22,0.4)]');
            lastHighlightedSpan = span;
        }

        // ALWAYS auto-scroll to keep the reading position in view
        const logContainer = document.getElementById('main-scroll-area');
        const spanRect = span.getBoundingClientRect();
        const logRect = logContainer.getBoundingClientRect();
        
        if (spanRect.bottom > logRect.bottom - 40 || spanRect.top < logRect.top + 40) {
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function clearTTSHighlight() {
    if (lastHighlightedSpan) {
        lastHighlightedSpan.classList.remove('bg-orange-500/30', 'text-orange-300', 'font-bold', 'rounded-[3px]', 'px-[2px]', 'shadow-[0_0_8px_rgba(249,115,22,0.4)]');
        lastHighlightedSpan = null;
    }
}

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
        const dynamicSpeechRate = parseFloat(UI.cfgTtsSpeed.value || "1.0");

        let wordDuration = (BASE_DELAY + (charCount * CHAR_DELAY)) / dynamicSpeechRate; 
        if (wordDuration > (MAX_DELAY / dynamicSpeechRate)) wordDuration = (MAX_DELAY / dynamicSpeechRate);

        globalWordIndex++;
        highlightTimer = setTimeout(highlightNextWord, wordDuration);
    };

    highlightNextWord();
}

window.toggleSingleMessagePlay = (msgId) => {
    const btnElem = document.getElementById(`play-btn-${msgId}`);
    
    // Pull the bracket-cleaned text generated by the highlighter
    const plainText = speechDataMap[msgId] || "";
    if (!plainText) return;

    if (currentMsgId === msgId) {
        if (ttsStatus === 'PLAYING') {
            window.speechSynthesis.pause();
            ttsStatus = 'PAUSED';
            updatePlayBtnUI(btnElem, false);
            if (highlightTimer) clearTimeout(highlightTimer);
        } else if (ttsStatus === 'PAUSED') {
            window.speechSynthesis.resume();
            ttsStatus = 'PLAYING';
            updatePlayBtnUI(btnElem, true);
            startHighlightTimer(msgId);
        }
        return;
    }

    // Play New Message
    stopTTS();
    currentMsgId = msgId;
    currentActiveBtn = btnElem;
    
    // Reset Highlighter Words Array
    wordsArray = plainText.match(/\S+/g) || [];
    globalWordIndex = 0;
    
    const langCode = UI.langSelector.value === 'hi' ? 'hi-IN' : 'en-IN';
    const rate = parseFloat(UI.cfgTtsSpeed.value || "1.0");

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = langCode;
    utterance.rate = rate;
    
    utterance.onstart = () => {
        ttsStatus = 'PLAYING';
        updatePlayBtnUI(btnElem, true);
        startHighlightTimer(msgId); // Ignite the highlighter loop
    };
    
    utterance.onend = () => {
        if (ttsStatus !== 'PAUSED') stopTTS();
    };
    
    utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') stopTTS();
    };

    window.speechSynthesis.speak(utterance);
};

function updatePlayBtnUI(btn, isPlaying) {
    if (!btn) return;
    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');
    const textSpan = btn.querySelector('.play-text');
    
    // Use only standard Tailwind classes. No arbitrary brackets like [150px].
    const floatClasses = ['fixed', 'scale-110', 'border-2', 'border-orange-500', 'bg-slate-900'];

    if (isPlaying) {
        if (playIcon) playIcon.classList.add('hidden');
        if (pauseIcon) pauseIcon.classList.remove('hidden');
        if (textSpan) textSpan.innerText = "Pause";
        
        // Move button to body to escape CSS containment
        document.body.appendChild(btn);
        
        // 🚀 THE FIX: Use native inline styles to guarantee mobile rendering
        btn.style.bottom = '150px';
        btn.style.right = '20px';
        btn.style.zIndex = '9999';
        btn.style.boxShadow = '0 0 20px rgba(0,0,0,0.8)';
        
        // Apply visual classes
        btn.classList.add('text-orange-400', 'is-floating', ...floatClasses);
        btn.classList.remove('text-sky-400', 'border-slate-600');
        
        // Suppress any competing floating buttons
        document.querySelectorAll('.msg-play-btn.is-floating').forEach(el => {
            if (el !== btn) {
                el.classList.remove('is-floating', ...floatClasses, 'text-orange-400', 'text-green-400');
                el.classList.add('text-sky-400', 'border-slate-600');
                
                // Clear inline styles from suppressed buttons
                el.style.bottom = '';
                el.style.right = '';
                el.style.zIndex = '';
                el.style.boxShadow = '';
                
                const tSpan = el.querySelector('.play-text');
                if (tSpan) tSpan.innerText = "Play";
                
                // Return suppressed buttons to their original container
                const elMsgId = el.id.replace('play-btn-', '');
                const siblingCopy = document.getElementById(`copy-btn-${elMsgId}`);
                if (siblingCopy && siblingCopy.parentElement) {
                    siblingCopy.parentElement.appendChild(el);
                } else {
                    el.remove();
                }
            }
        });
    } else {
        // WHEN PAUSED: Change text/icons, but EXPLICITLY KEEP the floating classes and inline styles active
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        if (textSpan) textSpan.innerText = "Resume";
        
        btn.classList.add('text-green-400', 'border-green-500'); 
        btn.classList.remove('text-orange-400', 'border-orange-500');
    }
}

function stopTTS() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    ttsStatus = 'STOPPED';
    
    if (highlightTimer) clearTimeout(highlightTimer);
    clearTTSHighlight();
    
    if (currentActiveBtn) {
        // Standard classes to remove
        const floatClasses = ['fixed', 'scale-110', 'border-2', 'border-orange-500', 'border-green-500', 'bg-slate-900'];
        
        currentActiveBtn.classList.remove('is-floating', ...floatClasses, 'text-orange-400', 'text-green-400');
        currentActiveBtn.classList.add('text-sky-400', 'border-slate-600');
        
        // 🚀 THE FIX: Clear the native inline styles so the button resets perfectly
        currentActiveBtn.style.bottom = '';
        currentActiveBtn.style.right = '';
        currentActiveBtn.style.zIndex = '';
        currentActiveBtn.style.boxShadow = '';
        
        const playIcon = currentActiveBtn.querySelector('.play-icon');
        const pauseIcon = currentActiveBtn.querySelector('.pause-icon');
        const textSpan = currentActiveBtn.querySelector('.play-text');
        
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
        if (textSpan) textSpan.innerText = "Play";
        
        // Put the button back into its original chat box location
        if (currentMsgId) {
            const siblingCopy = document.getElementById(`copy-btn-${currentMsgId}`);
            if (siblingCopy && siblingCopy.parentElement) {
                siblingCopy.parentElement.appendChild(currentActiveBtn);
            } else {
                currentActiveBtn.remove();
            }
        }
        
        currentActiveBtn = null;
    }
    currentMsgId = null;
}

function cleanTextForSpeech(md) {
    return md.replace(/[*#_`>]/g, '').replace(/\[.*?\]/g, '').trim();
}

function updateScoreUI() {
    UI.scoreCounter.textContent = `Score: ${userScore}`;
}

// --- ACTIVE TIMER LOGIC ---
function updateTimerDisplay() {
    const minutes = Math.floor(activeExamSeconds / 60).toString().padStart(2, '0');
    const seconds = (activeExamSeconds % 60).toString().padStart(2, '0');
    UI.examTimer.textContent = `${minutes}:${seconds}`;
}

function startExamTimer() {
    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = setInterval(() => {
        activeExamSeconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopExamTimer() {
    if (examTimerInterval) clearInterval(examTimerInterval);
    examTimerInterval = null;
}

function resetExamTimer() {
    stopExamTimer();
    activeExamSeconds = 0;
    updateTimerDisplay();
}

// --- TOOLS: ACTION BAR, PDF & COPY ---
function generateActionBar(msgId) {
    return `
    <div class="msg-action-bar mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap justify-end gap-2">
        <button class="msg-pdf-btn p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-slate-400 hover:text-rose-400 transition-colors shadow-sm focus:outline-none" onclick="window.downloadSinglePDF('${msgId}')" title="Download Answer as PDF">
            <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        </button>
        <button class="msg-copy-btn p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-slate-400 hover:text-green-400 transition-colors shadow-sm focus:outline-none" id="copy-btn-${msgId}" onclick="window.copySingleMessage('${msgId}')" title="Copy Answer">
            <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        </button>
        <button id="play-btn-${msgId}" class="msg-play-btn flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-sky-400 transition-colors shadow-sm focus:outline-none" onclick="window.toggleSingleMessagePlay('${msgId}')" title="Play/Pause Audio">
            <svg class="play-icon w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg class="pause-icon w-4 h-4 hidden pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <span class="play-text text-[10px] font-bold uppercase tracking-wider pointer-events-none">Play</span>
        </button>
    </div>`;
}

window.copySingleMessage = async (msgId) => {
    const text = rawTextMap[msgId] || "";
    try {
        await navigator.clipboard.writeText(text);
        const btnElem = document.getElementById(`copy-btn-${msgId}`);
        const originalHtml = btnElem.innerHTML;
        btnElem.innerHTML = `<span class="text-green-400 font-bold text-[10px] uppercase px-1">Copied</span>`;
        setTimeout(() => { btnElem.innerHTML = originalHtml; }, 1500);
    } catch(e) {}
};

window.downloadSinglePDF = (msgId) => {
    if (typeof html2pdf === 'undefined') return alert("PDF engine loading. Try again.");
    const rawText = rawTextMap[msgId] || "";
    const container = document.createElement('div');
    container.style.padding = '30px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    container.innerHTML = `
        <h3 style="color:#0284c7; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px;">Dhwani AI Teacher - UPSC Evaluation</h3>
        <div style="color:#1e293b; line-height:1.6; font-size:14px;">${marked.parse(rawText)}</div>
    `;

    html2pdf().set({
        margin: 0.5, filename: `UPSC_Note_${new Date().toISOString().slice(0,10)}.pdf`,
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(container).save();
};

window.downloadEntireSessionPDF = () => {
    if (typeof html2pdf === 'undefined') return alert("PDF engine loading. Try again.");
    if (!currentQuestionList[currentQuestionIndex]) return alert("No active session to export.");

    const container = document.createElement('div');
    container.style.padding = '30px';
    container.style.fontFamily = 'Arial, sans-serif';

    const qData = currentQuestionList[currentQuestionIndex];
    const localized = UI.langSelector.value === 'hi' ? qData.hi : qData.en;

    container.innerHTML = `
        <div style="text-align:center; color:#6b7280; font-size:14px; font-weight:bold; letter-spacing:2px; margin-bottom:20px; border-bottom:2px solid #e5e7eb; padding-bottom:15px;">upsc.eprashala.com - AI Session Report</div>
        <h3 style="color:#0284c7; margin-bottom: 10px;">Subject: ${qData.subject}</h3>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:8px; margin-bottom:20px; color:#0f172a;">
            <strong>Question:</strong><br>${localized.question}
        </div>
    `;

    chatHistory.forEach(msg => {
        const isModel = msg.role === 'model';
        const senderName = isModel ? "Dhwani AI Teacher" : (UI.cfgUserName.value || "Aspirant");
        container.innerHTML += `
            <div style="background:${isModel ? '#f0f9ff' : '#ffffff'}; border:1px solid #e2e8f0; padding:15px; border-radius:8px; margin-bottom:15px; color:#0f172a; line-height:1.6;">
                <div style="font-size:10px; font-weight:bold; text-transform:uppercase; color:${isModel ? '#0284c7' : '#64748b'}; margin-bottom:5px;">${senderName}</div>
                ${isModel ? marked.parse(msg.text) : msg.text}
            </div>
        `;
    });

    html2pdf().set({
        margin: 0.5, filename: `UPSC_Session_${new Date().toISOString().slice(0,10)}.pdf`,
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(container).save();
};


// --- EVENT HANDLERS ---
function setupEventListeners() {
    UI.btnExportPdf.onclick = window.downloadEntireSessionPDF;
// Aggressively trigger fullscreen by listening to the entire overlay
    UI.overlay.addEventListener('click', () => {
        enforceFullscreen();
        requestWakeLock();
        UI.overlay.style.display = 'none';
        
        // Prime audio for mobile web securely
        if ('speechSynthesis' in window) {
            const silent = new SpeechSynthesisUtterance('');
            silent.volume = 0;
            window.speechSynthesis.speak(silent);
        }
    });

    UI.langSelector.onchange = () => {
        savePreferences();
        populateYearDropdown();
        UI.lblRandom.textContent = UI.langSelector.value === 'hi' ? 'अनियमित क्रम' : 'Random Order';
		UI.lblUnderstandingPrompt.textContent = UI.langSelector.value === 'hi' 
        ? 'कोई संदेह है? ध्वनि एआई से पूछें' 
        : 'Have a Doubt? Ask Dhwani AI Teacher';
        UI.btnNextQuestion.textContent = UI.langSelector.value === 'hi' 
            ? 'अगले प्रश्न पर चलें →' 
            : 'Proceed to Next Question →';
    };
	
	// Hook up the new Dynamic Start Exam Button
    UI.btnStartExam.onclick = async () => {
        const originalText = UI.btnStartExam.innerHTML;
        UI.btnStartExam.innerHTML = "LOADING...";
        UI.btnStartExam.disabled = true;
        
        await loadPaperQuestions(); // Waits for the JSON file to download
        
        UI.btnStartExam.innerHTML = originalText;
        UI.btnStartExam.disabled = false;
    };

    UI.btnNextQuestion.onclick = () => {
        if (currentQuestionIndex < currentQuestionList.length - 1) {
            currentQuestionIndex++;
            renderCurrentQuestion();
        } else {
            // Calculate active time
            const m = Math.floor(activeExamSeconds / 60).toString().padStart(2, '0');
            const s = (activeExamSeconds % 60).toString().padStart(2, '0');
            
            alert(UI.langSelector.value === 'hi' 
                ? `अभ्यास पूर्ण हुआ!\nआपका कुल स्कोर: ${userScore}\nकुल सक्रिय समय: ${m}:${s}` 
                : `Session Complete!\nYour Total Score: ${userScore}\nTotal Active Time: ${m}:${s}`);
        }
    };

	UI.btnSendDoubt.onclick = () => {
        enforceFullscreen();
        submitUserDoubt();
    };

    UI.btnVoiceMic.onclick = () => {
        if (!recognition) return alert("Speech recognition not supported in this browser.");
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.lang = UI.langSelector.value === 'hi' ? 'hi-IN' : 'en-IN';
            try { recognition.start(); } catch(e){}
        }
    };

    // Settings Modal
    UI.btnSettingsOpen.onclick = () => UI.settingsModal.classList.remove('hidden');
    UI.btnSettingsClose.onclick = () => UI.settingsModal.classList.add('hidden');
    UI.btnSettingsSave.onclick = () => {
        savePreferences();
        UI.settingsModal.classList.add('hidden');
    };
// --- IAS SENIOR MENTOR DOUBT LOGIC (UPDATED) ---
    UI.btnAskDhwaniIas.onclick = async () => {
        // Prevent spam clicking and show loading state
        const originalText = UI.lblUnderstandingPrompt.textContent;
        UI.lblUnderstandingPrompt.textContent = UI.langSelector.value === 'hi' ? 'विश्लेषण तैयार हो रहा है...' : 'IAS Mentor is thinking...';
        UI.btnAskDhwaniIas.disabled = true;

        const currentLang = UI.langSelector.value;
        const qData = currentQuestionList[currentQuestionIndex];
        const candidateName = localStorage.getItem('upsc_user_name') || "Aspirant";
        
        // Push a simulated user message to the UI
        const userPrompt = currentLang === 'hi' ? 'कृपया मुझे इस विषय पर गहराई से प्रशासनिक दृष्टिकोण से समझाएं।' : 'Please explain this topic deeply to me from an administrative perspective.';
        appendChatMessage('user', userPrompt);

        // The Deep IAS Persona Prompt
        const systemPrompt = `You are Dhwani AI, acting as a highly experienced, authoritative Senior IAS Officer mentoring an aspirant (${candidateName}) for the UPSC Civil Services.
        The candidate needs a deep conceptual breakdown regarding this topic: ${qData.subject}.
        Question context: ${currentLang === 'hi' ? qData.hi.question : qData.en.question}

        CRITICAL INSTRUCTIONS:
        1. Language: ${currentLang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}.
        2. Persona: Speak like a top bureaucrat. Be highly analytical, structured, and insightful. Share a brief "bureaucratic/administrative perspective" on why UPSC asks this.
        3. Formatting for Voice: Write naturally. Use short, impactful sentences. DO NOT use complex markdown tables or deep nested bullet lists because this will be read aloud.`;

        // SAFELY format history: Gemini STRICTLY requires the first message in the array to be from a 'user'.
        let formattedHistory = [];
        if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
            formattedHistory.push({ role: 'user', text: "Here is my previous test evaluation." });
        }
        
        // Map existing history and attach the new user doubt
        formattedHistory = formattedHistory.concat(chatHistory.map(m => ({ text: m.text, role: m.role })));
        formattedHistory.push({ role: 'user', text: userPrompt });

        try {
            // Trigger the AI request with the full, safe history context
            const aiResponse = await queryGeminiDirectOrProxy(formattedHistory, systemPrompt);
            
            // Append to internal history
            chatHistory.push({ role: 'user', text: userPrompt });
            chatHistory.push({ role: 'model', text: aiResponse });
			saveSessionToDB();
            
            // Render on screen
            appendChatMessage('model', aiResponse);
         
            
        } catch (e) {
            console.error("Dhwani IAS API Error Details:", e); // Logs the exact error to your browser console
            appendChatMessage('system', "⚠️ Network interrupted or API Rate Limit reached. Please check the browser console for details.");
        } finally {
            // Restore button state
            UI.lblUnderstandingPrompt.textContent = originalText;
            UI.btnAskDhwaniIas.disabled = false;
        }
		
    };

	// Toggle Views inside Settings
    UI.btnViewHistory.onclick = (e) => {
        e.stopPropagation();
        UI.mainView.classList.add('hidden');
        UI.historyView.classList.remove('hidden');
        UI.historyView.classList.add('flex');
        renderHistoryList();
    };

    UI.btnHistoryBack.onclick = (e) => {
        e.stopPropagation();
        UI.historyView.classList.add('hidden');
        UI.historyView.classList.remove('flex');
        UI.mainView.classList.remove('hidden');
    };

	// --- CAMERA & CROPPER LOGIC ---
    UI.btnCamera.addEventListener('click', (e) => {
        e.stopPropagation(); enforceFullscreen(); UI.cameraInput.click(); 
    });

    UI.cameraInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            UI.cropImage.src = e.target.result;
            UI.cropModal.classList.remove('hidden');
            if (cropper) cropper.destroy();
            cropper = new Cropper(UI.cropImage, {
                viewMode: 2, dragMode: 'move', autoCropArea: 0.9,
                restore: false, guides: true, center: true, highlight: false,
                cropBoxMovable: true, cropBoxResizable: true, toggleDragModeOnDblclick: false,
            });
        };
    });

    UI.btnCropRetake.addEventListener('click', (e) => {
        e.stopPropagation(); enforceFullscreen();
        if (cropper) cropper.destroy();
        UI.cropModal.classList.add('hidden');
        UI.cameraInput.value = ''; UI.cameraInput.click();
    });

    UI.btnCropDone.addEventListener('click', (e) => {
        e.stopPropagation(); enforceFullscreen();
        if (!cropper) return;
        // Extract high-quality JPEG and strip the prefix for Google API formatting
        const canvas = cropper.getCroppedCanvas({ maxWidth: 800, maxHeight: 1200, fillColor: '#fff' });
        pendingImageData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        
        cropper.destroy(); cropper = null;
        UI.cropModal.classList.add('hidden');
        
        // Update UI to show successful attachment
        UI.userDoubtInput.placeholder = "📷 Image attached! Add text or send...";
        UI.btnCamera.classList.remove('text-slate-400');
        UI.btnCamera.classList.add('text-orange-400');
    });

}
// --- APP UPDATE SYNC LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const btnUpdateApp = document.getElementById('btn-update-app');

    if (btnUpdateApp) {
        btnUpdateApp.addEventListener('click', async () => {
            const originalText = btnUpdateApp.innerHTML;
            btnUpdateApp.innerHTML = `
                <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> Fetching Latest Data...`;
            btnUpdateApp.disabled = true;

            try {
                let syncSuccessful = false;

                // 1. Send direct SYNC_NOW message to active Service Worker
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    const messageChannel = new MessageChannel();
                    
                    const messagePromise = new Promise((resolve) => {
                        // 8-second safety timeout for slower mobile networks
                        const timeout = setTimeout(() => resolve(false), 8000);

                        messageChannel.port1.onmessage = (event) => {
                            clearTimeout(timeout);
                            if (event.data && event.data.status === 'SUCCESS') {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        };
                    });

                    navigator.serviceWorker.controller.postMessage(
                        { action: 'SYNC_NOW' },
                        [messageChannel.port2]
                    );

                    syncSuccessful = await messagePromise;
                }

                // 2. Fallback execution: Purge caches directly if SW isn't controlling page yet
                if (!syncSuccessful) {
                    console.warn('Executing direct purge fallback...');
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(key => caches.delete(key)));
                    }
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let reg of registrations) {
                            await reg.unregister();
                        }
                    }
                }

                // 3. Force hard reload with timestamp query to ensure full fresh render
                window.location.href = window.location.pathname + '?reload=' + Date.now();

            } catch (error) {
                console.error('Update App Error:', error);
                alert('Could not complete update. Please check your internet connection.');
                btnUpdateApp.innerHTML = originalText;
                btnUpdateApp.disabled = false;
            }
        });
    }
});

