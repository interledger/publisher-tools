import { useEffect, useState } from 'react'
import { validateAndConfirmPointer } from '@shared/utils/index'
import { useTranslation } from '~/i18n/useTranslation'
import { walletErrorMessage } from '~/lib/walletError'

interface ValidationState {
  isValidating: boolean
  isValid: boolean
  error: string
}

export function useDebounceValidation(
  value: string,
  delay: number = 500,
): ValidationState {
  const t = useTranslation('linkTag')
  const tWallet = useTranslation('wallet')
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    isValid: false,
    error: '',
  })

  useEffect(() => {
    let isCurrent = true

    if (!value.trim()) {
      setValidationState({
        isValidating: false,
        isValid: false,
        error: '',
      })
      return
    }

    setValidationState((prevState) => ({
      ...prevState,
      isValid: false,
      error: '',
    }))

    const validatePointer = async (pointer: string) => {
      let finalState: Pick<ValidationState, 'isValid' | 'error'>

      try {
        await validateAndConfirmPointer(pointer)
        finalState = { isValid: true, error: '' }
      } catch (error) {
        finalState = {
          isValid: false,
          error: walletErrorMessage(
            error,
            tWallet,
            t('errors.invalidWalletAddress'),
          ),
        }
      }

      if (isCurrent) {
        setValidationState((prevState) => ({
          ...prevState,
          isValidating: false,
          ...finalState,
        }))
      }
    }

    const timeoutId = setTimeout(() => {
      setValidationState((prevState) => ({
        ...prevState,
        isValidating: true,
      }))
      validatePointer(value)
    }, delay)

    return () => {
      isCurrent = false
      clearTimeout(timeoutId)
    }
  }, [value, delay, t, tWallet])

  return validationState
}
