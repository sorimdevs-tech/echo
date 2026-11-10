function EchoLogo({ compact = false, light = false, showSubtitle = true }) {
  return (
    <div className="flex items-center gap-3" aria-label="echoAI Reporting System">
      <div className={`relative shrink-0 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
        <div className={`absolute inset-0 rounded-full border-[3.5px] ${light ? 'border-white/90' : 'border-[#449087]'}`} />
        <div className={`absolute inset-1.5 rounded-full border-[3px] ${light ? 'border-white/90' : 'border-[#449087]'}`} />
        <div className={`absolute inset-[0.82rem] rounded-full ${light ? 'bg-white' : 'bg-[#449087]'}`} />
      </div>
      <div>
        <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold tracking-tight ${light ? 'text-white' : 'text-[#17212f]'}`}>
          echo<span className={light ? 'text-cyan-100' : 'text-[#449087]'}>AI</span>
        </div>
        {showSubtitle && (
          <div className={`text-xs font-medium leading-tight ${light ? 'text-white/85' : 'text-slate-500'}`}>
            Reporting System
          </div>
        )}
      </div>
    </div>
  )
}

export default EchoLogo
