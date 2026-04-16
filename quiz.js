/**
 * EdTech Quiz - Tích hợp Chế độ Luyện Tập Từng Câu (Step-by-step), Quản lý Avatar, Upload, Đếm lượt, Gacha
 */

// ==========================================
// CẤU HÌNH ĐỀ THI VÀ DATABASE
// ==========================================
const QUIZ_LIST = [
    { id: "tieng_anh1", title: "Đề 1 Tiếng Anh", file: "tieng_anh1.txt" },
    { id: "tieng_anh2", title: "Đề 2 Tiếng Anh", file: "tieng_anh2.txt" },
    { id: "tieng_anh3", title: "Đề 3 Tiếng Anh", file: "tieng_anh3.txt" },
    { id: "tieng_anh4", title: "Đề 4 Tiếng Anh", file: "tieng_anh4.txt" },
    { id: "gdqpan", title: "Giáo Dục Quốc Phòng An Ninh", file: "gdqpan.txt" }
];

const FIREBASE_BASE_URL = "https://ontap-59972-default-rtdb.firebaseio.com";

const AVATAR_LINKS = {
    default: "https://i.postimg.cc/hj8DCTpQ/01af2884a28422c9b0b74d770b7d49e0.jpg",
    aneka: "https://i.postimg.cc/nrHHNrPc/1aa831227f9ddd8af411d903c205e3bb.jpg",
    nala: "https://i.postimg.cc/ZnTTXnM3/581328a1c0b2821d7b282ba65c07b731.jpg",
    oliver: "https://i.postimg.cc/gJyzM8Nw/5b722aa3543f18499b6f8c9eedb661e9.jpg",
    jack: "https://i.postimg.cc/D022R0MG/8042a652a469ac4ecb517b023509acc8.jpg",
    mimi: "https://i.postimg.cc/63VWHnY8/805d935d7af9351a34ac6be41f078024.jpg",
    loki: "https://i.postimg.cc/vB7YPf3c/85fdab604c083ecb008d748e1e5bd9ef.jpg",
    garfield: "https://i.postimg.cc/NM8sNmp9/999f5c55e020fcee41e97b1036a6640b.jpg",
    
    // Avatar trong Vòng quay Gacha
    dragon: "https://i.postimg.cc/cJ2hD86z/485f964065a681bc5934c43411bca2cd.jpg",
    king: "https://i.postimg.cc/FK8pPJ1n/4c6373c11fecb852b7b9a1c7c47ebed5.jpg",
    ninja: "https://i.postimg.cc/Zq2Hfy0s/5aca1be41a9439084cae3862a2b49689.jpg",
    cat: "https://i.postimg.cc/CKX7vfdQ/866679d7609c49c687c34b2bf0f22166.jpg"
};

const AVATAR_SEEDS_ARRAY = [
    AVATAR_LINKS.default, AVATAR_LINKS.aneka, AVATAR_LINKS.nala, AVATAR_LINKS.oliver, 
    AVATAR_LINKS.jack, AVATAR_LINKS.mimi, AVATAR_LINKS.loki, AVATAR_LINKS.garfield
];

const GACHA_POOL = [
    { id: 'mythic-1', type: 'border', name: 'Viền Thần Thoại (Mythic)', chance: 1, class: 'border-mythic', icon: '✨', desc: 'Hiệu ứng cầu vồng lấp lánh cực hiếm (1%)!' },
    { id: 'avatar-dragon', type: 'avatar', name: 'Avatar Rồng Thần', chance: 3, url: AVATAR_LINKS.dragon, icon: '💜', desc: 'Ảnh đại diện Tel Thứ Nguyên Vệ Thần (3%).' },
    { id: 'legendary-1', type: 'border', name: 'Viền Truyền Thuyết (Legendary)', chance: 6, class: 'border-legendary', icon: '🌟', desc: 'Viền vàng lấp lánh quyền lực (6%).' },
    { id: 'avatar-king', type: 'avatar', name: 'Avatar Quân Vương', chance: 10, url: AVATAR_LINKS.king, icon: '👑', desc: 'Ricter Quang Vinh (10%).' },
    { id: 'epic-1', type: 'border', name: 'Viền Sử Thi (Epic)', chance: 15, class: 'border-epic', icon: '🔮', desc: 'Viền tím ma thuật huyền bí (15%).' },
    { id: 'avatar-ninja', type: 'avatar', name: 'Avatar Nhẫn Giả', chance: 20, url: AVATAR_LINKS.ninja, icon: '🔥', desc: 'Lorion Hoả Ngục (20%).' },
    { id: 'avatar-cat', type: 'avatar', name: 'Avatar Hoàng Thượng', chance: 20, url: AVATAR_LINKS.cat, icon: '❄️', desc: 'Triêụ Vân Băng Tuyết (20%).' },
    { id: 'rare-1', type: 'border', name: 'Viền Hiếm (Rare)', chance: 25, class: 'border-rare', icon: '💎', desc: 'Viền xanh dương nổi bật (25%).' }
];

