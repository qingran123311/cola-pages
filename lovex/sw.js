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

/* ---- 她 10-05：PeriodicSync 兑底路线 ----
   安卓 Chrome 没有 TimestampTrigger；页面被杀后引擎也停了，能预知的只有报备/查岗计划。
   notify.js 在页面离开时把计划快照写进 IDB '@planned'；系统唤醒 SW（装到主屏后 ≥6小时一次）
   时，把已经到点、还没弹过的补弹出去。唤醒时机浏览器定，尽力而为。 */
function idbRead(key, put, val) {
  return new Promise(function (res) {
    try {
      var r = indexedDB.open('LOVEX_MEDIA', 1);
      r.onsuccess = function () {
        var d = r.result;
        try {
          var t = d.transaction('blobs', put ? 'readwrite' : 'readonly');
          var q = put ? t.objectStore('blobs').put(val, key) : t.objectStore('blobs').get(key);
          q.onsuccess = function () { res(put ? true : (q.result || null)); d.close(); };
          q.onerror = function () { res(put ? false : null); d.close(); };
        } catch (e) { try { d.close(); } catch (_) {} res(put ? false : null); }
      };
      r.onerror = function () { res(put ? false : null); };
    } catch (e) { res(put ? false : null); }
  });
}
self.addEventListener('periodicsync', function (e) {
  if (e.tag !== 'lovex-due') return;
  e.waitUntil(idbRead('@planned').then(function (snap) {
    if (!snap || !snap.items || !snap.items.length) return;
    var now = Date.now();
    return idbRead('@plannedshown').then(function (shown) {
      shown = shown || {};
      var changed = false;
      snap.items.forEach(function (it) {
        if (!it || !it.dueAt) return;
        if (it.dueAt > now + 6e4 || it.dueAt < now - 48 * 36e5) return;
        if (shown[it.tag]) return;
        shown[it.tag] = now; changed = true;
        try {
          self.registration.showNotification(it.name || 'LOVE♡X', {
            body: it.body || '', icon: it.icon || undefined, tag: 'lovex-plan-' + it.tag, data: {}
          });
        } catch (err) {}
      });
      if (changed) {
        var ks = Object.keys(shown);
        if (ks.length > 100) ks.slice(0, ks.length - 100).forEach(function (k) { delete shown[k]; });
        return idbRead('@plannedshown', true, shown);
      }
    });
  }).catch(function () {}));
});
