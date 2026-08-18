/**
 * Pure DSP: Real-time Pitch Detection (F0) via Normalized Square Difference Function (NSDF / Autocorrelation)
 * and Pitch Contour Processing for Intonation Visualizations.
 *
 * Runs locally in the browser with zero external network dependencies or APIs.
 */

export interface PitchPoint {
  timeMs: number;
  pitchHz: number;
  semitones: number;
  confidence: number;
}

export interface TargetPitchPoint {
  timePct: number; // 0.0 to 1.0 (relative sentence progress)
  semitones: number; // relative semitones (e.g. -4 to +6)
  wordIndex?: number;
  label?: string;
  isNuclearStress?: boolean;
}

const MIN_HUMAN_F0 = 70; // Hz (Deep male voice)
const MAX_HUMAN_F0 = 450; // Hz (High female / child voice)
const MIN_CLARITY = 0.55; // Threshold for voiced frame

/**
 * Detects fundamental frequency (F0) from raw PCM audio slice using Normalized Autocorrelation.
 */
export function detectPitchFromSamples(
  samples: Float32Array,
  sampleRate: number,
): { pitchHz: number; clarity: number } {
  const minLag = Math.floor(sampleRate / MAX_HUMAN_F0);
  const maxLag = Math.floor(sampleRate / MIN_HUMAN_F0);
  const len = samples.length;

  if (len < maxLag * 2) {
    return { pitchHz: 0, clarity: 0 };
  }

  // Calculate RMS Energy to ignore background silence
  let energy = 0;
  for (let i = 0; i < len; i++) {
    energy += samples[i] * samples[i];
  }
  const rms = Math.sqrt(energy / len);
  if (rms < 0.015) {
    return { pitchHz: 0, clarity: 0 }; // Silence / ambient noise
  }

  // Compute Normalized Square Difference Function (NSDF)
  const nsdf = new Float32Array(maxLag + 1);
  for (let tau = 0; tau <= maxLag; tau++) {
    let acf = 0;
    let divisor = 0;
    for (let i = 0; i < len - tau; i++) {
      acf += samples[i] * samples[i + tau];
      divisor += samples[i] * samples[i] + samples[i + tau] * samples[i + tau];
    }
    nsdf[tau] = divisor > 0.00001 ? (2 * acf) / divisor : 0;
  }

  // Find all local positive peaks after zero-crossings (McLeod Pitch Method)
  interface Peak {
    lag: number;
    val: number;
  }
  const peaks: Peak[] = [];
  let isPositive = false;
  let curMaxPos = 0;
  let curMaxVal = -1;

  for (let tau = minLag; tau < maxLag; tau++) {
    const val = nsdf[tau];
    if (val > 0) {
      isPositive = true;
      if (val > curMaxVal) {
        curMaxVal = val;
        curMaxPos = tau;
      }
    } else {
      if (isPositive && curMaxPos > 0 && curMaxVal >= MIN_CLARITY) {
        peaks.push({ lag: curMaxPos, val: curMaxVal });
      }
      isPositive = false;
      curMaxPos = 0;
      curMaxVal = -1;
    }
  }
  if (isPositive && curMaxPos > 0 && curMaxVal >= MIN_CLARITY) {
    peaks.push({ lag: curMaxPos, val: curMaxVal });
  }

  if (peaks.length === 0) {
    return { pitchHz: 0, clarity: 0 };
  }

  // Find the global maximum among detected peaks
  let highestPeakVal = 0;
  for (const p of peaks) {
    if (p.val > highestPeakVal) highestPeakVal = p.val;
  }

  // Select the FIRST peak whose height is at least 80% of the highest peak (avoids octave halving)
  const cutoff = 0.8 * highestPeakVal;
  let chosenPeak = peaks[0];
  for (const p of peaks) {
    if (p.val >= cutoff) {
      chosenPeak = p;
      break;
    }
  }

  const maxPos = chosenPeak.lag;
  const maxVal = chosenPeak.val;

  // Parabolic interpolation for sub-sample peak accuracy
  const y1 = nsdf[maxPos - 1] ?? maxVal;
  const y2 = nsdf[maxPos];
  const y3 = nsdf[maxPos + 1] ?? maxVal;
  const denominator = 2 * (2 * y2 - y1 - y3);
  const delta = Math.abs(denominator) > 0.00001 ? (y3 - y1) / denominator : 0;
  const exactLag = maxPos + Math.max(-0.5, Math.min(0.5, delta));

  const pitchHz = sampleRate / exactLag;

  if (pitchHz < MIN_HUMAN_F0 || pitchHz > MAX_HUMAN_F0) {
    return { pitchHz: 0, clarity: 0 };
  }

  return { pitchHz, clarity: maxVal };
}

/**
 * Extracts a sequence of pitch points from an AudioBuffer across time.
 */
