"use client";

import EntryDetails from "@/components/EntryDetails";
import EntryFeedback from "@/components/EntryFeedback";
import EntryFormActions from "@/components/EntryFormActions";
import EntryFormControls from "@/components/EntryFormControls";
import EntryIpaField from "@/components/EntryIpaField";
import EntryWordField from "@/components/EntryWordField";
import { useEntryForm } from "@/hooks/useEntryForm";
import { Entry } from "@/lib/types";

interface EntryFormProps {
  onSave?: (entry: Entry) => void;
  onCancel?: () => void;
}

export default function EntryForm({ onSave, onCancel }: EntryFormProps) {
  const {
    word,
    setWord,
    ipa,
    setIpa,
    audioUrl,
    setAudioUrl,
    notes,
    setNotes,
    difficulty,
    setDifficulty,
    tags,
    setTags,
    sourceUrl,
    error,
    success,
    isLoading,
    showDetails,
    setShowDetails,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    wordInputRef,
    apiSetFields,
    handleFetchPronunciation,
    handleSuggestionClick,
    handleSubmit,
  } = useEntryForm({ onSave });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <EntryWordField
          word={word}
          setWord={setWord}
          isLoading={isLoading}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          handleSuggestionClick={handleSuggestionClick}
          handleFetchPronunciation={handleFetchPronunciation}
          wordInputRef={wordInputRef}
        />

        <EntryIpaField
          ipa={ipa}
          setIpa={setIpa}
          audioUrl={audioUrl}
          apiSetFields={apiSetFields}
        />
      </div>

      <EntryFeedback error={error} success={success} sourceUrl={sourceUrl} />

      <EntryFormControls
        showDetails={showDetails}
        setShowDetails={setShowDetails}
      />

      <EntryDetails
        showDetails={showDetails}
        audioUrl={audioUrl}
        setAudioUrl={setAudioUrl}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        notes={notes}
        setNotes={setNotes}
        tags={tags}
        setTags={setTags}
      />

      <EntryFormActions onCancel={onCancel} />
    </form>
  );
}
