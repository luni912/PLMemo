import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

// Firebase 設定
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

const originalWidth = 1024;
const originalHeight = 1536;

function updateButtonPositions() {
  const wrapper = document.getElementById('scene-wrapper');
  const bg = document.getElementById('bg-base');
  const buttons = wrapper.querySelectorAll('.scene-button');

  const rect = bg.getBoundingClientRect();
  const scaleX = rect.width / originalWidth;
  const scaleY = rect.height / originalHeight;

  buttons.forEach(btn => {
    const x = parseFloat(btn.dataset.x);
    const y = parseFloat(btn.dataset.y);
    const w = parseFloat(btn.dataset.w);
    const h = parseFloat(btn.dataset.h);

    btn.style.left = `${x * scaleX}px`;
    btn.style.top = `${y * scaleY}px`;
    btn.style.width = `${w * scaleX}px`;
    btn.style.height = `${h * scaleY}px`;
    btn.style.transform = `translate(-50%, -50%)`;
    btn.style.position = 'absolute';
  });
}

function loadCountdown() {
  const milestones = [
    { name: 'First chat', date: '2025-03-26' },
    { name: 'First met', date: '2025-04-19' },
    { name: 'In Love', date: '2025-05-05' }
  ];
  const countdownDiv = document.getElementById('countdown');
  if (!countdownDiv) return;
  countdownDiv.innerHTML = '';

  const today = new Date();
  milestones.forEach(milestone => {
    const date = new Date(milestone.date);
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      countdownDiv.innerHTML += `<p>${milestone.name} ~ 還有 ${diffDays} 天</p>`;
    } else if (diffDays === 0) {
      countdownDiv.innerHTML += `<p>${milestone.name} ~ 就是今天！🎉</p>`;
    } else {
      countdownDiv.innerHTML += `<p>${milestone.name} ~  ${Math.abs(diffDays)} days</p>`;
    }
  });
}

function loadNotices(user) {
  const noticesRef = ref(db, 'notices');
  onValue(noticesRef, (snapshot) => {
    const notices = snapshot.val();
    const noticeDiv = document.getElementById('notice');
    if (!noticeDiv) return;
    if (notices) {
      const userNotices = Object.values(notices).filter(n => n.for === user);
      noticeDiv.innerHTML = userNotices.length
        ? userNotices.map(n => `<p>${n.content} (${n.timestamp})</p>`).join('')
        : '<p>無最新事件</p>';
      if (userNotices.length) {
        document.getElementById('lamp-indicator')?.classList.remove('hidden');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const user = sessionStorage.getItem('user');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  loadCountdown();
  loadNotices(user);
  updateButtonPositions();


  // 綁定按鈕事件
  document.getElementById('moon').addEventListener('click', () => window.location.href = 'calendar.html');
  document.getElementById('stone').addEventListener('click', () => window.location.href = 'dream.html');
  document.getElementById('cherry').addEventListener('click', () => window.location.href = 'chamber.html');
  document.getElementById('lamp').addEventListener('click', () => {
    const noticeDiv = document.getElementById('notice');
    if (noticeDiv) noticeDiv.classList.toggle('hidden');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

});