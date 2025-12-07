// ==========================================
// Main Application Logic
// Telsiz Ses Kaydedici
// ==========================================

class TelsizApp {
    constructor() {
        // DOM Elements
        this.pttButton = document.getElementById('pttButton');
        this.pttText = this.pttButton.querySelector('.ptt-text');
        this.ledIndicator = document.getElementById('ledIndicator');
        this.recordingTimer = document.getElementById('recordingTimer');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.previewSection = document.getElementById('previewSection');
        this.audioPreview = document.getElementById('audioPreview');
        this.shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.discardBtn = document.getElementById('discardBtn');
        this.effectIntensity = document.getElementById('effectIntensity');
        this.historyList = document.getElementById('historyList');
        this.historyCount = document.getElementById('historyCount');
        this.toastContainer = document.getElementById('toastContainer');
        this.backgroundRadio = document.getElementById('backgroundRadio');
        this.ambientToggle = document.getElementById('ambientToggle');

        // State
        this.isRecording = false;
        this.ambientSoundEnabled = false;
        this.currentRecording = null;
        this.timerInterval = null;
        this.spaceKeyPressed = false;

        // Initialize
        this.init();
    }

    async init() {
        // Waveform başlat
        window.waveformVisualizer.init(this.waveformCanvas);

        // Event listeners
        this.pttButton.addEventListener('click', () => this.toggleRecording());
        this.shareWhatsAppBtn.addEventListener('click', () => this.shareToWhatsApp());
        this.downloadBtn.addEventListener('click', () => this.downloadRecording());
        this.discardBtn.addEventListener('click', () => this.discardRecording());
        this.ambientToggle.addEventListener('click', () => this.toggleAmbientSound());

        // Arka plan telsiz sesini hazırla
        this.initAmbientSound();

        // Klavye kısayolları (Space tuşu PTT)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.spaceKeyPressed && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
                e.preventDefault();
                this.spaceKeyPressed = true;
                if (!this.isRecording) {
                    this.startRecording();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.spaceKeyPressed) {
                e.preventDefault();
                this.spaceKeyPressed = false;
                if (this.isRecording) {
                    this.stopRecording();
                }
            }
        });

        // Kayıt geçmişini yükle
        this.loadHistory();

        // Hoş geldiniz mesajı
        this.showToast('Telsiz Ses Kaydedici\'ye hoş geldiniz! 📻', 'info');
    }

    // Kayıt toggle
    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    // Kayıt başlat
    async startRecording() {
        const success = await window.audioRecorder.startRecording(
            null, // onDataAvailable
            (audioBlob) => this.onRecordingComplete(audioBlob), // onStop
            (error) => this.showToast(error, 'error') // onError
        );

        if (success) {
            this.isRecording = true;
            this.updateUIForRecording();

            // Arka plan sesini başlat (videoplayback.mp4)
            console.log('🎵 Arka plan sesi çalıyor...');
            this.backgroundRadio.muted = false; // AÇIKÇA UNMUTE
            this.backgroundRadio.volume = 1.0; // TEKRAR AYARLA

            this.backgroundRadio.play().then(() => {
                console.log('✅ Arka plan sesi başarıyla çalıyor!');
                console.log('Muted:', this.backgroundRadio.muted);
                console.log('Volume:', this.backgroundRadio.volume);
                console.log('Paused:', this.backgroundRadio.paused);
            }).catch(err => {
                console.error('❌ Arka plan sesi çalınamadı:', err);
                this.showToast('Arka plan sesi çalınamadı. Tarayıcı otomatik oynatmayı engelliyor olabilir.', 'error');
            });

            // Waveform başlat
            const analyser = window.audioRecorder.getAnalyser();
            if (analyser) {
                window.waveformVisualizer.start(analyser);
            }

            // Timer başlat
            this.startTimer();
        }
    }

    // Kayıt durdur
    stopRecording() {
        window.audioRecorder.stopRecording();
        this.isRecording = false;
        this.updateUIForStopped();
        window.waveformVisualizer.stop();
        this.stopTimer();

        // Arka plan sesini durdur
        console.log('🔇 Arka plan sesi durduruluyor...');
        this.backgroundRadio.pause();
        this.backgroundRadio.currentTime = 0; // Başa sar
    }

    // Kayıt tamamlandığında
    async onRecordingComplete(audioBlob) {
        try {
            const intensity = this.effectIntensity.value;

            // 1. Önce arka plan sesiyle karıştır
            this.showToast('Arka plan sesi ekleniyor...', 'info');
            const mixedBlob = await window.audioEffects.mixWithBackgroundAudio(audioBlob);

            // 2. Sonra telsiz efekti uygula
            this.showToast('Telsiz efekti uygulanıyor...', 'info');
            const processedBlob = await window.audioEffects.applyRadioEffect(mixedBlob, intensity);

            this.currentRecording = processedBlob;

            // Önizleme göster
            const url = URL.createObjectURL(processedBlob);
            this.audioPreview.src = url;
            this.previewSection.classList.remove('hidden');

            this.showToast('Kayıt tamamlandı! 🎉', 'success');

            // Local storage'a kaydet
            const duration = window.audioRecorder.getRecordingDuration();
            const recordingId = await window.storageManager.saveRecording(processedBlob, {
                duration,
                hasEffect: true,
                effectIntensity: intensity
            });

            // Geçmişi güncelle
            this.loadHistory();

        } catch (error) {
            console.error('Kayıt işleme hatası:', error);
            this.showToast('Kayıt işlenirken hata oluştu', 'error');
        }
    }

    // UI güncelle - Kayıt durumu
    updateUIForRecording() {
        this.pttButton.classList.add('recording');
        this.pttText.textContent = 'KAYIT EDİLİYOR...';
        this.ledIndicator.classList.add('active');
        this.recordingTimer.classList.add('active');
    }

    // UI güncelle - Durduruldu
    updateUIForStopped() {
        this.pttButton.classList.remove('recording');
        this.pttText.textContent = 'KAYDET';
        this.ledIndicator.classList.remove('active');
        this.recordingTimer.classList.remove('active');
    }

    // Timer başlat
    startTimer() {
        let seconds = 0;
        this.recordingTimer.textContent = '00:00';

        this.timerInterval = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            this.recordingTimer.textContent =
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // Timer durdur
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // WhatsApp'a paylaş
    async shareToWhatsApp() {
        if (!this.currentRecording) return;

        const filename = window.shareManager.generateFilename('telsiz-kayit', 'wav');
        const result = await window.shareManager.shareToWhatsApp(this.currentRecording, filename);

        if (result.success) {
            if (result.message) {
                this.showToast(result.message, 'info');
            } else {
                this.showToast('WhatsApp\'ta paylaşıldı! ✅', 'success');
            }
        } else if (!result.cancelled) {
            this.showToast('Paylaşım başarısız oldu', 'error');
        }
    }

    // Kaydı indir
    downloadRecording() {
        if (!this.currentRecording) return;

        const filename = window.shareManager.generateFilename('telsiz-kayit', 'wav');
        const result = window.shareManager.downloadAudio(this.currentRecording, filename);

        if (result.success) {
            this.showToast('Kayıt indirildi! 💾', 'success');
        } else {
            this.showToast('İndirme başarısız oldu', 'error');
        }
    }

    // Kaydı sil (önizlemeden)
    discardRecording() {
        this.currentRecording = null;
        this.audioPreview.src = '';
        this.previewSection.classList.add('hidden');
        this.showToast('Kayıt silindi', 'info');
    }

    // Arka plan telsiz sesini başlat (videoplayback.mp4 kullanarak)
    initAmbientSound() {
        // HTML audio elementini kullan
        this.backgroundRadio.muted = false; // AÇIKÇA UNMUTE
        this.backgroundRadio.volume = 1.0; // MAKSİMUM SES
        this.backgroundRadio.loop = true;

        // Debug: Ses dosyası yüklendi mi kontrol et
        this.backgroundRadio.addEventListener('loadeddata', () => {
            console.log('✅ Arka plan sesi (videoplayback.mp4) yüklendi!');
            console.log('Ses süresi:', this.backgroundRadio.duration, 'saniye');
            console.log('Muted:', this.backgroundRadio.muted);
            console.log('Volume:', this.backgroundRadio.volume);
        });

        this.backgroundRadio.addEventListener('error', (e) => {
            console.error('❌ Ses dosyası yüklenemedi:', e);
        });
    }

    // Arka plan sesini aç/kapat
    toggleAmbientSound() {
        this.ambientSoundEnabled = !this.ambientSoundEnabled;

        if (this.ambientSoundEnabled) {
            // Ses çalmaya başla
            this.backgroundRadio.play().then(() => {
                this.ambientToggle.classList.add('active');
                this.ambientToggle.innerHTML = '🔊 Ortam Sesi (Açık)';
                this.showToast('Arka plan telsiz sesi açıldı 📻', 'info');
            }).catch(error => {
                console.error('Ses çalma hatası:', error);
                this.showToast('Ses oynatılamadı. Lütfen tekrar deneyin.', 'error');
                this.ambientSoundEnabled = false;
            });
        } else {
            // Sesi durdur
            this.backgroundRadio.pause();
            this.backgroundRadio.currentTime = 0; // Başa sar
            this.ambientToggle.classList.remove('active');
            this.ambientToggle.innerHTML = '🔊 Ortam Sesi';
            this.showToast('Arka plan sesi kapatıldı', 'info');
        }
    }

    // Kayıt geçmişini yükle
    loadHistory() {
        const recordings = window.storageManager.getRecordings();
        this.historyCount.textContent = recordings.length;

        if (recordings.length === 0) {
            this.historyList.innerHTML = '<p class="empty-state">Henüz kayıt yok</p>';
            return;
        }

        this.historyList.innerHTML = '';

        recordings.forEach(recording => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const blob = window.storageManager.base64ToBlob(recording.audioData, recording.mimeType);
            const url = URL.createObjectURL(blob);

            const timestamp = window.storageManager.formatTimestamp(recording.timestamp);
            const duration = window.storageManager.formatDuration(recording.duration);

            item.innerHTML = `
                <audio controls src="${url}"></audio>
                <span style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">
                    ${duration}
                </span>
                <button onclick="window.telsizApp.deleteHistoryItem('${recording.id}')">🗑️</button>
            `;

            this.historyList.appendChild(item);
        });
    }

    // Geçmişten kayıt sil
    deleteHistoryItem(id) {
        const success = window.storageManager.deleteRecording(id);
        if (success) {
            this.loadHistory();
            this.showToast('Kayıt silindi', 'info');
        } else {
            this.showToast('Silme işlemi başarısız', 'error');
        }
    }

    // Toast bildirim göster
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        this.toastContainer.appendChild(toast);

        // 3 saniye sonra kaldır
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    window.telsizApp = new TelsizApp();
});
