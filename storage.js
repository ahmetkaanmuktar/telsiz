// ==========================================
// Storage Module
// Local Storage ile kayıt yönetimi
// ==========================================

class StorageManager {
    constructor() {
        this.storageKey = 'telsiz_recordings';
        this.maxRecordings = 5;
    }

    // Yeni kayıt kaydet
    async saveRecording(audioBlob, metadata = {}) {
        try {
            const recordings = this.getRecordings();

            // Blob'u base64'e çevir
            const base64Audio = await this.blobToBase64(audioBlob);

            const recording = {
                id: Date.now().toString(),
                audioData: base64Audio,
                mimeType: audioBlob.type,
                timestamp: new Date().toISOString(),
                duration: metadata.duration || 0,
                hasEffect: metadata.hasEffect || false,
                effectIntensity: metadata.effectIntensity || 'medium'
            };

            recordings.unshift(recording); // Başa ekle (en yeni)

            // Maksimum kayıt sayısını kontrol et
            if (recordings.length > this.maxRecordings) {
                recordings.splice(this.maxRecordings); // Fazlasını sil
            }

            localStorage.setItem(this.storageKey, JSON.stringify(recordings));
            return recording.id;

        } catch (error) {
            console.error('Kayıt kaydetme hatası:', error);
            throw new Error('Kayıt kaydedilemedi. Local Storage dolu olabilir.');
        }
    }

    // Tüm kayıtları getir
    getRecordings() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Kayıtları getirme hatası:', error);
            return [];
        }
    }

    // Belirli bir kaydı getir
    getRecording(id) {
        const recordings = this.getRecordings();
        return recordings.find(r => r.id === id);
    }

    // Kayıt sil
    deleteRecording(id) {
        try {
            const recordings = this.getRecordings();
            const filtered = recordings.filter(r => r.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Kayıt silme hatası:', error);
            return false;
        }
    }

    // Tüm kayıtları sil
    clearAllRecordings() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Kayıtları temizleme hatası:', error);
            return false;
        }
    }

    // Base64'ü blob'a geri çevir
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // Blob'u base64'e çevir
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Timestamp'i okunabilir formata çevir
    formatTimestamp(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} saat önce`;

        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Süreyi formatla (saniye -> mm:ss)
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Global instance oluştur
window.storageManager = new StorageManager();
