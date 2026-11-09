importScripts('./vendor/lame.min.js');

self.onmessage = async ({ data }) => {
  try {
    if (!self.lamejs?.Mp3Encoder) throw new Error('O codificador MP3 não carregou. Recarregue o site e tente novamente.');
    const left = new Float32Array(data.left);
    const right = data.right ? new Float32Array(data.right) : null;
    const channels = right ? 2 : 1;
    const encoder = new self.lamejs.Mp3Encoder(channels, data.sampleRate, data.bitrate);
    const blockSize = 1152;
    const batchSize = blockSize * 32;
    const output = [];
    let bytes = 0;

    for (let offset = 0; offset < left.length; offset += batchSize) {
      const end = Math.min(offset + batchSize, left.length);
      for (let start = offset; start < end; start += blockSize) {
        const stop = Math.min(start + blockSize, end);
        const l = new Int16Array(stop - start);
        const r = right ? new Int16Array(stop - start) : null;
        for (let i = start; i < stop; i++) {
          l[i - start] = Math.max(-32768, Math.min(32767, Math.round(left[i] * 32767)));
          if (r) r[i - start] = Math.max(-32768, Math.min(32767, Math.round(right[i] * 32767)));
        }
        const chunk = r ? encoder.encodeBuffer(l, r) : encoder.encodeBuffer(l);
        if (chunk.length) { const view = new Uint8Array(chunk); output.push(view); bytes += view.length; }
      }
      self.postMessage({ type: 'progress', value: Math.min(98, Math.round(end / left.length * 98)) });
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const tail = encoder.flush();
    if (tail.length) { const view = new Uint8Array(tail); output.push(view); bytes += view.length; }
    if (!bytes) throw new Error('O áudio não gerou dados MP3. Tente outro arquivo.');
    const result = new Uint8Array(bytes);
    let cursor = 0;
    for (const chunk of output) { result.set(chunk, cursor); cursor += chunk.length; }
    self.postMessage({ type: 'done', buffer: result.buffer }, [result.buffer]);
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || 'Falha ao converter o áudio.' });
  }
};
