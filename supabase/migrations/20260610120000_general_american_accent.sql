-- Migración a General American (GA).
-- La app enseña acento americano (TTS, deck "a1-sonido-r-americano", diccionario
-- CMU/ARPAbet en lib/pronunciation/phonemes.ts), pero el seed original era RP.
--
-- Estrategia:
--   1. Renombrar sounds.ipa in-place (conserva ids → answer_history y entries intactos)
--   2. Fusionar /ɒ/ en /ɑ/ (LOT–PALM merge de GA); re-apuntar words/answer_history/entries
--   3. Eliminar diptongos centralizantes /ɪə/ /eə/ /ʊə/ (GA es rótico: here=/hɪr/)
--   4. Re-transcribir words a GA rótico
--   5. Reseed completo de minimal_pairs en GA (corrige pares defectuosos del seed RP)
--   6. Re-clavear user_contrast_progress y re-canonicalizar el orden de contrastKey()

-- ─── 1. RENOMBRES DE SOUNDS ───────────────────────────────────────────────────

-- Si /ɛ/ ya existe, fusionar /e/ en ella; si no, renombrar.
DO $$
DECLARE
  v_e   integer;
  v_eps integer;
BEGIN
  SELECT id INTO v_e   FROM public.sounds WHERE ipa = '/e/';
  SELECT id INTO v_eps FROM public.sounds WHERE ipa = '/ɛ/';

  IF v_e IS NOT NULL THEN
    IF v_eps IS NOT NULL THEN
      -- Fusión: redirigir referencias de /e/ al id de /ɛ/ ya existente
      UPDATE public.words               SET sound_id = v_eps WHERE sound_id = v_e;
      UPDATE public.answer_history      SET sound_id = v_eps WHERE sound_id = v_e;
      UPDATE public.entries             SET sound_id = v_eps WHERE sound_id = v_e;
      DELETE FROM public.user_sound_progress WHERE sound_id = v_e;
      DELETE FROM public.sounds WHERE id = v_e;
    ELSE
      UPDATE public.sounds SET ipa = '/ɛ/' WHERE id = v_e;
    END IF;
  END IF;
END $$;

-- Renombres defensivos: fusionar si el target ya existe, renombrar si no.
DO $$
DECLARE
  v_src integer; v_tgt integer;
BEGIN
  -- /ɑː/ → /ɑ/
  SELECT id INTO v_src FROM public.sounds WHERE ipa = '/ɑː/';
  SELECT id INTO v_tgt FROM public.sounds WHERE ipa = '/ɑ/';
  IF v_src IS NOT NULL THEN
    IF v_tgt IS NOT NULL THEN
      UPDATE public.words               SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.answer_history      SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.entries             SET sound_id = v_tgt WHERE sound_id = v_src;
      DELETE FROM public.user_sound_progress WHERE sound_id = v_src;
      DELETE FROM public.sounds WHERE id = v_src;
    ELSE
      UPDATE public.sounds SET ipa = '/ɑ/', example = 'father' WHERE id = v_src;
    END IF;
  END IF;

  -- /ɔː/ → /ɔ/
  SELECT id INTO v_src FROM public.sounds WHERE ipa = '/ɔː/';
  SELECT id INTO v_tgt FROM public.sounds WHERE ipa = '/ɔ/';
  IF v_src IS NOT NULL THEN
    IF v_tgt IS NOT NULL THEN
      UPDATE public.words               SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.answer_history      SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.entries             SET sound_id = v_tgt WHERE sound_id = v_src;
      DELETE FROM public.user_sound_progress WHERE sound_id = v_src;
      DELETE FROM public.sounds WHERE id = v_src;
    ELSE
      UPDATE public.sounds SET ipa = '/ɔ/' WHERE id = v_src;
    END IF;
  END IF;

  -- /ɜː/ → /ɜr/
  SELECT id INTO v_src FROM public.sounds WHERE ipa = '/ɜː/';
  SELECT id INTO v_tgt FROM public.sounds WHERE ipa = '/ɜr/';
  IF v_src IS NOT NULL THEN
    IF v_tgt IS NOT NULL THEN
      UPDATE public.words               SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.answer_history      SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.entries             SET sound_id = v_tgt WHERE sound_id = v_src;
      DELETE FROM public.user_sound_progress WHERE sound_id = v_src;
      DELETE FROM public.sounds WHERE id = v_src;
    ELSE
      UPDATE public.sounds SET ipa = '/ɜr/' WHERE id = v_src;
    END IF;
  END IF;

  -- /əʊ/ → /oʊ/
  SELECT id INTO v_src FROM public.sounds WHERE ipa = '/əʊ/';
  SELECT id INTO v_tgt FROM public.sounds WHERE ipa = '/oʊ/';
  IF v_src IS NOT NULL THEN
    IF v_tgt IS NOT NULL THEN
      UPDATE public.words               SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.answer_history      SET sound_id = v_tgt WHERE sound_id = v_src;
      UPDATE public.entries             SET sound_id = v_tgt WHERE sound_id = v_src;
      DELETE FROM public.user_sound_progress WHERE sound_id = v_src;
      DELETE FROM public.sounds WHERE id = v_src;
    ELSE
      UPDATE public.sounds SET ipa = '/oʊ/' WHERE id = v_src;
    END IF;
  END IF;
