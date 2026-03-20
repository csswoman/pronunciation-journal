"use client";

import { useState, useRef, useEffect } from "react";

const SOUNDS_BASE_URL = "/sounds";

interface IPASymbol {
  symbol: string;
  name?: string;
  audioFile?: string;
}

// Data constants
const PULMONIC_CONSONANTS = [
  { row: "Plosive", symbols: [{ symbol: "p" }, { symbol: "b" }, { symbol: "t" }, { symbol: "d" }, { symbol: "ʈ" }, { symbol: "ɖ" }, { symbol: "c" }, { symbol: "ɟ" }, { symbol: "k" }, { symbol: "g" }, { symbol: "q" }, { symbol: "ɢ" }, { symbol: "ʔ" }] },
  { row: "Nasal", symbols: [{ symbol: "m" }, { symbol: "ɱ" }, { symbol: "n" }, { symbol: "ɳ" }, { symbol: "ɲ" }, { symbol: "ŋ" }, { symbol: "ɴ" }] },
  { row: "Trill", symbols: [{ symbol: "ʙ" }, { symbol: "r" }, { symbol: "ʀ" }] },
  { row: "Tap or Flap", symbols: [{ symbol: "ⱱ" }, { symbol: "ɾ" }, { symbol: "ɽ" }] },
  { row: "Fricative", symbols: [{ symbol: "ɸ" }, { symbol: "β" }, { symbol: "f" }, { symbol: "v" }, { symbol: "θ" }, { symbol: "ð" }, { symbol: "s" }, { symbol: "z" }, { symbol: "ʃ" }, { symbol: "ʒ" }, { symbol: "ʂ" }, { symbol: "ʐ" }, { symbol: "ç" }, { symbol: "ʝ" }, { symbol: "x" }, { symbol: "ɣ" }, { symbol: "χ" }, { symbol: "ʁ" }, { symbol: "ħ" }, { symbol: "ʕ" }, { symbol: "h" }, { symbol: "ɦ" }] },
  { row: "Lateral Fricative", symbols: [{ symbol: "ɬ" }, { symbol: "ɮ" }] },
  { row: "Approximant", symbols: [{ symbol: "ʋ" }, { symbol: "ɹ" }, { symbol: "ɻ" }, { symbol: "j" }, { symbol: "ɰ" }] },
  { row: "Lateral Approximant", symbols: [{ symbol: "l" }, { symbol: "ɭ" }, { symbol: "ʎ" }, { symbol: "ʟ" }] },
];

const NON_PULMONIC_CONSONANTS = {
  clicks: [
    { symbol: "ʘ", name: "Bilabial" },
    { symbol: "ǀ", name: "Dental" },
    { symbol: "ǃ", name: "(Post)alveolar" },
    { symbol: "ǂ", name: "Palatoalveolar" },
    { symbol: "ǁ", name: "Alveolar lateral" },
  ],
  implosives: [
    { symbol: "ɓ", name: "Bilabial" },
    { symbol: "ɗ", name: "Dental/alveolar" },
    { symbol: "ʄ", name: "Palatal" },
    { symbol: "ɠ", name: "Velar" },
    { symbol: "ʛ", name: "Uvular" },
  ],
  ejectives: [
    { symbol: "pʼ", name: "Bilabial" },
    { symbol: "tʼ", name: "Dental/alveolar" },
    { symbol: "kʼ", name: "Velar" },
    { symbol: "sʼ", name: "Alveolar fricative" },
  ],
};

const OTHER_SYMBOLS = [
  { symbol: "ʍ", name: "Voiceless labial-velar fricative" },
  { symbol: "w", name: "Voiced labial-velar approximant" },
  { symbol: "ɥ", name: "Voiced labial-palatal approximant" },
  { symbol: "ʜ", name: "Voiceless epiglottal fricative" },
  { symbol: "ʢ", name: "Voiced epiglottal fricative" },
  { symbol: "ʡ", name: "Epiglottal plosive" },
  { symbol: "ɕ", name: "Voiceless alveolo-palatal fricative" },
  { symbol: "ʑ", name: "Voiced alveolo-palatal fricative" },
  { symbol: "ɺ", name: "Alveolar lateral flap" },
  { symbol: "ɧ", name: "Simultaneous ʃ and x" },
];

