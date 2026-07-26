/**
 * Minimal 16-bit PCM mono/stereo WAV decoder for the Node-side benchmark
 * harness. The in-browser production path uses AudioContext.decodeAudioData
 * instead — this exists only because the benchmark has no DOM.
 */
export interface DecodedWav {
  sampleRate: number
  samples: Float32Array
}

export function decodeWavPcm16(buffer: Buffer): DecodedWav {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a valid WAV file')
  }

  let offset = 12
  let sampleRate = 0
  let numChannels = 1
  let bitsPerSample = 16
  let dataOffset = -1
  let dataSize = 0

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    if (chunkId === 'fmt ') {
      numChannels = buffer.readUInt16LE(offset + 10)
      sampleRate = buffer.readUInt32LE(offset + 12)
      bitsPerSample = buffer.readUInt16LE(offset + 22)
    } else if (chunkId === 'data') {
      dataOffset = offset + 8
      dataSize = chunkSize
    }
    offset += 8 + chunkSize + (chunkSize % 2)
  }

  if (dataOffset < 0 || bitsPerSample !== 16) {
    throw new Error('Unsupported or malformed WAV data chunk')
  }

  const sampleCount = dataSize / 2 / numChannels
  const samples = new Float32Array(sampleCount)
  for (let i = 0; i < sampleCount; i++) {
    const int16 = buffer.readInt16LE(dataOffset + i * 2 * numChannels)
    samples[i] = int16 / 32768
  }

  return { sampleRate, samples }
}
