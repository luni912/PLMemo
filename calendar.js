import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getDatabase, ref, set, onValue, update } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';

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

  document.getElementById('calendar-body').addEventListener('click', e => {
    const td = e.target.closest('td');
    if (!td || !td.dataset.date) return;
    openModal(td.dataset.date);
  });

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
        hasComments: data.hasComments || false,
        hasSecretL: data.hasSecretL || false,
        hasSecretP: data.hasSecretP || false,
        comments: data.comments || []
      });

      input.value = '';

      updateCellMarkers(date, {
        events,
        hasComments: data.hasComments || false,
        hasSecretL: data.hasSecretL || false,
        hasSecretP: data.hasSecretP || false
      });

      loadEventsAndComments(date);
    }, { onlyOnce: true });
  });

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

      const recipient = currentUser === 'L' ? 'P' : 'L';
      const secretKey = `hasSecret${recipient}`;

      set(dateRef, {
        ...data,
        events: data.events || [],
        comments,
        hasComments: true,
        [secretKey]: true
      });

      input.value = '';

      updateCellMarkers(date, {
        events: data.events || [],
        hasComments: true,
        hasSecretL: secretKey === 'hasSecretL' ? true : (data.hasSecretL || false),
        hasSecretP: secretKey === 'hasSecretP' ? true : (data.hasSecretP || false)
      });

      loadEventsAndComments(date);
    }, { onlyOnce: true });
  });

  document.getElementById('close-modal').addEventListener('click', hideModal);

  document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
  });
});

function renderCalendar() {
  const tbody = document.getElementById('calendar-body');
  tbody.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthYearText = `${monthNames[month]} ${year}`;
  document.getElementById('month-year').textContent = monthYearText;

  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay();
  startWeekday = startWeekday === 0 ? 7 : startWeekday;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

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

  const calendar = document.getElementById('calendar');
  if (calendar) calendar.style.marginTop = '20px';
}

function openModal(date) {
  const dateRef = ref(db, `calendar/${date}`);

  onValue(dateRef, snapshot => {
    const data = snapshot.val() || {};

    if (currentUser === 'L' && data.hasSecretL) {
      update(dateRef, { hasSecretL: false });
      data.hasSecretL = false;
    }
    if (currentUser === 'P' && data.hasSecretP) {
      update(dateRef, { hasSecretP: false });
      data.hasSecretP = false;
    }

    updateCellMarkers(date, data);
    loadEventsAndComments(date);
  }, { onlyOnce: true });

  document.getElementById('memo-board').classList.add('active');
  document.getElementById('memo-board').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('modal-date').textContent = date;
  document.getElementById('event-input').value = '';
  document.getElementById('comment-input').value = '';
}

function updateCellMarkers(date, data = {}) {
  const cell = document.querySelector(`[data-date="${date}"]`);
  if (!cell) return;

  let marker = cell.querySelector('.marker');
  if (!marker) {
    marker = document.createElement('div');
    marker.className = 'marker text-xs whitespace-pre-wrap';
    cell.appendChild(marker);
  }

  const events = data.events || [];

  const showSecret = (currentUser === 'L' && data.hasSecretL) ||
                     (currentUser === 'P' && data.hasSecretP);
  const showComment = data.hasComments;

  const maxVisibleEvents = 3;
  const eventPreviews = events.slice(0, maxVisibleEvents).map(e => e.slice(0, 2) + '…');
  const hasMore = events.length > maxVisibleEvents;

  const iconLine = [showComment ? '❣️' : '', showSecret ? '㊙️' : ''].filter(Boolean).join('');
  const eventLine = eventPreviews.join('\n') + (hasMore ? '\n...' : '');

  marker.textContent = [iconLine, eventLine].filter(Boolean).join('\n');
}

function hideModal() {
  document.getElementById('memo-board').classList.remove('active');
}

function loadCalendarData() {
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');

  const datePrefix = `${year}-${month}`;

  onValue(ref(db, 'calendar'), snapshot => {
    const allData = snapshot.val() || {};
    Object.entries(allData).forEach(([date, data]) => {
      if (date.startsWith(datePrefix)) {
        updateCellMarkers(date, data);
      }
    });
  });
}

