import React from 'react'
import { SVGGreenVector, SVGErrorVector } from '~/assets/svg'

export type StepStatus = 'unfilled' | 'filled' | 'error'
type TextPosition = 'top' | 'bottom'

interface StepProps {
  number: number
  label: string
  status: StepStatus
  textPosition?: TextPosition
}

interface StepsIndicatorStep {
  number: number
  label: string
  status: StepStatus
}

interface StepsIndicatorProps {
  steps: [StepsIndicatorStep, StepsIndicatorStep, ...StepsIndicatorStep[]]
  connectorHeight?: string
}

const getBorderColor = (status: StepStatus) =>
  status === 'error' ? 'border-black' : 'border-purple-300'

const getStepContent = (
  number: number,
  status: StepStatus,
  size: 'small' | 'large' = 'small',
) => {
  if (status === 'filled') {
    return (
      <div className="flex items-center justify-center">
        <SVGGreenVector
          className={size === 'small' ? 'w-4 h-3' : 'w-6 h-[18px]'}
        />
      </div>
    )
  } else if (status === 'error') {
    return (
      <div className="flex items-center justify-center">
        <SVGErrorVector className={size === 'small' ? 'w-3 h-3' : 'w-6 h-6'} />
      </div>
    )
  } else {
    return size === 'small' ? (
      <span className="text-purple-600 font-bold text-sm leading-md">
        {number}
      </span>
    ) : (
      <div className="text-purple-600 font-bold">
        <span className="text-lg leading-lg">{number}</span>
      </div>
    )
  }
}

export const MobileStep: React.FC<{ number: number; status: StepStatus }> = ({
  number,
  status,
}) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          w-6 h-6
          rounded-full border
          ${getBorderColor(status)}
          flex items-center justify-center
        `}
      >
        {getStepContent(number, status, 'small')}
      </div>
    </div>
  )
}

const Step: React.FC<StepProps> = ({
  number,
  label,
  status,
  textPosition = 'bottom',
}) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex flex-col ${textPosition === 'top' ? 'flex-col-reverse' : 'flex-col'} items-center gap-1`}
      >
        <div
          className={`
          w-[60px] h-[60px]
          rounded-full border
          ${getBorderColor(status)}
          flex items-center justify-center
        `}
        >
          {getStepContent(number, status, 'large')}
        </div>

        <div className="text-text-primary text-xs leading-xs font-normal text-center">
          {label}
        </div>
      </div>
    </div>
  )
}

export const StepsIndicator: React.FC<StepsIndicatorProps> = ({ steps }) => {
  const [step1, step2] = steps

  return (
    <div className="flex flex-col items-center">
      <Step
        number={step1.number}
        label={step1.label}
        status={step1.status}
        textPosition="bottom"
      />

      <div className={`w-px bg-purple-300 h-[115px]`}></div>

      <Step
        number={step2.number}
        label={step2.label}
        status={step2.status}
        textPosition="bottom"
      />
    </div>
  )
}

export const MobileStepsIndicator: React.FC<StepProps> = ({
  number,
  label,
  status,
}) => {
  return (
    <div className="xl:hidden flex items-center gap-1 mb-sm">
      <MobileStep number={number} status={status} />
      <h6 className="text-style-h6">{label}</h6>
    </div>
  )
}

export default StepsIndicator
