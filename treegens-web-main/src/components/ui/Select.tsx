'use client'

import classNames from 'classnames'
import { forwardRef, type SelectHTMLAttributes } from 'react'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={classNames(
          'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-green-500 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    )
  },
)
