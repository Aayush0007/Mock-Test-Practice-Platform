/**
 * Examination configuration data.
 * These are initial patterns and should be verified against official notifications.
 * Patterns are versioned so they can change between recruitment cycles.
 */

export const EXAM_CONFIGS = [
  // ==================== SBI ====================
  {
    id: 'sbi-clerk-prelims',
    provider: 'SBI',
    name: 'SBI Clerk',
    stage: 'Prelims',
    version: '2024',
    sections: [
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 30,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'numerical-ability',
        name: 'Numerical Ability',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'reasoning',
        name: 'Reasoning Ability',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
    ],
  },
  {
    id: 'sbi-clerk-mains',
    provider: 'SBI',
    name: 'SBI Clerk',
    stage: 'Mains',
    version: '2024',
    sections: [
      {
        id: 'general-english',
        name: 'General English',
        expectedQuestions: 40,
        durationSeconds: 35 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 50,
        durationSeconds: 45 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'reasoning-computer',
        name: 'Reasoning Ability & Computer Aptitude',
        expectedQuestions: 50,
        durationSeconds: 45 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
      {
        id: 'general-financial',
        name: 'General/Financial Awareness',
        expectedQuestions: 50,
        durationSeconds: 35 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 4,
      },
    ],
  },
  {
    id: 'sbi-po-prelims',
    provider: 'SBI',
    name: 'SBI PO',
    stage: 'Prelims',
    version: '2024',
    sections: [
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 30,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'reasoning',
        name: 'Reasoning Ability',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
    ],
  },
  {
    id: 'sbi-po-mains',
    provider: 'SBI',
    name: 'SBI PO',
    stage: 'Mains',
    version: '2024',
    sections: [
      {
        id: 'reasoning-computer',
        name: 'Reasoning & Computer Aptitude',
        expectedQuestions: 40,
        durationSeconds: 40 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'data-analysis',
        name: 'Data Analysis & Interpretation',
        expectedQuestions: 30,
        durationSeconds: 45 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'general-economy',
        name: 'General/Economy/Banking Awareness',
        expectedQuestions: 50,
        durationSeconds: 35 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 35,
        durationSeconds: 40 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 4,
      },
    ],
  },

  // ==================== IBPS ====================
  {
    id: 'ibps-clerk-prelims',
    provider: 'IBPS',
    name: 'IBPS Clerk',
    stage: 'Prelims',
    version: '2024',
    sections: [
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 30,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'numerical-ability',
        name: 'Numerical Ability',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'reasoning',
        name: 'Reasoning Ability',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
    ],
  },
  {
    id: 'ibps-clerk-mains',
    provider: 'IBPS',
    name: 'IBPS Clerk',
    stage: 'Mains',
    version: '2024',
    sections: [
      {
        id: 'general-english',
        name: 'General English',
        expectedQuestions: 40,
        durationSeconds: 35 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 50,
        durationSeconds: 45 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'reasoning-computer',
        name: 'Reasoning Ability & Computer Aptitude',
        expectedQuestions: 50,
        durationSeconds: 45 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
      {
        id: 'general-financial',
        name: 'General/Financial Awareness',
        expectedQuestions: 50,
        durationSeconds: 35 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 4,
      },
    ],
  },
  {
    id: 'ibps-po-prelims',
    provider: 'IBPS',
    name: 'IBPS PO',
    stage: 'Prelims',
    version: '2024',
    sections: [
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 30,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'reasoning',
        name: 'Reasoning Ability',
        expectedQuestions: 35,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
    ],
  },
  {
    id: 'ibps-po-mains',
    provider: 'IBPS',
    name: 'IBPS PO',
    stage: 'Mains',
    version: '2024',
    sections: [
      {
        id: 'reasoning-computer',
        name: 'Reasoning & Computer Aptitude',
        expectedQuestions: 45,
        durationSeconds: 60 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'general-economy',
        name: 'General/Economy/Banking Awareness',
        expectedQuestions: 40,
        durationSeconds: 35 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 35,
        durationSeconds: 40 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
      {
        id: 'data-analysis',
        name: 'Data Analysis & Interpretation',
        expectedQuestions: 35,
        durationSeconds: 45 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 4,
      },
    ],
  },

  // ==================== IBPS RRB ====================
  {
    id: 'ibps-rrb-clerk-prelims',
    provider: 'IBPS',
    name: 'IBPS RRB Clerk',
    stage: 'Prelims',
    version: '2024',
    sections: [
      {
        id: 'reasoning',
        name: 'Reasoning',
        expectedQuestions: 40,
        durationSeconds: 25 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'numerical-ability',
        name: 'Numerical Ability',
        expectedQuestions: 40,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
    ],
  },
  {
    id: 'ibps-rrb-clerk-mains',
    provider: 'IBPS',
    name: 'IBPS RRB Clerk',
    stage: 'Mains',
    version: '2024',
    sections: [
      {
        id: 'reasoning',
        name: 'Reasoning',
        expectedQuestions: 40,
        durationSeconds: 30 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'computer-knowledge',
        name: 'Computer Knowledge',
        expectedQuestions: 40,
        durationSeconds: 20 * 60,
        positiveMarks: 0.5,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'general-awareness',
        name: 'General Awareness',
        expectedQuestions: 40,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 40,
        durationSeconds: 30 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 4,
      },
      {
        id: 'numerical-ability',
        name: 'Numerical Ability',
        expectedQuestions: 40,
        durationSeconds: 30 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 5,
      },
    ],
  },
  {
    id: 'ibps-rrb-po-prelims',
    provider: 'IBPS',
    name: 'IBPS RRB PO',
    stage: 'Prelims',
    version: '2024',
    sections: [
      {
        id: 'reasoning',
        name: 'Reasoning',
        expectedQuestions: 40,
        durationSeconds: 25 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 40,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 2,
      },
    ],
  },
  {
    id: 'ibps-rrb-po-mains',
    provider: 'IBPS',
    name: 'IBPS RRB PO',
    stage: 'Mains',
    version: '2024',
    sections: [
      {
        id: 'reasoning',
        name: 'Reasoning',
        expectedQuestions: 40,
        durationSeconds: 30 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'computer-knowledge',
        name: 'Computer Knowledge',
        expectedQuestions: 40,
        durationSeconds: 20 * 60,
        positiveMarks: 0.5,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'general-awareness',
        name: 'General Awareness',
        expectedQuestions: 40,
        durationSeconds: 20 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 3,
      },
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 40,
        durationSeconds: 30 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 4,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 40,
        durationSeconds: 30 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 5,
      },
    ],
  },

  // ==================== SSC CGL ====================
  {
    id: 'ssc-cgl-tier1',
    provider: 'SSC',
    name: 'SSC CGL',
    stage: 'Tier 1',
    version: '2024',
    sections: [
      {
        id: 'general-intelligence',
        name: 'General Intelligence & Reasoning',
        expectedQuestions: 25,
        durationSeconds: 15 * 60,
        positiveMarks: 2,
        negativeMarks: 0.5,
        order: 1,
      },
      {
        id: 'general-awareness',
        name: 'General Awareness',
        expectedQuestions: 25,
        durationSeconds: 15 * 60,
        positiveMarks: 2,
        negativeMarks: 0.5,
        order: 2,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 25,
        durationSeconds: 15 * 60,
        positiveMarks: 2,
        negativeMarks: 0.5,
        order: 3,
      },
      {
        id: 'english',
        name: 'English Comprehension',
        expectedQuestions: 25,
        durationSeconds: 15 * 60,
        positiveMarks: 2,
        negativeMarks: 0.5,
        order: 4,
      },
    ],
  },
  {
    id: 'ssc-cgl-tier2',
    provider: 'SSC',
    name: 'SSC CGL',
    stage: 'Tier 2',
    version: '2024',
    sections: [
      {
        id: 'mathematical-abilities',
        name: 'Mathematical Abilities',
        expectedQuestions: 30,
        durationSeconds: 60 * 60,
        positiveMarks: 3,
        negativeMarks: 1,
        order: 1,
      },
      {
        id: 'reasoning-intelligence',
        name: 'Reasoning and General Intelligence',
        expectedQuestions: 30,
        durationSeconds: 60 * 60,
        positiveMarks: 3,
        negativeMarks: 1,
        order: 2,
      },
      {
        id: 'english-language',
        name: 'English Language and Comprehension',
        expectedQuestions: 45,
        durationSeconds: 60 * 60,
        positiveMarks: 3,
        negativeMarks: 1,
        order: 3,
      },
      {
        id: 'general-awareness',
        name: 'General Awareness',
        expectedQuestions: 25,
        durationSeconds: 40 * 60,
        positiveMarks: 3,
        negativeMarks: 1,
        order: 4,
      },
    ],
  },

  // ==================== IBPS SO ====================
  {
    id: 'ibps-so-prelims',
    provider: 'IBPS',
    name: 'IBPS SO',
    stage: 'Prelims',
    version: '2024',
    sections: [
      {
        id: 'english',
        name: 'English Language',
        expectedQuestions: 50,
        durationSeconds: 40 * 60,
        positiveMarks: 0.5,
        negativeMarks: 0.25,
        order: 1,
      },
      {
        id: 'reasoning',
        name: 'Reasoning',
        expectedQuestions: 50,
        durationSeconds: 40 * 60,
        positiveMarks: 0.5,
        negativeMarks: 0.25,
        order: 2,
      },
      {
        id: 'quantitative-aptitude',
        name: 'Quantitative Aptitude',
        expectedQuestions: 50,
        durationSeconds: 40 * 60,
        positiveMarks: 0.5,
        negativeMarks: 0.25,
        order: 3,
      },
    ],
  },
  {
    id: 'ibps-so-mains-it',
    provider: 'IBPS',
    name: 'IBPS SO',
    stage: 'Mains (IT Officer)',
    version: '2024',
    sections: [
      {
        id: 'professional-knowledge',
        name: 'Professional Knowledge',
        expectedQuestions: 60,
        durationSeconds: 45 * 60,
        positiveMarks: 1,
        negativeMarks: 0.25,
        order: 1,
      },
    ],
  },
]

/**
 * Get exam config by ID
 */
export function getExamById(id) {
  return EXAM_CONFIGS.find((exam) => exam.id === id) || null
}

/**
 * Get all unique providers
 */
export function getProviders() {
  return [...new Set(EXAM_CONFIGS.map((e) => e.provider))]
}

/**
 * Get exams by provider
 */
export function getExamsByProvider(provider) {
  return EXAM_CONFIGS.filter((e) => e.provider === provider)
}

/**
 * Calculate total marks for an exam
 */
export function getTotalMarks(examConfig) {
  if (!examConfig?.sections) return 0
  return examConfig.sections.reduce(
    (sum, sec) => sum + sec.expectedQuestions * sec.positiveMarks,
    0
  )
}

/**
 * Calculate total duration in seconds
 */
export function getTotalDuration(examConfig) {
  if (!examConfig?.sections) return 0
  return examConfig.sections.reduce((sum, sec) => sum + sec.durationSeconds, 0)
}
