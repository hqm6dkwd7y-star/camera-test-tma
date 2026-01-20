// Telegram WebApp initialization
const tg = window.Telegram?.WebApp;

// DOM Elements
const cameraPreview = document.getElementById('cameraPreview');
const recordBtn = document.getElementById('recordBtn');
const micBtn = document.getElementById('micBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const galleryInput = document.getElementById('galleryInput');
const recordingOverlay = document.getElementById('recordingOverlay');
const timer = document.getElementById('timer');
const errorMessage = document.getElementById('errorMessage');
const status = document.getElementById('status');
const videoPreviewContainer = document.getElementById('videoPreviewContainer');
const recordedVideo = document.getElementById('recordedVideo');
const videoSize = document.getElementById('videoSize');
const uploadBtn = document.getElementById('uploadBtn');
const shareBtn = document.getElementById('shareBtn');

// State
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordedBlob = null;
let isRecording = false;
let isMicEnabled = true;
let currentFacingMode = 'user';
let countdownInterval = null;
let availableCameras = [];

// Initialize Telegram WebApp
function initTelegramWebApp() {
    if (tg) {
        console.log('📱 Telegram WebApp detected');
        tg.ready();
        tg.expand();
        tg.isFullscreen = true;
        
        // Apply theme colors
        if (tg.themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
        }
        
        console.log('✅ Telegram WebApp initialized');
    } else {
        console.log('⚠️ Not running in Telegram WebApp');
    }
}

// Check HTTPS
function checkHTTPS() {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        showError('⚠️ HTTPS требуется для работы камеры!');
        updateStatus('error', 'Требуется HTTPS соединение');
        return false;
    }
    return true;
}

// Initialize camera
async function initCamera() {
    console.log('🎥 Requesting camera access...');
    
    try {
        // Enumerate devices first
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableCameras = devices.filter(device => device.kind === 'videoinput');
        console.log(`📹 Found ${availableCameras.length} camera(s)`);
        
        // Show switch button if multiple cameras
        if (availableCameras.length > 1) {
            switchCameraBtn.classList.remove('hidden');
        }
        
        // Request camera and microphone
        const constraints = {
            video: {
                width: { ideal: 720 },
                height: { ideal: 720 },
                facingMode: currentFacingMode
            },
            audio: true
        };
        
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera access granted');
        
        // Setup video preview
        cameraPreview.srcObject = mediaStream;
        
        // Enable record button
        recordBtn.disabled = false;
        updateStatus('success', 'Готов к записи');
        
        // Log tracks
        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];
        console.log('📹 Video track:', videoTrack.label);
        console.log('🎤 Audio track:', audioTrack.label);
        
    } catch (error) {
        console.error('❌ Camera access error:', error);
        showError(`Ошибка доступа к камере: ${error.message}`);
        updateStatus('error', 'Доступ к камере запрещен');
    }
}

