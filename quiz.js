/**
 * EdTech Quiz Logic Controller - ĐA ĐỀ THI
 */

// ==========================================
// 1. CẤU HÌNH DANH SÁCH BÀI THI (Sửa ở đây)
// ==========================================
const QUIZ_LIST = [
    { 
        id: "cong_nghe", // ID phải viết liền không dấu (Dùng để lưu Firebase)
        title: "Ôn tập Công Nghệ", // Tên hiện trên nút bấm
        file: "data.txt" // Tên file chứa dữ liệu
    },
    { 
        id: "tieng_anh", 
        title: "Bài tập Tiếng Anh", 
        file: "data1.txt" 
    },
    // Bạn có thể thêm file mới tùy ý: { id: "lich_su", title: "Lịch Sử", file: "data2.txt" }
];

// Firebase URL gốc (Hệ thống sẽ tự động ghép ID vào sau để tách biệt)
const FIREBASE_BASE_URL = "https://ontap-59972-default-rtdb.firebaseio.com/stats_";

document.addEventListener("DOMContentLoaded", () => {
    let currentQuiz = null; // Lưu trữ đề thi đang chọn
    let questions = [];
    let startTime = null;
    let timerInterval = null;

    // --- DOM ELEMENTS ---
    const lobbySection = document.getElementById('lobby-section');
    const loadingSection = document.getElementById('loading-section');
    const quizSection = document.getElementById('quiz-section');
    const resultSection = document.getElementById('result-section');
    
    const quizListContainer = document.getElementById('quiz-list-container');
    const questionsContainer = document.getElementById('questions-container');
    const quizForm = document.getElementById('quiz-form');
    const reviewContainer = document.getElementById('review-container');
    
    const headerStats = document.getElementById('header-stats');
    const homeBtn = document.getElementById('home-btn');
    const appTitle = document.getElementById('app-main-title');
    const timerDisplay = document.querySelector('#timer-display span');
    const attemptsSpan = document.querySelector('#attempts-display span');

    // Khởi tạo Sảnh
    initLobby();

    function initLobby() {
        quizListContainer.innerHTML = '';
        
        QUIZ_LIST.forEach(quiz => {
            const btn = document.createElement('button');
            btn.className = 'quiz-card-btn';
            btn.innerHTML = `
                ${quiz.title}
                <small>File: ${quiz.file}</small>
            `;
            btn.onclick = () => selectQuiz(quiz);
            quizListContainer.appendChild(btn);
        });

        showSection('lobby');
        appTitle.textContent = "Hệ thống Trắc nghiệm";
        headerStats.classList.add('hidden');
        homeBtn.classList.add('hidden');
    }

    async function selectQuiz(quizObj) {
        currentQuiz = quizObj;
        appTitle.textContent = quizObj.title;
        homeBtn.classList.remove('hidden');
        headerStats.classList.remove('hidden');
        showSection('loading');

        try {
            // Lấy số lượt làm bài RIÊNG cho bài này
            fetchCurrentQuizAttempts();

            // Tải file dữ liệu tương ứng
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

    // --- FIREBASE LOGIC (TÁCH BIỆT THEO ID) ---
    function getFirebaseUrl() {
        return `${FIREBASE_BASE_URL}${currentQuiz.id}.json`;
    }

    async function fetchCurrentQuizAttempts() {
        attemptsSpan.textContent = "...";
        try {
            const response = await fetch(getFirebaseUrl());
            const data = await response.json();
            attemptsSpan.textContent = (data && data.totalAttempts) ? data.totalAttempts : 0;
        } catch (error) {
            attemptsSpan.textContent = "Lỗi";
        }
    }

    async function incrementQuizAttempts() {
        try {
            const response = await fetch(getFirebaseUrl());
            let data = await response.json();
            let currentTotal = (data && data.totalAttempts) ? data.totalAttempts : 0;
            currentTotal += 1;

            await fetch(getFirebaseUrl(), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ totalAttempts: currentTotal })
            });
            attemptsSpan.textContent = currentTotal;
        } catch (error) {
            console.error("Lỗi Firebase");
        }
    }

    // --- DATA PARSER ---
    function parseData(text) {
        const lines = text.split('\n');
        const parsedQuestions = [];
        let currentQ = null;

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            let qMatch = line.match(/^Ask\d+:\s*(.*)/i);
            if (qMatch) {
                if (currentQ) parsedQuestions.push(currentQ);
                currentQ = { questionText: qMatch[1], options: [], rawKey: null, type: 'single' };
                return;
            }

            let tMatch = line.match(/^Type:\s*(.*)/i);
            if (tMatch && currentQ) { currentQ.type = tMatch[1].toLowerCase().trim(); return; }

            let aMatch = line.match(/^answer\d+:\s*(.*)/i);
            if (aMatch && currentQ) { currentQ.options.push(aMatch[1]); return; }

            let kMatch = line.match(/^Key:\s*(.*)/i);
            if (kMatch && currentQ) { currentQ.rawKey = kMatch[1]; }
        });
        if (currentQ) parsedQuestions.push(currentQ);

        parsedQuestions.forEach(q => {
             if (q.type === 'essay' || q.type === 'short') {
                 q.key = q.rawKey;
             } else {
                 if (q.rawKey && q.rawKey.includes(',')) {
                     q.type = 'multi';
                     q.key = q.rawKey.split(',').map(Number);
                 } else if (q.rawKey) {
                     q.key = parseInt(q.rawKey, 10);
                 }
             }
        });

        return parsedQuestions;
    }

    // --- QUIZ EXECUTION ---
    function startQuiz() {
        renderQuestions();
        showSection('quiz');
        
        quizForm.reset();
        startTime = Date.now();
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }

    function renderQuestions() {
        questionsContainer.innerHTML = '';
        const fragment = document.createDocumentFragment();

        questions.forEach((q, qIndex) => {
            const block = document.createElement('div');
            block.className = 'question-block';

            const title = document.createElement('div');
            title.className = 'question-text';
            title.textContent = `Câu ${qIndex + 1}: ${q.questionText}`;
            if (q.type === 'multi') title.textContent += ' (Chọn nhiều đáp án)';
            if (q.type === 'essay') title.textContent += ' (Tự luận)';
            block.appendChild(title);

            const optionsGroup = document.createElement('div');
            optionsGroup.className = 'options-group';

            if (q.type === 'essay') {
                const textarea = document.createElement('textarea');
                textarea.name = `question_${qIndex}`;
                textarea.className = 'essay-input';
                textarea.placeholder = 'Nhập câu trả lời...';
                optionsGroup.appendChild(textarea);
            } else if (q.type === 'short') {
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `question_${qIndex}`;
                input.className = 'short-input';
                input.placeholder = 'Nhập đáp án...';
                input.autocomplete = "off";
                optionsGroup.appendChild(input);
            } else {
                q.options.forEach((optText, optIndex) => {
                    const label = document.createElement('label');
                    label.className = 'option-label';
                    const input = document.createElement('input');
                    input.type = q.type === 'single' ? 'radio' : 'checkbox';
                    input.name = `question_${qIndex}`;
                    input.value = optIndex + 1;
                    label.appendChild(input);
                    label.appendChild(document.createTextNode(` ${optText}`));
                    optionsGroup.appendChild(label);
                });
            }

            block.appendChild(optionsGroup);
            fragment.appendChild(block);
        });
        questionsContainer.appendChild(fragment);
    }

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }

    // --- NỘP BÀI ---
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearInterval(timerInterval);
        
        // Cập nhật số lượt làm bài LÊN DATABASE CỦA ĐÚNG MÔN ĐÓ
        await incrementQuizAttempts();

        const timeTakenMs = Date.now() - startTime;
        evaluateResults(timeTakenMs);
    });

    function evaluateResults(timeTakenMs) {
        let correctCount = 0;
        let objectiveCount = 0; 
        const formData = new FormData(quizForm);
        reviewContainer.innerHTML = '';
        const reviewFragment = document.createDocumentFragment();

        questions.forEach((q, qIndex) => {
            if (q.type === 'essay') {
                reviewFragment.appendChild(buildReviewItem(q, qIndex, null, formData));
            } else {
                objectiveCount++;
                const isCorrect = checkAnswer(q, qIndex, formData);
                if (isCorrect) correctCount++;
                reviewFragment.appendChild(buildReviewItem(q, qIndex, isCorrect, formData));
            }
        });

        reviewContainer.appendChild(reviewFragment);

        const accuracy = objectiveCount > 0 ? Math.round((correctCount / objectiveCount) * 100) : 0;
        const m = String(Math.floor(timeTakenMs / 60000)).padStart(2, '0');
        const s = String(Math.floor((timeTakenMs % 60000) / 1000)).padStart(2, '0');

        document.getElementById('score-display').textContent = `${correctCount}/${objectiveCount}`;
        document.getElementById('accuracy-display').textContent = `${accuracy}%`;
        document.getElementById('time-display').textContent = `${m}:${s}`;

        showSection('result');
        window.scrollTo(0, 0);
    }

    function checkAnswer(q, qIndex, formData) {
        if (q.type === 'single') {
            const selected = formData.get(`question_${qIndex}`);
            return selected && parseInt(selected, 10) === q.key;
        } else if (q.type === 'multi') {
            const selectedArr = formData.getAll(`question_${qIndex}`).map(Number);
            let isMatch = true;
            q.key.forEach((val, idx) => {
                if (selectedArr.includes(idx + 1) !== (val === 1)) isMatch = false;
            });
            return isMatch;
        } else if (q.type === 'short') {
            const selected = formData.get(`question_${qIndex}`);
            if (!selected) return false;
            return selected.trim().toLowerCase() === q.key.trim().toLowerCase();
        }
        return false;
    }

    function buildReviewItem(q, qIndex, isCorrect, formData) {
        const div = document.createElement('div');
        const title = document.createElement('h4');
        title.textContent = `Câu ${qIndex + 1}: ${q.questionText}`;
        div.appendChild(title);

        if (q.type === 'essay') {
            div.className = 'review-item review-essay';
            const feedback = document.createElement('p');
            feedback.className = 'feedback-text feedback-essay';
            feedback.textContent = 'Trạng thái: Cần giáo viên chấm điểm';
            div.appendChild(feedback);

            const userAnswer = formData.get(`question_${qIndex}`);
            const userAnsDiv = document.createElement('div');
            userAnsDiv.style.marginTop = '10px';
            userAnsDiv.innerHTML = `<strong>Bài làm của bạn:</strong><br/>
                <div style="background: #fff; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 5px; white-space: pre-wrap;">${userAnswer || '<i>(Bỏ trống)</i>'}</div>`;
            div.appendChild(userAnsDiv);

            const correctInfo = document.createElement('div');
            correctInfo.style.marginTop = '15px';
            correctInfo.innerHTML = `<strong>Đáp án gợi ý:</strong><br/>
                <div style="background: #f0fdf4; padding: 10px; border: 1px solid #bbf7d0; border-radius: 4px; margin-top: 5px; white-space: pre-wrap; color: #166534;">${q.key || 'Không có gợi ý'}</div>`;
            div.appendChild(correctInfo);

        } else {
            div.className = `review-item ${isCorrect ? 'review-correct' : 'review-incorrect'}`;
            const feedback = document.createElement('p');
            feedback.className = `feedback-text ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
            feedback.textContent = isCorrect ? '✓ Chính xác' : '✗ Chưa chính xác';
            div.appendChild(feedback);

            const correctInfo = document.createElement('p');
            correctInfo.style.marginTop = '10px';
            correctInfo.style.fontSize = '0.9rem';
            
            if (q.type === 'single') {
                correctInfo.textContent = `Đáp án đúng: ${q.options[q.key - 1]}`;
            } else if (q.type === 'multi') {
                const correctOpts = q.key.map((val, idx) => val === 1 ? q.options[idx] : null).filter(v => v !== null);
                correctInfo.textContent = `Đáp án đúng: ${correctOpts.join(', ')}`;
            } else if (q.type === 'short') {
                const userAnswer = formData.get(`question_${qIndex}`) || 'Bỏ trống';
                correctInfo.innerHTML = `<strong>Đáp án đúng:</strong> ${q.key} <br/><span style="color:var(--text-muted)">Bạn đã nhập: ${userAnswer}</span>`;
            }
            div.appendChild(correctInfo);
        }
        return div;
    }

    // --- ĐIỀU HƯỚNG GIAO DIỆN ---
    function showSection(sectionId) {
        lobbySection.classList.add('hidden');
        loadingSection.classList.add('hidden');
        quizSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        document.getElementById(sectionId + '-section').classList.remove('hidden');
    }

    // Nút điều hướng
    document.getElementById('retake-btn').addEventListener('click', () => {
        selectQuiz(currentQuiz); 
    });

    homeBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        initLobby(); // Quay về sảnh
    });

    document.getElementById('back-lobby-btn').addEventListener('click', () => {
        initLobby(); // Quay về sảnh từ kết quả
    });
});


