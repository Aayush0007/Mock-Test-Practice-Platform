/**
 * Sectional timer hook.
 * Uses absolute deadline timestamps to avoid drift.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useTestStore } from '../../../stores/testStore'

export function useTestTimer() {
  const sectionDeadline = useTestStore((s) => s.sectionDeadline)
  const status = useTestStore((s) => s.status)
  const transitionToNextSection = useTestStore((s) => s.transitionToNextSection)

  const [remaining, setRemaining] = useState(0)
  const [isWarning, setIsWarning] = useState(false)
  const intervalRef = useRef(null)
  const transitionedRef = useRef(false)

  const tick = useCallback(() => {
    if (!sectionDeadline || status !== 'active') return

    const now = Date.now()
    const left = Math.max(0, Math.ceil((sectionDeadline - now) / 1000))
    setRemaining(left)
    setIsWarning(left <= 60 && left > 0)

    if (left <= 0 && !transitionedRef.current) {
      transitionedRef.current = true
      transitionToNextSection()
    }
  }, [sectionDeadline, status, transitionToNextSection])

  useEffect(() => {
    transitionedRef.current = false
    tick()

    intervalRef.current = setInterval(tick, 250)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [tick])

  // Reset transition flag when section changes
  useEffect(() => {
    transitionedRef.current = false
  }, [sectionDeadline])

  return { remaining, isWarning }
}
