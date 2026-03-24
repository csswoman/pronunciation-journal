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
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log(`[AudioUtils] Decoded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels}ch`);

    // Resample to 16kHz mono via OfflineAudioContext.
    // The browser handles stereo→mono mixing and resampling natively (faster than a JS loop).
    const targetSamples = Math.ceil(audioBuffer.duration * 16000);
    const offlineCtx = new OfflineAudioContext(1, targetSamples, 16000);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    const resampled = await offlineCtx.startRendering();
    // Copy so we can mutate in place for normalization
    const channelData = new Float32Array(resampled.getChannelData(0));

    console.log(`[AudioUtils] Resampled to 16000Hz: ${channelData.length} samples`);

    // Calculate RMS and Max amp for diagnostics and normalization
    let sum = 0;
    let max = 0;
    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > max) max = abs;
      sum += channelData[i] * channelData[i];
    }
    const rms = Math.sqrt(sum / channelData.length);

    console.log(`[AudioUtils] RMS: ${rms.toFixed(4)}, Max: ${max.toFixed(4)}`);

    if (rms < 0.005) {
      console.warn("[AudioUtils] Very low RMS, likely pure silence or bad channel capture.");
    }

    // RMS Normalization (target ~0.1 for clear speech)
    const targetRMS = 0.1;
    let gain = targetRMS / (rms + 1e-6);
    gain = Math.min(Math.max(gain, 1.2), 5.0);

    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.max(-1, Math.min(1, channelData[i] * gain));
    }

    console.log(`[AudioUtils] Signal normalized (RMS gain: ${gain.toFixed(2)}x)`);

    // Add 0.4s padding of silence at both ends
    const paddingSamples = Math.floor(0.4 * 16000);
    const paddedLength = paddingSamples + channelData.length + paddingSamples;

    // Ensure it's at least 1.5 seconds total so the model doesn't drop it
    const MIN_DURATION_SAMPLES = 1.5 * 16000;
    const targetLength = Math.max(paddedLength, MIN_DURATION_SAMPLES);

    const paddedAudio = new Float32Array(targetLength); // zero-filled by default
    // Dither only the leading/trailing silence (avoid overwriting audio data)
    for (let i = 0; i < paddingSamples; i++) {
      paddedAudio[i] = (Math.random() - 0.5) * 0.001;
      paddedAudio[targetLength - 1 - i] = (Math.random() - 0.5) * 0.001;
    }

    // Centered padding: place the audio in the center of the padded sequence
    const extra = targetLength - paddedLength;
    const extraStart = Math.floor(extra / 2);
    paddedAudio.set(channelData, paddingSamples + extraStart);

    console.log(`[AudioUtils] Padded. Final length: ${paddedAudio.length} (${(paddedAudio.length / 16000).toFixed(2)}s)`);

    return paddedAudio;
  } catch (err) {
    console.error(`[AudioUtils] Error decoding audio:`, err);
    throw err;
  } finally {
    await audioContext.close();
  }
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

/**
 * Play audio from a URL with error handling.
 * Shows alerts for blob URLs and playback errors if requested.
 */
export function playAudio(audioUrl: string, options?: { showAlerts?: boolean }): void {
  const showAlerts = options?.showAlerts ?? false;

  // Check if it's a blob URL (invalid after refresh)
  if (audioUrl.startsWith("blob:")) {
    const message = "This audio recording is no longer available. Please record again.";
    console.error(message);
    if (showAlerts) {
      alert(message);
    }
    return;
  }

  try {
    const audio = new Audio(audioUrl);
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Audio started playing successfully
        })
        .catch((error) => {
          // Error handling - ignore user-initiated errors
          if (
            error.name !== "AbortError" &&
            error.name !== "NotAllowedError"
          ) {
            console.error("Error playing audio:", error);
            if (showAlerts) {
              alert("Error playing audio. The recording may be corrupted.");
            }
          }
        });
    }
  } catch (error) {
    console.error("Error creating audio element:", error);
    if (showAlerts) {
      alert("Error playing audio. The recording may be corrupted.");
    }
  }
}
