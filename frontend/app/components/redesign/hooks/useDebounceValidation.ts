import { useEffect, useState } from 'react'
import {
  validateAndConfirmPointer,
  WalletAddressFormatError
} from '@shared/utils/index'

interface ValidationState {
  isValidating: boolean
  isValid: boolean | null
  error: string | null
}

/**
 * Custom hook for debounced wallet address validation
 * @param value - The wallet address/pointer to validate
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns ValidationState with isValidating, isValid, and error
 */
export function useDebounceValidation(value: string, delay: number = 500): ValidationState {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    isValid: null,
    error: null
  })

  useEffect(() => {
    // A flag to handle race conditions.
    // We only want to update state if this is the most recent validation request.
    let isCurrent = true

    const validatePointer = async (pointer: string) => {
      if (!value.trim()) {
        setValidationState({
          isValidating: false,
          isValid: null,
          error: null
        })
        return
      }

    setValidationState({
      isValidating: true,
      isValid: null,
      error: null
    })

      let finalState: Pick<ValidationState, 'isValid' | 'error'>;

      try {
        await validateAndConfirmPointer(pointer)
        finalState = { isValid: true, error: null }
      } catch (error) {
        finalState = {
          isValid: false,
          error:
            error instanceof WalletAddressFormatError
              ? error.message
              : 'Invalid wallet address'
        }
      }

      if (isCurrent) {
        setValidationState((prevState) => ({
          ...prevState,
          isValidating: false,
          ...finalState
        }))
      }
    }

    const timeoutId = setTimeout(() => {
      validatePointer(value)
    }, delay)

    // Cleanup function to run when the effect is re-run or component unmounts.
    // This prevents state updates from stale validation requests.
    return () => {
      isCurrent = false
      clearTimeout(timeoutId)
    }
  }, [value, delay])

  return validationState
}
