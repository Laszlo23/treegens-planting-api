import classNames from 'classnames'

const sizeClass = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
} as const

export type SpinnerSize = keyof typeof sizeClass

export function Spinner({
  size = 'md',
  className,
}: {
  size?: SpinnerSize
  className?: string
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={classNames(
        'inline-block animate-spin rounded-full border-gray-200 border-t-tree-green-2',
        sizeClass[size],
        className,
      )}
    />
  )
}
