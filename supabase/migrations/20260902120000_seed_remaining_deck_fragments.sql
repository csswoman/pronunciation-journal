-- Seed text_fragments for remaining unseeded decks (C2, Chunks, False Friends, Tech)
-- Ensures 100% of grammar decks have dedicated sentence fragments for practice.

INSERT INTO public.text_fragments (id, content, fragment_type, source, title, user_id)
VALUES
  -- C2 Decks
  ('tf_c2_cambio_1', 'The subtle shift in register requires a thorough mastery of formal syntax.', 'sentence', 'grammar-deck:c2-cambio-registro', 'Cambio de registro', NULL),
  ('tf_c2_cambio_2', 'In high-level diplomacy, word choice dictates the outcome of negotiations.', 'sentence', 'grammar-deck:c2-cambio-registro', 'Cambio de registro', NULL),
  ('tf_c2_concesion_1', 'Be that as it may, we must proceed with caution.', 'sentence', 'grammar-deck:c2-concesion-avanzada', 'Concesión avanzada', NULL),
  ('tf_c2_concesion_2', 'Much as I admire his courage, I cannot support this decision.', 'sentence', 'grammar-deck:c2-concesion-avanzada', 'Concesión avanzada', NULL),
  ('tf_c2_condicionales_1', 'Should you happen to find any errors, please inform us immediately.', 'sentence', 'grammar-deck:c2-condicionales-idiomaticas', 'Condicionales idiomáticas', NULL),
  ('tf_c2_condicionales_2', 'Were it not for your assistance, we would have failed.', 'sentence', 'grammar-deck:c2-condicionales-idiomaticas', 'Condicionales idiomáticas', NULL),
  ('tf_c2_inversion_1', 'Seldom have I seen such dedication to excellence.', 'sentence', 'grammar-deck:c2-inversion-literaria', 'Inversión literaria', NULL),
  ('tf_c2_inversion_2', 'Not until the contract was signed did we celebrate.', 'sentence', 'grammar-deck:c2-inversion-literaria', 'Inversión literaria', NULL),
  ('tf_c2_pasiva_1', 'It is widely believed that the discovery will revolutionize medicine.', 'sentence', 'grammar-deck:c2-pasiva-estilistica', 'Pasiva estilística', NULL),
  ('tf_c2_pasiva_2', 'The proposal is expected to receive unanimous approval.', 'sentence', 'grammar-deck:c2-pasiva-estilistica', 'Pasiva estilística', NULL),

  -- Chunks & Spoken Expressions
  ('tf_chunk_standup_1', 'Yesterday I worked on fixing the database connection issues.', 'sentence', 'grammar-deck:chunk-daily-standup', 'Daily Standup', NULL),
  ('tf_chunk_standup_2', 'Today I plan to deploy the new features to production.', 'sentence', 'grammar-deck:chunk-daily-standup', 'Daily Standup', NULL),
  ('tf_chunk_standup_3', 'I am currently blocked by pending code reviews.', 'sentence', 'grammar-deck:chunk-daily-standup', 'Daily Standup', NULL),
  ('tf_chunk_phrasal_1', 'We need to figure out why the API request is failing.', 'sentence', 'grammar-deck:chunk-phrasal-verbs', 'Phrasal Verbs', NULL),
  ('tf_chunk_phrasal_2', 'She decided to set up a new repository for the project.', 'sentence', 'grammar-deck:chunk-phrasal-verbs', 'Phrasal Verbs', NULL),
  ('tf_chunk_programacion_1', 'The refactored algorithm significantly reduces memory consumption.', 'sentence', 'grammar-deck:chunk-programacion', 'Programación', NULL),
  ('tf_chunk_programacion_2', 'Make sure to handle potential exceptions in the asynchronous loop.', 'sentence', 'grammar-deck:chunk-programacion', 'Programación', NULL),
  ('tf_chunk_uxui_1', 'The user interface should prioritize intuitive visual hierarchy.', 'sentence', 'grammar-deck:chunk-ux-ui', 'UX / UI Design', NULL),
  ('tf_chunk_uxui_2', 'Consistent spacing and clear call-to-action buttons improve usability.', 'sentence', 'grammar-deck:chunk-ux-ui', 'UX / UI Design', NULL),

  -- False Friends (Falsos Amigos)
  ('tf_ff_a1a2_1', 'Actually, I prefer tea over coffee in the morning.', 'sentence', 'grammar-deck:ff-esenciales-a1-a2', 'Falsos Amigos A1-A2', NULL),
  ('tf_ff_a1a2_2', 'Currently, the team is working on the quarterly roadmap.', 'sentence', 'grammar-deck:ff-esenciales-a1-a2', 'Falsos Amigos A1-A2', NULL),
  ('tf_ff_negocios_1', 'He compromised his position by making unrealistic promises.', 'sentence', 'grammar-deck:ff-trabajo-negocios', 'Falsos Amigos Negocios', NULL),
  ('tf_ff_negocios_2', 'We reached a sensible agreement after hours of negotiation.', 'sentence', 'grammar-deck:ff-trabajo-negocios', 'Falsos Amigos Negocios', NULL),

  -- Tech & AI
  ('tf_tech_ai_1', 'Large language models process natural text using transformer layers.', 'sentence', 'grammar-deck:tech-ingles-inteligencia-artificial', 'Inglés e IA', NULL),
  ('tf_tech_ai_2', 'Prompt engineering requires clear context and precise instructions.', 'sentence', 'grammar-deck:tech-ingles-inteligencia-artificial', 'Inglés e IA', NULL)
ON CONFLICT (id) DO NOTHING;
