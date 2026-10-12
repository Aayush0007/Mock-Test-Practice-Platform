/**
 * IndexedDB storage layer using idb.
 * Stores tests, attempts, images, and activity logs.
 */

import { openDB } from 'idb'

const DB_NAME = 'mock-test-platform'
const DB_VERSION = 1

const STORES = {
  TESTS: 'tests',
  ATTEMPTS: 'attempts',
  IMAGES: 'images',
  SETTINGS: 'settings',
}

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tests store
        if (!db.objectStoreNames.contains(STORES.TESTS)) {
          const testStore = db.createObjectStore(STORES.TESTS, { keyPath: 'id' })
          testStore.createIndex('createdAt', 'createdAt')
          testStore.createIndex('examId', 'examId')
          testStore.createIndex('status', 'status')
        }

        // Attempts store
        if (!db.objectStoreNames.contains(STORES.ATTEMPTS)) {
          const attemptStore = db.createObjectStore(STORES.ATTEMPTS, { keyPath: 'id' })
          attemptStore.createIndex('testId', 'testId')
          attemptStore.createIndex('completedAt', 'completedAt')
        }

        // Images store (for extracted diagrams, charts, etc.)
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          db.createObjectStore(STORES.IMAGES, { keyPath: 'id' })
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// ==================== TESTS ====================

export async function saveTest(test) {
  const db = await getDB()
  await db.put(STORES.TESTS, {
    ...test,
    updatedAt: new Date().toISOString(),
  })
  return test
}

export async function getTest(id) {
  const db = await getDB()
  return db.get(STORES.TESTS, id)
}

export async function getAllTests() {
  const db = await getDB()
  return db.getAllFromIndex(STORES.TESTS, 'createdAt')
}

export async function deleteTest(id) {
  const db = await getDB()
  // Also delete related attempts and images
  const attempts = await getAttemptsByTestId(id)
  for (const attempt of attempts) {
    await db.delete(STORES.ATTEMPTS, attempt.id)
  }
  await db.delete(STORES.TESTS, id)
}

export async function getTestCount() {
  const db = await getDB()
  return db.count(STORES.TESTS)
}

// ==================== ATTEMPTS ====================

export async function saveAttempt(attempt) {
  const db = await getDB()
  await db.put(STORES.ATTEMPTS, {
    ...attempt,
    updatedAt: new Date().toISOString(),
  })
  return attempt
}

export async function getAttempt(id) {
  const db = await getDB()
  return db.get(STORES.ATTEMPTS, id)
}

export async function getAttemptsByTestId(testId) {
  const db = await getDB()
  return db.getAllFromIndex(STORES.ATTEMPTS, 'testId', testId)
}

export async function getAllAttempts() {
  const db = await getDB()
  return db.getAllFromIndex(STORES.ATTEMPTS, 'completedAt')
}

export async function deleteAttempt(id) {
  const db = await getDB()
  await db.delete(STORES.ATTEMPTS, id)
}

export async function getAttemptCount() {
  const db = await getDB()
  return db.count(STORES.ATTEMPTS)
}

// ==================== IMAGES ====================

export async function saveImage(image) {
  const db = await getDB()
  await db.put(STORES.IMAGES, image)
  return image
}

export async function getImage(id) {
  const db = await getDB()
  return db.get(STORES.IMAGES, id)
}

export async function deleteImage(id) {
  const db = await getDB()
  await db.delete(STORES.IMAGES, id)
}

// ==================== SETTINGS ====================

export async function getSetting(key, defaultValue = null) {
  const db = await getDB()
  const result = await db.get(STORES.SETTINGS, key)
  return result ? result.value : defaultValue
}

export async function setSetting(key, value) {
  const db = await getDB()
  await db.put(STORES.SETTINGS, { key, value })
}

// ==================== STATS ====================

export async function getDashboardStats() {
  const tests = await getAllTests()
  const attempts = await getAllAttempts()

  const completedAttempts = attempts.filter((a) => a.status === 'completed')

  let totalScore = 0
  let totalMaxMarks = 0
  let totalCorrect = 0
  let totalAttempted = 0
  let bestScore = 0
  let totalTimeSpent = 0

  for (const attempt of completedAttempts) {
    if (attempt.result) {
      totalScore += attempt.result.score || 0
      totalMaxMarks += attempt.result.maxMarks || 0
      totalCorrect += attempt.result.correct || 0
      totalAttempted += attempt.result.attempted || 0
      totalTimeSpent += attempt.result.timeSpent || 0
      if ((attempt.result.percentage || 0) > bestScore) {
        bestScore = attempt.result.percentage
      }
    }
  }

  const avgScore =
    completedAttempts.length > 0 && totalMaxMarks > 0
      ? (totalScore / totalMaxMarks) * 100
      : 0

  const avgAccuracy =
    totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0

  const avgTimePerQuestion =
    totalAttempted > 0 ? totalTimeSpent / totalAttempted : 0

  return {
    totalTests: tests.length,
    totalAttempts: completedAttempts.length,
    averageScore: Math.round(avgScore * 10) / 10,
    bestScore: Math.round(bestScore * 10) / 10,
    averageAccuracy: Math.round(avgAccuracy * 10) / 10,
    averageTimePerQuestion: Math.round(avgTimePerQuestion),
    recentTests: tests.slice(-5).reverse(),
    recentAttempts: completedAttempts.slice(-5).reverse(),
  }
}

/**
 * Clear all data (for testing / user request)
 */
export async function clearAllData() {
  const db = await getDB()
  await db.clear(STORES.TESTS)
  await db.clear(STORES.ATTEMPTS)
  await db.clear(STORES.IMAGES)
}
