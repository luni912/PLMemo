document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim().toUpperCase();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    if ((username === 'P' || username === 'L') && password === '3') {
        sessionStorage.setItem('user', username);
        window.location.href = 'index.html';
    } else {
        errorMessage.classList.remove('hidden');
    }
});
function updateScale() {
  const wrapper = document.querySelector('.scene-wrapper');
  const scaleX = window.innerWidth / 1024;
  const scaleY = window.innerHeight / 1536;
  const scale = Math.min(scaleX, scaleY);
  wrapper.style.setProperty('--scale-factor', scale);
}
window.addEventListener('resize', updateScale);
window.addEventListener('load', updateScale);