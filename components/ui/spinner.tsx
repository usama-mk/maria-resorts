import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <span
      className={cn(
        "animate-spin rounded-full border-gray-200 border-t-blue-600 block",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </span>
  )
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
       <div className="flex flex-col items-center gap-4">
         <Spinner size="lg" className="border-t-blue-600" />
         <p className="text-sm font-medium text-gray-500 animate-pulse">Processing...</p>
       </div>
    </div>
  )
}
