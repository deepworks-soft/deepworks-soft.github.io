/* Yo-ho: файлы прямо с Яндекс Диска — без сервера Yo-ho, поэтому работает в России без VPN.
   Публичная папка выпусков: manifest.json (текущая версия для всех) и папки версий. */
var YoHo = (function () {
  var PUB = 'https://yadi.sk/d/1zjlZMb0mavSzg';
  var API = 'https://cloud-api.yandex.net/v1/disk/public/resources/download';
  var manifest = null;

  function href(path) {
    var u = API + '?public_key=' + encodeURIComponent(PUB) + '&path=' + encodeURIComponent(path);
    return fetch(u).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.href) throw new Error('Диск не дал ссылку');
      return j.href;
    });
  }

  function getManifest() {
    if (manifest) return manifest;
    manifest = href('/manifest.json')
      .then(function (h) { return fetch(h); })
      .then(function (r) { return r.json(); })
      .catch(function (e) { manifest = null; throw e; });
    return manifest;
  }

  // kind: 'setup' (Windows) | 'apk' (телевизор, универсальный — ставится на любой)
  function fileHref(kind) {
    return getManifest().then(function (m) {
      var f = null;
      for (var i = 0; i < (m.files || []).length; i++) if (m.files[i].kind === kind) { f = m.files[i]; break; }
      if (!f) throw new Error('нет файла');
      return href('/' + m.version + '/' + f.name);
    });
  }

  // Скачать: свежая ссылка в момент нажатия. Не вышло — открыть папку выпусков на Диске.
  function download(kind, onState) {
    if (onState) onState('Готовлю ссылку…');
    return fileHref(kind).then(function (h) {
      if (onState) onState('');
      location.href = h;
    }).catch(function () {
      if (onState) onState('');
      location.href = PUB;
    });
  }

  return { folder: PUB, manifest: getManifest, download: download };
})();