END $$;

-- ─── 2. WIPE DE MINIMAL_PAIRS (se reseedea completo en GA en el paso 5) ───────

DELETE FROM public.minimal_pairs;

-- ─── 3. FUSIÓN /ɒ/ → /ɑ/ Y RETIRO DE CENTRALIZANTES ──────────────────────────

DO $$
DECLARE
  v_lot integer;
  v_ah  integer;
  v_centering integer[];
BEGIN
  SELECT id INTO v_lot FROM public.sounds WHERE ipa = '/ɒ/';
  SELECT id INTO v_ah  FROM public.sounds WHERE ipa = '/ɑ/';

  IF v_lot IS NOT NULL THEN
    -- Las palabras de /ɒ/ (hot, top, stop…) son /ɑ/ legítimas en GA
    UPDATE public.words               SET sound_id = v_ah WHERE sound_id = v_lot;
    UPDATE public.answer_history      SET sound_id = v_ah WHERE sound_id = v_lot;
    UPDATE public.entries             SET sound_id = v_ah WHERE sound_id = v_lot;
    DELETE FROM public.user_sound_progress WHERE sound_id = v_lot;
    DELETE FROM public.sounds WHERE id = v_lot;
  END IF;

  SELECT array_agg(id) INTO v_centering
  FROM public.sounds WHERE ipa IN ('/ɪə/', '/eə/', '/ʊə/');

  IF v_centering IS NOT NULL THEN
    -- En GA esas palabras son vocal + /r/; sus words del seed eran RP no róticas
    DELETE FROM public.words               WHERE sound_id = ANY(v_centering);
    UPDATE public.answer_history      SET sound_id = NULL WHERE sound_id = ANY(v_centering);
    UPDATE public.entries             SET sound_id = NULL WHERE sound_id = ANY(v_centering);
    DELETE FROM public.user_sound_progress WHERE sound_id = ANY(v_centering);
    DELETE FROM public.sounds WHERE id = ANY(v_centering);
  END IF;
END $$;

-- ─── 4. RE-TRANSCRIPCIÓN DE WORDS A GA RÓTICO ─────────────────────────────────

-- Palabras BATH: en GA llevan /æ/, no /ɑ/
UPDATE public.words SET ipa = '/ɡræs/' WHERE word = 'grass';
UPDATE public.words SET ipa = '/klæs/' WHERE word = 'class';
UPDATE public.words SET ipa = '/ɡlæs/' WHERE word = 'glass';
UPDATE public.words SET ipa = '/fæst/' WHERE word = 'fast';

