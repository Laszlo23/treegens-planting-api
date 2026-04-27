'use client'

import classNames from 'classnames'
import { forwardRef, type InputHTMLAttributes } from 'react'

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={classNames(
          'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...rest}
      />
    )
  },
)
