let state = {
    mode: 'hourly', 
    hourly: { hourId: '', board: Array(6).fill('').map(() => Array(5).fill('')), colors: Array(6).fill('').map(() => Array(5).fill('')), currentRow: 0, currentCol: 0, status: 'IN_PROGRESS', word: '' },
    endless: { board: Array(6).fill('').map(() => Array(5).fill('')), colors: Array(6).fill('').map(() => Array(5).fill('')), currentRow: 0, currentCol: 0, status: 'IN_PROGRESS', word: '', history: [], score: 0, streak: 0 }
};

function init() {
    if (typeof ANSWERS === 'undefined' || typeof ALL_WORDS === 'undefined') {
        window.ANSWERS = ["SİMGE"]; window.ALL_WORDS = ["SİMGE", "KALEM"];
    }

    const saved = localStorage.getItem('sarmalWordleDualState');
    if (saved) { state = { ...state, ...JSON.parse(saved) }; }

    const d = new Date();
    const hourId = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
    if (state.hourly.hourId !== hourId) {
        state.hourly = { hourId: hourId, board: Array(6).fill('').map(() => Array(5).fill('')), colors: Array(6).fill('').map(() => Array(5).fill('')), currentRow: 0, currentCol: 0, status: 'IN_PROGRESS', word: getHourlyWord() };
        saveState();
    }

    if (!state.endless.word || state.endless.status !== 'IN_PROGRESS') { startNewEndlessGame(); }

    document.getElementById('btn-hourly').addEventListener('click', () => switchMode('hourly'));
    document.getElementById('btn-endless').addEventListener('click', () => switchMode('endless'));

    setupBoardWithoutAnimation(); 
    setupKeyboard();
    startCountdownTimer();

    if (state.mode === 'hourly' && state.hourly.status !== 'IN_PROGRESS') {
        setTimeout(() => {
            showToast("Bu saatin hakkını doldurdun! Yeni kelimeyi bekle. ⏳", 3500);
        }, 500);
    }
}

function saveState() { localStorage.setItem('sarmalWordleDualState', JSON.stringify(state)); }

function getHourlyWord() {
    const d = new Date();
    const seed = d.getFullYear() * 1000000 + (d.getMonth() + 1) * 10000 + d.getDate() * 100 + d.getHours();
    let rand = Math.sin(seed) * 10000;
    return ANSWERS[Math.floor((rand - Math.floor(rand)) * ANSWERS.length)];
}

function getEndlessWord() {
    let validWords = ANSWERS.filter(w => !state.endless.history.includes(w));
    if(validWords.length === 0) { state.endless.history = []; validWords = ANSWERS; }
    const lastWord = state.endless.history[state.endless.history.length - 1] || "";
    const filtered = validWords.filter(w => w[0] !== lastWord[0]);
    if(filtered.length > 0) validWords = filtered;
    return validWords[Math.floor(Math.random() * validWords.length)];
}

function setupBoardWithoutAnimation() {
    const display = document.getElementById('mode-display');
    const btnHourly = document.getElementById('btn-hourly');
    const btnEndless = document.getElementById('btn-endless');
    
    if (state.mode === 'hourly') {
        display.innerHTML = `YENİ KELİMEYE: <span id="ui-timer" class="highlight">--:--</span>`;
        btnHourly.style.display = "none";
        btnEndless.style.display = "flex";
    } else {
        display.innerHTML = `SERİ: <span class="highlight">${state.endless.streak}</span> | SKOR: <span class="highlight">${state.endless.score}</span>`;
        btnHourly.style.display = "flex";
        btnEndless.style.display = "none";
    }
    setupBoard();
}