-- THOUGHT + r en la grafía: RP omitía la /r/; restaurarla antes del replace global
UPDATE public.words SET ipa = replace(ipa, 'ɔː', 'ɔr')
WHERE word IN ('door', 'floor', 'more', 'short', 'morning', 'your', 'ward');

-- Replaces globales de símbolos (las /ɑː/ restantes llevan r en la grafía:
-- car, far, bar, arm, heart, farm, dark, park, start, garden)
UPDATE public.words SET ipa = replace(ipa, 'ɔː', 'ɔ')  WHERE ipa LIKE '%ɔː%';
UPDATE public.words SET ipa = replace(ipa, 'ɑː', 'ɑr') WHERE ipa LIKE '%ɑː%';
UPDATE public.words SET ipa = replace(ipa, 'ɜː', 'ɜr') WHERE ipa LIKE '%ɜː%';
UPDATE public.words SET ipa = replace(ipa, 'əʊ', 'oʊ') WHERE ipa LIKE '%əʊ%';

-- Schwa final con r muda en RP → /ər/ en GA
UPDATE public.words SET ipa = replace(ipa, 'ə/', 'ər/')
WHERE word IN ('flower', 'shower', 'measure', 'pleasure', 'treasure', 'thunder', 'shoulder');

-- Casos individuales (vocal distinta en GA o r restaurada)
UPDATE public.words SET ipa = '/ˈliːʒər/' WHERE word = 'leisure';
UPDATE public.words SET ipa = '/jɪr/'     WHERE word = 'year';
UPDATE public.words SET ipa = '/ˈzɪroʊ/'  WHERE word = 'zero';
UPDATE public.words SET ipa = '/ðɛr/'     WHERE word = 'there';
UPDATE public.words SET ipa = '/ʃɛr/'     WHERE word = 'share';
UPDATE public.words SET ipa = '/tʃɛr/'    WHERE word = 'chair';

-- DRESS /e/ → /ɛ/ (protegiendo el diptongo /eɪ/ con un token temporal)
UPDATE public.words
SET ipa = replace(replace(replace(ipa, 'eɪ', '¤'), 'e', 'ɛ'), '¤', 'eɪ')
WHERE ipa LIKE '%e%';

-- Re-sincronizar sound_focus con el ipa renombrado del sonido
UPDATE public.words w
SET sound_focus = s.ipa
FROM public.sounds s
WHERE w.sound_id = s.id AND w.sound_focus IS DISTINCT FROM s.ipa;

-- Mismos replaces para patterns/pattern_words por si contienen símbolos RP
UPDATE public.pattern_words SET ipa = replace(ipa, 'ɔː', 'ɔ')  WHERE ipa LIKE '%ɔː%';
UPDATE public.pattern_words SET ipa = replace(ipa, 'ɑː', 'ɑr') WHERE ipa LIKE '%ɑː%';
UPDATE public.pattern_words SET ipa = replace(ipa, 'ɜː', 'ɜr') WHERE ipa LIKE '%ɜː%';
UPDATE public.pattern_words SET ipa = replace(ipa, 'əʊ', 'oʊ') WHERE ipa LIKE '%əʊ%';
UPDATE public.patterns SET sound_focus = replace(sound_focus, 'ɔː', 'ɔ')  WHERE sound_focus LIKE '%ɔː%';
UPDATE public.patterns SET sound_focus = replace(sound_focus, 'ɑː', 'ɑ')  WHERE sound_focus LIKE '%ɑː%';
UPDATE public.patterns SET sound_focus = replace(sound_focus, 'ɜː', 'ɜr') WHERE sound_focus LIKE '%ɜː%';
UPDATE public.patterns SET sound_focus = replace(sound_focus, 'əʊ', 'oʊ') WHERE sound_focus LIKE '%əʊ%';

