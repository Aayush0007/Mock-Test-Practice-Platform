/**
 * Answer key matching and validation utilities.
 */

/**
 * Match extracted answer-key entries to questions by number.
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
      matched[question.id] = String(answer).toUpperCase()
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
 * Apply a matched answer map onto question objects (mutates).
 */
export function applyAnswerKey(questions, answerKeyMap) {
  const { matched } = matchAnswerKey(questions, answerKeyMap)
  for (const q of questions) {
    if (matched[q.id]) {
      q.correctAnswer = matched[q.id]
    }
  }
  return questions
}

/**
 * Validate answer labels against available options.
 */
export function validateAnswers(questions) {
  const issues = []

  for (const q of questions) {
    if (!q.correctAnswer) continue

    if (q.options && q.options.length > 0) {
      const labels = q.options.map((o) => String(o.label).toUpperCase())
      const hasRealOptions = q.options.some((o) => (o.text || '').trim().length > 0)
      if (hasRealOptions && !labels.includes(String(q.correctAnswer).toUpperCase())) {
        issues.push({
          questionNumber: q.number,
          message: `Answer "${q.correctAnswer}" is not among options: ${labels.join(', ')}`,
        })
      }
    }
  }

  return issues
}

/**
 * Parse a free-text answer key block into { number: letter }.
 */
export function parseAnswerKeyText(text) {
  const map = {}
  const patterns = [
    /(?:Q\.?\s*)?(\d{1,3})\s*[.):\-–:]\s*([A-Ea-e])\b/gi,
    /(?:^|\s)(\d{1,3})\s+([A-Ea-e])(?:\s|$|,|;)/gm,
  ]

  for (const pattern of patterns) {
    let match
    const re = new RegExp(pattern.source, pattern.flags)
    while ((match = re.exec(text)) !== null) {
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 300 && !map[num]) {
        map[num] = match[2].toUpperCase()
      }
    }
  }

  return map
}
