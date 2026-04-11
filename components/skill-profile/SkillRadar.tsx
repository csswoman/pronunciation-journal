'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { generateSkillInsight, getNextAction } from '@/lib/skill-profile/utils'
import { SKILL_DIMENSIONS } from '@/lib/skill-profile/types'
import type { SkillProfile } from '@/lib/skill-profile/types'

interface SkillRadarProps {
  profile: SkillProfile
}

const SKILL_ICONS: Record<string, string> = {
  pronunciation: '🗣',
  listening:     '👂',
  vocabulary:    '📚',
  speaking:      '💬',
  reading:       '📖',
  writing:       '✍️',
}

export default function SkillRadar({ profile }: SkillRadarProps) {
  const { skills } = profile
  const insight    = generateSkillInsight(profile)
  const nextAction = getNextAction(profile)

  const data = useMemo(() => {
    return SKILL_DIMENSIONS.map(skill => ({
      key:  skill,
      name: skill.charAt(0).toUpperCase() + skill.slice(1),
      value: Math.round(skills[skill].score),
    }))
  }, [skills])

  const svgSize   = 220
  const center    = svgSize / 2
  const maxRadius = center - 30
  const maxValue  = 100
  const levels    = 5
  const n         = data.length
  const angle     = (Math.PI * 2) / n

  const coords = (value: number, index: number) => {
    const a = angle * index - Math.PI / 2
    const r = (value / maxValue) * maxRadius
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) }
  }

  const axisEnds   = data.map((_, i) => coords(maxValue, i))
  const dataPolygon = data.map((d, i) => { const { x, y } = coords(d.value, i); return `${x},${y}` }).join(' ')
  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const v = ((lvl + 1) / levels) * maxValue
    return data.map((_, i) => { const { x, y } = coords(v, i); return `${x},${y}` }).join(' ')
  })

  const LABEL_PAD    = 28
  const containerPad = LABEL_PAD + 20
  const containerSize = svgSize + containerPad * 2

  const labelPositions = data.map((_, i) => {
    const a = angle * i - Math.PI / 2
    const r = maxRadius + LABEL_PAD
    return {
      x: center + r * Math.cos(a),
      y: center + r * Math.sin(a),
      alignX: Math.cos(a) > 0.2 ? 'left' : Math.cos(a) < -0.2 ? 'right' : 'center',
      alignY: Math.sin(a) > 0.1 ? 'top'  : Math.sin(a) < -0.1 ? 'bottom' : 'middle',
    }
  })

  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-6"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--line-divider)' }}
    >
      <h3
        className="text-base font-semibold uppercase tracking-widest"
        style={{ color: 'var(--deep-text)' }}
      >
        Skill Profile
      </h3>

      {/* Radar chart */}
      <div className="flex justify-center">
        <div
          className="relative"
          style={{ width: containerSize, height: containerSize }}
        >
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="absolute"
            style={{ top: containerPad, left: containerPad }}
          >
            <defs>
              <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="var(--primary)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {gridPolygons.map((pts, i) => (
              <polygon key={`grid-${i}`} points={pts} fill="none"
                stroke="var(--line-color)" strokeWidth="0.8" opacity={0.4 + i * 0.1} />
            ))}

            {axisEnds.map((end, i) => (
              <line key={`axis-${i}`}
                x1={center} y1={center} x2={end.x} y2={end.y}
                stroke="var(--line-color)" strokeWidth="0.8" opacity="0.35" />
            ))}

            <polygon
              points={dataPolygon}
              fill="url(#radarFill)"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {data.map((d, i) => {
              const { x, y } = coords(d.value, i)
              return (
                <circle key={`dot-${i}`} cx={x} cy={y} r={4}
                  fill="var(--primary)" stroke="var(--card-bg)" strokeWidth="1.5" />
              )
            })}
          </svg>

          {/* Floating labels */}
          {data.map((d, i) => {
            const lp   = labelPositions[i]
            const left = lp.x + containerPad
            const top  = lp.y + containerPad
            const tx   = lp.alignX === 'left' ? '0%' : lp.alignX === 'right' ? '-100%' : '-50%'
            const ty   = lp.alignY === 'top'  ? '0%' : lp.alignY === 'bottom' ? '-100%' : '-50%'

            return (
              <div
                key={`label-${i}`}
                className="absolute flex flex-col items-center gap-0.5 pointer-events-none"
                style={{ left, top, transform: `translate(${tx}, ${ty})`, minWidth: 64 }}
              >
                <span className="text-base leading-none">{SKILL_ICONS[d.key]}</span>
                <span className="text-[10px] font-medium leading-tight text-center whitespace-nowrap"
                  style={{ color: 'var(--text-secondary)' }}>
                  {d.name}
                </span>
                <span className="text-sm font-bold leading-none" style={{ color: 'var(--primary)' }}>
                  {d.value}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insight section */}
      <div
        className="rounded-lg p-4 flex flex-col gap-3"
        style={{
          background: 'color-mix(in oklab, var(--primary) 8%, var(--card-bg))',
          borderLeft: '3px solid var(--primary)',
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {insight}
        </p>
        <Link
          href={nextAction.href}
          className="inline-flex items-center gap-1.5 self-start px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--primary)',
            color: 'var(--color-text-on-accent)',
          }}
        >
          {nextAction.label}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}
