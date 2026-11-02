/* Yo-ho: файлы прямо с Яндекс Диска — без сервера Yo-ho, поэтому работает в России без VPN.
   Сервер скачивания Диска не даёт странице прочитать manifest.json, поэтому версию для всех узнаём
   по отметке — пустой папке current/<версия> (её ставит сборка), а имена файлов — по списку папки версии.
   Список папок и выдачу ссылок API Диска страницам разрешает. */
var YoHo = (function () {
  var PUB = 'https://yadi.sk/d/1zjlZMb0mavSzg';
  var API = 'https://cloud-api.yandex.net/v1/disk/public/resources';
  var info = null;

  function q(path, extra) {
    return '?public_key=' + encodeURIComponent(PUB) + '&path=' + encodeURIComponent(path) + (extra || '');
  }
  function json(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error('Диск ответил ' + r.status); return r.json(); });
  }
  function items(path) {
    return json(API + q(path, '&limit=100')).then(function (j) { return (j._embedded && j._embedded.items) || []; });
  }

  // {version, date, files: [имена]} — текущая версия для всех.
  function current() {
    if (info) return info;
    info = items('/current').then(function (list) {
      var v = null, date = '';
      for (var i = 0; i < list.length; i++) if (/^\d+(\.\d+)+$/.test(list[i].name)) { v = list[i].name; date = list[i].created; }
      if (!v) throw new Error('нет отметки версии');
      return items('/' + v).then(function (fs) {
        return { version: v, date: date, files: fs.map(function (f) { return f.name; }) };
      });
    }).catch(function (e) { info = null; throw e; });
    return info;
  }

  // kind: 'setup' — установщик Windows; 'apk' — универсальный файл для ТВ (ставится на любой).
  function pick(c, kind) {
    for (var i = 0; i < c.files.length; i++) {
      var n = c.files[i];
      if (kind === 'setup' && /setup.*\.exe$/i.test(n)) return n;
      if (kind === 'apk' && n === 'Yo-ho-' + c.version + '.apk') return n;
    }
    return null;
  }

  // Скачать: свежая ссылка в момент нажатия. Не вышло — открыть папку выпусков на Диске.
  function download(kind, onState) {
    if (onState) onState('Готовлю ссылку…');
    return current().then(function (c) {
      var n = pick(c, kind);
      if (!n) throw new Error('нет файла');
      return json(API + '/download' + q('/' + c.version + '/' + n));
    }).then(function (j) {
      if (!j.href) throw new Error('нет ссылки');
      if (onState) onState('');
      location.href = j.href;
    }).catch(function (e) {
      // Не молча в папку: пишем, что случилось, и даём папку ссылкой — так видно, в чём дело.
      if (onState) onState('Не получилось взять ссылку (' + (e && e.message || e) + '). Файлы — в папке выпусков: ' + PUB);
      else location.href = PUB;
    });
  }

  return { folder: PUB, current: current, download: download };
})();
