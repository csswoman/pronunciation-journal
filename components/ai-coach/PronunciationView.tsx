"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";
import { analyzePhonemes, ARPABET_TO_IPA } from "@/lib/phonemes";
import { saveAIWord } from "@/lib/ai-db";
import PronunciationProgress from "./pronunciation/PronunciationProgress";
import PhraseCard from "./pronunciation/PhraseCard";
import RecordingControls from "./pronunciation/RecordingControls";
import CoachPanel from "./pronunciation/CoachPanel";
import type { WordIPA, SoundProgress } from "./pronunciation/types";
import SessionComplete from "./pronunciation/SessionComplete";
import { BATCH_SIZE, PHONEME_TIPS, fetchWordIPA, initQueue, loadMastered, loadSeen, pickBatch, saveMastered, saveQueue, saveSeen, shuffle, speakPhrase } from "@/lib/ai-coach/pronunciation";

function firstBadPhoneme(wordIPAs: WordIPA[]) { for (const entry of wordIPAs) { if (!entry.alignment) continue; for (const a of entry.alignment) { if (a.status !== "correct" && a.phoneme) return { word: entry.word, phoneme: a.phoneme, ipa: a.ipa ?? ARPABET_TO_IPA[a.phoneme] ?? a.phoneme }; } } return null; }

