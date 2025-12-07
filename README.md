# 📻 Telsiz Ses Kaydedici

Modern, telsiz temalı bir web ses kaydedici uygulaması. Tarayıcınızda mikrofon kullanarak ses kaydedin, otomatik telsiz efekti ekleyin ve WhatsApp'ta paylaşın!

## ✨ Özellikler

- 🎙️ **Kolay Kayıt**: PTT (Push-to-Talk) butonu ile tek tıkla kayıt
- 📻 **Otomatik Telsiz Efekti**: Her kayda gerçekçi telsiz karakteristiği
- 🔊 **Arka Plan Telsiz Sesi**: İsteğe bağlı sürekli çalan ortam statik sesi
- 📱 **WhatsApp Entegrasyonu**: Kayıtlarınızı direkt WhatsApp'ta paylaşın
- 🎨 **Dalga Formu Görselleştirmesi**: Gerçek zamanlı ses dalgaları
- 💾 **Kayıt Geçmişi**: Son 5 kaydınız otomatik saklanır (Local Storage)
- ⌨️ **Klavye Kısayolları**: Space tuşu ile hızlı kayıt
- 🌙 **Modern Koyu Tema**: Telsiz temalı premium tasarım
- 📲 **Tam Responsive**: Mobil ve masaüstünde mükemmel çalışır

## 🚀 Kullanım

1. **Kayıt Başlatma**: 
   - "KAYDET" butonuna tıklayın veya
   - Space tuşuna basılı tutun
   - Arka plan sesi (videoplayback.mp4) otomatik başlar
   
2. **Kayıt Durdurma**:
   - Tekrar butona tıklayın veya
   - Space tuşunu bırakın
   - Arka plan sesi otomatik durur

3. **Paylaşma**:
   - Önizlemede "WhatsApp'ta Paylaş" butonuna tıklayın
   - Veya "İndir" ile dosyayı kaydedin
   
4. **Arka Plan Sesi (Opsiyonel)**:
   - "🔊 Ortam Sesi" butonu ile manuel açıp kapatabilirsiniz
   - Kayıt sırasında zaten otomatik çalar

## 🛠️ Teknik Detaylar

### Kullanılan Teknolojiler
- **HTML5**: Semantic yapı
- **CSS3**: Modern animasyonlar, glassmorphism
- **Vanilla JavaScript**: Framework'süz, saf JS
- **Web Audio API**: Ses efektleri ve işleme
- **MediaRecorder API**: Tarayıcı ses kaydı
- **Canvas API**: Dalga formu görselleştirmesi
- **Local Storage**: Kayıt geçmişi
- **Web Share API**: Mobil paylaşım

### Tarayıcı Desteği
- ✅ Chrome/Edge (Windows, Android, macOS)
- ✅ Firefox (Windows, macOS, Android)
- ⚠️ Safari (macOS, iOS) - MediaRecorder desteği sınırlı olabilir
- ✅ Opera
- ✅ Samsung Internet

### Özellikler
- **Maksimum Kayıt Süresi**: 60 saniye
- **Kayıt Formatı**: MP4 (öncelikli), WebM (fallback), WAV (işlenmiş)
- **Efekt Seviyeleri**: Hafif, Orta, Yoğun
- **Maksimum Geçmiş**: 5 kayıt
- **Arka Plan Sesi**: videoplayback.mp4 dosyasından döngülü ortam sesi

## 💻 Yerel Çalıştırma

### Yöntem 1: Python HTTP Server
```bash
cd tlsız
python -m http.server 8000
```
Tarayıcıda: `http://localhost:8000`

### Yöntem 2: NPX Serve
```bash
cd tlsız
npx -y serve .
```
Tarayıcıda açılan URL'yi kullanın

### Yöntem 3: Live Server (VS Code)
1. VS Code'da projeyi açın
2. Live Server extension'ını yükleyin
3. `index.html`'e sağ tıklayıp "Open with Live Server"

## 🌐 GitHub Pages Deployment

1. GitHub'da yeni bir repository oluşturun
2. Dosyaları repository'ye yükleyin:
```bash
git init
git add .
git commit -m "İlk commit - Telsiz Ses Kaydedici"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git
git push -u origin main
```

3. GitHub repository ayarlarına gidin
4. **Settings** → **Pages** bölümüne gidin
5. **Source** olarak `main` branch'i seçin
6. **Save** butonuna tıklayın
7. Birkaç dakika sonra siteniz `https://KULLANICI_ADINIZ.github.io/REPO_ADINIZ` adresinde yayında!

## 📝 Notlar

- **Mikrofon İzni**: İlk kullanımda tarayıcı mikrofon izni isteyecektir
- **HTTPS Gerekli**: Güvenlik nedeniyle mikrofon erişimi HTTPS gerektirir (GitHub Pages otomatik HTTPS kullanır)
- **Local Storage**: Kayıtlar tarayıcınızda yerel olarak saklanır, temizlendiğinde silinir
- **Mobil Performans**: WhatsApp paylaşımı mobil cihazlarda en iyi çalışır

## 🎨 Özelleştirme

### Renkleri Değiştirme
`styles.css` dosyasındaki CSS değişkenlerini düzenleyin:
```css
:root {
    --accent-green: #00ff88;  /* Ana vurgu rengi */
    --accent-amber: #ffaa00;  /* İkincil vurgu */
    --bg-primary: #0a0e1a;    /* Ana arkaplan */
}
```

### Efekt Yoğunluğunu Ayarlama
`audio-effects.js` dosyasındaki ayarları değiştirin:
```javascript
const settings = {
    low: { frequency: 1000, Q: 1.5, distortion: 5 },
    medium: { frequency: 800, Q: 2.0, distortion: 10 },
    high: { frequency: 600, Q: 3.0, distortion: 20 }
};
```

## 🐛 Bilinen Sorunlar

- Safari'de MediaRecorder API desteği sınırlıdır (alternatif: Chrome/Firefox)
- Çok eski tarayıcılarda Web Audio API desteklenmeyebilir
- Local Storage sınırlıdır (~5-10MB), çok fazla kayıt yapılırsa otomatik temizlenir

## 📄 Lisans

MIT License - Özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz.

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b ozellik/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Harika özellik eklendi'`)
4. Branch'inizi push edin (`git push origin ozellik/harika-ozellik`)
5. Pull Request oluşturun

## 📞 İletişim

Sorularınız veya önerileriniz için GitHub Issues kullanabilirsiniz.

---

**Telsiz Ses Kaydedici** ile yapıldı 📻 | 2025
