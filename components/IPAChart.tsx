"use client";

import { useState } from "react";

const SOUNDS_BASE_URL = "/sounds";

interface IPASymbol {
  symbol: string;
  name?: string;
  audioFile?: string;
}

// Mapeo de símbolos IPA a nombres de archivo
const getAudioFileName = (symbol: string, type?: string): string | undefined => {
  const audioMap: Record<string, string> = {
    // Vowels
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
    
    // Pulmonic Consonants - Plosives
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
    
    // Nasals
    "m": "Voiced Bilabial Nasal.ogg",
    "ɱ": "Voiced Labiodental Nasal.ogg",
    "n": "Voiced Alveolar Nasal.ogg",
    "ɳ": "Voiced Retroflex Nasal.ogg",
    "ɲ": "Voiced Palatal Nasal.ogg",
    "ŋ": "Voiced Velar Nasal.ogg",
    "ɴ": "Voiced Uvular Nasal.ogg",
    
    // Trills
    "ʙ": "Voiced Bilabial Trill.ogg",
    "r": "Voiced Alveolar Trill.ogg",
    "ʀ": "Voiced Uvular Trill.ogg",
    
    // Taps/Flaps
    "ⱱ": "Voiced Labiodental Tap.ogg",
    "ɾ": "Voiced Alveolar Tap.ogg",
    "ɽ": "Voiced Retroflex Tap.ogg",
    
    // Fricatives
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
    
    // Lateral Fricatives
    "ɬ": "Voiceless Alveolar Lateral Fricative.ogg",
    "ɮ": "Voiced Alveolar Lateral Fricative.ogg",
    
    // Approximants
    "ʋ": "Voiced Labiodental Approximant.ogg",
    "ɹ": "Voiced Alveolar Approximant.ogg",
    "ɻ": "Voiced Retroflex Approximant.ogg",
    "j": "Voiced Palatal Approximant.ogg",
    "ɰ": "Voiced Velar Approximant.ogg",
    
    // Lateral Approximants
    "l": "Voiced Alveolar Lateral Approximant.ogg",
    "ɭ": "Voiced Retroflex Lateral Approximant.ogg",
    "ʎ": "Voiced Palatal Lateral Approximant.ogg",
    "ʟ": "Voiced Velar Lateral Approximant.ogg",
    
    // Non-pulmonic - Clicks
    "ʘ": "Bilabial Click.ogg",
    "ǀ": "Dental Click.ogg",
    "ǃ": "(Post)alveolar Click.ogg",
    "ǂ": "Palatoalveolar Click.ogg",
    "ǁ": "Alveolar Lateral Click.ogg",
    
    // Implosives
    "ɓ": "Voiced Bilabial Implosive.ogg",
    "ɗ": "Voiced Dental-Alveolar Implosive.ogg",
    "ʄ": "Voiced Palatal Implosive.ogg",
    "ɠ": "Voiced Velar Implosive.ogg",
    "ʛ": "Voiced Uvular Implosive.ogg",
    
    // Ejectives
    "pʼ": "Bilabial Ejective.ogg",
    "tʼ": "Dental-alveolar Ejective.ogg",
    "kʼ": "Velar Ejective.ogg",
    "sʼ": "Alveolar Fricative Ejective.ogg",
    
    // Other Symbols
    "ʍ": "Voiceless Labial-velar Fricative.ogg",
    "w": "Voiced Labial-velar Fricative.ogg",
    "ɥ": "Voiced Labial-palatal Approximant.ogg",
    "ʜ": "Voiceless Epigottal Fricative.ogg",
    "ʢ": "Voiced Epigottal Fricative.ogg",
    "ʡ": "Epiglottal Plosive.ogg",
    "ɕ": "Voiceless Alveolo-palatal Fricative.ogg",
    "ʑ": "Voiced Alveolo-palatal Fricative.ogg",
    "ɺ": "Voiced Alveolar Tap.ogg", // Alveolar lateral flap - usando tap como aproximación
    "ɧ": "Sj-sound.ogg",
  };
  
  return audioMap[symbol];
};

