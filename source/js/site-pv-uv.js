/**
 * 站点 PV / UV 计数（纯客户端 localStorage）
 *
 * - PV (Page View): 每访问一次 +1
 * - UV (Unique Visitor): 每个新访客 +1（用 UUID 标记）
 *
 * 限制：纯客户端只能统计到访客自己的浏览器；他人访问计不到。
 * 这只是"自嗨型"计数，想要真实访问量请接 umami / leancloud / google analytics。
 */

(function () {
  'use strict';

  var PV_KEY = 'site-pv';
  var UV_KEY = 'site-uv';
  var UV_ID_KEY = 'site-uv-id';

  // 读
  var pv = parseInt(localStorage.getItem(PV_KEY) || '0', 10);
  var uv = parseInt(localStorage.getItem(UV_KEY) || '0', 10);

  // PV 累加（每次页面访问 +1）
  pv = pv + 1;
  localStorage.setItem(PV_KEY, String(pv));

  // UV 累加（新访客才 +1）
  var uvId = localStorage.getItem(UV_ID_KEY);
  if (!uvId) {
    uv = uv + 1;
    uvId = (Date.now().toString(36)) + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(UV_ID_KEY, uvId);
    localStorage.setItem(UV_KEY, String(uv));
  }

  // 写到页面上
  var pvEl = document.getElementById('local-site-pv-value');
  var uvEl = document.getElementById('local-site-uv-value');
  if (pvEl) pvEl.textContent = String(pv);
  if (uvEl) uvEl.textContent = String(uv);

  // 显示外层容器（statistics.ejs 里设了 display:none）
  var pvContainer = document.getElementById('local-site-pv');
  var uvContainer = document.getElementById('local-site-uv');
  if (pvContainer) pvContainer.style.display = '';
  if (uvContainer) uvContainer.style.display = '';
})();