/**
 * 友链二维码浮层增强
 *  - 点击 #qrcode- 前缀链接：拦截，不跳转
 *  - 悬停含 .qr-float 的链接（首页/友链用 href="#qrcode-*"，关于页用 .qr-trigger）：
 *    给承载卡片（.tile / .side-card / .card / .about-icons）加 lift 类，
 *    移除其 backdrop-filter/transform 等"堆叠上下文来源"，让内部 z-index:1050
 *    的浮层能浮到页脚等元素之上；移开还原。浮层本身留在原位、纯 CSS 定位。
 *  - 触屏（无 hover）由 CSS 静态展开，脚本不参与。
 */
(function () {
  'use strict';

  var ANCHOR_SELECTOR = 'a[href^="#qrcode"], a.qr-trigger';
  var HOST_SELECTOR = '.tile, .side-card, .card, .about-icons';
  var LIFT_CLASS = 'qr-lift';

  function canHover() {
    return window.matchMedia && window.matchMedia('(hover: hover)').matches;
  }

  function enter(a) {
    if (a.__qrLifted) return;
    a.__qrLifted = true;
    var host = a.closest(HOST_SELECTOR) || a;
    host.classList.add(LIFT_CLASS);
    a.__qrHost = host;
    // 下方空间不足时，浮层翻转到锚点上方弹出（底部 tile 说明文字被视口截断的修复）
    var float = a.querySelector('.qr-float');
    if (float) {
      var r = a.getBoundingClientRect();
      var need = float.offsetHeight + 20;
      if (window.innerHeight - r.bottom < need && r.top >= need) {
        float.classList.add('qr-up');
      }
    }
    a.addEventListener('mouseleave', leave);
  }

  function leave(e) {
    var a = e.currentTarget;
    a.removeEventListener('mouseleave', leave);
    if (a.__qrHost) a.__qrHost.classList.remove(LIFT_CLASS);
    var float = a.querySelector('.qr-float');
    if (float) float.classList.remove('qr-up');
    a.__qrHost = null;
    a.__qrLifted = false;
  }

  document.addEventListener('mouseover', function (e) {
    if (!canHover()) return;
    var a = e.target && e.target.closest && e.target.closest(ANCHOR_SELECTOR);
    if (a && !a.contains(e.relatedTarget)) enter(a);
  });

  // 点击不跳转
  document.addEventListener(
    'click',
    function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href^="#qrcode"]');
      if (a) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
})();
