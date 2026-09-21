/**
 * Blocking inline script for app/layout.tsx.
 * Must run during HTML parse (raw <script>, not next/script) so data-theme and data-accent
 * are set before the first paint — preventing flash before hydration.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('theme-mode');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var mode=dark?'dark':'light';document.documentElement.setAttribute('data-theme',mode);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=mode;var acc=localStorage.getItem('theme-accent')||'blue';var valid=['red','orange','amber','green','emerald','teal','blue','purple','pink'];if(valid.indexOf(acc)===-1)acc='blue';document.documentElement.setAttribute('data-accent',acc)}catch(e){}})();`;
