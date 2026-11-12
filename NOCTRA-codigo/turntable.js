import { readMixtapes, readTurntable, saveTurntable } from './library-store.js';

const $ = id => document.getElementById(id);
const app = () => window.noctraApp;
const profile = () => window.noctraProfileId || localStorage.getItem('noctra:active-profile') || 'nightcore';
const format = seconds => Number.isFinite(seconds) ? Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0') : '—:—';
const audio = $('audio');
const deck = document.querySelector('.deck');
if (audio && deck && !document.getElementById('turntableView')) {
  window.noctraTurntableEnabled = false;
  const view = document.createElement('section');
  view.id = 'turntableView';
  view.className = 'turntable-view';
  view.setAttribute('aria-label', 'Toca-discos NOCTRA');
  view.innerHTML = [
    '<div class="turntable-heading"><div><small>NOCTRA · ANALOGUE ROOM</small><h2>Vinyl player</h2></div><div class="turntable-state"><i></i><span id="turntableStatus" role="status" aria-live="polite">Pronto para tocar</span></div></div>',
    '<div class="turntable-layout"><aside class="turntable-rail"><div class="turntable-rail-head"><strong>FAIXAS</strong><span id="turntableTrackCount">0</span></div><div id="turntableTracks" class="turntable-tracks"></div></aside>',
    '<div class="turntable-center"><div class="turntable-plinth" id="turntablePlinth"><div class="turntable-label">NOCTRA <span>33⅓ RPM</span></div><div class="turntable-mat"></div><div id="turntableDiscStage" class="turntable-disc-stage"><div class="turntable-spindle"></div></div><button id="turntableArm" class="turntable-arm" type="button" aria-label="Braço do toca-discos; iniciar ou pausar a música"><span></span></button><button id="turntableNeedle" class="turntable-needle" type="button" aria-label="Arraste a agulha no disco para buscar um trecho"></button><button id="turntableEject" class="turntable-eject" type="button">Retirar disco</button></div></div>',
    '<aside class="turntable-details" id="turntableDetails"><div class="turntable-details-title"><span>ÁLBUM / MIXTAPE</span><button type="button" id="turntablePersonalize">Personalizar</button></div><label class="turntable-album-picker"><span>Selecionar álbum</span><select id="turntableAlbumSelect" aria-label="Selecionar álbum ou mixtape"></select></label><div class="turntable-sleeve"><img id="turntableCover" alt="Capa do álbum selecionado"><span id="turntableCoverPlaceholder">CAPA DO ÁLBUM</span></div><h3 id="turntableAlbumName">Sua coleção</h3><p id="turntableAlbumArtist">Escolha uma faixa para começar</p><p id="turntableAlbumDescription" class="turntable-album-description"></p><div class="turntable-album-actions"><button type="button" id="turntablePlayAlbum">Reproduzir álbum</button><button type="button" id="turntableCreateAlbum">Criar álbum</button></div><div id="turntableAlbumCards" class="turntable-album-cards" aria-label="Coleção de álbuns"></div><p id="turntableSaveStatus" class="turntable-save-status" role="status" aria-live="polite"></p></aside>',
    '<div class="turntable-controls"><div class="turntable-control-caption"><span>TOCA-DISCOS · <b id="turntableTrackTitle">Nenhuma faixa selecionada</b></span><span id="turntableTime">0:00 / —:—</span></div></div></div>',
    '<dialog id="turntablePersonalizeDialog" class="turntable-dialog"><form id="turntablePersonalizeForm"><div class="turntable-dialog-head"><div><small>APARÊNCIA DO PLAYER</small><h2>Personalizar</h2></div><button type="button" class="turntable-dialog-close" data-close="personalize" aria-label="Fechar">×</button></div><div class="turntable-dialog-body"><fieldset><legend>1 · Capa do álbum</legend><label>Imagem da capa<input id="ttCoverFile" type="file" accept="image/jpeg,image/png,image/webp"></label><label>Enquadramento horizontal <input id="ttCoverPosition" type="range" min="0" max="100" value="50"></label><label>Zoom <input id="ttCoverZoom" type="range" min="100" max="180" value="100"></label><button type="button" id="ttRemoveCover">Remover capa</button><div class="tt-preview-sleeve"><img id="ttCoverPreview" alt="Prévia da capa"></div></fieldset>',
    '<fieldset><legend>2 · Arte do vinil</legend><label>Selo central<input id="ttLabelFile" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="tt-inline"><input id="ttUseCover" type="checkbox"> Reutilizar a capa do álbum</label><label class="tt-inline"><input id="ttPictureDisc" type="checkbox"> Aplicar imagem ao disco inteiro (picture disc)</label><label>Imagem para picture disc<input id="ttPictureFile" type="file" accept="image/jpeg,image/png,image/webp"></label><label>Cor do vinil <input id="ttVinylColor" type="color" value="#16151a"></label><button type="button" id="ttRemoveLabel">Remover arte do selo</button></fieldset>',
    '<fieldset><legend>3 · Base e braço</legend><label>Acabamento da base <select id="ttBaseFinish"><option value="walnut">Madeira escura</option><option value="black">Preto acetinado</option><option value="cream">Carvalho claro</option><option value="custom">Cor personalizada</option></select></label><label>Cor personalizada da base <input id="ttBaseColor" type="color" value="#302821"></label><label>Acabamento do braço <input id="ttArmColor" type="color" value="#d5c6aa"></label><label>Textura da base<input id="ttTextureFile" type="file" accept="image/jpeg,image/png,image/webp"></label><button type="button" id="ttRemoveTexture">Remover textura</button></fieldset></div><p id="ttPersonalizeStatus" class="turntable-form-status" role="status" aria-live="polite"></p><div class="turntable-dialog-actions"><button type="button" data-close="personalize">Cancelar</button><button type="button" id="ttResetAppearance">Restaurar padrão</button><button type="submit">Salvar aparência</button></div></form></dialog>',
    '<dialog id="turntableAlbumDialog" class="turntable-dialog"><form id="turntableAlbumForm"><div class="turntable-dialog-head"><div><small>COLEÇÃO LOCAL</small><h2>Criar álbum</h2></div><button type="button" class="turntable-dialog-close" data-close="album" aria-label="Fechar">×</button></div><div class="turntable-dialog-body"><label>Nome<input id="ttAlbumName" maxlength="80" required></label><label>Artista<input id="ttAlbumArtist" maxlength="80"></label><label>Descrição<textarea id="ttAlbumDesc" maxlength="240" rows="2"></textarea></label><label>Faixas<select id="ttAlbumTracks" multiple size="8" aria-label="Escolher faixas do álbum"></select></label><label>Preset de áudio<select id="ttAlbumPreset"><option value="">Sem preset associado</option></select></label><label>Capa do álbum<input id="ttNewAlbumCover" type="file" accept="image/jpeg,image/png,image/webp"></label><label>Arte do selo (opcional)<input id="ttNewAlbumLabel" type="file" accept="image/jpeg,image/png,image/webp"></label></div><p id="ttAlbumStatus" class="turntable-form-status" role="status" aria-live="polite"></p><div class="turntable-dialog-actions"><button type="button" data-close="album">Cancelar</button><button type="submit">Salvar álbum</button></div></form></dialog>'
  ].join('');
  const playerGrid = deck.parentElement;
  playerGrid.insertBefore(view, deck);
  const sourceParts = ['.deck-label', '.disc-stage', '.now', '.transport', '.seek', '.deck-bottom'];
  const sourceSlots = sourceParts.map(selector => { const node=deck.querySelector(selector); if(!node)return null; const marker=document.createComment('NOCTRA 1.2.0 '+selector);node.before(marker);return {node,marker}; }).filter(Boolean);
  sourceParts.forEach(selector => { const node = deck.querySelector(selector); if (node) { if (selector === '.disc-stage') $('turntableDiscStage').append(node); else if (selector === '.deck-label') view.prepend(node); else if (selector === '.now') $('turntableDetails').append(node); else if (selector === '.transport' || selector === '.seek' || selector === '.deck-bottom') document.querySelector('.turntable-controls').append(node); } });
  deck.hidden = true;
  const now = view.querySelector('.now');
  if (now) { now.classList.add('turntable-now'); $('turntableDetails').append(now); }
  const statusHeader = view.querySelector('.deck-label');
  if (statusHeader) { statusHeader.classList.add('turntable-source-status'); view.querySelector('.turntable-heading').append(statusHeader); }
  const art = document.createElement('div'); art.className = 'turntable-label-art'; art.innerHTML = '<img id="turntableLabelArt" alt="Arte do selo do vinil">';
  const disc = $('disc');
  if (disc) { disc.classList.add('turntable-vinyl'); disc.insertBefore(art, disc.querySelector('.disc-shine')); }

  let data = { albums: [], appearance: {} }, mixes = [], selectedAlbum = '', selectedTrack = '', playing = false, ejected = false, speed = 0, rotation = 0, lastFrame = 0;
  const imageUrls = new WeakMap(); let wallpaperUrl = '';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const tracks = () => app()?.getTracks?.() || [];
  const album = () => data.albums.find(item => item.id === selectedAlbum) || mixes.find(item => item.id === selectedAlbum) || null;
  const displayUrl = value => { if (value instanceof Blob) { if (!imageUrls.has(value)) imageUrls.set(value, URL.createObjectURL(value)); return imageUrls.get(value); } return typeof value === 'string' ? value : ''; };
  function status(text) { $('turntableStatus').textContent = text; }
  function saveStatus(text) { $('turntableSaveStatus').textContent = text; }
  function getCurrent() { const id = app()?.current?.(); return tracks().find(track => track.id === id) || tracks().find(track => track.id === selectedTrack) || null; }
  let draft, previewing = false;
  function currentArt(item) { const track = getCurrent(); return displayUrl((previewing ? draft?.coverBlob : item?.coverBlob || item?.cover) || data.appearance.coverBlob || track?.coverBlob || track?.cover || ''); }
  function paintAlbum(item) {
    const track = getCurrent();
    const cover = currentArt(item);
    $('turntableCover').src = cover;
    $('turntableCover').hidden = !cover;
    $('turntableCoverPlaceholder').hidden = !!cover;
    $('turntableAlbumName').textContent = item?.name || (track?.album || 'Sua coleção');
    $('turntableAlbumArtist').textContent = item?.artist || track?.artist || 'Escolha uma faixa para começar';
    $('turntableAlbumDescription').textContent = item?.description || '';
    $('turntableTrackTitle').textContent = track?.title || 'Nenhuma faixa selecionada';
    const labelBlob = previewing ? draft?.labelBlob : item?.labelBlob || data.appearance.labelBlob;
    const label = (previewing ? draft?.useCoverAsLabel : item?.useCoverAsLabel || data.appearance.useCoverAsLabel) ? cover : displayUrl(labelBlob);
    const labelImage = $('turntableLabelArt').parentElement;
    $('turntableLabelArt').src = label || cover;
    $('turntableLabelArt').hidden = !(label || cover);
    const picture = previewing ? draft?.pictureDisc : item?.pictureDisc ?? data.appearance.pictureDisc;
    if (!window.noctraTurntableEnabled) return;
    const disc = $('disc');
    disc.classList.toggle('picture-disc', !!picture);
    disc.classList.toggle('vinyl-colored', !picture);
    disc.style.setProperty('--vinyl-color', (previewing ? draft?.vinylColor : item?.vinylColor) || data.appearance.vinylColor || '#16151a');
    const source = picture ? (displayUrl((previewing ? draft?.pictureBlob : item?.pictureBlob) || item?.coverBlob || cover) || cover) : '';
    document.querySelector('.disc-art').style.backgroundImage = source ? 'url("' + source.replaceAll('"', '%22') + '")' : 'none';
    labelImage.hidden = picture;
  }
  function renderTracks() {
    const host = $('turntableTracks'); host.replaceChildren();
    const list = tracks();
    $('turntableTrackCount').textContent = String(list.length).padStart(2, '0');
    for (const track of list) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'turntable-track'; button.dataset.id = track.id;
      const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.src = displayUrl(track.coverBlob || track.cover) || 'assets/cover-moon.jpg'; image.onerror = () => { image.src = 'assets/cover-moon.jpg'; };
      const text = document.createElement('span'); text.innerHTML = '<strong></strong><small></small>'; text.querySelector('strong').textContent = track.title; text.querySelector('small').textContent = track.artist || 'Artista desconhecido';
      const duration = document.createElement('small'); duration.className = 'tt-duration'; duration.textContent = format(track.duration);
      button.append(image, text, duration); button.setAttribute('aria-label', 'Reproduzir ' + track.title + ' por ' + (track.artist || 'Artista desconhecido'));
      button.addEventListener('click', () => { selectedTrack = track.id; if (selectedAlbum) app()?.setQueue?.(album()?.trackIds || null); app()?.select?.(track.id, true); ejected = false; sync(); }); host.append(button);
    }
    renderAlbumOptions();
  }
  function renderAlbumOptions() {
    const select = $('turntableAlbumSelect'); select.replaceChildren();
    const all = [{ id: '', name: 'Biblioteca completa', trackIds: tracks().map(track => track.id) }, ...data.albums, ...mixes];
    for (const item of all) { const option = document.createElement('option'); option.value = item.id; option.textContent = item.name + ' · ' + (item.trackIds?.length || 0) + ' faixas'; select.append(option); }
    if (all.some(item => item.id === selectedAlbum)) select.value = selectedAlbum;
    const cards = $('turntableAlbumCards'); cards.replaceChildren();
    for (const item of all.slice(1)) { const button = document.createElement('button'); button.type = 'button'; button.className = 'turntable-album-card'; button.setAttribute('aria-pressed', String(item.id === selectedAlbum)); const image = document.createElement('img'); image.alt = ''; image.src = displayUrl(item.coverBlob || item.cover) || 'assets/cover-moon.jpg'; image.style.objectPosition = (item.coverPosition ?? data.appearance.coverPosition ?? 50) + '% center'; image.onerror = () => { image.src = 'assets/cover-moon.jpg'; }; const name = document.createElement('span'); name.textContent = item.name; button.append(image, name); button.addEventListener('click', () => { selectedAlbum = item.id; selectAlbum(item); }); cards.append(button); }
  }
  function renderAlbumPicker() {
    const chosen = album(); $('turntableAlbumSelect').value = selectedAlbum;
    const ids = chosen?.trackIds || tracks().map(track => track.id);
    for (const button of $('turntableTracks').children) button.classList.toggle('selected', ids.includes(button.dataset.id) && (button.dataset.id === app()?.current?.()));
    paintAlbum(chosen);
  }
  async function readData() {
    try { data = await readTurntable(profile()) || { albums: [], appearance: {} }; data.albums ||= []; data.appearance ||= {}; }
    catch (error) { data = { albums: [], appearance: {} }; saveStatus('Falha ao ler personalização: ' + error.message); }
    try { if (profile() === 'nightcore') await window.noctraStudio?.loadProfileData?.(); const loaded = window.noctraDesktop?.loadMixtapes ? await window.noctraDesktop.loadMixtapes() : await readMixtapes(profile()); mixes = loaded.map(item => ({ ...item, type: 'mixtape' })); }
    catch { mixes = []; }
    renderTracks(); applyAppearance(data.appearance); renderAlbumPicker(); applyWallpaper();
  }
  async function persist() {
    saveStatus('Salvando alterações…');
    try { await saveTurntable(data, profile()); saveStatus('Alterações salvas neste perfil.'); return true; }
    catch (error) { saveStatus((error.name === 'QuotaExceededError' ? 'Armazenamento cheio. ' : 'Falha ao salvar. ') + error.message); return false; }
  }
  function coverPosition() { return data.appearance.coverPosition ?? 50; }
  function applyAppearance(settings) {
    const base = settings.baseFinish === 'cream' ? '#c5b89d' : settings.baseFinish === 'black' ? '#222326' : settings.baseColor || '#302821';
    const texture = displayUrl(settings.textureBlob);
    const plinth = $('turntablePlinth'); plinth.style.setProperty('--base-color', base); plinth.style.setProperty('--arm-color', settings.armColor || '#d5c6aa'); plinth.style.backgroundImage = texture ? 'linear-gradient(#0002,#0002),url("' + texture + '")' : '';
    $('turntableCover').style.objectPosition = coverPosition() + '% center'; $('turntableCover').style.transform = 'scale(' + ((settings.coverZoom || 100) / 100) + ')';
    $('turntableNeedle').style.setProperty('--arm-color', settings.armColor || '#d5c6aa');
    paintAlbum(album());
  }
  function sync() {
    const current = getCurrent();
    const time = window.noctraWinamp?.active ? Number(window.noctraWinamp.currentTime) || 0 : audio.currentTime || 0;
    const duration = window.noctraWinamp?.active ? Number(window.noctraWinamp.duration) || current?.duration : audio.duration || current?.duration;
    const pct = Number.isFinite(duration) && duration > 0 ? Math.max(0, Math.min(1, time / duration)) : 0;
    $('turntableTime').textContent = format(time) + ' / ' + format(duration);
    $('turntableView').style.setProperty('--seek-pct', (pct * 100) + '%');
    $('turntableView').classList.toggle('is-playing', playing && !ejected);
    $('turntableView').classList.toggle('is-ejected', ejected);
    $('turntableArm').setAttribute('aria-label', playing ? 'Pausar música' : 'Iniciar música');
    $('turntableEject').textContent = ejected ? 'Inserir disco' : 'Retirar disco';
    $('turntableTracks').querySelectorAll('.turntable-track').forEach(button => button.classList.toggle('playing', button.dataset.id === current?.id && playing));
    $('turntableTrackTitle').textContent = current?.title || 'Nenhuma faixa selecionada';
    if (current && current.id !== selectedTrack) { selectedTrack = current.id; renderAlbumPicker(); }
  }
  function togglePlayback() { if (ejected) { ejected = false; const current = getCurrent(); if (current) app()?.select?.(current.id, false); sync(); return; } if (playing) app()?.pause?.(); else if (app()?.play) app().play(); else app()?.toggle?.(); }
  $('turntableArm').addEventListener('click', togglePlayback);
  $('disc').setAttribute('role', 'button'); $('disc').setAttribute('tabindex', '0'); $('disc').setAttribute('aria-label', 'Vinil. Clique para reproduzir ou pausar; arraste para buscar no áudio.');
  $('disc').addEventListener('keydown', event => { if (window.noctraTurntableEnabled && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); togglePlayback(); } });
  let gesture = null;
  function angleAt(event) { const rect = $('disc').getBoundingClientRect(); return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI; }
  function seekTime(value) { const duration = audio.duration || getCurrent()?.duration; if (Number.isFinite(duration) && duration > 0) { const clamped = Math.max(0, Math.min(duration, value)); if (window.noctraWinamp?.active) window.noctraWinamp.seek(clamped); else audio.currentTime = clamped; } }
  function beginGesture(event, mode) { if(!window.noctraTurntableEnabled)return; if (event.button !== undefined && event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); gesture = { mode, x: event.clientX, y: event.clientY, moved: false, angle: angleAt(event), startTime: audio.currentTime || 0 }; }
  $('disc').addEventListener('pointerdown', event => beginGesture(event, 'disc'));
  $('turntableNeedle').addEventListener('pointerdown', event => beginGesture(event, 'needle'));
  function moveGesture(event) {
    if (!gesture) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (Math.hypot(dx, dy) > 7) gesture.moved = true;
    if (!gesture.moved) return;
    if (gesture.mode === 'needle') {
      const rect = $('disc').getBoundingClientRect(), angle = angleAt(event);
      const fraction = ((angle + 90 + 360) % 360) / 360;
      const duration = audio.duration || getCurrent()?.duration; if (Number.isFinite(duration)) seekTime(fraction * duration);
    } else {
      const next = angleAt(event); let delta = next - gesture.angle; if (delta > 180) delta -= 360; if (delta < -180) delta += 360;
      gesture.angle = next; const duration = audio.duration || getCurrent()?.duration;
      if (Number.isFinite(duration) && duration > 0) seekTime((audio.currentTime || 0) + delta / 360 * duration);
    }
    sync();
  }
  function endGesture() { if (!gesture) return; const moved = gesture.moved; gesture = null; if (!moved && window.noctraTurntableEnabled) togglePlayback(); }
  $('disc').addEventListener('pointermove', moveGesture); $('disc').addEventListener('pointerup', endGesture); $('disc').addEventListener('pointercancel', () => gesture = null);
  $('turntableNeedle').addEventListener('pointermove', moveGesture); $('turntableNeedle').addEventListener('pointerup', endGesture); $('turntableNeedle').addEventListener('pointercancel', () => gesture = null);
  $('turntableEject').addEventListener('click', () => { if (!ejected) { app()?.pause?.(); playing = false; ejected = true; status('Disco retirado'); } else { ejected = false; const current = getCurrent(); if (current) app()?.select?.(current.id, false); status('Disco inserido · pronto para tocar'); } sync(); });
  function selectAlbum(item) { selectedAlbum = item?.id || ''; if (item?.presetId && profile() === 'nightcore') window.noctraStudio?.applyPreset?.(item.presetId); const ids = item?.trackIds || tracks().map(track => track.id); app()?.setQueue?.(ids.length ? ids : null); if (ids.length) app()?.select?.(ids[0], false); selectedTrack = ids[0] || ''; renderAlbumPicker(); }
  $('turntableAlbumSelect').addEventListener('change', () => selectAlbum(album()));
  $('turntableTracks').addEventListener('click', event => { const button = event.target.closest('.turntable-track'); if (!button) return; const currentAlbum = album(); if (currentAlbum?.trackIds?.length) app()?.setQueue?.(currentAlbum.trackIds); else app()?.setQueue?.(null); });
  $('turntablePlayAlbum').addEventListener('click', () => { const item = album(); if (item?.type === 'mixtape') window.noctraStudio?.playMix?.(item.id); else { const ids = item?.trackIds || tracks().map(track => track.id); app()?.setQueue?.(ids); if (ids.length) app()?.select?.(ids[0], true); } ejected = false; });
  function refreshAlbumSelectForData() { $('ttAlbumTracks').replaceChildren(); for (const track of tracks()) { const option = document.createElement('option'); option.value = track.id; option.textContent = track.title + ' — ' + (track.artist || 'Artista desconhecido'); $('ttAlbumTracks').append(option); } }
  $('turntableCreateAlbum').addEventListener('click', async () => { if (profile() === 'nightcore') await window.noctraStudio?.loadProfileData?.(); refreshAlbumSelectForData(); $('turntableAlbumForm').reset(); const presets = window.noctraStudio?.presets?.() || []; $('ttAlbumPreset').replaceChildren(new Option('Sem preset associado', ''), ...presets.map(item => new Option(item.name, item.id))); $('turntableAlbumDialog').showModal(); });
  $('turntableAlbumForm').addEventListener('submit', async event => { event.preventDefault(); const chosen = [...$('ttAlbumTracks').selectedOptions].map(option => option.value); if (!chosen.length) { saveStatus('Escolha ao menos uma faixa para o álbum.'); return; } const cover = $('ttNewAlbumCover').files[0] || null, label = $('ttNewAlbumLabel').files[0] || null; const item = { id: crypto.randomUUID(), type: 'album', name: $('ttAlbumName').value.trim(), artist: $('ttAlbumArtist').value.trim() || 'Artista desconhecido', description: $('ttAlbumDesc').value.trim(), trackIds: chosen, coverBlob: cover, labelBlob: label, pictureDisc: false, vinylColor: '#16151a', presetId: $('ttAlbumPreset').value, createdAt: Date.now() }; data.albums.unshift(item); if (await persist()) { selectedAlbum = item.id; renderAlbumOptions(); renderAlbumPicker(); $('turntableAlbumDialog').close(); status('Álbum salvo neste perfil.'); } else data.albums.shift(); });
  function settingDraft() { const current = album(); return structuredClone({ ...data.appearance, coverBlob: current?.coverBlob || data.appearance.coverBlob || null, labelBlob: current?.labelBlob || data.appearance.labelBlob || null, pictureBlob: current?.pictureBlob || data.appearance.pictureBlob || null, pictureDisc: current?.pictureDisc ?? data.appearance.pictureDisc ?? false, vinylColor: current?.vinylColor || data.appearance.vinylColor || '#16151a' }); }
  const personalize = $('turntablePersonalizeDialog');
  function previewDraft() { previewing = true; applyAppearance(draft); $('ttCoverPreview').src = displayUrl(draft.coverBlob) || currentArt(album()); $('ttCoverPreview').style.objectPosition = (draft.coverPosition || 50) + '% center'; $('ttCoverPreview').style.transform = 'scale(' + ((draft.coverZoom || 100) / 100) + ')'; }
  $('turntablePersonalize').addEventListener('click', () => { draft = settingDraft(); $('ttCoverPosition').value = draft.coverPosition ?? 50; $('ttCoverZoom').value = draft.coverZoom ?? 100; $('ttUseCover').checked = !!draft.useCoverAsLabel; $('ttPictureDisc').checked = !!draft.pictureDisc; $('ttVinylColor').value = draft.vinylColor || '#16151a'; $('ttBaseFinish').value = draft.baseFinish || 'walnut'; $('ttBaseColor').value = draft.baseColor || '#302821'; $('ttArmColor').value = draft.armColor || '#d5c6aa'; $('turntablePersonalizeDialog').showModal(); previewDraft(); });
  function fileDraft(input, key) { const file = $(input).files?.[0]; if (!file) return; if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) { saveStatus('Use uma imagem de até 12 MB.'); $(input).value = ''; return; } draft[key] = file; previewDraft(); }
  $('ttCoverFile').addEventListener('change', () => fileDraft('ttCoverFile', 'coverBlob')); $('ttLabelFile').addEventListener('change', () => fileDraft('ttLabelFile', 'labelBlob')); $('ttPictureFile').addEventListener('change', () => fileDraft('ttPictureFile', 'pictureBlob')); $('ttTextureFile').addEventListener('change', () => fileDraft('ttTextureFile', 'textureBlob'));
  $('ttCoverPosition').oninput = () => { draft.coverPosition = Number($('ttCoverPosition').value); previewDraft(); }; $('ttCoverZoom').oninput = () => { draft.coverZoom = Number($('ttCoverZoom').value); previewDraft(); };
  $('ttUseCover').onchange = () => { draft.useCoverAsLabel = $('ttUseCover').checked; previewDraft(); }; $('ttPictureDisc').onchange = () => { draft.pictureDisc = $('ttPictureDisc').checked; previewDraft(); }; $('ttVinylColor').oninput = () => { draft.vinylColor = $('ttVinylColor').value; previewDraft(); }; $('ttBaseFinish').onchange = () => { draft.baseFinish = $('ttBaseFinish').value; previewDraft(); }; $('ttBaseColor').oninput = () => { draft.baseColor = $('ttBaseColor').value; previewDraft(); }; $('ttArmColor').oninput = () => { draft.armColor = $('ttArmColor').value; previewDraft(); };
  $('ttRemoveCover').onclick = () => { draft.coverBlob = null; $('ttCoverFile').value = ''; previewDraft(); }; $('ttRemoveLabel').onclick = () => { draft.labelBlob = null; draft.useCoverAsLabel = false; $('ttLabelFile').value = ''; previewDraft(); }; $('ttRemoveTexture').onclick = () => { draft.textureBlob = null; $('ttTextureFile').value = ''; previewDraft(); };
  $('ttResetAppearance').onclick = () => { draft = { coverBlob: null, labelBlob: null, textureBlob: null, pictureBlob: null, coverPosition: 50, coverZoom: 100, pictureDisc: false, useCoverAsLabel: false, vinylColor: '#16151a', baseFinish: 'walnut', baseColor: '#302821', armColor: '#d5c6aa' }; previewDraft(); };
  $('turntablePersonalizeForm').addEventListener('submit', async event => { event.preventDefault(); const item = album(); data.appearance = { ...data.appearance, ...draft }; if (item && item.type !== 'mixtape') Object.assign(item, { coverBlob: draft.coverBlob, labelBlob: draft.labelBlob, pictureBlob: draft.pictureBlob, pictureDisc: draft.pictureDisc, vinylColor: draft.vinylColor, useCoverAsLabel: draft.useCoverAsLabel }); if (await persist()) { previewing = false; applyAppearance(data.appearance); renderAlbumPicker(); personalize.close(); } });
  document.querySelectorAll('[data-close="personalize"]').forEach(button => button.addEventListener('click', () => { previewing = false; applyAppearance(data.appearance); personalize.close(); }));
  document.querySelectorAll('[data-close="album"]').forEach(button => button.addEventListener('click', () => $('turntableAlbumDialog').close()));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { previewing = false; applyAppearance(data.appearance); } });
  window.addEventListener('noctra:profile-changed', () => { playing = false; selectedTrack = ''; selectedAlbum = ''; ejected = false; previewing = false; $('turntablePersonalizeDialog').close(); $('turntableAlbumDialog').close(); readData(); });
  window.addEventListener('noctra:library-updated', renderTracks);
  window.addEventListener('noctra:library-changed', renderTracks);
  for (const name of ['playing', 'pause', 'waiting', 'seeking', 'seeked', 'loadedmetadata', 'timeupdate', 'ended', 'error']) audio.addEventListener(name, () => {
    if (name === 'playing') { playing = true; status('Reproduzindo'); ejected = false; }
    if (name === 'pause' || name === 'ended' || name === 'error') { playing = false; if (name === 'ended') status('Faixa finalizada'); if (name === 'error') status('Falha ao carregar áudio'); }
    if (name === 'waiting') { playing = false; status('Carregando áudio…'); }
    if (name === 'seeking') { playing = !audio.paused && audio.readyState >= 3; status('Buscando trecho…'); }
    if (name === 'seeked') { playing = !audio.paused && audio.readyState >= 3; status(playing ? 'Reproduzindo' : 'Pausado'); }
    if (name === 'loadedmetadata') { const item = getCurrent(); if (item) selectedTrack = item.id; renderTracks(); }
    sync();
  });
  window.addEventListener('noctra:winamp-state', event => { const detail = event.detail || {}; playing = !!detail.playing; status(detail.state || (playing ? 'Reproduzindo' : 'Pausado')); sync(); });
  window.addEventListener('noctra:will-play', () => { status('Carregando áudio…'); playing = false; sync(); });
  window.addEventListener('noctra:profile-changed', () => { loadWallpaperChoice(); });
  function frame(now) { if(!window.noctraTurntableEnabled){lastFrame=now;requestAnimationFrame(frame);return} const dt = Math.min(.05, Math.max(0, (now - (lastFrame || now)) / 1000)); lastFrame = now; const target = playing && !ejected && !reduceMotion.matches ? 200 : 0; if (reduceMotion.matches) speed = 0; else speed += (target - speed) * Math.min(1, dt * 2.6); rotation += speed * dt; $('disc').style.transform = 'rotate(' + rotation + 'deg)'; syncArm(); requestAnimationFrame(frame); }
  function syncArm() { const duration = audio.duration || getCurrent()?.duration; const time = window.noctraWinamp?.active ? Number(window.noctraWinamp.currentTime) || 0 : audio.currentTime || 0; const pct = Number.isFinite(duration) && duration > 0 ? Math.max(0, Math.min(1, time / duration)) : 0; $('turntableView').style.setProperty('--tonearm-angle', playing && !ejected ? (24 + pct * 6) + 'deg' : '3deg'); $('turntableNeedle').style.left = (61 - pct * 5) + '%'; $('turntableNeedle').style.top = (37 + pct * 5) + '%'; $('turntableView').classList.toggle('arm-down', playing && !ejected); }
  requestAnimationFrame(frame);
  reduceMotion.addEventListener?.('change', () => { if (reduceMotion.matches) { $('disc').style.transform = 'rotate(' + rotation + 'deg)'; } });
  async function applyWallpaper() { const blob = data.appearance.wallpaperBlob; const wallpaper = document.querySelector('.wallpaper'); if (!wallpaper) return; if (wallpaperUrl) URL.revokeObjectURL(wallpaperUrl); wallpaperUrl = blob instanceof Blob ? URL.createObjectURL(blob) : ''; if (wallpaperUrl) document.body.style.setProperty('--wallpaper', 'url("' + wallpaperUrl + '")'); }
  function loadWallpaperChoice() { applyWallpaper(); }
  const wallpaperOptions = document.querySelector('.wallpaper-options');
  if (wallpaperOptions && !$('ttWallpaperFile')) { const label = document.createElement('label'); label.className = 'tt-wallpaper-upload'; label.innerHTML = 'Usar wallpaper do dispositivo <input id="ttWallpaperFile" type="file" accept="image/jpeg,image/png,image/webp">'; wallpaperOptions.append(label); $('ttWallpaperFile').addEventListener('change', async () => { const file = $('ttWallpaperFile').files?.[0]; if (!file) return; if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) { $('wallpaperFeedback').textContent = 'Escolha uma imagem de até 15 MB.'; return; } data.appearance.wallpaperBlob = file; await persist(); await applyWallpaper(); $('wallpaperFeedback').textContent = 'Wallpaper local salvo neste perfil.'; }); }
  if (wallpaperOptions && !$('ttWallpaperReset')) { const reset = document.createElement('button'); reset.id = 'ttWallpaperReset'; reset.type = 'button'; reset.className = 'tt-wallpaper-reset'; reset.textContent = 'Usar um dos wallpapers da galeria'; wallpaperOptions.append(reset); reset.addEventListener('click', () => { const fallback = document.querySelector('[data-wallpaper="' + (profile() === 'house' ? 'house' : 'original') + '"]') || document.querySelector('[data-wallpaper="original"]'); fallback?.click(); }); }
  document.querySelector('.wallpaper-grid')?.addEventListener('click', async event => { if (!event.target.closest('button[data-wallpaper]')) return; if (data.appearance.wallpaperBlob) { data.appearance.wallpaperBlob = null; await persist(); if (wallpaperUrl) { URL.revokeObjectURL(wallpaperUrl); wallpaperUrl = ''; } } });

  const modeButton=document.createElement('button');modeButton.id='toggleVinyl';modeButton.type='button';
  document.querySelector('.toolbar').insertBefore(modeButton,document.getElementById('about'));
  function setVinyl(enabled){
    window.noctraTurntableEnabled=enabled;document.body.classList.toggle('vinyl-mode',enabled);
    modeButton.textContent=enabled?'Voltar ao CD':'Vinil';modeButton.setAttribute('aria-pressed',String(enabled));
    view.hidden=!enabled;deck.hidden=enabled;art.hidden=!enabled;
    if(enabled){sourceSlots.forEach(({node})=>{if(node.matches('.disc-stage'))$('turntableDiscStage').append(node);else if(node.matches('.now'))$('turntableDetails').append(node);else if(node.matches('.deck-label'))view.querySelector('.turntable-heading').append(node);else view.querySelector('.turntable-controls').append(node)});disc.classList.add('turntable-vinyl');now?.classList.add('turntable-now');statusHeader?.classList.add('turntable-source-status');renderTracks();applyAppearance(data.appearance);}
    else {sourceSlots.forEach(({node,marker})=>marker.after(node));disc.classList.remove('turntable-vinyl','picture-disc','vinyl-colored');now?.classList.remove('turntable-now');statusHeader?.classList.remove('turntable-source-status');const current=getCurrent();document.querySelector('.disc-art').style.backgroundImage='url("'+(current?.discArt||current?.cover||'assets/cover-moon.jpg').replaceAll('"','%22')+'")';}
  }
  modeButton.addEventListener('click',()=>setVinyl(!window.noctraTurntableEnabled));
  window.noctraVinyl={setEnabled:setVinyl,get enabled(){return !!window.noctraTurntableEnabled}};
  setVinyl(false);
  readData();
}
