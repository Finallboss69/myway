export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="font-kds text-5xl text-brand-500 animate-pulse">MY WAY</div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-brand-500"
              style={{ animation: `pulse 1s ease-in-out ${i*0.15}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
