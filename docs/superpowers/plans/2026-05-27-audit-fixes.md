# Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all P1/P2/P3 issues found in the `/impeccable audit` — accessibility gaps, `onMouseEnter/Leave` style-mutation anti-pattern, and a few minor responsive/performance issues.

**Architecture:** Each task is a surgical file edit. No new abstractions, no new files. Pattern: replace imperative style mutation with declarative Tailwind `hover:` + `focus-visible:` classes, or CSS-variable Tailwind arbitrary values. Where Tailwind can't express a token value directly (complex `color-mix`), use a CSS class added to `utilities.css` instead.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, CSS custom properties (tokens in `app/styles/tokens.css`), `cn()` from `@/lib/cn`

---

## Scope

Files to modify:
- `components/interview/WordChip.tsx` — P1 a11y: interactive span → button
- `components/courses/CoursesToolbar.tsx` — P1 a11y: focus rings on search/sort + P2 minWidth responsive
- `components/ai-coach/SuggestionChips.tsx` — P1 a11y: remove style mutation, use Tailwind hover
- `components/courses/CourseTopBar.tsx` — P1 a11y: remove style mutation
- `components/layout/page-header/PageHeaderButtons.tsx` — P1 a11y: remove style mutation
- `components/practice/LessonGrid.tsx` — P1 a11y: remove style mutation
- `components/practice/LessonFilters.tsx` — P1 a11y: remove style mutation
- `components/lesson/LessonCard.tsx` — P1 a11y: remove style mutation
- `components/vocabulary/PronunciationBadge.tsx` — P2: border-color hover via CSS class
- `components/ai-coach/pronunciation/PhraseCard.tsx` — P2: remove style mutation
- `components/ipa/DiphthongCard.tsx` — P2: remove style mutation
- `components/ipa/IPAMatrixCell.tsx` — P2: remove style mutation
- `components/ipa/SpanishSpeakersGrid.tsx` — P3 a11y: add focus-visible ring
- `components/ai-coach/widgets/FillBlankWidget.tsx` — P3 a11y: focus ring on answer input
- `app/styles/animations.css` — P2 perf: add will-change to message-in
- `app/styles/utilities.css` — P2: add `.hover-border-primary` helper, remove `.hue-left-bar`

Files NOT modified (hover is functional, not purely visual):
- `components/sidebar/NavButton.tsx` — tooltip positioning, keep
- `components/layout/SidebarFooter.tsx` — portal open/close, keep
- `components/interview/CandidateRecorder.tsx` — tooltip show/hide, keep
- `components/phoneme-practice/MinimalPairExercise.tsx` — triggers audio, keep
- `components/phoneme-practice/SoundLabContinuingBar.tsx` — hover state for UI reveal, keep
- `components/ai-coach/AICoachTrigger.tsx` — complex `color-mix` box-shadow, keep as runtime style
- `components/ai-coach/CustomPromptPanel.tsx` — complex runtime styles, keep
- `components/ai-coach/pronunciation/CoachPanel.tsx` — many runtime computed styles, keep
- `components/lesson/PronunciationFeedback.tsx` — triggers audio on hover, keep

---

## Task 1: WordChip — interactive span → button

**Files:**
- Modify: `components/interview/WordChip.tsx`

The inner `<span>` with `onClick` is only interactive when `isPlayable`. Replace with a conditional: render a `<button>` when playable, a `<span>` otherwise. The tooltip wrapper stays as a `<span>`.

- [ ] **Replace the inner interactive span**

Open `components/interview/WordChip.tsx`. Replace lines 26–37:

```tsx
      <span
        onClick={isPlayable ? (e) => { e.stopPropagation(); onPlay?.(); } : undefined}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity
          ${tip ? "underline decoration-dotted underline-offset-2" : ""}
          ${isPlayable ? "cursor-pointer hover:opacity-75 active:scale-95" : ""}
        `}
        style={{ color: colors[status], background: bgs[status] }}
        title={isPlayable ? `Listen to "${word}"` : undefined}
      >
        {word}
        {isPlayable && <Volume2 size={10} className="flex-shrink-0 opacity-60" />}
      </span>
