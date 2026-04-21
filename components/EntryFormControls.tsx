"use client";

import Button from "@/components/ui/Button";

interface EntryFormControlsProps {
  showDetails: boolean;
  setShowDetails: (value: boolean) => void;
}

export default function EntryFormControls({
  showDetails,
  setShowDetails,
}: EntryFormControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
      >
        {showDetails ? "Hide details" : "Add details"}
      </Button>
      <div className="relative group">
        <Button
          type="button"
          className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none transition-colors flex items-center justify-center"
          aria-label="Help"
        >
          ?
        </Button>
        <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
          Aquí se puede añadir notas de tus palabras
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