const AFFRICATES = [
  { symbol: "t͡s", name: "Voiceless alveolar affricate" },
  { symbol: "t͡ʃ", name: "Voiceless palato-alveolar affricate" },
  { symbol: "t͡ɕ", name: "Voiceless alveolo-palatal affricate" },
  { symbol: "ʈ͡ʂ", name: "Voiceless retroflex affricate" },
  { symbol: "d͡z", name: "Voiced alveolar affricate" },
  { symbol: "d͡ʒ", name: "Voiced post-alveolar affricate" },
  { symbol: "d͡ʑ", name: "Voiced alveolo-palatal affricate" },
  { symbol: "ɖ͡ʐ", name: "Voiced retroflex affricate" },
];

const VOWEL_GROUPS = [
  { title: "Close", symbols: ["i", "y", "ɨ", "ʉ", "ɯ", "u"] },
  { title: "Near-close", symbols: ["ɪ", "ʏ", "ʊ"] },
  { title: "Close-mid", symbols: ["e", "ø", "ɘ", "ɵ", "ɤ", "o", "ə"] },
  { title: "Open-mid", symbols: ["ɛ", "œ", "ɜ", "ɞ", "ʌ", "ɔ"] },
  { title: "Near-open", symbols: ["æ", "ɐ"] },
  { title: "Open", symbols: ["a", "ɶ", "ɑ", "ɒ"] },
];

