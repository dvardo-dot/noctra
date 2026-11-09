const $ = id => document.getElementById(id);
const form = $('converterForm');
const input = $('converterFile');
const progress = $('converterProgress');
const status = $('converterStatus');
const download = $('converterDownload');
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_SECONDS = 20 * 60;
let worker = null;
let outputUrl = '';

function setStatus(message, error = false) {
  status.textContent = message;
  status.dataset.error = String(error);
}

function cleanOutput() {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  download.hidden = true;
  download.removeAttribute('href');
  progress.value = 0;
}

input.addEventListener('change', () => {
  cleanOutput();
  const file = input.files?.[0];
  if (!file) { setStatus('Escolha um arquivo para converter.'); return; }
  if (file.size > MAX_BYTES) { setStatus('O arquivo excede o limite de 25 MB.', true); input.value = ''; return; }
  setStatus(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  cleanOutput();
  const file = input.files?.[0];
  if (!file) { setStatus('Escolha um arquivo de áudio primeiro.', true); input.focus(); return; }
  if (file.size > MAX_BYTES) { setStatus('O arquivo excede o limite de 25 MB.', true); return; }
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!['wav', 'mp3', 'm4a', 'aac', 'ogg', 'oga', 'flac', 'webm', 'opus'].includes(extension)) {
    setStatus('Formato não aceito. Escolha WAV, MP3, M4A, AAC, OGG, FLAC, WebM ou Opus.', true);
    return;
  }

  form.querySelector('button[type="submit"]').disabled = true;
  setStatus('Lendo o áudio no navegador…');
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    let decoded;
    try { decoded = await context.decodeAudioData(await file.arrayBuffer()); }
    finally { await context.close().catch(() => {}); }
    if (!Number.isFinite(decoded.duration) || decoded.duration <= 0) throw new Error('O navegador não reconheceu a duração desse áudio.');
    if (decoded.duration > MAX_SECONDS) throw new Error('O áudio ultrapassa o limite de 20 minutos.');

    const left = new Float32Array(decoded.getChannelData(0));
    const right = decoded.numberOfChannels > 1 ? new Float32Array(decoded.getChannelData(1)) : null;
    const bitrate = Number($('converterBitrate').value);
    const workerUrl = new URL('./converter.worker.js', document.baseURI);
    worker = new Worker(workerUrl, { name: 'noctra-mp3-converter' });
    setStatus('Convertendo no seu dispositivo…');

    await new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') progress.value = data.value;
        if (data.type === 'error') reject(new Error(data.message));
        if (data.type === 'done') {
          outputUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mpeg' }));
          const base = file.name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'audio';
          download.href = outputUrl;
          download.download = `${base}.mp3`;
          download.hidden = false;
          progress.value = 100;
          setStatus(`Conversão concluída · MP3 ${bitrate} kbps · ${(decoded.duration / 60).toFixed(1)} min`);
          resolve();
        }
      };
      worker.onerror = () => reject(new Error('O processo de conversão foi interrompido. Tente novamente com um arquivo menor.'));
      worker.postMessage({ left: left.buffer, right: right?.buffer || null, sampleRate: decoded.sampleRate, bitrate }, [left.buffer, ...(right ? [right.buffer] : [])]);
    });
  } catch (error) {
    setStatus(error.message.includes('decod') || error.name === 'NotSupportedError'
      ? 'Este navegador não conseguiu decodificar o arquivo. Tente WAV, MP3 ou outro formato compatível.'
      : error.message, true);
  } finally {
    worker?.terminate();
    worker = null;
    form.querySelector('button[type="submit"]').disabled = false;
  }
});

$('converterDialog').addEventListener('close', cleanOutput);
