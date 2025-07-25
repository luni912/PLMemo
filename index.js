import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyC3mcSomg_cL8klJ61ZoDyh3XqHjaX6Nqc",
    authDomain: "lp-25-bd9bf.firebaseapp.com",
    databaseURL: "https://lp-25-bd9bf-default-rtdb.firebaseio.com",
    projectId: "lp-25-bd9bf",
    storageBucket: "lp-25-bd9bf.firebasestorage.app",
    messagingSenderId: "956448773615",
    appId: "1:956448773615:web:f3526d3005efc596a6921a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadCountdown();
        loadNotices(user);
    }

    const moon = document.getElementById('moon');
    if (moon) {
        moon.addEventListener('click', () => {
            console.log('月亮點擊，導向 calendar.html');
            window.location.href = './calendar.html';
        });
    } else {
        console.error('未找到月亮圖標');
    }

    document.getElementById('stone').addEventListener('click', () => {
        window.location.href = './dream.html';
    });
    document.getElementById('lamp').addEventListener('click', () => {
        document.getElementById('notice').classList.toggle('hidden');
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
});

function loadCountdown() {
    const milestones = [
        { name: '聊天開始日', date: '2025-03-26' },
        { name: '第一次見面', date: '2025-04-19' },
        { name: '在一起紀念日', date: '2025-05-05' }
    ];
    const countdownDiv = document.getElementById('countdown');
    milestones.forEach(milestone => {
        const date = new Date(milestone.date);
        const today = new Date('2025-07-25');
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        countdownDiv.innerHTML += `<p>${milestone.name}: 還剩 ${diffDays} 天</p>`;
    });
}

function loadNotices(user) {
    const noticesRef = ref(db, 'notices');
    onValue(noticesRef, (snapshot) => {
        const notices = snapshot.val();
        const noticeDiv = document.getElementById('notice');
        if (notices) {
            noticeDiv.innerHTML = Object.values(notices)
                .filter(n => n.for === user)
                .map(n => `<p>${n.content} (${n.timestamp})</p>`).join('');
            if (Object.values(notices).some(n => n.for === user)) {
                document.getElementById('lamp').classList.add('glow');
                noticeDiv.classList.remove('hidden');
            }
        }
    });
}