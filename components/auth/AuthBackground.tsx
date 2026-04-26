"use client";

// Decorative floating icon grid — app-themed background for the auth page

const icons = [
  // Mic
  <svg key="mic1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  // Book open
  <svg key="book1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  // Volume
  <svg key="vol1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  // Headphones
  <svg key="head1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  // MessageSquare
  <svg key="msg1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  // Star (progress/achievement)
  <svg key="star1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  // Layers (IPA / phonemes)
  <svg key="layers1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  // TrendingUp (progress)
  <svg key="trend1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  // Sparkles / brain (AI)
  <svg key="brain1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66z"/></svg>,
  // Repeat (SRS review)
  <svg key="repeat1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  // Mic (duplicate, different position)
  <svg key="mic2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  // Bookmark
  <svg key="bk1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
];

// Grid positions — manually spread out to avoid colliding with the center card
const positions = [
  { top: "6%",  left: "4%",  size: 28, opacity: 0.18, rotate: -15 },
  { top: "12%", left: "18%", size: 20, opacity: 0.12, rotate: 10  },
  { top: "4%",  left: "78%", size: 24, opacity: 0.15, rotate: 20  },
  { top: "18%", left: "88%", size: 18, opacity: 0.10, rotate: -8  },
  { top: "38%", left: "3%",  size: 22, opacity: 0.13, rotate: 5   },
  { top: "55%", left: "10%", size: 18, opacity: 0.10, rotate: -20 },
  { top: "70%", left: "2%",  size: 26, opacity: 0.16, rotate: 12  },
  { top: "80%", left: "20%", size: 20, opacity: 0.12, rotate: -5  },
  { top: "88%", left: "50%", size: 22, opacity: 0.13, rotate: 18  },
  { top: "75%", left: "80%", size: 24, opacity: 0.14, rotate: -12 },
  { top: "60%", left: "90%", size: 20, opacity: 0.11, rotate: 8   },
  { top: "88%", left: "88%", size: 18, opacity: 0.10, rotate: -22 },
];

export function AuthBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {positions.map((pos, i) => {
        const icon = icons[i % icons.length];
        return (
          <div
            key={i}
            className="absolute text-white"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.size,
              height: pos.size,
              opacity: pos.opacity,
              transform: `rotate(${pos.rotate}deg)`,
            }}
          >
            {icon}
          </div>
        );
      })}
    </div>
  );
}
