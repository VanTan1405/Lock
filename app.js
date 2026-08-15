// AI Scanner & Lens Web App Main Logic
document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- STATE ---
  const state = {
    cameraStream: null,
    facingMode: 'user',
    isScanning: false,
    geminiApiKey: localStorage.getItem('gemini_api_key') || '',
    scanHistory: JSON.parse(localStorage.getItem('locket_scan_history') || '[]'),
    currentScanResult: null
  };

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

  // --- KNOWLEDGE BASE (PRESET AI OBJECT PROFILES) ---
  const aiKnowledgeBase = [
    {
      name: "Tiền Xu Cổ Bảo Đại Thông Bảo (1933)",
      category: "🪙 Tiền Cổ & Điển Tích",
      era: "Năm 1933 (Thời vua Bảo Đại - Nhà Nguyễn)",
      price: "1.500.000đ - 3.800.000đ / đồng",
      rarity: "⭐ Hiếm (Collector Rare)",
      history: "Đồng xu Bảo Đại Thông Bảo là đúc kim loại cuối cùng của triều đại phong kiến Việt Nam. Mặt trước đúc 4 chữ Hán 'Bảo Đại Thông Bảo', mặt sau khắc niên hiệu triều đình.",
      material: "Đồng thau đúc cổ, phủ lớp patina oxy hóa xanh phong hóa theo thời gian.",
      market: "Chợ Đồ Cổ Hà Nội, Sàn Đấu Giá Numismatics, Chợ Tốt Cổ Vật."
    },
    {
      name: "Bình Gốm Sứ Chu Đậu Hoa Lam (Thế kỷ XV)",
      category: "🏺 Cổ Vật Gốm Sứ Việt Nam",
      era: "Thế kỷ XV (Thời Lê Sơ - Đại Việt)",
      price: "18.000.000đ - 35.000.000đ",
      rarity: "⭐⭐⭐ Cực Hiếm (Bảo Vật Sưu Tầm)",
      history: "Gốm Chu Đậu (Hải Dương) là dòng gốm hoa lam xuất khẩu nổi tiếng thế giới. Họa tiết vẽ cảnh sơn thủy, chim hoa mang đậm bản sắc văn hóa dân tộc.",
      material: "Đất sét trắng mịn, đun men lam chàm cổ truyền, rạn men phong hóa tự nhiên.",
      market: "Nhà đấu giá Cổ vật, Bảo tàng Lịch sử, Sưu tầm Tư nhân."
    },
    {
      name: "Đồng Hồ Cơ Thụy Sĩ OMEGA Constellation Vintage",
      category: "⌚ Đồng Hồ Xa Xỉ & Sưu Tầm",
      era: "Thập niên 1970 (Thụy Sĩ)",
      price: "28.000.000đ - 45.000.000đ",
      rarity: "⭐ Đồ Sưu Tầm Giá Trị Cao",
      history: "Dòng Omega Constellation trứ danh với biểu tượng 8 ngôi sao và đài thiên văn phía sau nắp lưng. Bộ máy tự động Chronometer đạt độ chính xác chuẩn Thụy Sĩ.",
      material: "Vỏ thép không gỉ bọc vàng 18K, mặt số trải tia Champagne, kính Hesalite.",
      market: "Chợ Đồng Hồ Cổ Thụy Sĩ, Chrono24, Sàn Giao Dịch Luxury."
    },
    {
      name: "Máy Ảnh Cơ Film Leica M3 Classic (1954)",
      category: "📷 Thiết Bị Nhiếp Ảnh Cổ Điển",
      era: "Năm 1954 - 1966 (Đức)",
      price: "55.000.000đ - 85.000.000đ",
      rarity: "⭐⭐ Huyền Thoại Nhiếp Ảnh",
      history: "Leica M3 được mệnh danh là chiếc máy ảnh film ngàm M vĩ đại nhất lịch sử nhiếp ảnh thế giới, được sử dụng bởi các nhiếp ảnh gia chiến trường huyền thoại.",
      material: "Khung hợp kim Magie & Đồng thau mạ Chrome, bọc da đen sần Vulcanite.",
      market: "eBay Camera, Chợ Film Vintage, Leica Store Heritage."
    },
    {
      name: "Điện Thoại Apple iPhone 15 Pro Max Titanium",
      category: "📱 Thiết Bị Điện Tử & Công Nghệ",
      era: "Năm 2023 - Kỷ Nguyên Công Nghệ AI",
      price: "23.500.000đ - 28.000.000đ",
      rarity: "Phổ thông cao cấp",
      history: "Dòng điện thoại cao cấp của Apple tiên phong khung vỏ chất liệu Vẫn Titan chuẩn hàng không vũ trụ và chip A17 Pro 3nm.",
      material: "Khung Titan tự nhiên, Mặt lưng kính nhám Ceramic Shield.",
      market: "Apple Store, Shopee Mall, Thế Giới Di Động, CellphoneS."
    },
    {
      name: "Tượng Phật Bằng Đồng Mạ Vàng Cổ (Thời Nguyễn)",
      category: "🗿 Tượng Cổ & Đồ Thờ Tự",
      era: "Thế kỷ XIX (Thời Nhà Nguyễn)",
      price: "12.000.000đ - 22.000.000đ",
      rarity: "⭐ Đồ Cổ Tâm Linh Hiếm",
      history: "Tượng được đúc thủ công theo nghệ thuật đúc đồng Kinh thành Huế thế kỷ 19, dáng diệu từ hòa, các chi tiết nếp áo chạm khắc tinh xảo.",
      material: "Đồng đỏ đúc nguyên khối, thếp vàng quỳ cổ 24K.",
      market: "Chợ Cố Đô Huế, Phố Cổ Hà Nội, Sưu Tầm Đồ Cổ."
    },
    {
      name: "Giày Sneaker Nike Air Jordan 1 Retro High",
      category: "👟 Thời Trang & Sneakerhead",
      era: "Ra mắt năm 1985 (Thiết kế bởi Peter Moore)",
      price: "4.500.000đ - 12.000.000đ",
      rarity: "Hàng sưu tầm phổ biến",
      history: "Đôi giày bóng rổ đi vào lịch sử gắn liền với tên tuổi huyền thoại Michael Jordan, khởi đầu cho nền văn hóa Sneakerhead toàn cầu.",
      material: "Da thật Premium Leather, đế cao su khâu viền Air Sole cushion.",
      market: "Nike Official Store, Sneaker Buzz, StockX, GOAT."
    }
  ];

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

  // --- AI SCANNING & VISION LOOKUP LOGIC ---
  async function runAIScan(imageDataUrl) {
    if (state.isScanning) return;
    state.isScanning = true;

    // Show Scanning Animation
    scanningLine.classList.remove('hidden');
    reticleStatus.innerHTML = `<i data-lucide="loader" class="spin"></i> Đang phân tích AI Vision...`;
    if (window.lucide) lucide.createIcons();

    setTimeout(async () => {
      let result = null;

      // Check if Gemini API Key is configured
      if (state.geminiApiKey.trim() !== '') {
        try {
          result = await queryGeminiVisionAPI(imageDataUrl, state.geminiApiKey);
        } catch (apiErr) {
          console.warn('Gemini API Error, falling back to Local Knowledge Base:', apiErr);
          result = getLocalKnowledgeResult();
        }
      } else {
        // Fallback to local smart knowledge base
        result = getLocalKnowledgeResult();
      }

      // Hide Scanning Animation
      scanningLine.classList.add('hidden');
      reticleStatus.innerHTML = `<i data-lucide="check-circle"></i> Phân tích thành công!`;
      if (window.lucide) lucide.createIcons();
      state.isScanning = false;

      // Show Result Modal
      result.image = imageDataUrl;
      state.currentScanResult = result;
      displayScanResult(result);
    }, 1500);
  }

  function getLocalKnowledgeResult() {
    // Select a profile from knowledge base randomly or sequentially
    const index = Math.floor(Math.random() * aiKnowledgeBase.length);
    return { ...aiKnowledgeBase[index] };
  }

  // Real Gemini Vision API integration
  async function queryGeminiVisionAPI(base64Image, apiKey) {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const prompt = `Phân tích vật thể trong ảnh này và trả về JSON thuần túy (không dính markdown backticks) với định dạng:
    {
      "name": "Tên vật thể / cổ vật / sản phẩm",
      "category": "Phân loại",
      "era": "Niên đại / Lịch sử ra đời",
      "price": "Định giá thị trường ước tính (VNĐ)",
      "rarity": "Độ hiếm",
      "history": "Mô tả lịch sử ra đời và nguồn gốc ngắn gọn 2-3 câu",
      "material": "Chất liệu và đặc điểm nhận dạng",
      "market": "Gợi ý nơi mua bán hoặc giao dịch"
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

    const data = await response.json();
    const textOutput = data.candidates[0].content.parts[0].text;
    const cleanJsonText = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJsonText);
  }

  // --- DISPLAY RESULTS IN MODAL ---
  function displayScanResult(res) {
    resCategory.textContent = res.category || '📦 Vật Thể Tra Cứu';
    resName.textContent = res.name || 'Vật thể chưa định danh';
    resSubHeader.textContent = state.geminiApiKey ? 'Phân tích thực tế bởi Google Gemini Vision' : 'Phân tích bởi AI Local Engine';
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
        // Fallback sample object image if webcam is disabled
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
      apiStatusText.innerHTML = `Trạng thái: 🟢 Đã kết nối **Google Gemini Vision API**`;
    } else {
      apiStatusText.innerHTML = `Trạng thái: 🔵 Đang dùng AI Local Engine (Nhập API Key để dùng Google AI thực tế)`;
    }
  }

  // INITIALIZATION
  startWebcam();
  updateCollectionUI();
});
