/* LOVE♡X P17 通知中转 Service Worker
 * 仅 HTTPS 生效（GitHub Pages）。作用：
 * 1. Android Chrome 要求系统通知必须经 SW showNotification() 弹出
 * 2. 点通知：聚焦已开的页面并捎回会话 id；没有活页就开新窗
 * 无服务器推送（纯前端离线），push 事件留空占位。 */
self.addEventListener('push', function () {});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var convId = e.notification.data && e.notification.data.convId;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (convId) { try { c.postMessage({ type: 'lovex-notify-open', convId: convId }); } catch (err) {} }
      return c.focus();
    }
    return self.clients.openWindow(self.registration.scope);
  }));
});