export function extractPitchTrack(
  audioBuffer: AudioBuffer,
  frameSizeMs: number = 40,
  hopSizeMs: number = 15,
): PitchPoint[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const frameSize = Math.floor((frameSizeMs / 1000) * sampleRate);
  const hopSize = Math.floor((hopSizeMs / 1000) * sampleRate);

  const points: PitchPoint[] = [];
  const rawPitches: number[] = [];

  for (let offset = 0; offset + frameSize <= channelData.length; offset += hopSize) {
    const timeMs = Math.round((offset / sampleRate) * 1000);
    const frame = channelData.subarray(offset, offset + frameSize);
    const { pitchHz, clarity } = detectPitchFromSamples(frame, sampleRate);

    if (pitchHz > 0 && clarity >= MIN_CLARITY) {
      points.push({
        timeMs,
        pitchHz,
        semitones: 0,
        confidence: clarity,
      });
      rawPitches.push(pitchHz);
    }
  }

  if (points.length === 0) {
    return [];
  }

  // Find median pitch to normalize semitones (independent of male/female register)
  rawPitches.sort((a, b) => a - b);
  const medianPitch = rawPitches[Math.floor(rawPitches.length / 2)];

  // Convert Hz to semitones relative to speaker's median: 12 * log2(f / f_median)
  for (const point of points) {
    point.semitones = Math.round(12 * Math.log2(point.pitchHz / medianPitch) * 10) / 10;
  }

  // Smooth outliers (median filter of 3 points)
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].semitones;
    const curr = points[i].semitones;
    const next = points[i + 1].semitones;
    if (Math.abs(curr - prev) > 4 && Math.abs(curr - next) > 4) {
      points[i].semitones = (prev + next) / 2;
    }
  }

  return points;
}

export interface IntonationAssessment {
  userPattern: "rising" | "falling" | "fall-rise" | "rise-fall" | "flat";
  targetPattern: "rising" | "falling" | "fall-rise" | "rise-fall";
  matched: boolean;
  scorePct: number;
  feedbackEs: string;
}

/**
 * Compares the user's recorded pitch trajectory against the intended target intonation pattern.
 */
export function evaluateIntonationContour(
  userPoints: PitchPoint[],
  targetPattern: "rising" | "falling" | "fall-rise" | "rise-fall",
): IntonationAssessment {
  if (userPoints.length < 4) {
    return {
      userPattern: "flat",
      targetPattern,
      matched: false,
      scorePct: 20,
      feedbackEs: "Audio muy corto o con poca voz clara. Habla más cerca del micrófono con volumen normal.",
    };
  }

  // Look at pitch difference between the first third, middle, and final third
  const n = userPoints.length;
  const startChunk = userPoints.slice(0, Math.floor(n / 3));
  const midChunk = userPoints.slice(Math.floor(n / 3), Math.floor((2 * n) / 3));
  const endChunk = userPoints.slice(Math.floor((2 * n) / 3));

  const avgStart = startChunk.reduce((acc, p) => acc + p.semitones, 0) / (startChunk.length || 1);
  const avgMid = midChunk.reduce((acc, p) => acc + p.semitones, 0) / (midChunk.length || 1);
  const avgEnd = endChunk.reduce((acc, p) => acc + p.semitones, 0) / (endChunk.length || 1);

  const endDelta = avgEnd - avgMid;
  const startMidDelta = avgMid - avgStart;

  let detectedPattern: "rising" | "falling" | "fall-rise" | "rise-fall" | "flat" = "flat";

  if (endDelta > 1.8) {
    if (startMidDelta < -1.2) {
      detectedPattern = "fall-rise";
    } else {
      detectedPattern = "rising";
    }
  } else if (endDelta < -1.8) {
    if (startMidDelta > 1.2) {
      detectedPattern = "rise-fall";
    } else {
      detectedPattern = "falling";
    }
  } else if (Math.abs(endDelta) < 1.0 && Math.abs(startMidDelta) < 1.0) {
    detectedPattern = "flat";
  } else {
    detectedPattern = endDelta > 0 ? "rising" : "falling";
  }

  const matched = detectedPattern === targetPattern;
  let scorePct = matched ? 90 : 50;

  if (matched) {
    if (Math.abs(endDelta) >= 2.5) scorePct = 98;
  }

  let feedbackEs = "";
  if (matched) {
    if (targetPattern === "rising") {
      feedbackEs = "¡Excelente entonación ascendente ↗! Elevaste el tono de forma natural al final de la pregunta.";
    } else if (targetPattern === "falling") {
      feedbackEs = "¡Muy buena entonación descendente ↘! Bajaste el tono claramente al finalizar la oración.";
    } else if (targetPattern === "fall-rise") {
      feedbackEs = "¡Gran curva de duda/contraste ↘↗! Bajaste en el centro y subiste con sutileza al final.";
    } else {
      feedbackEs = "¡Excelente énfasis ↗↘! Se sintió el pico de energía en la palabra clave.";
    }
  } else {
    if (targetPattern === "rising") {
      feedbackEs = "Tu tono se mantuvo plano o bajó. En preguntas de Sí/No, eleva tu voz al final (como si preguntaras ¿de verdad? ↗).";
    } else if (targetPattern === "falling") {
      feedbackEs = "Tu tono subió al final. En oraciones afirmativas o preguntas informativas, la voz debe caer con seguridad ↘.";
    } else {
      feedbackEs = "Prueba marcar más el contraste de tono en la palabra principal de la frase.";
    }
  }

  return {
    userPattern: detectedPattern,
    targetPattern,
    matched,
    scorePct,
    feedbackEs,
  };
}
