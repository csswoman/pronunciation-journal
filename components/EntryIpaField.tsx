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
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        IPA
      </label>
      <div className="flex items-center gap-2">
        {ipa && apiSetFields.ipa ? (
          <p className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 font-mono text-lg">
            {ipa}
          </p>
        ) : (
          <input
            type="text"
            id="ipa"
            value={ipa}
            onChange={(e) => setIpa(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-accent focus:border-accent font-mono text-lg"
            placeholder="/prəˌnʌnsiˈeɪʃən/"
          />
        )}
        {audioUrl && (
          <Button
            type="button"
            onClick={() => playAudio(audioUrl, { showAlerts: false })}
            className="p-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors flex-shrink-0"
            title="Play pronunciation"
            aria-label="Play pronunciation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
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
