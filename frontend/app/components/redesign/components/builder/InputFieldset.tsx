interface Props {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}

export function InputFieldset({ label, icon, children }: Props) {
  return (
    <fieldset className="space-y-xs">
      <legend className="flex flex-row items-center gap-1 text-style-caption-emphasis">
        {icon}
        {label}
      </legend>
      {children}
    </fieldset>
  )
}
