/**
 * EdTech Quiz - Đồng bộ Chìa khóa, Túi đồ và Thành tích lên Firebase (BẢN FULL HOÀN CHỈNH)
 */

const QUIZ_LIST = [
    { id: "tieng_anh1", title: "Đề 1 Tiếng Anh", file: "tieng_anh1.txt" },
    { id: "tieng_anh2", title: "Đề 2 Tiếng Anh", file: "tieng_anh2.txt" },
    { id: "tieng_anh3", title: "Đề 3 Tiếng Anh", file: "tieng_anh3.txt" },
    { id: "tieng_anh4", title: "Đề 4 Tiếng Anh", file: "tieng_anh4.txt" }
];

const FIREBASE_BASE_URL = "https://ontap-59972-default-rtdb.firebaseio.com";

const AVATAR_SEEDS = ['Felix', 'Aneka', 'Nala', 'Oliver', 'Jack', 'Mimi', 'Loki', 'Garfield'];

const GACHA_POOL = [
    { id: 'mythic-1', type: 'border', name: 'Viền Thần Thoại (Mythic)', chance: 1, class: 'border-mythic', icon: '✨', desc: 'Hiệu ứng cầu vồng lấp lánh cực hiếm (1%)!' },
    { id: 'avatar-dragon', type: 'avatar', name: 'Avatar Rồng Thần', chance: 3, url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dragon', icon: '🐉', desc: 'Ảnh đại diện Rồng cơ khí siêu ngầu (3%).' },
    { id: 'legendary-1', type: 'border', name: 'Viền Truyền Thuyết (Legendary)', chance: 6, class: 'border-legendary', icon: '🌟', desc: 'Viền vàng lấp lánh quyền lực (6%).' },
    { id: 'avatar-king', type: 'avatar', name: 'Avatar Quân Vương', chance: 10, url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=King', icon: '👑', desc: 'Phong thái của một vị vua (10%).' },
    { id: 'epic-1', type: 'border', name: 'Viền Sử Thi (Epic)', chance: 15, class: 'border-epic', icon: '🔮', desc: 'Viền tím ma thuật huyền bí (15%).' },
    { id: 'avatar-ninja', type: 'avatar', name: 'Avatar Nhẫn Giả', chance: 20, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ninja', icon: '🥷', desc: 'Thoắt ẩn thoắt hiện (20%).' },
    { id: 'rare-1', type: 'border', name: 'Viền Hiếm (Rare)', chance: 25, class: 'border-rare', icon: '💎', desc: 'Viền xanh dương nổi bật (25%).' },
    { id: 'avatar-cat', type: 'avatar', name: 'Avatar Hoàng Thượng', chance: 20, url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cat', icon: '🐱', desc: 'Dễ thương lạc lối (20%).' }
];

document.addEventListener("DOMContentLoaded", () => {
    let currentQuiz = null; 
    let questions = []; 
    let startTime = null; 
    let timerInterval = null;
    
    // Khởi tạo state mặc định
    let userName = localStorage.getItem('quiz_username') || "";
    let userAvatar = "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix";
    let userBorder = "border-none";
    let userKeys = 0;
    let unlockedAvatars = AVATAR_SEEDS.map(seed => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`);
    let unlockedBorders = ['border-none'];

    const displayUserAvatar = document.getElementById('display-user-avatar');
    const displayUserName = document.getElementById('display-user-name');
    const displayKeys = document.getElementById('display-keys');
    const mainHeader = document.getElementById('main-header');
    const timerDisplay = document.getElementById('timer-display');
    const timerSpan = timerDisplay.querySelector('span');

    initApp();

    async function initApp() {
        if (userName) {
            await syncDataFromFirebase();
            updateUIHeader();
            initLobby();
        } else {
            renderAvatarSelector(); 
            showSection('login');
            mainHeader.classList.add('hidden');
        }
    }

    // --- HÀM ĐỒNG BỘ DỮ LIỆU TỪ FIREBASE ---
    async function syncDataFromFirebase() {
        try {
            const res = await fetch(`${FIREBASE_BASE_URL}/users/${userName.toLowerCase()}.json`);
            const data = await res.json();
            if (data) {
                userAvatar = data.avatar || userAvatar;
                userBorder = data.border || userBorder;
                userKeys = data.keys || 0;
                unlockedAvatars = data.unlockedAvatars || unlockedAvatars;
                unlockedBorders = data.unlockedBorders || unlockedBorders;
            } else {
                await pushDataToFirebase();
            }
        } catch (e) { console.error("Lỗi đồng bộ:", e); }
    }

    async function pushDataToFirebase() {
        if (!userName) return;
        const userData = {
            name: userName,
            avatar: userAvatar,
            border: userBorder,
            keys: userKeys,
            unlockedAvatars: unlockedAvatars,
            unlockedBorders: unlockedBorders,
            lastLogin: Date.now()
        };
        try {
            await fetch(`${FIREBASE_BASE_URL}/users/${userName.toLowerCase()}.json`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } catch (e) { console.error("Lỗi đẩy dữ liệu:", e); }
    }

    function updateUIHeader() {
        displayUserName.textContent = userName;
        displayUserAvatar.src = userAvatar;
        displayUserAvatar.className = `header-avatar avatar-with-border ${userBorder}`;
        displayKeys.textContent = userKeys;
        mainHeader.classList.remove('hidden');
    }

    function renderAvatarSelector() {
        const selector = document.getElementById('avatar-selector');
        selector.innerHTML = '';
        const tempAvatars = AVATAR_SEEDS.map(seed => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`);
        tempAvatars.forEach((url, index) => {
            const img = document.createElement('img');
            img.src = url; img.className = 'avatar-option';
            if (index === 0 && !userAvatar) userAvatar = url; 
            if (userAvatar === url) img.classList.add('selected');
            img.onclick = () => {
                document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
                img.classList.add('selected'); userAvatar = url;
            };
            selector.appendChild(img);
        });
    }

    document.getElementById('start-app-btn').addEventListener('click', async () => {
        const inputName = document.getElementById('username-input').value.trim();
        if (inputName.length < 2) return alert("Vui lòng nhập tên của bạn (ít nhất 2 ký tự)!");
        userName = inputName;
        localStorage.setItem('quiz_username', userName);
        await syncDataFromFirebase();
        initApp();
    });

    document.getElementById('change-name-btn').addEventListener('click', () => {
        userName = ""; localStorage.removeItem('quiz_username');
        document.getElementById('username-input').value = "";
        initApp();
    });

    function initLobby() {
        const quizListContainer = document.getElementById('quiz-list-container');
        quizListContainer.innerHTML = '';
        QUIZ_LIST.forEach(quiz => {
            const btn = document.createElement('div'); btn.className = 'quiz-card-btn';
            btn.innerHTML = `<span>${quiz.title}</span><small>File: ${quiz.file}</small>
                <button class="btn-lb-small" onclick="event.stopPropagation(); loadLeaderboard('${quiz.id}', '${quiz.title}')">🏆 Xem BXH</button>`;
            btn.onclick = () => selectQuiz(quiz);
            quizListContainer.appendChild(btn);
        });
        showSection('lobby');
        document.getElementById('app-main-title').textContent = "Sảnh Chờ";
        document.getElementById('home-btn').classList.add('hidden');
        timerDisplay.classList.add('hidden'); 
    }

    function showSection(sectionId) {
        ['login', 'lobby', 'loading', 'quiz', 'result', 'leaderboard'].forEach(id => {
            const el = document.getElementById(`${id}-section`);
            if (el) el.classList.add('hidden');
        });
        const target = document.getElementById(`${sectionId}-section`);
        if (target) target.classList.remove('hidden');
    }

    // --- XỬ LÝ VÒNG QUAY ---
    let isSpinning = false;
    document.getElementById('spin-btn').addEventListener('click', async () => {
        if (isSpinning) return;
        if (userKeys <= 0) return alert("Bạn không đủ chìa khóa! Hãy đạt 100% điểm bài thi để nhận thêm.");
        
        isSpinning = true;
        userKeys--;
        updateUIHeader();
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = true; spinBtn.textContent = "Đang quay...";
        
        const wheel = document.getElementById('gacha-wheel');
        wheel.classList.add('spinning');
        document.getElementById('gacha-status').textContent = "Đang triệu hồi nhân phẩm...";
        
        let rand = Math.random() * 100;
        let sum = 0; let wonItem = GACHA_POOL[GACHA_POOL.length - 1];
        for (let item of GACHA_POOL) {
            sum += item.chance;
            if (rand <= sum) { wonItem = item; break; }
        }

        setTimeout(async () => {
            wheel.classList.remove('spinning');
            spinBtn.disabled = false; spinBtn.textContent = "Quay Ngay (1 🔑)";
            document.getElementById('gacha-status').textContent = "";
            isSpinning = false;
            
            let isDuplicate = false;
            if (wonItem.type === 'avatar') {
                if (!unlockedAvatars.includes(wonItem.url)) unlockedAvatars.push(wonItem.url);
                else isDuplicate = true;
            } else {
                if (!unlockedBorders.includes(wonItem.class)) unlockedBorders.push(wonItem.class);
                else isDuplicate = true;
            }
            
            if (isDuplicate) {
                userKeys++; 
                document.getElementById('gacha-result-title').textContent = "Trùng lặp! ♻️";
                document.getElementById('gacha-item-desc').innerHTML = `Bạn đã có vật phẩm này rồi nên hệ thống <b>hoàn trả 1 🔑</b> cho bạn!`;
            } else {
                document.getElementById('gacha-result-title').textContent = "🎉 Chúc Mừng! 🎉";
                document.getElementById('gacha-item-desc').textContent = wonItem.desc;
            }
            
            await pushDataToFirebase();
            updateUIHeader();
            
            document.getElementById('gacha-item-name').textContent = wonItem.name;
            const displayBox = document.getElementById('gacha-item-display');
            displayBox.innerHTML = wonItem.type === 'avatar' ? `<img src="${wonItem.url}" style="width:100%; border-radius:50%;">` : `<div class="avatar-with-border ${wonItem.class}" style="width:100%;height:100%;background:#f1f5f9;border-radius:50%"></div>`;
            
            document.getElementById('modal-overlay').classList.remove('hidden');
            document.getElementById('gacha-result-modal').classList.remove('hidden');
            
            document.getElementById('equip-gacha-btn').onclick = async () => {
                if (wonItem.type === 'avatar') userAvatar = wonItem.url; else userBorder = wonItem.class;
                await pushDataToFirebase();
                updateUIHeader();
                closeModals();
            };
        }, 1500);
    });

    // --- TÚI ĐỒ ---
    document.getElementById('inventory-btn').addEventListener('click', () => {
        const avaGrid = document.getElementById('inventory-avatars');
        const borderGrid = document.getElementById('inventory-borders');
        avaGrid.innerHTML = ''; borderGrid.innerHTML = '';

        unlockedAvatars.forEach(url => {
            const img = document.createElement('img');
            img.src = url; img.className = `inv-item avatar-with-border border-none ${userAvatar === url ? 'equipped' : ''}`;
            img.onclick = async () => { userAvatar = url; await pushDataToFirebase(); updateUIHeader(); closeModals(); };
            avaGrid.appendChild(img);
        });

        const noBorder = document.createElement('div');
        noBorder.className = `inv-item avatar-with-border border-none ${userBorder === 'border-none' ? 'equipped' : ''}`;
        noBorder.style.display = 'flex'; noBorder.style.alignItems = 'center'; noBorder.style.justifyContent = 'center'; noBorder.style.fontSize = '12px'; noBorder.textContent = 'Bỏ viền';
        noBorder.onclick = async () => { userBorder = 'border-none'; await pushDataToFirebase(); updateUIHeader(); closeModals(); };
        borderGrid.appendChild(noBorder);

        unlockedBorders.forEach(bClass => {
            if(bClass === 'border-none') return;
            const div = document.createElement('div');
            div.className = `inv-item avatar-with-border ${bClass} ${userBorder === bClass ? 'equipped' : ''}`;
            div.style.background = "#eee";
            div.onclick = async () => { userBorder = bClass; await pushDataToFirebase(); updateUIHeader(); closeModals(); };
            borderGrid.appendChild(div);
        });

        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('inventory-modal').classList.remove('hidden');
    });

    function closeModals() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('inventory-modal').classList.add('hidden');
        document.getElementById('gacha-result-modal').classList.add('hidden');
    }
    document.getElementById('close-inventory-btn').onclick = closeModals;
    document.getElementById('close-gacha-btn').onclick = closeModals;

    // --- TẢI BÀI THI & CHẤM ĐIỂM ---
    async function selectQuiz(quizObj) {
        currentQuiz = quizObj;
        document.getElementById('app-main-title').textContent = quizObj.title;
        document.getElementById('home-btn').classList.remove('hidden');
        timerDisplay.classList.remove('hidden');
        showSection('loading');
        try {
            const response = await fetch(currentQuiz.file + `?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Không tìm thấy file ${currentQuiz.file}`);
            questions = parseData(await response.text());
            startQuiz();
        } catch (error) { document.getElementById('loading-section').innerHTML = `<p style="color:red; text-align:center;">Lỗi: ${error.message}</p>`; }
    }

    function parseData(text) {
        const lines = text.split('\n'); const parsed = []; let current = null;
        lines.forEach(line => {
            line = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim(); 
            if (!line) return;
            let qMatch = line.match(/^Ask\d+:\s*(.*)/i);
            if (qMatch) { if (current) parsed.push(current); current = { questionText: qMatch[1], options: [], images: [], type: 'single', rawKey: null }; return; }
            let imgMatch = line.match(/^anh\d*:\s*(.*)/i);
            if (imgMatch && current) { current.images.push(imgMatch[1]); return; }
            let tMatch = line.match(/^Type:\s*(.*)/i);
            if (tMatch && current) { current.type = tMatch[1].toLowerCase().trim(); return; }
            let aMatch = line.match(/^answer\d+:\s*(.*)/i);
            if (aMatch && current) { current.options.push(aMatch[1]); return; }
            let kMatch = line.match(/^Key:\s*(.*)/i);
            if (kMatch && current) { current.rawKey = kMatch[1]; }
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
        questions.forEach((q, qIndex) => {
            const block = document.createElement('div'); block.className = 'question-block';
            const title = document.createElement('div'); title.className = 'question-text'; title.textContent = `Câu ${qIndex + 1}: ${q.questionText}`;
            if (q.type === 'multi') title.textContent += ' (Chọn nhiều)'; if (q.type === 'essay') title.textContent += ' (Tự luận)'; block.appendChild(title);
            if (q.images.length > 0) { const imgCont = document.createElement('div'); imgCont.className = 'images-container'; q.images.forEach(src => { const img = document.createElement('img'); img.src = src; img.className = 'question-image'; img.onerror = () => img.style.display = 'none'; imgCont.appendChild(img); }); block.appendChild(imgCont); }
            const optCont = document.createElement('div'); optCont.className = 'options-group';
            if (q.type === 'essay') { optCont.innerHTML = `<textarea name="q${qIndex}" class="essay-input" placeholder="Nhập câu trả lời..."></textarea>`; } 
            else if (q.type === 'short') { optCont.innerHTML = `<input type="text" name="q${qIndex}" class="short-input" placeholder="Nhập đáp án..." autocomplete="off">`; } 
            else { q.options.forEach((opt, oIdx) => { optCont.innerHTML += `<label class="option-label"><input type="${q.type==='multi'?'checkbox':'radio'}" name="q${qIndex}" value="${oIdx+1}"> ${opt}</label>`; }); }
            block.appendChild(optCont); questionsContainer.appendChild(block);
        });
        showSection('quiz'); document.getElementById('quiz-form').reset(); startTime = Date.now(); timerDisplay.classList.remove('hidden'); clearInterval(timerInterval); timerInterval = setInterval(updateTimer, 1000); updateTimer();
    }

    function updateTimer() { const elapsed = Math.floor((Date.now() - startTime) / 1000); const m = String(Math.floor(elapsed / 60)).padStart(2, '0'); const s = String(elapsed % 60).padStart(2, '0'); timerSpan.textContent = `${m}:${s}`; }

    document.getElementById('quiz-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearInterval(timerInterval);
        const timeTakenMs = Date.now() - startTime;
        const timeStr = timerSpan.textContent;
        await evaluateAndSaveResults(timeTakenMs, timeStr);
    });

    async function evaluateAndSaveResults(timeTakenMs, timeStr) {
        let correctCount = 0; let objectiveCount = 0; 
        const formData = new FormData(document.getElementById('quiz-form'));
        const reviewContainer = document.getElementById('review-container');
        reviewContainer.innerHTML = '';

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

        if (accuracy === 100) {
            userKeys++;
            await pushDataToFirebase();
            updateUIHeader();
            setTimeout(() => alert("🎉 THIÊN TÀI LỘ DIỆN! Bạn đạt 100% điểm tuyệt đối và được thưởng 1 🔑 Vòng Quay Nhân Phẩm!"), 500);
        }

        const record = {
            name: userName, avatar: userAvatar, border: userBorder,
            correct: correctCount, wrong: objectiveCount - correctCount,
            total: objectiveCount, accuracy: accuracy, timeStr: timeStr, timeMs: timeTakenMs, timestamp: Date.now()
        };

        try {
            const dbUrl = `${FIREBASE_BASE_URL}/leaderboard_${currentQuiz.id}.json`;
            const res = await fetch(dbUrl);
            const data = await res.json();
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
        document.getElementById('app-main-title').textContent = "Bảng Xếp Hạng";
        document.getElementById('home-btn').classList.remove('hidden');
        document.getElementById('lb-title').textContent = `Môn: ${quizTitle}`;
        const lbBody = document.getElementById('lb-body');
        lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;
        showSection('leaderboard');

        try {
            const res = await fetch(`${FIREBASE_BASE_URL}/leaderboard_${quizId}.json`);
            const data = await res.json();
            if (!data) return lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có ai thi môn này. Hãy là người đầu tiên!</td></tr>`;

            let records = Object.values(data).sort((a, b) => (b.correct !== a.correct) ? b.correct - a.correct : a.timeMs - b.timeMs).slice(0, 50);
            lbBody.innerHTML = '';

            records.forEach((rec, index) => {
                const tr = document.createElement('tr');
                const rank = index + 1;
                let rankIcon = rank;
                if(rank === 1) rankIcon = "🥇 1"; if(rank === 2) rankIcon = "🥈 2"; if(rank === 3) rankIcon = "🥉 3";
                if (rank <= 3) tr.className = `rank-${rank}`;

                let crownHtml = ''; let nameClass = ''; let sparklesHtml = '';
                if (rank === 1) { 
                    crownHtml = '<div class="crown-icon">👑</div>'; nameClass = 'gold-text'; 
                    sparklesHtml = `<div class="sparkle" style="top:-5px; left:-10px; animation-delay:0s;"></div><div class="sparkle" style="bottom:0px; right:-15px; animation-delay:0.5s;"></div><div class="sparkle" style="top:50%; right:50%; animation-delay:1s;"></div>`;
                } else if (rank === 2) nameClass = 'silver-text'; 
                else if (rank === 3) nameClass = 'bronze-text'; 

                let displayAvatar = rec.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${rec.name}`;
                let displayBorder = rec.border || 'border-none';

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
                `;
                lbBody.appendChild(tr);
            });
        } catch (error) { lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Lỗi tải dữ liệu.</td></tr>`; }
    };

    function escapeHTML(str) { return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag)); }
    
    document.getElementById('retake-btn').addEventListener('click', () => { selectQuiz(currentQuiz); });
    document.getElementById('view-leaderboard-btn').addEventListener('click', () => { window.loadLeaderboard(currentQuiz.id, currentQuiz.title); });
    document.getElementById('home-btn').addEventListener('click', () => { clearInterval(timerInterval); initLobby(); });
    document.getElementById('lb-back-btn').addEventListener('click', () => { initLobby(); });
});