```

With:

```tsx
      {isPlayable ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlay?.(); }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity cursor-pointer hover:opacity-75 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 border-none
            ${tip ? "underline decoration-dotted underline-offset-2" : ""}
          `}
          style={{ color: colors[status], background: bgs[status] }}
          aria-label={`Listen to "${word}"`}
        >
          {word}
          <Volume2 size={10} className="flex-shrink-0 opacity-60" aria-hidden />
        </button>
      ) : (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
            ${tip ? "underline decoration-dotted underline-offset-2" : ""}
          `}
          style={{ color: colors[status], background: bgs[status] }}
        >
          {word}
        </span>
      )}
```

- [ ] **Verify no TypeScript errors**

```powershell
cd "d:\proyectos\english-journal" && npx tsc --noEmit 2>&1 | Select-String "WordChip"
```

Expected: no output (no errors in that file).

- [ ] **Commit**

```powershell
git add components/interview/WordChip.tsx
git commit -m "fix(a11y): replace interactive span with button in WordChip"
```

---

## Task 2: CoursesToolbar — focus rings + responsive search

**Files:**
- Modify: `components/courses/CoursesToolbar.tsx`

Two issues:
1. Search `<input>` and sort `<select>` have `outline-none` with no focus-visible ring. Fix by adding `focus-within:ring-2 focus-within:ring-[var(--primary)]/40 focus-within:border-[var(--primary)]` on each pill wrapper.
2. Search wrapper has `minWidth: "240px"` hardcoded. Replace with responsive approach.

- [ ] **Fix SearchInput focus ring and responsive width**

In `SearchInput` (around line 107), replace the `<label>` style object:

```tsx
    <label
      className="inline-flex items-center"
      style={{
        gap: "var(--space-2)",
        height: "32px",
        padding: "0 var(--space-3)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-full)",
        minWidth: "240px",
      }}
    >
```

With:

```tsx
    <label
      className="inline-flex items-center focus-within:ring-2 focus-within:ring-[color:var(--primary)]/40 focus-within:border-[color:var(--primary)] transition-shadow w-full sm:w-60"
      style={{
        gap: "var(--space-2)",
        height: "32px",
        padding: "0 var(--space-3)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-full)",
      }}
    >
```

- [ ] **Fix SortSelect focus ring**

In `SortSelect` (around line 137), the outer `<div>` wraps the `<select>`. Add `focus-within` ring:

```tsx
    <div
      className="relative inline-flex items-center focus-within:ring-2 focus-within:ring-[color:var(--primary)]/40 focus-within:border-[color:var(--primary)] transition-shadow"
      style={{
        height: "32px",
        padding: "0 var(--space-3)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-full)",
        gap: "var(--space-2)",
        font: "var(--font-body-sm)",
        color: "var(--text-primary)",
      }}
    >
```

- [ ] **Verify build**

```powershell
cd "d:\proyectos\english-journal" && npx tsc --noEmit 2>&1 | Select-String "CoursesToolbar"
```

Expected: no output.

- [ ] **Commit**

```powershell
git add components/courses/CoursesToolbar.tsx
git commit -m "fix(a11y): add focus rings to CoursesToolbar search and sort inputs"
```

---

## Task 3: SuggestionChips — remove style mutation

**Files:**
- Modify: `components/ai-coach/SuggestionChips.tsx`

The `onMouseEnter/Leave` sets `backgroundColor` to `var(--primary-100)` and `color` to `var(--primary)`. Both are expressible as Tailwind arbitrary values.

- [ ] **Replace mutation with Tailwind hover classes**

Replace the `<button>` inside the map (lines 32–44):

```tsx
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors bg-surface-sunken text-fg-muted"
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "var(--primary-100)";
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "";
              e.currentTarget.style.color = "";
            }}
          >
