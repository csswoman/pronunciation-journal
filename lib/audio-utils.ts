/**
 * Audio utility functions for recording and processing audio
 * for Whisper WASM transcription.
 *
 * Whisper requires: 16kHz, mono, Float32Array PCM
 */

/**
 * Convert a Blob (any audio format) to a Float32Array at 16kHz mono
 * suitable for Whisper inference.
 */
export async function audioToFloat32(blob: Blob): Promise<Float32Array> {
  // Use a default context to decode the blob at its native rate
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Ensure properly mixed stereo-to-mono instead of just taking channel 0 blindly.
    // This fixes issues where one channel from the mic is silent.
    let channelData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      channelData = audioBuffer.getChannelData(0);
    } else {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      channelData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        channelData[i] = (left[i] + right[i]) * 0.5;
      }
    }

    // Calculate RMS and Max amp for diagnostics and normalization
    let sum = 0;
    let max = 0;
    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > max) max = abs;
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);

    console.log(`[AudioUtils] Decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz, RMS: ${rms.toFixed(4)}, Max: ${max.toFixed(4)}`);

    if (rms < 0.005) {
      console.warn("[AudioUtils] Very low RMS, likely pure silence or bad channel capture.");
    }

    // RMS Normalization (target ~0.1 for clear speech)
    const targetRMS = 0.1;
    let gain = targetRMS / (rms + 1e-6);

    // Cap gain to avoid blowing up silent background noise, and ensure a minimum gain
    gain = Math.min(Math.max(gain, 1.2), 5.0);

    for (let i = 0; i < channelData.length; i++) {
      // Apply gain and hard clip to [-1, 1] to prevent distortion
      channelData[i] = Math.max(-1, Math.min(1, channelData[i] * gain));
    }

    console.log(`[AudioUtils] Signal normalized (RMS gain: ${gain.toFixed(2)}x)`);

    // Resample to 16000Hz (Whisper requirement)
    let finalAudio = channelData;
    if (audioBuffer.sampleRate !== 16000) {
      finalAudio = resampleAudio(channelData, audioBuffer.sampleRate, 16000) as any as Float32Array;
      console.log(`[AudioUtils] Resampled to 16000Hz: ${finalAudio.length} samples`);
    }

    // Add 0.4s padding of silence at both ends
    const paddingSamples = Math.floor(0.4 * 16000);
    const paddedLength = paddingSamples + finalAudio.length + paddingSamples;

    // Ensure it's at least 2.5 seconds total so the model doesn't drop it
    const MIN_DURATION_SAMPLES = 2.5 * 16000;
    const targetLength = Math.max(paddedLength, MIN_DURATION_SAMPLES);

    const paddedAudio = new Float32Array(targetLength);
    // Fill the padded audio with very low-level dither (white noise ~ -60dB)
    for (let i = 0; i < paddedAudio.length; i++) {
      paddedAudio[i] = (Math.random() - 0.5) * 0.001;
    }
    
    // Centered padding: place the original audio accurately in the center of the padded sequence
    const extra = targetLength - paddedLength;
    const extraStart = Math.floor(extra / 2);
    paddedAudio.set(finalAudio, paddingSamples + extraStart);

    console.log(`[AudioUtils] Centered padding. Final array length: ${paddedAudio.length} (${(paddedAudio.length / 16000).toFixed(2)}s)`);

    return paddedAudio;
  } catch (err) {
    console.error(`[AudioUtils] Error decoding audio:`, err);
    throw err;
  } finally {
    await audioContext.close();
  }
}

/**
 * Simple linear interpolation resampling.
 */
function resampleAudio(
  data: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.round(data.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, data.length - 1);
    const t = srcIndex - srcIndexFloor;
    result[i] = data[srcIndexFloor] * (1 - t) + data[srcIndexCeil] * t;
  }

  return result;
}

/**
 * Convert base64 data URL to Blob.
 */
export function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "audio/webm";
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Create an AnalyserNode for audio visualization.
 * Returns a cleanup function.
 */
export function createAudioVisualizer(
  stream: MediaStream,
  onData: (dataArray: Uint8Array) => void,
  fftSize = 256
): { analyser: AnalyserNode; cleanup: () => void } {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = fftSize;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let animFrameId: number;

  function tick() {
    analyser.getByteFrequencyData(dataArray);
    onData(dataArray);
    animFrameId = requestAnimationFrame(tick);
  }

  tick();

  return {
    analyser,
    cleanup: () => {
      cancelAnimationFrame(animFrameId);
      source.disconnect();
      audioContext.close();
    },
  };
}
