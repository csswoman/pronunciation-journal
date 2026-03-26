"use client";

import IPAChart from "@/components/IPAChart";

function WaveformSVG() {
  const bars = [4, 8, 14, 20, 30, 22, 12, 18, 28, 36, 24, 16, 32, 40, 28, 20, 34, 44, 30, 22, 38, 48, 34, 26, 40, 50, 36, 28, 42, 32, 24, 18, 28, 38, 26, 20, 32, 42, 30, 22, 36, 46, 32, 24, 18, 28, 16, 10, 6, 4];
  return (
    <div className="flex items-center gap-[3px] h-20 opacity-30">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-purple-500"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default function IPAPage() {
  return (
    <div className="min-h-screen bg-[#F0ECFF] dark:bg-gray-950">
      {/* Hero */}
      <section className="bg-white dark:bg-gray-900 border-b border-purple-100 dark:border-gray-800 px-6 py-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <div className="flex-1 max-w-lg">
            <span className="inline-block text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400 px-3 py-1 rounded-full mb-5 tracking-widest uppercase">
              Interactive Library
            </span>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">
              Master the{" "}
              <em className="not-italic text-purple-600 dark:text-purple-400 font-black italic">
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
              <button className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors shadow-md">
                Quick Start Guide
              </button>
              <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 px-6 py-3 rounded-full font-semibold text-sm transition-colors">
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
