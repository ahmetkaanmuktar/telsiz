// ==========================================
// Share Module
// WhatsApp ve dosya paylaşımı
// ==========================================

class ShareManager {
    constructor() {
        this.supportsWebShare = 'share' in navigator && 'canShare' in navigator;
    }

    // WhatsApp'a paylaş
    async shareToWhatsApp(audioBlob, filename = 'telsiz-kayit.wav') {
        try {
            // Web Share API desteği kontrol et
            if (this.supportsWebShare) {
                const file = new File([audioBlob], filename, { type: audioBlob.type });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Telsiz Kaydı',
                        text: 'Telsiz ses kaydedici ile oluşturdum 📻'
                    });
                    return { success: true, method: 'web-share-api' };
                }
            }

            // Fallback: WhatsApp Web linki (mobil/desktop)
            return this.shareViaWhatsAppWeb(audioBlob, filename);

        } catch (error) {
            if (error.name === 'AbortError') {
                // Kullanıcı paylaşımı iptal etti
                return { success: false, cancelled: true };
            }
            console.error('WhatsApp paylaşım hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // WhatsApp Web aracılığıyla paylaş (fallback)
    async shareViaWhatsAppWeb(audioBlob, filename) {
        // Mobil cihazlarda WhatsApp uygulaması varsa direkt açabilir
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Dosyayı indirmeye yönlendir
        this.downloadAudio(audioBlob, filename);

        // Bilgilendirme mesajı
        return {
            success: true,
            method: 'download',
            message: 'Ses dosyası indirildi. WhatsApp\'ta manuel olarak paylaşabilirsiniz.'
        };
    }

    // Ses dosyası indir
    downloadAudio(audioBlob, filename = 'telsiz-kayit.wav') {
        try {
            const url = URL.createObjectURL(audioBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // URL'yi temizle (bellek tasarrufu)
            setTimeout(() => URL.revokeObjectURL(url), 100);

            return { success: true };
        } catch (error) {
            console.error('İndirme hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Genel paylaşım (diğer uygulamalar)
    async shareGeneral(audioBlob, filename = 'telsiz-kayit.wav') {
        if (!this.supportsWebShare) {
            return this.downloadAudio(audioBlob, filename);
        }

        try {
            const file = new File([audioBlob], filename, { type: audioBlob.type });

            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Telsiz Kaydı',
                    text: 'Telsiz ses kaydedici ile oluşturdum'
                });
                return { success: true };
            } else {
                return this.downloadAudio(audioBlob, filename);
            }
        } catch (error) {
            console.error('Paylaşım hatası:', error);
            return { success: false, error: error.message };
        }
    }

    // Timestamp eklenmiş dosya adı oluştur
    generateFilename(prefix = 'telsiz-kayit', extension = 'wav') {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .slice(0, 19);
        return `${prefix}-${timestamp}.${extension}`;
    }
}

// Global instance oluştur
window.shareManager = new ShareManager();