export default function PronunciationView() {
  const [queue, setQueue] = useState<string[]>([]); const [mastered, setMastered] = useState<Set<string>>(new Set()); const [seen, setSeen] = useState<Set<string>>(new Set()); const [batchCount, setBatchCount] = useState(0); const [fetchingPhrases, setFetchingPhrases] = useState(false);
  const { startRecording, stopRecording, audioUrl, isRecording, resetRecording } = useRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [wordIPAs, setWordIPAs] = useState<WordIPA[]>([]); const [ipaLoading, setIpaLoading] = useState(false); const [analyzing, setAnalyzing] = useState(false); const [soundProgress, setSoundProgress] = useState<SoundProgress>({}); const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  useEffect(() => { const q = initQueue(); setQueue(q); setMastered(loadMastered()); setSeen(loadSeen()); setBatchCount(q.length); }, []);
  const activePhrase = queue[0] ?? ""; const sessionDone = queue.length === 0;

  const loadMoreFromPool = useCallback((currentSeen: Set<string>, currentMastered: Set<string>) => { const exclude = new Set([...currentSeen, ...currentMastered]); const batch = pickBatch(exclude); const fallback = batch.length === 0 ? pickBatch(currentMastered) : batch; setQueue(fallback); saveQueue(fallback); setBatchCount(fallback.length); resetRecording(); setWordIPAs([]); }, [resetRecording]);
  const fetchMoreWithAI = useCallback(async (currentSeen: Set<string>) => { setFetchingPhrases(true); try { const res = await fetch("/api/gemini/phrases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exclude: [...currentSeen].slice(-30), count: BATCH_SIZE }) }); if (!res.ok) { loadMoreFromPool(currentSeen, mastered); return; } const { phrases } = await res.json() as { phrases?: string[] }; if (!Array.isArray(phrases) || phrases.length === 0) { loadMoreFromPool(currentSeen, mastered); return; } const batch = shuffle(phrases).slice(0, BATCH_SIZE); setQueue(batch); saveQueue(batch); setBatchCount(batch.length); resetRecording(); setWordIPAs([]); } catch { loadMoreFromPool(currentSeen, mastered); } finally { setFetchingPhrases(false); } }, [mastered, loadMoreFromPool, resetRecording]);

  useEffect(() => { if (!activePhrase) return; setWordIPAs([]); setIpaLoading(true); const words = activePhrase.split(/\s+/).filter(Boolean); const clean = (w: string) => w.replace(/[^a-zA-Z']/g, "").toLowerCase(); Promise.all(words.map((w) => fetchWordIPA(clean(w)))).then((ipas) => { setWordIPAs(words.map((w, i) => ({ word: w, ipa: ipas[i], alignment: null }))); setIpaLoading(false); }); }, [activePhrase]);

  const analyzeRecording = useCallback(async (url: string) => { setAnalyzing(true); try { const res = await fetch("/api/gemini/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audioDataUrl: url }) }); if (!res.ok) return; const { transcript } = await res.json() as { transcript?: string }; if (!transcript) return; const phraseWords = activePhrase.split(/\s+/).filter(Boolean); const transcriptWords = transcript.trim().split(/\s+/).filter(Boolean); const results = await Promise.all(phraseWords.map((w, i) => analyzePhonemes(w, transcriptWords[i] ?? ""))); setWordIPAs((prev) => prev.map((entry, i) => ({ ...entry, alignment: results[i]?.alignment ?? null }))); setSoundProgress((prev) => { const next = { ...prev }; for (const r of results) { for (const a of r.alignment) { const key = a.phoneme; if (!next[key]) next[key] = { correct: 0, total: 0 }; next[key].total += 1; if (a.status === "correct") next[key].correct += 1; } } return next; }); if (results.every((r) => r.alignment.every((a) => a.status === "correct")) && activePhrase) { setMastered((prev) => { const next = new Set(prev).add(activePhrase); saveMastered(next); return next; }); } } finally { setAnalyzing(false); } }, [activePhrase]);
  useEffect(() => { if (audioUrl) analyzeRecording(audioUrl); }, [audioUrl, analyzeRecording]);

  const advanceQueue = useCallback(() => { setSeen((prev) => { const next = new Set(prev).add(activePhrase); saveSeen(next); return next; }); setQueue((prev) => { const next = prev.slice(1); saveQueue(next); return next; }); resetRecording(); setWordIPAs([]); }, [activePhrase, resetRecording]);
  const handleMicClick = () => { if (isRecording) stopRecording(); else { resetRecording(); setWordIPAs((prev) => prev.map((e) => ({ ...e, alignment: null }))); startRecording(); } };
  const handleSavePractice = async (word: string) => { await saveAIWord({ word: word.toLowerCase(), meaning: "", difficulty: "medium", context: activePhrase, conversationId: 0, savedAt: new Date().toISOString() }); setSavedWords((prev) => new Set(prev).add(word.toLowerCase())); };

  const hasAnalysis = wordIPAs.some((w) => w.alignment !== null); const hasMistakes = wordIPAs.some((w) => w.alignment?.some((a) => a.status !== "correct")); const focus = hasAnalysis && hasMistakes ? firstBadPhoneme(wordIPAs) : null; const focusTip = focus ? PHONEME_TIPS[focus.phoneme] ?? null : null; const focusProgress = focus ? soundProgress[focus.phoneme] ?? null : null; const doneInBatch = batchCount - queue.length; const progressPct = batchCount > 0 ? (doneInBatch / batchCount) * 100 : 0;

  return <div className="flex flex-col h-full overflow-hidden"><PronunciationProgress current={doneInBatch} total={batchCount} mastered={mastered.size} pct={progressPct} />{sessionDone ? <SessionComplete mastered={mastered.size} batchSize={batchCount} onMore={() => loadMoreFromPool(seen, mastered)} onMoreAI={() => fetchMoreWithAI(seen)} loadingMore={fetchingPhrases} /> : <div className="flex-1 flex flex-col min-h-0 overflow-y-auto"><PhraseCard phrase={activePhrase} wordIPAs={wordIPAs} ipaLoading={ipaLoading} analyzing={analyzing} hasAnalysis={hasAnalysis} hasMistakes={hasMistakes} onListen={() => speakPhrase(activePhrase)} onSlow={() => speakPhrase(activePhrase, 0.55)} />{focus && !analyzing && <div className="px-4 pb-4 shrink-0"><CoachPanel focus={focus} focusTip={focusTip} focusProgress={focusProgress} savedWords={savedWords} onSave={handleSavePractice} /></div>}</div>}{!sessionDone && <RecordingControls isRecording={isRecording} onMicClick={handleMicClick} onSkip={advanceQueue} />}<audio ref={audioRef} className="hidden" /></div>;
}
