import { cx } from 'class-variance-authority'

export function CustomRadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cx(
        'w-4 h-4 rounded-full flex items-center justify-center',
        selected ? 'text-purple-600' : 'text-purple-300',
        'border border-current',
        'group-focus-within:ring-2 group-focus-within:ring-offset-2 group-focus-within:ring-current',
      )}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-current" />}
    </span>
  )
}
