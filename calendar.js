import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, ref, set, onValue, remove } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

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

let currentDate = new Date();
let currentUser;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = sessionStorage.getItem('user');
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  renderCalendar();
  loadCalendarData();

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

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

  document.getElementById('calendar-body').addEventListener('click', (e) => {
    const date = e.target.closest('td')?.dataset.date;
    if (date) {
      document.getElementById('modal').classList.remove('hidden');
      document.getElementById('modal-date').textContent = date;
      loadEventsAndComments(date);
    }
  });

  document.getElementById('add-event').addEventListener('click', () => {
    const date = document.getElementById('modal-date').textContent;
    const eventInput = document.getElementById('event-input').value;
    if (eventInput) {
      const dateRef = ref(db, `calendar/${date}`);
      onValue(dateRef, (snapshot) => {
        const data = snapshot.val() || {};
        const events = data.events || [];
        events.push(eventInput);
        set(dateRef, {
          ...data,
          events,
          hasComments: data.hasComments || false,
          [`hasNewFor${currentUser === 'P' ? 'L' : 'P'}`]: true
        });
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

  document.getElementById('add-comment').addEventListener('click', () => {
    const date = document.getElementById('modal-date').textContent;
    const commentInput = document.getElementById('comment-input').value;
    if (commentInput) {
      const dateRef = ref(db, `calendar/${date}`);
      onValue(dateRef, (snapshot) => {
        const data = snapshot.val() || {};
        const comments = data.comments || [];
        comments.push({
          user: currentUser,
          text: commentInput,
          timestamp: new Date().toISOString()
        });
        set(dateRef, {
          ...data,
          comments,
          hasComments: true,
          [`hasNewFor${currentUser === 'P' ? 'L' : 'P'}`]: true
        });
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

  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
  });

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
        set(dateRef, {
          ...data,
          hasComments: data.comments.length > 0
        });
      }, { onlyOnce: true });
    }
  });
});

function renderCalendar() {
  const monthYear = document.getElementById('month-year');
  const calendarBody = document.getElementById('calendar-body');
  if (!monthYear || !calendarBody) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYear.textContent = `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  calendarBody.innerHTML = '';
  let row = document.createElement('tr');

  for (let i = 0; i < startDay; i++) {
    row.appendChild(document.createElement('td'));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    if ((startDay + day - 1) % 7 === 0 && day !== 1) {
      calendarBody.appendChild(row);
      row = document.createElement('tr');
    }

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = (startDay + day - 1) % 7;

    const td = document.createElement('td');
    td.className = "h-20 border align-top p-1 bg-white bg-opacity-80 cursor-pointer";
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      td.classList.add("text-pink-300");
    }
    td.dataset.date = dateStr;

    // 日期排版靠上中間
    const inner = document.createElement("div");
    inner.className = "flex flex-col items-center justify-start h-full";

    const dateSpan = document.createElement("span");
    dateSpan.className = "text-sm font-semibold mt-1";
    dateSpan.textContent = day;

    const markerSpan = document.createElement("span");
    markerSpan.id = `marker-${dateStr}`;
    markerSpan.className = "text-base";

    inner.appendChild(dateSpan);
    inner.appendChild(markerSpan);
    td.appendChild(inner);
    row.appendChild(td);
  }

  calendarBody.appendChild(row);
}

function loadCalendarData() {
  const calendarRef = ref(db, 'calendar');
  onValue(calendarRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(date => {
        const marker = document.getElementById(`marker-${date}`);
        if (marker) {
          marker.innerHTML = '';
          if (data[date].hasComments) marker.innerHTML += '📓';
          if (data[date][`hasNewFor${currentUser}`]) marker.innerHTML += '⭐';
        }
      });
    }
  });
}

function loadEventsAndComments(date) {
  const dateRef = ref(db, `calendar/${date}`);
  onValue(dateRef, (snapshot) => {
    const data = snapshot.val() || {};
    const eventList = document.getElementById('event-list');
    const commentList = document.getElementById('comment-list');

    eventList.innerHTML = '';
    commentList.innerHTML = '';

    if (data.events) {
      data.events.forEach((e, i) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-1 border-b';
        item.innerHTML = `<span class="text-left w-full">${e}</span>
          <button class="text-sm text-red-400 delete-event" data-index="${i}">刪除</button>`;
        eventList.appendChild(item);
      });
    }

    if (data.comments) {
      data.comments.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-start p-1 border-b';
        item.innerHTML = `<div class="text-left">
            <div class="font-semibold">${c.user}</div>
            <div class="text-sm">${c.text}</div>
          </div>
          <button class="text-sm text-red-400 delete-comment" data-index="${i}">刪除</button>`;
        commentList.appendChild(item);
      });
    }

    // 清除已讀星星提示
    if (data[`hasNewFor${currentUser}`]) {
      set(dateRef, {
        ...data,
        [`hasNewFor${currentUser}`]: false
      });
    }
  }, { onlyOnce: true });
}