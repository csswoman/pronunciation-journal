"use client";

import Button from "@/components/ui/Button";
import { playAudio } from "@/lib/audio-utils";

interface EntryIpaFieldProps {
  ipa: string;
  setIpa: (value: string) => void;
  audioUrl: string;
  apiSetFields: {
    ipa: boolean;
    audioUrl: boolean;
    meanings: boolean;
  };
}

export default function EntryIpaField({
  ipa,
  setIpa,
  audioUrl,
  apiSetFields,
}: EntryIpaFieldProps) {
  return (
    <div>
      <label
        htmlFor="ipa"
        className="block text-sm font-medium text-fg-muted mb-1"
      >
        IPA
      </label>
      <div className="flex items-center gap-2">
        {ipa && apiSetFields.ipa ? (
          <p className="flex-1 px-3 py-2 bg-surface-sunken border border-border-default rounded-md text-fg font-mono text-lg">
            {ipa}
          </p>
        ) : (
          <input
            type="text"
            id="ipa"
            value={ipa}
            onChange={(e) => setIpa(e.target.value)}
            className="flex-1 px-3 py-2 border border-border-default rounded-md shadow-sm bg-surface-sunken text-fg focus:ring-accent focus:border-accent font-mono text-lg"
            placeholder="/prəˌnʌnsiˈeɪʃən/"
          />
        )}
        {audioUrl && (
          <Button
            type="button"
            onClick={() => playAudio(audioUrl, { showAlerts: false })}
            className="p-2 bg-info-soft hover:bg-info-soft rounded-full transition-colors flex-shrink-0"
            title="Play pronunciation"
            aria-label="Play pronunciation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-info"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}