// Audio Mapping
const getAudioFileName = (symbol: string): string | undefined => {
  const audioMap: Record<string, string> = {
    "i": "Close Front Unrounded Vowel.ogg",
    "y": "Close Front Rounded Vowel.ogg",
    "ɨ": "Close Central Unrounded Vowel.ogg",
    "ʉ": "Close Central Rounded Vowel.ogg",
    "ɯ": "Close Back Unrounded Vowel.ogg",
    "u": "Close Back Rounded Vowel.ogg",
    "ɪ": "Near-close Front Unrounded Vowel.ogg",
    "ʏ": "Near-close Front Rounded Vowel.ogg",
    "ʊ": "Near-close Near-back Rounded Vowel.ogg",
    "e": "Close-mid Front Unrounded Vowel.ogg",
    "ø": "Close-mid Front Rounded Vowel.ogg",
    "ɘ": "Close-mid Central Unrounded Vowel.ogg",
    "ɵ": "Close-mid Central Rounded Vowel.ogg",
    "ɤ": "Close-mid Back Unrounded Vowel.ogg",
    "o": "Close-mid Back Rounded Vowel.ogg",
    "ə": "Mid Central Vowel.ogg",
    "ɛ": "Open-mid Front Unrounded Vowel.ogg",
    "œ": "Open-mid Front Rounded Vowel.ogg",
    "ɜ": "Open-mid Central Unrounded Vowel.ogg",
    "ɞ": "Open-mid Central Rounded Vowel.ogg",
    "ʌ": "Open-mid Back Unrounded Vowel.ogg",
    "ɔ": "Open-mid Back Rounded Vowel.ogg",
    "æ": "Near-open Front Unrounded Vowel.ogg",
    "ɐ": "Near-open Central Vowel.ogg",
    "a": "Open Front Unrounded Vowel.ogg",
    "ɶ": "Open Front Rounded Vowel.ogg",
    "ɑ": "Open Back Unrounded Vowel.ogg",
    "ɒ": "Open Back Rounded Vowel.ogg",
    "p": "Voiceless Bilabial Plosive.ogg",
    "b": "Voiced Bilabial Plosive.ogg",
    "t": "Voiceless Alveolar Plosive.ogg",
    "d": "Voiced Alveolar Plosive.ogg",
    "ʈ": "Voiceless Retroflex Plosive.ogg",
    "ɖ": "Voiced Retroflex Plosive.ogg",
    "c": "Voiceless Palatal Plosive.ogg",
    "ɟ": "Voiced Palatal Plosive.ogg",
    "k": "Voiceless Velar Plosive.ogg",
    "g": "Voiced Velar Plosive.ogg",
    "q": "Voiceless Uvular Plosive.ogg",
    "ɢ": "Voiced Uvular Plosive.ogg",
    "ʔ": "Glottal Plosive.ogg",
    "m": "Voiced Bilabial Nasal.ogg",
    "ɱ": "Voiced Labiodental Nasal.ogg",
    "n": "Voiced Alveolar Nasal.ogg",
    "ɳ": "Voiced Retroflex Nasal.ogg",
    "ɲ": "Voiced Palatal Nasal.ogg",
    "ŋ": "Voiced Velar Nasal.ogg",
    "ɴ": "Voiced Uvular Nasal.ogg",
    "ʙ": "Voiced Bilabial Trill.ogg",
    "r": "Voiced Alveolar Trill.ogg",
    "ʀ": "Voiced Uvular Trill.ogg",
    "ⱱ": "Voiced Labiodental Tap.ogg",
    "ɾ": "Voiced Alveolar Tap.ogg",
    "ɽ": "Voiced Retroflex Tap.ogg",
    "ɸ": "Voiceless Bilabial Fricative.ogg",
    "β": "Voiced Bilabial Fricative.ogg",
    "f": "Voiceless Labiodental Fricative.ogg",
    "v": "Voiced Labiodental Fricative.ogg",
    "θ": "Voiceless Dental Fricative.ogg",
    "ð": "Voiced Dental Fricative.ogg",
    "s": "Voiceless Alveolar Fricative.ogg",
    "z": "Voiced Alveolar Fricative.ogg",
    "ʃ": "Voiceless Postalveolar Fricative.ogg",
    "ʒ": "Voiced Postalveolar Fricative.ogg",
    "ʂ": "Voiceless Retroflex Fricative.ogg",
    "ʐ": "Voiced Retroflex Fricative.ogg",
    "ç": "Voiceless Palatal Fricative.ogg",
    "ʝ": "Voiced Palatal Fricative.ogg",
    "x": "Voiceless Velar Fricative.ogg",
    "ɣ": "Voiced Velar Fricative.ogg",
    "χ": "Voiceless Uvular Fricative.ogg",
    "ʁ": "Voiced Uvular Fricative.ogg",
    "ħ": "Voiceless Pharyngeal Fricative.ogg",
    "ʕ": "Voiced Pharyngeal Fricative.ogg",
    "h": "Voiceless Glottal Fricative.ogg",
    "ɦ": "Voiced Glottal Fricative.ogg",
    "ɬ": "Voiceless Alveolar Lateral Fricative.ogg",
    "ɮ": "Voiced Alveolar Lateral Fricative.ogg",
    "ʋ": "Voiced Labiodental Approximant.ogg",
    "ɹ": "Voiced Alveolar Approximant.ogg",
    "ɻ": "Voiced Retroflex Approximant.ogg",
    "j": "Voiced Palatal Approximant.ogg",
    "ɰ": "Voiced Velar Approximant.ogg",
    "l": "Voiced Alveolar Lateral Approximant.ogg",
    "ɭ": "Voiced Retroflex Lateral Approximant.ogg",
    "ʎ": "Voiced Palatal Lateral Approximant.ogg",
    "ʟ": "Voiced Velar Lateral Approximant.ogg",
    "ʘ": "Bilabial Click.ogg",
    "ǀ": "Dental Click.ogg",
    "ǃ": "(Post)alveolar Click.ogg",
    "ǂ": "Palatoalveolar Click.ogg",
    "ǁ": "Alveolar Lateral Click.ogg",
    "ɓ": "Voiced Bilabial Implosive.ogg",
    "ɗ": "Voiced Dental-Alveolar Implosive.ogg",
    "ʄ": "Voiced Palatal Implosive.ogg",
    "ɠ": "Voiced Velar Implosive.ogg",
    "ʛ": "Voiced Uvular Implosive.ogg",
    "pʼ": "Bilabial Ejective.ogg",
    "tʼ": "Dental-alveolar Ejective.ogg",
    "kʼ": "Velar Ejective.ogg",
    "sʼ": "Alveolar Fricative Ejective.ogg",
    "ʍ": "Voiceless Labial-velar Fricative.ogg",
    "w": "Voiced Labial-velar Fricative.ogg",
    "ɥ": "Voiced Labial-palatal Approximant.ogg",
    "ʜ": "Voiceless Epigottal Fricative.ogg",
    "ʢ": "Voiced Epigottal Fricative.ogg",
    "ʡ": "Epiglottal Plosive.ogg",
    "ɕ": "Voiceless Alveolo-palatal Fricative.ogg",
    "ʑ": "Voiced Alveolo-palatal Fricative.ogg",
    "ɺ": "Voiced Alveolar Tap.ogg",
    "ɧ": "Sj-sound.ogg",
  };
  return audioMap[symbol];
};

