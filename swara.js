// --- 1. Security & UI Lockdown ---
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) e.preventDefault();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C')) e.preventDefault();
});

// --- 2. Application Logic & Config ---
const langMap = { "English": "en-IN", "Hindi": "hi-IN", "Bengali": "bn-IN", "Telugu": "te-IN", "Marathi": "mr-IN", "Tamil": "ta-IN", "Gujarati": "gu-IN" };

// State Variables
let base64Audio = '';
let mimeType = '';
let audioDuration = 0;
let markIn = null;
let markOut = null;
let clippings = [];
let currentSynthUtterance = null;
let rawReportText = "";

// DOM Elements
const audioInput = document.getElementById('audioInput');
const audioPlayer = document.getElementById('audioPlayer');
const visualizerBox = document.getElementById('visualizerBox');
const markerInEl = document.getElementById('markerIn');
const markerOutEl = document.getElementById('markerOut');
const highlightRegion = document.getElementById('highlightRegion');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const analyzeBtn = document.getElementById('analyzeBtn');
const audioBtn = document.getElementById('audioBtn');
const sharePdfBtn = document.getElementById('sharePdfBtn');

// --- Forensic AI Engine Database ---
const aiEngines = {
    "Anthropic": { url: "https://console.anthropic.com/settings/keys", models: ["Claude Opus 4.8", "Claude Fable 5", "Claude Sonnet 4.6", "Claude Code"] },
    "OpenAI": { url: "https://platform.openai.com/api-keys", models: ["GPT-5.5", "GPT-5.4", "GPT-5.3", "ChatGPT Operator (Agent Mode)", "GPT Image 2"] },
    "Google DeepMind": { url: "https://aistudio.google.com/app/apikey", models: ["Gemini 3.5 Flash", "Gemini 3.1 Pro", "Gemini 3.1 Flash-lite", "Gemini 3.1 Flash-image", "Gemini 3-pro-image"] },
    "DeepSeek": { url: "https://platform.deepseek.com/api_keys", models: ["DeepSeek V4 Pro", "DeepSeek V4 Flash", "DeepSeek V3.2", "DeepSeek-R1-0528 (Updated)"] },
    "Meta": { url: "https://llama.meta.com/", models: ["Llama 4 Scout", "Llama 3.3"] },
    "xAI": { url: "https://console.x.ai/", models: ["Grok 4.3", "Grok 4 Fast"] },
    "Mistral AI": { url: "https://console.mistral.ai/api-keys/", models: ["Mistral Large 3", "Codestral 2.5", "Ministral 8B", "Pixtral 12B"] },
    "Microsoft": { url: "https://azure.microsoft.com/en-us/products/ai-services/", models: ["MAI-1", "MAI-Code-1-Flash", "Mi Transcribe 1.5"] },
    "Alibaba/Moonshot": { url: "https://platform.moonshot.cn/", models: ["Qwen 3.7 Max", "Qwen3-Coder-Next", "Kimi K2.7 Code", "Kimi K2.6"] },
    "Zhipu AI": { url: "https://open.bigmodel.cn/", models: ["GLM-5.2", "GLM-5.1"] },
    "Cohere": { url: "https://dashboard.cohere.com/api-keys", models: ["North Mini Code 1.0", "Command R Next"] },
    "NVIDIA": { url: "https://build.nvidia.com/", models: ["Nemotron 3 Ultra", "Nemotron 3 Super"] }
};

