-- Corrige los 2 hallazgos ERROR/REVISAR de scripts/audit-sound-content.ts (2026-07-27).
--
-- 1. words.grass estaba clavada a sound_id=9 (/ɑ/) pero su IPA GA es /ɡræs/,
--    que no contiene /ɑ/. Es la palabra clásica de BATH-broadening (RP /ɡrɑːs/
--    vs GA /ɡræs/): bajo GA pertenece a /æ/ (sound_id=3), no a /ɑ/.
-- 2. sounds./ɑ/ tenía example='father', residuo de la fusión /ɑː/→/ɑ/ en
--    20260610120000_general_american_accent.sql. El inventario canónico
--    (components/ipa/data.ts) usa palabras LOT para /ɑ/; 'father' no es un
--    anchor válido. Se reemplaza por 'hot', ya presente como word.

UPDATE public.words
SET sound_id = 3, sound_focus = '/æ/'
WHERE word = 'grass' AND sound_id = 9;

UPDATE public.sounds
SET example = 'hot'
WHERE ipa = '/ɑ/' AND example = 'father';
