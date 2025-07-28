import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, ref, push, set, onValue, remove } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyC3mcSomg_cL8klJ61ZoDyh3XqHjaX6Nqc",
  authDomain: "lp-25-bd9bf.firebaseapp.com",
  databaseURL: "https://lp-25-bd9bf-default-rtdb.firebaseio.com",
  projectId: "lp-25-bd9bf",
  storageBucket: "lp-25-bd9bf.appspot.com",
  messagingSenderId: "956448773615",
  appId: "1:956448773615:web:f3526d3005efc596a6921a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const user = sessionStorage.getItem('user');
if (!user) window.location.href = 'login.html';

const counters = {
  concert: document.getElementById('concert-count'),
  exhibit: document.getElementById('exhibit-count'),
  music: document.getElementById('music-count'),
  movie: document.getElementById('movie-count')
};

const modal = document.getElementById('confirm-modal');
const cancelBtn = document.getElementById('cancel-delete');
const confirmBtn = document.getElementById('confirm-delete');
let pendingDelete = null;

const notesContainer = document.getElementById('notes-container');
let openNotes = {};

['concert', 'exhibit', 'music', 'movie'].forEach(type => {
  const listRef = ref(db, `dream/${user}/${type}`);

  onValue(listRef, snapshot => {
    const data = snapshot.val() || {};
    const count = Object.keys(data).length;
    counters[type].textContent = count;

    if (openNotes[type]) {
      updateNoteContent(openNotes[type].querySelector('ol'), data, type);
    }
  });
});

function createNote(type) {
  const titles = {
    concert: '演唱會',
    exhibit: '展覽',
    movie: '電影',
    music: '音樂會/交響樂/歌劇'
  };

  const note = document.createElement('div');
  note.className = 'dream-note-popup';

  note.innerHTML = `
    <div class="note-header">
      <h3>${titles[type]}</h3>
      <button class="add-entry" data-type="${type}">＋</button>
      <button class="close-note">✖</button>
    </div>
    <ol class="note-items"></ol>
  `;

  note.querySelector('.close-note').addEventListener('click', () => {
    note.remove();
    openNotes[type] = null;
  });

  note.querySelector('.add-entry').addEventListener('click', () => {
    // 新增時預設值為空字串與今日日期
    const today = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
    const newRef = push(ref(db, `dream/${user}/${type}`));
    set(newRef, { text: '', date: today });
  });

  return note;
}

function updateNoteContent(list, data, type) {
  list.innerHTML = '';
  Object.entries(data).forEach(([id, value]) => {
    // 如果value是字串（舊資料），轉成物件
    let text = '', date = '';
    if (typeof value === 'string') {
      text = value;
      date = '';
    } else {
      text = value.text || '';
      date = value.date || '';
    }

    const li = document.createElement('li');
    li.className = 'dream-item';

    // 事件輸入框
    const inputText = document.createElement('textarea');
    inputText.value = text;
    inputText.placeholder = '輸入事件';
    inputText.style.marginRight = '8px';
    inputText.addEventListener('change', () => {
      set(ref(db, `dream/${user}/${type}/${id}`), { text: inputText.value, date });
    });

    // 日期輸入框
    const inputDate = document.createElement('input');
    inputDate.type = 'date';
    inputDate.value = date;
    inputDate.title = '選擇日期';
    inputDate.style.width = '110px';
    inputDate.addEventListener('change', () => {
      set(ref(db, `dream/${user}/${type}/${id}`), { text: inputText.value, date: inputDate.value });
    });

    // 儲存按鈕
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'v';
    saveBtn.title = '儲存';
    saveBtn.addEventListener('click', () => {
      set(ref(db, `dream/${user}/${type}/${id}`), { text: inputText.value, date: inputDate.value });
    });

    // 刪除按鈕
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '-';
    deleteBtn.title = '刪除';
    deleteBtn.addEventListener('click', () => {
      pendingDelete = ref(db, `dream/${user}/${type}/${id}`);
      modal.classList.remove('hidden');
    });

    li.appendChild(inputText);
    li.appendChild(inputDate);
    li.appendChild(saveBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

Array.from(document.getElementsByClassName('dream-btn')).forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (openNotes[type]) return;
    const note = createNote(type);
    notesContainer.appendChild(note);
    openNotes[type] = note;

    // 初始化內容
    onValue(ref(db, `dream/${user}/${type}`), snapshot => {
      const data = snapshot.val() || {};
      updateNoteContent(note.querySelector('ol'), data, type);
    });
  });
});

// Modal 控制
cancelBtn.addEventListener('click', () => {
  pendingDelete = null;
  modal.classList.add('hidden');
});

confirmBtn.addEventListener('click', () => {
  if (pendingDelete) {
    remove(pendingDelete);
    pendingDelete = null;
  }
  modal.classList.add('hidden');
});

// 回首頁與登出
document.getElementById('home-btn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});
