"use client";

import IPAChart from "@/components/IPAChart";
import Link from "next/link";

export default function IPAPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-xl mb-12">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-indigo-100 hover:text-white mb-6 transition-colors text-sm font-medium"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-black mb-3 tracking-tight">
            IPA Sounds Library
          </h1>
          <p className="text-indigo-100/80 max-w-2xl text-lg leading-relaxed">
            The International Phonetic Alphabet (IPA) is the key to perfect English pronunciation. 
            Explore the full range of sounds and master each one through listening.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <div className="p-1 bg-gradient-to-b from-white to-transparent dark:from-gray-800 dark:to-transparent rounded-[3rem]">
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-[2.8rem] p-6 md:p-12 border border-white/20 dark:border-gray-700/30 shadow-2xl">
            <IPAChart />
          </div>
        </div>
        
        {/* Help/Legend Section */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              About the IPA
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Standard English spelling is often misleading. The IPA provides a unique symbol for every distinct sound, 
              allowing you to know exactly how to pronounce any word regardless of its spelling.
            </p>
          </div>
          <div className="p-8 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-800/30">
            <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              How to Practice
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Click each button to hear the sound. Pay close attention to the position of your tongue and lips. 
              Try to mimic the sound immediately after hearing it to build muscle memory.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