function switchMode(newMode) {
    if (state.mode === newMode) return; 
    state.mode = newMode;
    
    const display = document.getElementById('mode-display');
    const btnHourly = document.getElementById('btn-hourly');
    const btnEndless = document.getElementById('btn-endless');
    const boardEl = document.getElementById('board');
    const infoBarContainer = document.getElementById('info-bar-container');
    
    boardEl.style.opacity = 0;
    boardEl.style.transform = newMode === 'endless' ? 'scale(0.92) translateY(-10px)' : 'scale(1.05) translateY(10px)';
    infoBarContainer.style.opacity = 0;

    setTimeout(() => {
        if (newMode === 'hourly') {
            display.innerHTML = `YENİ KELİMEYE: <span id="ui-timer" class="highlight">--:--</span>`;
            btnHourly.style.display = "none";
            btnEndless.style.display = "flex";
            if (state.hourly.status !== 'IN_PROGRESS') {
                setTimeout(() => showToast("Bu saati zaten oynadın! Yenilenmesini bekle. ⏳", 2500), 300);
            }
        } else {
            display.innerHTML = `SERİ: <span class="highlight">${state.endless.streak}</span> | SKOR: <span class="highlight">${state.endless.score}</span>`;
            btnHourly.style.display = "flex";
            btnEndless.style.display = "none";
        }
        setupBoard();
        saveState();
        
        boardEl.style.opacity = 1;
        boardEl.style.transform = 'scale(1) translateY(0)';
        infoBarContainer.style.opacity = 1;
    }, 250); 
}

function startNewEndlessGame() {
    state.endless.board = Array(6).fill('').map(() => Array(5).fill(''));
    state.endless.colors = Array(6).fill('').map(() => Array(5).fill(''));
    state.endless.currentRow = 0; state.endless.currentCol = 0;
    state.endless.status = 'IN_PROGRESS';
    state.endless.word = getEndlessWord();
    saveState();

    if (state.mode === 'endless') { 
        const boardEl = document.getElementById('board');
        boardEl.style.opacity = 0;
        boardEl.style.transform = 'scale(0.95)';
        setTimeout(() => {
            setupBoard();
            boardEl.style.opacity = 1;
            boardEl.style.transform = 'scale(1)';
        }, 200); 
    }
}

function startCountdownTimer() {
    function update() {
        if (state.mode !== 'hourly') return; 
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0); 
        const diff = nextHour - now;
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        const timerEl = document.getElementById('ui-timer');
        if(timerEl) timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        if (m === 0 && s === 0 && state.hourly.status !== 'IN_PROGRESS') {
            setTimeout(() => window.location.reload(), 2000);
        }
    }
    setInterval(update, 1000);
    update();
}

function setupBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    const currentData = state[state.mode];

    for (let r = 0; r < 6; r++) {
        const rowEl = document.createElement('div');
        rowEl.className = 'row';
        rowEl.id = `row-${r}`;
        for (let c = 0; c < 5; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${r}-${c}`;
            if (currentData.board[r][c]) {
                tile.textContent = currentData.board[r][c];
                if (currentData.colors[r][c]) tile.classList.add(currentData.colors[r][c]);
            }
            rowEl.appendChild(tile);
        }
        boardEl.appendChild(rowEl);
    }
    recalculateKeyboardColors();
}

function setupKeyboard() {
    document.querySelectorAll('.key').forEach(btn => {
        btn.onclick = (e) => { handleInput(e.currentTarget.dataset.key); e.currentTarget.blur(); };
    });
    document.onkeydown = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        let key = e.key.toLocaleUpperCase('tr-TR');
        if (key === 'ENTER') handleInput('ENTER');
        else if (key === 'BACKSPACE') handleInput('BACKSPACE');
        else if (/^[A-ZÇĞİÖŞÜ]$/.test(key)) handleInput(key);
    };
}

function handleInput(key) {
    const currentData = state[state.mode];
    
    if (currentData.status !== 'IN_PROGRESS') {
        if (state.mode === 'hourly') {
            showToast("Sıradaki kelime için saatin dolmasını bekle! ⏳", 2000);
        }
        return;
    }

    if (key === 'BACKSPACE') {
        if (currentData.currentCol > 0) {
            currentData.currentCol--;
            currentData.board[currentData.currentRow][currentData.currentCol] = '';
            const tile = document.getElementById(`tile-${currentData.currentRow}-${currentData.currentCol}`);
            tile.textContent = '';
            tile.classList.remove('pop');
        }
    } else if (key === 'ENTER') {
        submitWord(currentData);
    } else if (currentData.currentCol < 5) {
        currentData.board[currentData.currentRow][currentData.currentCol] = key;
        const tile = document.getElementById(`tile-${currentData.currentRow}-${currentData.currentCol}`);
        tile.textContent = key;
        tile.classList.remove('pop'); void tile.offsetWidth; tile.classList.add('pop');
        currentData.currentCol++;
    }
    saveState();
}

function submitWord(currentData) {
    if (currentData.currentCol < 5) { showToast("Yeterli harf yok!"); shakeRow(currentData.currentRow); return; }
    const guess = currentData.board[currentData.currentRow].join('');
    
    if (!ALL_WORDS.includes(guess)) { showToast("Bu kelime sözlükte yok!"); shakeRow(currentData.currentRow); return; }

    const targetArr = currentData.word.split('');
    const guessArr = guess.split('');
    const colors = Array(5).fill('absent');

    for (let i = 0; i < 5; i++) { if (guessArr[i] === targetArr[i]) { colors[i] = 'correct'; targetArr[i] = null; } }
    for (let i = 0; i < 5; i++) {
        if (colors[i] === 'correct') continue;
        const idx = targetArr.indexOf(guessArr[i]);
        if (idx > -1) { colors[i] = 'present'; targetArr[idx] = null; }
    }

    currentData.colors[currentData.currentRow] = colors;
    
    animateRow(currentData.currentRow, colors, () => {
        recalculateKeyboardColors();
        if (guess === currentData.word) handleWin(currentData);
        else if (currentData.currentRow === 5) handleLose(currentData);
        else { currentData.currentRow++; currentData.currentCol = 0; }
        saveState();
    });
}

function animateRow(row, colors, callback) {
    const tiles = document.getElementById(`row-${row}`).children;
    let completed = 0;
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            tiles[i].classList.add('flip-in');
            setTimeout(() => {
                tiles[i].classList.remove('flip-in');
                tiles[i].classList.add(colors[i], 'flip-out');
                setTimeout(() => {
                    tiles[i].classList.remove('flip-out');
                    completed++; if (completed === 5) callback();
                }, 200);
            }, 200);
        }, i * 150); 
    }
}

function recalculateKeyboardColors() {
    const currentData = state[state.mode];
    const keyColors = {};
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
            const letter = currentData.board[r][c];
            const color = currentData.colors[r][c];
            if (!letter) continue;
            if (color === 'correct') keyColors[letter] = 'correct';
            else if (color === 'present' && keyColors[letter] !== 'correct') keyColors[letter] = 'present';
            else if (color === 'absent' && keyColors[letter] !== 'correct' && keyColors[letter] !== 'present') keyColors[letter] = 'absent';
        }
    }
    document.querySelectorAll('.key').forEach(btn => {
        btn.classList.remove('correct', 'present', 'absent');
        if (keyColors[btn.dataset.key]) btn.classList.add(keyColors[btn.dataset.key]);
    });
}

function handleWin(currentData) {
    currentData.status = 'WIN';
    if (state.mode === 'hourly') {
        setTimeout(() => { showToast("Sarmalı Çözdün! 🎉 Yeni saati bekle.", 4000); }, 1000); 
    } else {
        const points = [100, 80, 60, 40, 20, 10][currentData.currentRow];
        const earned = Math.floor(points * (state.endless.streak <= 2 ? 1 : 1.5));
        state.endless.streak++;
        state.endless.score += earned;
        state.endless.history.push(currentData.word);
        
        const display = document.getElementById('mode-display');
        display.innerHTML = `SERİ: <span class="highlight">${state.endless.streak}</span> | SKOR: <span class="highlight">${state.endless.score}</span>`;
        
        setTimeout(() => { showToast(`Tebrikler! +${earned} Puan 🎉`, 2000); }, 500);
        setTimeout(() => { startNewEndlessGame(); }, 2500); 
    }
}

function handleLose(currentData) {
    currentData.status = 'LOSE';
    showToast(`Sarmal Kırıldı! Kelime: ${currentData.word}`, 3500);
    if (state.mode === 'endless') {
        state.endless.streak = 0;
        state.endless.score = Math.max(0, state.endless.score - 50);
        
        const display = document.getElementById('mode-display');
        display.innerHTML = `SERİ: <span class="highlight">${state.endless.streak}</span> | SKOR: <span class="highlight">${state.endless.score}</span>`;
        
        setTimeout(() => { startNewEndlessGame(); }, 3500);
    }
}

function shakeRow(row) { const el = document.getElementById(`row-${row}`); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function showToast(msg, duration = 2000) { const c = document.getElementById('toast-container'), t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; c.appendChild(t); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, duration); }

init();