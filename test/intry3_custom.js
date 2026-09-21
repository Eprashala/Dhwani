// --- CENTRAL CONFIGURATION ---
const PROXY_URL = "https://eprashala.pythonanywhere.com";

let currentBookData = null; // Holds the chunks of the active book
let activeSpeechLanguage = "mr-IN";
let recognition = null;
let isListening = false;
let isSpeaking = false;

// DOM Elements
const UI = {
    dropdown: document.getElementById('server-books-dropdown'),
    log: document.getElementById('conversation-log'),
    textIn: document.getElementById('text-input'),
    btnSend: document.getElementById('btn-send'),
    btnMic: document.getElementById('btn-mic'),
    btnStop: document.getElementById('btn-stop'),
    welcome: document.getElementById('welcome-msg'),

    // Modal Elements
    uploadModal: document.getElementById('uploadModal'),
    btnOpenModal: document.getElementById('btn-open-upload-modal'),
    btnCloseModal: document.getElementById('btn-close-upload-modal'),
    formUpload: document.getElementById('uploadBookForm'),
    btnSubmitUpload: document.getElementById('btn-submit-upload'),
    uploadBtnText: document.getElementById('upload-btn-text'),
    uploadSpinner: document.getElementById('upload-spinner')
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
    setupModalListeners();
    initSpeechRecognition();
    setupChatListeners();
    await loadServerLibrary();
});

// --- MODAL DIALOG CONTROLLER ---
function setupModalListeners() {
    UI.btnOpenModal.onclick = () => UI.uploadModal.classList.remove('hidden');
    UI.btnCloseModal.onclick = () => UI.uploadModal.classList.add('hidden');

    UI.formUpload.onsubmit = async (e) => {
        e.preventDefault();

        const title = document.getElementById('form-book-title').value.trim();
        const author = document.getElementById('form-book-author').value.trim();
        const edition = document.getElementById('form-book-edition').value.trim();
        const language = document.getElementById('form-book-lang').value;
        const fileInput = document.getElementById('form-book-file');

        if (!fileInput.files || fileInput.files.length === 0) {
            alert("Please select a PDF file.");
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('author', author);
        formData.append('edition', edition);
        formData.append('language', language);
        formData.append('pdf_file', fileInput.files[0]);

        // UI Loading State
        UI.btnSubmitUpload.disabled = true;
        UI.uploadBtnText.innerText = "Extracting Chunks on Server...";
        UI.uploadSpinner.classList.remove('hidden');

        try {
            const res = await fetch(`${PROXY_URL}/api/upload_book`, {
                method: 'POST',
                body: formData
            });

            const result = await res.json();
            if (!res.ok || result.status === 'error') {
                throw new Error(result.message || 'Server upload failed');
            }

            alert(`Success! "${title}" was parsed into ${result.total_chunks} chunks.`);
            UI.uploadModal.classList.add('hidden');
            UI.formUpload.reset();

            // Refresh library and auto-select this book
            await loadServerLibrary(result.book_id);

        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            UI.btnSubmitUpload.disabled = false;
            UI.uploadBtnText.innerText = "Extract & Index on Server";
            UI.uploadSpinner.classList.add('hidden');
        }
    };
}

// --- LOAD BOOKS FROM SERVER ---
async function loadServerLibrary(autoSelectId = null) {
    try {
        const res = await fetch(`${PROXY_URL}/api/custom_library`);
        if (!res.ok) throw new Error("Could not fetch library catalog");
        const catalog = await res.json();

        UI.dropdown.innerHTML = '';

        const keys = Object.keys(catalog);
        if (keys.length === 0) {
            UI.dropdown.innerHTML = '<option value="">No books uploaded yet. Click "Upload New Book" above.</option>';
            return;
        }

        keys.forEach(id => {
            const b = catalog[id];
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = `${b.title} (${b.author}) -${b.total_chunks} chunks`;
            UI.dropdown.appendChild(opt);
        });

        const targetId = autoSelectId || keys[0];
        UI.dropdown.value = targetId;
        await selectBook(targetId);

        UI.dropdown.onchange = (e) => selectBook(e.target.value);

    } catch (err) {
        console.error(err);
        UI.dropdown.innerHTML = '<option value="">Error connecting to server</option>';
    }
}

// --- FETCH & CACHE BOOK CHUNKS ---
async function selectBook(bookId) {
    if (!bookId) return;
    try {
        UI.dropdown.disabled = true;
        const res = await fetch(`${PROXY_URL}/api/custom_book/${bookId}`);
        if (!res.ok) throw new Error("Failed to load book data");

        currentBookData = await res.json();
        activeSpeechLanguage = currentBookData.language || "mr-IN";

        UI.log.innerHTML = '';
        renderMessage("Dhwani", `Hello! I am ready to teach **${currentBookData.title}** by ${currentBookData.author}. Ask me any question from this textbook.`, true);

    } catch (err) {
        alert("Failed to load selected book: " + err.message);
    } finally {
        UI.dropdown.disabled = false;
    }
}

// --- RETRIEVAL-AUGMENTED GENERATION (RAG) RETRIEVER ---
function retrieveTopChunks(query, maxChunks = 4) {
    if (!currentBookData || !currentBookData.chunks) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) return currentBookData.chunks.slice(0, maxChunks);

    const scored = currentBookData.chunks.map(chunk => {
        let score = 0;
        const lowerText = chunk.text.toLowerCase();
        terms.forEach(term => {
            const count = (lowerText.match(new RegExp(term, 'g')) || []).length;
            score += count * 2;
        });
        return { ...chunk, score };
    });

    return scored
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxChunks);
}

