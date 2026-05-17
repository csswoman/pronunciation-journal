'use client'

import { Mic } from 'lucide-react'

const BAR_HEIGHTS = [3, 7, 12, 18, 14, 22, 16, 20, 24, 18, 9, 15, 11, 6, 13, 5, 15, 19, 11, 8]

function WaveformSection({ label, active }: { label: string; active: boolean }) {
  return (
    <div>
      <p className="text-tiny font-semibold tracking-widest uppercase mb-3 text-fg-subtle">
        {label}
      </p>
      <div className="flex items-center gap-0.5 h-10">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full ${active ? 'bg-primary opacity-100' : 'bg-border-strong opacity-35'}`}
            style={{
              height: `${h}px`,
              ...(active && {
                animation: `waveBar ${0.55 + (i % 5) * 0.08}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.025}s`,
                transformOrigin: 'center',
              }),
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface Props {
  isRecording: boolean
  onToggleRecord: () => void
}

export default function LessonRecordPanel({ isRecording, onToggleRecord }: Props) {
  return (
    <div className="rounded-2xl p-8 flex flex-col gap-6 h-full bg-surface-raised">
      <WaveformSection label="Native" active />
      <div className="h-px bg-border-subtle" />
      <WaveformSection label="You" active={isRecording} />

      <div className="flex flex-col items-center gap-3 mt-auto pt-2">
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <div className="absolute size-24 rounded-full border-2 border-primary opacity-40 animate-mic-ring" />
          )}
          <button
            type="button"
            onClick={onToggleRecord}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            className={`relative flex items-center justify-center size-20 rounded-full bg-gradient-primary cursor-pointer transition-all duration-200 ${
              isRecording ? 'animate-mic-breathe' : ''
            }`}
            style={{ boxShadow: '0 0 0 10px color-mix(in oklch, var(--primary) 18%, transparent)' }}
          >
            <Mic size={28} color="white" />
          </button>
        </div>
        <p className="text-tiny text-fg-subtle">
          {isRecording ? 'Recording… tap to stop' : 'Tap to record'}
        </p>
      </div>
    </div>
  )
}
