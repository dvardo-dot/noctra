const profileTracks=()=>window.noctraApp?.getTracks?.()||[];
import {winampSkins} from './winamp-skins.js';
const $=id=>document.getElementById(id),shell=$('winampWindow'),host=$('webampHost'),status=$('winampStatus');
let selectedSkin=winampSkins[0];try{const id=localStorage.getItem(window.noctraProfileKey?window.noctraProfileKey('winamp-skin'):'noctra-winamp-skin');selectedSkin=winampSkins.find(s=>s.id===id)||selectedSkin}catch{}
const EQ_BANDS=['preamp',60,170,310,600,1000,3000,6000,12000,14000,16000];
export function resetEqualizer(instance){if(!instance?.store?.dispatch)throw Error('Equalizador indisponível');for(const band of EQ_BANDS)instance.store.dispatch({type:'SET_BAND_VALUE',band,value:50});instance.store.dispatch({type:'SET_EQ_ON'});}
let instance=null,loading=null,owner=false,closed=false,buffering=false,nativeAudio=null,localTracks=[];
const timed=(promise,ms=30000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Tempo de carregamento excedido')),ms);promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})});
function showParent(){$('desktopPlayer').click();}
function activate(){if(!owner)window.dispatchEvent(new Event('noctra:release-native'));owner=true;shell.hidden=false;showParent();$('taskWinamp').classList.remove('inactive');if(closed){instance.reopen();closed=false;}syncPlayback();}
function syncPlayback(){
 if(!owner||!instance)return;
 const state=instance.store.getState(),playing=!!nativeAudio&&!nativeAudio.paused&&!nativeAudio.seeking&&nativeAudio.readyState>=3&&!buffering&&!nativeAudio.error;
 const time=nativeAudio?.currentTime||0,duration=nativeAudio?.duration||0;
 window.dispatchEvent(new CustomEvent('noctra:winamp-state',{detail:{url:nativeAudio?.currentSrc||nativeAudio?.src||localTracks[0]?.url,playing,time,duration,volume:(state.media.volume||0)/100,shuffle:instance.isShuffleEnabled(),repeat:instance.isRepeatEnabled(),state:playing?'REPRODUZINDO':nativeAudio&&!nativeAudio.paused?'CARREGANDO':'PAUSADO'}}));
}
function leave(){const wasOwner=owner;if(instance&&nativeAudio&&!nativeAudio.paused)instance.pause();owner=false;if(wasOwner)window.dispatchEvent(new Event('noctra:winamp-release'));$('taskWinamp').classList.add('inactive');}
function useCd(){leave();showParent();}
window.noctraWinamp={
 deactivate:()=>{leave();shell.hidden=true;},
 getAnalyser:()=>instance?.media?._analyser||null,
 getPlaylist:()=>instance?.getPlaylistTracks?.()||[],
 get canControl(){return owner&&!!instance&&!!nativeAudio;},get active(){return owner&&!!instance;},get paused(){return !nativeAudio||nativeAudio.paused;},get currentTime(){return nativeAudio?.currentTime||0;},
 play(){if(instance){activate();instance.play();}},pause(){if(instance&&nativeAudio&&!nativeAudio.paused)instance.pause();syncPlayback();},seek(time){instance?.seekToTime(time);syncPlayback();},
 next(){instance?.nextTrack();},previous(){instance?.previousTrack();},setVolume(volume){instance?.setVolume(Math.round(volume*100));},
 shuffle(){instance?.toggleShuffle();syncPlayback();},repeat(){instance?.toggleRepeat();syncPlayback();},
 select(index,play){const track=profileTracks()[index],url=track?.src?new URL(track.src,location.href).href:null;let i=localTracks.findIndex(t=>t.url===url);if(i<0||!instance)return false;activate();if((nativeAudio.currentSrc||nativeAudio.src)!==url)instance.setCurrentTrack(i);if(play)instance.play();syncPlayback();return true;}
};
async function initialize(){
 const {default:Webamp}=await timed(import('./vendor/webamp.bundle.min.mjs'));
 if(!Webamp.browserIsSupported())throw Error('Este navegador não oferece suporte ao Webamp');
 localTracks=profileTracks().filter(track=>track.src&&!track.youtubeId).map(track=>({url:new URL(track.src,location.href).href,duration:track.duration,metaData:{title:track.title,artist:track.artist}}));
 instance=new Webamp({initialSkin:{url:new URL(selectedSkin.file,location.href).href},initialTracks:localTracks,enableHotkeys:false,enableMediaSession:false,zIndex:3,windowLayout:{main:{position:{top:0,left:0},closed:false},equalizer:{position:{top:116,left:0},closed:false},playlist:{position:{top:232,left:0},closed:false,size:{extraHeight:0,extraWidth:0}}}});
 await timed(instance.renderInto(host));instance.setVolume(65);
 // Pinned Webamp 2.3.1 media element: use real audio events for the shared CD display.
 nativeAudio=instance.media._source._audio;
 nativeAudio.addEventListener('play',()=>{if(!owner)activate();});
 for(const name of ['playing','pause','timeupdate','durationchange','seeked','ended','error'])nativeAudio.addEventListener(name,()=>{if(name==='playing'||name==='seeked')buffering=false;syncPlayback();});
 nativeAudio.addEventListener('waiting',()=>{buffering=true;syncPlayback();});
 nativeAudio.addEventListener('seeking',()=>{buffering=true;syncPlayback();});
 instance.onMinimize(()=>{shell.hidden=true;$('taskWinamp').classList.add('inactive');});
 instance.onClose(()=>{closed=true;leave();shell.hidden=true;});
 instance.onTrackDidChange(track=>{buffering=true;if(track?.metaData?.title)status.textContent=track.metaData.title;syncPlayback();});
 instance.store.subscribe(syncPlayback);
 $('resetEq').disabled=false;setSkinControlsDisabled(false);updateSkinChoice();status.textContent='Seus MP3 com equalizador. Os controles do CD acompanham o Winamp.';
}
export async function openWinamp({takeControl=true,scroll=true}={}){
 shell.hidden=false;
 try{if(!instance||loading){status.textContent='Carregando Webamp e a skin selecionada…';if(!loading)loading=initialize();await loading;loading=null;}
 if(takeControl||scroll)showParent();if(takeControl)activate();else if(closed){instance.reopen();closed=false;}
 if(scroll)shell.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
 }catch(error){status.textContent='Não foi possível abrir o Winamp. Verifique a conexão e tente novamente.';$('resetEq').disabled=true;console.error('NOCTRA / Webamp:',error);if(instance){try{instance.dispose()}catch{}instance=null;nativeAudio=null;host.replaceChildren();}loading=null;}
}
for(const id of ['desktopWinamp','showWinamp','menuWinamp'])$(id).addEventListener('click',()=>{$('startMenu').hidden=true;$('start').setAttribute('aria-expanded','false');openWinamp();});
$('taskWinamp').addEventListener('click',()=>{const parent=$('playerWindow');if(!parent.hidden&&!parent.classList.contains('minimized')&&!shell.hidden){shell.hidden=true;$('taskWinamp').classList.add('inactive');}else openWinamp();});
$('backToNoctra').addEventListener('click',()=>{shell.hidden=true;$('taskWinamp').classList.add('inactive');});
$('joinMeNoctra').addEventListener('click',()=>{useCd();window.dispatchEvent(new Event('noctra:join-me'));});
$('resetEq').addEventListener('click',()=>{try{resetEqualizer(instance);status.textContent='Equalizador resetado: todas as bandas e o pré-amplificador em 0 dB.';}catch(error){status.textContent=error.message;}});
window.addEventListener('noctra:will-play',leave);
if(new URLSearchParams(location.search).get('player')==='winamp')openWinamp({scroll:false});

function setSkinControlsDisabled(disabled){$('winampSkin').disabled=disabled;document.querySelectorAll('[data-winamp-skin]').forEach(button=>button.disabled=disabled);}
function updateSkinChoice(){
 $('winampSkin').value=selectedSkin.id;$('winampSkinTitle').textContent=selectedSkin.label;
 $('winampSkinCredit').href=selectedSkin.museum;$('winampSkinCredit').textContent=selectedSkin.label+' · Winamp Skin Museum';
 document.querySelectorAll('[data-winamp-skin]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.winampSkin===selectedSkin.id)));
}
function skinMessage(text){$('skinFeedback').textContent=text;$('skinDialogFeedback').textContent=text;}
async function applySkin(id){
 const chosen=winampSkins.find(s=>s.id===id);if(!chosen||!instance||loading)return false;
 if(chosen.id===selectedSkin.id)return true;
 const previous=selectedSkin;setSkinControlsDisabled(true);skinMessage('Carregando '+chosen.label+'…');
 try{instance.setSkinFromUrl(new URL(chosen.file,location.href).href);await timed(instance.skinIsLoaded());selectedSkin=chosen;updateSkinChoice();let saved=true;try{localStorage.setItem(window.noctraProfileKey?window.noctraProfileKey('winamp-skin'):'noctra-winamp-skin',chosen.id)}catch{saved=false}skinMessage(chosen.label+(saved?' — skin aplicada e salva.':' — skin aplicada para esta sessão.'));return true;}
 catch(error){try{instance.setSkinFromUrl(new URL(previous.file,location.href).href);await timed(instance.skinIsLoaded());}catch{}selectedSkin=previous;updateSkinChoice();skinMessage('Não foi possível aplicar essa skin. Tente novamente.');return false;}
 finally{setSkinControlsDisabled(false);}
}
$('winampSkin').addEventListener('change',event=>applySkin(event.target.value));
$('browseSkins').addEventListener('click',()=>$('skinDialog').showModal());
$('skinDialog').addEventListener('close',()=>$('browseSkins').focus());
document.querySelectorAll('[data-winamp-skin]').forEach(button=>button.addEventListener('click',async()=>{if(await applySkin(button.dataset.winampSkin))$('skinDialog').close();}));
updateSkinChoice();

window.addEventListener('noctra:profile-changed',async event=>{const key=window.noctraProfileKey?window.noctraProfileKey('winamp-skin'):'noctra-winamp-skin';let id='angels';try{id=localStorage.getItem(key)||'angels'}catch{}await applySkin(id)});
window.addEventListener('noctra:library-changed',()=>{if(!instance)return;const next=profileTracks().filter(t=>t.src&&!t.youtubeId).map(t=>({url:new URL(t.src,location.href).href,duration:t.duration,metaData:{title:t.title,artist:t.artist}}));if(next.map(t=>t.url).join('|')!==localTracks.map(t=>t.url).join('|')){leave();instance.dispose();instance=null;nativeAudio=null;localTracks=[];host.replaceChildren();shell.hidden=true;}});
window.addEventListener('noctra:profile-changed',()=>{leave();shell.hidden=true;});
