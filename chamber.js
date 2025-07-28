const rows = 10;
const cols = 10;
const minesCount = 10;
const minesweeper = document.getElementById('minesweeper');
const homeBtn = document.getElementById('home-btn');
const logoutBtn = document.getElementById('logout-btn');
const resetBtn = document.getElementById('reset-btn');

let board = [];
let revealedCount = 0;
let gameOver = false;

function initBoard() {
  board = [];
  revealedCount = 0;
  gameOver = false;
  minesweeper.innerHTML = '';

  // 初始化格子資料
  for(let r = 0; r < rows; r++) {
    board[r] = [];
    for(let c = 0; c < cols; c++) {
      board[r][c] = {
        mine: false,
        revealed: false,
        flagged: false,
        adjacentMines: 0,
        element: null
      };
    }
  }

  // 放置地雷
  let placed = 0;
  while(placed < minesCount) {
    let r = Math.floor(Math.random() * rows);
    let c = Math.floor(Math.random() * cols);
    if(!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  // 計算周圍地雷數
  for(let r = 0; r < rows; r++) {
    for(let c = 0; c < cols; c++) {
      if(!board[r][c].mine) {
        let count = 0;
        for(let dr = -1; dr <= 1; dr++) {
          for(let dc = -1; dc <=1; dc++) {
            let nr = r + dr;
            let nc = c + dc;
            if(nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if(board[nr][nc].mine) count++;
            }
          }
        }
        board[r][c].adjacentMines = count;
      }
    }
  }

  // 建立DOM元素
  for(let r = 0; r < rows; r++) {
    for(let c = 0; c < cols; c++) {
      const cell = document.createElement('button');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', onCellClick);
      cell.addEventListener('contextmenu', onCellRightClick);
      board[r][c].element = cell;
      minesweeper.appendChild(cell);
    }
  }
}

function onCellClick(e) {
  if(gameOver) return;
  const r = parseInt(e.currentTarget.dataset.row);
  const c = parseInt(e.currentTarget.dataset.col);
  const cell = board[r][c];
  if(cell.revealed || cell.flagged) return;
  revealCell(r, c);
  checkWin();
}

function onCellRightClick(e) {
  e.preventDefault();
  if(gameOver) return;
  const r = parseInt(e.currentTarget.dataset.row);
  const c = parseInt(e.currentTarget.dataset.col);
  const cell = board[r][c];
  if(cell.revealed) return;
  cell.flagged = !cell.flagged;
  cell.element.textContent = cell.flagged ? '🚩' : '';
  cell.element.classList.toggle('flagged', cell.flagged);
}

function revealCell(r, c) {
  const cell = board[r][c];
  if(cell.revealed || cell.flagged) return;
  cell.revealed = true;
  cell.element.classList.add('revealed');
  revealedCount++;

  if(cell.mine) {
    cell.element.textContent = '🍒'; // 用櫻桃代替地雷
    cell.element.classList.add('mine');
    gameOver = true;
    revealAllMines();
    alert('踩到櫻桃地雷了！遊戲結束 🍒💥');
    return;
  }

  if(cell.adjacentMines > 0) {
    cell.element.textContent = cell.adjacentMines;
  } else {
    cell.element.textContent = '';
    // 自動揭露周圍空白格
    for(let dr = -1; dr <= 1; dr++) {
      for(let dc = -1; dc <= 1; dc++) {
        let nr = r + dr;
        let nc = c + dc;
        if(nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if(!board[nr][nc].revealed) {
            revealCell(nr, nc);
          }
        }
      }
    }
  }
}

function revealAllMines() {
  for(let r = 0; r < rows; r++) {
    for(let c = 0; c < cols; c++) {
      if(board[r][c].mine) {
        const el = board[r][c].element;
        el.textContent = '🍒';
        el.classList.add('mine', 'revealed');
        el.disabled = true;
      } else {
        board[r][c].element.disabled = true;
      }
    }
  }
}

function checkWin() {
  if(gameOver) return;
  if(revealedCount === rows * cols - minesCount) {
    gameOver = true;
    alert('恭喜！你成功避開所有櫻桃地雷 🍒🎉');
    revealAllMines();
  }
}

// 按鈕事件
homeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});
resetBtn.addEventListener('click', () => {
  initBoard();
});
// 初始化遊戲
initBoard();
