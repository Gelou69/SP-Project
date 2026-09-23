const roundToTenth = (value) => Number(value.toFixed(1))
const sinDeg = (deg) => Math.sin((deg * Math.PI) / 180)

const makeChoices = (correct, seed) => {
  const values = [
    correct,
    roundToTenth(correct + 3.5 + (seed % 3) * 1.2),
    roundToTenth(correct - 2.6 - ((seed + 1) % 4) * 0.9),
    roundToTenth(correct + 1.4 + ((seed + 2) % 5) * 0.8),
  ]

  const letters = ['A', 'B', 'C', 'D']
  const ordered = [...values]
  const correctIndex = seed % 4
  const mixed = Array.from({ length: 4 }, (_, index) => {
    const targetIndex = (correctIndex + index) % 4
    return {
      letter: letters[index],
      value: ordered[targetIndex],
    }
  })

  return mixed.map((item) => ({
    label: item.letter,
    text: String(item.value).replace(/\.0$/, ''),
  }))
}

const buildQuestion = ({
  id,
  level,
  question_number,
  question_type,
  question_text,
  diagram,
  correctAnswer,
  difficulty,
  topic,
  solution,
  choices,
}) => ({
  id,
  level,
  question_number,
  question_type,
  question_text,
  image_url: `diagram://${diagram}`,
  choice_a: choices[0].text,
  choice_b: choices[1].text,
  choice_c: choices[2].text,
  choice_d: choices[3].text,
  correct_answer: correctAnswer,
  difficulty,
  topic,
  solution,
})

export const LAW_OF_SINES_LEVELS = [
  { id: 'law-sines-level-1', level_number: 1, title: 'Figures', description: 'Identify information from Law of Sines triangle figures.' },
  { id: 'law-sines-level-2', level_number: 2, title: 'Find AC', description: 'Practice finding missing sides and especially side AC.' },
  { id: 'law-sines-level-3', level_number: 3, title: 'Words', description: 'Use the Law of Sines to interpret and reason through word problems.' },
  { id: 'law-sines-level-4', level_number: 4, title: 'Figure Out / Illustration', description: 'Read diagrams and solve for the missing measurement.' },
  { id: 'law-sines-level-5', level_number: 5, title: 'Problem Solving', description: 'Apply the Law of Sines to realistic triangle problems.' },
]

const generateLevelOneQuestions = () => {
  const pairs = []
  for (let i = 0; i < 30; i += 1) {
    const angleA = 30 + ((i * 7) % 18)
    const angleB = 48 + ((i * 11) % 26)
    const sideA = 12 + (i % 11) * 2.6
    const unknown = roundToTenth(sideA * sinDeg(angleB) / sinDeg(angleA))
    const choices = makeChoices(unknown, i + 7)
    const letters = ['A', 'B', 'C', 'D']
    const correctLetter = letters[choices.findIndex((choice) => Number(choice.text) === Number(unknown))] || 'A'

    pairs.push(
      buildQuestion({
        id: `law-level-1-${i + 1}`,
        level: 1,
        question_number: i + 1,
        question_type: 'figure',
        question_text: `In triangle ABC, ∠A = ${angleA}°, ∠B = ${angleB}°, and side a = ${roundToTenth(sideA)}. Find side b.`,
        diagram: `triangle-${1 + (i % 5)}`,
        correctAnswer: correctLetter,
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
        topic: 'Law of Sines Figures',
        solution: `Use b = a × sin(B) / sin(A) = ${roundToTenth(sideA)} × sin(${angleB}°) / sin(${angleA}°) ≈ ${unknown}.`,
        choices,
      })
    )
  }
  return pairs
}

