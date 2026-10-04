interface LoadingSpinnerProps {
  className?: string;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-4", lg: "h-12 w-12 border-4" };

const LoadingSpinner = ({ className = "", size = "md" }: LoadingSpinnerProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${SIZES[size]} rounded-full border-white/10 border-t-blue-400 animate-spin`}
      />
      <span className="sr-only">در حال بارگذاری...</span>
    </div>
  );
};

export default LoadingSpinner;