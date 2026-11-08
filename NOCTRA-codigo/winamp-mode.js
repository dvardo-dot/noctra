import {tracks} from './tracks.js';
const $=id=>document.getElementById(id),shell=$('winampWindow'),host=$('webampHost'),status=$('winampStatus');
const EQ_BANDS=['preamp',60,170,310,600,1000,3000,6000,12000,14000,16000];
export function resetEqualizer(instance){if(!instance?.store?.dispatch)throw Error('Equalizador indisponível');for(const band of EQ_BANDS)instance.store.dispatch({type:'SET_BAND_VALUE',band,value:50});instance.store.dispatch({type:'SET_EQ_ON'});}
let instance=null,loading=null,owner=false,closed=false,lastPlaying=false;
const timed=(promise,ms=30000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Tempo de carregamento excedido')),ms);promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})});
function syncPlayback(){if(!owner||!instance)return;const playing=instance.getMediaStatus()==='PLAYING';if(playing!==lastPlaying){lastPlaying=playing;document.body.classList.toggle('is-playing',playing);} }
function activate(){window.dispatchEvent(new Event('noctra:pause'));$('playerWindow').hidden=true;shell.hidden=false;owner=true;closed=false;lastPlaying=false;$('taskPlayer').classList.add('inactive');$('taskWinamp').classList.remove('inactive');instance.reopen();syncPlayback();}
function leave(){if(instance)instance.pause();owner=false;lastPlaying=false;document.body.classList.remove('is-playing');shell.hidden=true;$('taskWinamp').classList.add('inactive');}
function showNoctra(){leave();$('desktopPlayer').click();}
async function initialize(){
 const {default:Webamp}=await timed(import('https://cdn.jsdelivr.net/npm/webamp@2.3.1/built/webamp.bundle.min.mjs'));
 if(!Webamp.browserIsSupported())throw Error('Este navegador não oferece suporte ao Webamp');
 const localTracks=tracks.filter(track=>track.src&&!track.youtubeId).map(track=>({url:new URL(track.src,location.href).href,duration:track.duration,metaData:{title:track.title,artist:track.artist}}));
 instance=new Webamp({initialSkin:{url:new URL('assets/Angels_Eyes.wsz',location.href).href},initialTracks:localTracks,enableHotkeys:false,enableMediaSession:false,zIndex:3,windowLayout:{main:{position:{top:0,left:0},closed:false},equalizer:{position:{top:116,left:0},closed:false},playlist:{position:{top:232,left:0},closed:false,size:{extraHeight:0,extraWidth:0}}}});
 await timed(instance.renderInto(host));
 instance.setVolume(65);
 instance.onMinimize(()=>{shell.hidden=true;$('taskWinamp').classList.add('inactive');});
 instance.onClose(()=>{closed=true;showNoctra();});
 instance.onTrackDidChange(track=>{if(track?.metaData?.title)status.textContent=track.metaData.title;});
 instance.store.subscribe(syncPlayback);
 $('resetEq').disabled=false;
 status.textContent='Sua skin Angels Eyes. Clique em play para ouvir os MP3.';
}
export async function openWinamp(){
 shell.hidden=false;status.textContent=instance&&!closed?'Clique em play ou ajuste o equalizador.':'Carregando Webamp e a skin Angels Eyes…';
 try{if(!instance||loading){if(!loading)loading=initialize();await loading;loading=null;}activate();}
 catch(error){status.textContent='Não foi possível abrir o Winamp. Verifique a conexão e tente novamente.';$('resetEq').disabled=true;console.error('NOCTRA / Webamp:',error);if(instance){try{instance.dispose()}catch{}instance=null;host.replaceChildren();}loading=null;}
}
for(const id of ['desktopWinamp','showWinamp','menuWinamp'])$(id).addEventListener('click',()=>{ $('startMenu').hidden=true;$('start').setAttribute('aria-expanded','false');openWinamp();});
$('taskWinamp').addEventListener('click',()=>{if(owner&&!shell.hidden){shell.hidden=true;$('taskWinamp').classList.add('inactive');}else openWinamp();});
$('backToNoctra').addEventListener('click',showNoctra);
$('joinMeNoctra').addEventListener('click',()=>{showNoctra();window.dispatchEvent(new Event('noctra:join-me'));});
$('resetEq').addEventListener('click',()=>{try{resetEqualizer(instance);status.textContent='Equalizador resetado: todas as bandas e o pré-amplificador em 0 dB.';}catch(error){status.textContent=error.message;}});
window.addEventListener('noctra:will-play',leave);
window.addEventListener('noctra:show',leave);
if(new URLSearchParams(location.search).get('player')==='winamp')openWinamp();
