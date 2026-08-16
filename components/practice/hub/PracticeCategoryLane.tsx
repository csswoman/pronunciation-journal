'use client'

import React from 'react'

interface PracticeCategoryLaneProps {
  title: string
  kicker: string
  description?: string
  children: React.ReactNode
  className?: string
}

export default function PracticeCategoryLane({
  title,
  kicker,
  description,
  children,
  className = '',
}: PracticeCategoryLaneProps) {
  const optionCount = React.Children.count(children)
  return (
    <section className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-0.5 px-0.5">
        <span className="font-kicker text-fg-subtle">{kicker}</span>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading text-h3 font-semibold text-fg">{title}</h2>
          {description && (
            <span className="hidden sm:inline font-caption text-fg-subtle">{description}</span>
          )}
        </div>
      </div>

      <p className="px-0.5 font-caption text-fg-subtle md:hidden">Desliza para ver {optionCount} opciones</p>
      <div className="flex w-full gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-0.5 scrollbar-none -mx-4 px-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 md:snap-none xl:grid-cols-3">
        {children}
      </div>
    </section>
  )
}
