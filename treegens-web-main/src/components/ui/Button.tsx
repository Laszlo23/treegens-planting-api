'use client'

import classNames from 'classnames'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonColor =
  | 'gray'
  | 'green'
  | 'red'
  | 'info'
  | 'success'
  /** Flowbite-compatible alias for `red` */
  | 'failure'

const sizeStyles = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
} as const

function solidClasses(color: ButtonColor): string {
  switch (color) {
    case 'gray':
      return 'bg-gray-700 text-white hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 disabled:bg-gray-400'
    case 'green':
    case 'success':
      return 'bg-green-600 text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:bg-green-400'
    case 'red':
    case 'failure':
      return 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:bg-red-400'
    case 'info':
      return 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:bg-sky-400'
  }
}

function outlineClasses(color: ButtonColor): string {
  switch (color) {
    case 'gray':
      return 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:bg-gray-100'
    case 'green':
    case 'success':
      return 'border border-green-600 bg-white text-green-700 hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:bg-gray-100'
    case 'red':
    case 'failure':
      return 'border border-red-600 bg-white text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:bg-gray-100'
    case 'info':
      return 'border border-sky-600 bg-white text-sky-700 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:bg-gray-100'
  }
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: ButtonColor
  size?: keyof typeof sizeStyles
  pill?: boolean
  outline?: boolean
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      color = 'gray',
      size = 'md',
      pill = false,
      outline = false,
      type = 'button',
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={classNames(
          'inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          pill ? 'rounded-full' : 'rounded-lg',
          sizeStyles[size],
          outline ? outlineClasses(color) : solidClasses(color),
          className,
        )}
        {...rest}
      />
    )
  },
)
