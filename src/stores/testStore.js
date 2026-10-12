/**
 * Active test session state.
 * This is the single source of truth during an active attempt.
 */

import { create } from 'zustand'

export const useTestStore = create((set, get) => ({
  // Session metadata
  attemptId: null,
  testId: null,
  test: null, // full test definition
  status: 'idle', // idle | instructions | active | transitioning | submitted

  // Current position
  currentSectionIndex: 0,
  currentQuestionIndex: 0, // index within current section

  // Responses (questionId -> answer letter)
  responses: {},
  // Temporary selection (not yet saved)
  tempSelection: null,

  // Tracking
  visited: [], // question IDs
  markedForReview: [], // question IDs
  questionTimings: {}, // questionId -> seconds spent
  sectionTimings: {}, // sectionId -> { startedAt, endedAt, used }

  // Timer
  sectionDeadline: null, // absolute timestamp (ms)
  warningCount: 0,
  activityLog: [],

  // Submission
  submissionReason: null, // 'completed' | 'timeout' | 'activity_violation'
  result: null,

  // ==================== ACTIONS ====================

  /**
   * Initialize a new attempt
   */
  startAttempt: ({ attemptId, test }) => {
    const firstSection = test.sections[0]
    const now = Date.now()

    set({
      attemptId,
      testId: test.id,
      test,
      status: 'active',
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      responses: {},
      tempSelection: null,
      visited: [],
      markedForReview: [],
      questionTimings: {},
      sectionTimings: {
        [firstSection.id]: { startedAt: now, used: 0 },
      },
      sectionDeadline: now + firstSection.durationSeconds * 1000,
      warningCount: 0,
      activityLog: [],
      submissionReason: null,
      result: null,
    })
  },

  /**
   * Mark a question as visited
   */
  markVisited: (questionId) => {
    const { visited } = get()
    if (!visited.includes(questionId)) {
      set({ visited: [...visited, questionId] })
    }
  },

  /**
   * Set temporary selection (before Save & Next)
   */
  setTempSelection: (option) => {
    set({ tempSelection: option })
  },

  /**
   * Clear temporary selection
   */
  clearTempSelection: () => {
    set({ tempSelection: null })
  },

  /**
   * Save answer and optionally mark for review, then move to next
   */
  saveAndNext: ({ markForReview = false } = {}) => {
    const state = get()
    const { test, currentSectionIndex, currentQuestionIndex, tempSelection, responses, markedForReview } = state

    const section = test.sections[currentSectionIndex]
    const sectionQuestions = test.questions
      .filter((q) => q.sectionId === section.id)
      .sort((a, b) => a.number - b.number)

    const currentQ = sectionQuestions[currentQuestionIndex]
    if (!currentQ) return

    // Commit temp selection if present
    const newResponses = { ...responses }
    if (tempSelection !== null) {
      newResponses[currentQ.id] = tempSelection
    }

    // Mark for review
    let newMarked = [...markedForReview]
    if (markForReview) {
      if (!newMarked.includes(currentQ.id)) {
        newMarked.push(currentQ.id)
      }
    }

    // Determine next question index
    let nextIndex = currentQuestionIndex + 1
    if (nextIndex >= sectionQuestions.length) {
      // Stay on last question of section (section change is timer-driven)
      nextIndex = currentQuestionIndex
    }

    set({
      responses: newResponses,
      markedForReview: newMarked,
      tempSelection: null,
      currentQuestionIndex: nextIndex,
    })

    // Mark next as visited
    if (nextIndex !== currentQuestionIndex && sectionQuestions[nextIndex]) {
      get().markVisited(sectionQuestions[nextIndex].id)
    }
  },

  /**
   * Clear response for current question
   */
  clearResponse: () => {
    const state = get()
    const { test, currentSectionIndex, currentQuestionIndex, responses } = state
    const section = test.sections[currentSectionIndex]
    const sectionQuestions = test.questions
      .filter((q) => q.sectionId === section.id)
      .sort((a, b) => a.number - b.number)
    const currentQ = sectionQuestions[currentQuestionIndex]
    if (!currentQ) return

    const newResponses = { ...responses }
    delete newResponses[currentQ.id]

    set({
      responses: newResponses,
      tempSelection: null,
    })
  },

  /**
   * Navigate to a specific question within the current section
   */
  goToQuestion: (indexInSection) => {
    const state = get()
    const { test, currentSectionIndex, responses, tempSelection } = state
    const section = test.sections[currentSectionIndex]
    const sectionQuestions = test.questions
      .filter((q) => q.sectionId === section.id)
      .sort((a, b) => a.number - b.number)

    if (indexInSection < 0 || indexInSection >= sectionQuestions.length) return

    // Discard unsaved temp selection when navigating away
    const currentQ = sectionQuestions[state.currentQuestionIndex]
    if (currentQ) {
      get().markVisited(currentQ.id)
    }

    const nextQ = sectionQuestions[indexInSection]
    get().markVisited(nextQ.id)

    // Restore saved answer as temp selection for display
    const saved = responses[nextQ.id] ?? null

    set({
      currentQuestionIndex: indexInSection,
      tempSelection: saved,
    })
  },

  /**
   * Toggle mark for review on current question
   */
  toggleMarkForReview: () => {
    const state = get()
    const { test, currentSectionIndex, currentQuestionIndex, markedForReview } = state
    const section = test.sections[currentSectionIndex]
    const sectionQuestions = test.questions
      .filter((q) => q.sectionId === section.id)
      .sort((a, b) => a.number - b.number)
    const currentQ = sectionQuestions[currentQuestionIndex]
    if (!currentQ) return

    let newMarked = [...markedForReview]
    if (newMarked.includes(currentQ.id)) {
      newMarked = newMarked.filter((id) => id !== currentQ.id)
    } else {
      newMarked.push(currentQ.id)
    }
    set({ markedForReview: newMarked })
  },

  /**
   * Transition to next section (called by timer)
   */
  transitionToNextSection: () => {
    const state = get()
    const { test, currentSectionIndex, sectionTimings } = state
    const currentSection = test.sections[currentSectionIndex]
    const now = Date.now()

    // Close current section timing
    const updatedTimings = {
      ...sectionTimings,
      [currentSection.id]: {
        ...sectionTimings[currentSection.id],
        endedAt: now,
        used: Math.floor(
          (now - (sectionTimings[currentSection.id]?.startedAt || now)) / 1000
        ),
      },
    }

    const nextIndex = currentSectionIndex + 1
    if (nextIndex >= test.sections.length) {
      // Final section ended → submit
      set({
        sectionTimings: updatedTimings,
        status: 'submitted',
        submissionReason: 'timeout',
      })
      return
    }

    const nextSection = test.sections[nextIndex]
    set({
      currentSectionIndex: nextIndex,
      currentQuestionIndex: 0,
      tempSelection: null,
      sectionTimings: {
        ...updatedTimings,
        [nextSection.id]: { startedAt: now, used: 0 },
      },
      sectionDeadline: now + nextSection.durationSeconds * 1000,
      status: 'active',
    })

    // Mark first question of new section as visited
    const firstQ = test.questions
      .filter((q) => q.sectionId === nextSection.id)
      .sort((a, b) => a.number - b.number)[0]
    if (firstQ) get().markVisited(firstQ.id)
  },

  /**
   * Record an activity warning
   */
  recordWarning: (event) => {
    const state = get()
    const newCount = state.warningCount + 1
    const logEntry = {
      type: event.type || 'visibility_change',
      timestamp: new Date().toISOString(),
      sectionIndex: state.currentSectionIndex,
      questionIndex: state.currentQuestionIndex,
      warningCount: newCount,
      action: newCount >= 6 ? 'auto_submit' : 'warning',
    }

    const updates = {
      warningCount: newCount,
      activityLog: [...state.activityLog, logEntry],
    }

    if (newCount >= 6) {
      updates.status = 'submitted'
      updates.submissionReason = 'activity_violation'
    }

    set(updates)
    return newCount
  },

  /**
   * Add time spent on a question
   */
  addQuestionTime: (questionId, seconds) => {
    const { questionTimings } = get()
    set({
      questionTimings: {
        ...questionTimings,
        [questionId]: (questionTimings[questionId] || 0) + seconds,
      },
    })
  },

  /**
   * Finalize and store result
   */
  setResult: (result) => {
    set({ result, status: 'submitted' })
  },

  /**
   * Reset store
   */
  reset: () => {
    set({
      attemptId: null,
      testId: null,
      test: null,
      status: 'idle',
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      responses: {},
      tempSelection: null,
      visited: [],
      markedForReview: [],
      questionTimings: {},
      sectionTimings: {},
      sectionDeadline: null,
      warningCount: 0,
      activityLog: [],
      submissionReason: null,
      result: null,
    })
  },

  // ==================== SELECTORS ====================

  getCurrentSection: () => {
    const { test, currentSectionIndex } = get()
    if (!test) return null
    return test.sections[currentSectionIndex]
  },

  getCurrentSectionQuestions: () => {
    const { test, currentSectionIndex } = get()
    if (!test) return []
    const section = test.sections[currentSectionIndex]
    return test.questions
      .filter((q) => q.sectionId === section.id)
      .sort((a, b) => a.number - b.number)
  },

  getCurrentQuestion: () => {
    const questions = get().getCurrentSectionQuestions()
    const { currentQuestionIndex } = get()
    return questions[currentQuestionIndex] || null
  },

  getQuestionStatus: (questionId) => {
    const { responses, visited, markedForReview } = get()
    const hasAnswer = responses[questionId] != null
    const isVisited = visited.includes(questionId)
    const isMarked = markedForReview.includes(questionId)

    if (hasAnswer && isMarked) return 'answered-marked'
    if (hasAnswer) return 'answered'
    if (isMarked) return 'marked'
    if (isVisited) return 'not-answered'
    return 'not-visited'
  },
}))
