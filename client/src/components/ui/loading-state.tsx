interface LoadingStateProps {
  fullscreen?: boolean;
  className?: string;
}

export function LoadingState({ fullscreen = false, className = "" }: LoadingStateProps) {
  const containerClassName = fullscreen
    ? "min-h-screen flex items-center justify-center"
    : "flex items-center justify-center py-12";

  return (
    <div className={`${containerClassName} ${className}`.trim()}>
      <div className="animate-spin rounded-full size-12 border-4 border-gray-200 border-t-[#009999]" />
    </div>
  );
}