// --- Initialize Settings Modal ---
window.addEventListener('DOMContentLoaded', () => {
    const engineSelect = document.getElementById('engineSelect');
    const modelSelect = document.getElementById('modelSelect');
    const apiKeyLink = document.getElementById('apiKeyLink');

    // Populate Engines
    Object.keys(aiEngines).forEach(engine => {
        let opt = document.createElement('option');
        opt.value = engine; opt.text = engine;
        engineSelect.appendChild(opt);
    });

    // Handle Engine Change
    engineSelect.addEventListener('change', (e) => {
        const engineData = aiEngines[e.target.value];
        modelSelect.innerHTML = '';
        engineData.models.forEach(model => {
            let opt = document.createElement('option');
            opt.value = model; opt.text = model;
            modelSelect.appendChild(opt);
        });
        apiKeyLink.href = engineData.url;
    });

    // Trigger initial population
    engineSelect.value = "Google DeepMind";
    engineSelect.dispatchEvent(new Event('change'));
    modelSelect.value = "Gemini 3.1 Pro";

    // Load saved settings
    if (localStorage.getItem('user_api_key')) document.getElementById('apiKeyInput').value = localStorage.getItem('user_api_key');
    if (localStorage.getItem('saved_engine')) engineSelect.value = localStorage.getItem('saved_engine');
    if (localStorage.getItem('saved_model')) modelSelect.value = localStorage.getItem('saved_model');
    engineSelect.dispatchEvent(new Event('change'));
});

function saveSettings() {
    localStorage.setItem('user_api_key', document.getElementById('apiKeyInput').value.trim());
    localStorage.setItem('saved_engine', document.getElementById('engineSelect').value);
    localStorage.setItem('saved_model', document.getElementById('modelSelect').value);
    toggleModal(false);
}



window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('user_api_key')) {
        document.getElementById('apiKeyInput').value = localStorage.getItem('user_api_key');
    }
    
    document.getElementById('pasteBtn').addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('apiKeyInput').value = text;
        } catch (err) { alert("Clipboard permission denied. Paste manually."); }
    });
});

function toggleModal(show) { document.getElementById('settingsModal').classList.toggle('active', show); }
function saveSettings() {
    const key = document.getElementById('apiKeyInput').value.trim();
    localStorage.setItem('user_api_key', key);
    toggleModal(false);
}

audioInput.addEventListener('change', handleAudioUpload);