// --- USER INPUT & AI QUERY ---
async function handleUserQuery(question) {
    question = question.trim();
    if (!question || !currentBookData) return;

    UI.textIn.value = '';
    renderMessage("Student", question, false);

    const relevantChunks = retrieveTopChunks(question, 4);
    let contextText = "";

    if (relevantChunks.length > 0) {
        contextText = relevantChunks.map(c => `[Page ${c.page}]:\n${c.text}`).join("\n\n---\n\n");
    } else {
        contextText = "[NO RELEVANT TEXTBOOK EXCERPT FOUND]";
    }

    // Strict Grounding System Prompt
    const systemPrompt = `You are Dhwani AI Teacher, teaching strictly from the textbook: "${currentBookData.title}".
    
TEXTBOOK EXCERPTS:
===============================
${contextText}
===============================

STRICT RULES:
1. Grounding: Answer ONLY using the facts from the textbook excerpts provided above.
2. If the answer is NOT mentioned in the text, politely respond: "हे तुमच्या पुस्तकात उपलब्ध नाही. कृपया पुस्तकाशी संबंधित प्रश्न विचारा." (Deliver in ${activeSpeechLanguage}).
3. Language: Speak strictly in ${activeSpeechLanguage}.
4. Output Format: Speak directly and naturally. Do NOT include markdown tables, equations in LaTeX codeblocks, or asterisks that disrupt text-to-speech engines.`;

    const payload = {
        contents: [{ role: 'user', parts: [{ text: question }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        model: "gemini-2.5-flash"
    };

    UI.btnMic.classList.add('mic-thinking');

    try {
        const res = await fetch(`${PROXY_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        const answer = data.candidates[0].content.parts[0].text;

        renderMessage("Dhwani Teacher", answer, true);
        speakSentenceBySentence(answer, activeSpeechLanguage);

    } catch (err) {
        renderMessage("System", "Error receiving answer from server. Please try again.", true);
    } finally {
        UI.btnMic.classList.remove('mic-thinking');
    }
}

// --- OFFLINE SPEECH ENGINE ---
function speakSentenceBySentence(fullText, lang) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip markdown formatting characters so TTS pronounces cleanly
    const cleanText = fullText.replace(/[*#_`]/g, '').trim();
    const sentences = cleanText.match(/[^.?!।\n]+[.?!।\n]*/g) || [cleanText];

    sentences.forEach(sentence => {
        if (!sentence.trim()) return;
        const utterance = new SpeechSynthesisUtterance(sentence.trim());
        utterance.lang = lang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
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
        UI.btnMic.classList.add('mic-pulse');
    };

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        handleUserQuery(text);
    };

    recognition.onend = () => {
        isListening = false;
        UI.btnMic.classList.remove('mic-pulse');
    };

    recognition.onerror = () => {
        isListening = false;
        UI.btnMic.classList.remove('mic-pulse');
    };
}

function setupChatListeners() {
    UI.btnSend.onclick = () => handleUserQuery(UI.textIn.value);
    UI.textIn.onkeypress = (e) => { if (e.key === 'Enter') handleUserQuery(UI.textIn.value); };

    UI.btnMic.onclick = () => {
        if (!recognition) return alert("Speech recognition is not supported in this browser.");
        if (isListening) {
            recognition.stop();
        } else {
            window.speechSynthesis.cancel();
            recognition.lang = activeSpeechLanguage;
            recognition.start();
        }
    };

    UI.btnStop.onclick = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (recognition && isListening) recognition.stop();
        UI.btnMic.classList.remove('mic-thinking');
    };
}

function renderMessage(sender, text, isModel) {
    if (UI.welcome) UI.welcome.style.display = 'none';
    const div = document.createElement('div');
    div.className = `p-4 rounded-2xl ${isModel ? 'bg-[#0f172a]/95 border border-slate-700/50 shadow-lg ml-2 mr-8' : 'bg-cyan-900/50 text-right mr-2 ml-8'} mb-4`;
    div.innerHTML = `
        <div class="text-[10px] uppercase font-bold tracking-wider ${isModel ? 'text-cyan-400' : 'text-slate-300'} mb-1">${sender}</div>
        <div class="text-sm leading-relaxed text-gray-100 markdown-body">${marked.parse(text)}</div>
    `;
    UI.log.appendChild(div);
    UI.log.scrollTop = UI.log.scrollHeight;
}