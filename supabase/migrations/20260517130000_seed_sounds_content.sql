-- Seed: sounds, words per sound, minimal_pairs
-- Uses IPA-based lookups — no hardcoded IDs.
-- Re-runnable: sounds use ON CONFLICT (ipa) DO NOTHING.
-- words and minimal_pairs have no UNIQUE constraint beyond PK,
-- so this migration is idempotent only on first run; wrap in a guard if needed.

-- ─── 0. GUARD: skip if already seeded ────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.sounds WHERE ipa = '/iː/') THEN
    RAISE NOTICE 'Seed already applied — skipping.';
    RETURN;
  END IF;
END $$;

-- ─── 1. SOUNDS ────────────────────────────────────────────────────────────────

INSERT INTO public.sounds (ipa, type, category, example, difficulty) VALUES
  -- Vowels (short)
  ('/ɪ/',  'vowel',     'short vowel',  'sit',   3),
  ('/e/',  'vowel',     'short vowel',  'bed',   2),
  ('/æ/',  'vowel',     'short vowel',  'cat',   3),
  ('/ɒ/',  'vowel',     'short vowel',  'hot',   2),
  ('/ʊ/',  'vowel',     'short vowel',  'book',  2),
  ('/ʌ/',  'vowel',     'short vowel',  'cup',   3),
  ('/ə/',  'vowel',     'schwa',        'about', 2),
  -- Vowels (long)
  ('/iː/', 'vowel',     'long vowel',   'see',   1),
  ('/ɑː/', 'vowel',     'long vowel',   'car',   2),
  ('/ɔː/', 'vowel',     'long vowel',   'law',   3),
  ('/uː/', 'vowel',     'long vowel',   'moon',  1),
  ('/ɜː/', 'vowel',     'long vowel',   'bird',  3),
  -- Consonants (plosives)
  ('/p/',  'consonant', 'plosive',      'pen',   1),
  ('/b/',  'consonant', 'plosive',      'bed',   1),
  ('/t/',  'consonant', 'plosive',      'ten',   1),
  ('/d/',  'consonant', 'plosive',      'dog',   1),
  ('/k/',  'consonant', 'plosive',      'cat',   1),
  ('/g/',  'consonant', 'plosive',      'go',    1),
  -- Consonants (fricatives)
  ('/f/',  'consonant', 'fricative',    'fan',   1),
  ('/v/',  'consonant', 'fricative',    'van',   3),
  ('/θ/',  'consonant', 'fricative',    'think', 3),
  ('/ð/',  'consonant', 'fricative',    'this',  3),
  ('/s/',  'consonant', 'fricative',    'see',   1),
  ('/z/',  'consonant', 'fricative',    'zoo',   2),
  ('/ʃ/',  'consonant', 'fricative',    'she',   2),
  ('/ʒ/',  'consonant', 'fricative',    'vision',3),
  ('/h/',  'consonant', 'fricative',    'hat',   1),
  -- Consonants (affricates)
  ('/tʃ/', 'consonant', 'affricate',    'church',1),
  ('/dʒ/', 'consonant', 'affricate',    'judge', 1),
  -- Consonants (nasals)
  ('/m/',  'consonant', 'nasal',        'man',   1),
  ('/n/',  'consonant', 'nasal',        'no',    1),
  ('/ŋ/',  'consonant', 'nasal',        'sing',  2),
  -- Consonants (approximants)
  ('/l/',  'consonant', 'lateral',      'leg',   1),
  ('/r/',  'consonant', 'approximant',  'red',   3),
  ('/j/',  'consonant', 'approximant',  'yes',   1),
  ('/w/',  'consonant', 'approximant',  'wet',   1),
  -- Diphthongs (closing)
  ('/eɪ/', 'diphthong', 'closing',      'day',   2),
  ('/aɪ/', 'diphthong', 'closing',      'time',  2),
  ('/ɔɪ/', 'diphthong', 'closing',      'boy',   2),
  ('/əʊ/', 'diphthong', 'closing',      'go',    2),
  ('/aʊ/', 'diphthong', 'closing',      'now',   2),
  -- Diphthongs (centering)
  ('/ɪə/', 'diphthong', 'centering',    'here',  2),
  ('/eə/', 'diphthong', 'centering',    'there', 2),
  ('/ʊə/', 'diphthong', 'centering',    'tour',  2)
ON CONFLICT (ipa) DO NOTHING;


-- ─── 2. WORDS ─────────────────────────────────────────────────────────────────
-- Each word belongs to one primary sound (sound_id).
-- A word that exemplifies multiple sounds gets a row per sound (intentional).
-- No UNIQUE(word, sound_id) exists — safe to have same word for different sounds.

