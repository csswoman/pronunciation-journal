"use client";

/*
 * Planned subcomponents:
 * - CoursePathYaPuedesDecirEsto (inline achievement block for real-world phrases)
 *   - HeaderSection (title "Ya puedes decir esto" + kicker + subtitle)
 *   - SituationFilterChips (interactive category chips: café, trabajo, compras)
 *   - PhraseCardList (list of phrase cards)
 *     - PhraseCardItem (English bold title + Spanish subtitle + Audio TTS button)
 *   - FooterAction (expand / view all phrases link)
 */

import { useState } from "react";
import { MessageCircle, Volume2 } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { RealLifeScenario } from "@/lib/courses/types";

const TRANSLATION_MAP: Record<string, string> = {
  "A table for two, please.": "Una mesa para dos, por favor.",
  "Can I see the menu?": "¿Puedo ver el menú?",
  "I'd like the chicken, please.": "Me gustaría el pollo, por favor.",
  "Can we get the bill?": "¿Nos trae la cuenta, por favor?",
  "Nice to meet you, I'm [name].": "Mucho gusto, soy [nombre].",
  "What do you do?": "¿A qué te dedicas?",
  "I'm a [job]. And you?": "Soy [profesión]. ¿Y tú?",
  "Where are you from?": "¿De dónde eres?",
  "I usually wake up at seven.": "Normalmente me despierto a las siete.",
  "I have breakfast at home.": "Desayuno en casa.",
  "I go to work by bus.": "Voy al trabajo en autobús.",
  "I go to bed early.": "Me voy a la cama temprano.",
  "How much does this cost?": "¿Cuánto cuesta esto?",
  "Do you have this in another size?": "¿Tiene esto en otra talla?",
  "I'll take it.": "Me lo llevo.",
  "Can I pay by card?": "¿Puedo pagar con tarjeta?",
  "What time do you open?": "¿A qué hora abren?",
  "Can I have a coffee, please?": "¿Me da un café, por favor?",
  "Do you take card?": "¿Aceptan tarjeta?",
};

function playTts(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[.*?\]/g, "Alex");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Web Speech fallback silent
  }
}

interface CoursePathYaPuedesDecirEstoProps {
  scenarios: RealLifeScenario[];
  isUnlocked?: boolean;
}

export default function CoursePathYaPuedesDecirEsto({
  scenarios,
  isUnlocked = true,
}: CoursePathYaPuedesDecirEstoProps) {
  const [selectedId, setSelectedId] = useState<string>(scenarios[0]?.id ?? "");
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);

  if (!scenarios || scenarios.length === 0) return null;

  const currentScenario = scenarios.find((s) => s.id === selectedId) ?? scenarios[0];

  const handlePlayAudio = (phrase: string) => {
    setPlayingPhrase(phrase);
    playTts(phrase);
    setTimeout(() => setPlayingPhrase(null), 1800);
  };

  return (
    <section
      className={cn(
        "course-path__ya-puedes",
        !isUnlocked && "course-path__ya-puedes--locked"
      )}
      aria-label="Frases prácticas: Ya puedes decir esto"
    >
      <header className="course-path__ya-puedes-head">
        <div className="course-path__ya-puedes-title-row">
          <div className="course-path__ya-puedes-icon-badge" aria-hidden>
            <MessageCircle size={18} />
          </div>
          <div>
            <h3 className="course-path__ya-puedes-title">Ya puedes decir esto</h3>
            <p className="course-path__ya-puedes-sub">
              {isUnlocked
                ? "Frases reales con lo que aprendiste en este módulo."
                : "Vista previa de lo que podrás decir al completar este módulo."}
            </p>
          </div>
        </div>

        <nav className="course-path__ya-puedes-chips" aria-label="Filtrar situación">
          {scenarios.map((scenario) => {
            const isSelected = scenario.id === currentScenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                className={cn(
                  "course-path__ya-puedes-chip",
                  isSelected && "course-path__ya-puedes-chip--active"
                )}
                onClick={() => setSelectedId(scenario.id)}
              >
                {scenario.title}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="course-path__ya-puedes-list">
        {currentScenario.phrases.map((phrase) => {
          const translation = TRANSLATION_MAP[phrase] ?? "Frase práctica de este nivel.";
          const isPlaying = playingPhrase === phrase;

          return (
            <div key={phrase} className="course-path__ya-puedes-card">
              <div className="course-path__ya-puedes-card-main">
                <span className="course-path__ya-puedes-en">{phrase}</span>
                <span className="course-path__ya-puedes-es">{translation}</span>
              </div>
              <button
                type="button"
                className={cn(
                  "course-path__ya-puedes-audio-btn",
                  isPlaying && "course-path__ya-puedes-audio-btn--playing"
                )}
                onClick={() => handlePlayAudio(phrase)}
                title={`Escuchar cómo suena "${phrase}"`}
                aria-label={`Escuchar pronunciación de ${phrase}`}
              >
                <Volume2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <footer className="course-path__ya-puedes-foot">
        <span className="course-path__ya-puedes-foot-link">
          {currentScenario.phrases.length} frases listas para practicar en este módulo
        </span>
      </footer>
    </section>
  );
}
