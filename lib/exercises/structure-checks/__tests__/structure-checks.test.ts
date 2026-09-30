import { describe, expect, it } from 'vitest'
import { checkStructures, STRUCTURE_CHECKS, type StructureCheckId } from '../index'
import { cefrToNumber } from '@/lib/exercises/cefr'

describe('structure-checks', () => {
  it('has valid minLevel for all 26 checks coherent with CEFR scale', () => {
    const ids = Object.keys(STRUCTURE_CHECKS) as StructureCheckId[]
    expect(ids.length).toBe(26)

    for (const id of ids) {
      const check = STRUCTURE_CHECKS[id]
      expect(check).toBeDefined()
      expect(check.labelEs).toBeTruthy()
      expect(check.hintEs).toBeTruthy()
      expect(check.checkEn).toBeTruthy()
      expect(typeof check.test).toBe('function')
      expect(cefrToNumber(check.minLevel)).toBeGreaterThanOrEqual(1)
    }

    // Specific matrix constraints
    expect(cefrToNumber(STRUCTURE_CHECKS.negative_inversion.minLevel)).toBeGreaterThanOrEqual(
      cefrToNumber('B2'),
    )
    expect(cefrToNumber(STRUCTURE_CHECKS.cleft_what.minLevel)).toBeGreaterThanOrEqual(
      cefrToNumber('B2'),
    )
    expect(cefrToNumber(STRUCTURE_CHECKS.cleft_it.minLevel)).toBeGreaterThanOrEqual(
      cefrToNumber('B2'),
    )
    expect(cefrToNumber(STRUCTURE_CHECKS.modal_perfect.minLevel)).toBeGreaterThanOrEqual(
      cefrToNumber('B2'),
    )
  })

  // Table of test cases for each of the 26 checks: [id, [3 positives], [3 negatives]]
  const testCases: [StructureCheckId, string[], string[]][] = [
    [
      'contraction',
      ["I'm a student", "She doesn't know", "We've been there"],
      ['I am a student', 'She does not know', 'We have been there'],
    ],
    [
      'negative',
      ['I do not agree', "She didn't call me", 'They never arrived'],
      ['I agree', 'She called me', 'They arrived early'],
    ],
    [
      'yes_no_question',
      ['Do you like coffee?', 'Are they ready to leave?', 'Can she speak English?'],
      ['You like coffee', 'What do you like?', 'She can speak English'],
    ],
    [
      'wh_question',
      ['What did you see?', 'Where is the library located?', 'Why can she not come?'],
      ['Did you see that?', 'I know what you did', 'The library is here'],
    ],
    [
      'past_simple',
      ['I went to the store yesterday', 'She bought a new house', 'They did not finish in time'],
      ['I go to the store', 'She buys a new house', 'They will finish soon'],
    ],
    [
      'past_continuous',
      ['I was reading a book', 'They were playing outside', "She wasn't working yesterday"],
      ['I read a book', 'They played outside', 'She is working right now'],
    ],
    [
      'present_perfect',
      ['I have seen that movie', "She has already finished", "I've never been to Paris"],
      ['I saw that movie', 'She finishes work', 'I was in Paris yesterday'],
    ],
    [
      'past_perfect',
      ['I had already eaten dinner', 'She had finished before noon', "We hadn't left yet"],
      ['I have eaten dinner', 'She finished before noon', 'We did not leave yet'],
    ],
    [
      'going_to_future',
      ['I am going to travel next week', "He's going to buy a car", 'We are going to start soon'],
      ['I am going to the station', 'He goes to buy bread', 'We travel next week'],
    ],
    [
      'will_future',
      ['I will call you tomorrow', "She'll arrive in ten minutes", "They won't forget"],
      ['I called you yesterday', 'She arrives now', 'They did not forget'],
    ],
    [
      'comparative',
      ['This car is faster than mine', 'She is more intelligent than him', 'Today is as cold as yesterday'],
      ['This is a fast car', 'She is very intelligent', 'Today is very cold'],
    ],
    [
      'superlative',
      ['He is the tallest boy in class', 'It is the most expensive meal', 'That was the best day'],
      ['He is a tall boy', 'It is very expensive', 'That was a good day'],
    ],
    [
      'passive',
      ['The letter was written in English', 'Spanish is spoken here', 'The bridge was built in 1990'],
      ['He wrote the letter in English', 'People speak Spanish here', 'They built the bridge'],
    ],
    [
      'relative_clause',
      ['The man who called you was my uncle', 'The car which I bought is fast', 'The book that you gave me is great'],
      ['The man called you yesterday', 'I bought a fast car', 'You gave me a great book'],
    ],
    [
      'first_conditional',
      ['If it rains, we will stay at home', "I'll call you if I get the job", "If they come, we won't leave"],
      ['When it rained we stayed at home', 'I call you because I got the job', 'They came and we left'],
    ],
    [
      'second_conditional',
      ['If I had more money, I would travel the world', 'If she lived closer, she could visit us', "I'd buy a boat if I were rich"],
      ['If it rains, I will stay', 'Because I had money I traveled', 'I am rich and I bought a boat'],
    ],
    [
      'third_conditional',
      [
        'If I had studied harder, I would have passed the exam',
        'If she had known, she could have helped us',
        'They might have arrived on time if they had taken the train',
      ],
      [
        'If I study, I will pass',
        'If I had money, I would buy it',
        'They took the train and arrived on time',
      ],
    ],
    [
      'mixed_conditional',
      [
        'If I had won the lottery, I would be rich today',
        'If she had taken the medicine, she would feel better now',
        'If I were smarter, I would have answered correctly',
      ],
      [
        'If it rains, I will stay',
        'I won the lottery and I am rich',
        'I studied and I passed',
      ],
    ],
    [
      'wish_past',
      ['I wish I had more free time', 'She wishes he were here with us', 'We wish they lived nearby'],
      ['I hope I have free time', 'I wish you a happy birthday', 'We live nearby'],
    ],
    [
      'wish_past_perfect',
      ['I wish I had studied more for the test', 'She wishes she had not said that', 'They wish they had bought the house'],
      ['I wish I had more time', 'I hope you studied', 'They bought the house yesterday'],
    ],
    [
      'modal_perfect',
      ['You should have told me earlier', 'He could have won the competition', 'They must have left already'],
      ['You should tell me now', 'He can win the competition', 'They must leave immediately'],
    ],
    [
      'reported_speech',
      ['He said that he was tired', 'She told me that the meeting was canceled', 'They asked if we could come'],
      ['He is tired', 'The meeting is canceled', 'Can you come with us?'],
    ],
    [
      'participle_clause',
      ['Having finished his dinner, he went for a walk', 'Walking down the road, she saw an eagle', 'Surrounded by mountains, the village was peaceful'],
      ['He finished his dinner and went for a walk', 'She walked down the road and saw an eagle', 'The village had many mountains'],
    ],
    [
      'negative_inversion',
      ['Never have I seen such beauty', 'Seldom do we witness such events', 'Not only did he arrive late, but he forgot his keys'],
      ['I have never seen such beauty', 'We seldom witness such events', 'He arrived late and forgot his keys'],
    ],
    [
      'cleft_what',
      ['What I need is a vacation', 'What she said was very interesting', 'What we wanted was some advice'],
      ['I really need a vacation', 'She said something interesting', 'We wanted some good advice'],
    ],
    [
      'cleft_it',
      ['It was my brother who called you', 'It was the storm that caused the blackout', "It's the truth that matters most"],
      ['My brother called you yesterday', 'The storm caused the blackout', 'The truth matters most'],
    ],
  ]

  for (const [id, positives, negatives] of testCases) {
    it(`evaluates "${id}" correctly with >=3 positives and >=3 negatives`, () => {
      expect(positives.length).toBeGreaterThanOrEqual(3)
      expect(negatives.length).toBeGreaterThanOrEqual(3)

      for (const pos of positives) {
        const result = checkStructures(pos, [id])
        expect(result.ok, `Expected positive for "${pos}" under check "${id}"`).toBe(true)
        expect(result.missing).toEqual([])
      }

      for (const neg of negatives) {
        const result = checkStructures(neg, [id])
        expect(result.ok, `Expected negative for "${neg}" under check "${id}"`).toBe(false)
        expect(result.missing).toContain(id)
      }
    })
  }

  it('checks multiple structure requirements simultaneously', () => {
    const input = 'What I really need is a friend who speaks English'
    const res = checkStructures(input, ['cleft_what', 'relative_clause'])
    expect(res.ok).toBe(true)
    expect(res.missing).toEqual([])

    const failRes = checkStructures(input, ['cleft_what', 'third_conditional'])
    expect(failRes.ok).toBe(false)
    expect(failRes.missing).toEqual(['third_conditional'])
  })
})