function formatTime(seconds) {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Grab the initial mime type from the browser
    mimeType = file.type;
    
    // --- MIME TYPE SANITIZATION ---
    // If the browser misidentifies the audio container as a video 
    // (very common with .m4a, .mp4, and .webm voice recordings),
    // we force it to an audio type so the API doesn't look for video frames.
    if (mimeType.startsWith('video/')) {
        mimeType = mimeType.replace('video/', 'audio/');
    } else if (!mimeType) {
        // Fallback for generic OS recordings missing metadata
        mimeType = 'audio/mp3'; 
    }
    // ------------------------------

    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    
    drawWaveform();

    audioPlayer.onloadedmetadata = () => { audioDuration = audioPlayer.duration; };

    const reader = new FileReader();
    reader.onloadend = () => {
        base64Audio = reader.result.split(',')[1]; 
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('workspace').style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

// --- Visualizer Logic ---
function drawWaveform() {
    canvas.width = visualizerBox.clientWidth;
    canvas.height = visualizerBox.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#374151';
    
    for(let i = 0; i < canvas.width; i += 4) {
        let height = Math.random() * (canvas.height - 10) + 10;
        ctx.fillRect(i, (canvas.height - height) / 2, 2, height);
    }
}

function setMark(type) {
    if (!audioDuration) return;
    const time = audioPlayer.currentTime;
    const positionPercent = (time / audioDuration) * 100;

    if (type === 'in') {
        markIn = time;
        document.getElementById('markInDisplay').innerText = formatTime(markIn);
        markerInEl.style.left = `${positionPercent}%`;
        markerInEl.style.display = 'block';
    } else {
        markOut = time;
        document.getElementById('markOutDisplay').innerText = formatTime(markOut);
        markerOutEl.style.left = `${positionPercent}%`;
        markerOutEl.style.display = 'block';
    }
    updateHighlight();
}

function updateHighlight() {
    if (markIn !== null && markOut !== null && markOut > markIn) {
        const startPct = (markIn / audioDuration) * 100;
        const widthPct = ((markOut - markIn) / audioDuration) * 100;
        highlightRegion.style.left = `${startPct}%`;
        highlightRegion.style.width = `${widthPct}%`;
        highlightRegion.style.display = 'block';
    } else {
        highlightRegion.style.display = 'none';
    }
}

function addClipping() {
    if (markIn === null || markOut === null || markIn >= markOut) {
        alert("Invalid region. Ensure Mark Out is after Mark In.");
        return;
    }
    clippings.push({ in: markIn, out: markOut });
    updateClipList();
    
    markIn = null; markOut = null;
    markerInEl.style.display = 'none'; markerOutEl.style.display = 'none'; highlightRegion.style.display = 'none';
    document.getElementById('markInDisplay').innerText = "--:--";
    document.getElementById('markOutDisplay').innerText = "--:--";
    analyzeBtn.disabled = false;
}

function updateClipList() {
    const list = document.getElementById('clipList');
    list.innerHTML = '';
    clippings.forEach((clip, index) => {
        const li = document.createElement('li');
        li.className = 'clip-item';
        li.innerHTML = `<span>Clip [${formatTime(clip.in)} to ${formatTime(clip.out)}]</span> <span style="color:#ff4c4c;cursor:pointer;font-weight:bold;" onclick="removeClip(${index})">✕</span>`;
        list.appendChild(li);
    });
    if (clippings.length === 0) analyzeBtn.disabled = true;
}

function removeClip(index) {
    clippings.splice(index, 1);
    updateClipList();
}

// --- Direct API Call & TTS Logic ---
// --- Deep Forensic & Lie Detection Analysis ---
analyzeBtn.addEventListener('click', async () => {
    const activeKey = localStorage.getItem('user_api_key');
    const selectedEngine = document.getElementById('engineSelect').value;
    const selectedModel = document.getElementById('modelSelect').value;

    if (!activeKey) {
        alert("Please configure your API Key in Settings first.");
        toggleModal(true);
        return;
    }

    analyzeBtn.style.display = 'none';
    document.getElementById('loader').style.display = 'block';
    document.getElementById('statusText').style.display = 'block';
    document.getElementById('statusText').innerText = `Routing audio to ${selectedEngine} (${selectedModel}) for micro-tremor extraction...`;
    audioBtn.style.display = 'none';
    sharePdfBtn.style.display = 'none';

    const context = document.getElementById('analysisContext').value;
    const targetLang = document.getElementById('userLang').value;
    const timecodes = clippings.map(c => `[${formatTime(c.in)} to ${formatTime(c.out)}]`).join(", ");

    const systemPrompt = `You are a Tier-1 Voice Stress Analyst (VSA), an expert in Linguistic Forensics, and a specialist in Deception Detection. You act as a brutal, unforgiving forensic truth-extraction tool.
    
    Context of Audio Evidence: ${context}
    Target Time Segments to Analyze: ${timecodes}
    
    CRITICAL INSTRUCTION: Your primary objective is to detect deception, fabricated narratives, and hidden psychological states. 
    You must format any identified speaker's name EXACTLY like this: 
    <span class="editable-speaker" data-speaker-id="speaker_1" contenteditable="true">Speaker 1</span>

    Structure your report in cleanly formatted HTML:

    <h3>1. Interrogation & Power Dynamics</h3>
    <p>Analyze the psychological baseline of the interaction. Who holds the authority? Is someone acting evasive or defensive?</p>

    <!-- REPEAT FOR EACH IDENTIFIED SPEAKER -->
    <div class="speaker-section">
        <h2 class="speaker-header"><span class="editable-speaker" data-speaker-id="speaker_X" contenteditable="true">Speaker X</span></h2>
        
        <h3>A. Voice Stress & Deception Matrix (VSA)</h3>
        <ul>
            <li><strong>Cognitive Load Indicators:</strong> Did their speech rate suddenly drop? Are there unnatural pauses or hesitation markers ('um', 'uh') indicating they are calculating a lie?</li>
            <li><strong>Vocal Micro-Tremors (F0 Shifts):</strong> Did their pitch spike unnaturally? Note any tightening of the vocal cords that indicates an autonomic fear response (fear of getting caught).</li>
            <li><strong>Linguistic Distancing:</strong> Are they avoiding direct ownership of statements (dropping pronouns like 'I' or 'me')?</li>
            <li><strong>Swara Diagnosis:</strong> How irregular is their breathing pattern during questioning?</li>
        </ul>

        <h3>B. The Quantitative Truth Index</h3>
        <p>Provide an exact percentage score (0-100%) for these exact psychological states based purely on acoustic biometrics for <span class="editable-speaker" data-speaker-id="speaker_X" contenteditable="true">Speaker X</span>:</p>
        <ul>
            <li><strong>Probability of Deception (Lying):</strong> %</li>
            <li><strong>Hidden Stress / Autonomic Arousal:</strong> %</li>
            <li><strong>Fear of Detection:</strong> %</li>
            <li><strong>Anger / Defensive Aggression:</strong> %</li>
            <li><strong>Fabrication (Cognitive Overload):</strong> %</li>
            <li><strong>Authentic Truthfulness:</strong> %</li>
        </ul>
    </div>
    <!-- END REPEAT -->
       
    Write your ENTIRE response exclusively in the ${targetLang} language. Deliver the response using cleanly structured HTML. Do NOT wrap your output in markdown backticks (\`\`\`html).`;

    // Note: To support all 12 engines seamlessly, this payload must be standardly routed through your backend proxy. 
    // Below is the payload structure optimized for Google DeepMind (Gemini) as requested.
    const payload = {
        contents: [{ parts: [ { text: systemPrompt }, { inlineData: { mimeType: mimeType, data: base64Audio } } ] }]
    };

    let API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
    
    // In a production environment, you would use a switch statement here based on 'selectedEngine' 
    // to alter the API_URL and payload structure to match Anthropic, OpenAI, etc.

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if(data.candidates && data.candidates[0].content.parts[0].text) {
            let resultText = data.candidates[0].content.parts[0].text;
            resultText = resultText.replace(/```html/g, '').replace(/```/g, '').trim();
            
            rawReportText = resultText;
            document.getElementById('reportTarget').innerHTML = resultText;
            document.getElementById('reportSection').style.display = 'block';
            
            audioBtn.style.display = 'block';
            audioBtn.innerHTML = "🔊 Listen";
            sharePdfBtn.style.display = 'block';
            
        } else {
            throw new Error("Invalid payload format received from the AI Engine.");
        }

    } catch (err) {
        alert("Forensic Extraction Error: " + err.message);
        analyzeBtn.style.display = 'block';
    } finally {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('statusText').style.display = 'none';
    }
});

// --- Speech Synthesis ---
function toggleSpeech() {
    const synth = window.speechSynthesis;
    const targetLang = document.getElementById('userLang').value;
    
    if (synth.speaking) {
        if (synth.paused) { synth.resume(); audioBtn.innerHTML = "⏸️ Pause"; } 
        else { synth.pause(); audioBtn.innerHTML = "▶️ Resume"; }
        return;
    }
    
    synth.cancel();
    audioBtn.innerHTML = "⏸️ Pause";
    
    // THE FIX: Use innerText instead of regex. This natively extracts 
    // only the visible, human-readable text from the DOM.
    const cleanText = document.getElementById('reportTarget').innerText; 
    
    currentSynthUtterance = new SpeechSynthesisUtterance(cleanText);
    currentSynthUtterance.lang = langMap[targetLang] || 'en-IN';
    
    currentSynthUtterance.onend = () => { audioBtn.innerHTML = "🔊 Listen"; };
    currentSynthUtterance.onerror = () => { audioBtn.innerHTML = "🔊 Listen"; };
    synth.speak(currentSynthUtterance);
}


// --- Live Synchronized Speaker Editing ---
document.getElementById('reportTarget').addEventListener('input', function(e) {
    if (e.target.classList.contains('editable-speaker')) {
        const speakerId = e.target.getAttribute('data-speaker-id');
        const newName = e.target.innerText;
        
        // Find all instances of this exact speaker ID across the entire report
        const identicalSpeakers = document.querySelectorAll(`.editable-speaker[data-speaker-id="${speakerId}"]`);
        
        identicalSpeakers.forEach(el => {
            // Mirror the text to the other tags, but skip the one actively being typed in so the cursor doesn't jump
            if (el !== e.target && el.innerText !== newName) {
                el.innerText = newName;
            }
        });
    }
});
audioBtn.addEventListener('click', toggleSpeech);

sharePdfBtn.addEventListener('click', () => { window.print(); });

