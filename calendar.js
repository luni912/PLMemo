import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, ref, set, onValue, remove } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

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

let currentDate = new Date('2025-07-25');
let currentUser;

// 檢查登入狀態
document.addEventListener('DOMContentLoaded', () => {
    currentUser = sessionStorage.getItem('user');
    if (!currentUser) {
        window.location.href = 'login.html';
    } else {
        renderCalendar();
        loadCalendarData();
    }
});

// 渲染日曆
function renderCalendar() {
    const monthYear = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    monthYear.textContent = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // 週一為起始
    const daysInMonth = lastDay.getDate();

    calendarBody.innerHTML = '';
    let row = document.createElement('tr');
    for (let i = 0; i < startDay; i++) {
        row.innerHTML += '<td></td>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
        if ((startDay + day - 1) % 7 === 0 && day !== 1) {
            calendarBody.appendChild(row);
            row = document.createElement('tr');
        }
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        row.innerHTML += `<td class="cursor-pointer ${[5, 6].includes((startDay + day - 1) % 7) ? 'bg-purple-300' : 'bg-white'} bg-opacity-80" data-date="${dateStr}">${day}<span id="marker-${dateStr}"></span></td>`;
    }
    calendarBody.appendChild(row);
}

// 載入日曆資料
function loadCalendarData() {
    const calendarRef = ref(db, 'calendar');
    onValue(calendarRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(date => {
                const marker = document.getElementById(`marker-${date}`);
                if (marker) {
                    if (data[date].hasComments) marker.innerHTML += ' 📓';
                    if (data[date][`hasNewFor${currentUser}`]) marker.innerHTML += ' ⭐';
                }
            });
        }
    });
}

// 點擊日期格子
document.getElementById('calendar-body').addEventListener('click', (e) => {
    const date = e.target.closest('td')?.dataset.date;
    if (date) {
        document.getElementById('modal').classList.remove('hidden');
        document.getElementById('modal-date').textContent = date;
        loadEventsAndComments(date);
    }
});

// 載入活動與留言
function loadEventsAndComments(date) {
    const eventList = document.getElementById('event-list');
    const commentList = document.getElementById('comment-list');
    const dateRef = ref(db, `calendar/${date}`);
    onValue(dateRef, (snapshot) => {
        const data = snapshot.val();
        eventList.innerHTML = data?.events ? data.events.map((e, i) => `<p>${e} <button data-index="${i}" class="delete-event text-red-500">刪除</button></p>`).join('') : '';
        commentList.innerHTML = data?.comments ? data.comments.map((c, i) => `<p>${c.user}: ${c.text} (${c.timestamp}) <button data-index="${i}" class="delete-comment text-red-500">刪除</button></p>`).join('') : '';
    });
}

// 新增活動
document.getElementById('add-event').addEventListener('click', () => {
    const date = document.getElementById('modal-date').textContent;
    const eventInput = document.getElementById('event-input').value;
    if (eventInput) {
        const dateRef = ref(db, `calendar/${date}`);
        onValue(dateRef, (snapshot) => {
            const data = snapshot.val() || {};
            const events = data.events || [];
            events.push(eventInput);
            set(dateRef, { ...data, events, hasComments: data.hasComments || false, [`hasNewFor${currentUser === 'P' ? 'L' : 'P'}`]: true });
            set(ref(db, `notices/${Date.now()}`), {
                type: 'calendar',
                date,
                content: `${currentUser} 新增了活動: ${eventInput}`,
                for: currentUser === 'P' ? 'L' : 'P',
                timestamp: new Date().toISOString()
            });
        }, { onlyOnce: true });
        document.getElementById('event-input').value = '';
        loadEventsAndComments(date);
    }
});

// 新增留言
document.getElementById('add-comment').addEventListener('click', () => {
    const date = document.getElementById('modal-date').textContent;
    const commentInput = document.getElementById('comment-input').value;
    if (commentInput) {
        const dateRef = ref(db, `calendar/${date}`);
        onValue(dateRef, (snapshot) => {
            const data = snapshot.val() || {};
            const comments = data.comments || [];
            comments.push({ user: currentUser, text: commentInput, timestamp: new Date().toISOString() });
            set(dateRef, { ...data, comments, hasComments: true, [`hasNewFor${currentUser === 'P' ? 'L' : 'P'}`]: true });
            set(ref(db, `notices/${Date.now()}`), {
                type: 'calendar',
                date,
                content: `${currentUser} 新增了留言`,
                for: currentUser === 'P' ? 'L' : 'P',
                timestamp: new Date().toISOString()
            });
        }, { onlyOnce: true });
        document.getElementById('comment-input').value = '';
        loadEventsAndComments(date);
    }
});

// 刪除活動或留言
document.addEventListener('click', (e) => {
    const date = document.getElementById('modal-date').textContent;
    if (e.target.classList.contains('delete-event') && confirm('確定刪除活動？')) {
        const index = e.target.dataset.index;
        const dateRef = ref(db, `calendar/${date}`);
        onValue(dateRef, (snapshot) => {
            const data = snapshot.val();
            data.events.splice(index, 1);
            set(dateRef, data);
        }, { onlyOnce: true });
    } else if (e.target.classList.contains('delete-comment') && confirm('確定刪除留言？')) {
        const index = e.target.dataset.index;
        const dateRef = ref(db, `calendar/${date}`);
        onValue(dateRef, (snapshot) => {
            const data = snapshot.val();
            data.comments.splice(index, 1);
            set(dateRef, { ...data, hasComments: data.comments.length > 0 });
        }, { onlyOnce: true });
    }
});

// 關閉模態框
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});

// 切換月份
document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    loadCalendarData();
});
document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    loadCalendarData();
});

// 登出
document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
});