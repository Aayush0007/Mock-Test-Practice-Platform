/**
 * Seed a demo test so the app is immediately usable without a PDF.
 * Call once from the Dashboard if no tests exist.
 */

import { saveTest, getTestCount } from '../services/storage/db'
import { generateId } from './id'
import { getExamById } from '../config/exams'

const DEMO_QUESTIONS = [
  {
    number: 1,
    text: 'The synonym of "Benevolent" is:',
    options: [
      { label: 'A', text: 'Cruel' },
      { label: 'B', text: 'Kind' },
      { label: 'C', text: 'Hostile' },
      { label: 'D', text: 'Indifferent' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 2,
    text: 'Choose the correctly spelt word:',
    options: [
      { label: 'A', text: 'Accomodation' },
      { label: 'B', text: 'Acommodation' },
      { label: 'C', text: 'Accommodation' },
      { label: 'D', text: 'Acomodation' },
    ],
    correctAnswer: 'C',
  },
  {
    number: 3,
    text: 'Find the odd one out: Apple, Mango, Potato, Banana',
    options: [
      { label: 'A', text: 'Apple' },
      { label: 'B', text: 'Mango' },
      { label: 'C', text: 'Potato' },
      { label: 'D', text: 'Banana' },
    ],
    correctAnswer: 'C',
  },
  {
    number: 4,
    text: 'If 15% of a number is 45, what is 40% of the same number?',
    options: [
      { label: 'A', text: '100' },
      { label: 'B', text: '120' },
      { label: 'C', text: '140' },
      { label: 'D', text: '160' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 5,
    text: 'The average of 5 consecutive numbers is 20. What is the largest number?',
    options: [
      { label: 'A', text: '18' },
      { label: 'B', text: '20' },
      { label: 'C', text: '22' },
      { label: 'D', text: '24' },
    ],
    correctAnswer: 'C',
  },
  {
    number: 6,
    text: 'A train 120 m long passes a pole in 6 seconds. What is its speed in km/h?',
    options: [
      { label: 'A', text: '60' },
      { label: 'B', text: '72' },
      { label: 'C', text: '80' },
      { label: 'D', text: '90' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 7,
    text: 'In a certain code, "CAT" is written as "XZG". How is "DOG" written?',
    options: [
      { label: 'A', text: 'WLT' },
      { label: 'B', text: 'WLD' },
      { label: 'C', text: 'WLT' },
      { label: 'D', text: 'WLG' },
    ],
    correctAnswer: 'A',
  },
  {
    number: 8,
    text: 'If all roses are flowers and some flowers fade quickly, which is true?',
    options: [
      { label: 'A', text: 'All roses fade quickly' },
      { label: 'B', text: 'Some roses may fade quickly' },
      { label: 'C', text: 'No roses fade quickly' },
      { label: 'D', text: 'All flowers are roses' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 9,
    text: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
    options: [
      { label: 'A', text: '40' },
      { label: 'B', text: '42' },
      { label: 'C', text: '44' },
      { label: 'D', text: '46' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 10,
    text: 'Which of the following is a prime number?',
    options: [
      { label: 'A', text: '91' },
      { label: 'B', text: '87' },
      { label: 'C', text: '97' },
      { label: 'D', text: '93' },
    ],
    correctAnswer: 'C',
  },
]

export async function seedDemoTestIfEmpty() {
  const count = await getTestCount()
  if (count > 0) return false

  const exam = getExamById('ibps-clerk-prelims')
  if (!exam) return false

  // Use shortened sections for demo (5 min each, fewer questions)
  const sections = exam.sections.map((sec, idx) => ({
    id: sec.id,
    name: sec.name,
    order: sec.order,
    durationSeconds: 5 * 60, // 5 minutes for demo
    expectedQuestions: sec.expectedQuestions,
    actualQuestions: idx === 0 ? 3 : idx === 1 ? 4 : 3,
    positiveMarks: sec.positiveMarks,
    negativeMarks: sec.negativeMarks,
    maxMarks: (idx === 0 ? 3 : idx === 1 ? 4 : 3) * sec.positiveMarks,
  }))

  // Distribute questions
  const questions = DEMO_QUESTIONS.map((q, idx) => {
    let sectionId
    if (idx < 3) sectionId = sections[0].id
    else if (idx < 7) sectionId = sections[1].id
    else sectionId = sections[2].id

    const sec = sections.find((s) => s.id === sectionId)
    return {
      id: generateId(),
      number: q.number,
      sectionId,
      text: q.text,
      type: 'mcq',
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: null,
      positiveMarks: sec.positiveMarks,
      negativeMarks: sec.negativeMarks,
      validationStatus: 'ok',
    }
  })

  const test = {
    id: generateId(),
    title: 'Demo — IBPS Clerk Prelims (Sample)',
    examId: exam.id,
    examName: exam.name,
    examStage: exam.stage,
    provider: exam.provider,
    createdAt: new Date().toISOString(),
    sourceFileName: 'demo',
    sections,
    questions,
    totalQuestions: questions.length,
    maxMarks: questions.reduce((s, q) => s + q.positiveMarks, 0),
    answerKeyStatus: 'complete',
    parsingWarnings: [],
    status: 'ready',
    isDemo: true,
  }

  await saveTest(test)
  return true
}