document.addEventListener("DOMContentLoaded", () => {
    let currentQuiz = null; let questions = []; let startTime = null; let timerInterval = null;
    let cropper = null; let quizStats = {}; 
    
    // Khởi tạo state
    let userName = localStorage.getItem('quiz_username') || "";
    let userAvatar = AVATAR_LINKS.default; let customAvatar = null; 
    let userBorder = "border-none"; let userKeys = 0;
    let unlockedAvatars = [...AVATAR_SEEDS_ARRAY]; let unlockedBorders = ['border-none'];
    let redeemedCodes = [];

    // STATE CHẾ ĐỘ LUYỆN TẬP
    let isPracticeMode = false;

    const displayUserAvatar = document.getElementById('display-user-avatar');
    const displayUserName = document.getElementById('display-user-name');
    const displayKeys = document.getElementById('display-keys');
    const mainHeader = document.getElementById('main-header');
    const timerDisplay = document.getElementById('timer-display');
    const timerSpan = timerDisplay.querySelector('span');

    // Nút chuyển đổi chế độ Sảnh Chờ
    const modeToggleBtn = document.getElementById('mode-toggle-btn');
    modeToggleBtn.addEventListener('click', () => {
        isPracticeMode = !isPracticeMode;
        if (isPracticeMode) {
            modeToggleBtn.innerHTML = '🔄 Chế độ: <b>Luyện tập (Từng câu)</b>';
            modeToggleBtn.style.color = '#8b5cf6'; modeToggleBtn.style.borderColor = '#8b5cf6';
        } else {
            modeToggleBtn.innerHTML = '🔄 Chế độ: <b>Thi thử (Toàn bộ)</b>';
            modeToggleBtn.style.color = 'var(--primary-color)'; modeToggleBtn.style.borderColor = 'var(--primary-color)';
        }
    });

    initApp();

    async function initApp() {
        if (userName) {
            await syncDataFromFirebase(); updateUIHeader(); initLobby();
        } else {
            renderAvatarSelector(); showSection('login'); mainHeader.classList.add('hidden');
        }
    }

    async function syncDataFromFirebase() {
        try {
            const res = await fetch(`${FIREBASE_BASE_URL}/users/${userName.toLowerCase()}.json`);
            const data = await res.json();
            if (data) {
                userAvatar = fixBrokenAvatarURL(data.avatar || userAvatar); customAvatar = data.customAvatar || null;
                userBorder = data.border || userBorder; userKeys = data.keys || 0;
                let loadedAvatars = data.unlockedAvatars || unlockedAvatars;
                unlockedAvatars = loadedAvatars.map(url => fixBrokenAvatarURL(url));
                unlockedBorders = data.unlockedBorders || unlockedBorders;
                redeemedCodes = data.redeemedCodes || [];
            } else { await pushDataToFirebase(); }
        } catch (e) { console.error("Lỗi đồng bộ:", e); }
    }

    function fixBrokenAvatarURL(url) {
        if(!url) return AVATAR_LINKS.default; if(url.startsWith('data:image')) return url; 
        if (url.includes('Dragon')) return AVATAR_LINKS.dragon; if (url.includes('King')) return AVATAR_LINKS.king;
        if (url.includes('Ninja')) return AVATAR_LINKS.ninja; if (url.includes('Cat')) return AVATAR_LINKS.cat;
        if (url.includes('Felix')) return AVATAR_LINKS.default; if (url.includes('Aneka')) return AVATAR_LINKS.aneka;
        if (url.includes('Nala')) return AVATAR_LINKS.nala; if (url.includes('Oliver')) return AVATAR_LINKS.oliver;
        if (url.includes('Jack')) return AVATAR_LINKS.jack; if (url.includes('Mimi')) return AVATAR_LINKS.mimi;
        if (url.includes('Loki')) return AVATAR_LINKS.loki; if (url.includes('Garfield')) return AVATAR_LINKS.garfield;
        return url.replace('7.x/bottts', '9.x/adventurer').replace('7.x/avataaars', '9.x/adventurer').replace('7.x/fun-emoji', '9.x/adventurer').replace('7.x', '9.x');
    }

    async function pushDataToFirebase() {
        if (!userName) return;
        const userData = {
            name: userName, avatar: userAvatar, customAvatar: customAvatar, border: userBorder,
            keys: userKeys, unlockedAvatars: unlockedAvatars, unlockedBorders: unlockedBorders,
            redeemedCodes: redeemedCodes, lastLogin: Date.now()
        };
        try { await fetch(`${FIREBASE_BASE_URL}/users/${userName.toLowerCase()}.json`, { method: 'PUT', body: JSON.stringify(userData) }); } catch (e) { console.error("Lỗi đẩy dữ liệu:", e); }
    }

    function updateUIHeader() {
        displayUserName.textContent = userName; displayUserAvatar.src = userAvatar;
        displayUserAvatar.className = `header-avatar avatar-with-border ${userBorder}`;
        displayKeys.textContent = userKeys; mainHeader.classList.remove('hidden');
    }

    function renderAvatarSelector() {
        const selector = document.getElementById('avatar-selector'); selector.innerHTML = '';
        if(customAvatar) {
            const img = document.createElement('img'); img.src = customAvatar; img.className = 'avatar-option';
            if (userAvatar === customAvatar) img.classList.add('selected');
            img.onclick = () => { selectAvatarDOM(img, customAvatar); }; selector.appendChild(img);
        }
        AVATAR_SEEDS_ARRAY.forEach((url, index) => {
            const img = document.createElement('img'); img.src = url; img.className = 'avatar-option';
            if (!customAvatar && index === 0 && !userAvatar) userAvatar = url; 
            if (userAvatar === url) img.classList.add('selected');
            img.onclick = () => { selectAvatarDOM(img, url); }; selector.appendChild(img);
        });
    }

    function selectAvatarDOM(imgElement, url) {
        document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
        imgElement.classList.add('selected'); userAvatar = url;
    }

    // --- UPLOAD VÀ CẮT ẢNH ---
    document.getElementById('avatar-upload-input').addEventListener('change', function(e) {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert("Ảnh quá nặng! Vui lòng chọn ảnh dưới 2MB."); return; }
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('crop-image').src = event.target.result; closeModals(); 
            document.getElementById('modal-overlay').classList.remove('hidden'); document.getElementById('crop-modal').classList.remove('hidden');
            if(cropper) cropper.destroy(); cropper = new Cropper(document.getElementById('crop-image'), { aspectRatio: 1, viewMode: 1, autoCropArea: 1 });
        }; reader.readAsDataURL(file); e.target.value = ''; 
    });

    document.getElementById('apply-crop-btn').addEventListener('click', async () => {
        if (!cropper) return; const canvas = cropper.getCroppedCanvas({ width: 150, height: 150 });
        const base64Avatar = canvas.toDataURL('image/jpeg', 0.7); customAvatar = base64Avatar; userAvatar = base64Avatar; 
        closeModals(); if(cropper) { cropper.destroy(); cropper = null; }
        if (userName) { await pushDataToFirebase(); updateUIHeader(); alert("Đã cập nhật ảnh đại diện thành công!"); } else { renderAvatarSelector(); }
    });

    document.getElementById('cancel-crop-btn').addEventListener('click', () => { closeModals(); if(cropper) { cropper.destroy(); cropper = null; } });

    document.getElementById('start-app-btn').addEventListener('click', async () => {
        const inputName = document.getElementById('username-input').value.trim();
        if (inputName.length < 2) return alert("Vui lòng nhập tên của bạn (ít nhất 2 ký tự)!");
        userName = inputName; localStorage.setItem('quiz_username', userName);
        await syncDataFromFirebase(); initApp();
    });

    document.getElementById('change-name-btn').addEventListener('click', () => {
        userName = ""; localStorage.removeItem('quiz_username'); document.getElementById('username-input').value = ""; initApp();
    });

    async function initLobby() {
        const quizListContainer = document.getElementById('quiz-list-container'); quizListContainer.innerHTML = '';
        try { const res = await fetch(`${FIREBASE_BASE_URL}/quiz_stats.json`); quizStats = (await res.json()) || {}; } catch(e) { console.error("Lỗi lấy stats", e); }
        QUIZ_LIST.forEach(quiz => {
            const plays = quizStats[quiz.id] ? (quizStats[quiz.id].plays || 0) : 0;
            const btn = document.createElement('div'); btn.className = 'quiz-card-btn';
            btn.innerHTML = `<span>${quiz.title}</span><small>File: ${quiz.file}</small><div class="play-count-badge">📝 Đã thi: ${plays} lượt</div>
                <button class="btn-lb-small" onclick="event.stopPropagation(); loadLeaderboard('${quiz.id}', '${quiz.title}')">🏆 Xem BXH</button>`;
            btn.onclick = () => selectQuiz(quiz); quizListContainer.appendChild(btn);
        });
        showSection('lobby'); document.getElementById('app-main-title').textContent = "Sảnh Chờ";
        document.getElementById('home-btn').classList.add('hidden'); timerDisplay.classList.add('hidden'); 
        modeToggleBtn.classList.remove('hidden'); // Hiện nút chế độ ở Sảnh
    }

    function showSection(sectionId) {
        ['login', 'lobby', 'loading', 'quiz', 'result', 'leaderboard'].forEach(id => { const el = document.getElementById(`${id}-section`); if (el) el.classList.add('hidden'); });
        const target = document.getElementById(`${sectionId}-section`); if (target) target.classList.remove('hidden');
    }

    // --- HỆ THỐNG GIFTCODE ---
    document.getElementById('redeem-btn').addEventListener('click', async () => {
        const codeInput = document.getElementById('giftcode-input'); const statusText = document.getElementById('giftcode-status');
        const code = codeInput.value.trim().toUpperCase(); const btn = document.getElementById('redeem-btn');
        if (!code) { statusText.textContent = '❌ Bạn chưa nhập mã code!'; statusText.style.color = '#ef4444'; return; }
        if (redeemedCodes.includes(code)) { statusText.textContent = '❌ Mã này bạn đã sử dụng rồi!'; statusText.style.color = '#ef4444'; return; }
        btn.disabled = true; btn.textContent = 'Đang kiểm tra...'; statusText.textContent = '';
        try {
            const res = await fetch(`${FIREBASE_BASE_URL}/codes/${code}.json`); const data = await res.json();
            if (!data) { statusText.textContent = '❌ Mã code không tồn tại hoặc đã hết hạn!'; statusText.style.color = '#ef4444'; } else {
                const reward = parseInt(data.rewardkey) || 0;
                if (reward > 0) {
                    userKeys += reward; redeemedCodes.push(code); await pushDataToFirebase(); updateUIHeader();
                    statusText.textContent = `🎉 Đổi thành công! Bạn nhận được ${reward} 🔑`; statusText.style.color = '#10b981'; codeInput.value = '';
                } else { statusText.textContent = '❌ Mã code bị lỗi phần thưởng!'; statusText.style.color = '#ef4444'; }
            }
        } catch (error) { statusText.textContent = '❌ Lỗi kết nối mạng!'; statusText.style.color = '#ef4444'; }
        btn.disabled = false; btn.textContent = 'Nhận Thưởng';
    });

    // --- XỬ LÝ VÒNG QUAY ---
    let isSpinning = false;
    document.getElementById('spin-btn').addEventListener('click', async () => {
        if (isSpinning) return; if (userKeys <= 0) return alert("Bạn không đủ chìa khóa! Hãy đạt 100% điểm bài thi hoặc nhập Giftcode để nhận thêm.");
        isSpinning = true; userKeys--; updateUIHeader();
        const spinBtn = document.getElementById('spin-btn'); spinBtn.disabled = true; spinBtn.textContent = "Đang quay...";
        const wheel = document.getElementById('gacha-wheel'); wheel.classList.add('spinning'); document.getElementById('gacha-status').textContent = "Đang triệu hồi nhân phẩm...";
        let rand = Math.random() * 100; let sum = 0; let wonItem = GACHA_POOL[GACHA_POOL.length - 1];
        for (let item of GACHA_POOL) { sum += item.chance; if (rand <= sum) { wonItem = item; break; } }

        setTimeout(async () => {
            wheel.classList.remove('spinning'); spinBtn.disabled = false; spinBtn.textContent = "Quay Ngay (1 🔑)"; document.getElementById('gacha-status').textContent = ""; isSpinning = false;
            let isDuplicate = false;
            if (wonItem.type === 'avatar') { if (!unlockedAvatars.includes(wonItem.url)) unlockedAvatars.push(wonItem.url); else isDuplicate = true; } 
            else { if (!unlockedBorders.includes(wonItem.class)) unlockedBorders.push(wonItem.class); else isDuplicate = true; }
            
            if (isDuplicate) { document.getElementById('gacha-result-title').textContent = "Trùng lặp! ♻️"; document.getElementById('gacha-item-desc').innerHTML = `Bạn nhận được <b>${wonItem.name}</b>. Tuy nhiên bạn đã sở hữu vật phẩm này rồi, <b>rất tiếc hệ thống sẽ không hoàn lại chìa khóa</b>.`; document.getElementById('equip-gacha-btn').classList.add('hidden'); } 
            else { document.getElementById('gacha-result-title').textContent = "🎉 Chúc Mừng! 🎉"; document.getElementById('gacha-item-desc').textContent = wonItem.desc; document.getElementById('equip-gacha-btn').classList.remove('hidden'); }
            
            await pushDataToFirebase(); updateUIHeader(); document.getElementById('gacha-item-name').textContent = wonItem.name;
            const displayBox = document.getElementById('gacha-item-display');
            displayBox.innerHTML = wonItem.type === 'avatar' ? `<img src="${wonItem.url}" style="width:100%; border-radius:50%;">` : `<div class="avatar-with-border ${wonItem.class}" style="width:100%;height:100%;background:#f1f5f9;border-radius:50%"></div>`;
            document.getElementById('modal-overlay').classList.remove('hidden'); document.getElementById('gacha-result-modal').classList.remove('hidden');
            document.getElementById('equip-gacha-btn').onclick = async () => { if (wonItem.type === 'avatar') userAvatar = wonItem.url; else userBorder = wonItem.class; await pushDataToFirebase(); updateUIHeader(); closeModals(); };
        }, 1500);
    });

    document.getElementById('view-rates-btn').addEventListener('click', () => { document.getElementById('modal-overlay').classList.remove('hidden'); document.getElementById('rates-modal').classList.remove('hidden'); });

    document.getElementById('inventory-btn').addEventListener('click', () => {
        const avaGrid = document.getElementById('inventory-avatars'); const borderGrid = document.getElementById('inventory-borders'); avaGrid.innerHTML = ''; borderGrid.innerHTML = '';
        if(customAvatar) { const cImg = document.createElement('img'); cImg.src = customAvatar; cImg.className = `inv-item avatar-with-border border-none ${userAvatar === customAvatar ? 'equipped' : ''}`; cImg.onclick = async () => { userAvatar = customAvatar; await pushDataToFirebase(); updateUIHeader(); closeModals(); }; avaGrid.appendChild(cImg); }
        unlockedAvatars.forEach(url => { const img = document.createElement('img'); img.src = url; img.className = `inv-item avatar-with-border border-none ${userAvatar === url ? 'equipped' : ''}`; img.onclick = async () => { userAvatar = url; await pushDataToFirebase(); updateUIHeader(); closeModals(); }; avaGrid.appendChild(img); });
        const noBorder = document.createElement('div'); noBorder.className = `inv-item avatar-with-border border-none ${userBorder === 'border-none' ? 'equipped' : ''}`; noBorder.style.display = 'flex'; noBorder.style.alignItems = 'center'; noBorder.style.justifyContent = 'center'; noBorder.style.fontSize = '12px'; noBorder.textContent = 'Bỏ viền'; noBorder.onclick = async () => { userBorder = 'border-none'; await pushDataToFirebase(); updateUIHeader(); closeModals(); }; borderGrid.appendChild(noBorder);
        unlockedBorders.forEach(bClass => { if(bClass === 'border-none') return; const div = document.createElement('div'); div.className = `inv-item avatar-with-border ${bClass} ${userBorder === bClass ? 'equipped' : ''}`; div.style.background = "#eee"; div.onclick = async () => { userBorder = bClass; await pushDataToFirebase(); updateUIHeader(); closeModals(); }; borderGrid.appendChild(div); });
        document.getElementById('modal-overlay').classList.remove('hidden'); document.getElementById('inventory-modal').classList.remove('hidden');
    });

    function closeModals() { document.querySelectorAll('.modal-overlay, .modal-content').forEach(el => el.classList.add('hidden')); }
    document.getElementById('close-inventory-btn').onclick = closeModals; document.getElementById('close-gacha-btn').onclick = closeModals; document.getElementById('close-rates-btn').onclick = closeModals;

    // --- TẢI BÀI THI & CHẤM ĐIỂM ---
    async function selectQuiz(quizObj) {
        currentQuiz = quizObj; document.getElementById('app-main-title').textContent = quizObj.title;
        document.getElementById('home-btn').classList.remove('hidden'); timerDisplay.classList.remove('hidden'); modeToggleBtn.classList.add('hidden'); showSection('loading');
        try {
            const response = await fetch(currentQuiz.file + `?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Không tìm thấy file ${currentQuiz.file}`);
            questions = parseData(await response.text()); startQuiz();
        } catch (error) { document.getElementById('loading-section').innerHTML = `<p style="color:red; text-align:center;">Lỗi: ${error.message}</p>`; }
    }

    function parseData(text) {
        const lines = text.split('\n'); const parsed = []; let current = null;
        lines.forEach(line => {
            line = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();  if (!line) return;
            let qMatch = line.match(/^Ask\d+:\s*(.*)/i);
            if (qMatch) { if (current) parsed.push(current); current = { questionText: qMatch[1], options: [], images: [], type: 'single', rawKey: null }; return; }
            let imgMatch = line.match(/^anh\d*:\s*(.*)/i); if (imgMatch && current) { current.images.push(imgMatch[1]); return; }
            let tMatch = line.match(/^Type:\s*(.*)/i); if (tMatch && current) { current.type = tMatch[1].toLowerCase().trim(); return; }
            let aMatch = line.match(/^answer\d+:\s*(.*)/i); if (aMatch && current) { current.options.push(aMatch[1]); return; }
            let kMatch = line.match(/^Key:\s*(.*)/i); if (kMatch && current) { current.rawKey = kMatch[1]; }
        });
        if (current) parsed.push(current);
        parsed.forEach(q => {
             if (q.type === 'essay' || q.type === 'short') { q.key = q.rawKey; } 
             else if (q.rawKey?.includes(',')) { q.type = 'multi'; q.key = q.rawKey.split(',').map(Number); } 
             else { q.key = parseInt(q.rawKey, 10); }
        }); return parsed;
    }

    function startQuiz() {
        const questionsContainer = document.getElementById('questions-container'); questionsContainer.innerHTML = '';
        const bottomNav = document.getElementById('bottom-nav-container'); bottomNav.innerHTML = '';

        questions.forEach((q, qIndex) => {
            const block = document.createElement('div'); block.className = 'question-block';
            block.id = `q-block-${qIndex}`; // ID để điều khiển chuyển câu

            const title = document.createElement('div'); title.className = 'question-text'; title.textContent = `Câu ${qIndex + 1}: ${q.questionText}`;
            if (q.type === 'multi') title.textContent += ' (Chọn nhiều)'; if (q.type === 'essay') title.textContent += ' (Tự luận)'; block.appendChild(title);
            if (q.images.length > 0) { const imgCont = document.createElement('div'); imgCont.className = 'images-container'; q.images.forEach(src => { const img = document.createElement('img'); img.src = src; img.className = 'question-image'; img.onerror = () => img.style.display = 'none'; imgCont.appendChild(img); }); block.appendChild(imgCont); }
            
            const optCont = document.createElement('div'); optCont.className = 'options-group';
            if (q.type === 'essay') { optCont.innerHTML = `<textarea name="q${qIndex}" class="essay-input" placeholder="Nhập câu trả lời..."></textarea>`; } 
            else if (q.type === 'short') { optCont.innerHTML = `<input type="text" name="q${qIndex}" class="short-input" placeholder="Nhập đáp án..." autocomplete="off">`; } 
            else { q.options.forEach((opt, oIdx) => { optCont.innerHTML += `<label class="option-label"><input type="${q.type==='multi'?'checkbox':'radio'}" name="q${qIndex}" value="${oIdx+1}"> ${opt}</label>`; }); }
            block.appendChild(optCont); 

            // NẾU LÀ CHẾ ĐỘ LUYỆN TẬP -> THÊM NÚT TRẢ LỜI NGAY DƯỚI CÂU
            if (isPracticeMode) {
                const actionsDiv = document.createElement('div'); actionsDiv.className = 'practice-actions';
                
                const checkBtn = document.createElement('button'); checkBtn.type = 'button'; checkBtn.className = 'btn btn-check-ans'; checkBtn.id = `btn-check-${qIndex}`; checkBtn.textContent = 'Trả lời & Kiểm tra';
                checkBtn.onclick = () => checkSingleQuestion(qIndex);
                
                const nextBtn = document.createElement('button'); nextBtn.type = 'button'; nextBtn.className = 'btn btn-next-q hidden'; nextBtn.id = `btn-next-${qIndex}`; nextBtn.innerHTML = 'Câu tiếp theo ➡️';
                nextBtn.onclick = () => goToStep(qIndex + 1);

                actionsDiv.appendChild(checkBtn); actionsDiv.appendChild(nextBtn); block.appendChild(actionsDiv);

                // Tạo bóng bóng số thứ tự ở thanh Menu
                const bubble = document.createElement('div'); bubble.className = 'nav-bubble'; bubble.id = `nav-bubble-${qIndex}`; bubble.textContent = qIndex + 1;
                bubble.onclick = () => goToStep(qIndex); bottomNav.appendChild(bubble);
            }

            questionsContainer.appendChild(block);
        });

        if (isPracticeMode) {
            document.getElementById('bottom-nav-wrapper').classList.remove('hidden');
            goToStep(0); // Mặc định hiển thị câu 1
        } else {
            document.getElementById('bottom-nav-wrapper').classList.add('hidden');
        }

        showSection('quiz'); document.getElementById('quiz-form').reset(); startTime = Date.now(); timerDisplay.classList.remove('hidden'); clearInterval(timerInterval); timerInterval = setInterval(updateTimer, 1000); updateTimer();
    }

    // --- LOGIC LUYỆN TẬP TỪNG CÂU ---
    window.goToStep = function(index) {
        if (index >= questions.length) { alert("Đã hết câu hỏi! Hãy bấm nút Nộp bài bên dưới để lưu kết quả và nhận quà."); return; }
        
        // Ẩn tất cả, chỉ hiện câu đang chọn
        document.querySelectorAll('.question-block').forEach((el, i) => { if (i === index) el.classList.remove('hidden-step'); else el.classList.add('hidden-step'); });
        
        // Cập nhật viền cho số ở dưới Menu
        document.querySelectorAll('.nav-bubble').forEach((el, i) => { if (i === index) el.classList.add('active'); else el.classList.remove('active'); });
    }

    function checkSingleQuestion(qIndex) {
        const q = questions[qIndex];
        const block = document.getElementById(`q-block-${qIndex}`);
        const inputs = block.querySelectorAll('input, textarea');
        
        let isAnswered = false; let isMatch = false;

        if (q.type === 'single') {
            const checked = block.querySelector(`input[name="q${qIndex}"]:checked`);
            if (checked) { isAnswered = true; isMatch = parseInt(checked.value) === q.key; }
        } else if (q.type === 'multi') {
            const checked = block.querySelectorAll(`input[name="q${qIndex}"]:checked`);
            const arr = Array.from(checked).map(cb => parseInt(cb.value));
            if (arr.length > 0) isAnswered = true;
            isMatch = q.key.every((v, i) => (v===1 && arr.includes(i+1)) || (v===0 && !arr.includes(i+1)));
            if (arr.length !== q.key.filter(v=>v===1).length) isMatch = false; 
        } else if (q.type === 'short') {
            const input = block.querySelector(`input[name="q${qIndex}"]`);
            if (input && input.value.trim() !== '') { isAnswered = true; isMatch = input.value.trim().toLowerCase() === q.key.trim().toLowerCase(); }
        } else if (q.type === 'essay') {
            const input = block.querySelector(`textarea[name="q${qIndex}"]`);
            if (input && input.value.trim() !== '') isAnswered = true; isMatch = true; 
        }

        if (!isAnswered) { alert("Bạn chưa chọn hoặc nhập đáp án!"); return; }

        // KHÓA CỨNG: Không cho phép sửa lại sau khi check
        inputs.forEach(el => el.disabled = true);
        block.style.opacity = "0.9";

        // Đổi giao diện nút
        document.getElementById(`btn-check-${qIndex}`).classList.add('hidden');
        document.getElementById(`btn-next-${qIndex}`).classList.remove('hidden');

        // Hiện đánh giá tức thì
        const feedbackDiv = document.createElement('div');
        if (q.type === 'essay') {
            feedbackDiv.className = 'inline-feedback feedback-essay'; feedbackDiv.innerHTML = `<b>Gợi ý đáp án:</b> ${q.key}`;
        } else {
            feedbackDiv.className = `inline-feedback ${isMatch ? 'feedback-correct' : 'feedback-incorrect'}`;
            let correctText = '';
            if (q.type === 'single') correctText = q.options[q.key - 1];
            else if (q.type === 'multi') correctText = q.key.map((v, i) => v===1 ? q.options[i] : null).filter(x=>x).join(', ');
            else if (q.type === 'short') correctText = q.key;
            feedbackDiv.innerHTML = isMatch ? '✓ Chính xác hoàn toàn!' : `✗ Chưa chính xác! Đáp án đúng là: <b>${correctText}</b>`;
        }
        block.appendChild(feedbackDiv);

        // Đổi màu bong bóng Menu dưới cùng (Xanh / Đỏ)
        const navItem = document.getElementById(`nav-bubble-${qIndex}`);
        if (q.type === 'essay') navItem.classList.add('nav-essay');
        else navItem.classList.add(isMatch ? 'nav-correct' : 'nav-incorrect');
    }

    function updateTimer() { const elapsed = Math.floor((Date.now() - startTime) / 1000); const m = String(Math.floor(elapsed / 60)).padStart(2, '0'); const s = String(elapsed % 60).padStart(2, '0'); timerSpan.textContent = `${m}:${s}`; }

    // --- NỘP BÀI TOÀN BỘ (Dùng chung cho cả 2 chế độ) ---
    document.getElementById('quiz-form').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        // CỰC KỲ QUAN TRỌNG: Phải mở khóa lại toàn bộ các ô đã bị "disable" ở chế độ luyện tập, 
        // nếu không FormData sẽ không lấy được đáp án của những ô đó để gửi đi chấm điểm.
        document.getElementById('quiz-form').querySelectorAll('input, textarea').forEach(el => el.disabled = false);

        clearInterval(timerInterval);
        const timeTakenMs = Date.now() - startTime; const timeStr = timerSpan.textContent;
        await evaluateAndSaveResults(timeTakenMs, timeStr);
    });

    async function evaluateAndSaveResults(timeTakenMs, timeStr) {
        let correctCount = 0; let objectiveCount = 0; 
        const formData = new FormData(document.getElementById('quiz-form'));
        const reviewContainer = document.getElementById('review-container'); reviewContainer.innerHTML = '';

        questions.forEach((q, qIndex) => {
            if (q.type === 'essay') { reviewContainer.appendChild(buildReviewItem(q, qIndex, null, formData)); } 
            else {
                objectiveCount++; let isMatch = false;
                if (q.type === 'single') isMatch = parseInt(formData.get(`q${qIndex}`)) === q.key; 
                else if (q.type === 'short') isMatch = (formData.get(`q${qIndex}`)||'').trim().toLowerCase() === q.key.trim().toLowerCase();
                if (isMatch) correctCount++;
                reviewContainer.appendChild(buildReviewItem(q, qIndex, isMatch, formData));
            }
        });

        const accuracy = objectiveCount > 0 ? Math.round((correctCount / objectiveCount) * 100) : 0;
        document.getElementById('score-display').textContent = `${correctCount}/${objectiveCount}`;
        document.getElementById('accuracy-display').textContent = `${accuracy}%`;
        document.getElementById('time-display').textContent = timeStr;
        showSection('result'); window.scrollTo(0, 0);

        try {
            const currentPlays = quizStats[currentQuiz.id] ? (quizStats[currentQuiz.id].plays || 0) : 0;
            await fetch(`${FIREBASE_BASE_URL}/quiz_stats/${currentQuiz.id}/plays.json`, { method: 'PUT', body: JSON.stringify(currentPlays + 1) });
        } catch(e){}

        if (accuracy === 100) {
            userKeys++; await pushDataToFirebase(); updateUIHeader();
            setTimeout(() => alert("🎉 THIÊN TÀI LỘ DIỆN! Bạn đạt 100% điểm tuyệt đối và được thưởng 1 🔑 Vòng Quay Nhân Phẩm!"), 500);
        }

        const record = {
            name: userName, avatar: userAvatar, border: userBorder,
            correct: correctCount, wrong: objectiveCount - correctCount,
            total: objectiveCount, accuracy: accuracy, timeStr: timeStr, timeMs: timeTakenMs, timestamp: Date.now()
        };

        try {
            const dbUrl = `${FIREBASE_BASE_URL}/leaderboard_${currentQuiz.id}.json`;
            const res = await fetch(dbUrl); const data = await res.json();
            let existingKey = null; let shouldUpdate = true;

            if (data) {
                for (const [key, val] of Object.entries(data)) {
                    if (val.name.trim().toLowerCase() === userName.trim().toLowerCase()) {
                        existingKey = key; 
                        if (record.correct < val.correct) shouldUpdate = false; 
                        else if (record.correct === val.correct && record.timeMs >= val.timeMs) shouldUpdate = false; 
                        
                        if(!shouldUpdate && (val.avatar !== userAvatar || val.border !== userBorder)) {
                            await fetch(`${FIREBASE_BASE_URL}/leaderboard_${currentQuiz.id}/${key}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({avatar: userAvatar, border: userBorder})});
                        }
                        break; 
                    }
                }
            }
            if (shouldUpdate) {
                if (existingKey) await fetch(`${FIREBASE_BASE_URL}/leaderboard_${currentQuiz.id}/${existingKey}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
                else await fetch(dbUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
            }
        } catch (error) { console.error("Lỗi BXH:", error); }
    }

    function buildReviewItem(q, qIndex, isCorrect, formData) {
        const div = document.createElement('div'); div.className = 'review-item'; div.innerHTML = `<h4>Câu ${qIndex + 1}: ${q.questionText}</h4>`;
        q.images.forEach(src => { const img = document.createElement('img'); img.src = src; img.className = 'review-image'; div.appendChild(img); });
        if (q.type === 'essay') { div.classList.add('review-essay'); div.innerHTML += `<p class="feedback-text feedback-essay">Tự luận</p><p><b>Bài làm:</b> ${formData.get(`q${qIndex}`) || "(Trống)"}</p><p><b>Gợi ý:</b> ${q.key}</p>`; } 
        else { div.classList.add(isCorrect ? 'review-correct' : 'review-incorrect'); div.innerHTML += `<p class="feedback-text ${isCorrect?'feedback-correct':'feedback-incorrect'}">${isCorrect?'✓ Chính xác':'✗ Sai rồi'}</p>`;
            if (q.type === 'single') div.innerHTML += `<p>Đáp án đúng: ${q.options[q.key - 1]}</p>`;
            else if (q.type === 'multi') { const opts = q.key.map((v, i) => v===1 ? q.options[i] : null).filter(x=>x); div.innerHTML += `<p>Đáp án đúng: ${opts.join(', ')}</p>`; }
            else if (q.type === 'short') div.innerHTML += `<p>Đáp án đúng: ${q.key} <br><span style="color:var(--text-muted)">Bạn nhập: ${formData.get(`q${qIndex}`)}</span></p>`; }
        return div;
    }

    // --- RENDER BXH ---
    window.loadLeaderboard = async function(quizId, quizTitle) {
        document.getElementById('app-main-title').textContent = "Bảng Xếp Hạng"; document.getElementById('home-btn').classList.remove('hidden'); document.getElementById('lb-title').textContent = `Môn: ${quizTitle}`; modeToggleBtn.classList.add('hidden');
        const lbBody = document.getElementById('lb-body'); lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Đang tải dữ liệu...</td></tr>`; showSection('leaderboard');
        try {
            const res = await fetch(`${FIREBASE_BASE_URL}/leaderboard_${quizId}.json`); const data = await res.json();
            if (!data) return lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có ai thi môn này. Hãy là người đầu tiên!</td></tr>`;
            let records = Object.values(data).sort((a, b) => (b.correct !== a.correct) ? b.correct - a.correct : a.timeMs - b.timeMs).slice(0, 50); lbBody.innerHTML = '';
            records.forEach((rec, index) => {
                const tr = document.createElement('tr'); const rank = index + 1; let rankIcon = rank;
                if(rank === 1) rankIcon = "🥇 1"; if(rank === 2) rankIcon = "🥈 2"; if(rank === 3) rankIcon = "🥉 3";
                if (rank <= 3) tr.className = `rank-${rank}`;
                let crownHtml = ''; let nameClass = ''; let sparklesHtml = '';
                if (rank === 1) { crownHtml = '<div class="crown-icon">👑</div>'; nameClass = 'gold-text'; sparklesHtml = `<div class="sparkle" style="top:-5px; left:-10px; animation-delay:0s;"></div><div class="sparkle" style="bottom:0px; right:-15px; animation-delay:0.5s;"></div><div class="sparkle" style="top:50%; right:50%; animation-delay:1s;"></div>`; } 
                else if (rank === 2) nameClass = 'silver-text'; else if (rank === 3) nameClass = 'bronze-text'; 
                let displayAvatar = fixBrokenAvatarURL(rec.avatar); let displayBorder = rec.border || 'border-none';
                tr.innerHTML = `
                    <td>${rankIcon}</td>
                    <td>
                        <div class="player-info-container">
                            <div class="avatar-wrapper">${crownHtml}<img src="${displayAvatar}" class="lb-avatar avatar-with-border ${displayBorder}"></div>
                            <div class="sparkle-box"><span class="${nameClass}">${escapeHTML(rec.name)}</span>${sparklesHtml}</div>
                        </div>
                    </td>
                    <td style="color:var(--primary-color); font-weight:bold;">${rec.correct}/${rec.total}</td>
                    <td>${rec.accuracy}%</td>
                    <td>${rec.timeStr}</td>
                    <td><span style="color:green">✓${rec.correct}</span> / <span style="color:red">✗${rec.wrong}</span></td>
                `; lbBody.appendChild(tr);
            });
        } catch (error) { lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Lỗi tải dữ liệu.</td></tr>`; }
    };

    function escapeHTML(str) { return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag)); }
    document.getElementById('retake-btn').addEventListener('click', () => { selectQuiz(currentQuiz); });
    document.getElementById('view-leaderboard-btn').addEventListener('click', () => { window.loadLeaderboard(currentQuiz.id, currentQuiz.title); });
    document.getElementById('home-btn').addEventListener('click', () => { clearInterval(timerInterval); initLobby(); });
    document.getElementById('lb-back-btn').addEventListener('click', () => { initLobby(); });
});
