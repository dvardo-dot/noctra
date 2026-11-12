import {readStoredTracks,storeTrack,readTurntable,saveTurntable} from './library-store.js';
const api=window.noctraDesktop;
function keep(key,value){if(value===undefined||value===null||localStorage.getItem(key)!==null)return;localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));}
export async function migrateDesktopLibrary(){
 if(!api?.readLegacyProfile)return;
 const initial=await api.initialize(),failures=[];keep('noctra:active-profile',initial.activeProfile||'nightcore');
 for(const id of ['nightcore','house','negative']){
  const marker=`noctra:desktop-import:1.4.0:${id}`;if(localStorage.getItem(marker)==='done')continue;
  const note=document.querySelector('#profileChooser .profile-local-note');if(note)note.textContent='Preparando sua biblioteca do Windows…';
  const legacy=await api.readLegacyProfile(id),existing=new Set((await readStoredTracks(id)).map(t=>t.id));
  for(const r of legacy.records){if(existing.has(r.id))continue;await storeTrack({id:r.id,title:r.title,artist:r.artist,album:r.album||'',duration:r.duration,audio:new Blob([r.audioBytes],{type:r.audioType}),cover:r.coverBytes?new Blob([r.coverBytes],{type:r.coverType}):null,disc:null},id);}
  const ids=new Set([...existing,...legacy.records.map(r=>r.id)]);keep(`noctra:${id}:playlists`,legacy.playlists.map(p=>({...p,trackIds:p.trackIds.filter(t=>ids.has(t))})));keep(`noctra:${id}:favorites`,legacy.favorites.filter(t=>ids.has(t)));
  keep(`noctra:${id}:theme`,legacy.preferences.theme||'violet');keep(`noctra:${id}:wallpaper`,legacy.preferences.wallpaper||'original');keep(`noctra:${id}:wallpaper-motion`,String(legacy.preferences.wallpaperAnimation!==false));keep(`noctra:${id}:winamp-skin`,legacy.preferences.skin||'angels');
  if(id==='nightcore'&&legacy.wallpaper){const data=await readTurntable(id)||{albums:[],appearance:{}};data.appearance||={};if(!data.appearance.wallpaperBlob){data.appearance.wallpaperBlob=new Blob([legacy.wallpaper.bytes],{type:legacy.wallpaper.type});await saveTurntable(data,id);}}
  failures.push(...legacy.failures);if(!legacy.failures.length)localStorage.setItem(marker,'done');
 }
 const selected=localStorage.getItem('noctra:active-profile');await api.switchProfile(['nightcore','house','negative'].includes(selected)?selected:'nightcore');
 const note=document.querySelector('#profileChooser .profile-local-note');if(note)note.textContent=failures.length?`${failures.length} arquivo(s) antigo(s) indisponíveis. Os registros originais foram preservados.`:'';
}
function bind(){
 const app=()=>window.noctraApp;
 api.onAction(({action})=>{if(action==='toggle')app()?.toggle();if(action==='next')app()?.next();if(action==='previous')app()?.previous();if(action==='pause')app()?.pause();if(action==='volumeUp'||action==='volumeDown'){const input=document.getElementById('volume');app()?.setVolume(Math.max(0,Math.min(1,Number(input.value)+(action==='volumeUp'?0.05:-0.05))));}});
 for(const [id,fn]of [['minimize',()=>api.minimize()],['expand',()=>api.maximize()],['hidePlayer',()=>api.closeWindow()]])document.getElementById(id)?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();fn();},true);
 async function restore(){const id=window.noctraProfileId,d=await api.initialize();if(d.activeProfile!==id||window.noctraProfileId!==id)return;const a=app();a.setVolume(d.preferences.volume??.65);const shuffle=document.getElementById('shuffle');if((shuffle.getAttribute('aria-pressed')==='true')!==!!d.preferences.random)shuffle.click();if(d.playback.trackId&&a.getTracks().some(t=>t.id===d.playback.trackId)){a.select(d.playback.trackId,false);const audio=document.getElementById('audio'),position=d.playback.position||0;audio.addEventListener('loadedmetadata',()=>{if(a.current()===d.playback.trackId&&position>0)a.seek(Math.min(position,Math.max(0,audio.duration-1)));},{once:true});}}
 restore();window.addEventListener('noctra:profile-changed',restore);document.getElementById('volume').addEventListener('input',()=>api.savePrefs({volume:Number(document.getElementById('volume').value)}));document.getElementById('shuffle').addEventListener('click',()=>api.savePrefs({random:document.getElementById('shuffle').getAttribute('aria-pressed')==='true'}));
 const saved=()=>{const a=app();if(!a)return;api.savePlayback({trackId:a.current()||'',position:a.time()||0,playing:a.isPlaying(),queue:a.getTracks().map(t=>t.id)});};
 setInterval(saved,3000);window.addEventListener('noctra:winamp-state',saved);document.getElementById('audio')?.addEventListener('pause',saved);document.getElementById('audio')?.addEventListener('playing',saved);
 window.addEventListener('noctra:library-changed',()=>{const a=app();if(a){api.savePlaylists(a.playlists());api.saveFavorites(a.favorites());}});
}
window.addEventListener('noctra:app-ready',bind,{once:true});
