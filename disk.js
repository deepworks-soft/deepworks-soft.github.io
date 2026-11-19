/* Yo-ho Android TV: официальный стабильный файл из открытого GitHub Releases.
   Публичная страница больше не зависит от загрузки файлов через Яндекс Диск.
   ?v=0.8.x предназначено для проверки указанного релиза, без параметра — только stable latest.
   Внутренний Android updater использует свой подписанный manifest и не зависит от этого скрипта. */
var YoHo = (function () {
  var REPO='deepworks-soft/yo-ho';
  var BASE='https://api.github.com/repos/'+REPO+'/releases/';
  var info=null;
  function json(url){
    return fetch(url,{headers:{'Accept':'application/vnd.github+json'}}).then(function(r){
      if(!r.ok)throw new Error('GitHub вернул '+r.status);
      return r.json();
    });
  }
  function current(){
    if(info)return info;
    var want=(/[?&]v=(\d+(?:\.\d+)+)/.exec(location.search)||[])[1];
    info=json(BASE+(want?'tags/v'+want:'latest')).then(function(r){
      if(r.draft || (!want && r.prerelease))throw new Error('нет стабильного выпуска');
      if(want && r.tag_name!=='v'+want)throw new Error('неверная версия');
      var files=(r.assets||[]).filter(function(a){return a.state==='uploaded';});
      var v=(r.tag_name||'').replace(/^v/,'');
      if(!/^\d+\.\d+\.\d+$/.test(v))throw new Error('версия не найдена');
      return {version:v,date:r.published_at||'',files:files.map(function(a){return a.name;}),
        assets:files,release:r.html_url};
    }).catch(function(e){info=null;throw e;});
    return info;
  }
  function pick(c,kind){
    var file=kind==='apk'?'Yo-ho-'+c.version+'.apk':null;
    return file&&c.assets.filter(function(a){return a.name===file})[0];
  }
  function download(kind,onState){
    if(onState)onState('Ищу официальную версию…');
    return current().then(function(c){
      var asset=pick(c,kind);
      if(!asset)throw new Error('APK не найден в выпуске '+c.version);
      if(onState)onState('Скачивание Yo-ho '+c.version+'…');
      window.location.href=asset.browser_download_url;
    }).catch(function(err){
      if(onState)onState('Не удалось получить APK ('+(err&&err.message||err)+'). Попробуйте снова.');
    });
  }
  return {current:current,download:download};
})();
