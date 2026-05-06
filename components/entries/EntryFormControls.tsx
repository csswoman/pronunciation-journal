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
        className="px-4 py-2 text-fg-muted bg-surface-sunken rounded-md hover:bg-border-subtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border-default transition-colors"
      >
        {showDetails ? "Hide details" : "Add details"}
      </Button>
      <div className="relative group">
        <Button
          type="button"
          className="w-6 h-6 rounded-full bg-border-default text-fg-muted text-xs font-bold hover:bg-border-strong focus:outline-none transition-colors flex items-center justify-center"
          aria-label="Help"
        >
          ?
        </Button>
        <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-800 dark:bg-gray-900 text-on-primary text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
          Aquí se puede añadir notas de tus palabras
          <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 dark:border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
