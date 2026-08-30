export interface FallbackWordEntry {
  ipa: string;
  definition: string;
  example_sentence: string;
  part_of_speech?: string;
}

export const FALLBACK_DEFINITIONS: Record<string, FallbackWordEntry> = {
  quest: {
    ipa: "/kwɛst/",
    part_of_speech: "noun",
    definition: "Búsqueda o expedición en busca de un objetivo importante.",
    example_sentence: "They went on a quest to find the ancient treasure.",
  },
  vivid: {
    ipa: "/ˈvɪv.ɪd/",
    part_of_speech: "adjective",
    definition: "Muy claro, brillante o lleno de vida.",
    example_sentence: "She gave a vivid description of her journey.",
  },
  keen: {
    ipa: "/kiːn/",
    part_of_speech: "adjective",
    definition: "Entusiasta, muy interesado o de percepción aguda.",
    example_sentence: "He is keen to learn new pronunciation patterns.",
  },
  bliss: {
    ipa: "/blɪs/",
    part_of_speech: "noun",
    definition: "Felicidad o satisfacción completa y profunda.",
    example_sentence: "Relaxing with a good book was pure bliss.",
  },
  grit: {
    ipa: "/ɡrɪt/",
    part_of_speech: "noun",
    definition: "Perseverancia, valentía y fuerza de carácter.",
    example_sentence: "Success takes dedication and true grit.",
  },
  bold: {
    ipa: "/boʊld/",
    part_of_speech: "adjective",
    definition: "Valiente, decidido y sin miedo a tomar riesgos.",
    example_sentence: "Taking that first step was a bold decision.",
  },
  calm: {
    ipa: "/kɑːm/",
    part_of_speech: "adjective",
    definition: "Tranquilo, sereno y libre de agitación.",
    example_sentence: "Stay calm and breathe slowly.",
  },
  poise: {
    ipa: "/pɔɪz/",
    part_of_speech: "noun",
    definition: "Elegancia, serenidad y autocontrol bajo presión.",
    example_sentence: "She handled the difficult question with great poise.",
  },
  witty: {
    ipa: "/ˈwɪt.i/",
    part_of_speech: "adjective",
    definition: "Ingenioso, divertido y perspicaz al hablar.",
    example_sentence: "He made a witty remark that made everyone smile.",
  },
  zest: {
    ipa: "/zɛst/",
    part_of_speech: "noun",
    definition: "Gran entusiasmo, energía y gusto por la vida.",
    example_sentence: "She approached every challenge with zest and curiosity.",
  },
  valor: {
    ipa: "/ˈvæl.ər/",
    part_of_speech: "noun",
    definition: "Gran valentía o coraje ante el peligro.",
    example_sentence: "He showed immense valor during the crisis.",
  },
  thrive: {
    ipa: "/θraɪv/",
    part_of_speech: "verb",
    definition: "Prosperar, crecer con éxito y desarrollarse bien.",
    example_sentence: "Students thrive in an encouraging learning environment.",
  },
  muse: {
    ipa: "/mjuːz/",
    part_of_speech: "noun",
    definition: "Fuente de inspiración artística o creativa.",
    example_sentence: "Nature was the painter's greatest muse.",
  },
  flair: {
    ipa: "/flɛər/",
    part_of_speech: "noun",
    definition: "Talento natural, estilo distintivo o habilidad innata.",
    example_sentence: "She has a natural flair for languages.",
  },
  lucid: {
    ipa: "/ˈluː.sɪd/",
    part_of_speech: "adjective",
    definition: "Claro, fácil de entender o con mente despierta.",
    example_sentence: "The teacher gave a lucid explanation of the concept.",
  },
  pragmatic: {
    ipa: "/præɡˈmæt.ɪk/",
    part_of_speech: "adjective",
    definition: "Práctico y orientado a soluciones realistas.",
    example_sentence: "We need a pragmatic approach to solve this issue.",
  },
  resilient: {
    ipa: "/rɪˈzɪl.jənt/",
    part_of_speech: "adjective",
    definition: "Capaz de recuperarse rápidamente de las dificultades.",
    example_sentence: "She remained resilient through every setback.",
  },
  eloquent: {
    ipa: "/ˈɛl.ə.kwənt/",
    part_of_speech: "adjective",
    definition: "Fluido, persuasivo y expresivo al comunicarse.",
    example_sentence: "His speech was powerful and remarkably eloquent.",
  },
  serendipity: {
    ipa: "/ˌsɛr.ənˈdɪp.ɪ.ti/",
    part_of_speech: "noun",
    definition: "Descubrimiento afortunado e inesperado por casualidad.",
    example_sentence: "Finding that helpful book was pure serendipity.",
  },
  ephemeral: {
    ipa: "/ɪˈfɛm.ər.əl/",
    part_of_speech: "adjective",
    definition: "Que dura poco tiempo; pasajero o fugaz.",
    example_sentence: "Morning mist is lovely but ephemeral.",
  },
};
