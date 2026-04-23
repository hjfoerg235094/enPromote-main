// 将录音得到的音频 Blob 转成讯飞口语评测需要的 raw PCM(16kHz, 16-bit, mono)
// 讯飞后端当前使用 aue=raw 且 auf=audio/L16;rate=16000，
// 因此这里需要输出 Int16 小端字节流。

export async function blobToPCM16kMono(input: Blob): Promise<Blob> {
  const AudioContextCtor = (window.AudioContext || (window as any).webkitAudioContext) as
    | (new () => AudioContext)
    | undefined;

  if (!AudioContextCtor) {
    throw new Error('当前浏览器不支持 AudioContext，无法进行音频转码');
  }

  console.log('[audioPcm] 开始音频转换');
  console.log(`[audioPcm] 输入音频大小: ${input.size} bytes, 类型: ${input.type}`);

  // 1) 解码输入音频（MediaRecorder 常见输出 webm/opus 等）
  const audioCtx = new AudioContextCtor();
  try {
    let arrayBuffer = await input.arrayBuffer();
    console.log(`[audioPcm] ArrayBuffer大小: ${arrayBuffer.byteLength} bytes`);
    if (arrayBuffer.byteLength === 0) {
      throw new Error('音频数据为空');
    }

    // 检查并移除WAV文件头（如果有）
    // WAV文件以"RIFF"开头，后面跟着文件大小和"WAVE"
    const uint8Array = new Uint8Array(arrayBuffer);
    if (uint8Array.length >= 12 && 
        uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 && // "RIFF"
        uint8Array[8] === 0x57 && uint8Array[9] === 0x41 && uint8Array[10] === 0x56 && uint8Array[11] === 0x45) { // "WAVE"
      // 查找data chunk的开始位置
      let dataPos = 12;
      while (dataPos < uint8Array.length - 8) {
        // 检查是否是"data" chunk (0x64 0x61 0x74 0x61)
        if (uint8Array[dataPos] === 0x64 && 
            uint8Array[dataPos + 1] === 0x61 && 
            uint8Array[dataPos + 2] === 0x74 && 
            uint8Array[dataPos + 3] === 0x61) {
          // 找到data chunk，跳过chunk ID和chunk size(8字节)
          const chunkSize = uint8Array[dataPos + 4] | 
                           (uint8Array[dataPos + 5] << 8) | 
                           (uint8Array[dataPos + 6] << 16) | 
                           (uint8Array[dataPos + 7] << 24);
          arrayBuffer = arrayBuffer.slice(dataPos + 8, dataPos + 8 + chunkSize);
          break;
        }
        const chunkSize = uint8Array[dataPos + 4] | 
                         (uint8Array[dataPos + 5] << 8) | 
                         (uint8Array[dataPos + 6] << 16) | 
                         (uint8Array[dataPos + 7] << 24);
        dataPos += 8 + chunkSize;
      }
    }

    const decodedBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      audioCtx.decodeAudioData(
        arrayBuffer.slice(0),
        (buffer) => resolve(buffer),
        (err) => reject(err),
      );
    });

    if (!decodedBuffer || decodedBuffer.length === 0) {
      throw new Error('音频解码失败');
    }

    const targetSampleRate = 16000;

    // 2) 使用 OfflineAudioContext 重采样 + 下混到单声道
    const targetLength = Math.max(1, Math.ceil(decodedBuffer.duration * targetSampleRate));
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();

    const channelData = renderedBuffer.getChannelData(0); // Float32 [-1, 1]

    // 3) Float32 -> Int16(PCM, little-endian)
    const pcmBuffer = new ArrayBuffer(channelData.length * 2);
    const view = new DataView(pcmBuffer);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      const v = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, v, true); // true: little-endian
    }

    // 确保返回的是纯PCM数据，不带任何头部信息
    return new Blob([pcmBuffer], { type: 'audio/L16' });
  } finally {
    await audioCtx.close().catch(() => {});
  }
}

