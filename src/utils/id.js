/**
 * ID generation utilities.
 */

import { v4 as uuidv4 } from 'uuid'

export function generateId() {
  return uuidv4()
}

export function generateShortId() {
  return uuidv4().split('-')[0]
}
