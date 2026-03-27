/**
 * EdTech Quiz - Nâng cấp: Tên người dùng & Bảng xếp hạng
 */

// ==========================================
// 1. CẤU HÌNH ĐỀ THI VÀ DATABASE
// ==========================================
const QUIZ_LIST = [
    { id: "cong_nghe", title: "Ôn tập Công Nghệ", file: "data.txt" },
    { id: "tieng_anh", title: "Bài tập Tiếng Anh", file: "data1.txt" }
];

// Thay bằng URL Database Firebase của bạn
const FIREBASE_BASE_URL = "https://ontap-59972-default-rtdb.firebaseio.com";

document.addEventListener("DOMContentLoaded", () => {
    let currentQuiz = null; 
    let questions = [];
    let startTime = null;
    let timerInterval = null;
    let userName = localStorage.getItem('quiz_username') || "";

    // DOM Elements
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
    const usernameInput = document.getElementById('username-input');

    // ==========================================
    // KHỞI ĐỘNG HỆ THỐNG
    // ==========================================
    initApp();

    function initApp() {
        if (userName) {
            displayUserName.textContent = userName;
            mainHeader.classList.remove('hidden');
            initLobby();
        } else {
            showSection('login');
            mainHeader.classList.add('hidden');
        }
    }

    // Xử lý Đăng nhập / Đổi tên
    function doLogin() {
        const inputName = usernameInput.value.trim();
        if (inputName.length < 2) {
            alert("Vui lòng nhập tên của bạn (ít nhất 2 ký tự)!");
            return;
        }
        userName = inputName;
        localStorage.setItem('quiz_username', userName);
        initApp(); // Khởi động lại vào sảnh
    }

    document.getElementById('start-app-btn').addEventListener('click', doLogin);

    // Hỗ trợ ấn phím Enter để vào sảnh
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            doLogin();
        }
    });

    document.getElementById('change-name-btn').addEventListener('click', () => {
        localStorage.removeItem('quiz_username');
        userName = "";
        usernameInput.value = "";
        initApp();
    });

    // ==========================================
    // SẢNH CHỜ (LOBBY)
    // ==========================================
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
        // Ẩn đồng hồ nhưng không làm ẩn tên User
        timerDisplay.classList.add('hidden'); 
    }

    // ==========================================
    // ĐIỀU HƯỚNG GIAO DIỆN (FIX LỖI KẸT MÀN HÌNH)
    // ==========================================
    function showSection(sectionId) {
        // Đảm bảo ẨN TẤT CẢ mọi thứ trước
        ['login', 'lobby', 'loading', 'quiz', 'result', 'leaderboard'].forEach(id => {
            const el = document.getElementById(`${id}-section`);
            if (el) el.classList.add('hidden');
        });
        // Chỉ HIỆN duy nhất section được gọi
        const target = document.getElementById(`${sectionId}-section`);
        if (target) target.classList.remove('hidden');
    }

    // ==========================================
    // TẢI & CHẠY BÀI THI
    // ==========================================
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
            line = line.trim();
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

    // ==========================================
    // CHẤM ĐIỂM & ĐẨY LÊN BẢNG XẾP HẠNG
    // ==========================================
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

        // Cập nhật UI
        document.getElementById('score-display').textContent = `${correctCount}/${objectiveCount}`;
        document.getElementById('accuracy-display').textContent = `${accuracy}%`;
        document.getElementById('time-display').textContent = timeStr;
        showSection('result');
        window.scrollTo(0, 0);

        // GỬI DỮ LIỆU LÊN FIREBASE BẢNG XẾP HẠNG
        const record = {
            name: userName,
            correct: correctCount,
            wrong: wrongCount,
            total: objectiveCount,
            accuracy: accuracy,
            timeStr: timeStr,
            timeMs: timeTakenMs,
            timestamp: Date.now()
        };

        try {
            await fetch(`${FIREBASE_BASE_URL}/leaderboard_${currentQuiz.id}.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
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
            div.innerHTML += `<p class="feedback-text feedback-essay">Tự luận</p>
                              <p><b>Bài làm:</b> ${formData.get(`q${qIndex}`) || "(Trống)"}</p><p><b>Gợi ý:</b> ${q.key}</p>`;
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
    // TẢI VÀ HIỂN THỊ BẢNG XẾP HẠNG
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

                tr.innerHTML = `
                    <td>${rankIcon}</td>
                    <td><b>${escapeHTML(rec.name)}</b></td>
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

    // Gắn sự kiện nút bấm
    document.getElementById('retake-btn').addEventListener('click', () => {
        selectQuiz(currentQuiz); 
    });

    homeBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        initLobby();
    });

    document.getElementById('lb-back-btn').addEventListener('click', () => {
        initLobby(); 
    });
});