-- ─── 5. RESEED DE MINIMAL_PAIRS EN GA ─────────────────────────────────────────
-- Reglas:
--   • Cada par difiere en EXACTAMENTE un fonema (par mínimo estricto) en GA
--   • Pares elegidos por confusión L1 español + carga funcional
--   • Correcciones sobre el seed RP: 'ben'→'Ben'→pig/big, 'rin'→wing/win,
--     'mesher'/'lesion'→glazier/version/composure, 'this/dis'→though/dough,
--     'no/mo'→nine/mine, 'see/zee'→sue/zoo, church/shirt→chair/share
--     (no era par mínimo), those/dose eliminado (dose es /doʊs/, no minimal)

INSERT INTO public.minimal_pairs
  (word_a, word_b, ipa_a, ipa_b, sound_group, contrast_sound_a_id, contrast_sound_b_id, contrast_ipa_a, contrast_ipa_b)
SELECT
  v.word_a, v.word_b, v.ipa_a, v.ipa_b,
  v.ca || ' vs ' || v.cb AS sound_group,
  sa.id, sb.id, v.ca, v.cb
FROM (VALUES
  -- /iː/ vs /ɪ/
  ('seat',     'sit',      '/siːt/',        '/sɪt/',         '/iː/', '/ɪ/'),
  ('feet',     'fit',      '/fiːt/',        '/fɪt/',         '/iː/', '/ɪ/'),
  ('leave',    'live',     '/liːv/',        '/lɪv/',         '/iː/', '/ɪ/'),
  ('sheep',    'ship',     '/ʃiːp/',        '/ʃɪp/',         '/iː/', '/ɪ/'),
  -- /ɪ/ vs /iː/
  ('bit',      'beat',     '/bɪt/',         '/biːt/',        '/ɪ/',  '/iː/'),
  ('sit',      'seat',     '/sɪt/',         '/siːt/',        '/ɪ/',  '/iː/'),
  ('ship',     'sheep',    '/ʃɪp/',         '/ʃiːp/',        '/ɪ/',  '/iː/'),
  -- /ɛ/ vs /æ/
  ('bed',      'bad',      '/bɛd/',         '/bæd/',         '/ɛ/',  '/æ/'),
  ('pen',      'pan',      '/pɛn/',         '/pæn/',         '/ɛ/',  '/æ/'),
  ('set',      'sat',      '/sɛt/',         '/sæt/',         '/ɛ/',  '/æ/'),
  -- /æ/ vs /ɛ/ y /æ/ vs /ʌ/
  ('bad',      'bed',      '/bæd/',         '/bɛd/',         '/æ/',  '/ɛ/'),
  ('man',      'men',      '/mæn/',         '/mɛn/',         '/æ/',  '/ɛ/'),
  ('cat',      'cut',      '/kæt/',         '/kʌt/',         '/æ/',  '/ʌ/'),
  -- /ɑ/ vs /ɜr/ (rótico en GA: ambas conservan la r)
  ('heart',    'hurt',     '/hɑrt/',        '/hɜrt/',        '/ɑ/',  '/ɜr/'),
  ('farm',     'firm',     '/fɑrm/',        '/fɜrm/',        '/ɑ/',  '/ɜr/'),
  ('car',      'cur',      '/kɑr/',         '/kɜr/',         '/ɑ/',  '/ɜr/'),
  -- /ɑ/ vs /ʌ/ y /ɑ/ vs /æ/ (la 'o' escrita de hot/top es /ɑ/ en GA)
  ('hot',      'hut',      '/hɑt/',         '/hʌt/',         '/ɑ/',  '/ʌ/'),
  ('cot',      'cut',      '/kɑt/',         '/kʌt/',         '/ɑ/',  '/ʌ/'),
  ('top',      'tap',      '/tɑp/',         '/tæp/',         '/ɑ/',  '/æ/'),
  -- /ɔ/ vs /oʊ/
  ('law',      'low',      '/lɔ/',          '/loʊ/',         '/ɔ/',  '/oʊ/'),
  ('caught',   'coat',     '/kɔt/',         '/koʊt/',        '/ɔ/',  '/oʊ/'),
  ('tall',     'toll',     '/tɔl/',         '/toʊl/',        '/ɔ/',  '/oʊ/'),
  -- /ʊ/ vs /uː/
  ('book',     'boot',     '/bʊk/',         '/buːt/',        '/ʊ/',  '/uː/'),
  ('pull',     'pool',     '/pʊl/',         '/puːl/',        '/ʊ/',  '/uː/'),
  ('full',     'fool',     '/fʊl/',         '/fuːl/',        '/ʊ/',  '/uː/'),
  -- /uː/ vs /ʊ/
  ('food',     'foot',     '/fuːd/',        '/fʊt/',         '/uː/', '/ʊ/'),
  ('pool',     'pull',     '/puːl/',        '/pʊl/',         '/uː/', '/ʊ/'),
  ('cool',     'could',    '/kuːl/',        '/kʊd/',         '/uː/', '/ʊ/'),
  -- /ʌ/ vs /æ/
  ('cup',      'cap',      '/kʌp/',         '/kæp/',         '/ʌ/',  '/æ/'),
  ('cut',      'cat',      '/kʌt/',         '/kæt/',         '/ʌ/',  '/æ/'),
  ('luck',     'lack',     '/lʌk/',         '/læk/',         '/ʌ/',  '/æ/'),
  -- /ɜr/ vs /ɑ/ y /ɜr/ vs /ɔ/
  ('bird',     'bard',     '/bɜrd/',        '/bɑrd/',        '/ɜr/', '/ɑ/'),
  ('hurt',     'heart',    '/hɜrt/',        '/hɑrt/',        '/ɜr/', '/ɑ/'),
  ('word',     'ward',     '/wɜrd/',        '/wɔrd/',        '/ɜr/', '/ɔ/'),
  -- /p/ vs /b/
  ('pat',      'bat',      '/pæt/',         '/bæt/',         '/p/',  '/b/'),
  ('pig',      'big',      '/pɪɡ/',         '/bɪɡ/',         '/p/',  '/b/'),
  ('pie',      'buy',      '/paɪ/',         '/baɪ/',         '/p/',  '/b/'),
  -- /b/ vs /v/ (clave para hispanohablantes) y /b/ vs /p/
  ('ban',      'van',      '/bæn/',         '/væn/',         '/b/',  '/v/'),
  ('berry',    'very',     '/ˈbɛri/',       '/ˈvɛri/',       '/b/',  '/v/'),
  ('back',     'pack',     '/bæk/',         '/pæk/',         '/b/',  '/p/'),
  -- /t/ vs /d/
  ('ten',      'den',      '/tɛn/',         '/dɛn/',         '/t/',  '/d/'),
  ('tip',      'dip',      '/tɪp/',         '/dɪp/',         '/t/',  '/d/'),
  ('town',     'down',     '/taʊn/',        '/daʊn/',        '/t/',  '/d/'),
  -- /d/ vs /t/ y /d/ vs /ð/
  ('den',      'ten',      '/dɛn/',         '/tɛn/',         '/d/',  '/t/'),
  ('day',      'they',     '/deɪ/',         '/ðeɪ/',         '/d/',  '/ð/'),
  ('dare',     'there',    '/dɛr/',         '/ðɛr/',         '/d/',  '/ð/'),
  -- /k/ vs /g/
  ('came',     'game',     '/keɪm/',        '/ɡeɪm/',        '/k/',  '/g/'),
  ('coat',     'goat',     '/koʊt/',        '/ɡoʊt/',        '/k/',  '/g/'),
  ('cold',     'gold',     '/koʊld/',       '/ɡoʊld/',       '/k/',  '/g/'),
  -- /g/ vs /k/
  ('goat',     'coat',     '/ɡoʊt/',        '/koʊt/',        '/g/',  '/k/'),
  ('gold',     'cold',     '/ɡoʊld/',       '/koʊld/',       '/g/',  '/k/'),
  ('glass',    'class',    '/ɡlæs/',        '/klæs/',        '/g/',  '/k/'),
  -- /f/ vs /v/
  ('fan',      'van',      '/fæn/',         '/væn/',         '/f/',  '/v/'),
  ('fat',      'vat',      '/fæt/',         '/væt/',         '/f/',  '/v/'),
  ('fine',     'vine',     '/faɪn/',        '/vaɪn/',        '/f/',  '/v/'),
  -- /v/ vs /b/ y /v/ vs /f/
  ('van',      'ban',      '/væn/',         '/bæn/',         '/v/',  '/b/'),
  ('vat',      'bat',      '/væt/',         '/bæt/',         '/v/',  '/b/'),
  ('vine',     'fine',     '/vaɪn/',        '/faɪn/',        '/v/',  '/f/'),
  -- /θ/ vs /s/, /t/, /f/
  ('think',    'sink',     '/θɪŋk/',        '/sɪŋk/',        '/θ/',  '/s/'),
  ('thin',     'tin',      '/θɪn/',         '/tɪn/',         '/θ/',  '/t/'),
  ('three',    'free',     '/θriː/',        '/friː/',        '/θ/',  '/f/'),
  -- /ð/ vs /d/ y /ð/ vs /θ/
  ('then',     'den',      '/ðɛn/',         '/dɛn/',         '/ð/',  '/d/'),
  ('though',   'dough',    '/ðoʊ/',         '/doʊ/',         '/ð/',  '/d/'),
  ('either',   'ether',    '/ˈiːðər/',      '/ˈiːθər/',      '/ð/',  '/θ/'),
  -- /s/ vs /z/
  ('sue',      'zoo',      '/suː/',         '/zuː/',         '/s/',  '/z/'),
  ('sip',      'zip',      '/sɪp/',         '/zɪp/',         '/s/',  '/z/'),
  ('seal',     'zeal',     '/siːl/',        '/ziːl/',        '/s/',  '/z/'),
  -- /z/ vs /s/
  ('zip',      'sip',      '/zɪp/',         '/sɪp/',         '/z/',  '/s/'),
  ('zeal',     'seal',     '/ziːl/',        '/siːl/',        '/z/',  '/s/'),
  ('buzz',     'bus',      '/bʌz/',         '/bʌs/',         '/z/',  '/s/'),
  -- /ʃ/ vs /s/
  ('she',      'see',      '/ʃiː/',         '/siː/',         '/ʃ/',  '/s/'),
  ('ship',     'sip',      '/ʃɪp/',         '/sɪp/',         '/ʃ/',  '/s/'),
  ('shoe',     'sue',      '/ʃuː/',         '/suː/',         '/ʃ/',  '/s/'),
  -- /ʒ/ vs /ʃ/, /dʒ/, /z/
  ('glazier',  'glacier',  '/ˈɡleɪʒər/',    '/ˈɡleɪʃər/',    '/ʒ/',  '/ʃ/'),
  ('version',  'virgin',   '/ˈvɜrʒən/',     '/ˈvɜrdʒən/',    '/ʒ/',  '/dʒ/'),
  ('composure','composer', '/kəmˈpoʊʒər/',  '/kəmˈpoʊzər/',  '/ʒ/',  '/z/'),
  -- /h/ vs ∅ (la columna b apunta a la vocal para tener un sound_id válido)
  ('hat',      'at',       '/hæt/',         '/æt/',          '/h/',  '/æ/'),
  ('hit',      'it',       '/hɪt/',         '/ɪt/',          '/h/',  '/ɪ/'),
  ('hold',     'old',      '/hoʊld/',       '/oʊld/',        '/h/',  '/oʊ/'),
  -- /tʃ/ vs /ʃ/
  ('chair',    'share',    '/tʃɛr/',        '/ʃɛr/',         '/tʃ/', '/ʃ/'),
  ('cheap',    'sheep',    '/tʃiːp/',       '/ʃiːp/',        '/tʃ/', '/ʃ/'),
  ('chin',     'shin',     '/tʃɪn/',        '/ʃɪn/',         '/tʃ/', '/ʃ/'),
  -- /dʒ/ vs /tʃ/ y /dʒ/ vs /j/
  ('gin',      'chin',     '/dʒɪn/',        '/tʃɪn/',        '/dʒ/', '/tʃ/'),
  ('jet',      'yet',      '/dʒɛt/',        '/jɛt/',         '/dʒ/', '/j/'),
  ('jam',      'yam',      '/dʒæm/',        '/jæm/',         '/dʒ/', '/j/'),
  -- /m/ vs /n/
  ('mail',     'nail',     '/meɪl/',        '/neɪl/',        '/m/',  '/n/'),
  ('meet',     'neat',     '/miːt/',        '/niːt/',        '/m/',  '/n/'),
  ('might',    'night',    '/maɪt/',        '/naɪt/',        '/m/',  '/n/'),
  -- /n/ vs /m/
  ('nail',     'mail',     '/neɪl/',        '/meɪl/',        '/n/',  '/m/'),
  ('night',    'might',    '/naɪt/',        '/maɪt/',        '/n/',  '/m/'),
  ('nine',     'mine',     '/naɪn/',        '/maɪn/',        '/n/',  '/m/'),
  -- /ŋ/ vs /n/
  ('sing',     'sin',      '/sɪŋ/',         '/sɪn/',         '/ŋ/',  '/n/'),
  ('wing',     'win',      '/wɪŋ/',         '/wɪn/',         '/ŋ/',  '/n/'),
  ('bang',     'ban',      '/bæŋ/',         '/bæn/',         '/ŋ/',  '/n/'),
  -- /l/ vs /r/
  ('led',      'red',      '/lɛd/',         '/rɛd/',         '/l/',  '/r/'),
  ('late',     'rate',     '/leɪt/',        '/reɪt/',        '/l/',  '/r/'),
  ('light',    'right',    '/laɪt/',        '/raɪt/',        '/l/',  '/r/'),
  -- /r/ vs /l/
  ('red',      'led',      '/rɛd/',         '/lɛd/',         '/r/',  '/l/'),
  ('rate',     'late',     '/reɪt/',        '/leɪt/',        '/r/',  '/l/'),
  ('rain',     'lane',     '/reɪn/',        '/leɪn/',        '/r/',  '/l/'),
  -- /j/ vs /dʒ/ y /j/ vs ∅
  ('yam',      'jam',      '/jæm/',         '/dʒæm/',        '/j/',  '/dʒ/'),
  ('yet',      'jet',      '/jɛt/',         '/dʒɛt/',        '/j/',  '/dʒ/'),
  ('year',     'ear',      '/jɪr/',         '/ɪr/',          '/j/',  '/ɪ/'),
  -- /w/ vs /v/ y /w/ vs /j/
  ('wine',     'vine',     '/waɪn/',        '/vaɪn/',        '/w/',  '/v/'),
  ('west',     'vest',     '/wɛst/',        '/vɛst/',        '/w/',  '/v/'),
  ('wet',      'yet',      '/wɛt/',         '/jɛt/',         '/w/',  '/j/'),
  -- /eɪ/ vs /aɪ/
  ('day',      'die',      '/deɪ/',         '/daɪ/',         '/eɪ/', '/aɪ/'),
  ('late',     'light',    '/leɪt/',        '/laɪt/',        '/eɪ/', '/aɪ/'),
  ('pain',     'pine',     '/peɪn/',        '/paɪn/',        '/eɪ/', '/aɪ/'),
  -- /aɪ/ vs /eɪ/
  ('light',    'late',     '/laɪt/',        '/leɪt/',        '/aɪ/', '/eɪ/'),
  ('time',     'tame',     '/taɪm/',        '/teɪm/',        '/aɪ/', '/eɪ/'),
  ('price',    'place',    '/praɪs/',       '/pleɪs/',       '/aɪ/', '/eɪ/'),
  -- /ɔɪ/ vs /eɪ/ y /ɔɪ/ vs /oʊ/
  ('boy',      'bay',      '/bɔɪ/',         '/beɪ/',         '/ɔɪ/', '/eɪ/'),
  ('coin',     'cone',     '/kɔɪn/',        '/koʊn/',        '/ɔɪ/', '/oʊ/'),
  ('oil',      'ale',      '/ɔɪl/',         '/eɪl/',         '/ɔɪ/', '/eɪ/'),
  -- /oʊ/ vs /ɔ/
  ('low',      'law',      '/loʊ/',         '/lɔ/',          '/oʊ/', '/ɔ/'),
  ('coat',     'caught',   '/koʊt/',        '/kɔt/',         '/oʊ/', '/ɔ/'),
  ('bowl',     'ball',     '/boʊl/',        '/bɔl/',         '/oʊ/', '/ɔ/'),
  -- /aʊ/ vs /oʊ/ y /aʊ/ vs /ʌ/
  ('now',      'no',       '/naʊ/',         '/noʊ/',         '/aʊ/', '/oʊ/'),
  ('out',      'oat',      '/aʊt/',         '/oʊt/',         '/aʊ/', '/oʊ/'),
  ('down',     'done',     '/daʊn/',        '/dʌn/',         '/aʊ/', '/ʌ/')
) AS v(word_a, word_b, ipa_a, ipa_b, ca, cb)
JOIN public.sounds sa ON sa.ipa = v.ca
JOIN public.sounds sb ON sb.ipa = v.cb;

