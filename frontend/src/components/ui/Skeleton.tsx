import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular" | "schedule";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  count = 1,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "text":
        return "h-4 rounded-md w-3/4";
      case "circular":
        return "rounded-full aspect-square";
      case "schedule":
        return "h-14 rounded-2xl w-full";
      case "rectangular":
      default:
        return "rounded-2xl";
    }
  };

  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  const baseShimmer =
    "bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-pulse border border-slate-100/50";

  if (count > 1) {
    return (
      <div className="space-y-2 w-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${baseShimmer} ${getVariantStyles()} ${className}`}
            style={customStyle}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseShimmer} ${getVariantStyles()} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; cols?: number }> = ({
  rows = 5,
  columns,
  cols = 4,
}) => {
  const colCount = columns || cols;
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: colCount }).map((_, c) => (
            <Skeleton key={c} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