-- Helper: insert words for one sound at a time using a subquery for sound_id.

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('see',    '/siː/',     1), ('tree',   '/triː/',    1), ('feet',   '/fiːt/',    1),
  ('seat',   '/siːt/',    1), ('green',  '/ɡriːn/',   1), ('leave',  '/liːv/',    2),
  ('beach',  '/biːtʃ/',   2), ('teach',  '/tiːtʃ/',   2), ('sheep',  '/ʃiːp/',    2),
  ('cheese', '/tʃiːz/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/iː/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('sit',    '/sɪt/',     1), ('bit',    '/bɪt/',     1), ('fit',    '/fɪt/',     1),
  ('ship',   '/ʃɪp/',     1), ('miss',   '/mɪs/',     1), ('fill',   '/fɪl/',     1),
  ('live',   '/lɪv/',     2), ('wish',   '/wɪʃ/',     2), ('rich',   '/rɪtʃ/',    2),
  ('thick',  '/θɪk/',     2)
) AS w(word, ipa, diff) ON s.ipa = '/ɪ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('bed',    '/bed/',     1), ('pen',    '/pen/',     1), ('set',    '/set/',     1),
  ('red',    '/red/',     1), ('best',   '/best/',    1), ('head',   '/hed/',     1),
  ('step',   '/step/',    2), ('dress',  '/dres/',    2), ('spell',  '/spel/',    2),
  ('check',  '/tʃek/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/e/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('cat',    '/kæt/',     1), ('bad',    '/bæd/',     1), ('man',    '/mæn/',     1),
  ('cap',    '/kæp/',     1), ('sad',    '/sæd/',     1), ('hand',   '/hænd/',    1),
  ('land',   '/lænd/',    2), ('black',  '/blæk/',    2), ('plan',   '/plæn/',    2),
  ('track',  '/træk/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/æ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('car',    '/kɑː/',     1), ('far',    '/fɑː/',     1), ('bar',    '/bɑː/',     1),
  ('arm',    '/ɑːm/',     1), ('heart',  '/hɑːt/',    2), ('farm',   '/fɑːm/',    2),
  ('dark',   '/dɑːk/',    2), ('park',   '/pɑːk/',    2), ('start',  '/stɑːt/',   2),
  ('grass',  '/ɡrɑːs/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/ɑː/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('hot',    '/hɒt/',     1), ('top',    '/tɒp/',     1), ('lot',    '/lɒt/',     1),
  ('not',    '/nɒt/',     1), ('box',    '/bɒks/',    1), ('shop',   '/ʃɒp/',     2),
  ('clock',  '/klɒk/',    2), ('stop',   '/stɒp/',    2), ('drop',   '/drɒp/',    2),
  ('cot',    '/kɒt/',     1)
) AS w(word, ipa, diff) ON s.ipa = '/ɒ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('law',    '/lɔː/',     1), ('all',    '/ɔːl/',     1), ('tall',   '/tɔːl/',    1),
  ('call',   '/kɔːl/',    1), ('ball',   '/bɔːl/',    1), ('door',   '/dɔː/',     2),
  ('caught', '/kɔːt/',    2), ('thought','/θɔːt/',    2), ('bought', '/bɔːt/',    2),
  ('floor',  '/flɔː/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/ɔː/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('book',   '/bʊk/',     1), ('look',   '/lʊk/',     1), ('good',   '/ɡʊd/',     1),
  ('pull',   '/pʊl/',     1), ('full',   '/fʊl/',     1), ('foot',   '/fʊt/',     1),
  ('put',    '/pʊt/',     2), ('wood',   '/wʊd/',     2), ('would',  '/wʊd/',     2),
  ('could',  '/kʊd/',     2)
) AS w(word, ipa, diff) ON s.ipa = '/ʊ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('moon',   '/muːn/',    1), ('food',   '/fuːd/',    1), ('pool',   '/puːl/',    1),
  ('cool',   '/kuːl/',    1), ('blue',   '/bluː/',    1), ('shoe',   '/ʃuː/',     2),
  ('truth',  '/truːθ/',   2), ('choose', '/tʃuːz/',   2), ('school', '/skuːl/',   2),
  ('fruit',  '/fruːt/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/uː/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('cup',    '/kʌp/',     1), ('cut',    '/kʌt/',     1), ('luck',   '/lʌk/',     1),
  ('run',    '/rʌn/',     1), ('sun',    '/sʌn/',     1), ('mud',    '/mʌd/',     1),
  ('jump',   '/dʒʌmp/',   2), ('truck',  '/trʌk/',    2), ('stuck',  '/stʌk/',    2),
  ('blood',  '/blʌd/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/ʌ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('bird',   '/bɜːd/',    2), ('word',   '/wɜːd/',    2), ('hurt',   '/hɜːt/',    2),
  ('turn',   '/tɜːn/',    2), ('burn',   '/bɜːn/',    2), ('nurse',  '/nɜːs/',    2),
  ('learn',  '/lɜːn/',    2), ('work',   '/wɜːk/',    2), ('earth',  '/ɜːθ/',     3),
  ('worse',  '/wɜːs/',    3)
) AS w(word, ipa, diff) ON s.ipa = '/ɜː/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('the',    '/ðə/',      1), ('a',      '/ə/',       1), ('about',  '/əˈbaʊt/',  2),
  ('sofa',   '/ˈsəʊfə/',  2), ('ago',    '/əˈɡəʊ/',   2), ('open',   '/ˈəʊpən/',  2),
  ('garden', '/ˈɡɑːdən/', 2), ('problem','/ˈprɒbləm/',2), ('lesson', '/ˈlesən/',  2),
  ('button', '/ˈbʌtən/',  2)
) AS w(word, ipa, diff) ON s.ipa = '/ə/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('pen',    '/pen/',     1), ('pet',    '/pet/',     1), ('pie',    '/paɪ/',     1),
  ('pick',   '/pɪk/',     1), ('park',   '/pɑːk/',    1), ('push',   '/pʊʃ/',     2),
  ('plan',   '/plæn/',    2), ('price',  '/praɪs/',   2), ('plate',  '/pleɪt/',   2),
  ('paint',  '/peɪnt/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/p/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('bat',    '/bæt/',     1), ('big',    '/bɪɡ/',     1), ('bus',    '/bʌs/',     1),
  ('back',   '/bæk/',     1), ('blue',   '/bluː/',     2), ('break',  '/breɪk/',   2),
  ('build',  '/bɪld/',    2), ('bright', '/braɪt/',   2), ('bridge', '/brɪdʒ/',   2),
  ('boat',   '/bəʊt/',    1)
) AS w(word, ipa, diff) ON s.ipa = '/b/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('ten',    '/ten/',     1), ('tip',    '/tɪp/',     1), ('town',   '/taʊn/',    1),
  ('time',   '/taɪm/',    1), ('tall',   '/tɔːl/',    1), ('test',   '/test/',    1),
  ('train',  '/treɪn/',   2), ('trust',  '/trʌst/',   2), ('table',  '/ˈteɪbəl/', 2),
  ('ticket', '/ˈtɪkɪt/',  2)
) AS w(word, ipa, diff) ON s.ipa = '/t/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('dog',    '/dɒɡ/',     1), ('day',    '/deɪ/',     1), ('den',    '/den/',     1),
  ('dip',    '/dɪp/',     1), ('door',   '/dɔː/',     1), ('dark',   '/dɑːk/',    2),
  ('dream',  '/driːm/',   2), ('drive',  '/draɪv/',   2), ('drink',  '/drɪŋk/',   2),
  ('door',   '/dɔː/',     1)
) AS w(word, ipa, diff) ON s.ipa = '/d/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('cat',    '/kæt/',     1), ('coat',   '/kəʊt/',    1), ('cold',   '/kəʊld/',   1),
  ('call',   '/kɔːl/',    1), ('class',  '/klɑːs/',   2), ('clock',  '/klɒk/',    2),
  ('cream',  '/kriːm/',   2), ('cross',  '/krɒs/',    2), ('keep',   '/kiːp/',    1),
  ('kind',   '/kaɪnd/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/k/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('go',     '/ɡəʊ/',     1), ('get',    '/ɡet/',     1), ('give',   '/ɡɪv/',     1),
  ('good',   '/ɡʊd/',     1), ('girl',   '/ɡɜːl/',    2), ('glass',  '/ɡlɑːs/',   2),
  ('green',  '/ɡriːn/',   2), ('great',  '/ɡreɪt/',   2), ('game',   '/ɡeɪm/',    1),
  ('garden', '/ˈɡɑːdən/', 2)
) AS w(word, ipa, diff) ON s.ipa = '/g/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('fan',    '/fæn/',     1), ('fat',    '/fæt/',     1), ('fish',   '/fɪʃ/',     1),
  ('food',   '/fuːd/',    1), ('fast',   '/fɑːst/',   2), ('fine',   '/faɪn/',    1),
  ('flower', '/ˈflaʊə/',  2), ('friend', '/frend/',   2), ('fresh',  '/freʃ/',    2),
  ('flight', '/flaɪt/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/f/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('van',    '/væn/',     2), ('vat',    '/væt/',     2), ('very',   '/ˈveri/',   1),
  ('voice',  '/vɔɪs/',    2), ('vote',   '/vəʊt/',    2), ('visit',  '/ˈvɪzɪt/',  2),
  ('vine',   '/vaɪn/',    2), ('video',  '/ˈvɪdiəʊ/', 2), ('value',  '/ˈvæljuː/', 3),
  ('village','/ˈvɪlɪdʒ/', 2)
) AS w(word, ipa, diff) ON s.ipa = '/v/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('think',  '/θɪŋk/',    2), ('thin',   '/θɪn/',     2), ('three',  '/θriː/',    2),
  ('thank',  '/θæŋk/',    2), ('thick',  '/θɪk/',     2), ('thumb',  '/θʌm/',     2),
  ('throw',  '/θrəʊ/',    3), ('thread', '/θred/',    3), ('thunder','/ˈθʌndə/',  3),
  ('thirty', '/ˈθɜːti/',  2)
) AS w(word, ipa, diff) ON s.ipa = '/θ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('the',    '/ðə/',      1), ('that',   '/ðæt/',     1), ('they',   '/ðeɪ/',     1),
  ('them',   '/ðem/',     1), ('then',   '/ðen/',     1), ('this',   '/ðɪs/',     2),
  ('there',  '/ðeə/',     2), ('those',  '/ðəʊz/',    2), ('though', '/ðəʊ/',     2),
  ('breathe','/briːð/',   3)
) AS w(word, ipa, diff) ON s.ipa = '/ð/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('sit',    '/sɪt/',     1), ('sun',    '/sʌn/',     1), ('sad',    '/sæd/',     1),
  ('six',    '/sɪks/',    1), ('stop',   '/stɒp/',    2), ('sleep',  '/sliːp/',   2),
  ('smile',  '/smaɪl/',   2), ('school', '/skuːl/',   2), ('sea',    '/siː/',     1),
  ('snake',  '/sneɪk/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/s/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('zoo',    '/zuː/',     1), ('zip',    '/zɪp/',     1), ('zone',   '/zəʊn/',    2),
  ('zero',   '/ˈzɪərəʊ/', 2), ('buzz',   '/bʌz/',     2), ('jazz',   '/dʒæz/',    2),
  ('rose',   '/rəʊz/',    2), ('easy',   '/ˈiːzi/',   2), ('zeal',   '/ziːl/',    2),
  ('size',   '/saɪz/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/z/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('she',    '/ʃiː/',     1), ('shoe',   '/ʃuː/',     1), ('ship',   '/ʃɪp/',     1),
  ('shop',   '/ʃɒp/',     1), ('show',   '/ʃəʊ/',     1), ('short',  '/ʃɔːt/',    2),
  ('sheep',  '/ʃiːp/',    2), ('share',  '/ʃeə/',     2), ('shirt',  '/ʃɜːt/',    2),
  ('shape',  '/ʃeɪp/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/ʃ/';

-- /ʒ/: genuinely rare in short common words; mix difficulty 2 and 3
INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('vision',  '/ˈvɪʒən/',  2), ('measure', '/ˈmeʒə/',   2), ('usual',   '/ˈjuːʒuəl/',2),
  ('casual',  '/ˈkæʒuəl/', 2), ('pleasure','/ˈpleʒə/',  2), ('leisure', '/ˈleʒə/',   2),
  ('treasure','/ˈtreʒə/',  3), ('decision','/dɪˈsɪʒən/', 3), ('occasion','/əˈkeɪʒən/',3),
  ('beige',   '/beɪʒ/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/ʒ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('hat',    '/hæt/',     1), ('hit',    '/hɪt/',     1), ('hot',    '/hɒt/',     1),
  ('home',   '/həʊm/',    1), ('hand',   '/hænd/',    1), ('help',   '/help/',    1),
  ('happy',  '/ˈhæpi/',   2), ('heavy',  '/ˈhevi/',   2), ('hurry',  '/ˈhʌri/',   2),
  ('human',  '/ˈhjuːmən/',2)
) AS w(word, ipa, diff) ON s.ipa = '/h/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('church', '/tʃɜːtʃ/',  1), ('cheap',  '/tʃiːp/',   1), ('chin',   '/tʃɪn/',    1),
  ('chair',  '/tʃeə/',    1), ('child',  '/tʃaɪld/',  2), ('cheese', '/tʃiːz/',   2),
  ('change', '/tʃeɪndʒ/', 2), ('choose', '/tʃuːz/',   2), ('chest',  '/tʃest/',   2),
  ('match',  '/mætʃ/',    2)
) AS w(word, ipa, diff) ON s.ipa = '/tʃ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('job',    '/dʒɒb/',    1), ('jet',    '/dʒet/',    1), ('jump',   '/dʒʌmp/',   1),
  ('join',   '/dʒɔɪn/',   2), ('jacket', '/ˈdʒækɪt/', 2), ('judge',  '/dʒʌdʒ/',   1),
  ('giant',  '/ˈdʒaɪənt/',2), ('gentle', '/ˈdʒentəl/',2), ('journey','/ˈdʒɜːni/', 2),
  ('jungle', '/ˈdʒʌŋɡəl/',2)
) AS w(word, ipa, diff) ON s.ipa = '/dʒ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('man',    '/mæn/',     1), ('moon',   '/muːn/',    1), ('make',   '/meɪk/',    1),
  ('more',   '/mɔː/',     1), ('meet',   '/miːt/',    1), ('mail',   '/meɪl/',    1),
  ('smile',  '/smaɪl/',   2), ('small',  '/smɔːl/',   2), ('music',  '/ˈmjuːzɪk/',2),
  ('morning','/ˈmɔːnɪŋ/', 2)
) AS w(word, ipa, diff) ON s.ipa = '/m/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('no',     '/nəʊ/',     1), ('name',   '/neɪm/',    1), ('need',   '/niːd/',    1),
  ('nice',   '/naɪs/',    1), ('night',  '/naɪt/',    1), ('nail',   '/neɪl/',    1),
  ('snow',   '/snəʊ/',    2), ('know',   '/nəʊ/',     2), ('nurse',  '/nɜːs/',    2),
  ('notice', '/ˈnəʊtɪs/', 2)
) AS w(word, ipa, diff) ON s.ipa = '/n/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('sing',   '/sɪŋ/',     1), ('ring',   '/rɪŋ/',     1), ('long',   '/lɒŋ/',     1),
  ('song',   '/sɒŋ/',     1), ('bang',   '/bæŋ/',     1), ('bring',  '/brɪŋ/',    2),
  ('strong', '/strɒŋ/',   2), ('morning','/ˈmɔːnɪŋ/', 2), ('running','/ˈrʌnɪŋ/', 2),
  ('king',   '/kɪŋ/',     1)
) AS w(word, ipa, diff) ON s.ipa = '/ŋ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('leg',    '/leɡ/',     1), ('look',   '/lʊk/',     1), ('love',   '/lʌv/',     1),
  ('late',   '/leɪt/',    1), ('light',  '/laɪt/',    2), ('learn',  '/lɜːn/',    2),
  ('leave',  '/liːv/',    2), ('please', '/pliːz/',   2), ('flower', '/ˈflaʊə/',  2),
  ('world',  '/wɜːld/',   2)
) AS w(word, ipa, diff) ON s.ipa = '/l/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('red',    '/red/',     2), ('run',    '/rʌn/',     2), ('road',   '/rəʊd/',    2),
  ('right',  '/raɪt/',    2), ('read',   '/riːd/',    2), ('room',   '/ruːm/',    2),
  ('rain',   '/reɪn/',    2), ('rate',   '/reɪt/',    2), ('write',  '/raɪt/',    3),
  ('wrong',  '/rɒŋ/',     3)
) AS w(word, ipa, diff) ON s.ipa = '/r/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('yes',    '/jes/',     1), ('yet',    '/jet/',     1), ('year',   '/jɪə/',     1),
  ('young',  '/jʌŋ/',     1), ('your',   '/jɔː/',     1), ('yell',   '/jel/',     2),
  ('yellow', '/ˈjeləʊ/',  2), ('yoga',   '/ˈjəʊɡə/',  2), ('use',    '/juːz/',    2),
  ('yam',    '/jæm/',     1)
) AS w(word, ipa, diff) ON s.ipa = '/j/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('wet',    '/wet/',     1), ('word',   '/wɜːd/',    1), ('walk',   '/wɔːk/',    1),
  ('wait',   '/weɪt/',    1), ('wine',   '/waɪn/',    1), ('west',   '/west/',    1),
  ('wind',   '/wɪnd/',    2), ('world',  '/wɜːld/',   2), ('woman',  '/ˈwʊmən/',  2),
  ('window', '/ˈwɪndəʊ/', 2)
) AS w(word, ipa, diff) ON s.ipa = '/w/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('day',    '/deɪ/',     1), ('name',   '/neɪm/',    1), ('cake',   '/keɪk/',    1),
  ('late',   '/leɪt/',    1), ('pain',   '/peɪn/',    1), ('train',  '/treɪn/',   2),
  ('plain',  '/pleɪn/',   2), ('break',  '/breɪk/',   2), ('great',  '/ɡreɪt/',   2),
  ('afraid', '/əˈfreɪd/', 2)
) AS w(word, ipa, diff) ON s.ipa = '/eɪ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('time',   '/taɪm/',    1), ('night',  '/naɪt/',    1), ('find',   '/faɪnd/',   2),
  ('light',  '/laɪt/',    1), ('write',  '/raɪt/',    2), ('drive',  '/draɪv/',   2),
  ('bright', '/braɪt/',   2), ('flight', '/flaɪt/',   2), ('price',  '/praɪs/',   2),
  ('decide', '/dɪˈsaɪd/', 3)
) AS w(word, ipa, diff) ON s.ipa = '/aɪ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('boy',    '/bɔɪ/',     1), ('coin',   '/kɔɪn/',    1), ('oil',    '/ɔɪl/',     1),
  ('join',   '/dʒɔɪn/',   2), ('voice',  '/vɔɪs/',    2), ('point',  '/pɔɪnt/',   2),
  ('noise',  '/nɔɪz/',    2), ('enjoy',  '/ɪnˈdʒɔɪ/', 2), ('avoid',  '/əˈvɔɪd/', 3),
  ('royal',  '/ˈrɔɪəl/',  3)
) AS w(word, ipa, diff) ON s.ipa = '/ɔɪ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('go',     '/ɡəʊ/',     1), ('home',   '/həʊm/',    1), ('road',   '/rəʊd/',    1),
  ('low',    '/ləʊ/',     1), ('coat',   '/kəʊt/',    1), ('phone',  '/fəʊn/',    2),
  ('toast',  '/təʊst/',   2), ('hotel',  '/həʊˈtel/', 2), ('cold',   '/kəʊld/',   1),
  ('shoulder','/ˈʃəʊldə/',2)
) AS w(word, ipa, diff) ON s.ipa = '/əʊ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('now',    '/naʊ/',     1), ('out',    '/aʊt/',     1), ('down',   '/daʊn/',    1),
  ('how',    '/haʊ/',     1), ('town',   '/taʊn/',    1), ('loud',   '/laʊd/',    2),
  ('cloud',  '/klaʊd/',   2), ('flower', '/ˈflaʊə/',  2), ('shower', '/ˈʃaʊə/',   2),
  ('around', '/əˈraʊnd/', 2)
) AS w(word, ipa, diff) ON s.ipa = '/aʊ/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('here',   '/hɪə/',     1), ('near',   '/nɪə/',     1), ('ear',    '/ɪə/',      1),
  ('fear',   '/fɪə/',     2), ('beer',   '/bɪə/',     2), ('deer',   '/dɪə/',     2),
  ('clear',  '/klɪə/',    2), ('year',   '/jɪə/',     2), ('appear', '/əˈpɪə/',   3),
  ('career', '/kəˈrɪə/',  3)
) AS w(word, ipa, diff) ON s.ipa = '/ɪə/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('there',  '/ðeə/',     1), ('fair',   '/feə/',     1), ('hair',   '/heə/',     1),
  ('care',   '/keə/',     2), ('bear',   '/beə/',     2), ('wear',   '/weə/',     2),
  ('share',  '/ʃeə/',     2), ('square', '/skweə/',   2), ('compare','/kəmˈpeə/', 3),
  ('aware',  '/əˈweə/',   3)
) AS w(word, ipa, diff) ON s.ipa = '/eə/';

