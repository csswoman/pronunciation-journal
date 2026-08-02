/**
 * Blocking inline script for app/layout.tsx.
 * Must run during HTML parse (raw <script>, not next/script) so .dark is
 * present before the first paint — see Next.js "Preventing Flash Before Hydration".
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('theme-mode');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';var h=localStorage.getItem('theme-hue');if(h)document.documentElement.style.setProperty('--hue',h)}catch(e){}})();`;
