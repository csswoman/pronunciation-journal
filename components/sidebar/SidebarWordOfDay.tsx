"use client";

import { useState } from "react";
import { Volume2, Mic } from "lucide-react";
import { useSidebar } from "@/components/sidebar/SidebarContext";

const WORD = {
  word: "thoroughly",
  ipa: "/ˈθʌr.ə.li/",
};

const BAR_HEIGHTS = [6, 10, 16, 12, 20, 14, 24, 18, 14, 20, 12, 16, 10, 6, 12, 18, 14, 8];

export default function SidebarWordOfDay() {
  const { collapsed } = useSidebar();
  const [playing, setPlaying] = useState(false);

  if (collapsed) return null;

  return (
    <div className="mx-3 mb-3 rounded-2xl overflow-hidden bg-[#0f172a] p-4 flex flex-col gap-3">
      <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase border border-cyan-400/40 rounded-full px-2 py-0.5 self-start">
        Word of the day
      </span>

      <div>
        <p className="text-xl font-bold text-white leading-tight">{WORD.word}</p>
        <p className="text-sm font-mono text-cyan-400 mt-0.5">{WORD.ipa}</p>
      </div>

      {/* Waveform */}
      <div className="flex items-center gap-[3px] h-7">
        {BAR_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className={`block w-[3px] rounded-full transition-opacity ${playing ? "opacity-100" : "opacity-50"}`}
            style={{ height: `${h}px`, background: `hsl(${185 + i * 3}, 75%, 60%)` }}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white border border-white/20 rounded-xl py-2 hover:bg-white/10 transition-colors"
        >
          <Volume2 size={13} />
          Listen
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-xl py-2 transition-colors">
          <Mic size={13} />
          Record
        </button>
      </div>
    </div>
  );
}
