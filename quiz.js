:root {
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    --bg-color: #f8fafc;
    --container-bg: #ffffff;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
    --correct-bg: #dcfce7;
    --correct-border: #22c55e;
    --incorrect-bg: #fee2e2;
    --incorrect-border: #ef4444;
    --gold: #fbbf24;
    --silver: #9ca3af;
    --bronze: #b45309;
    --font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-family); background-color: var(--bg-color); color: var(--text-main); line-height: 1.6; }
.app-container { max-width: 900px; margin: 40px auto; padding: 0 20px; }

/* Header */
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid var(--border-color); flex-wrap: wrap; gap: 15px; }
.header-title-group { display: flex; align-items: center; gap: 15px; }
.app-header h1 { font-size: 1.5rem; color: var(--text-main); }
.header-controls { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
.user-profile { background: #f1f5f9; padding: 8px 15px; border-radius: 20px; font-weight: 600; display: flex; gap: 10px; align-items: center; border: 1px solid var(--border-color); }
.btn-text { background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 0.85rem; font-weight: bold; text-decoration: underline; }

.btn-icon { background: #e2e8f0; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; color: var(--text-main); transition: 0.2s; }
.btn-icon:hover { background: #cbd5e1; }
.timer, .badge { font-weight: 600; background: var(--container-bg); padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border-color); white-space: nowrap; }

.section { background: var(--container-bg); border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
.hidden { display: none !important; }

/* QUẢNG CÁO & LỜI NHẮC (MỚI) */
.ad-container { text-align: center; margin: 20px 0; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
.ad-label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
.adblock-reminder { background: #f0fdf4; color: #166534; padding: 15px; border-radius: 10px; border: 2px solid #bbf7d0; text-align: center; margin-bottom: 30px; font-weight: bold; font-size: 1.05rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

/* CLASS CHUYÊN DỤNG ĐỂ ẨN SOCIAL BAR LÚC THI */
body.is-quizzing #social-bar-wrapper,
body.is-quizzing iframe {
    opacity: 0 !important;
    pointer-events: none !important;
    z-index: -9999 !important;
}

/* Màn hình Đăng nhập */
.login-box { max-width: 500px; margin: 0 auto; text-align: center; }
.login-box h2 { margin-bottom: 15px; color: var(--primary-color); }
#username-input { width: 100%; padding: 15px; font-size: 1.1rem; border: 2px solid var(--border-color); border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
#username-input:focus { outline: none; border-color: var(--primary-color); }
.warning-text { background: #fffbeb; color: #b45309; padding: 15px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 20px; border: 1px solid #fde68a; text-align: left; }

/* Sảnh (Lobby) */
.lobby-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
.quiz-card-btn { background: #ffffff; border: 2px solid var(--primary-color); color: var(--primary-color); padding: 25px 20px; border-radius: 12px; font-size: 1.2rem; font-weight: 700; cursor: pointer; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.quiz-card-btn:hover { background: var(--primary-color); color: #ffffff; transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); }
.quiz-card-btn small { font-size: 0.85rem; font-weight: 400; opacity: 0.8; }
.btn-lb-small { margin-top: 10px; font-size: 0.85rem; padding: 6px 12px; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; border-radius: 6px; cursor: pointer; }
.quiz-card-btn:hover .btn-lb-small { background: #ffffff; color: var(--primary-color); }

/* Câu hỏi & Input */
.question-block { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px dashed var(--border-color); }
.question-text { font-size: 1.1rem; font-weight: 600; margin-bottom: 15px; }
.images-container { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
.question-image { max-width: 100%; max-height: 450px; border-radius: 8px; border: 1px solid var(--border-color); object-fit: contain; }
.review-image { max-width: 200px; margin: 10px 0; border-radius: 6px; border: 1px solid var(--border-color); }

.options-group { display: flex; flex-direction: column; gap: 10px; }
.option-label { display: flex; align-items: center; padding: 12px 15px; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: 0.2s; }
.option-label:hover { background: #f1f5f9; }
.option-label input { margin-right: 12px; width: 18px; height: 18px; accent-color: var(--primary-color); }
.essay-input, .short-input { width: 100%; padding: 12px 15px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1rem; font-family: inherit; }
.essay-input { min-height: 120px; resize: vertical; }

/* Buttons */
.btn { padding: 12px 24px; font-size: 1rem; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.btn-primary { background: var(--primary-color); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary { background: var(--text-muted); color: white; }
.btn-secondary:hover { background: var(--text-main); }
.btn-large { width: 100%; font-size: 1.1rem; padding: 15px; }

/* Kết quả */
.stats { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
.stat-box { flex: 1; min-width: 120px; background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color); }
.stat-label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px; }
.stat-value { display: block; font-size: 1.5rem; font-weight: 700; color: var(--primary-color); }

.review-item { margin-bottom: 20px; padding: 20px; border-radius: 8px; border-left: 5px solid; background: #f8fafc; }
.review-correct { border-left-color: var(--correct-border); }
.review-incorrect { border-left-color: var(--incorrect-border); }
.review-essay { border-left-color: var(--primary-color); }
.feedback-text { font-size: 0.9rem; margin: 10px 0; font-weight: 600; }
.feedback-correct { color: #16a34a; }
.feedback-incorrect { color: #dc2626; }

/* BẢNG XẾP HẠNG (Leaderboard) */
.table-container { overflow-x: auto; margin-top: 20px; border-radius: 8px; border: 1px solid var(--border-color); }
.lb-table { width: 100%; border-collapse: collapse; text-align: left; }
.lb-table th, .lb-table td { padding: 12px 15px; border-bottom: 1px solid var(--border-color); }
.lb-table th { background-color: #f1f5f9; font-weight: 700; color: var(--text-main); white-space: nowrap; }
.lb-table tr:last-child td { border-bottom: none; }
.lb-table tbody tr:hover { background-color: #f8fafc; }

.rank-1 td { font-weight: bold; background-color: #fffbeb !important; }
.rank-1 td:first-child { color: var(--gold); font-size: 1.2rem; }
.rank-2 td { font-weight: bold; background-color: #f3f4f6 !important; }
.rank-2 td:first-child { color: var(--silver); font-size: 1.2rem; }
.rank-3 td { font-weight: bold; background-color: #fff7ed !important; }
.rank-3 td:first-child { color: var(--bronze); font-size: 1.2rem; }