```

With:

```tsx
          <button
            key={s.label}
            onClick={() => onSelect(s.prompt)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors bg-surface-sunken text-fg-muted hover:bg-[var(--primary-100)] hover:text-[color:var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40"
          >
```

- [ ] **Commit**

```powershell
git add components/ai-coach/SuggestionChips.tsx
git commit -m "fix(a11y): replace onMouseEnter/Leave with Tailwind hover in SuggestionChips"
```

---

## Task 4: CourseTopBar — remove style mutation

**Files:**
- Modify: `components/courses/CourseTopBar.tsx`

The back/close button at line 107 mutates `background` and `color` on hover.

- [ ] **Read the full button context first**

```powershell
Get-Content "d:\proyectos\english-journal\components\courses\CourseTopBar.tsx" | Select-Object -Skip 100 -First 20
```

- [ ] **Remove `onMouseEnter/Leave`, add Tailwind hover**

Find the button with `onMouseEnter={(e) => { e.currentTarget.style.background = "var(--overlay-subtle)"; ...`. It currently has no `className` or a minimal one. Add:

```tsx
className="... hover:bg-[var(--overlay-subtle)] hover:text-[color:var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2"
```

And delete both `onMouseEnter` and `onMouseLeave` props from that button.

- [ ] **Commit**

```powershell
git add components/courses/CourseTopBar.tsx
git commit -m "fix(a11y): replace onMouseEnter/Leave with Tailwind hover in CourseTopBar"
```

---

## Task 5: PageHeaderButtons — remove style mutation from ResumeButton

**Files:**
- Modify: `components/layout/page-header/PageHeaderButtons.tsx`

`ResumeButton` has `onMouseEnter/Leave` toggling `background` between `var(--primary)` and `var(--primary-hover)`. This can be a Tailwind arbitrary value hover.

- [ ] **Rewrite ResumeButton**

Replace:

```tsx
export function ResumeButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2" style={{ background: "var(--primary)", color: "var(--on-primary)", borderRadius: "var(--radius-md)", height: "40px", padding: "0 var(--space-5)", font: "var(--font-body-sm)", fontWeight: 500, border: "none", cursor: "pointer", transition: "background var(--transition-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-hover)")} onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary)")}><Play size={14} />Resume Lesson</button>;
}
```

With:

```tsx
export function ResumeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/40"
      style={{
        background: "var(--primary)",
        color: "var(--on-primary)",
        borderRadius: "var(--radius-md)",
        height: "40px",
        padding: "0 var(--space-5)",
        font: "var(--font-body-sm)",
        fontWeight: 500,
        border: "none",
        cursor: "pointer",
        transition: "background var(--transition-fast)",
      }}
    >
      <Play size={14} aria-hidden />
      Resume Lesson
    </button>
  );
}
```

- [ ] **Commit**

```powershell
git add components/layout/page-header/PageHeaderButtons.tsx
git commit -m "fix(a11y): replace onMouseEnter/Leave with Tailwind hover in ResumeButton"
```

---

## Task 6: LessonGrid + LessonFilters — remove style mutations

**Files:**
- Modify: `components/practice/LessonGrid.tsx`
- Modify: `components/practice/LessonFilters.tsx`

Both mutate `color` and `borderColor` on hover between `var(--text-secondary)/var(--border-subtle)` and `var(--text-primary)/var(--border-default)`.

- [ ] **LessonGrid: read the button context**

```powershell
Get-Content "d:\proyectos\english-journal\components\practice\LessonGrid.tsx" | Select-Object -Skip 112 -First 30
```

- [ ] **LessonGrid: add Tailwind hover, remove handlers**

The pagination "← Previous" button (and any matching "Next →" button) uses `onMouseEnter/Leave`. Replace with:

```tsx
className="... text-[color:var(--text-secondary)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-default)] transition-colors focus-visible:outline-none focus-visible:ring-2"
```

Remove both `onMouseEnter` and `onMouseLeave` props. Keep the `style={{}}` object for the other static properties (font, borderRadius, padding, background, cursor) since those are static tokens that would require many arbitrary Tailwind values — a direct style object is acceptable here per CLAUDE.md.

- [ ] **LessonFilters: add Tailwind hover, remove handlers**

The filter chip button (around line 117) uses `onMouseEnter/Leave` only when `!isActive`. Replace with:

```tsx
className={cn(
  "... transition-colors focus-visible:outline-none focus-visible:ring-2",
  isActive
    ? "..." // active styles stay as style={{}}
    : "text-[color:var(--text-secondary)] border-[color:var(--border-subtle)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-default)]"
)}
```

Remove both `onMouseEnter` and `onMouseLeave` props. You'll need to `import { cn } from "@/lib/cn"` if not already imported.

- [ ] **Verify build**

```powershell
cd "d:\proyectos\english-journal" && npx tsc --noEmit 2>&1 | Select-String "LessonGrid|LessonFilters"
```

Expected: no output.

- [ ] **Commit**

```powershell
git add components/practice/LessonGrid.tsx components/practice/LessonFilters.tsx
git commit -m "fix(a11y): replace onMouseEnter/Leave with Tailwind hover in LessonGrid and LessonFilters"
```

---

## Task 7: LessonCard — remove style mutation

**Files:**
- Modify: `components/lesson/LessonCard.tsx`

The wrapper `<div>` (inside a `<Link>`) mutates `borderColor` and `boxShadow` on hover. `boxShadow` uses a CSS variable value — use `hover:shadow-[var(--shadow-md)]` or the CSS token directly.

- [ ] **Read the full card wrapper**

```powershell
Get-Content "d:\proyectos\english-journal\components\lesson\LessonCard.tsx" | Select-Object -Skip 74 -First 25
```

- [ ] **Replace mutation with Tailwind hover**

The wrapper div has `transition` already in its `style`. Add to `className`:

```
hover:border-[color-mix(in_srgb,var(--primary)_40%,transparent)] hover:shadow-[var(--shadow-md)]
```

And change the base `borderColor` in the `style` object from the hover value back to:
```
borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)"
```

Remove `onMouseEnter` and `onMouseLeave`.

Note: Tailwind v4 supports arbitrary values with CSS functions when wrapped with `[...]`. For `color-mix`, use underscores for spaces inside the brackets: `hover:border-[color-mix(in_srgb,var(--primary)_40%,transparent)]`.

- [ ] **Verify build**

```powershell
cd "d:\proyectos\english-journal" && npx tsc --noEmit 2>&1 | Select-String "LessonCard"
```

- [ ] **Commit**

```powershell
git add components/lesson/LessonCard.tsx
git commit -m "fix(a11y): replace onMouseEnter/Leave with Tailwind hover in LessonCard"
```

---

## Task 8: DiphthongCard + IPAMatrixCell — remove style mutations

**Files:**
- Modify: `components/ipa/DiphthongCard.tsx`
- Modify: `components/ipa/IPAMatrixCell.tsx`

Both mutate `borderColor` on hover: `var(--border-strong)` on enter, restore conditional value on leave.

The issue is that the restore value depends on state (`isSelected`, `isExplored`). The cleanest fix: keep `borderColor` fully in `style` (it's already runtime-computed), but express the hover via a CSS class that uses `:hover` — or use a CSS variable for the hover override.

Simplest approach: add a `group` class and use a CSS custom property override:

Actually the cleanest approach for state-dependent border is to keep the style object but add a Tailwind `hover:` arbitrary value for the non-selected hover state and wrap it with a `cn()` conditional:

```tsx
className={cn(
  "group relative flex flex-col items-center w-full rounded-2xl border px-4 pt-5 pb-3",
  "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out",
  "hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.18)]",
  "active:translate-y-0 active:scale-[0.99]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
  !isSelected && "hover:border-[color:var(--border-strong)]",
)}
```

Then remove `onMouseEnter` and `onMouseLeave` entirely. The `style` object still sets the base `borderColor` (which Tailwind `hover:` will override correctly because hover classes have higher specificity when applied).

- [ ] **Update DiphthongCard**

Apply the `cn()` change above to the button's `className`. Remove the two `onMouseEnter`/`onMouseLeave` props. Keep the `style` object unchanged (it handles the base state).

- [ ] **Update IPAMatrixCell**

```powershell
Get-Content "d:\proyectos\english-journal\components\ipa\IPAMatrixCell.tsx" | Select-Object -Skip 25 -First 35
```

Apply the same pattern. The button in IPAMatrixCell should have identical structure. Add `!isSelected && "hover:border-[color:var(--border-strong)]"` to its `cn()` call and remove `onMouseEnter`/`onMouseLeave`.

- [ ] **Verify build**

```powershell
cd "d:\proyectos\english-journal" && npx tsc --noEmit 2>&1 | Select-String "DiphthongCard|IPAMatrixCell"
```

- [ ] **Commit**

```powershell
git add components/ipa/DiphthongCard.tsx components/ipa/IPAMatrixCell.tsx
git commit -m "fix(a11y): replace onMouseEnter/Leave with Tailwind hover in DiphthongCard and IPAMatrixCell"
```

---

## Task 9: PhraseCard + PronunciationBadge — remove style mutations

**Files:**
- Modify: `components/ai-coach/pronunciation/PhraseCard.tsx`
- Modify: `components/vocabulary/PronunciationBadge.tsx`

**PhraseCard:** The "0.5×" button mutates `backgroundColor` and `color`.

- [ ] **PhraseCard: add Tailwind hover**

Find the "0.5×" button (around line 106). It has `className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer border-none"`. Add hover classes and remove the handlers:

