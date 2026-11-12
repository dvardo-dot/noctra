// Shared media interface: local HTML audio and official YouTube IFrame API.
export function createMedia(native){
 class Media extends EventTarget{
  constructor(){super();this._src='';this.kind='local';this._volume=.65;this._paused=true;this._duration=NaN;this._wantPlay=false;this._failed=false;this.generation=0;this.player=null;this.ready=false;this.readyPromise=null;
   for(const name of ['playing','pause','waiting','seeking','seeked','error','timeupdate','loadedmetadata','ended'])native.addEventListener(name,()=>{if(this.kind==='local'&&this._src)this.emit(name)});
   setInterval(()=>{if(this.kind==='youtube'&&this.ready&&!this._failed){this.readDuration();this.emit('timeupdate')}},500);
  }
  emit(name){this.dispatchEvent(new Event(name))}
  get src(){return this._src}
  set src(value){this.reset();this._src=value;this.kind=value.startsWith('youtube:')?'youtube':'local';if(this.kind==='youtube'){this.videoId=value.slice(8);document.getElementById('youtubePanel').hidden=false;const link=document.getElementById('youtubeLink');link.href='https://www.youtube.com/watch?v='+this.videoId;}else{document.getElementById('youtubePanel').hidden=true;native.src=value;native.volume=this._volume;native.playbackRate=1}}
  reset(){this.generation++;this._wantPlay=false;this._paused=true;this._failed=false;this.errorMessage='';this._duration=NaN;this.kind='none';native.pause();native.removeAttribute('src');native.load();if(this.ready)this.player.stopVideo();this._src='';this.videoId='';}
  removeAttribute(name){if(name==='src'){this.reset();document.getElementById('youtubePanel').hidden=true}}
  load(){if(this.kind==='local')native.load()}
  get paused(){return this.kind==='youtube'?this._paused:native.paused}
  get readyState(){return this.kind==='youtube'?(this.ready&&this.player.getPlayerState()===1?4:2):native.readyState}
  get duration(){return this.kind==='youtube'?this._duration:native.duration}
  get currentTime(){return this.kind==='youtube'?(this.ready?this.player.getCurrentTime()||0:0):native.currentTime}
  set currentTime(value){if(this.kind==='youtube'){if(!this.ready)return;this.emit('seeking');this.player.seekTo(value,true);const generation=this.generation;setTimeout(()=>{if(generation===this.generation)this.emit('seeked')},450)}else native.currentTime=value}
  get volume(){return this._volume}
  set volume(value){this._volume=value;native.volume=value;if(this.ready)this.player.setVolume(value*100)}
  set playbackRate(value){native.playbackRate=value;if(this.ready)this.player.setPlaybackRate(value)}
  async play(){if(this.kind!=='youtube')return native.play();const generation=this.generation,retry=this._failed;this._paused=false;this._wantPlay=true;this._failed=false;await this.ensureYouTube();if(generation!==this.generation||!this._wantPlay)return;this.player.setVolume(this._volume*100);this.player.setPlaybackRate(1);const data=this.player.getVideoData();if(data?.video_id===this.videoId&&!retry)this.player.playVideo();else this.player.loadVideoById(this.videoId)}
  pause(){if(this.kind==='youtube'){this._wantPlay=false;this._paused=true;if(this.ready)this.player.pauseVideo();this.emit('pause')}else native.pause()}
  readDuration(){const id=this.player.getVideoData()?.video_id;if(id!==this.videoId)return;const duration=this.player.getDuration();if(Number.isFinite(duration)&&duration>0&&duration!==this._duration){this._duration=duration;this.emit('loadedmetadata')}}
  state(event){if(this.kind!=='youtube'||this._failed||this.player.getVideoData()?.video_id!==this.videoId)return;this.readDuration();switch(event.data){case 1:this._wantPlay=true;this._paused=false;this.emit('playing');break;case 2:this._paused=true;this._wantPlay=false;this.emit('pause');break;case 3:this._paused=false;this.emit('waiting');break;case 0:this._paused=true;this._wantPlay=false;this.emit('ended');break;case -1:case 5:this._paused=true;this.emit('pause');break}}
  fail(code){if(this.kind!=='youtube')return;this._failed=true;this._paused=true;this._wantPlay=false;this.errorMessage=[101,150].includes(code)?'Este vídeo não permite reprodução incorporada. Use “Abrir no YouTube” ou escolha outra faixa.':code===100?'Este vídeo foi removido ou está privado. Use “Abrir no YouTube” para verificar.':code===153?'O YouTube não autorizou este player. Use “Abrir no YouTube” para ouvir.':'Não foi possível carregar o YouTube. Tente novamente ou use “Abrir no YouTube”.';this.emit('error')}
  blocked(){if(this.kind!=='youtube')return;this._paused=true;this._wantPlay=false;this.emit('blocked')}
  ensureYouTube(){if(this.ready)return Promise.resolve();if(this.readyPromise)return this.readyPromise;
   this.readyPromise=new Promise((resolve,reject)=>{let settled=false;const timeout=setTimeout(()=>{if(!settled){settled=true;this.readyPromise=null;reject(Error('YouTube timeout'))}},20000);
    const init=()=>{if(settled)return;this.player=new window.YT.Player('youtubePlayer',{width:'100%',height:'240',host:'https://www.youtube-nocookie.com',videoId:this.videoId,playerVars:{autoplay:0,controls:1,playsinline:1,origin:location.origin},events:{onReady:()=>{if(settled)return;settled=true;clearTimeout(timeout);this.ready=true;const iframe=this.player.getIframe();iframe.title='Reprodutor de música do YouTube';iframe.referrerPolicy='strict-origin-when-cross-origin';this.player.setVolume(this._volume*100);resolve()},onStateChange:e=>this.state(e),onError:e=>this.fail(e.data),onAutoplayBlocked:()=>this.blocked()}})};
    if(window.YT?.Player)init();else{window.onYouTubeIframeAPIReady=init;let script=document.getElementById('youtubeApi');if(!script){script=document.createElement('script');script.id='youtubeApi';script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{if(!settled){settled=true;clearTimeout(timeout);this.readyPromise=null;script.remove();reject(Error('YouTube API unavailable'))}};document.head.append(script)}}
   });return this.readyPromise;
  }
 }
 return new Media();
}

