// Locket AI Web App Main Script
document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- STATE MANAGEMENT ---
  const state = {
    isVIP: localStorage.getItem('locket_vip') === 'true',
    currentTab: 'camera-tab',
    cameraStream: null,
    facingMode: 'user', // 'user' or 'environment'
    capturedImageData: null,
    
    // Meme Editor state
    activePreset: 'vtv',
    topText: '',
    bottomText: '',
    stickers: [],
    
    // TikTok Audio state
    isPlayingAudio: false,
    currentTrackIndex: 0,
    tracks: [
      {
        name: 'Vinahouse TikTok Remix 2026',
        genre: 'Trending Vinahouse Dance',
        vibe: 'Cực sôi động, hợp chế ảnh quẩy',
        type: 'synth-vinahouse'
      },
      {
        name: 'Nhạc Conan Kịch Tính (Drama Theme)',
        genre: 'Suspense Detective',
        vibe: 'Phù hợp bản tin VTV & Truy Nã',
        type: 'conan-drama'
      },
      {
        name: 'Circus Clown Comedy (Nhạc Xiếc Hài)',
        genre: 'Slapstick Comedy',
        vibe: 'Phù hợp hội thất nghiệp & chế hài',
        type: 'circus-clown'
      },
      {
        name: 'TikTok Transformation Bass Drop',
        genre: 'Super Beat Drop',
        vibe: 'Hợp Flexing & Thug Life',
        type: 'bass-drop'
      },
      {
        name: 'Sad Cat Piano (Nhạc Mèo Khóc Hài)',
        genre: 'Emotional Piano Meme',
        vibe: 'Phù hợp hội hết tiền & thất tình',
        type: 'sad-piano'
      }
    ],

    // Feed items
    feedPosts: JSON.parse(localStorage.getItem('locket_feed_posts') || '[]')
  };

  // --- DOM ELEMENTS ---
  const webcam = document.getElementById('webcam');
  const photoCanvas = document.getElementById('photo-canvas');
  const memeCanvas = document.getElementById('meme-canvas');
  const flashEffect = document.getElementById('flash-effect');
  const shutterBtn = document.getElementById('shutter-btn');
  const switchCamBtn = document.getElementById('switch-cam-btn');
  const galleryBtn = document.getElementById('gallery-btn');
  const hiddenFileInput = document.getElementById('hidden-file-input');
  
  // VIP Elements
  const vipStatusBtn = document.getElementById('vip-status-btn');
  const vipStatusText = document.getElementById('vip-status-text');
  const galleryLockIcon = document.getElementById('gallery-lock-icon');
  const momoModal = document.getElementById('momo-modal');
  const closeMomoBtn = document.getElementById('close-momo-btn');
  const sandboxUnlockBtn = document.getElementById('sandbox-unlock-btn');
  const verifyTxnBtn = document.getElementById('verify-txn-btn');
  const txnIdInput = document.getElementById('txn-id-input');

  // Meme Modal Elements
  const memeModal = document.getElementById('meme-modal');
  const closeMemeBtn = document.getElementById('close-meme-btn');
  const postLocketBtn = document.getElementById('post-locket-btn');
  const downloadMemeBtn = document.getElementById('download-meme-btn');
  const retakePhotoBtn = document.getElementById('retake-photo-btn');
  const topTextInput = document.getElementById('top-text-input');
  const bottomTextInput = document.getElementById('bottom-text-input');

  // Audio Elements
  const playPauseBtn = document.getElementById('play-pause-btn');
  const nextTrackBtn = document.getElementById('next-track-btn');
  const activeSongTitle = document.getElementById('active-song-title');
  const playerTrackName = document.getElementById('player-track-name');
  const playerTrackGenre = document.getElementById('player-track-genre');
  const vinylDisc = document.getElementById('vinyl-disc');
  const playIcon = document.getElementById('play-icon');

  // Feed & Widget
  const feedList = document.getElementById('feed-list');
  const widgetImg = document.getElementById('widget-img');
  const widgetCaption = document.getElementById('widget-caption');
  const widgetSongTitle = document.getElementById('widget-song-title');

  // --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
  let audioCtx = null;
  let currentOscillator = null;

  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play synthetic sound effects
  function playSoundFX(type) {
    initAudioContext();
    const now = audioCtx.currentTime;

    if (type === 'shutter') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'laugh') {
      // Funny laughing synth pattern
      [300, 450, 350, 500, 380, 480].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.08);
      });
    } else if (type === 'ohno') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'conan') {
      // Dramatic Conan detective chord
      [220, 277, 330, 440].forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      });
    } else if (type === 'quack') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  // TikTok Audio Loop simulation using Web Audio synth patterns
  let trackTimer = null;
  function startTikTokTrackLoop() {
    stopTikTokTrackLoop();
    initAudioContext();
    
    state.isPlayingAudio = true;
    updateAudioUI();

    const track = state.tracks[state.currentTrackIndex];
    let beatStep = 0;

    trackTimer = setInterval(() => {
      if (!state.isPlayingAudio) return;
      const now = audioCtx.currentTime;

      if (track.type === 'synth-vinahouse') {
        // Vinahouse fast kick & synth beat
        const kick = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        kick.frequency.setValueAtTime(140, now);
        kick.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        kick.connect(gain);
        gain.connect(audioCtx.destination);
        kick.start(now);
        kick.stop(now + 0.08);

        if (beatStep % 2 === 1) {
          const synth = audioCtx.createOscillator();
          const sgain = audioCtx.createGain();
          synth.type = 'sawtooth';
          synth.frequency.setValueAtTime(440 + (beatStep % 4) * 110, now);
          sgain.gain.setValueAtTime(0.15, now);
          sgain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          synth.connect(sgain);
          sgain.connect(audioCtx.destination);
          synth.start(now);
          synth.stop(now + 0.1);
        }
      } else if (track.type === 'conan-drama') {
        // Detective suspense violin notes
        const note = [440, 466, 440, 415][beatStep % 4];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Generic bounce beat
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + (beatStep % 3) * 100, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }

      beatStep++;
    }, 240);
  }

  function stopTikTokTrackLoop() {
    state.isPlayingAudio = false;
    if (trackTimer) {
      clearInterval(trackTimer);
      trackTimer = null;
    }
    updateAudioUI();
  }

  function updateAudioUI() {
    const track = state.tracks[state.currentTrackIndex];
    if (playerTrackName) playerTrackName.textContent = track.name;
    if (playerTrackGenre) playerTrackGenre.textContent = `Thể loại: ${track.genre}`;
    if (activeSongTitle) activeSongTitle.textContent = `Phát nhạc: ${track.name}`;

    if (vinylDisc) {
      if (state.isPlayingAudio) {
        vinylDisc.style.animationPlayState = 'running';
      } else {
        vinylDisc.style.animationPlayState = 'paused';
      }
    }

    if (playIcon) {
      playIcon.setAttribute('data-lucide', state.isPlayingAudio ? 'pause' : 'play');
      if (window.lucide) lucide.createIcons();
    }
  }

  // --- VIP STATUS FUNCTIONS ---
  function updateVIPUI() {
    if (state.isVIP) {
      vipStatusBtn.className = 'vip-badge status-vip';
      vipStatusText.textContent = 'VIP: Đã Mở Khóa Upload';
      galleryLockIcon.style.display = 'none';
      if (window.lucide) lucide.createIcons();
    } else {
      vipStatusBtn.className = 'vip-badge status-free';
      vipStatusText.textContent = 'Khóa Upload Thư Viện';
      galleryLockIcon.style.display = 'flex';
    }
  }

  function unlockVIPStatus() {
    state.isVIP = true;
    localStorage.setItem('locket_vip', 'true');
    updateVIPUI();
    momoModal.classList.add('hidden');
    
    alert('🎉 Chúc mừng! Bạn đã mở khóa tính năng VIP Upload Thư Viện thành công!');
    hiddenFileInput.click();
  }

  // --- CAMERA FUNCTIONS ---
  async function startWebcam() {
    try {
      if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: state.facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      state.cameraStream = stream;
      webcam.srcObject = stream;
      document.getElementById('camera-offline-msg').classList.add('hidden');
    } catch (err) {
      console.warn('Webcam initialization warning:', err);
      document.getElementById('camera-offline-msg').classList.remove('hidden');
    }
  }

  function snapPhoto() {
    playSoundFX('shutter');

    // Trigger flash animation
    flashEffect.classList.add('active');
    setTimeout(() => flashEffect.classList.remove('active'), 200);

    const ctx = photoCanvas.getContext('2d');
    photoCanvas.width = 600;
    photoCanvas.height = 600;

    if (state.cameraStream && webcam.videoWidth) {
      ctx.drawImage(webcam, 0, 0, 600, 600);
    } else {
      // Fallback demo selfie image if camera is disabled in environment
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 600, 600);
        openMemeEditor(photoCanvas.toDataURL());
      };
      img.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
      return;
    }

    state.capturedImageData = photoCanvas.toDataURL();
    openMemeEditor(state.capturedImageData);
  }

  // --- MEME EDITOR & CANVAS GENERATOR ---
  function openMemeEditor(imageData) {
    state.capturedImageData = imageData;
    memeModal.classList.remove('hidden');

    // Apply default preset text
    applyPresetTexts(state.activePreset);
    renderMemeCanvas();
    startTikTokTrackLoop();
  }

  function applyPresetTexts(preset) {
    state.activePreset = preset;
    
    if (preset === 'vtv') {
      topTextInput.value = 'BẢN TIN DRAMA HOT 24H';
      bottomTextInput.value = 'Phát hiện đối tượng đang nhìn chằm chằm màn hình';
      state.currentTrackIndex = 1; // Conan Drama
    } else if (preset === 'truyna') {
      topTextInput.value = 'TRUY NÃ KHẨN CẤP POLICE';
      bottomTextInput.value = 'Tội danh: Quá đẹp trai gây xao xuyến xóm trọ';
      state.currentTrackIndex = 1;
    } else if (preset === 'thatnghiep') {
      topTextInput.value = 'HỘI THẤT NGHIỆP QUỐC GIA';
      bottomTextInput.value = 'Bằng thạc sĩ nhưng đang chờ trà đá cứu viện';
      state.currentTrackIndex = 2; // Circus clown
    } else if (preset === 'flex') {
      topTextInput.value = 'FLEXING SANG CHẢNH 2026';
      bottomTextInput.value = 'Dùng máy 30 triệu nhưng tài khoản còn 5k MoMo';
      state.currentTrackIndex = 3; // Bass drop
    } else if (preset === 'nguoicaotuoi') {
      topTextInput.value = 'HỘI NGƯỜI CAO TUỔI KÍNH CHÚC';
      bottomTextInput.value = 'Chúc buổi sáng bình an - Cát tường - Hạnh phúc';
      state.currentTrackIndex = 4; // Sad piano
    } else if (preset === 'thuglife') {
      topTextInput.value = 'THUG LIFE 8-BIT MEME';
      bottomTextInput.value = 'Gặp là nể, quẩy Vinahouse hết nấc';
      state.currentTrackIndex = 0; // Vinahouse
    }

    state.topText = topTextInput.value;
    state.bottomText = bottomTextInput.value;
  }

  function renderMemeCanvas() {
    if (!state.capturedImageData) return;

    const ctx = memeCanvas.getContext('2d');
    const baseImg = new Image();
    
    baseImg.onload = () => {
      memeCanvas.width = 600;
      memeCanvas.height = 600;

      // 1. Draw Base Photo
      ctx.drawImage(baseImg, 0, 0, 600, 600);

      // 2. Draw Preset Overlays / Frames
      if (state.activePreset === 'vtv') {
        // Red news banner top
        ctx.fillStyle = 'rgba(216, 0, 39, 0.85)';
        ctx.fillRect(0, 0, 600, 60);

        // VTV24 Badge
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px Montserrat, sans-serif';
        ctx.fillText('VTV 24', 20, 40);

        // Live dot
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(560, 30, 8, 0, Math.PI * 2);
        ctx.fill();

        // Bottom news ticker bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 500, 600, 100);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(0, 500, 600, 6);
      } else if (state.activePreset === 'truyna') {
        // Vintage Wanted Poster Frame Overlay
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#d82d8b';
        ctx.strokeRect(10, 10, 580, 580);
      } else if (state.activePreset === 'nguoicaotuoi') {
        // Golden Flower Border Effect
        ctx.lineWidth = 16;
        ctx.strokeStyle = '#ffcc00';
        ctx.strokeRect(8, 8, 584, 584);
      }

      // 3. Render Top & Bottom Meme Typography
      ctx.textAlign = 'center';

      // Top Text
      if (state.topText) {
        ctx.font = '900 28px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText(state.topText.toUpperCase(), 300, 50);
        ctx.fillText(state.topText.toUpperCase(), 300, 50);
      }

      // Bottom Text
      if (state.bottomText) {
        ctx.font = '800 24px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#ffcc00';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText(state.bottomText, 300, 560);
        ctx.fillText(state.bottomText, 300, 560);
      }

      // Locket Watermark Badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(15, 555, 120, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 12px Montserrat, sans-serif';
      ctx.fillText('⚡ LOCKET AI', 75, 575);
    };

    baseImg.src = state.capturedImageData;
  }

  // --- POST TO FEED & WIDGET SIMULATOR ---
  function postToLocketFeed() {
    const memeDataUrl = memeCanvas.toDataURL();
    const currentTrack = state.tracks[state.currentTrackIndex];

    const newPost = {
      id: Date.now(),
      author: 'Nguyễn Văn Tân (Bạn)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      time: 'Vừa xong',
      image: memeDataUrl,
      song: currentTrack.name,
      caption: state.bottomText || 'Meme Locket cực chất 🔥',
      reactions: { heart: 12, laugh: 45, fire: 8 }
    };

    state.feedPosts.unshift(newPost);
    localStorage.setItem('locket_feed_posts', JSON.stringify(state.feedPosts));

    // Update Widget Preview
    if (widgetImg) widgetImg.src = memeDataUrl;
    if (widgetCaption) widgetCaption.textContent = `🔥 ${newPost.caption}`;
    if (widgetSongTitle) widgetSongTitle.textContent = `Music: ${currentTrack.name}`;

    renderFeedList();
    memeModal.classList.add('hidden');
    stopTikTokTrackLoop();

    // Switch to feed tab to celebrate!
    switchTab('feed-tab');
    alert('🚀 Đã đăng khoảnh khắc chế ảnh hài lên Locket Feed & Widget iPhone thành công!');
  }

  function renderFeedList() {
    if (!feedList) return;
    feedList.innerHTML = '';

    if (state.feedPosts.length === 0) {
      feedList.innerHTML = `
        <div class="empty-feed" style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
          <i data-lucide="image-off" style="width: 48px; height: 48px; opacity: 0.4;"></i>
          <p style="margin-top: 12px;">Chưa có bài đăng nào. Hãy chụp ảnh đầu tiên ngay!</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    state.feedPosts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'feed-card';
      card.innerHTML = `
        <div class="feed-author">
          <img src="${post.avatar}" class="author-avatar" alt="Avatar">
          <div>
            <div class="author-name">${post.author}</div>
            <div class="post-time">${post.time}</div>
          </div>
        </div>

        <div class="feed-media">
          <img src="${post.image}" alt="Locket Post">
          <div class="feed-audio-bar">
            <span>🎵 ${post.song}</span>
            <i data-lucide="volume-2"></i>
          </div>
        </div>

        <div class="feed-reactions">
          <button class="reaction-btn" data-type="heart">❤️ <span>${post.reactions.heart}</span></button>
          <button class="reaction-btn" data-type="laugh">😂 <span>${post.reactions.laugh}</span></button>
          <button class="reaction-btn" data-type="fire">🔥 <span>${post.reactions.fire}</span></button>
          <button class="reaction-btn" data-type="poop">💩 <span>9</span></button>
        </div>
      `;

      // Reaction sound effects
      card.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-type');
          if (type === 'laugh') playSoundFX('laugh');
          else if (type === 'fire') playSoundFX('ohno');
          else playSoundFX('quack');

          const countSpan = btn.querySelector('span');
          if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
          }
        });
      });

      feedList.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  // --- TAB SWITCHER ---
  function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.tab-page').forEach(page => {
      page.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabId) btn.classList.add('active');
    });

    const targetPage = document.getElementById(tabId);
    if (targetPage) targetPage.classList.add('active');
  }

  // --- EVENT LISTENERS ---

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Shutter Capture
  if (shutterBtn) shutterBtn.addEventListener('click', snapPhoto);

  // Switch Camera
  if (switchCamBtn) {
    switchCamBtn.addEventListener('click', () => {
      state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
      startWebcam();
    });
  }

  // Gallery Upload Click (VIP check)
  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      if (state.isVIP) {
        hiddenFileInput.click();
      } else {
        momoModal.classList.remove('hidden');
      }
    });
  }

  // File Input Change
  if (hiddenFileInput) {
    hiddenFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          openMemeEditor(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // MoMo VIP Modal Controls
  if (closeMomoBtn) closeMomoBtn.addEventListener('click', () => momoModal.classList.add('hidden'));
  if (vipStatusBtn) {
    vipStatusBtn.addEventListener('click', () => {
      if (!state.isVIP) momoModal.classList.remove('hidden');
      else alert('✨ Bạn đang sở hữu Tài khoản VIP Locket!');
    });
  }
  if (sandboxUnlockBtn) sandboxUnlockBtn.addEventListener('click', unlockVIPStatus);
  if (verifyTxnBtn) {
    verifyTxnBtn.addEventListener('click', () => {
      const txnVal = txnIdInput.value.trim();
      if (txnVal.length >= 6) {
        unlockVIPStatus();
      } else {
        alert('Vui lòng nhập Mã Giao Dịch MoMo hợp lệ (ví dụ: 394810294)!');
      }
    });
  }

  // Meme Modal Controls
  if (closeMemeBtn) {
    closeMemeBtn.addEventListener('click', () => {
      memeModal.classList.add('hidden');
      stopTikTokTrackLoop();
    });
  }

  if (retakePhotoBtn) {
    retakePhotoBtn.addEventListener('click', () => {
      memeModal.classList.add('hidden');
      stopTikTokTrackLoop();
    });
  }

  if (postLocketBtn) postLocketBtn.addEventListener('click', postToLocketFeed);

  if (downloadMemeBtn) {
    downloadMemeBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `locket-meme-${Date.now()}.png`;
      link.href = memeCanvas.toDataURL();
      link.click();
    });
  }

  // Meme Preset Buttons
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const preset = card.getAttribute('data-preset');
      applyPresetTexts(preset);
      renderMemeCanvas();
      startTikTokTrackLoop();
    });
  });

  // Tool Tabs
  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tool-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const toolId = `tool-${btn.getAttribute('data-tool')}`;
      document.getElementById(toolId).classList.add('active');
    });
  });

  // Text Inputs
  if (topTextInput) {
    topTextInput.addEventListener('input', (e) => {
      state.topText = e.target.value;
      renderMemeCanvas();
    });
  }
  if (bottomTextInput) {
    bottomTextInput.addEventListener('input', (e) => {
      state.bottomText = e.target.value;
      renderMemeCanvas();
    });
  }

  // Music Controls
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (state.isPlayingAudio) {
        stopTikTokTrackLoop();
      } else {
        startTikTokTrackLoop();
      }
    });
  }

  if (nextTrackBtn) {
    nextTrackBtn.addEventListener('click', () => {
      state.currentTrackIndex = (state.currentTrackIndex + 1) % state.tracks.length;
      startTikTokTrackLoop();
    });
  }

  // SFX Buttons
  document.querySelectorAll('.sfx-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sfx = btn.getAttribute('data-sfx');
      playSoundFX(sfx);
    });
  });

  // Settings Modal Controls
  const settingsToggleBtn = document.getElementById('settings-toggle-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');

  if (settingsToggleBtn) settingsToggleBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      alert('Đã lưu cấu hình AI thành công!');
      settingsModal.classList.add('hidden');
    });
  }

  // INITIALIZATION
  updateVIPUI();
  startWebcam();
  renderFeedList();
});