```tsx
          <button
            onClick={onSlow}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer border-none text-[color:var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] hover:text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: "transparent",
            }}
          >
            0.5×
          </button>
```

Remove both `onMouseEnter` and `onMouseLeave`.

**PronunciationBadge:** The hover sets `borderColor` to `var(--primary)`. But the leave handler depends on the `isPlaying` state — if playing, keep primary border; otherwise revert. This is a legitimate runtime condition.

Solution: keep the `borderColor` in the `style` object but compute it to always include the hover intent:

```tsx
      borderColor: isPlaying ? "var(--primary)" : "var(--line-divider)",
```

And express hover via a CSS class. Add to `app/styles/utilities.css`:

```css
.hover-border-primary:hover {
  border-color: var(--primary);
}
```

Then add `className="... hover-border-primary"` and remove both `onMouseEnter`/`onMouseLeave`.

- [ ] **Add `.hover-border-primary` to utilities.css**

In `app/styles/utilities.css`, after the `.link-primary:hover` rule at the bottom, add:

```css
/* ── Interactive border helpers ──────────────────────────────────────────── */
.hover-border-primary:hover {
  border-color: var(--primary);
}
```

- [ ] **Update PronunciationBadge**

Add `hover-border-primary` to the button's `className`. Remove `onMouseEnter` and `onMouseLeave`.