// Optional local-file DSP chain. The source file stays untouched; effects are applied only during playback.
export function createAudioEffects(native){
 const frequencies=[60,120,250,500,1000,2000,4000,8000,12000,16000];
 let context=null,source=null,filters=[],available=true,analyser=null,preamp=null,bass=null,compressor=null,enhancedRoute=false;
 const values={bands:Array(frequencies.length).fill(0),rate:1,pitchShift:false,gain:0,bass:0,enhanced:false};
 function ensure(){
  if(!context){
   const AudioContext=window.AudioContext||window.webkitAudioContext;
   if(!AudioContext)throw new Error('Este navegador não oferece equalização Web Audio.');
   context=new AudioContext();source=context.createMediaElementSource(native);
   filters=frequencies.map((frequency,index)=>{const filter=context.createBiquadFilter();filter.type=index===0?'lowshelf':index===frequencies.length-1?'highshelf':'peaking';filter.frequency.value=frequency;if(filter.type==='peaking')filter.Q.value=1;return filter});
   preamp=context.createGain();bass=context.createBiquadFilter();bass.type='lowshelf';bass.frequency.value=120;
   compressor=context.createDynamicsCompressor();compressor.threshold.value=-3;compressor.knee.value=6;compressor.ratio.value=20;compressor.attack.value=.003;compressor.release.value=.15;
   source.connect(preamp);preamp.connect(bass);bass.connect(filters[0]);for(let i=0;i<filters.length-1;i++)filters[i].connect(filters[i+1]);analyser=context.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.8;filters.at(-1).connect(analyser);analyser.connect(context.destination);
  }
  return context;
 }
 function set(valuesIn={}){
  if(Array.isArray(valuesIn.bands))values.bands=frequencies.map((_,i)=>Math.max(-12,Math.min(12,Number(valuesIn.bands[i])||0)));
  values.rate=Math.max(.75,Math.min(1.5,Number(valuesIn.rate)||1));values.pitchShift=!!valuesIn.pitchShift;
  for(const key of ['gain','bass'])if(key in valuesIn)values[key]=Math.max(0,Math.min(12,Number(valuesIn[key])||0));
  if('enhanced' in valuesIn)values.enhanced=!!valuesIn.enhanced;
  if(available){const ctx=ensure();
   if(enhancedRoute!==values.enhanced){filters.at(-1).disconnect();compressor.disconnect();if(values.enhanced){filters.at(-1).connect(compressor);compressor.connect(analyser)}else filters.at(-1).connect(analyser);enhancedRoute=values.enhanced;}
   preamp.gain.setTargetAtTime(Math.pow(10,values.gain/20),ctx.currentTime,.025);bass.gain.setTargetAtTime(values.bass,ctx.currentTime,.025);
   filters.forEach((filter,i)=>filter.gain.setTargetAtTime(values.bands[i],ctx.currentTime,.025));native.playbackRate=values.rate;native.preservesPitch=!values.pitchShift;if('webkitPreservesPitch'in native)native.webkitPreservesPitch=!values.pitchShift;}
  return structuredClone(values);
 }
 return {getAnalyser:()=>analyser,frequencies,values:()=>structuredClone(values),set,reset:()=>set({bands:[],rate:1,pitchShift:false,gain:0,bass:0,enhanced:false}),setAvailable(value){available=!!value},async resume(){if(available&&context?.state==='suspended')await context.resume()},async activate(){if(available){const ctx=ensure();if(ctx.state==='suspended')await ctx.resume();set(values)}},get available(){return available}};
}
