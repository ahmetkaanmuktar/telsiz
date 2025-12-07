// ==========================================
// Audio Recorder Module
// MediaRecorder API ile ses kaydı
// ==========================================

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;
        this.isRecording = false;
        this.recordingStartTime = null;
        this.maxRecordingTime = 60000; // 60 saniye
        this.timerInterval = null;
        this.analyser = null;
        this.audioContext = null;
    }

    // Mikrofon izni kontrolü ve talep
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            this.audioStream = stream;

            // Web Audio API için analyser oluştur (waveform için)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            return { success: true };
        } catch (error) {
            console.error('Mikrofon erişim hatası:', error);
            return {
                success: false,
                error: error.name === 'NotAllowedError'
                    ? 'Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.'
                    : 'Mikrofona erişilemedi. Lütfen mikrofon bağlantısını kontrol edin.'
            };
        }
    }

    // Kayıt başlat
    async startRecording(onDataAvailable, onStop, onError) {
        if (!this.audioStream) {
            const permissionResult = await this.requestMicrophonePermission();
            if (!permissionResult.success) {
                if (onError) onError(permissionResult.error);
                return false;
            }
        }

        try {
            this.audioChunks = [];

            // MediaRecorder oluştur - MP4 öncelikli
            let options = {};
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options.mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options.mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                options.mimeType = 'audio/ogg';
            } else {
                options.mimeType = '';
            }

            this.mediaRecorder = new MediaRecorder(this.audioStream, options);

            // Event listeners
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    if (onDataAvailable) onDataAvailable(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
                if (onStop) onStop(audioBlob);
            };

            this.mediaRecorder.onerror = (error) => {
                console.error('MediaRecorder hatası:', error);
                if (onError) onError('Kayıt sırasında bir hata oluştu.');
            };

            // Telsiz açma sesi çal
            if (window.audioEffects) {
                window.audioEffects.playBeepSound('start');
            }

            // Kaydı başlat
            this.mediaRecorder.start(100); // Her 100ms'de bir data event'i
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Maksimum süre zamanlayıcısı
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                    if (onError) onError('Maksimum kayıt süresi (60 saniye) doldu.');
                }
            }, this.maxRecordingTime);

            return true;
        } catch (error) {
            console.error('Kayıt başlatma hatası:', error);
            if (onError) onError('Kayıt başlatılamadı.');
            return false;
        }
    }

    // Kayıt durdur
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.isRecording = false;
            this.mediaRecorder.stop();

            // Telsiz kapama sesi çal
            if (window.audioEffects) {
                window.audioEffects.playBeepSound('stop');
            }
        }
    }

    // Kayıt süresi al (saniye)
    getRecordingDuration() {
        if (this.recordingStartTime) {
            return Math.floor((Date.now() - this.recordingStartTime) / 1000);
        }
        return 0;
    }

    // Analyser'ı dış kullanım için döndür (waveform için)
    getAnalyser() {
        return this.analyser;
    }

    // Cleanup
    cleanup() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Global instance oluştur
window.audioRecorder = new AudioRecorder();
