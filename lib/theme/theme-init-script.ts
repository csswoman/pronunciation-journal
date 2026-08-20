/**
 * Blocking inline script for app/layout.tsx.
 * Must run during HTML parse (raw <script>, not next/script) so .dark is
 * present before the first paint — see Next.js "Preventing Flash Before Hydration".
 *
 * Always seeds split-complementary hues + chroma boosts (default 250 when unset)
 * so Home accents match the slider before React hydrates.
 * Logic mirrors `split-complementary.ts`.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('theme-mode');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';var raw=localStorage.getItem('theme-hue');var h=raw?parseInt(raw,10):250;if(isNaN(h))h=250;h=((h%360)+360)%360;var a1=((h+150)%360+360)%360;var a2=((h+210)%360+360)%360;function boost(n){return n>=55&&n<=95?1.28:n>95&&n<=110?1.16:n>110&&n<135?1.08:1}function lshift(n){return n>=55&&n<=110?0.035:0}var s=document.documentElement.style;s.setProperty('--hue',String(h));s.setProperty('--hue-base',String(h));s.setProperty('--hue-accent-1',String(a1));s.setProperty('--hue-accent-2',String(a2));s.setProperty('--chroma-boost-base',String(boost(h)));s.setProperty('--chroma-boost-accent-1',String(boost(a1)));s.setProperty('--chroma-boost-accent-2',String(boost(a2)));s.setProperty('--l-shift-base',String(lshift(h)));s.setProperty('--l-shift-accent-1',String(lshift(a1)));s.setProperty('--l-shift-accent-2',String(lshift(a2)))}catch(e){}})();`;
