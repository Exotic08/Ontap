/**
 * EdTech Quiz - Tên người dùng, Avatar Cá nhân & Bảng xếp hạng Rực rỡ
 */

const QUIZ_LIST = [
    { id: "tieng_anh1", title: "Đề 1 Tiếng Anh", file: "tieng_anh1.txt" },
    { id: "tieng_anh2", title: "Đề 2 Tiếng Anh", file: "tieng_anh2.txt" },
    { id: "tieng_anh3", title: "Đề 3 Tiếng Anh", file: "tieng_anh3.txt" },
    { id: "tieng_anh4", title: "Đề 4 Tiếng Anh", file: "tieng_anh4.txt" }
];

const FIREBASE_BASE_URL = "https://ontap-59972-default-rtdb.firebaseio.com";

// Danh sách các "mẫu" avatar có sẵn từ DiceBear API
const AVATAR_SEEDS = ['Felix', 'Aneka', 'Nala', 'Oliver', 'Jack', 'Mimi', 'Loki', 'Garfield'];

document.addEventListener("DOMContentLoaded", () => {
    let currentQuiz = null; 
    let questions = [];
    let startTime = null;
    let timerInterval = null;
    
    // Lấy thông tin từ bộ nhớ tạm
    let userName = localStorage.getItem('quiz_username') || "";
    let userAvatar = localStorage.getItem('quiz_avatar') || "";

    const mainHeader = document.getElementById('main-header');
    const loginSection = document.getElementById('login-section');
    const lobbySection = document.getElementById('lobby-section');
    const loadingSection = document.getElementById('loading-section');
    const quizSection = document.getElementById('quiz-section');
    const resultSection = document.getElementById('result-section');
    const leaderboardSection = document.getElementById('leaderboard-section');
    
    const quizListContainer = document.getElementById('quiz-list-container');
    const questionsContainer = document.getElementById('questions-container');
    const quizForm = document.getElementById('quiz-form');
    const reviewContainer = document.getElementById('review-container');
    const lbBody = document.getElementById('lb-body');
    
    const homeBtn = document.getElementById('home-btn');
    const appTitle = document.getElementById('app-main-title');
    const timerDisplay = document.getElementById('timer-display');
    const timerSpan = timerDisplay.querySelector('span');
    const displayUserName = document.getElementById('display-user-name');
    const displayUserAvatar = document.getElementById('display-user-avatar');
    const usernameInput = document.getElementById('username-input');

    initApp();

    function initApp() {
        if (userName && userAvatar) {
            displayUserName.textContent = userName;
            displayUserAvatar.src = userAvatar;
            mainHeader.classList.remove('hidden');
            initLobby();
        } else {
            renderAvatarSelector(); // Hiển thị danh sách avatar cho người dùng chọn
            showSection('login');
            mainHeader.classList.add('hidden');
        }
    }

    // Render danh sách Avatar
    function renderAvatarSelector() {
        const selector = document.getElementById('avatar-selector');
        selector.innerHTML = '';
        AVATAR_SEEDS.forEach((seed, index) => {
            const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
            const img = document.createElement('img');
            img.src = url;
            img.className = 'avatar-option';
            
            // Chọn mặc định cái đầu tiên nếu chưa có
            if (index === 0 && !userAvatar) userAvatar = url; 
            if (userAvatar === url) img.classList.add('selected');
            
            img.onclick = () => {
                document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
                img.classList.add('selected');
                userAvatar = url;
            };
            selector.appendChild(img);
        });
    }

    function doLogin() {
        const inputName = usernameInput.value.trim();
        if (inputName.length < 2) {
            alert("Vui lòng nhập tên của bạn (ít nhất 2 ký tự)!");
            return;
        }
        userName = inputName;
        localStorage.setItem('quiz_username', userName);
        localStorage.setItem('quiz_avatar', userAvatar); // Lưu avatar
        initApp(); 
    }

    document.getElementById('start-app-btn').addEventListener('click', doLogin);
    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doLogin(); });

    document.getElementById('change-name-btn').addEventListener('click', () => {
        localStorage.removeItem('quiz_username');
        localStorage.removeItem('quiz_avatar');
        userName = "";
        userAvatar = "";
        usernameInput.value = "";
        initApp();
    });

    function initLobby() {
        quizListContainer.innerHTML = '';
        QUIZ_LIST.forEach(quiz => {
            const btn = document.createElement('div');
            btn.className = 'quiz-card-btn';
            btn.innerHTML = `
                <span>${quiz.title}</span>
                <small>File: ${quiz.file}</small>
                <button class="btn-lb-small" onclick="event.stopPropagation(); loadLeaderboard('${quiz.id}', '${quiz.title}')">🏆 Xem BXH</button>
            `;
            btn.onclick = () => selectQuiz(quiz);
            quizListContainer.appendChild(btn);
        });

        showSection('lobby');
        appTitle.textContent = "Sảnh Chờ";
        homeBtn.classList.add('hidden');
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

    async function selectQuiz(quizObj) {
        currentQuiz = quizObj;
        appTitle.textContent = quizObj.title;
        homeBtn.classList.remove('hidden');
        timerDisplay.classList.remove('hidden');
        showSection('loading');

        try {
            const cacheBuster = `?t=${new Date().getTime()}`;
            const response = await fetch(currentQuiz.file + cacheBuster);
            if (!response.ok) throw new Error(`Không tìm thấy file ${currentQuiz.file}`);
            const rawData = await response.text();
            questions = parseData(rawData);
            startQuiz();
        } catch (error) {
            loadingSection.innerHTML = `<p style="color:red; text-align:center;">Lỗi: ${error.message}</p>`;
        }
    }

    function parseData(text) {
        const lines = text.split('\n');
        const parsed = [];
        let current = null;

        lines.forEach(line => {
            line = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim(); 
            if (!line) return;

            let qMatch = line.match(/^Ask\d+:\s*(.*)/i);
            if (qMatch) {
                if (current) parsed.push(current);
                current = { questionText: qMatch[1], options: [], images: [], type: 'single', rawKey: null };
                return;
            }

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
        });
        return parsed;
    }

    function startQuiz() {
        renderQuestions();
        showSection('quiz');
        quizForm.reset();
        startTime = Date.now();
        timerDisplay.classList.remove('hidden');
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }

    function renderQuestions() {
        questionsContainer.innerHTML = '';
        questions.forEach((q, qIndex) => {
            const block = document.createElement('div');
            block.className = 'question-block';

            const title = document.createElement('div');
            title.className = 'question-text';
            title.textContent = `Câu ${qIndex + 1}: ${q.questionText}`;
            if (q.type === 'multi') title.textContent += ' (Chọn nhiều)';
            if (q.type === 'essay') title.textContent += ' (Tự luận)';
            block.appendChild(title);

            if (q.images.length > 0) {
                const imgCont = document.createElement('div');
                imgCont.className = 'images-container';
                q.images.forEach(src => {
                    const img = document.createElement('img'); img.src = src; img.className = 'question-image';
                    img.onerror = () => img.style.display = 'none';
                    imgCont.appendChild(img);
                });
                block.appendChild(imgCont);
            }

            const optCont = document.createElement('div');
            optCont.className = 'options-group';

            if (q.type === 'essay') {
                optCont.innerHTML = `<textarea name="q${qIndex}" class="essay-input" placeholder="Nhập câu trả lời..."></textarea>`;
            } else if (q.type === 'short') {
                optCont.innerHTML = `<input type="text" name="q${qIndex}" class="short-input" placeholder="Nhập đáp án..." autocomplete="off">`;
            } else {
                q.options.forEach((opt, oIdx) => {
                    optCont.innerHTML += `<label class="option-label"><input type="${q.type==='multi'?'checkbox':'radio'}" name="q${qIndex}" value="${oIdx+1}"> ${opt}</label>`;
                });
            }
            block.appendChild(optCont);
            questionsContainer.appendChild(block);
        });
    }

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        timerSpan.textContent = `${m}:${s}`;
    }

    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearInterval(timerInterval);
        const timeTakenMs = Date.now() - startTime;
        const timeStr = timerSpan.textContent;
        evaluateAndSaveResults(timeTakenMs, timeStr);
    });

    async function evaluateAndSaveResults(timeTakenMs, timeStr) {
        let correctCount = 0;
        let objectiveCount = 0; 
        const formData = new FormData(quizForm);
        reviewContainer.innerHTML = '';

        questions.forEach((q, qIndex) => {
            if (q.type === 'essay') {
                reviewContainer.appendChild(buildReviewItem(q, qIndex, null, formData));
            } else {
                objectiveCount++;
                let isMatch = false;
                if (q.type === 'single') { isMatch = parseInt(formData.get(`q${qIndex}`)) === q.key; } 
                else if (q.type === 'multi') {
                    const arr = formData.getAll(`q${qIndex}`).map(Number);
                    isMatch = q.key.every((v, i) => (v===1 && arr.includes(i+1)) || (v===0 && !arr.includes(i+1)));
                } 
                else if (q.type === 'short') {
                    isMatch = (formData.get(`q${qIndex}`)||'').trim().toLowerCase() === q.key.trim().toLowerCase();
                }

                if (isMatch) correctCount++;
                reviewContainer.appendChild(buildReviewItem(q, qIndex, isMatch, formData));
            }
        });

        const accuracy = objectiveCount > 0 ? Math.round((correctCount / objectiveCount) * 100) : 0;
        const wrongCount = objectiveCount - correctCount;

        document.getElementById('score-display').textContent = `${correctCount}/${objectiveCount}`;
        document.getElementById('accuracy-display').textContent = `${accuracy}%`;
        document.getElementById('time-display').textContent = timeStr;
        showSection('result');
        window.scrollTo(0, 0);

        // Lưu thông tin bao gồm cả Avatar lên Firebase
        const record = {
            name: userName,
            avatar: userAvatar,
            correct: correctCount,
            wrong: wrongCount,
            total: objectiveCount,
            accuracy: accuracy,
            timeStr: timeStr,
            timeMs: timeTakenMs,
            timestamp: Date.now()
        };

        try {
            const dbUrl = `${FIREBASE_BASE_URL}/leaderboard_${currentQuiz.id}.json`;
            const res = await fetch(dbUrl);
            const data = await res.json();
            
            let existingKey = null;
            let shouldUpdate = true;

            if (data) {
                for (const [key, val] of Object.entries(data)) {
                    if (val.name.trim().toLowerCase() === userName.trim().toLowerCase()) {
                        existingKey = key; 
                        if (record.correct < val.correct) {
                            shouldUpdate = false; 
                        } else if (record.correct === val.correct && record.timeMs >= val.timeMs) {
                            shouldUpdate = false; 
                        }
                        break; 
                    }
                }
            }

            if (shouldUpdate) {
                if (existingKey) {
                    await fetch(`${FIREBASE_BASE_URL}/leaderboard_${currentQuiz.id}/${existingKey}.json`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record)
                    });
                } else {
                    await fetch(dbUrl, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record)
                    });
                }
            }
        } catch (error) { console.error("Lỗi lưu BXH", error); }
    }

    function buildReviewItem(q, qIndex, isCorrect, formData) {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.innerHTML = `<h4>Câu ${qIndex + 1}: ${q.questionText}</h4>`;
        q.images.forEach(src => {
            const img = document.createElement('img'); img.src = src; img.className = 'review-image'; div.appendChild(img);
        });

        if (q.type === 'essay') {
            div.classList.add('review-essay');
            div.innerHTML += `<p class="feedback-text feedback-essay">Tự luận</p><p><b>Bài làm:</b> ${formData.get(`q${qIndex}`) || "(Trống)"}</p><p><b>Gợi ý:</b> ${q.key}</p>`;
        } else {
            div.classList.add(isCorrect ? 'review-correct' : 'review-incorrect');
            div.innerHTML += `<p class="feedback-text ${isCorrect?'feedback-correct':'feedback-incorrect'}">${isCorrect?'✓ Chính xác':'✗ Sai rồi'}</p>`;
            if (q.type === 'single') div.innerHTML += `<p>Đáp án đúng: ${q.options[q.key - 1]}</p>`;
            else if (q.type === 'multi') {
                const opts = q.key.map((v, i) => v===1 ? q.options[i] : null).filter(x=>x);
                div.innerHTML += `<p>Đáp án đúng: ${opts.join(', ')}</p>`;
            }
            else if (q.type === 'short') div.innerHTML += `<p>Đáp án đúng: ${q.key} <br><span style="color:var(--text-muted)">Bạn nhập: ${formData.get(`q${qIndex}`)}</span></p>`;
        }
        return div;
    }

    // ==========================================
    // RENDER BẢNG XẾP HẠNG (THÊM AVATAR VÀ HIỆU ỨNG TOP 3)
    // ==========================================
    window.loadLeaderboard = async function(quizId, quizTitle) {
        appTitle.textContent = "Bảng Xếp Hạng";
        homeBtn.classList.remove('hidden');
        document.getElementById('lb-title').textContent = `Môn: ${quizTitle}`;
        lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Đang tải dữ liệu...</td></tr>`;
        showSection('leaderboard');

        try {
            const res = await fetch(`${FIREBASE_BASE_URL}/leaderboard_${quizId}.json`);
            const data = await res.json();
            
            if (!data) {
                lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có ai thi môn này. Hãy là người đầu tiên!</td></tr>`;
                return;
            }

            let records = Object.values(data);
            records.sort((a, b) => {
                if (b.correct !== a.correct) return b.correct - a.correct; 
                return a.timeMs - b.timeMs; 
            });

            records = records.slice(0, 50);
            lbBody.innerHTML = '';

            records.forEach((rec, index) => {
                const tr = document.createElement('tr');
                const rank = index + 1;
                let rankIcon = rank;
                if(rank === 1) rankIcon = "🥇 1";
                if(rank === 2) rankIcon = "🥈 2";
                if(rank === 3) rankIcon = "🥉 3";
                if (rank <= 3) tr.className = `rank-${rank}`;

                // Logic Gắn Vương Miện, Màu Chữ & Hiệu Ứng
                let crownHtml = '';
                let nameClass = '';
                let sparklesHtml = '';
                
                if (rank === 1) { 
                    crownHtml = '<div class="crown-icon">👑</div>'; 
                    nameClass = 'gold-text'; 
                    // Tạo 3 hạt lấp lánh (sparkles) xung quanh tên
                    sparklesHtml = `
                        <div class="sparkle" style="top: -5px; left: -10px; animation-delay: 0s;"></div>
                        <div class="sparkle" style="bottom: 0px; right: -15px; animation-delay: 0.5s;"></div>
                        <div class="sparkle" style="top: 50%; right: 50%; animation-delay: 1s;"></div>
                    `;
                } else if (rank === 2) { 
                    nameClass = 'silver-text'; 
                } else if (rank === 3) { 
                    nameClass = 'bronze-text'; 
                }

                // Nếu người chơi cũ chưa có avatar, lấy avatar mặc định bằng tên của họ
                let displayAvatar = rec.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${rec.name}`;

                tr.innerHTML = `
                    <td>${rankIcon}</td>
                    <td>
                        <div class="player-info-container">
                            <div class="avatar-wrapper">
                                ${crownHtml}
                                <img src="${displayAvatar}" class="lb-avatar">
                            </div>
                            <div class="sparkle-box">
                                <span class="${nameClass}">${escapeHTML(rec.name)}</span>
                                ${sparklesHtml}
                            </div>
                        </div>
                    </td>
                    <td style="color:var(--primary-color); font-weight:bold;">${rec.correct}/${rec.total}</td>
                    <td>${rec.accuracy}%</td>
                    <td>${rec.timeStr}</td>
                    <td><span style="color:green">✓${rec.correct}</span> / <span style="color:red">✗${rec.wrong}</span></td>
                `;
                lbBody.appendChild(tr);
            });

        } catch (error) {
            lbBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Lỗi tải dữ liệu.</td></tr>`;
        }
    };

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;','<': '&lt;','>': '&gt;',"'": '&#39;','"': '&quot;'}[tag] || tag));
    }

    document.getElementById('retake-btn').addEventListener('click', () => { selectQuiz(currentQuiz); });
    document.getElementById('view-leaderboard-btn').addEventListener('click', () => { window.loadLeaderboard(currentQuiz.id, currentQuiz.title); });
    homeBtn.addEventListener('click', () => { clearInterval(timerInterval); initLobby(); });
    document.getElementById('lb-back-btn').addEventListener('click', () => { initLobby(); });
});
