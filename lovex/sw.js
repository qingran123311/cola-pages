/* LOVE♡X · sw.js —— Service Worker（10-04 横幅通知那条线的 web 侧等价物）
   她 10-04 给的参考是安卓原生的 setExactAndAllowWhileIdle + SCHEDULE_EXACT_ALARM——
   那是原生 App 的东西，网页用不上；网页的「精确闹钟」= SW 注册的 showTrigger（TimestampTrigger）：
   页面关了，浏览器到点也能自己弹横幅。本文件只做两件事：
   ① 点横幅 → 聚焦/打开页面；② 承接 notify.js 预排的计划通知（报备/查岗到点弹）。
   不支持的浏览器上 notify.js 根本不会走这条路（特征检测），不会退化成「立刻弹」。 */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if ('focus' in c) return c.focus();
    }
    return self.clients.openWindow('./');
  }));
});
