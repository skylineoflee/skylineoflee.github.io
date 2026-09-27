/**
 * 文章阅读量：纯客户端 localStorage 累加
 *
 * - 每次访问该文章页 +1（基于 path/slug）
 * - 基础值取自 front-matter 的 visits
 * - 当前累计值 = base + localStorage 增量
 *
 * 限制：纯客户端只能统计访客自己的访问。和 footer 的 PV/UV 同一限制。
 */

(function () {
  'use strict';

  var el = document.getElementById('post-visits-value');
  if (!el) return;

  var slug = el.getAttribute('data-slug');
  var base = parseInt(el.getAttribute('data-base') || '0', 10);

  if (!slug) return;

  var KEY = 'post-visits:' + slug;

  // 读累计增量（默认 0）
  var delta = parseInt(localStorage.getItem(KEY) || '0', 10);
  if (isNaN(delta)) delta = 0;

  // 累加 +1（每次页面访问 +1）
  delta = delta + 1;
  localStorage.setItem(KEY, String(delta));

  // 渲染：base + delta
  var total = base + delta;
  el.textContent = String(total);
})();