- [ ] **Commit**

```powershell
git add components/ai-coach/pronunciation/PhraseCard.tsx components/vocabulary/PronunciationBadge.tsx app/styles/utilities.css
git commit -m "fix(a11y): replace onMouseEnter/Leave with Tailwind/CSS hover in PhraseCard and PronunciationBadge"
```

---

## Task 10: P3 a11y — SpanishSpeakersGrid + FillBlankWidget focus rings

**Files:**
- Modify: `components/ipa/SpanishSpeakersGrid.tsx`
- Modify: `components/ai-coach/widgets/FillBlankWidget.tsx`

- [ ] **SpanishSpeakersGrid: swap focus:outline-none for focus-visible ring**

Find the grid button at line 62:

```tsx
className="text-left rounded-xl border p-3 transition-all duration-150 hover:scale-[1.02] hover:shadow-sm focus:outline-none"
```

Replace `focus:outline-none` with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1`:

```tsx
className="text-left rounded-xl border p-3 transition-all duration-150 hover:scale-[1.02] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
```

- [ ] **FillBlankWidget: add focus ring to answer input**

Find the inline answer input at line 101:

```tsx
className="border-b-2 outline-none bg-transparent text-center px-1 font-semibold"
```

Add `focus:border-[color:var(--primary)] transition-colors`:

```tsx
className="border-b-2 outline-none bg-transparent text-center px-1 font-semibold focus:border-[color:var(--primary)] transition-colors"
```

- [ ] **Commit**

```powershell
git add components/ipa/SpanishSpeakersGrid.tsx components/ai-coach/widgets/FillBlankWidget.tsx
git commit -m "fix(a11y): add focus-visible rings to SpanishSpeakersGrid and FillBlankWidget"
```

---

## Task 11: P2 perf — message-in animation blur + hue-left-bar

**Files:**
- Modify: `app/styles/animations.css`
- Modify: `app/styles/utilities.css`

- [ ] **Add will-change to message-in**

In `app/styles/animations.css`, update `.animate-message-in`:

```css
.animate-message-in   { animation: message-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; will-change: filter, opacity, transform; }
```

- [ ] **Audit hue-left-bar usages**

```powershell
cd "d:\proyectos\english-journal" && grep -rn "hue-left-bar" --include="*.tsx" --include="*.ts" --include="*.jsx" .
```

If zero results: remove the `.hue-left-bar` rule from `app/styles/utilities.css` entirely.

If results exist: for each usage, replace with a full border or background tint. Common replacements:
- Section heading marker → `border border-[color:var(--hue-bar)] rounded` (full border, lower visual weight)
- Decorative accent → remove entirely

After replacing all usages, remove the rule.

- [ ] **Commit**

```powershell
git add app/styles/animations.css app/styles/utilities.css
git commit -m "fix(perf): add will-change to message-in; remove hue-left-bar utility"
```

---

## Task 12: Final build check

- [ ] **Run TypeScript check**

```powershell
cd "d:\proyectos\english-journal" && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Run Next.js build**

```powershell
cd "d:\proyectos\english-journal" && npm run build 2>&1 | tail -20
```

Expected: build completes without errors.

- [ ] **If any errors: fix them before proceeding**

- [ ] **Final commit if any build fixes needed**

```powershell
git add -p
git commit -m "fix: resolve build errors from audit fixes"
```
