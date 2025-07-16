import React from 'react'
import { InputField, ToolsSecondaryButton } from '@/components'
import { SVGDeleteScript } from '~/assets/svg'

interface ShareInputProps {
  index: number
  name: string
  pointer: string
  weight: number
  percent: number
  onChangeName: (name: string) => void
  onChangePointer: (pointer: string) => void
  onChangeWeight: (weight: number) => void
  onChangePercent: (percent: number) => void
  onRemove: () => void
  removeDisabled?: boolean
  percentDisabled?: boolean
  weightDisabled?: boolean
}

export function ShareInput({
  index,
  name,
  pointer,
  weight,
  percent,
  onChangeName,
  onChangePointer,
  onChangeWeight,
  onChangePercent,
  onRemove,
  //removeDisabled = false,
  percentDisabled = false,
  weightDisabled = false
}: ShareInputProps) {
  return (
    <tr key={index}>
      <td className="p-2 w-64">
        <InputField
          placeholder="Fill in name"
          value={name}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangeName(ev.target.value)
          }
        />
      </td>
      <td className="p-2">
        <InputField
          placeholder="Wallet address/Payment pointer"
          value={pointer}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangePointer(ev.target.value)
          }
        />
      </td>
      <td className="p-2 w-24">
        <InputField
          type="number"
          value={weight}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangeWeight(Number(ev.target.value))
          }
          disabled={weightDisabled}
          min={0}
        />
      </td>
      <td className="p-2 w-24">
        <InputField
          type="number"
          value={percent ? Math.round(percent * 100) : ''}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangePercent(Number(ev.target.value) / 100)
          }
          disabled={percentDisabled}
          min={0}
          max={100}
        />
      </td>
      <td className="p-2 px-4 w-24">
        <ToolsSecondaryButton onClick={onRemove} className="!border-none !p-0">
          <SVGDeleteScript width={32} height={32} />
        </ToolsSecondaryButton>
      </td>
    </tr>
  )
}

export function ShareInputMobile({
  index,
  name,
  pointer,
  weight,
  percent,
  onChangeName,
  onChangePointer,
  onChangeWeight,
  onChangePercent,
  onRemove,
  //removeDisabled = false,
  percentDisabled = false,
  weightDisabled = false
}: ShareInputProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4" data-key={index}>
      <div className="mb-2 flex flex-row justify-between">
        <span className="font-normal">Revshare #{index + 1} </span>

        <ToolsSecondaryButton onClick={onRemove} className="!border-none !p-0">
          <SVGDeleteScript width={32} height={32} />
        </ToolsSecondaryButton>
      </div>

      <div className="mb-2">
        <InputField
          placeholder="Fill in name"
          value={name}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangeName(ev.target.value)
          }
        />
      </div>
      <div className="mb-2">
        <InputField
          placeholder="Wallet address/Payment pointer"
          value={pointer}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangePointer(ev.target.value)
          }
        />
      </div>
      <div className="mb-2">
        <InputField
          type="number"
          value={weight}
          min={0}
          step="any"
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangeWeight(Number(ev.target.value))
          }
          disabled={weightDisabled}
        />
      </div>
      <div>
        <InputField
          type="number"
          min={0}
          max={100}
          step="any"
          value={percent ? Math.round(percent * 100) : ''}
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) =>
            onChangePercent(Number(ev.target.value) / 100)
          }
          disabled={percentDisabled}
        />
      </div>
    </div>
  )
}
