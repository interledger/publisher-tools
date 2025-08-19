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

export function useDebounceValidation(
  value: string,
  delay: number = 500
): ValidationState {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    isValid: null,
    error: null
  })

  useEffect(() => {
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

      let finalState: Pick<ValidationState, 'isValid' | 'error'>

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

    return () => {
      isCurrent = false
      clearTimeout(timeoutId)
    }
  }, [value, delay])

  return validationState
}
