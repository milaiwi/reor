/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/react-in-jsx-scope */
import { DragHandleDots2Icon } from '@radix-ui/react-icons'
import * as ResizablePrimitive from 'react-resizable-panels'
import { cn } from '@/lib/ui'

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      'relative flex w-px items-center justify-center after:absolute \
       after:inset-y-[-50px] focus-visible:outline-none \
       focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1  \
       data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full \
       data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 \
       data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 \
       data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90 \
       hover:bg-blue-500 hover:w-[4px] transition-colors duration-500',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <DragHandleDots2Icon className="size-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
