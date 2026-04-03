"use client";

import IPAChart from "@/components/IPAChart";

function WaveformSVG() {
  const bars = [4, 8, 14, 20, 30, 22, 12, 18, 28, 36, 24, 16, 32, 40, 28, 20, 34, 44, 30, 22, 38, 48, 34, 26, 40, 50, 36, 28, 42, 32, 24, 18, 28, 38, 26, 20, 32, 42, 30, 22, 36, 46, 32, 24, 18, 28, 16, 10, 6, 4];
  return (
    <div className="flex items-center gap-[3px] h-20 opacity-30">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{ backgroundColor: 'var(--primary)', opacity: 0.3, height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default function IPAPage() {
  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--page-bg)'}}>
      {/* Hero */}
      <section className="border-b" style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--line-divider)',
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <div className="flex-1 max-w-lg">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5 tracking-widest uppercase" style={{
              color: 'var(--primary)',
              backgroundColor: 'var(--btn-regular-bg)',
            }}>
              Interactive Library
            </span>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">
              Master the{" "}
              <em className="not-italic font-black italic" style={{color: 'var(--primary)'}}>
                Geometry
              </em>{" "}
              of Sound.
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed text-base">
              Explore the International Phonetic Alphabet through high-fidelity
              audio samples and articulatory visual guides. A professional
              sanctuary for linguists and learners.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors shadow-md" style={{
                backgroundColor: 'var(--primary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
              >
                Quick Start Guide
              </button>
              <button className="px-6 py-3 rounded-full font-semibold text-sm transition-colors" style={{
                borderColor: 'var(--btn-regular-bg)',
                color: 'var(--primary)',
                border: `2px solid var(--primary)`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.color = 'var(--title-active)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.color = 'var(--primary)')}
              >
                View Full Chart
              </button>
            </div>
          </div>
          <div className="hidden lg:flex items-center flex-1 justify-end">
            <div className="w-full max-w-xs">
              <WaveformSVG />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <IPAChart />
      </div>
    </div>
  );
}
