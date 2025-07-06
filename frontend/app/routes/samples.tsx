import { TypographyExample } from '../components/redesign/TypographyExample'
import { InputField } from '../components/redesign/components/InputField'
import { ToolsPrimaryButton } from '../components/redesign/components/ToolsPrimaryButton'
import { ToolsSecondaryButton } from '../components/redesign/components/ToolsSecondaryButton'
import { Tooltip } from '../components/redesign/components/Tooltip'
import { ToolsWalletAddress } from '../components/redesign/components/ToolsWalletAddress'
import { ToolsDropdown } from '../components/redesign/components/ToolsDropdown'
import { ColorSelector } from '../components/redesign/components/ColorSelector'
import { CornerRadiusSelector } from '../components/redesign/components/CornerRadiusSelector'
import {
  MobileStepsIndicator,
  StepsIndicator
} from '../components/redesign/components/StepsIndicator'
import { SectionHeader } from '~/components/redesign/components/SectionHeader'
import { SVGColorPicker, SVGRoundedCorner } from '~/assets/svg'
import { GhostButton } from '../components/redesign/components/GhostButton'
import { PillTagButton } from '../components/redesign/components/PillTagButton'
import { BuilderForm } from '../components/redesign/components/BuilderForm'
import { BuilderBackground } from '../components/redesign/components/BuilderBackground'
import { ScriptReadyModal } from '../components/redesign/components/ScriptReadyModal'
import { SaveResultModal } from '../components/redesign/components/SaveResultModal'
import { WalletOwnershipModal } from '../components/redesign/components/WalletOwnershipModal'
import { CornerType } from '~/lib/types'
import { ToolCard } from '~/components/redesign/components/landing/ToolCard'
import SVGLinkGenerator from '~/assets/images/landing/illustration_link_generator.svg?url'

export function Card({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`
      bg-interface-bg-container 
      border border-interface-edge-container
      rounded-sm
      p-lg
      ${className}
    `}
    >
      {children}
    </div>
  )
}

export function BodyText({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={`text-base leading-md text-text-primary ${className}`}>
      {children}
    </p>
  )
}

export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-interface-bg-main p-lg">
      <div className="max-w-2xl mx-auto space-y-lg">
        <Card>
          <TypographyExample />
        </Card>
      </div>

      <RedesignDemo />
    </div>
  )
}