export default function IPAChart() {
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const playSound = (symbol: string, audioFile?: string) => {
    const fileName = audioFile || getAudioFileName(symbol);
    if (!fileName) return;
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    
    try {
      setPlayingSymbol(symbol);
      const audio = new Audio(`${SOUNDS_BASE_URL}/${fileName}`);
      currentAudioRef.current = audio;
      
      audio.onended = () => setPlayingSymbol(null);
      audio.onerror = () => {
        setPlayingSymbol(null);
        console.error(`Error loading audio for ${symbol}`);
      };
      
      audio.play().catch(err => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.error(`Playback failed for ${symbol}:`, err);
        }
        setPlayingSymbol(null);
      });
    } catch (error) {
      setPlayingSymbol(null);
      console.error(`Error initializing audio for ${symbol}:`, error);
    }
  };

  const SymbolButton = ({ symbol, name, audioFile }: IPASymbol) => {
    const isPlaying = playingSymbol === symbol;
    const fileName = audioFile || getAudioFileName(symbol);
    const hasAudio = !!fileName;
    
    return (
      <button
        onClick={() => playSound(symbol, fileName)}
        disabled={!hasAudio}
        className={`
          relative group
          w-14 h-14 flex flex-col items-center justify-center
          text-xl font-bold
          rounded-2xl transition-all duration-300
          ${hasAudio 
            ? `bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
               shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
               hover:shadow-[0_8px_20px_rgba(84,104,255,0.2)] dark:hover:shadow-[0_8px_20px_rgba(84,104,255,0.4)]
               hover:border-indigo-400 dark:hover:border-indigo-500
               hover:-translate-y-1 active:scale-95
               cursor-pointer
               ${isPlaying ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-800 dark:text-gray-100'}`
            : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }
        `}
        title={name || symbol}
      >
        <span className={`${isPlaying ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
          {symbol}
        </span>
        {isPlaying && (
          <span className="absolute -bottom-1 flex gap-0.5">
            <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        )}
      </button>
    );
  };

  const ConsonantSection = ({ title, groups }: { title: string, groups: typeof PULMONIC_CONSONANTS }) => (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.map((group) => (
          <div key={group.row} className="space-y-3">
            <h4 className="text-sm font-medium text-gray-400 dark:text-gray-500">{group.row}</h4>
            <div className="flex flex-wrap gap-3">
              {group.symbols.map((item) => (
                <SymbolButton key={item.symbol} symbol={item.symbol} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          IPA Sound Explorer
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg font-medium">
          Master the building blocks of English pronunciation. Click any symbol to hear the exact sound and improve your accent.
        </p>
      </div>

      <div className="space-y-16">
        <section className="relative overflow-hidden bg-white dark:bg-gray-800/50 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700/50">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl text-2xl shadow-inner">👄</div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vowels</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Clear, unobstructed sounds that form the core of every syllable.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
              {VOWEL_GROUPS.map((group) => (
                <div key={group.title} className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-500/80 dark:text-indigo-400/80 uppercase tracking-wider">{group.title}</h4>
                  <div className="flex flex-wrap gap-3">
                    {group.symbols.map((sym) => (
                      <SymbolButton key={sym} symbol={sym} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800/50 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl text-2xl shadow-inner">🗣️</div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Consonants</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sounds produced by restricting or blocking airflow in specific ways.</p>
            </div>
          </div>

          <div className="space-y-12">
            <ConsonantSection title="Pulmonic" groups={PULMONIC_CONSONANTS} />
            
            <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-8">Non-Pulmonic & Others</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-400 dark:text-gray-500">Clicks</h4>
                  <div className="flex flex-wrap gap-3">
                    {NON_PULMONIC_CONSONANTS.clicks.map(c => <SymbolButton key={c.symbol} {...c} />)}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-400 dark:text-gray-500">Implosives</h4>
                  <div className="flex flex-wrap gap-3">
                    {NON_PULMONIC_CONSONANTS.implosives.map(c => <SymbolButton key={c.symbol} {...c} />)}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-400 dark:text-gray-500">Ejectives</h4>
                  <div className="flex flex-wrap gap-3">
                    {NON_PULMONIC_CONSONANTS.ejectives.map(c => <SymbolButton key={c.symbol} {...c} />)}
                  </div>
                </div>
                <div className="col-span-full space-y-4 pt-6 border-t border-gray-50 dark:border-gray-800">
                  <h4 className="text-sm font-medium text-gray-400 dark:text-gray-500">Other Symbols & Affricates</h4>
                  <div className="flex flex-wrap gap-3">
                    {[...OTHER_SYMBOLS, ...AFFRICATES].map(c => <SymbolButton key={c.symbol} {...c} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
