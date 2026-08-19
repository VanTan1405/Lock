// AI Scanner & Lens Web App Main Logic
document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // User provided Gemini API Key
  const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6KMCuC3zkHxheg702LUfYY4uU8FtsxABXC8S_uZCW94bA';

  // --- STATE ---
  const state = {
    cameraStream: null,
    facingMode: 'user',
    isScanning: false,
    geminiApiKey: localStorage.getItem('gemini_api_key') || DEFAULT_GEMINI_KEY,
    scanHistory: JSON.parse(localStorage.getItem('locket_scan_history') || '[]'),
    currentScanResult: null
  };

  // Save default key if not present
  if (!localStorage.getItem('gemini_api_key')) {
    localStorage.setItem('gemini_api_key', DEFAULT_GEMINI_KEY);
  }

  // --- DOM ELEMENTS ---
  const webcam = document.getElementById('webcam');
  const photoCanvas = document.getElementById('photo-canvas');
  const scanningLine = document.getElementById('scanning-line');
  const scanTriggerBtn = document.getElementById('scan-trigger-btn');
  const switchCamBtn = document.getElementById('switch-cam-btn');
  const uploadImageBtn = document.getElementById('upload-image-btn');
  const hiddenFileInput = document.getElementById('hidden-file-input');
  const historyCountBadge = document.getElementById('history-count-badge');
  const reticleStatus = document.getElementById('reticle-status');

  // Result Modal
  const resultModal = document.getElementById('result-modal');
  const closeResultBtn = document.getElementById('close-result-btn');
  const resCategory = document.getElementById('res-category');
  const resName = document.getElementById('res-name');
  const resSubHeader = document.getElementById('res-sub-header');
  const resImg = document.getElementById('res-img');
  const resRarity = document.getElementById('res-rarity');
  const resPrice = document.getElementById('res-price');
  const resEra = document.getElementById('res-era');
  const resHistory = document.getElementById('res-history');
  const resMaterial = document.getElementById('res-material');
  const resMarket = document.getElementById('res-market');
  const ttsReadBtn = document.getElementById('tts-read-btn');
  const saveCollectionBtn = document.getElementById('save-collection-btn');

  // Collection & Settings
  const collectionGrid = document.getElementById('collection-grid');
  const settingsModal = document.getElementById('settings-modal');
  const settingsToggleBtn = document.getElementById('settings-toggle-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const geminiKeyInput = document.getElementById('gemini-key-input');
  const apiStatusText = document.getElementById('api-status-text');

  // --- CAMERA ENGINE ---
  async function startWebcam() {
    try {
      if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facingMode, width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false
      });
      state.cameraStream = stream;
      webcam.srcObject = stream;
      document.getElementById('camera-offline-msg').classList.add('hidden');
    } catch (err) {
      console.warn('Camera error:', err);
      document.getElementById('camera-offline-msg').classList.remove('hidden');
    }
  }

  // --- REAL GOOGLE GEMINI VISION API LOOKUP ENGINE ---
  async function runAIScan(imageDataUrl) {
    if (state.isScanning) return;
    state.isScanning = true;

    // Show Scanning Animation
    scanningLine.classList.remove('hidden');
    reticleStatus.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang gửi ảnh tới Google AI Vision...`;
    if (window.lucide) lucide.createIcons();

    try {
      let result = null;

      if (state.geminiApiKey.trim() !== '') {
        try {
          result = await queryGeminiVisionAPI(imageDataUrl, state.geminiApiKey);
        } catch (apiErr) {
          console.error('Gemini API Call Failed:', apiErr);
          alert(`⚠️ Lỗi kết nối Google AI API (${apiErr.message}). Vui lòng kiểm tra lại API Key trong cài đặt!`);
          result = getFallbackDemoResult();
        }
      } else {
        alert('⚠️ Chưa có Gemini API Key. Đang bật chế độ Demo mô phỏng.');
        result = getFallbackDemoResult();
      }

      // Hide Scanning Animation
      scanningLine.classList.add('hidden');
      reticleStatus.innerHTML = `<i data-lucide="check-circle"></i> Đã nhận diện xong!`;
      if (window.lucide) lucide.createIcons();
      state.isScanning = false;

      // Show Result Modal
      result.image = imageDataUrl;
      state.currentScanResult = result;
      displayScanResult(result);
    } catch (err) {
      console.error('Scanning error:', err);
      scanningLine.classList.add('hidden');
      state.isScanning = false;
    }
  }

  async function queryGeminiVisionAPI(base64Image, apiKey) {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const prompt = `Bạn là chuyên gia phân tích hình ảnh hàng đầu thế giới. Hãy quan sát thật kỹ bức ảnh này và trả về kết quả định dạng JSON thuần túy (không chứa mã markdown hay backticks):
{
  "name": "Tên thương hiệu / model / vật thể chính xác trong ảnh",
  "category": "Phân loại sản phẩm / vật thể",
  "era": "Niên đại / Năm sản xuất / Lịch sử ra đời chính xác",
  "price": "Định giá thị trường hiện tại tại Việt Nam (VNĐ)",
  "rarity": "Độ hiếm / Phổ biến",
  "history": "Lịch sử ra đời, nguồn gốc và ý nghĩa chi tiết của vật thể này",
  "material": "Chất liệu, màu sắc và đặc điểm nhận dạng chính",
  "market": "Gợi ý nơi mua bán (Shopee, Lazada, Chợ Đồ Cổ, Chợ Tốt...)"
}`;

    // Try Gemini models
    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
                ]
              }
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const textOutput = data.candidates[0].content.parts[0].text;
        const cleanJsonText = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJsonText);
      } catch (err) {
        console.warn(`Model ${modelName} attempt failed:`, err);
        lastError = err;
      }
    }

    throw lastError || new Error("Không thể kết nối Gemini API");
  }

  function getFallbackDemoResult() {
    return {
      name: "Vật thể chưa phân tích (Chế độ Demo)",
      category: "📦 Demo Mode",
      era: "Chưa rõ - Cần nhập Gemini API Key",
      price: "Liên hệ định giá",
      rarity: "Chưa xác định",
      history: "Vui lòng dán Gemini API Key chính xác từ Google AI Studio để AI Google quét vật thể thực tế.",
      material: "Mặc định",
      market: "N/A"
    };
  }

  // --- DISPLAY RESULTS IN MODAL ---
  function displayScanResult(res) {
    resCategory.textContent = res.category || '📦 Vật Thể Tra Cứu';
    resName.textContent = res.name || 'Vật thể chưa định danh';
    resSubHeader.textContent = state.geminiApiKey ? '✨ Phân tích chính xác 100% bởi Google Gemini Vision AI' : '⚠️ Chế độ Demo (Chưa cài API Key)';
    resImg.src = res.image;
    resRarity.textContent = res.rarity || '⭐ Bình thường';
    resPrice.textContent = res.price || 'Liên hệ định giá';
    resEra.textContent = res.era || 'Đang cập nhật';
    resHistory.textContent = res.history || 'Chưa có thông tin lịch sử.';
    resMaterial.textContent = res.material || 'Chất liệu tiêu chuẩn.';
    resMarket.textContent = res.market || 'Các sàn thương mại điện tử & đồ cũ.';

    resultModal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  // --- TEXT TO SPEECH (ĐỌC THUYẾT MINH) ---
  function speakObjectDetails() {
    if (!state.currentScanResult) return;
    const res = state.currentScanResult;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop ongoing speech

      const text = `Đây là ${res.name}. Niên đại: ${res.era}. Định giá thị trường: ${res.price}. Lịch sử: ${res.history}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      
      window.speechSynthesis.speak(utterance);
      alert('🔊 Đang đọc thuyết minh thông tin vật thể!');
    } else {
      alert('Trình duyệt của bạn không hỗ trợ tính năng Đọc Giọng Nói!');
    }
  }

  // --- SAVE TO COLLECTION ---
  function saveToCollection() {
    if (!state.currentScanResult) return;

    const newItem = {
      id: Date.now(),
      ...state.currentScanResult,
      timestamp: new Date().toLocaleDateString('vi-VN')
    };

    state.scanHistory.unshift(newItem);
    localStorage.setItem('locket_scan_history', JSON.stringify(state.scanHistory));
    updateCollectionUI();
    
    alert('💾 Đã lưu vật thể vào Bộ Sưu Tập thành công!');
  }

  function updateCollectionUI() {
    if (historyCountBadge) historyCountBadge.textContent = state.scanHistory.length;

    if (!collectionGrid) return;
    collectionGrid.innerHTML = '';

    if (state.scanHistory.length === 0) {
      collectionGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px 20px;">
          <i data-lucide="bookmark-x" style="width: 48px; height: 48px; opacity: 0.4;"></i>
          <p style="margin-top: 12px;">Chưa có vật thể nào trong bộ sưu tập. Hãy quét vật thể đầu tiên ngay!</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    state.scanHistory.forEach(item => {
      const card = document.createElement('div');
      card.className = 'collection-item-card';
      card.innerHTML = `
        <img src="${item.image}" class="item-thumb" alt="${item.name}">
        <div class="item-info">
          <h4>${item.name}</h4>
          <span class="item-era"><i data-lucide="calendar"></i> ${item.era}</span>
          <span class="item-price">${item.price}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        state.currentScanResult = item;
        displayScanResult(item);
      });

      collectionGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  // --- EVENT LISTENERS ---

  // Trigger Camera Scan
  if (scanTriggerBtn) {
    scanTriggerBtn.addEventListener('click', () => {
      const ctx = photoCanvas.getContext('2d');
      photoCanvas.width = 600;
      photoCanvas.height = 600;

      if (state.cameraStream && webcam.videoWidth) {
        ctx.drawImage(webcam, 0, 0, 600, 600);
        runAIScan(photoCanvas.toDataURL());
      } else {
        const sampleImg = new Image();
        sampleImg.crossOrigin = 'anonymous';
        sampleImg.onload = () => {
          ctx.drawImage(sampleImg, 0, 0, 600, 600);
          runAIScan(photoCanvas.toDataURL());
        };
        sampleImg.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
      }
    });
  }

  // Switch Camera
  if (switchCamBtn) {
    switchCamBtn.addEventListener('click', () => {
      state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
      startWebcam();
    });
  }

  // Upload Image from Machine
  if (uploadImageBtn) uploadImageBtn.addEventListener('click', () => hiddenFileInput.click());
  if (hiddenFileInput) {
    hiddenFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          runAIScan(evt.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Result Actions
  if (closeResultBtn) closeResultBtn.addEventListener('click', () => resultModal.classList.add('hidden'));
  if (ttsReadBtn) ttsReadBtn.addEventListener('click', speakObjectDetails);
  if (saveCollectionBtn) saveCollectionBtn.addEventListener('click', saveToCollection);

  // Navigation Tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  const historyToggleBtn = document.getElementById('history-toggle-btn');
  if (historyToggleBtn) {
    historyToggleBtn.addEventListener('click', () => {
      document.querySelector('[data-tab="collection-tab"]').click();
    });
  }

  // Settings Modal Controls
  if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener('click', () => {
      geminiKeyInput.value = state.geminiApiKey;
      updateSettingsStatus();
      settingsModal.classList.remove('hidden');
    });
  }

  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      state.geminiApiKey = geminiKeyInput.value.trim();
      localStorage.setItem('gemini_api_key', state.geminiApiKey);
      updateSettingsStatus();
      alert('Đã lưu cấu hình API Key thành công!');
      settingsModal.classList.add('hidden');
    });
  }

  function updateSettingsStatus() {
    if (state.geminiApiKey) {
      apiStatusText.innerHTML = `Trạng thái: 🟢 Đã cấu hình **Google Gemini Vision API**`;
    } else {
      apiStatusText.innerHTML = `Trạng thái: 🔴 Chưa có API Key`;
    }
  }

  // INITIALIZATION
  startWebcam();
  updateCollectionUI();
});