const generateLevelTwoQuestions = () => {
  const pairs = []
  for (let i = 0; i < 30; i += 1) {
    const angleA = 34 + ((i * 5) % 22)
    const angleB = 52 + ((i * 9) % 30)
    const sideBC = 14 + (i % 9) * 3.2
    const unknown = roundToTenth(sideBC * sinDeg(angleB) / sinDeg(angleA))
    const choices = makeChoices(unknown, i + 13)
    const correctLetter = ['A', 'B', 'C', 'D'][choices.findIndex((choice) => Number(choice.text) === Number(unknown))] || 'A'

    pairs.push(
      buildQuestion({
        id: `law-level-2-${i + 1}`,
        level: 2,
        question_number: i + 1,
        question_type: 'find_ac',
        question_text: `Triangle ABC has ∠A = ${angleA}°, ∠B = ${angleB}°, and BC = ${roundToTenth(sideBC)}. Find AC.`,
        diagram: `triangle-${1 + (i % 5)}`,
        correctAnswer: correctLetter,
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
        topic: 'Find AC',
        solution: `Angle C = 180° − A − B = ${180 - angleA - angleB}°. By the Law of Sines, AC = BC × sin(B) / sin(A) ≈ ${unknown}.`,
        choices,
      })
    )
  }
  return pairs
}

const generateLevelThreeQuestions = () => {
  const prompts = [
    'What is the Law of Sines used to determine?',
    'Which equation represents the Law of Sines?',
    'Which side is opposite ∠A?',
    'If side a and angle A are known, which additional information can be used with the Law of Sines?',
    'What does the ambiguous case refer to?',
    'Which measurements are needed to use the Law of Sines?',
    'When two angles are known, which side can you find using the Law of Sines?',
    'What does the ratio a/sin(A) represent?',
    'Which statement best describes the Law of Sines?',
    'In triangle ABC, which side is opposite ∠C?',
  ]

  const answerBank = [
    ['Missing side lengths and angles in a triangle', 'The slope of a line', 'The area of a circle', 'The measure of an arc'],
    ['a/sin(A) = b/sin(B) = c/sin(C)', 'a + b = c', 'A = B + C', 'sin(A) = sin(B)'],
    ['Side a', 'Side b', 'Side c', 'The altitude'],
    ['Another angle or side opposite a known angle', 'Only the perimeter', 'Only the hypotenuse', 'Only the area'],
    ['A situation where two different triangles can fit the given information', 'A triangle with no angles', 'A triangle with equal sides only', 'A right angle triangle'],
    ['At least one angle and the opposite side, or two angles and one side', 'Only the base and height', 'Only three side lengths', 'Only the area'],
    ['The side opposite the known angle', 'The median to the largest side', 'The height from the right angle', 'The angle bisector'],
    ['A constant ratio for the triangle', 'The perimeter ratio', 'The side length sum', 'The volume of the triangle'],
    ['It relates side lengths to the sines of the opposite angles', 'It measures the triangle perimeter', 'It finds the midpoint of a side', 'It compares slopes of lines'],
    ['Side c', 'Side a', 'Side b', 'The median'],
  ]

  return Array.from({ length: 30 }, (_, index) => {
    const promptIndex = index % prompts.length
    const choices = answerBank[promptIndex].map((text, choiceIndex) => ({
      label: ['A', 'B', 'C', 'D'][choiceIndex],
      text,
    }))
    const correctAnswer = ['A', 'B', 'C', 'D'][answerBank[promptIndex].findIndex((text) =>
      [
        'Missing side lengths and angles in a triangle',
        'a/sin(A) = b/sin(B) = c/sin(C)',
        'Side a',
        'Another angle or side opposite a known angle',
        'A situation where two different triangles can fit the given information',
        'At least one angle and the opposite side, or two angles and one side',
        'The side opposite the known angle',
        'A constant ratio for the triangle',
        'It relates side lengths to the sines of the opposite angles',
        'Side c',
      ][promptIndex] === text
    )] || 'A'

    return buildQuestion({
      id: `law-level-3-${index + 1}`,
      level: 3,
      question_number: index + 1,
      question_type: 'word',
      question_text: prompts[promptIndex],
      diagram: `triangle-${1 + (index % 5)}`,
      correctAnswer,
      difficulty: index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard',
      topic: 'Law of Sines Words',
      solution: 'The Law of Sines relates each side length to the sine of its opposite angle in a triangle.',
      choices,
    })
  })
}

