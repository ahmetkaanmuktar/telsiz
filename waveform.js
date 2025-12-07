// ==========================================
// Waveform Visualization Module
// Canvas API ile dalga formu
// ==========================================

class WaveformVisualizer {
    constructor() {
        this.canvas = null;
        this.canvasContext = null;
        this.analyser = null;
        this.animationId = null;
        this.isActive = false;
        this.dataArray = null;
        this.bufferLength = 0;
    }

    // Canvas başlatma
    init(canvasElement) {
        this.canvas = canvasElement;
        this.canvasContext = this.canvas.getContext('2d');

        // Canvas boyutunu ayarla (high DPI için)
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Başlangıç durumu çiz
        this.drawIdleState();
    }

    // Analyser'ı ayarla ve çizime başla
    start(analyser) {
        if (!analyser || !this.canvas) return;

        this.analyser = analyser;
        this.bufferLength = analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.isActive = true;

        this.draw();
    }

    // Çizim döngüsü
    draw() {
        if (!this.isActive || !this.analyser) return;

        this.animationId = requestAnimationFrame(() => this.draw());

        // Frekans verilerini al
        this.analyser.getByteTimeDomainData(this.dataArray);

        const width = this.canvas.width / window.devicePixelRation || this.canvas.width;
        const height = this.canvas.height / window.devicePixelRatio || this.canvas.height;

        // Canvas'ı temizle
        this.canvasContext.fillStyle = 'rgba(26, 36, 56, 0.3)';
        this.canvasContext.fillRect(0, 0, width, height);

        // Dalga formu çiz
        this.canvasContext.lineWidth = 2;
        this.canvasContext.strokeStyle = '#00ff88';
        this.canvasContext.beginPath();

        const sliceWidth = width / this.bufferLength;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                this.canvasContext.moveTo(x, y);
            } else {
                this.canvasContext.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.canvasContext.lineTo(width, height / 2);
        this.canvasContext.stroke();

        // Gradient overlay (görsel efekt)
        const gradient = this.canvasContext.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0.1)');

        this.canvasContext.fillStyle = gradient;
        this.canvasContext.fillRect(0, 0, width, height);
    }

    // Boşta durumu çiz
    drawIdleState() {
        if (!this.canvas) return;

        const width = this.canvas.width / window.devicePixelRatio || this.canvas.width;
        const height = this.canvas.height / window.devicePixelRatio || this.canvas.height;

        this.canvasContext.fillStyle = 'rgba(26, 36, 56, 0.5)';
        this.canvasContext.fillRect(0, 0, width, height);

        // Merkez çizgisi
        this.canvasContext.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        this.canvasContext.lineWidth = 1;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(0, height / 2);
        this.canvasContext.lineTo(width, height / 2);
        this.canvasContext.stroke();

        // Metin
        this.canvasContext.fillStyle = 'rgba(168, 181, 204, 0.5)';
        this.canvasContext.font = '14px "Segoe UI", sans-serif';
        this.canvasContext.textAlign = 'center';
        this.canvasContext.fillText('Kayıt için butona basın...', width / 2, height / 2 - 10);
    }

    // Durdur ve temizle
    stop() {
        this.isActive = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.drawIdleState();
    }

    // Temizle
    clear() {
        if (this.canvas) {
            const width = this.canvas.width / window.devicePixelRatio || this.canvas.width;
            const height = this.canvas.height / window.devicePixelRatio || this.canvas.height;
            this.canvasContext.clearRect(0, 0, width, height);
            this.drawIdleState();
        }
    }
}

// Global instance oluştur
window.waveformVisualizer = new WaveformVisualizer();
