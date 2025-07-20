import React, { ComponentProps } from 'react'

const variants = {
  hide: {
    true: {
      pointerEvents: 'none',
      opacity: 0,
    },
  },
  clearVerticalSpace: {
    true: {
      paddingVertical: 0,
    },
  },
  centered: {
    true: {
      maxWidth: 'calc(85ch + 1em)',
    },
  },
} as const

export const PageContainer = ({ children, ...props }: ComponentProps<'div'>) => {
  return (
    <div className="flex justify-center flex-1">
      <div className="flex-1 px-4 self-center" {...props}>
        {children}
      </div>
    </div>
  )
}

export const ContainerDefault = ({ children, ...props }: ComponentProps<'div'>) => {
  return (
    <div 
      className="mx-auto px-4 py-6 w-full sm:max-w-[700px] sm:pr-2 md:max-w-[740px] md:pr-2 lg:max-w-[800px] lg:pr-10"
      {...props}
    >
      {children}
    </div>
  )
}

export const ContainerLarge = ({ children, ...props }: ComponentProps<'div'>) => {
  return (
    <div 
      className="mx-auto px-4 pt-6 w-full flex-shrink-0"
      {...props}
    >
      {children}
    </div>
  )
}

export const ContainerXL = ({ children, ...props }: ComponentProps<'div'>) => {
  return (
    <div 
      className="mx-auto px-4 py-6 w-full sm:max-w-[980px] md:max-w-[1240px] lg:max-w-[1440px]"
      {...props}
    >
      {children}
    </div>
  )
}

export const AppContainer = ContainerLarge
export const Container = ContainerLarge
