/**
 * Answer key matching utilities.
 */

/**
 * Match extracted answer key entries to questions by number.
 * Returns a map of questionId -> answer letter, plus unmatched entries.
 */
export function matchAnswerKey(questions, answerKeyMap) {
  const matched = {}
  const unmatched = []
  const missing = []

  const byNumber = {}
  for (const q of questions) {
    byNumber[q.number] = q
  }

  for (const [numStr, answer] of Object.entries(answerKeyMap)) {
    const num = parseInt(numStr, 10)
    const question = byNumber[num]
    if (question) {
      matched[question.id] = answer.toUpperCase()
    } else {
      unmatched.push({ number: num, answer })
    }
  }

  for (const q of questions) {
    if (!matched[q.id] && !q.correctAnswer) {
      missing.push(q.number)
    }
  }

  return { matched, unmatched, missing }
}

/**
 * Validate answer labels against available options.
 */
export function validateAnswers(questions) {
  const issues = []

  for (const q of questions) {
    if (!q.correctAnswer) continue

    if (q.options && q.options.length > 0) {
      const labels = q.options.map((o) => o.label.toUpperCase())
      if (!labels.includes(q.correctAnswer.toUpperCase())) {
        issues.push({
          questionNumber: q.number,
          message: `Answer "${q.correctAnswer}" is not among options: ${labels.join(', ')}`,
        })
      }
    }
  }

  return issues
}
