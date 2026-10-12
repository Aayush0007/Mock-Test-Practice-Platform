/**
 * Browser activity monitoring for anti-cheating.
 * Detects tab visibility changes and window focus loss.
 * Avoids double-counting a single incident.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useTestStore } from '../../../stores/testStore'

export function useActivityMonitor({ enabled = true, onWarning } = {}) {
  const status = useTestStore((s) => s.status)
  const recordWarning = useTestStore((s) => s.recordWarning)
  const warningCount = useTestStore((s) => s.warningCount)

  const lastEventRef = useRef(0)
  const DEBOUNCE_MS = 1500 // Ignore events within 1.5s of each other

  const handleViolation = useCallback(
    (type) => {
      if (status !== 'active') return

      const now = Date.now()
      if (now - lastEventRef.current < DEBOUNCE_MS) return
      lastEventRef.current = now

      const count = recordWarning({ type })
      if (onWarning) onWarning(count)
    },
    [status, recordWarning, onWarning]
  )

  useEffect(() => {
    if (!enabled || status !== 'active') return

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('tab_switch')
      }
    }

    const onBlur = () => {
      // Only count if document is still visible (window lost focus, not tab switch)
      if (!document.hidden) {
        handleViolation('window_blur')
      }
    }

    // Block context menu
    const onContextMenu = (e) => {
      e.preventDefault()
    }

    // Block common shortcuts
    const onKeyDown = (e) => {
      // Ctrl/Cmd + C, V, X, A, U, S, P
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a', 'u', 's', 'p'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault()
      }
      // F12, Ctrl+Shift+I/J/C
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [enabled, status, handleViolation])

  return { warningCount }
}
