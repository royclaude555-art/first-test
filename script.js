// --- 1. CORE STATE MODEL ---
const defaultPositions = ['투수', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'];

let gameState = {
  gameTitle: '2026 프로야구 LIVE',
  inning: 1,
  isTop: true, // true = 초 (원정공격), false = 말 (홈공격)
  balls: 0,
  strikes: 0,
  outs: 0,
  bases: [false, false, false],
  pitchCount: 0,
  awayTeam: {
    name: '원정팀',
    scores: Array(10).fill(null),
    runs: 0,
    hits: 0,
    errors: 0,
    currentBatterIdx: 0,
    pitcher: { name: '원정투수', backNum: '1' },
    lineup: [
      { order: 1, name: '김선두', pos: '중견수', backNum: '7' },
      { order: 2, name: '이타율', pos: '유격수', backNum: '2' },
      { order: 3, name: '박거포', pos: '좌익수', backNum: '34' },
      { order: 4, name: '최홈런', pos: '1루수', backNum: '10' },
      { order: 5, name: '정클린', pos: '지명타자', backNum: '25' },
      { order: 6, name: '강장타', pos: '우익수', backNum: '52' },
      { order: 7, name: '윤내야', pos: '3루수', backNum: '14' },
      { order: 8, name: '조포수', pos: '포수', backNum: '22' },
      { order: 9, name: '한빠름', pos: '2루수', backNum: '9' },
    ]
  },
  homeTeam: {
    name: '홈팀',
    scores: Array(10).fill(null),
    runs: 0,
    hits: 0,
    errors: 0,
    currentBatterIdx: 0,
    pitcher: { name: '홈투수', backNum: '11' },
    lineup: [
      { order: 1, name: '홍길동', pos: '2루수', backNum: '1' },
      { order: 2, name: '성춘향', pos: '중견수', backNum: '5' },
      { order: 3, name: '이몽룡', pos: '3루수', backNum: '3' },
      { order: 4, name: '임꺽정', pos: '1루수', backNum: '33' },
      { order: 5, name: '장길산', pos: '좌익수', backNum: '17' },
      { order: 6, name: '전우치', pos: '지명타자', backNum: '99' },
      { order: 7, name: '심청이', pos: '우익수', backNum: '12' },
      { order: 8, name: '놀부', pos: '포수', backNum: '42' },
      { order: 9, name: '흥부', pos: '유격수', backNum: '8' },
    ]
  }
};

// --- 2. INITIALIZATION ---
window.onload = function () {
  gameState.awayTeam.scores[0] = 0;
  renderManagementEditors();
  updateUI();
};

// --- 3. URL COPY FUNCTIONALITY ---
function copyShareUrl() {
  const currentUrl = window.location.href;
  
  // Fallback copy using text area for compatibility
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = currentUrl;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  
  try {
    document.execCommand('copy');
    showToast("중계 화면 URL 링크가 복사되었습니다!");
  } catch (err) {
    showToast("링크 복사에 실패했습니다. URL을 직접 복사해주세요.");
  } finally {
    document.body.removeChild(tempTextArea);
  }
}

// --- 4. TAB SWITCHING ---
function switchTab(tab) {
  const bView = document.getElementById('view-broadcast');
  const mView = document.getElementById('view-manage');
  const bBtn = document.getElementById('tab-broadcast');
  const mBtn = document.getElementById('tab-manage');

  if (tab === 'broadcast') {
    bView.classList.remove('hidden');
    mView.classList.add('hidden');
    bBtn.className = "px-4 py-1.5 rounded-lg text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg";
    mBtn.className = "px-4 py-1.5 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-200 transition-all";
  } else {
    bView.classList.add('hidden');
    mView.classList.remove('hidden');
    mBtn.className = "px-4 py-1.5 rounded-lg text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg";
    bBtn.className = "px-4 py-1.5 rounded-lg text-sm font-bold text-slate-400 hover:text-slate-200 transition-all";
  }
}

// --- 5. BSO & MATCH CONTROLS ---
function addBall() {
  gameState.pitchCount++;
  gameState.balls++;
  if (gameState.balls >= 4) {
    showToast("볼넷 (Four Balls)!");
    resetCountOnly();
  }
  updateUI();
}

function addStrike() {
  gameState.pitchCount++;
  gameState.strikes++;
  if (gameState.strikes >= 3) {
    showToast("삼진 아웃!");
    resetCountOnly();
    addOut(false);
    return;
  }
  updateUI();
}

function addOut(incrementPitch = true) {
  if (incrementPitch) gameState.pitchCount++;
  gameState.outs++;
  resetCountOnly();
  
  if (gameState.outs >= 3) {
    showToast("3아웃! 공수 교대");
    changeInning(1);
  }
  updateUI();
}

function resetCountOnly() {
  gameState.balls = 0;
  gameState.strikes = 0;
}

function resetCurrentCount() {
  gameState.balls = 0;
  gameState.strikes = 0;
  gameState.outs = 0;
  updateUI();
}

function toggleBase(baseNum) {
  const idx = baseNum - 1;
  gameState.bases[idx] = !gameState.bases[idx];
  updateUI();
}

function addScore(pts = 1) {
  const attackingTeam = gameState.isTop ? gameState.awayTeam : gameState.homeTeam;
  const currentInningIdx = gameState.inning - 1;
  if (attackingTeam.scores[currentInningIdx] === null) {
    attackingTeam.scores[currentInningIdx] = 0;
  }
  attackingTeam.scores[currentInningIdx] += pts;
  attackingTeam.runs += pts;
  updateUI();
}

function addHit() {
  gameState.pitchCount++;
  const attackingTeam = gameState.isTop ? gameState.awayTeam : gameState.homeTeam;
  attackingTeam.hits++;
  resetCountOnly();
  updateUI();
}

function changeInning(delta) {
  resetCountOnly();
  gameState.bases = [false, false, false];
  gameState.pitchCount = 0;

  if (delta > 0) {
    if (gameState.isTop) {
      gameState.isTop = false;
    } else {
      gameState.inning++;
      gameState.isTop = true;
    }
  } else if (delta < 0) {
    if (!gameState.isTop && gameState.inning >= 1) {
      gameState.isTop = true;
    } else if (gameState.inning > 1) {
      gameState.inning--;
      gameState.isTop = false;
    }
  }

  const currentIdx = gameState.inning - 1;
  const team = gameState.isTop ? gameState.awayTeam : gameState.homeTeam;
  if (team.scores[currentIdx] === null) {
    team.scores[currentIdx] = 0;
  }

  updateUI();
}

function nextBatter() {
  const attackingTeam = gameState.isTop ? gameState.awayTeam : gameState.homeTeam;
  attackingTeam.currentBatterIdx = (attackingTeam.currentBatterIdx + 1) % 9;
  resetCountOnly();
  updateUI();
}

function setCurrentBatter(idx) {
  const attackingTeam = gameState.isTop ? gameState.awayTeam : gameState.homeTeam;
  attackingTeam.currentBatterIdx = idx;
  resetCountOnly();
  updateUI();
}

// --- 6. RENDER UI ---
function updateUI() {
  // Names
  document.getElementById('away-name-display').innerText = gameState.awayTeam.name;
  document.getElementById('home-name-display').innerText = gameState.homeTeam.name;

  // Inning Status Text
  const inningText = `${gameState.inning}회${gameState.isTop ? '초' : '말'}`;
  document.getElementById('inning-status-badge').innerText = inningText;
  document.getElementById('ctrl-inning-text').innerText = inningText;

  // Attack Indicators
  if (gameState.isTop) {
    document.getElementById('away-attack-indicator').classList.remove('hidden');
    document.getElementById('home-attack-indicator').classList.add('hidden');
    document.getElementById('row-away').classList.add('bg-slate-800/80');
    document.getElementById('row-home').classList.remove('bg-slate-800/80');
  } else {
    document.getElementById('away-attack-indicator').classList.add('hidden');
    document.getElementById('home-attack-indicator').classList.remove('hidden');
    document.getElementById('row-home').classList.add('bg-slate-800/80');
    document.getElementById('row-away').classList.remove('bg-slate-800/80');
  }

  // Scores
  for (let i = 1; i <= 10; i++) {
    const awayVal = gameState.awayTeam.scores[i - 1];
    const homeVal = gameState.homeTeam.scores[i - 1];
    document.getElementById(`away-i${i}`).innerText = awayVal !== null ? awayVal : '-';
    document.getElementById(`home-i${i}`).innerText = homeVal !== null ? homeVal : '-';
  }

  // Totals
  document.getElementById('away-r').innerText = gameState.awayTeam.runs;
  document.getElementById('away-h').innerText = gameState.awayTeam.hits;
  document.getElementById('away-e').innerText = gameState.awayTeam.errors;

  document.getElementById('home-r').innerText = gameState.homeTeam.runs;
  document.getElementById('home-h').innerText = gameState.homeTeam.hits;
  document.getElementById('home-e').innerText = gameState.homeTeam.errors;

  // BSO Bulbs
  updateBulbs('b', gameState.balls, 3, 'bg-emerald-400');
  updateBulbs('s', gameState.strikes, 2, 'bg-amber-400');
  updateBulbs('o', gameState.outs, 2, 'bg-red-500');

  // Bases
  for (let b = 1; b <= 3; b++) {
    const baseEl = document.getElementById(`base-${b}`);
    const btnEl = document.getElementById(`btn-base-${b}`);
    if (gameState.bases[b - 1]) {
      baseEl.className = "absolute w-6 h-6 bg-amber-400 border border-white transition-colors shadow-[0_0_10px_#f59e0b]";
      btnEl.className = "bg-amber-600 border border-amber-400 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-md";
      if (b === 2) baseEl.classList.add('top-0', 'right-0');
      if (b === 3) baseEl.classList.add('top-0', 'left-0');
      if (b === 1) baseEl.classList.add('bottom-0', 'right-0');
    } else {
      baseEl.className = "absolute w-6 h-6 bg-slate-700 border border-slate-900 transition-colors";
      btnEl.className = "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold transition-all";
      if (b === 2) baseEl.classList.add('top-0', 'right-0');
      if (b === 3) baseEl.classList.add('top-0', 'left-0');
      if (b === 1) baseEl.classList.add('bottom-0', 'right-0');
    }
  }

  // Pitch Count
  document.getElementById('pitch-count-display').innerText = gameState.pitchCount;

  // Pitcher & Batter Info Cards
  const attackingTeam = gameState.isTop ? gameState.awayTeam : gameState.homeTeam;
  const defendingTeam = gameState.isTop ? gameState.homeTeam : gameState.awayTeam;

  document.getElementById('attacking-team-title').innerText = attackingTeam.name;
  document.getElementById('defending-team-title').innerText = `${defendingTeam.name} 수비`;

  const currentBatter = attackingTeam.lineup[attackingTeam.currentBatterIdx] || { name: '타자 미등록', backNum: '-' };
  document.getElementById('current-pitcher-name').innerText = `No.${defendingTeam.pitcher.backNum} ${defendingTeam.pitcher.name}`;
  document.getElementById('current-batter-name').innerText = `No.${currentBatter.backNum} ${currentBatter.name} (${currentBatter.pos})`;

  mapDefensivePositions(defendingTeam);
  renderBattingOrderList(attackingTeam);
}

function updateBulbs(prefix, count, max, activeColorClass) {
  for (let i = 1; i <= max; i++) {
    const bulb = document.getElementById(`${prefix}-${i}`);
    if (i <= count) {
      bulb.className = `w-4 h-4 rounded-full ${activeColorClass} shadow-md border border-white transition-all`;
    } else {
      bulb.className = `w-4 h-4 rounded-full bg-slate-800 border border-slate-700 transition-all`;
    }
  }
}

function mapDefensivePositions(defTeam) {
  const posMap = {
    '투수': defTeam.pitcher.name,
    '포수': '포수',
    '1루수': '1루수',
    '2루수': '2루수',
    '3루수': '3루수',
    '유격수': '유격수',
    '좌익수': '좌익수',
    '중견수': '중견수',
    '우익수': '우익수'
  };

  defTeam.lineup.forEach(player => {
    if (posMap.hasOwnProperty(player.pos)) {
      posMap[player.pos] = player.name;
    }
  });
  posMap['투수'] = defTeam.pitcher.name;

  document.getElementById('pos-P').innerText = posMap['투수'] || '투수';
  document.getElementById('pos-C').innerText = posMap['포수'] || '포수';
  document.getElementById('pos-1B').innerText = posMap['1루수'] || '1루수';
  document.getElementById('pos-2B').innerText = posMap['2루수'] || '2루수';
  document.getElementById('pos-3B').innerText = posMap['3루수'] || '3루수';
  document.getElementById('pos-SS').innerText = posMap['유격수'] || '유격수';
  document.getElementById('pos-LF').innerText = posMap['좌익수'] || '좌익수';
  document.getElementById('pos-CF').innerText = posMap['중견수'] || '중견수';
  document.getElementById('pos-RF').innerText = posMap['우익수'] || '우익수';
}

function renderBattingOrderList(attackingTeam) {
  const container = document.getElementById('batting-order-list');
  container.innerHTML = '';

  attackingTeam.lineup.forEach((player, idx) => {
    const isCurrent = idx === attackingTeam.currentBatterIdx;
    const item = document.createElement('div');
    item.onclick = () => setCurrentBatter(idx);
    item.className = `p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
      isCurrent 
        ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-md' 
        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
    }`;

    item.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="w-6 h-6 rounded-full ${isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'} text-xs font-black flex items-center justify-center">
          ${idx + 1}
        </span>
        <div>
          <div class="text-sm ${isCurrent ? 'text-amber-300 font-extrabold' : 'text-slate-200'}">
            No.${player.backNum} ${player.name}
          </div>
          <div class="text-[11px] text-slate-500">${player.pos}</div>
        </div>
      </div>
      ${isCurrent ? '<span class="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-extrabold uppercase">타석</span>' : ''}
    `;
    container.appendChild(item);
  });
}

// --- 7. EDITORS LOGIC ---
function renderManagementEditors() {
  renderTeamEditor('away', gameState.awayTeam);
  renderTeamEditor('home', gameState.homeTeam);
}

function renderTeamEditor(teamKey, teamData) {
  const container = document.getElementById(`${teamKey}-lineup-editor`);
  container.innerHTML = '';

  const pitcherBox = document.createElement('div');
  pitcherBox.className = "bg-indigo-950/40 border border-indigo-800 p-3 rounded-xl flex items-center gap-2 mb-3";
  pitcherBox.innerHTML = `
    <span class="text-xs font-bold text-indigo-400 w-14">선발투수</span>
    <input type="text" id="${teamKey}-p-num" value="${teamData.pitcher.backNum}" placeholder="등번호" class="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center text-white">
    <input type="text" id="${teamKey}-p-name" value="${teamData.pitcher.name}" placeholder="투수 이름" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold">
  `;
  container.appendChild(pitcherBox);

  teamData.lineup.forEach((player, idx) => {
    const row = document.createElement('div');
    row.className = "bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2";
    
    let posOptionsHtml = defaultPositions.map(pos => 
      `<option value="${pos}" ${player.pos === pos ? 'selected' : ''}>${pos}</option>`
    ).join('');

    row.innerHTML = `
      <span class="text-xs font-bold text-slate-500 w-6 text-center">${idx + 1}</span>
      <input type="text" id="${teamKey}-b${idx}-num" value="${player.backNum}" placeholder="번호" class="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center text-white">
      <input type="text" id="${teamKey}-b${idx}-name" value="${player.name}" placeholder="선수명" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-semibold">
      <select id="${teamKey}-b${idx}-pos" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300">
        ${posOptionsHtml}
      </select>
    `;
    container.appendChild(row);
  });
}

function saveLineups() {
  gameState.awayTeam.name = document.getElementById('input-away-name').value || '원정팀';
  gameState.homeTeam.name = document.getElementById('input-home-name').value || '홈팀';

  gameState.awayTeam.pitcher.backNum = document.getElementById('away-p-num').value;
  gameState.awayTeam.pitcher.name = document.getElementById('away-p-name').value;
  for (let i = 0; i < 9; i++) {
    gameState.awayTeam.lineup[i].backNum = document.getElementById(`away-b${i}-num`).value;
    gameState.awayTeam.lineup[i].name = document.getElementById(`away-b${i}-name`).value;
    gameState.awayTeam.lineup[i].pos = document.getElementById(`away-b${i}-pos`).value;
  }

  gameState.homeTeam.pitcher.backNum = document.getElementById('home-p-num').value;
  gameState.homeTeam.pitcher.name = document.getElementById('home-p-name').value;
  for (let i = 0; i < 9; i++) {
    gameState.homeTeam.lineup[i].backNum = document.getElementById(`home-b${i}-num`).value;
    gameState.homeTeam.lineup[i].name = document.getElementById(`home-b${i}-name`).value;
    gameState.homeTeam.lineup[i].pos = document.getElementById(`home-b${i}-pos`).value;
  }

  updateUI();
  showToast("선수 명단 및 라인업이 정상 적용되었습니다.");
  switchTab('broadcast');
}

function loadSampleData() {
  document.getElementById('input-away-name').value = "LG 트윈스";
  document.getElementById('input-home-name').value = "KIA 타이거즈";

  document.getElementById('away-p-name').value = "임찬규";
  document.getElementById('away-p-num').value = "1";
  const sampleAwayNames = ["홍창기", "신민재", "오스틴", "문보경", "오지환", "김현수", "박동원", "박해민", "문성주"];
  const sampleAwayPos = ["우익수", "2루수", "1루수", "3루수", "유격수", "지명타자", "포수", "중견수", "좌익수"];
  sampleAwayNames.forEach((n, i) => {
    document.getElementById(`away-b${i}-name`).value = n;
    document.getElementById(`away-b${i}-num`).value = (i + 10).toString();
    document.getElementById(`away-b${i}-pos`).value = sampleAwayPos[i];
  });

  document.getElementById('home-p-name').value = "양현종";
  document.getElementById('home-p-num').value = "54";
  const sampleHomeNames = ["박찬호", "최원준", "김도영", "최형우", "나성범", "소크라테스", "이우성", "김태군", "변우혁"];
  const sampleHomePos = ["유격수", "우익수", "3루수", "지명타자", "좌익수", "중견수", "1루수", "포수", "2루수"];
  sampleHomeNames.forEach((n, i) => {
    document.getElementById(`home-b${i}-name`).value = n;
    document.getElementById(`home-b${i}-num`).value = (i + 20).toString();
    document.getElementById(`home-b${i}-pos`).value = sampleHomePos[i];
  });

  showToast("샘플 라인업이 불러와졌습니다.");
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
  }, 2500);
}