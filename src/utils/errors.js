/**
 * Custom error classes and error handling utilities.
 */

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN', details = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

export class PDFParseError extends AppError {
  constructor(message, details = null) {
    super(message, 'PDF_PARSE_ERROR', details)
    this.name = 'PDFParseError'
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class StorageError extends AppError {
  constructor(message, details = null) {
    super(message, 'STORAGE_ERROR', details)
    this.name = 'StorageError'
  }
}

/**
 * Get a user-friendly error message
 */
export function getErrorMessage(error) {
  if (error instanceof AppError) {
    return error.message
  }
  if (error?.name === 'QuotaExceededError') {
    return 'Storage quota exceeded. Please delete some old tests or results.'
  }
  if (error?.message?.includes('password')) {
    return 'This PDF is password-protected and cannot be processed.'
  }
  return error?.message || 'An unexpected error occurred. Please try again.'
}
