export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 bg-[length:200%_100%] ${className}`}
      style={{ animation: "shimmer 1.5s infinite" }}
    />
  )
}