-- ─── 6. USER_CONTRAST_PROGRESS: RE-CLAVEO ─────────────────────────────────────

-- Contrastes de sonidos retirados: eliminar (filosofía Fase 5a: sin ruido en el SRS)
DELETE FROM public.user_contrast_progress
WHERE contrast_id LIKE '%/ɒ/%'
   OR contrast_id LIKE '%/ɪə/%'
   OR contrast_id LIKE '%/eə/%'
   OR contrast_id LIKE '%/ʊə/%';

-- Renombres (cada símbolo va delimitado por barras, sin falsos positivos:
-- '/e/' no aparece dentro de '/eɪ/')
UPDATE public.user_contrast_progress SET contrast_id = replace(contrast_id, '/e/', '/ɛ/')   WHERE contrast_id LIKE '%/e/%';
UPDATE public.user_contrast_progress SET contrast_id = replace(contrast_id, '/ɑː/', '/ɑ/')  WHERE contrast_id LIKE '%/ɑː/%';
UPDATE public.user_contrast_progress SET contrast_id = replace(contrast_id, '/ɔː/', '/ɔ/')  WHERE contrast_id LIKE '%/ɔː/%';
UPDATE public.user_contrast_progress SET contrast_id = replace(contrast_id, '/ɜː/', '/ɜr/') WHERE contrast_id LIKE '%/ɜː/%';
UPDATE public.user_contrast_progress SET contrast_id = replace(contrast_id, '/əʊ/', '/oʊ/') WHERE contrast_id LIKE '%/əʊ/%';

-- Re-canonicalizar: contrastKey() exige ipaA <= ipaB por code units (JS).
-- COLLATE "C" compara por bytes UTF-8 = orden de code points = el orden de JS aquí.
UPDATE public.user_contrast_progress
SET contrast_id = split_part(contrast_id, '|', 2) || '|' || split_part(contrast_id, '|', 1)
WHERE (split_part(contrast_id, '|', 1) COLLATE "C") > (split_part(contrast_id, '|', 2) COLLATE "C");
