/* Fail visibly when a scene script cannot start (including devices without WebGL).
   Loaded before the 3D scripts, so an early renderer exception cannot strand the splash. */
(function () {
  'use strict';
  let failure = null, complete = false;
  const listeners = new Set();
  function fail(error) {
    if (complete || failure) return;
    failure = error instanceof Error ? error : new Error(String(error || 'Không tải được cảnh 3D.'));
    const splash = document.getElementById('po-splash'), msg = document.getElementById('po-splash-msg');
    if (splash && msg) {
      splash.classList.remove('out');
      msg.textContent = /webgl|graphics context|renderer/i.test(failure.message)
        ? 'Trình duyệt chưa khởi tạo được đồ hoạ WebGL.'
        : 'Chưa tải được thư viện 3D. Hãy kiểm tra kết nối và thử lại.';
      const bar = splash.querySelector('.po-bar'); if (bar) bar.hidden = true;
      const panel = document.createElement('div'); panel.className = 'po-startup-error'; panel.setAttribute('role', 'alert');
      const tip = document.createElement('p');
      tip.textContent = /webgl|graphics context|renderer/i.test(failure.message)
        ? 'Bật tăng tốc đồ hoạ trong cài đặt trình duyệt, đóng bớt các tab 3D rồi tải lại. Bạn cũng có thể thử Chrome, Edge hoặc Firefox trên thiết bị hỗ trợ WebGL.'
        : 'Nếu trang vẫn chưa mở, hãy tải lại hoặc thử trên trình duyệt khác.';
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'po-btn'; retry.textContent = 'Tải lại';
      retry.addEventListener('click', () => location.reload());
      panel.append(tip, retry); splash.querySelector('.po-splash-in').append(panel);
    }
    for (const reject of listeners) reject(failure);
    listeners.clear();
  }
  function onError(event) {
    const script = event.target && event.target.tagName === 'SCRIPT';
    if (!script && !event.error && !event.message) return;
    fail(event.error || new Error(script ? 'Không tải được tệp JavaScript.' : event.message || 'Không khởi tạo được cảnh 3D.'));
  }
  const onRejection = event => fail(event.reason || new Error('Không tải được cảnh 3D.'));
  addEventListener('error', onError, true);
  addEventListener('unhandledrejection', onRejection);
  window.PotaStartup = {
    get failed() { return !!failure; },
    fail,
    waitForScene(promise, timeoutMs = 90000) {
      if (failure) return Promise.reject(failure);
      return new Promise((resolve, reject) => {
        const rejectScene = error => { clearTimeout(timer); listeners.delete(rejectScene); reject(error); };
        const timer = setTimeout(() => { const error = new Error('Quá thời gian tải cảnh 3D.'); fail(error); rejectScene(error); }, timeoutMs);
        listeners.add(rejectScene);
        Promise.resolve(promise).then(value => {
          clearTimeout(timer); listeners.delete(rejectScene);
          if (failure) reject(failure); else resolve(value);
        }, error => { fail(error); rejectScene(error); });
      });
    },
    complete() {
      complete = true; listeners.clear();
      removeEventListener('error', onError, true);
      removeEventListener('unhandledrejection', onRejection);
    }
  };
})();
