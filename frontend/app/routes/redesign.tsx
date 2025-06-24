// Example Remix components using the design tokens

import type { ButtonHTMLAttributes } from 'react'
import { TypographyExample } from '../components/redesign/TypographyExample'
import { InputField } from '../components/redesign/components/InputField'
import { ToolsPrimaryButton } from '../components/redesign/components/ToolsPrimaryButton'
import { ToolsSecondaryButton } from '../components/redesign/components/ToolsSecondaryButton'
import { Tooltip } from '../components/redesign/components/Tooltip'
import { ToolsWalletAddress } from '../components/redesign/components/ToolsWalletAddress'
import { BuilderCollapseExpand } from '../components/redesign/components/BuilderCollapseExpand'
import { ToolsDropdown } from '../components/redesign/components/ToolsDropdown'
import { ColorSelector } from '../components/redesign/components/ColorSelector'
import { CornerRadiusSelector } from '../components/redesign/components/CornerRadiusSelector'
import { StepsIndicator } from '../components/redesign/components/StepsIndicator'
import { TabSelector } from '../components/redesign/components/TabSelector'
import { SectionHeader } from '~/components/redesign/components/SectionHeader'
import { SVGColorPicker, SVGRoundedCorner } from '~/assets/svg'
// Primary Button Component
export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`
        bg-primary-bg hover:bg-primary-bg-hover 
        text-white 
        px-md py-sm 
        rounded-xs
        font-medium
        focus:outline-none focus:ring-2 focus:ring-primary-focus
        transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

// Secondary Button Component
export function SecondaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`
        border border-secondary-edge hover:border-secondary-edge-hover
        text-secondary-edge hover:text-secondary-edge-hover
        bg-white hover:bg-secondary-hover-surface
        px-md py-sm 
        rounded-xs
        font-medium
        focus:outline-none focus:ring-2 focus:ring-primary-focus
        transition-all duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

// Card Component
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

// Usage example in a Remix route
export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-interface-bg-main p-lg">
      <div className="max-w-2xl mx-auto space-y-lg">
        {/* Typography Examples Section */}
        <Card>
          <TypographyExample />
        </Card>

        <Card>
          <BodyText className="mb-lg">
            Fill out the form below to create your account.
          </BodyText>

          <div className="space-y-md">
            <InputField
              label="Email"
              type="email"
              placeholder="Enter your email"
              helpText="We'll never share your email with anyone else."
            />

            <InputField
              label="Password"
              type="password"
              placeholder="Enter your password"
            />

            <div className="flex gap-sm">
              <PrimaryButton>Create Account</PrimaryButton>
              <SecondaryButton>Cancel</SecondaryButton>
            </div>
          </div>
        </Card>
      </div>

      <RedesignDemo />
    </div>
  )
}

// Redesign demo page
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
      {/* Example usage of ToolsPrimaryButton */}
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
      <h1>Tooltip</h1>
      <Tooltip text="Your wallet is required in order for us to save this components configuration for you, link it to the original author, and verify ownership for future updates. It also embeds the wallet address into your web page automatically, enabling Web Monetization on your behalf." />
      <ToolsWalletAddress />{' '}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Builder UI Component</h2>
        <BuilderCollapseExpand />
      </div>
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
          <CornerRadiusSelector defaultValue="light" />
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Steps Indicator Component</h2>

        <div className="space-y-12">
          {/* Desktop view - Bottom text */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Desktop View - Bottom Text
            </h3>
            <StepsIndicator
              steps={[
                { number: 1, label: 'Connect', status: 'unfilled' },
                { number: 2, label: 'Configure', status: 'filled' },
                { number: 3, label: 'Validate', status: 'error' }
              ]}
              textPosition="bottom"
            />
          </div>

          {/* Desktop view - Top text */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Desktop View - Top Text
            </h3>
            <StepsIndicator
              steps={[
                { number: 1, label: 'Connect', status: 'unfilled' },
                { number: 2, label: 'Configure', status: 'filled' },
                { number: 3, label: 'Validate', status: 'error' }
              ]}
              textPosition="top"
            />
          </div>

          {/* Mobile view */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Mobile View</h3>
            <StepsIndicator
              steps={[
                { number: 1, label: 'Connect', status: 'unfilled' },
                { number: 2, label: 'Configure', status: 'filled' },
                { number: 3, label: 'Validate', status: 'error' }
              ]}
              isMobile={true}
            />
          </div>
        </div>
      </div>
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Tab Selector Component</h2>
        <div className="flex flex-col gap-6 max-w-2xl border border-silver-200 rounded-md p-4 bg-interface-bg-main">
          {/* Default Tab Selector */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Default Tab Selector</h3>
            <TabSelector
              options={[
                { id: 'tab1', label: 'Default preset 1' },
                { id: 'tab2', label: 'Default preset 2' },
                { id: 'tab3', label: 'Default preset 3' }
              ]}
              defaultSelectedId="tab1"
              onSelectTab={(tabId) => console.log('Selected tab:', tabId)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