export default function IPAChart() {
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);

  const playSound = async (symbol: string, audioFile?: string) => {
    const fileName = audioFile || getAudioFileName(symbol);
    if (!fileName) return;
    
    try {
      setPlayingSymbol(symbol);
      const audio = new Audio(`${SOUNDS_BASE_URL}/${fileName}`);
      
      // Manejar cuando el audio termina de reproducirse
      audio.onended = () => {
        setPlayingSymbol(null);
      };
      
      // Manejar errores de carga del audio
      audio.onerror = (e) => {
        setPlayingSymbol(null);
        console.error(`Error loading audio for ${symbol} (${fileName}):`, e);
      };
      
      // Intentar reproducir el audio
      try {
        await audio.play();
      } catch (playError) {
        setPlayingSymbol(null);
        console.error(`Error playing sound for ${symbol}:`, playError);
      }
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
          w-12 h-12 flex items-center justify-center
          text-lg font-semibold
          rounded-lg transition-all duration-200
          ${hasAudio 
            ? `bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 
               hover:border-[#5468FF] hover:bg-[#5468FF] hover:text-white 
               dark:hover:border-[#5468FF] dark:hover:bg-[#5468FF] dark:hover:text-white
               cursor-pointer active:scale-95
               ${isPlaying ? 'bg-[#5468FF] text-white border-[#5468FF] animate-pulse' : ''}`
            : 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
          }
        `}
        title={name || symbol}
      >
        {symbol}
      </button>
    );
  };

  // Vowels
  const vowels = [
    { row: "Close", symbols: [
      { symbol: "i" },
      { symbol: "y" },
      { symbol: "ɨ" },
      { symbol: "ʉ" },
      { symbol: "ɯ" },
      { symbol: "u" },
    ]},
    { row: "Close-mid", symbols: [
      { symbol: "ɪ" },
      { symbol: "ʏ" },
      { symbol: "ʊ" },
      { symbol: "e" },
      { symbol: "ø" },
      { symbol: "ɘ" },
      { symbol: "ɵ" },
      { symbol: "ɤ" },
      { symbol: "o" },
      { symbol: "ə" },
    ]},
    { row: "Open-mid", symbols: [
      { symbol: "ɛ" },
      { symbol: "œ" },
      { symbol: "ɜ" },
      { symbol: "ɞ" },
      { symbol: "ʌ" },
      { symbol: "ɔ" },
    ]},
    { row: "Open", symbols: [
      { symbol: "æ" },
      { symbol: "ɐ" },
      { symbol: "a" },
      { symbol: "ɶ" },
      { symbol: "ɑ" },
      { symbol: "ɒ" },
    ]},
  ];

  // Pulmonic Consonants
  const pulmonicConsonants = [
    { row: "Plosive", symbols: [
      { symbol: "p" },
      { symbol: "b" },
      { symbol: "t" },
      { symbol: "d" },
      { symbol: "ʈ" },
      { symbol: "ɖ" },
      { symbol: "c" },
      { symbol: "ɟ" },
      { symbol: "k" },
      { symbol: "g" },
      { symbol: "q" },
      { symbol: "ɢ" },
      { symbol: "ʔ" },
    ]},
    { row: "Nasal", symbols: [
      { symbol: "m" },
      { symbol: "ɱ" },
      { symbol: "n" },
      { symbol: "ɳ" },
      { symbol: "ɲ" },
      { symbol: "ŋ" },
      { symbol: "ɴ" },
    ]},
    { row: "Trill", symbols: [
      { symbol: "ʙ" },
      { symbol: "r" },
      { symbol: "ʀ" },
    ]},
    { row: "Tap or Flap", symbols: [
      { symbol: "ⱱ" },
      { symbol: "ɾ" },
      { symbol: "ɽ" },
    ]},
    { row: "Fricative", symbols: [
      { symbol: "ɸ" },
      { symbol: "β" },
      { symbol: "f" },
      { symbol: "v" },
      { symbol: "θ" },
      { symbol: "ð" },
      { symbol: "s" },
      { symbol: "z" },
      { symbol: "ʃ" },
      { symbol: "ʒ" },
      { symbol: "ʂ" },
      { symbol: "ʐ" },
      { symbol: "ç" },
      { symbol: "ʝ" },
      { symbol: "x" },
      { symbol: "ɣ" },
      { symbol: "χ" },
      { symbol: "ʁ" },
      { symbol: "ħ" },
      { symbol: "ʕ" },
      { symbol: "h" },
      { symbol: "ɦ" },
    ]},
    { row: "Lateral Fricative", symbols: [
      { symbol: "ɬ" },
      { symbol: "ɮ" },
    ]},
    { row: "Approximant", symbols: [
      { symbol: "ʋ" },
      { symbol: "ɹ" },
      { symbol: "ɻ" },
      { symbol: "j" },
      { symbol: "ɰ" },
    ]},
    { row: "Lateral Approximant", symbols: [
      { symbol: "l" },
      { symbol: "ɭ" },
      { symbol: "ʎ" },
      { symbol: "ʟ" },
    ]},
  ];

  // Non-pulmonic Consonants
  const nonPulmonicConsonants = {
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

  // Other Symbols
  const otherSymbols = [
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

  // Affricates - Nota: estos pueden no tener archivos individuales, usar combinaciones
  const affricates = [
    { symbol: "t͡s", name: "Voiceless alveolar affricate" },
    { symbol: "t͡ʃ", name: "Voiceless palato-alveolar affricate" },
    { symbol: "t͡ɕ", name: "Voiceless alveolo-palatal affricate" },
    { symbol: "ʈ͡ʂ", name: "Voiceless retroflex affricate" },
    { symbol: "d͡z", name: "Voiced alveolar affricate" },
    { symbol: "d͡ʒ", name: "Voiced post-alveolar affricate" },
    { symbol: "d͡ʑ", name: "Voiced alveolo-palatal affricate" },
    { symbol: "ɖ͡ʐ", name: "Voiced retroflex affricate" },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Interactive IPA Chart
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Haz clic en cualquier símbolo para escuchar su sonido. El Alfabeto Fonético Internacional (IPA) 
          es un conjunto de símbolos que los lingüistas usan para describir los sonidos de las lenguas habladas.
        </p>
      </div>

      {/* Vowels */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Vocales</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Cuando los símbolos aparecen en pares, el de la derecha representa una vocal redondeada.
        </p>
        <div className="space-y-4">
          {vowels.map((vowelRow) => (
            <div key={vowelRow.row} className="flex items-center gap-2">
              <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                {vowelRow.row}
              </div>
              <div className="flex flex-wrap gap-2">
                {vowelRow.symbols.map((item) => (
                  <SymbolButton
                    key={item.symbol}
                    symbol={item.symbol}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pulmonic Consonants */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Consonantes Pulmonares
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Cuando los símbolos aparecen en pares, el de la derecha representa una consonante sonora.
        </p>
        <div className="space-y-4">
          {pulmonicConsonants.map((consonantRow) => (
            <div key={consonantRow.row} className="flex items-center gap-2">
              <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                {consonantRow.row}
              </div>
              <div className="flex flex-wrap gap-2">
                {consonantRow.symbols.map((item) => (
                  <SymbolButton
                    key={item.symbol}
                    symbol={item.symbol}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Non-pulmonic Consonants */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Consonantes No Pulmonares
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Clicks</h3>
            <div className="flex flex-wrap gap-2">
              {nonPulmonicConsonants.clicks.map((item) => (
                <div key={item.symbol} className="flex flex-col items-center">
                  <SymbolButton
                    symbol={item.symbol}
                    name={item.name}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
              Implosivas Sonoras
            </h3>
            <div className="flex flex-wrap gap-2">
              {nonPulmonicConsonants.implosives.map((item) => (
                <div key={item.symbol} className="flex flex-col items-center">
                  <SymbolButton
                    symbol={item.symbol}
                    name={item.name}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Eyectivas</h3>
            <div className="flex flex-wrap gap-2">
              {nonPulmonicConsonants.ejectives.map((item) => (
                <div key={item.symbol} className="flex flex-col items-center">
                  <SymbolButton
                    symbol={item.symbol}
                    name={item.name}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Other Symbols */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Otros Símbolos
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherSymbols.map((item) => (
            <div key={item.symbol} className="flex flex-col items-center">
              <SymbolButton
                symbol={item.symbol}
                name={item.name}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center max-w-[100px]">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Affricates */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Africadas
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Nota: Las africadas pueden no tener archivos de audio individuales disponibles.
        </p>
        <div className="flex flex-wrap gap-2">
          {affricates.map((item) => (
            <div key={item.symbol} className="flex flex-col items-center">
              <SymbolButton
                symbol={item.symbol}
                name={item.name}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center max-w-[120px]">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
