"use client";

export function SoundLabHeader() {
  return (
    <>
      <span className="sound-lab__eyebrow">
        <span className="sound-lab__live-dot" aria-hidden />
        Sound Lab · Live
      </span>
      <h1 className="sound-lab__headline">
        Speak <b>better</b>,
        <br />
        <em>one sound</em> at a time.
      </h1>
    </>
  );
}
