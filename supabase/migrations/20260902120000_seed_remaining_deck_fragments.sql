-- Seed text_fragments for remaining unseeded decks (C2, Chunks, False Friends, Tech)
-- Ensures 100% of grammar decks have dedicated sentence fragments for practice.

INSERT INTO public.text_fragments (content, fragment_type, source, title, user_id)
VALUES
  -- C2 Decks
  ('The subtle shift in register requires a thorough mastery of formal syntax.', 'sentence', 'grammar-deck:c2-cambio-registro', 'Cambio de registro', NULL),
  ('In high-level diplomacy, word choice dictates the outcome of negotiations.', 'sentence', 'grammar-deck:c2-cambio-registro', 'Cambio de registro', NULL),
  ('Be that as it may, we must proceed with caution.', 'sentence', 'grammar-deck:c2-concesion-avanzada', 'Concesión avanzada', NULL),
  ('Much as I admire his courage, I cannot support this decision.', 'sentence', 'grammar-deck:c2-concesion-avanzada', 'Concesión avanzada', NULL),
  ('Should you happen to find any errors, please inform us immediately.', 'sentence', 'grammar-deck:c2-condicionales-idiomaticas', 'Condicionales idiomáticas', NULL),
  ('Were it not for your assistance, we would have failed.', 'sentence', 'grammar-deck:c2-condicionales-idiomaticas', 'Condicionales idiomáticas', NULL),
  ('Seldom have I seen such dedication to excellence.', 'sentence', 'grammar-deck:c2-inversion-literaria', 'Inversión literaria', NULL),
  ('Not until the contract was signed did we celebrate.', 'sentence', 'grammar-deck:c2-inversion-literaria', 'Inversión literaria', NULL),
  ('It is widely believed that the discovery will revolutionize medicine.', 'sentence', 'grammar-deck:c2-pasiva-estilistica', 'Pasiva estilística', NULL),
  ('The proposal is expected to receive unanimous approval.', 'sentence', 'grammar-deck:c2-pasiva-estilistica', 'Pasiva estilística', NULL),

  -- Chunks & Spoken Expressions
  ('Yesterday I worked on fixing the database connection issues.', 'sentence', 'grammar-deck:chunk-daily-standup', 'Daily Standup', NULL),
  ('Today I plan to deploy the new features to production.', 'sentence', 'grammar-deck:chunk-daily-standup', 'Daily Standup', NULL),
  ('I am currently blocked by pending code reviews.', 'sentence', 'grammar-deck:chunk-daily-standup', 'Daily Standup', NULL),
  ('We need to figure out why the API request is failing.', 'sentence', 'grammar-deck:chunk-phrasal-verbs', 'Phrasal Verbs', NULL),
  ('She decided to set up a new repository for the project.', 'sentence', 'grammar-deck:chunk-phrasal-verbs', 'Phrasal Verbs', NULL),
  ('The refactored algorithm significantly reduces memory consumption.', 'sentence', 'grammar-deck:chunk-programacion', 'Programación', NULL),
  ('Make sure to handle potential exceptions in the asynchronous loop.', 'sentence', 'grammar-deck:chunk-programacion', 'Programación', NULL),
  ('The user interface should prioritize intuitive visual hierarchy.', 'sentence', 'grammar-deck:chunk-ux-ui', 'UX / UI Design', NULL),
  ('Consistent spacing and clear call-to-action buttons improve usability.', 'sentence', 'grammar-deck:chunk-ux-ui', 'UX / UI Design', NULL),

  -- False Friends (Falsos Amigos)
  ('Actually, I prefer tea over coffee in the morning.', 'sentence', 'grammar-deck:ff-esenciales-a1-a2', 'Falsos Amigos A1-A2', NULL),
  ('Currently, the team is working on the quarterly roadmap.', 'sentence', 'grammar-deck:ff-esenciales-a1-a2', 'Falsos Amigos A1-A2', NULL),
  ('He compromised his position by making unrealistic promises.', 'sentence', 'grammar-deck:ff-trabajo-negocios', 'Falsos Amigos Negocios', NULL),
  ('We reached a sensible agreement after hours of negotiation.', 'sentence', 'grammar-deck:ff-trabajo-negocios', 'Falsos Amigos Negocios', NULL),

  -- Tech & AI
  ('Large language models process natural text using transformer layers.', 'sentence', 'grammar-deck:tech-ingles-inteligencia-artificial', 'Inglés e IA', NULL),
  ('Prompt engineering requires clear context and precise instructions.', 'sentence', 'grammar-deck:tech-ingles-inteligencia-artificial', 'Inglés e IA', NULL)
ON CONFLICT DO NOTHING;
