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

const wishRef = ref(db, `wishList/${user}`);
const wishList = document.getElementById('wish-list');
const addBtn = document.getElementById('add-wish');

// 即時同步顯示願望清單
onValue(wishRef, snapshot => {
  wishList.innerHTML = '';
  const wishes = snapshot.val() || {};
  Object.entries(wishes).forEach(([id, text]) => {
    createWishItem(id, text);
  });
});

// 新增願望
addBtn.addEventListener('click', () => {
  const newRef = push(wishRef);
  set(newRef, '');
});

// 產生清單項目
function createWishItem(id, text) {
  const li = document.createElement('li');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.placeholder = 'make a wish...';
  input.style.flex = '1';
  input.style.border = 'none';
  input.style.background = 'transparent';
  input.style.outline = 'none';

  input.addEventListener('change', () => {
    set(ref(db, `wishList/${user}/${id}`), input.value);
  });

  const actions = document.createElement('div');
  actions.classList.add('wish-actions');

  const editBtn = document.createElement('button');
  editBtn.textContent = '+';
  editBtn.title = '儲存';
  editBtn.addEventListener('click', () => {
    set(ref(db, `wishList/${user}/${id}`), input.value);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '-';
  deleteBtn.title = '刪除願望';
  deleteBtn.addEventListener('click', () => {
    showConfirmModal(() => {
      remove(ref(db, `wishList/${user}/${id}`));
    });
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(input);
  li.appendChild(actions);

  wishList.appendChild(li);
}

// 顯示確認彈窗
function showConfirmModal(onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const cancelBtn = document.getElementById('cancel-delete');
  const confirmBtn = document.getElementById('confirm-delete');

  modal.classList.remove('hidden');

  const close = () => modal.classList.add('hidden');

  cancelBtn.onclick = close;
  confirmBtn.onclick = () => {
    onConfirm();
    close();
  };
}

// 回首頁與登出
document.getElementById('home-btn').addEventListener('click', () => {
  window.location.href = 'index.html';
});
document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'login.html';
});