function loadEventsAndComments(date) {
  const dateRef = ref(db, `calendar/${date}`);

  onValue(dateRef, snapshot => {
    const data = snapshot.val() || {};
    const eventList = document.getElementById('event-list');
    const commentList = document.getElementById('comment-list');
    eventList.innerHTML = '';
    commentList.innerHTML = '';

    // 活動列表
    (data.events || []).forEach((e, i) => {
      const li = document.createElement('li');
      li.className = 'list-item';

      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.justifyContent = 'space-between';
      container.style.alignItems = 'center';

      const textDiv = document.createElement('div');
      textDiv.textContent = e;
      textDiv.style.flexGrow = '1';
      textDiv.style.textAlign = 'left';
      textDiv.style.wordBreak = 'break-word';
      textDiv.style.paddingRight = '0.5rem';

      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.justifyContent = 'flex-end';
      btnGroup.style.gap = '4px';

      // 修改按鈕 '+'
      const editBtn = document.createElement('button');
      editBtn.textContent = '+';
      editBtn.className = 'edit-btn';
      editBtn.onclick = () => {
        const newText = prompt('修改活動：', e);
        if (newText !== null) {
          const events = [...(data.events || [])];
          events[i] = newText.trim();
          if (events[i].length === 0) return alert('活動內容不可空白');
          update(dateRef, { ...data, events })
            .then(() => loadEventsAndComments(date))
            .catch(console.error);
        }
      };

      // 刪除按鈕 '-'
      const delBtn = document.createElement('button');
      delBtn.textContent = '-';
      delBtn.className = 'delete-btn';
      delBtn.onclick = () => {
        if (confirm('確定要刪除這個活動嗎？')) {
          const events = [...(data.events || [])];
          events.splice(i, 1);
          update(dateRef, { ...data, events })
            .then(() => {
              updateCellMarkers(date, { ...data, events });
              loadEventsAndComments(date);
            })
            .catch(console.error);
        }
      };

      btnGroup.appendChild(editBtn);
      btnGroup.appendChild(delBtn);

      container.appendChild(textDiv);
      container.appendChild(btnGroup);

      li.appendChild(container);
      eventList.appendChild(li);
    });

    // 留言列表
    (data.comments || []).forEach((c, i) => {
      const li = document.createElement('li');
      li.className = 'list-item';

      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.justifyContent = 'space-between';
      container.style.alignItems = 'center';

      const textDiv = document.createElement('div');
      textDiv.textContent = `${c.user}: ${c.text}`;
      textDiv.style.flexGrow = '1';
      textDiv.style.textAlign = 'left';
      textDiv.style.wordBreak = 'break-word';
      textDiv.style.paddingRight = '0.5rem';

      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.justifyContent = 'flex-end';
      btnGroup.style.gap = '4px';

      // 修改按鈕 '+'
      const editBtn = document.createElement('button');
      editBtn.textContent = '+';
      editBtn.className = 'edit-btn';
      editBtn.onclick = () => {
        const newText = prompt('修改留言：', c.text);
        if (newText !== null) {
          const comments = [...(data.comments || [])];
          comments[i].text = newText.trim();
          if (comments[i].text.length === 0) return alert('留言內容不可空白');
          update(dateRef, { ...data, comments })
            .then(() => loadEventsAndComments(date))
            .catch(console.error);
        }
      };

      // 刪除按鈕 '-'
      const delBtn = document.createElement('button');
      delBtn.textContent = '-';
      delBtn.className = 'delete-btn';
      delBtn.onclick = () => {
        if (confirm('確定要刪除這則留言嗎？')) {
          const comments = [...(data.comments || [])];
          comments.splice(i, 1);
          const hasComments = comments.length > 0;
          const newData = { ...data, comments, hasComments };
          update(dateRef, newData)
            .then(() => {
              updateCellMarkers(date, newData);
              loadEventsAndComments(date);
            })
            .catch(console.error);
        }
      };

      btnGroup.appendChild(editBtn);
      btnGroup.appendChild(delBtn);

      container.appendChild(textDiv);
      container.appendChild(btnGroup);

      li.appendChild(container);
      commentList.appendChild(li);
    });
  }, { onlyOnce: true });
}
