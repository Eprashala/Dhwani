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
analyzeBtn.addEventListener('click', async () => {
    const activeKey = localStorage.getItem('user_api_key');
    if (!activeKey) {
        alert("Please configure your Gemini API Key in Settings first.");
        toggleModal(true);
        return;
    }

    analyzeBtn.style.display = 'none';
    document.getElementById('loader').style.display = 'block';
    document.getElementById('statusText').style.display = 'block';
    audioBtn.style.display = 'none';
    sharePdfBtn.style.display = 'none';

    const context = document.getElementById('analysisContext').value;
    const targetLang = document.getElementById('userLang').value;
    const timecodes = clippings.map(c => `[${formatTime(c.in)} to ${formatTime(c.out)}]`).join(", ");

const systemPrompt = `You are an elite Voice Forensics Analyst, an expert Recruiter, and a master of Vedic Swara Shastra.
    
    Context of Recording: ${context}
    Target Time Segments to Analyze: ${timecodes}
    
    Listen ONLY to the segments indicated. Perform a deeply analytical multi-speaker diarization and forensic assessment.
    
    CRITICAL INSTRUCTION FOR OUTPUT:
    You must group ALL analysis for a specific speaker under their own distinct dossier. 
    Whenever you identify a speaker, you MUST format their header exactly like this: 
    <h2 class="speaker-header"><span class="editable-speaker" data-speaker-id="speaker_1" contenteditable="true">Speaker 1</span></h2>
    (Increment to speaker_2, speaker_3, etc. Use the exact same data-speaker-id if referring to them again).

    Structure your report in cleanly formatted HTML using the following template:

    <h3>Global Analysis: Conversation Dynamics</h3>
    <p>Analyze the dominance, submission, and power dynamics between the speakers based on interruptions, pacing, and volume.</p>

    <!-- REPEAT THE BELOW <div class="speaker-section"> FOR EACH IDENTIFIED SPEAKER -->
    <div class="speaker-section">
        <h2 class="speaker-header"><span class="editable-speaker" data-speaker-id="speaker_X" contenteditable="true">Speaker X</span></h2>
        
        <h3>1. Deep Acoustic Profiling</h3>
        <ul>
            <li><strong>Emotions and Intent:</strong> Analyze vocal tone and pacing to gauge feelings like joy, fear, anxiety, or anger. Identify hidden stress or urgency.</li>
            <li><strong>Physical Traits Estimation:</strong> Based on pitch and resonance, estimate approximate age, biological sex, and height. Note if deeper vocal resonance implies larger body size/dominance.</li>
            <li><strong>Social and Background Clues:</strong> Identify accents (regional origins) and pacing/volume (extroversion vs introversion).</li>
            <li><strong>Health and Energy Baseline:</strong> Listen for signs of fatigue, illness, or nervous system regulation.</li>
            <li><strong>Vedic Swara Alignment:</strong> Identify their dominant Nadi (energy channel) based on breath control.</li>
        </ul>

        <h3>2. The Quantitative Psychological Matrix</h3>
        <p>Provide an exact percentage score (0-100%) for these traits based purely on vocal frequency and micro-tremors:</p>
        <ul>
            <li><strong>Anger:</strong> %</li>
            <li><strong>Fear:</strong> %</li>
            <li><strong>Happiness:</strong> %</li>
            <li><strong>Distress:</strong> %</li>
            <li><strong>Hidden Stress:</strong> %</li>
            <li><strong>Humiliation:</strong> %</li>
            <li><strong>Agony:</strong> %</li>
            <li><strong>Frustration:</strong> %</li>
            <li><strong>Pursuance/Drive:</strong> %</li>
            <li><strong>Truthfulness/Honesty:</strong> %</li>
            <li><strong>Authentic Confidence:</strong> %</li>
        </ul>
    </div>
    <!-- END REPEAT -->
       
    Write your ENTIRE response exclusively in the ${targetLang} language. Deliver the response using cleanly structured HTML. Do NOT wrap your output in markdown backticks (\`\`\`html).`;	const payload = {
        contents: [{ parts: [ { text: systemPrompt }, { inlineData: { mimeType: mimeType, data: base64Audio } } ] }]
    };

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;

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
            throw new Error("Invalid payload format received from the API.");
        }

    } catch (err) {
        alert("Processing Error: " + err.message);
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
        
        // Find all other instances of this exact speaker ID in the report
        const identicalSpeakers = document.querySelectorAll(`.editable-speaker[data-speaker-id="${speakerId}"]`);
        
        identicalSpeakers.forEach(el => {
            // Update the others, but skip the one currently being typed in to prevent cursor jumping
            if (el !== e.target && el.innerText !== newName) {
                el.innerText = newName;
            }
        });
    }
});
audioBtn.addEventListener('click', toggleSpeech);

sharePdfBtn.addEventListener('click', () => { window.print(); });

