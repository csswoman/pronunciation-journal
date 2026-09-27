// Planned structure:
// <LexiconFlashcardBody>
//   <div (Pastel Card Container)>
//     {!revealed ? <CardFront /> : <CardBack />}
//   </div>
// </LexiconFlashcardBody>

interface LexiconFlashcardBodyProps {
  categoryId?: string;
  word: string;
  ipa?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string | null;
  translation?: string;
  revealed: boolean;
  onReveal: () => void;
  onPlayAudio: (e?: React.MouseEvent) => void;
}

const CATEGORY_PASTEL_VARS: Record<string, string> = {
  "artificial-intelligence": "var(--sky)",
  "backend-infra": "var(--lilac)",
  "data-science": "var(--butter)",
  "frontend-dev": "var(--mint)",
  "ux-design": "var(--coral)",
  "design-systems": "var(--lilac)",
  "personal-interview": "var(--butter)",
  professional: "var(--sky)",
  "technical-writing": "var(--mint)",
};

function renderIpaFormatted(ipaStr: string) {
  const formatted = ipaStr.startsWith('/') ? ipaStr : `/${ipaStr}/`;
  const parts = formatted.split(/(ˈ[^\s/.,]+)/g);

  return (
    <span className="font-ipa text-2xl sm:text-3xl !text-stone-900 font-medium leading-tight">
      {parts.map((part, i) => {
        if (part.startsWith('ˈ')) {
          return (
            <span
              key={i}
              className="font-bold underline underline-offset-4 !decoration-stone-900 !text-stone-900"
              title="Sílaba con acento primario"
            >
              {part}
            </span>
          );
        }
        return <span key={i} className="!text-stone-900">{part}</span>;
      })}
    </span>
  );
}

function renderExampleWithBold(exampleText: string, targetWord: string) {
  const regex = new RegExp(`(${targetWord})`, 'gi');
  const parts = exampleText.split(regex);

  return parts.map((part, idx) =>
    part.toLowerCase() === targetWord.toLowerCase() ? (
      <strong key={idx} className="font-bold text-stone-900">{part}</strong>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

export function LexiconFlashcardBody({
  categoryId = "backend-infra",
  word,
  ipa,
  partOfSpeech,
  definition,
  example,
  translation,
  revealed,
  onReveal,
  onPlayAudio,
}: LexiconFlashcardBodyProps) {
  const pastelBg = CATEGORY_PASTEL_VARS[categoryId] ?? "var(--lilac)";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !revealed && onReveal()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !revealed) {
          e.preventDefault();
          onReveal();
        }
      }}
      className="w-full cursor-pointer rounded-3xl p-8 sm:p-12 shadow-sm border border-stone-900/10 min-h-[400px] sm:min-h-[460px] flex flex-col justify-between text-left focus-ring select-none transition-all duration-150"
      style={{ backgroundColor: pastelBg, color: "#1c1917" }}
    >
      {!revealed ? (
        /* Front State */
        <div className="flex flex-col justify-between h-full gap-8 my-auto">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl !text-stone-900 tracking-tight leading-tight">
                {word}
              </h2>
              {ipa && renderIpaFormatted(ipa)}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {partOfSpeech && (
                <span className="rounded-full bg-white/85 border border-stone-900/15 !text-stone-900 text-xs sm:text-body-sm font-bold px-3.5 py-1">
                  {partOfSpeech}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => onPlayAudio(e)}
                aria-label={`Escuchar ${word}`}
                className="h-11 w-11 rounded-full bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0"
              >
                🔊
              </button>
            </div>
          </div>

          <div className="border-t border-stone-900/15 pt-6">
            <p className="text-body-sm sm:text-body !text-stone-800/80 font-medium">
              ¿Sabes qué significa? Piénsalo y luego dale la vuelta.
            </p>
          </div>
        </div>
      ) : (
        /* Back State */
        <div className="flex flex-col justify-between h-full gap-6">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6 border-b border-stone-900/15 pb-5">
              <div className="flex flex-col gap-2">
                <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl !text-stone-900 tracking-tight">
                  {word}
                </h2>
                {ipa && renderIpaFormatted(ipa)}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {partOfSpeech && (
                  <span className="rounded-full bg-white/85 border border-stone-900/15 !text-stone-900 text-xs sm:text-body-sm font-bold px-3.5 py-1">
                    {partOfSpeech}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => onPlayAudio(e)}
                  aria-label={`Escuchar ${word}`}
                  className="h-11 w-11 rounded-full bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0"
                >
                  🔊
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="font-semibold !text-stone-900 text-xl sm:text-2xl md:text-3xl leading-relaxed">
                {definition}
              </p>
              {translation && (
                <p className="text-body-sm sm:text-body !text-stone-800/90 font-bold">
                  ES · {translation}
                </p>
              )}
            </div>

            {example && (
              <div className="rounded-2xl bg-white/75 border border-stone-900/15 p-5 text-body-md sm:text-lg !text-stone-900 leading-relaxed shadow-2xs mt-4">
                <span className="font-kicker text-xs font-bold uppercase tracking-wider text-stone-700 mr-2 select-none">
                  EJEMPLO
                </span>
                <span>{renderExampleWithBold(example, word)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