export function RedesignDemo() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen flex flex-col gap-8">
      <h1 className="text-2xl font-bold mb-4">Input Field States Demo</h1>
      <div className="flex flex-col gap-6 max-w-md">
        <InputField label="Default" placeholder="Type here..." />
        <InputField label="Focused" placeholder="Focus me!" autoFocus />
        <InputField
          label="Error"
          placeholder="Error state"
          error="This field is required"
        />
        <InputField label="Disabled" placeholder="Can't type here" disabled />
      </div>
      <ToolsPrimaryButton
        icon="script"
        iconPosition="left"
        className="min-w-[230px] max-w-[244px]"
      >
        Save and generate script
      </ToolsPrimaryButton>
      <ToolsPrimaryButton
        icon="script"
        iconPosition="right"
        className="min-w-[230px] max-w-[244px]"
      >
        Save and generate script
      </ToolsPrimaryButton>
      <ToolsSecondaryButton icon="play" className="max-w-[240px]">
        Preview
      </ToolsSecondaryButton>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Ghost Button Component</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex gap-4 items-center">
            <GhostButton>Default Ghost Button</GhostButton>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Pill Tag Button Component</h2>
        <div className="flex flex-col gap-6 max-w-md">
          <div className="flex flex-wrap gap-2">
            <PillTagButton>Default Tag</PillTagButton>
            <PillTagButton variant="active">Active Tag</PillTagButton>
            <PillTagButton size="sm">Small Tag</PillTagButton>
            <PillTagButton disabled>Disabled Tag</PillTagButton>
          </div>
        </div>
      </div>
      <h1>Tooltip</h1>
      <Tooltip>Your wallet address must use HTTPS protocol</Tooltip>
      <ToolsWalletAddress />
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Dropdown Component</h2>
        <div className="flex flex-col gap-6 max-w-md">
          <ToolsDropdown
            label="Default"
            placeholder="Select an option"
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
              { label: 'Option 3', value: '3' },
              { label: 'Option 4', value: '4' }
            ]}
          />
          <ToolsDropdown
            label="With default value"
            defaultValue="2"
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
              { label: 'Option 3', value: '3' },
              { label: 'Option 4', value: '4' }
            ]}
          />
          <ToolsDropdown
            label="Required field"
            placeholder="Select an option"
            required={true}
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
              { label: 'Option 3', value: '3' },
              { label: 'Option 4', value: '4' }
            ]}
          />
          <ToolsDropdown
            label="With error"
            placeholder="Select an option"
            error="Please select an option"
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
              { label: 'Option 3', value: '3' },
              { label: 'Option 4', value: '4' }
            ]}
          />
          <ToolsDropdown
            label="With help text"
            placeholder="Select an option"
            helpText="This is some helpful information about this field"
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
              { label: 'Option 3', value: '3' },
              { label: 'Option 4', value: '4' }
            ]}
          />
          <ToolsDropdown
            label="Disabled"
            placeholder="Can't select this"
            disabled={true}
            options={[
              { label: 'Option 1', value: '1' },
              { label: 'Option 2', value: '2' },
              { label: 'Option 3', value: '3' },
              { label: 'Option 4', value: '4' }
            ]}
          />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Color Selector Component</h2>
        <div className="flex flex-col gap-6 max-w-md">
          <SectionHeader icon={<SVGColorPicker />} label="Colors" />
          <ColorSelector />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Corner Radius Selector Component
        </h2>
        <div className="flex flex-col gap-6 max-w-md">
          <SectionHeader
            icon={<SVGRoundedCorner />}
            label="Container Corner Radius"
          />
          <CornerRadiusSelector defaultValue={CornerType.Light} />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Steps Indicator Component</h2>

        <div className="space-y-12">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Different Status Examples
            </h3>
            <div className="flex gap-8 justify-center">
              <StepsIndicator
                steps={[
                  { number: 1, label: 'Connect', status: 'unfilled' },
                  { number: 2, label: 'Configure', status: 'filled' }
                ]}
              />
              <StepsIndicator
                steps={[
                  { number: 1, label: 'Completed', status: 'filled' },
                  { number: 2, label: 'Current', status: 'unfilled' }
                ]}
              />
              <StepsIndicator
                steps={[
                  { number: 1, label: 'Success', status: 'filled' },
                  { number: 2, label: 'Error', status: 'error' }
                ]}
              />
              <MobileStepsIndicator
                number={1}
                label="Connect"
                status="unfilled"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Builder Form Component</h2>
        <div className="flex flex-col">
          <BuilderForm className="w-[608px]" />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Builder Background Component</h2>
        <div className="flex flex-col max-w-2xl">
          <BuilderBackground />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Script Ready Modal Component</h2>
        <div className="flex flex-col items-center max-w-md mx-auto">
          <ScriptReadyModal
            onClose={() => console.log('Modal closed')}
            onCopy={() => console.log('Script copied to clipboard')}
          />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Save Success Modal Component</h2>
        <div className="flex flex-col items-center max-w-md mx-auto">
          <SaveResultModal
            isOpen={true}
            onClose={() => console.log('Success modal closed')}
            onDone={() => console.log('Done clicked')}
          />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Wallet Ownership Modal Component
        </h2>
        <div className="flex flex-col items-center max-w-md mx-auto">
          <WalletOwnershipModal
            isOpen={true}
            onClose={() => console.log('Wallet ownership modal closed')}
            onConfirm={() => console.log('Wallet ownership confirmed')}
            walletAddress="https://wallet.example/alice"
          />
        </div>
      </div>

      <ToolCard
        title="Link-tag generator"
        tags={[
          'flawless',
          'dynamic',
          'dynamic',
          'high click rate',
          'high click rate'
        ]}
        icon={SVGLinkGenerator}
      >
        The most classic, yet one of the most effective methods in order to link
        to your supporters. Ladies and gents, the button!
      </ToolCard>
    </div>
  )
}
