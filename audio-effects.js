// ==========================================
// Audio Effects Module
// Web Audio API ile telsiz efektleri
// ==========================================

class AudioEffects {
    constructor() {
        this.audioContext = null;
    }

    // Audio Context oluştur
    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    // Telsiz bip sesi çal (programatik)
    playBeepSound(type = 'start') {
        const context = this.getAudioContext();

        if (type === 'start') {
            // Çift bip - kayıt başlangıcı
            this.createBeep(context, 800, 0, 0.1);
            this.createBeep(context, 800, 0.15, 0.1);
        } else {
            // Tek bip - kayıt sonu
            this.createBeep(context, 600, 0, 0.15);
        }
    }

    // Tek bir bip oluştur
    createBeep(context, frequency, startTime, duration) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope (yumuşak başlangıç ve bitiş)
        const now = context.currentTime + startTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Kaydedilen sese arka plan sesini (videoplayback.mp4) ekle
    async mixWithBackgroundAudio(recordedBlob) {
        const context = this.getAudioContext();

        try {
            // Kaydedilen sesi decode et
            const recordedArrayBuffer = await recordedBlob.arrayBuffer();
            const recordedBuffer = await context.decodeAudioData(recordedArrayBuffer);

            // Arka plan sesini fetch et ve decode et - CORS için full URL kullan
            const backgroundURL = `${window.location.origin}/videoplayback.mp4`;
            console.log('Arka plan sesi yükleniyor:', backgroundURL);
            const backgroundResponse = await fetch(backgroundURL);

            if (!backgroundResponse.ok) {
                throw new Error(`Arka plan sesi yüklenemedi: ${backgroundResponse.status}`);
            }

            const backgroundArrayBuffer = await backgroundResponse.arrayBuffer();
            const backgroundBuffer = await context.decodeAudioData(backgroundArrayBuffer);

            // Offline context oluştur (mixing için)
            const duration = recordedBuffer.duration;
            const offlineContext = new OfflineAudioContext(
                recordedBuffer.numberOfChannels,
                recordedBuffer.length,
                recordedBuffer.sampleRate
            );

            // Kaydedilen ses source
            const recordedSource = offlineContext.createBufferSource();
            recordedSource.buffer = recordedBuffer;

            // Arka plan ses source
            const backgroundSource = offlineContext.createBufferSource();
            backgroundSource.buffer = backgroundBuffer;
            backgroundSource.loop = false; // Loop değil, sadece kayıt süresi kadar

            // Ses seviyeleri ayarla
            const recordedGain = offlineContext.createGain();
            recordedGain.gain.value = 1.0; // Kaydedilen ses doğal seviyede

            const backgroundGain = offlineContext.createGain();
            backgroundGain.gain.value = 0.3; // Arka plan sesi %30 (net duyulacak seviyede)

            // Bağlantılar
            recordedSource.connect(recordedGain);
            backgroundSource.connect(backgroundGain);

            recordedGain.connect(offlineContext.destination);
            backgroundGain.connect(offlineContext.destination);

            // Render başlat
            recordedSource.start(0);
            backgroundSource.start(0, 0, duration); // Sadece kayıt süresi kadar çal

            const mixedBuffer = await offlineContext.startRendering();

            // Buffer'ı blob'a çevir
            const mixedBlob = await this.audioBufferToWav(mixedBuffer);

            console.log('✅ Arka plan sesi kaydedilen sesle karıştırıldı!');
            return mixedBlob;

        } catch (error) {
            console.error('Arka plan sesi karıştırma hatası:', error);
            // Hata durumunda orijinal blob'u döndür
            return recordedBlob;
        }
    }

    // Telsiz efekti uygula
    async applyRadioEffect(audioBlob, intensity = 'medium') {
        const context = this.getAudioContext();

        try {
            // Blob'u ArrayBuffer'a çevir
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await context.decodeAudioData(arrayBuffer);

            // Offline context oluştur (işleme için)
            const offlineContext = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );

            // Source oluştur
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;

            // Band-pass filter (telsiz karakteristiği)
            const bandpassFilter = offlineContext.createBiquadFilter();
            bandpassFilter.type = 'bandpass';

            // Efekt yoğunluğuna göre ayarla
            const settings = {
                low: { frequency: 1000, Q: 1.5, distortion: 5 },
                medium: { frequency: 800, Q: 2.0, distortion: 10 },
                high: { frequency: 600, Q: 3.0, distortion: 20 }
            };

            const setting = settings[intensity] || settings.medium;
            bandpassFilter.frequency.value = setting.frequency;
            bandpassFilter.Q.value = setting.Q;

            // Hafif distortion ekle (statik ses efekti)
            const distortion = offlineContext.createWaveShaper();
            distortion.curve = this.makeDistortionCurve(setting.distortion);
            distortion.oversample = '4x';

            // Hafif reverb (ekko efekti)
            const convolver = offlineContext.createConvolver();
            convolver.buffer = this.createReverbImpulse(offlineContext);

            // Dry/Wet mixer
            const dryGain = offlineContext.createGain();
            const wetGain = offlineContext.createGain();
            dryGain.gain.value = 0.6;
            wetGain.gain.value = 0.4;

            // Statik gürültü ekle
            const noiseGain = offlineContext.createGain();
            noiseGain.gain.value = intensity === 'high' ? 0.02 : (intensity === 'medium' ? 0.01 : 0.005);
            const noiseBuffer = this.createNoiseBuffer(offlineContext, audioBuffer.duration);
            const noiseSource = offlineContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            // Bağlantılar
            source.connect(bandpassFilter);
            bandpassFilter.connect(distortion);
            distortion.connect(dryGain);
            distortion.connect(convolver);
            convolver.connect(wetGain);

            noiseSource.connect(noiseGain);

            dryGain.connect(offlineContext.destination);
            wetGain.connect(offlineContext.destination);
            noiseGain.connect(offlineContext.destination);

            // Render başlat
            source.start(0);
            noiseSource.start(0);
            const renderedBuffer = await offlineContext.startRendering();

            // Buffer'ı tekrar Blob'a çevir
            const wavBlob = await this.audioBufferToWav(renderedBuffer);
            return wavBlob;

        } catch (error) {
            console.error('Efekt uygulama hatası:', error);
            return audioBlob; // Hata durumunda orijinal blob'u döndür
        }
    }

    // Distortion curve oluştur
    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    // Reverb impulse response oluştur
    createReverbImpulse(context, duration = 0.5) {
        const sampleRate = context.sampleRate;
        const length = sampleRate * duration;
        const impulse = context.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        return impulse;
    }

    // Statik gürültü buffer'ı oluştur
    createNoiseBuffer(context, duration) {
        const sampleRate = context.sampleRate;
        const length = sampleRate * duration;
        const buffer = context.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // AudioBuffer'ı WAV Blob'a çevir
    async audioBufferToWav(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;

        const data = [];
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = buffer.getChannelData(channel)[i];
                const intSample = Math.max(-1, Math.min(1, sample));
                data.push(intSample < 0 ? intSample * 0x8000 : intSample * 0x7FFF);
            }
        }

        const dataLength = data.length * bytesPerSample;
        const arrayBuffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(arrayBuffer);

        // WAV header yazma
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        // Ses verisi yazma
        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            view.setInt16(offset, data[i], true);
            offset += 2;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
}

// Global instance oluştur
window.audioEffects = new AudioEffects();
