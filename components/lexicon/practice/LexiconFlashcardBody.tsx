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
    <span className="font-ipa text-xl sm:text-2xl text-stone-900 font-normal leading-tight">
      {parts.map((part, i) => {
        if (part.startsWith('ˈ')) {
          return (
            <span
              key={i}
              className="font-bold underline underline-offset-4 decoration-stone-900"
              title="Sílaba con acento primario"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
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
      className="w-full cursor-pointer rounded-3xl p-7 sm:p-9 shadow-sm border border-stone-900/10 min-h-[340px] sm:min-h-[380px] flex flex-col justify-between text-left focus-ring select-none transition-all duration-150"
      style={{ backgroundColor: pastelBg }}
    >
      {!revealed ? (
        /* Front State */
        <div className="flex flex-col justify-between h-full gap-8 my-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-stone-900 tracking-tight leading-tight">
                {word}
              </h2>
              {ipa && renderIpaFormatted(ipa)}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {partOfSpeech && (
                <span className="rounded-full bg-white/80 border border-stone-900/10 text-stone-900 text-xs font-semibold px-3 py-1">
                  {partOfSpeech}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => onPlayAudio(e)}
                aria-label={`Escuchar ${word}`}
                className="h-10 w-10 rounded-full bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center shadow-2xs transition-transform hover:scale-105 active:scale-95 shrink-0"
              >
                🔊
              </button>
            </div>
          </div>

          <div className="border-t border-stone-900/15 pt-5">
            <p className="text-body-sm text-stone-800/80 font-medium">
              ¿Sabes qué significa? Piénsalo y luego dale la vuelta.
            </p>
          </div>
        </div>
      ) : (
        /* Back State */
        <div className="flex flex-col justify-between h-full gap-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-stone-900/15 pb-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-tight">
                  {word}
                </h2>
                {ipa && renderIpaFormatted(ipa)}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {partOfSpeech && (
                  <span className="rounded-full bg-white/80 border border-stone-900/10 text-stone-900 text-xs font-semibold px-3 py-1">
                    {partOfSpeech}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => onPlayAudio(e)}
                  aria-label={`Escuchar ${word}`}
                  className="h-10 w-10 rounded-full bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center shadow-2xs transition-transform hover:scale-105 active:scale-95 shrink-0"
                >
                  🔊
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <p className="font-semibold text-stone-900 text-body-lg sm:text-xl leading-relaxed">
                {definition}
              </p>
              {translation && (
                <p className="text-body-sm text-stone-800/90 font-bold">
                  ES · {translation}
                </p>
              )}
            </div>

            {example && (
              <div className="rounded-2xl bg-white/70 border border-stone-900/10 p-4 text-body-sm text-stone-900 leading-relaxed shadow-2xs mt-2">
                <span className="font-kicker text-[11px] font-bold uppercase tracking-wider text-stone-600 mr-2 select-none">
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
