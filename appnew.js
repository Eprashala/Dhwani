// --- 1. Security & UI Lockdown ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) e.preventDefault();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'c' || e.key === 'C')) e.preventDefault();
});

// --- 2. Central Routing ---
const PROXY_BASE_URL = "https://eprashala.pythonanywhere.com";
async function fetchGeminiChat(payloadObject) {
    const userKey = localStorage.getItem('user_api_key') || '';
    if (userKey && userKey.trim().length > 10) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${userKey.trim()}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadObject)
            });
            if (!response.ok) throw new Error(`Primary model status: ${response.status}`);
            return response;
        } catch (error) {
            return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userKey.trim()}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadObject)
            });
        }
    } else {
        return await fetch(`${PROXY_BASE_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadObject) });
    }
}

// --- 3. Global State ---
const langMap = { "English": "en-IN", "Hindi": "hi-IN", "Bengali": "bn-IN", "Telugu": "te-IN", "Marathi": "mr-IN", "Tamil": "ta-IN", "Gujarati": "gu-IN", "Kannada": "kn-IN", "Malayalam": "ml-IN", "Odia": "or-IN", "Punjabi": "pa-IN" };
let currentStream = null, activeImage = null, wakeLock = null;
let zoom = 1, rotation = 0, offsetX = 0, offsetY = 0, isDragging = false, startX, startY;
let currentSynthUtterance = null, rawReportText = "", rawQaText = "";
let faceLandmarker = null, faceModelsLoaded = false;
let canvas, ctx, zoomSlider, rotateSlider, guideWidthSlider, faceGuideSvg, viewport, scannerLine, analyzeBtn, audioBtn, qaAudioBtn;
let biometricDataDisplay, biometricMetrics, customQuestionInput, askQuestionBtn, qaLoader, qaTarget;

// --- 4. Initialization ---
function initApp() {
    canvas = document.getElementById('canvas');
    if (canvas) ctx = canvas.getContext('2d');
    viewport = document.getElementById('viewport');
    zoomSlider = document.getElementById('zoomSlider');
    rotateSlider = document.getElementById('rotateSlider');
    guideWidthSlider = document.getElementById('guideWidthSlider');
    faceGuideSvg = document.getElementById('faceGuideSvg');
    scannerLine = document.getElementById('scannerLine');
    analyzeBtn = document.getElementById('analyzeBtn');
    audioBtn = document.getElementById('audioBtn');
    qaAudioBtn = document.getElementById('qaAudioBtn');
    
    biometricDataDisplay = document.getElementById('biometricDataDisplay');
    biometricMetrics = document.getElementById('biometricMetrics');
    customQuestionInput = document.getElementById('customQuestionInput');
    askQuestionBtn = document.getElementById('askQuestionBtn');
    qaLoader = document.getElementById('qaLoader');
    qaTarget = document.getElementById('qaTarget');
    
    setupInteractionListeners();

    const userAgeSelect = document.getElementById('userAge');
    if (userAgeSelect && userAgeSelect.children.length === 0) {
        for (let i = 1; i <= 100; i++) {
            let option = document.createElement('option');
            option.value = i; option.text = i + " years old";
            if (i === 25) option.selected = true;
            userAgeSelect.appendChild(option);
        }
    }
    
    if (localStorage.getItem('user_api_key')) document.getElementById('apiKeyInput').value = localStorage.getItem('user_api_key');

    document.getElementById('initBtn').addEventListener('click', async () => {
        if (!document.getElementById('userName').value || !document.getElementById('userSex').value) return alert("Enter Name and Sex.");
        requestFullScreen(); await requestWakeLock(); 
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('mainWorkspace').style.display = 'flex';
        initCanvasDimensions(); 
        startCamera('user'); // Default to front camera
    });

    if(askQuestionBtn) askQuestionBtn.addEventListener('click', handleCustomQuestion);
    if(customQuestionInput) customQuestionInput.addEventListener('keypress', (e) => { if(e.key==='Enter') handleCustomQuestion(); });
    if(audioBtn) audioBtn.addEventListener('click', toggleSpeech);
    if(qaAudioBtn) qaAudioBtn.addEventListener('click', toggleQaSpeech);
    if(document.getElementById('sharePdfBtn')) document.getElementById('sharePdfBtn').addEventListener('click', () => window.print());

    const pasteBtn = document.getElementById('pasteBtn');
    if (pasteBtn) {
        pasteBtn.addEventListener('click', async () => {
            try { document.getElementById('apiKeyInput').value = await navigator.clipboard.readText(); } 
            catch (err) { alert("Clipboard permission denied or unavailable."); }
        });
    }

    initMediaPipe();
}

async function initMediaPipe() {
    try {
        const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3");
        const { FaceLandmarker, FilesetResolver } = vision;
        const fileset = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate: "GPU" },
            outputFaceBlendshapes: false, runningMode: "IMAGE", numFaces: 1
        });
        faceModelsLoaded = true;
    } catch (err) { console.warn("HUD Matrix Engine failed to load.", err); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();

// --- 5. UI CONTROLS & CAMERA HANDLING ---
async function requestWakeLock() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {} }
function requestFullScreen() { const d = document.documentElement; if (!document.fullscreenElement) { if (d.requestFullscreen) d.requestFullscreen().catch(e=>e); else if (d.webkitRequestFullscreen) d.webkitRequestFullscreen().catch(e=>e); } }
document.addEventListener('visibilitychange', async () => { if (wakeLock !== null && document.visibilityState === 'visible') await requestWakeLock(); });

function initCanvasDimensions() { canvas.width = viewport.clientWidth * window.devicePixelRatio; canvas.height = viewport.clientHeight * window.devicePixelRatio; ctx.scale(window.devicePixelRatio, window.devicePixelRatio); }

// The Restored Camera Function (Front & Rear Support)
async function startCamera(mode) {
    if (currentStream) currentStream.getTracks().forEach(t => t.stop()); activeImage = null; ctx.clearRect(0, 0, canvas.width, canvas.height); 
    document.getElementById('video').style.display = 'block'; 
    if (zoomSlider) zoomSlider.disabled = true; 
    if (rotateSlider) rotateSlider.disabled = true;
    try { 
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1080 }, height: { ideal: 1350 } } }); 
        document.getElementById('video').srcObject = currentStream; 
    } catch (err) { console.warn("Camera init failed:", err.message); }
}

function handleFileUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    if (currentStream) { currentStream.getTracks().forEach(t => t.stop()); document.getElementById('video').srcObject = null; }
    document.getElementById('video').style.display = 'none';
    const reader = new FileReader();
    reader.onload = function(e) {
        activeImage = new Image();
        activeImage.onload = function() {
            zoom = 1; rotation = 0; offsetX = 0; offsetY = 0; 
            if(zoomSlider) { zoomSlider.value = 1; zoomSlider.disabled = false; }
            if(rotateSlider) { rotateSlider.value = 0; rotateSlider.disabled = false; }
            renderCanvasTransformations();
        }; activeImage.src = e.target.result;
    }; reader.readAsDataURL(file); event.target.value = '';
}

function setupInteractionListeners() {
    if(!zoomSlider || !viewport) return;
    zoomSlider.addEventListener('input', (e) => { zoom = parseFloat(e.target.value); renderCanvasTransformations(); });
    if(rotateSlider) rotateSlider.addEventListener('input', (e) => { rotation = parseFloat(e.target.value); renderCanvasTransformations(); });
    if(guideWidthSlider && faceGuideSvg) guideWidthSlider.addEventListener('input', (e) => { faceGuideSvg.style.width = e.target.value + '%'; });
    
    viewport.addEventListener('mousedown', (e) => { if (!activeImage) return; isDragging = true; startX = e.clientX - offsetX; startY = e.clientY - offsetY; });
    window.addEventListener('mousemove', (e) => { if (!isDragging) return; offsetX = e.clientX - startX; offsetY = e.clientY - startY; renderCanvasTransformations(); });
    window.addEventListener('mouseup', () => isDragging = false);
    
    viewport.addEventListener('touchstart', (e) => { if (!activeImage || e.touches.length !== 1) return; isDragging = true; startX = e.touches[0].clientX - offsetX; startY = e.touches[0].clientY - offsetY; });
    viewport.addEventListener('touchmove', (e) => { if (!isDragging || e.touches.length !== 1) return; offsetX = e.touches[0].clientX - startX; offsetY = e.touches[0].clientY - startY; renderCanvasTransformations(); });
    viewport.addEventListener('touchend', () => isDragging = false);
}

function renderCanvasTransformations() {
    if (!activeImage) return;
    const viewW = canvas.width / window.devicePixelRatio, viewH = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, viewW, viewH); ctx.save();
    
    ctx.translate(viewW / 2 + offsetX, viewH / 2 + offsetY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(zoom, zoom);
    
    const imgRatio = activeImage.width / activeImage.height, viewRatio = viewW / viewH;
    let drawW, drawH;
    if (imgRatio > viewRatio) { drawH = viewH; drawW = viewH * imgRatio; } else { drawW = viewW; drawH = viewW / imgRatio; }
    ctx.drawImage(activeImage, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore();
}

function captureFrameData() {
    const targetW = 600, targetH = 750, processCanvas = document.createElement('canvas');
    processCanvas.width = targetW; processCanvas.height = targetH;
    const pCtx = processCanvas.getContext('2d');

    if (activeImage) {
        const viewW = canvas.width / window.devicePixelRatio, exportScale = targetW / viewW;
        pCtx.imageSmoothingEnabled = true; pCtx.imageSmoothingQuality = 'high'; pCtx.save();
        
        pCtx.translate((targetW / 2) + (offsetX * exportScale), (targetH / 2) + (offsetY * exportScale));
        pCtx.rotate(rotation * Math.PI / 180);
        pCtx.scale(zoom * exportScale, zoom * exportScale);
        
        const imgRatio = activeImage.width / activeImage.height, viewRatio = viewW / (canvas.height / window.devicePixelRatio);
        let drawW, drawH;
        if (imgRatio > viewRatio) { drawH = canvas.height / window.devicePixelRatio; drawW = drawH * imgRatio; } else { drawW = viewW; drawH = viewW / imgRatio; }
        pCtx.drawImage(activeImage, -drawW / 2, -drawH / 2, drawW, drawH); pCtx.restore();
    } else if (currentStream && document.getElementById('video').readyState === document.getElementById('video').HAVE_ENOUGH_DATA) {
        const v = document.getElementById('video');
        const targetRatio = targetW / targetH, videoRatio = v.videoWidth / v.videoHeight;
        let sourceX = 0, sourceY = 0, sourceW = v.videoWidth, sourceH = v.videoHeight;
        if (videoRatio > targetRatio) { sourceW = v.videoHeight * targetRatio; sourceX = (v.videoWidth - sourceW) / 2; } 
        else { sourceH = v.videoWidth / targetRatio; sourceY = (v.videoHeight - sourceH) / 2; }
        pCtx.drawImage(v, sourceX, sourceY, sourceW, sourceH, 0, 0, targetW, targetH);
    } else { return null; }
    return processCanvas.toDataURL('image/jpeg', 0.95);
}

// --- 6. Core Scan & HUD Drawing Sequence ---
async function initiateScanSequence() {
    // 1. Capture the pure, unmarked photo for the AI
    const bareBase64Data = captureFrameData();
    if (!bareBase64Data) { alert("Ensure camera is active or an image is uploaded."); return; }

    // 2. Prepare a variable for the marked-up UI image
    let uiDisplayMatrix = bareBase64Data; 

    if (faceModelsLoaded) {
        analyzeBtn.disabled = true; analyzeBtn.innerText = "Extracting Facial Coordinates...";
        const img = new Image(); img.src = bareBase64Data;
        await new Promise(resolve => img.onload = resolve);
        
        const results = faceLandmarker.detect(img);
        
        // If a face is found, draw the HUD on the UI version of the image
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];
            const drawCanvas = document.createElement('canvas'); 
            drawCanvas.width = 600; drawCanvas.height = 750;
            const dCtx = drawCanvas.getContext('2d'); 
            
            // Draw original image
            dCtx.drawImage(img, 0, 0, 600, 750);
            
            // Draw dark tint & glowing mesh
            dCtx.fillStyle = 'rgba(0, 0, 0, 0.4)'; dCtx.fillRect(0, 0, 600, 750);
            dCtx.fillStyle = '#00ffcc'; dCtx.shadowBlur = 6; dCtx.shadowColor = '#00ffcc';
            for (let pt of landmarks) { dCtx.beginPath(); dCtx.arc(pt.x * 600, pt.y * 750, 2.5, 0, 2 * Math.PI); dCtx.fill(); }

            // Draw Samudrika Anchors
            const keyIndices = [10, 9, 2, 152, 33, 133, 362, 263, 6, 1, 129, 358, 0, 17, 234, 454, 162, 389];
            dCtx.shadowBlur = 12; dCtx.shadowColor = '#ff0000'; dCtx.fillStyle = '#ff0000'; dCtx.strokeStyle = '#ffffff'; dCtx.lineWidth = 2.5;
            for (let idx of keyIndices) { const x = landmarks[idx].x * 600, y = landmarks[idx].y * 750; dCtx.beginPath(); dCtx.arc(x, y, 6.5, 0, 2 * Math.PI); dCtx.fill(); dCtx.stroke(); }

            // Save the marked-up image to show the user
            uiDisplayMatrix = drawCanvas.toDataURL('image/jpeg', 0.95);
        }
    }

    // Hide controls during scan
    window.speechSynthesis.cancel(); 
    if(audioBtn) audioBtn.style.display = 'none'; 
    if(document.getElementById('sharePdfBtn')) document.getElementById('sharePdfBtn').style.display = 'none'; 
    
    // Animate Scanner
    analyzeBtn.disabled = true; analyzeBtn.innerText = "Scanning Elements..."; 
    scannerLine.style.display = 'block'; scannerLine.style.animation = 'none';
    void scannerLine.offsetWidth; scannerLine.style.animation = 'scanAnimation 1.2s linear 3';

    setTimeout(() => {
        scannerLine.style.display = 'none'; analyzeBtn.innerText = "Commence Deep Face Scan"; analyzeBtn.disabled = false;
        
        // Show the marked-up matrix image in the UI
        document.getElementById('capturedDisplay').src = uiDisplayMatrix; 
        document.getElementById('capturedDisplay').style.display = 'block';
        
        // Hide the math box as requested (reverting to pure visual AI)
        if(biometricDataDisplay) biometricDataDisplay.style.display = 'none';

        // FIRE AI: Send the BARE, UNMARKED image to the AI for processing
        runVedicAnalysis(bareBase64Data);
    }, 3600);
}

// --- 7. AI Routing & Restored Prompt ---
async function runVedicAnalysis(bareBase64Data) {
    document.getElementById('loader').style.display = 'block'; 
    document.getElementById('statusText').style.display = 'block'; 
    document.getElementById('statusText').innerText = "Mapping demographic baselines to physical features..."; 
    document.getElementById('reportCard').classList.remove('active');
    
    const name = document.getElementById('userName').value;
    const age = document.getElementById('userAge').value;
    const sex = document.getElementById('userSex').value;
    const targetLang = document.getElementById('userLang').value;

    // THE RESTORED PROMPT (Exact match from the source)
    const systemPrompt = `You are a master expert in Vedic Face Reading (Mukha Samudrika Shastra), deep Indian astrological mappings, and high-level physical feature analysis. This is a real, serious diagnostic tool meant to deliver the absolute, unfiltered truth. Do not flatter. Do not sugarcoat. Analyze with 100% honesty.

The subject is ${name}, a ${age}-year-old ${sex}. 
CRITICAL: Calibrate your karmic and psychological baseline based on the subject's age (${age}) and sex (${sex}). Address the report directly to ${name} or in the third person regarding them.

Perform a microscopic, exhaustive analysis of the facial geometry, examining every subtle feature according to ancient Samudrika principles. Leave no aspect unaddressed:

1. **Forehead & Hairline (Lalata & Kesha-Rekha):** Width, vertical lines, planetary mounts, and hairline shape. What is their real intellectual capacity, stubbornness, and karmic baggage?
2. **Eyebrows (Bhru):** Density, arch, thickness, and spacing. Reveal their true temperament, inherent logic, and relationship with anger or control. 
3. **Eyes & Pupils (Netra & Tara):** Size, depth, dilation, distance, and the state of the sclera. State clearly if they reflect a Sattvic (pure), Rajasic (restless/desirous), or Tamasic (cunning/lethargic) soul. 
4. **Eyelashes (Pakshma):** Density, direction, and curl. What do they reveal about vital energy and emotional guarding?
5. **Nose & Nostrils (Nasika & Nasa-Puta):** Ridge stability, apex sharpness, and nostril flare/exposure. Reveal the exact truth about their ego, wealth-retention capacity, and core vitality.
6. **Ears (Karna):** Structure, lobe attachment, and placement relative to the eyes. What is their true intuition level and capacity to listen?
7. **Mouth, Lips & Teeth (Ostha, Mukha & Danta):** Thickness, symmetry, and corner inclination. Reveal their speech traits—do they lie, manipulate, or speak harshly? 
8. **Jaw & Chin (Chibuka & Hanu):** Structural grit, width, and projection. Will they buckle under pressure or possess an unbreakable will?
9. **Complexion & Skin Texture (Chhavi & Twak):** The underlying luster (Ojas) or dullness. What does this say about empowering their internal health?
10. **Ayurvedic Prakriti:** Structural Dosha mapping (Vata, Pitta, Kapha).
11. **Sensuality & Desires (Kama Assessment):** Analyze the eyes, lips, and facial fleshiness to evaluate their sexual drive and sensual regulation (Indriya Nigraha). Do not hide anything. Be brutally honest. Do they possess a high, unregulated sex drive, perverse tendencies, or deviant appetites? Or are their senses controlled?

### THE QUANTITATIVE MATRIX (0-100%)
Based on the above information, provide exact, brutally honest percentage scores for the following traits. Format this beautifully in HTML.

**A. The Four Purusharthas (Life Pursuits)**
* Dharma (Righteousness/Duty): %
* Artha (Wealth/Material Purpose): %
* Kama (Desires/Passions): %
* Moksha (Detachment/Spiritual Liberation): %

**B. The Inner Enemies (Arishadvarga Vulnerabilities)**
* Kaam (Lust/Unregulated Desire): %
* Krodh (Anger/Rage): %
* Moha (Delusion/Attachment): %
* Maya/Mada (Arrogance/Ego): %
* Matsar (Jealousy/Envy): %

**C. Emotional and Social Integrity**
* Empathy (Understanding others): %
* Humility (Ego suppression): %
* Accountability (Taking ownership): %
* Respectfulness (Dignity to others): %

**D. Mental and Behavioral Resilience**
* Adaptability (Pivoting under stress): %
* Self-Regulation (Managing impulses): %
* Patience (Tolerating hardship): %

**E. Purpose and Execution**
* Consistency (Reliability over time): %
* Generosity (Selfless sharing): %
* Discretion (Keeping confidence/secrets): %

CRITICAL INSTRUCTION: Write your ENTIRE response exclusively in the ${targetLang} language. Deliver the response using cleanly structured HTML sections (using h3 elements, strong bullet lists, and readable spacing). Do not use markdown backticks around the HTML inside your payload response.`;

    const payload = { 
        contents: [{ 
            parts: [ 
                { text: systemPrompt }, 
                // Using the bare, unmarked image payload
                { inlineData: { mimeType: "image/jpeg", data: bareBase64Data.split(',')[1] } } 
            ] 
        }] 
    };

    try {
        const response = await fetchGeminiChat(payload);
        if (!response.ok) throw new Error(`Server status: ${response.status}`);
        
        const data = await response.json();
        if(data.candidates && data.candidates[0].content.parts[0].text) {
            rawReportText = data.candidates[0].content.parts[0].text.replace(/```html/g, '').replace(/```/g, '').trim(); 
            document.getElementById('reportTarget').innerHTML = rawReportText;
            if(audioBtn) { audioBtn.style.display = 'flex'; audioBtn.innerHTML = "🔊 Listen"; }
            if(document.getElementById('sharePdfBtn')) document.getElementById('sharePdfBtn').style.display = 'block'; 
        }
        
        document.getElementById('reportCard').classList.add('active'); 
        document.getElementById('reportCard').scrollIntoView({ behavior: 'smooth' });
    } catch (err) { alert("Processing Error: " + err.message); } 
    finally { document.getElementById('loader').style.display = 'none'; document.getElementById('statusText').style.display = 'none'; }
}

// --- 8. Follow-Up Interrogation Module (Q&A) ---
async function handleCustomQuestion() {
    if (!customQuestionInput || !customQuestionInput.value.trim()) return alert("Please type a question.");
    const question = customQuestionInput.value.trim();
    askQuestionBtn.disabled = true; askQuestionBtn.innerText = "Thinking..."; qaLoader.style.display = 'block'; qaTarget.style.display = 'none'; if(qaAudioBtn) qaAudioBtn.style.display = 'none';

    const contextPrompt = `You are a Grand Master of Vedic Mukha Samudrika Shastra. Established Reading Matrix for ${document.getElementById('userName').value || "the subject"}:\n"""\n${rawReportText}\n"""\nUser Question: "${question}"\nAnswer strictly based on the established reading. Be direct and uncompromising. Deliver in ${document.getElementById('userLang').value} using clean HTML tags (no markdown backticks).`;

    try {
        const response = await fetchGeminiChat({ contents: [{ parts: [{ text: contextPrompt }] }] });
        if (!response.ok) throw new Error(`Server status: ${response.status}`);
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            rawQaText = data.candidates[0].content.parts[0].text.replace(/```html/g, '').replace(/```/g, '').trim(); 
            qaTarget.innerHTML = `<strong style="color: var(--accent);">Question: ${question}</strong><br><br>${rawQaText}`;
            qaTarget.style.display = 'block';
            if(qaAudioBtn) { qaAudioBtn.style.display = 'flex'; qaAudioBtn.innerHTML = "🔊 Listen to Answer"; }
            customQuestionInput.value = ''; 
        }
    } catch (err) { alert("Interrogation Error: " + err.message); } 
    finally { askQuestionBtn.disabled = false; askQuestionBtn.innerText = "Answer"; qaLoader.style.display = 'none'; }
}

// --- 9. Speech Synthesis ---
function toggleSpeech() {
    const synth = window.speechSynthesis, tl = document.getElementById('userLang').value;
    if (synth.speaking) { if (synth.paused) { synth.resume(); audioBtn.innerHTML = "⏸️ Pause"; } else { synth.pause(); audioBtn.innerHTML = "▶️ Resume"; } return; }
    synth.cancel(); audioBtn.innerHTML = "⏸️ Pause";
    currentSynthUtterance = new SpeechSynthesisUtterance(rawReportText.replace(/<[^>]*>?/gm, '').trim()); currentSynthUtterance.lang = langMap[tl] || 'en-IN';
    currentSynthUtterance.onend = () => { audioBtn.innerHTML = "🔊 Listen"; }; currentSynthUtterance.onerror = () => { audioBtn.innerHTML = "🔊 Listen"; }; synth.speak(currentSynthUtterance);
}
function toggleQaSpeech() {
    const synth = window.speechSynthesis, tl = document.getElementById('userLang').value;
    if (synth.speaking) { if (synth.paused) { synth.resume(); qaAudioBtn.innerHTML = "⏸️ Pause"; } else { synth.pause(); qaAudioBtn.innerHTML = "▶️ Resume"; } return; }
    synth.cancel(); qaAudioBtn.innerHTML = "⏸️ Pause";
    currentSynthUtterance = new SpeechSynthesisUtterance(rawQaText.replace(/<[^>]*>?/gm, '').trim()); currentSynthUtterance.lang = langMap[tl] || 'en-IN';
    currentSynthUtterance.onend = () => { qaAudioBtn.innerHTML = "🔊 Listen to Answer"; }; currentSynthUtterance.onerror = () => { qaAudioBtn.innerHTML = "🔊 Listen to Answer"; }; synth.speak(currentSynthUtterance);
}
function toggleModal(s) { document.getElementById('settingsModal').classList.toggle('active', s); }
function saveSettings() { localStorage.setItem('user_api_key', document.getElementById('apiKeyInput').value.trim()); toggleModal(false); }