function angleCFromAandB(angleA, angleB) {
  return 180 - angleA - angleB
}

const generateLevelFourQuestions = () => {
  const pairs = []
  for (let i = 0; i < 30; i += 1) {
    const angleA = 39 + ((i * 7) % 29)
    const angleC = 58 + ((i * 11) % 25)
    const sideAB = 15 + (i % 8) * 2.4
    const angleB = 180 - angleA - angleC
    const unknown = roundToTenth(sideAB * sinDeg(angleC) / sinDeg(angleB))
    const choices = makeChoices(unknown, i + 17)
    const correctLetter = ['A', 'B', 'C', 'D'][choices.findIndex((choice) => Number(choice.text) === Number(unknown))] || 'A'

    pairs.push(
      buildQuestion({
        id: `law-level-4-${i + 1}`,
        level: 4,
        question_number: i + 1,
        question_type: 'illustration',
        question_text: `Triangle ABC shows ∠A = ${angleA}°, ∠C = ${angleC}°, and AB = ${roundToTenth(sideAB)}. Find BC.`,
        diagram: `triangle-${1 + (i % 5)}`,
        correctAnswer: correctLetter,
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
        topic: 'Figure Out',
        solution: `By the Law of Sines, BC = AB × sin(A) / sin(C) ≈ ${unknown}.`,
        choices,
      })
    )
  }
  return pairs
}

const generateLevelFiveQuestions = () => {
  const scenarios = [
    'A surveyor measured a triangular lot and found angle A = 52° and angle B = 66°. Side a is 18 m. Find side b.',
    'A lighthouse is observed from two positions. The angle at the lighthouse is 48°, and the opposite side is 26 km. Find the missing side.',
    'A boat is tracked from two coastal points. The triangle formed has angles 44° and 61°. The known side is 28 km. Find the unknown side.',
    'A mountain trail forms a triangular path between two viewpoints and a summit. The known side is 29 m and angles are 47° and 68°. Find the missing side.',
    'A pilot measures a triangle between two airstrips and a mountain peak. One side is 32 km and the angles are 41° and 57°. Find the missing distance.',
  ]

  return Array.from({ length: 30 }, (_, index) => {
    const angleA = 40 + ((index * 9) % 24)
    const angleB = 50 + ((index * 11) % 30)
    const sideA = 18 + (index % 8) * 3.1
    const unknown = roundToTenth(sideA * sinDeg(angleB) / sinDeg(angleA))
    const choices = makeChoices(unknown, index + 19)
    const correctLetter = ['A', 'B', 'C', 'D'][choices.findIndex((choice) => Number(choice.text) === Number(unknown))] || 'A'

    return buildQuestion({
      id: `law-level-5-${index + 1}`,
      level: 5,
      question_number: index + 1,
      question_type: 'problem',
      question_text: scenarios[index % scenarios.length].replace('a', 'known side').replace('b', 'missing side'),
      diagram: `triangle-${1 + (index % 5)}`,
      correctAnswer: correctLetter,
      difficulty: index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard',
      topic: 'Problem Solving',
      solution: `Use the Law of Sines with the given side and opposite angle. The missing side is approximately ${unknown}.`,
      choices,
    })
  })
}

export const LAW_OF_SINES_QUESTIONS = [
  ...generateLevelOneQuestions(),
  ...generateLevelTwoQuestions(),
  ...generateLevelThreeQuestions(),
  ...generateLevelFourQuestions(),
  ...generateLevelFiveQuestions(),
]

export const LEVELS_BY_NUMBER = Object.fromEntries(
  LAW_OF_SINES_LEVELS.map((level) => [level.level_number, level])
)

export const LEVELS_BY_ID = Object.fromEntries(
  LAW_OF_SINES_LEVELS.map((level) => [level.id, level])
)