// Start recording
async function startRecording() {
    if (!mediaStream || isRecording) return;
    
    console.log('🔴 Starting recording...');
    isRecording = true;
    recordedChunks = [];
    
    try {
        // Determine supported MIME type
        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }
        }
        console.log('📹 Using MIME type:', mimeType);
        
        // Create MediaRecorder
        mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType: mimeType,
            videoBitsPerSecond: 2500000
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log(`📦 Chunk received: ${event.data.size} bytes`);
            }
        };
        
        mediaRecorder.onstop = () => {
            console.log('⏹️ Recording stopped');
            recordedBlob = new Blob(recordedChunks, { type: mimeType });
            console.log(`✅ Video blob created: ${(recordedBlob.size / 1024 / 1024).toFixed(2)} MB`);
            showRecordedVideo();
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('❌ MediaRecorder error:', event.error);
            showError(`Ошибка записи: ${event.error}`);
        };
        
        mediaRecorder.onstart = () => {
            console.log('✅ MediaRecorder started');
        };
        
        // Start recording
        mediaRecorder.start(1000); // Collect data every second
        
        // Update UI
        recordBtn.innerHTML = '<span class="btn-icon">⏹️</span><span class="btn-text">Остановить</span>';
        recordingOverlay.classList.remove('hidden');
        updateStatus('recording', 'Идет запись...');
        
        // Start countdown
        let timeLeft = 10;
        timer.textContent = timeLeft;
        
        countdownInterval = setInterval(() => {
            timeLeft--;
            timer.textContent = timeLeft;
            
            if (tg) {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            if (timeLeft <= 0) {
                stopRecording();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Recording start error:', error);
        showError(`Ошибка начала записи: ${error.message}`);
        isRecording = false;
    }
}

// Stop recording
function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    console.log('⏹️ Stopping recording...');
    
    // Clear countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // Stop MediaRecorder
    if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    // Update UI
    isRecording = false;
    recordBtn.innerHTML = '<span class="btn-icon">🔴</span><span class="btn-text">Запись (10 сек)</span>';
    recordingOverlay.classList.add('hidden');
    updateStatus('success', 'Запись завершена');
}

// Show recorded video
function showRecordedVideo() {
    const videoUrl = URL.createObjectURL(recordedBlob);
    recordedVideo.src = videoUrl;
    videoSize.textContent = `Размер: ${(recordedBlob.size / 1024 / 1024).toFixed(2)} MB`;
    videoPreviewContainer.classList.remove('hidden');
    
    // Show share button if supported
    if (navigator.share) {
        shareBtn.classList.remove('hidden');
    }
    
    console.log('📺 Video preview ready');
}

// Toggle microphone
function toggleMicrophone() {
    if (!mediaStream) return;
    
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (audioTrack) {
        isMicEnabled = !isMicEnabled;
        audioTrack.enabled = isMicEnabled;
        
        micBtn.innerHTML = isMicEnabled 
            ? '<span class="btn-icon">🔊</span><span class="btn-text">Микрофон</span>'
            : '<span class="btn-icon">🔇</span><span class="btn-text">Выключен</span>';
        
        console.log(`🎤 Microphone ${isMicEnabled ? 'enabled' : 'disabled'}`);
        
        if (tg) {
            tg.HapticFeedback.impactOccurred('medium');
        }
    }
}

// Switch camera
async function switchCamera() {
    if (availableCameras.length < 2) return;
    
    console.log('🔄 Switching camera...');
    
    try {
        // Stop current stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        
        // Toggle facing mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        // Reinitialize camera
        await initCamera();
        
        if (tg) {
            tg.HapticFeedback.impactOccurred('medium');
        }
        
    } catch (error) {
        console.error('❌ Camera switch error:', error);
        showError(`Ошибка переключения камеры: ${error.message}`);
        // Revert to previous mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    }
}

// Handle gallery upload
function handleGalleryUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📁 File selected from gallery:', file.name);
    console.log('📦 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    recordedBlob = file;
    const videoUrl = URL.createObjectURL(file);
    recordedVideo.src = videoUrl;
    videoSize.textContent = `Файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    videoPreviewContainer.classList.remove('hidden');
    
    if (tg) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Upload video to server
async function uploadVideo() {
    if (!recordedBlob) return;
    
    console.log('📤 Uploading video...');
    updateStatus('recording', 'Отправка на сервер...');
    uploadBtn.disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('video', recordedBlob, `video_${Date.now()}.webm`);
        
        if (tg && tg.initDataUnsafe?.user) {
            formData.append('user_id', tg.initDataUnsafe.user.id);
        }
        
        // Replace with your server URL
        const serverUrl = 'http://localhost:8000/upload-test';
        
        const response = await fetch(serverUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        
        updateStatus('success', `✅ Видео отправлено! Размер: ${(result.size_bytes / 1024 / 1024).toFixed(2)} MB`);
        
        if (tg) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        showError(`Ошибка отправки: ${error.message}`);
        updateStatus('error', 'Ошибка отправки на сервер');
        
        if (tg) {
            tg.HapticFeedback.notificationOccurred('error');
        }
    } finally {
        uploadBtn.disabled = false;
    }
}

// Share video
async function shareVideo() {
    if (!recordedBlob || !navigator.share) return;
    
    console.log('💾 Sharing video...');
    
    try {
        const file = new File([recordedBlob], `video_${Date.now()}.webm`, {
            type: recordedBlob.type
        });
        
        await navigator.share({
            files: [file],
            title: 'Записанное видео',
            text: 'Видео из Telegram Mini App'
        });
        
        console.log('✅ Share successful');
        
        if (tg) {
            tg.HapticFeedback.notificationOccurred('success');
        }
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('❌ Share error:', error);
        }
    }
}

// Utility functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function updateStatus(type, message) {
    status.className = `status ${type}`;
    status.textContent = message;
}

// Event listeners
recordBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

micBtn.addEventListener('click', toggleMicrophone);
switchCameraBtn.addEventListener('click', switchCamera);
galleryInput.addEventListener('change', handleGalleryUpload);
uploadBtn.addEventListener('click', uploadVideo);
shareBtn.addEventListener('click', shareVideo);

// Initialize app
async function init() {
    console.log('🚀 Initializing Camera Test TMA...');
    
    initTelegramWebApp();
    
    if (!checkHTTPS()) {
        return;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('❌ getUserMedia не поддерживается в этом браузере');
        updateStatus('error', 'Браузер не поддерживает камеру');
        return;
    }
    
    await initCamera();
}

// Start app
init();