INSERT INTO public.words (word, ipa, sound_id, difficulty, sound_focus)
SELECT w.word, w.ipa, s.id, w.diff, s.ipa
FROM public.sounds s
JOIN (VALUES
  ('tour',   '/tʊə/',     2), ('pure',   '/pjʊə/',    2), ('sure',   '/ʃʊə/',     2),
  ('cure',   '/kjʊə/',    2), ('poor',   '/pʊə/',     2), ('during', '/ˈdjʊərɪŋ/',2),
  ('mature', '/məˈtjʊə/', 3), ('endure', '/ɪnˈdjʊə/', 3), ('secure', '/sɪˈkjʊə/', 3),
  ('fewer',  '/ˈfjuːə/',  3)
) AS w(word, ipa, diff) ON s.ipa = '/ʊə/';


-- ─── 3. MINIMAL PAIRS ─────────────────────────────────────────────────────────
-- Rules:
--   • Each pair differs by exactly ONE phoneme (strict minimal pair)
--   • contrast_sound_a_id / contrast_sound_b_id point to the two contrasted sounds
--   • sound_group is informational: 'ipa_a vs ipa_b'

INSERT INTO public.minimal_pairs
  (word_a, word_b, ipa_a, ipa_b, sound_group, contrast_sound_a_id, contrast_sound_b_id, contrast_ipa_a, contrast_ipa_b)
