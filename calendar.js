import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, ref, set, onValue } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

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

console.log("✅ calendar.js 載入成功");

document.addEventListener('DOMContentLoaded', () => {
  console.log("📅 DOMContentLoaded OK");

  currentUser = sessionStorage.getItem('user');
  if (!currentUser) {
    console.warn("⚠️ 尚未登入，導向 login.html");
    window.location.href = 'login.html';
    return;
  }

  renderCalendar();
  loadCalendarData();

  // 月份切換
  document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    loadCalendarData();
    hideModal();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    loadCalendarData();
    hideModal();
  });

  // 點擊日期格子開啟 modal
  document.getElementById('calendar-body').addEventListener('click', e => {
    const td = e.target.closest('td');
    if (!td || !td.dataset.date) return;
    openModal(td.dataset.date);
  });

  // 新增活動
  document.getElementById('add-event').addEventListener('click', () => {
    const date = document.getElementById('modal-date').textContent;
    const input = document.getElementById('event-input');
    const val = input.value.trim();
    if (!val) return alert('請輸入活動內容');

    const dateRef = ref(db, `calendar/${date}`);
    onValue(dateRef, snapshot => {
      const data = snapshot.val() || {};
      const events = data.events || [];

      if (events.includes(val)) {
        alert('活動已存在');
        return;
      }

      events.push(val);
      set(dateRef, {
        ...data,
        events,
        hasComments: data.hasComments || false
      });
      input.value = '';
    }, { onlyOnce: true });
  });

  // 新增留言
  document.getElementById('add-comment').addEventListener('click', () => {
    const date = document.getElementById('modal-date').textContent;
    const input = document.getElementById('comment-input');
    const val = input.value.trim();
    if (!val) return alert('請輸入留言');

    const dateRef = ref(db, `calendar/${date}`);
    onValue(dateRef, snapshot => {
      const data = snapshot.val() || {};
      const comments = data.comments || [];

      comments.push({ user: currentUser, text: val });
      set(dateRef, {
        ...data,
        events: data.events || [],
        comments,
        hasComments: true
      });

      input.value = '';

      // ⭐ 加上即時更新 marker（❣️）
      const cell = document.querySelector(`[data-date="${date}"]`);
      if (cell) {
        let marker = cell.querySelector('.marker');
        if (!marker) {
          marker = document.createElement('div');
          marker.className = 'marker text-xs';
          cell.appendChild(marker);
        }
        const hasStar = marker.textContent.includes('⭐');
        marker.textContent = (hasStar ? '⭐' : '') + '❣️';
      }
    }, { onlyOnce: true });
  });


  // 關閉 modal
  document.getElementById('close-modal').addEventListener('click', hideModal);

  // 回首頁
  document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // 登出
  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
  });
});

// Render 月曆
function renderCalendar() {
  const tbody = document.getElementById('calendar-body');
  tbody.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 顯示年月
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthYearText = `${monthNames[month]} ${year}`;

  document.getElementById('month-year').textContent = monthYearText;

  // 計算第一天星期幾（1=Mon, 7=Sun）
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay(); // 0=Sun, 1=Mon...
  startWeekday = startWeekday === 0 ? 7 : startWeekday;

  // 該月天數
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 填滿空白前置格子(一週七天，星期一開始)
  let day = 1;
  for (let week = 0; week < 6; week++) {
    const tr = document.createElement('tr');
    for (let i = 1; i <= 7; i++) {
      const td = document.createElement('td');

      if ((week === 0 && i < startWeekday) || day > daysInMonth) {
        td.textContent = '';
      } else {
        td.textContent = day;
        td.dataset.date = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        day++;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

// 開啟 modal 並載入該日資料
function openModal(date) {
  document.getElementById('memo-board').classList.add('active');
  document.getElementById('modal-date').textContent = date;
  document.getElementById('event-input').value = '';
  document.getElementById('comment-input').value = '';
  loadEventsAndComments(date);
}

// 載入活動與留言列表
function loadEventsAndComments(date) {
  const dateRef = ref(db, `calendar/${date}`);
  onValue(dateRef, snapshot => {
    const data = snapshot.val() || {};
    renderList('event-list', data.events || [], date, true);
    renderList('comment-list', data.comments || [], date, false);
  });
}

// 渲染活動或留言列表
function renderList(containerId, items, date, isEvent) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'list-item';

    const contentDiv = document.createElement('div');
    contentDiv.textContent = isEvent ? item : `${item.user}: ${item.text}`;
    contentDiv.classList.add('item-text');
    div.appendChild(contentDiv);

    // 修改按鈕
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.addEventListener('click', () => {
      const newText = prompt('請修改內容：', isEvent ? item : item.text);
      if (!newText || newText.trim() === '') return;

      const dateRef = ref(db, `calendar/${date}`);
      onValue(dateRef, snapshot => {
        const data = snapshot.val() || {};
        if (isEvent) {
          const events = data.events || [];
          events[idx] = newText.trim();
          set(dateRef, { ...data, events });
        } else {
          const comments = data.comments || [];
          comments[idx].text = newText.trim();
          set(dateRef, { ...data, comments });
        }
      }, { onlyOnce: true });
    });
    div.appendChild(editBtn);

    // 刪除按鈕
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', () => deleteItem(date, idx, isEvent));
    div.appendChild(delBtn);

    container.appendChild(div);
  });
}


// 刪除事件或留言
function deleteItem(date, idx, isEvent) {
  const confirmMsg = isEvent ? "確定要刪除此活動嗎？" : "確定要刪除此留言嗎？";
  if (!confirm(confirmMsg)) return;

  const dateRef = ref(db, `calendar/${date}`);
  onValue(dateRef, snapshot => {
    const data = snapshot.val() || {};
    if (isEvent) {
      const events = data.events || [];
      events.splice(idx, 1);
      set(dateRef, {
        ...data,
        events,
      });
    } else {
      const comments = data.comments || [];
      comments.splice(idx, 1);
      set(dateRef, {
        ...data,
        comments,
      });
    }
  }, { onlyOnce: true });
}

function loadCalendarData() {
  const calendarRef = ref(db, 'calendar');

  onValue(calendarRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    Object.keys(data).forEach(date => {
      const marker = document.querySelector(`[data-date="${date}"]`);
      if (marker) {
        // 可視化標記方式（例如在日期格子下方加上 emoji）
        let content = '';
        if (data[date].events && data[date].events.length > 0) {
          const previewEvents = data[date].events.slice(0, 2);
          content = previewEvents.map(e => e.slice(0, 2)).join('\n');
        }
        if (data[date].hasComments) content += '\n❣️';

        // 將 emoji 顯示在 cell 中
        if (!marker.querySelector('.marker')) {
          const span = document.createElement('div');
          span.className = 'marker text-xs';
          span.textContent = content;
          marker.appendChild(span);
        } else {
          marker.querySelector('.marker').textContent = emoji;
        }
      }
    });
  });
}

// 隱藏 modal
function hideModal() {
  document.getElementById('memo-board').classList.remove('active');
}