SELECT
  v.word_a, v.word_b, v.ipa_a, v.ipa_b,
  v.ca || ' vs ' || v.cb AS sound_group,
  sa.id, sb.id, v.ca, v.cb
FROM (VALUES
  -- /iː/ vs /ɪ/
  ('seat',    'sit',     '/siːt/',   '/sɪt/',    '/iː/', '/ɪ/'),
  ('feet',    'fit',     '/fiːt/',   '/fɪt/',    '/iː/', '/ɪ/'),
  ('leave',   'live',    '/liːv/',   '/lɪv/',    '/iː/', '/ɪ/'),
  ('sheep',   'ship',    '/ʃiːp/',   '/ʃɪp/',    '/iː/', '/ɪ/'),
  -- /ɪ/ vs /iː/
  ('bit',     'beat',    '/bɪt/',    '/biːt/',   '/ɪ/',  '/iː/'),
  ('sit',     'seat',    '/sɪt/',    '/siːt/',   '/ɪ/',  '/iː/'),
  ('ship',    'sheep',   '/ʃɪp/',    '/ʃiːp/',   '/ɪ/',  '/iː/'),
  -- /e/ vs /æ/
  ('bed',     'bad',     '/bed/',    '/bæd/',    '/e/',  '/æ/'),
  ('pen',     'pan',     '/pen/',    '/pæn/',    '/e/',  '/æ/'),
  ('set',     'sat',     '/set/',    '/sæt/',    '/e/',  '/æ/'),
  -- /æ/ vs /e/
  ('bad',     'bed',     '/bæd/',    '/bed/',    '/æ/',  '/e/'),
  ('cat',     'cut',     '/kæt/',    '/kʌt/',    '/æ/',  '/ʌ/'),
  ('man',     'men',     '/mæn/',    '/men/',    '/æ/',  '/e/'),
  -- /ɑː/ vs /ɜː/
  ('heart',   'hurt',    '/hɑːt/',   '/hɜːt/',   '/ɑː/', '/ɜː/'),
  ('farm',    'firm',    '/fɑːm/',   '/fɜːm/',   '/ɑː/', '/ɜː/'),
  ('car',     'cur',     '/kɑː/',    '/kɜː/',    '/ɑː/', '/ɜː/'),
  -- /ɒ/ vs /ʌ/
  ('hot',     'hut',     '/hɒt/',    '/hʌt/',    '/ɒ/',  '/ʌ/'),
  ('cot',     'cut',     '/kɒt/',    '/kʌt/',    '/ɒ/',  '/ʌ/'),
  ('top',     'tap',     '/tɒp/',    '/tæp/',    '/ɒ/',  '/æ/'),
  -- /ɔː/ vs /əʊ/
  ('law',     'low',     '/lɔː/',    '/ləʊ/',    '/ɔː/', '/əʊ/'),
  ('caught',  'coat',    '/kɔːt/',   '/kəʊt/',   '/ɔː/', '/əʊ/'),
  ('tall',    'toll',    '/tɔːl/',   '/təʊl/',   '/ɔː/', '/əʊ/'),
  -- /ʊ/ vs /uː/
  ('book',    'boot',    '/bʊk/',    '/buːt/',   '/ʊ/',  '/uː/'),
  ('pull',    'pool',    '/pʊl/',    '/puːl/',   '/ʊ/',  '/uː/'),
  ('full',    'fool',    '/fʊl/',    '/fuːl/',   '/ʊ/',  '/uː/'),
  -- /uː/ vs /ʊ/
  ('food',    'foot',    '/fuːd/',   '/fʊt/',    '/uː/', '/ʊ/'),
  ('pool',    'pull',    '/puːl/',   '/pʊl/',    '/uː/', '/ʊ/'),
  ('cool',    'could',   '/kuːl/',   '/kʊd/',    '/uː/', '/ʊ/'),
  -- /ʌ/ vs /æ/
  ('cup',     'cap',     '/kʌp/',    '/kæp/',    '/ʌ/',  '/æ/'),
  ('cut',     'cat',     '/kʌt/',    '/kæt/',    '/ʌ/',  '/æ/'),
  ('luck',    'lack',    '/lʌk/',    '/læk/',    '/ʌ/',  '/æ/'),
  -- /ɜː/ vs /ɑː/
  ('bird',    'bard',    '/bɜːd/',   '/bɑːd/',   '/ɜː/', '/ɑː/'),
  ('word',    'ward',    '/wɜːd/',   '/wɔːd/',   '/ɜː/', '/ɔː/'),
  ('hurt',    'heart',   '/hɜːt/',   '/hɑːt/',   '/ɜː/', '/ɑː/'),
  -- /p/ vs /b/
  ('pen',     'ben',     '/pen/',    '/ben/',    '/p/',  '/b/'),
  ('pat',     'bat',     '/pæt/',    '/bæt/',    '/p/',  '/b/'),
  ('pie',     'buy',     '/paɪ/',    '/baɪ/',    '/p/',  '/b/'),
  -- /b/ vs /p/
  ('bat',     'pat',     '/bæt/',    '/pæt/',    '/b/',  '/p/'),
  ('back',    'pack',    '/bæk/',    '/pæk/',    '/b/',  '/p/'),
  ('boat',    'coat',    '/bəʊt/',   '/kəʊt/',   '/b/',  '/k/'),
  -- /t/ vs /d/
  ('ten',     'den',     '/ten/',    '/den/',    '/t/',  '/d/'),
  ('tip',     'dip',     '/tɪp/',    '/dɪp/',    '/t/',  '/d/'),
  ('town',    'down',    '/taʊn/',   '/daʊn/',   '/t/',  '/d/'),
  -- /d/ vs /t/
  ('den',     'ten',     '/den/',    '/ten/',    '/d/',  '/t/'),
  ('dip',     'tip',     '/dɪp/',    '/tɪp/',    '/d/',  '/t/'),
  ('day',     'say',     '/deɪ/',    '/seɪ/',    '/d/',  '/s/'),
  -- /k/ vs /g/
  ('coat',    'goat',    '/kəʊt/',   '/ɡəʊt/',   '/k/',  '/g/'),
  ('cold',    'gold',    '/kəʊld/',  '/ɡəʊld/',  '/k/',  '/g/'),
  ('came',    'game',    '/keɪm/',   '/ɡeɪm/',   '/k/',  '/g/'),
  -- /g/ vs /k/
  ('goat',    'coat',    '/ɡəʊt/',   '/kəʊt/',   '/g/',  '/k/'),
  ('gold',    'cold',    '/ɡəʊld/',  '/kəʊld/',  '/g/',  '/k/'),
  ('go',      'no',      '/ɡəʊ/',    '/nəʊ/',    '/g/',  '/n/'),
  -- /f/ vs /v/
  ('fan',     'van',     '/fæn/',    '/væn/',    '/f/',  '/v/'),
  ('fat',     'vat',     '/fæt/',    '/væt/',    '/f/',  '/v/'),
  ('fine',    'vine',    '/faɪn/',   '/vaɪn/',   '/f/',  '/v/'),
  -- /v/ vs /b/
  ('van',     'ban',     '/væn/',    '/bæn/',    '/v/',  '/b/'),
  ('vat',     'bat',     '/væt/',    '/bæt/',    '/v/',  '/b/'),
  ('vine',    'fine',    '/vaɪn/',   '/faɪn/',   '/v/',  '/f/'),
  -- /θ/ vs /s/
  ('think',   'sink',    '/θɪŋk/',   '/sɪŋk/',   '/θ/',  '/s/'),
  ('thin',    'sin',     '/θɪn/',    '/sɪn/',    '/θ/',  '/s/'),
  ('three',   'free',    '/θriː/',   '/friː/',   '/θ/',  '/f/'),
  -- /ð/ vs /d/
  ('then',    'den',     '/ðen/',    '/den/',    '/ð/',  '/d/'),
  ('those',   'dose',    '/ðəʊz/',   '/dəʊz/',   '/ð/',  '/d/'),
  ('this',    'dis',     '/ðɪs/',    '/dɪs/',    '/ð/',  '/d/'),
  -- /s/ vs /z/
  ('see',     'zee',     '/siː/',    '/ziː/',    '/s/',  '/z/'),
  ('sip',     'zip',     '/sɪp/',    '/zɪp/',    '/s/',  '/z/'),
  ('seal',    'zeal',    '/siːl/',   '/ziːl/',   '/s/',  '/z/'),
  -- /z/ vs /s/
  ('zip',     'sip',     '/zɪp/',    '/sɪp/',    '/z/',  '/s/'),
  ('zeal',    'seal',    '/ziːl/',   '/siːl/',   '/z/',  '/s/'),
  ('buzz',    'bus',     '/bʌz/',    '/bʌs/',    '/z/',  '/s/'),
  -- /ʃ/ vs /s/
  ('she',     'see',     '/ʃiː/',    '/siː/',    '/ʃ/',  '/s/'),
  ('ship',    'sip',     '/ʃɪp/',    '/sɪp/',    '/ʃ/',  '/s/'),
  ('shoe',    'sue',     '/ʃuː/',    '/sjuː/',   '/ʃ/',  '/s/'),
  -- /ʒ/ vs /ʃ/
  ('measure', 'mesher',  '/ˈmeʒə/',  '/ˈmeʃə/',  '/ʒ/',  '/ʃ/'),
  ('leisure', 'lesion',  '/ˈleʒə/',  '/ˈliːʒən/','/ʒ/',  '/ʃ/'),
  ('vision',  'fission', '/ˈvɪʒən/', '/ˈfɪʃən/', '/ʒ/',  '/ʃ/'),
  -- /h/ vs /∅ (no sound) — use a different consonant as 'b' contrast
  ('hat',     'at',      '/hæt/',    '/æt/',     '/h/',  '/ɑː/'),
  ('hit',     'it',      '/hɪt/',    '/ɪt/',     '/h/',  '/ɪ/'),
  ('hot',     'got',     '/hɒt/',    '/ɡɒt/',    '/h/',  '/g/'),
  -- /tʃ/ vs /ʃ/
  ('church',  'shirt',   '/tʃɜːtʃ/', '/ʃɜːt/',   '/tʃ/', '/ʃ/'),
  ('cheap',   'sheep',   '/tʃiːp/',  '/ʃiːp/',   '/tʃ/', '/ʃ/'),
  ('chin',    'shin',    '/tʃɪn/',   '/ʃɪn/',    '/tʃ/', '/ʃ/'),
  -- /dʒ/ vs /tʃ/
  ('gin',     'chin',    '/dʒɪn/',   '/tʃɪn/',   '/dʒ/', '/tʃ/'),
  ('jet',     'yet',     '/dʒet/',   '/jet/',    '/dʒ/', '/j/'),
  ('jam',     'yam',     '/dʒæm/',   '/jæm/',    '/dʒ/', '/j/'),
  -- /m/ vs /n/
  ('man',     'nan',     '/mæn/',    '/næn/',    '/m/',  '/n/'),
  ('meet',    'neat',    '/miːt/',   '/niːt/',   '/m/',  '/n/'),
  ('mail',    'nail',    '/meɪl/',   '/neɪl/',   '/m/',  '/n/'),
  -- /n/ vs /m/
  ('nail',    'mail',    '/neɪl/',   '/meɪl/',   '/n/',  '/m/'),
  ('night',   'might',   '/naɪt/',   '/maɪt/',   '/n/',  '/m/'),
  ('no',      'mo',      '/nəʊ/',    '/məʊ/',    '/n/',  '/m/'),
  -- /ŋ/ vs /n/
  ('sing',    'sin',     '/sɪŋ/',    '/sɪn/',    '/ŋ/',  '/n/'),
  ('ring',    'rin',     '/rɪŋ/',    '/rɪn/',    '/ŋ/',  '/n/'),
  ('bang',    'ban',     '/bæŋ/',    '/bæn/',    '/ŋ/',  '/n/'),
  -- /l/ vs /r/
  ('led',     'red',     '/led/',    '/red/',    '/l/',  '/r/'),
  ('late',    'rate',    '/leɪt/',   '/reɪt/',   '/l/',  '/r/'),
  ('light',   'right',   '/laɪt/',   '/raɪt/',   '/l/',  '/r/'),
  -- /r/ vs /l/
  ('red',     'led',     '/red/',    '/led/',    '/r/',  '/l/'),
  ('rate',    'late',    '/reɪt/',   '/leɪt/',   '/r/',  '/l/'),
  ('rain',    'lane',    '/reɪn/',   '/leɪn/',   '/r/',  '/l/'),
  -- /j/ vs /dʒ/
  ('yam',     'jam',     '/jæm/',    '/dʒæm/',   '/j/',  '/dʒ/'),
  ('yet',     'jet',     '/jet/',    '/dʒet/',   '/j/',  '/dʒ/'),
  ('yes',     'less',    '/jes/',    '/les/',    '/j/',  '/l/'),
  -- /w/ vs /v/
  ('wine',    'vine',    '/waɪn/',   '/vaɪn/',   '/w/',  '/v/'),
  ('west',    'vest',    '/west/',   '/vest/',   '/w/',  '/v/'),
  ('wet',     'yet',     '/wet/',    '/jet/',    '/w/',  '/j/'),
  -- /eɪ/ vs /aɪ/
  ('day',     'die',     '/deɪ/',    '/daɪ/',    '/eɪ/', '/aɪ/'),
  ('late',    'light',   '/leɪt/',   '/laɪt/',   '/eɪ/', '/aɪ/'),
  ('pain',    'pine',    '/peɪn/',   '/paɪn/',   '/eɪ/', '/aɪ/'),
  -- /aɪ/ vs /eɪ/
  ('light',   'late',    '/laɪt/',   '/leɪt/',   '/aɪ/', '/eɪ/'),
  ('time',    'tame',    '/taɪm/',   '/teɪm/',   '/aɪ/', '/eɪ/'),
  ('price',   'place',   '/praɪs/',  '/pleɪs/',  '/aɪ/', '/eɪ/'),
  -- /ɔɪ/ vs /eɪ/
  ('boy',     'bay',     '/bɔɪ/',    '/beɪ/',    '/ɔɪ/', '/eɪ/'),
  ('coin',    'cane',    '/kɔɪn/',   '/keɪn/',   '/ɔɪ/', '/eɪ/'),
  ('oil',     'ale',     '/ɔɪl/',    '/eɪl/',    '/ɔɪ/', '/eɪ/'),
  -- /əʊ/ vs /ɔː/
  ('low',     'law',     '/ləʊ/',    '/lɔː/',    '/əʊ/', '/ɔː/'),
  ('coat',    'caught',  '/kəʊt/',   '/kɔːt/',   '/əʊ/', '/ɔː/'),
  ('go',      'gore',    '/ɡəʊ/',    '/ɡɔː/',    '/əʊ/', '/ɔː/'),
  -- /aʊ/ vs /əʊ/
  ('now',     'no',      '/naʊ/',    '/nəʊ/',    '/aʊ/', '/əʊ/'),
  ('down',    'done',    '/daʊn/',   '/dʌn/',    '/aʊ/', '/ʌ/'),
  ('out',     'oat',     '/aʊt/',    '/əʊt/',    '/aʊ/', '/əʊ/'),
  -- /ɪə/ vs /eə/
  ('here',    'hair',    '/hɪə/',    '/heə/',    '/ɪə/', '/eə/'),
  ('fear',    'fair',    '/fɪə/',    '/feə/',    '/ɪə/', '/eə/'),
  ('ear',     'air',     '/ɪə/',     '/eə/',     '/ɪə/', '/eə/'),
  -- /eə/ vs /ɪə/
  ('fair',    'fear',    '/feə/',    '/fɪə/',    '/eə/', '/ɪə/'),
  ('hair',    'here',    '/heə/',    '/hɪə/',    '/eə/', '/ɪə/'),
  ('bare',    'beer',    '/beə/',    '/bɪə/',    '/eə/', '/ɪə/'),
  -- /ʊə/ vs /ɔː/
  ('tour',    'tor',     '/tʊə/',    '/tɔː/',    '/ʊə/', '/ɔː/'),
  ('pure',    'pore',    '/pjʊə/',   '/pɔː/',    '/ʊə/', '/ɔː/'),
  ('sure',    'shore',   '/ʃʊə/',    '/ʃɔː/',    '/ʊə/', '/ɔː/')
) AS v(word_a, word_b, ipa_a, ipa_b, ca, cb)
JOIN public.sounds sa ON sa.ipa = v.ca
JOIN public.sounds sb ON sb.ipa = v.cb
ON CONFLICT DO NOTHING;
