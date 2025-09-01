import { useMemo } from 'react'

type Props = { dna: string }

export function SequenceGraphics({ dna }: Props) {
  const stats = useMemo(() => {
    const len = dna.length
    let A=0,T=0,G=0,C=0
    for (const ch of dna) {
      if (ch==='A') A++
      else if (ch==='T') T++
      else if (ch==='G') G++
      else if (ch==='C') C++
    }
    const GC = G + C
    const AT = A + T
    const gcPct = len ? Math.round((GC/len)*100) : 0
    return { len, A, T, G, C, GC, AT, gcPct }
  }, [dna])

  const r = 48
  const circumference = 2*Math.PI*r
  const dash = (stats.gcPct/100) * circumference

  const bar = (n: number) => (stats.len? (n/stats.len)*100 : 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Sequence Graphics</h2>
        <span className="text-sm text-slate-500">Length: {stats.len.toLocaleString()}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* GC Donut */}
        <div className="flex items-center justify-center">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <g transform="translate(70,70)">
              <circle r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                r={r}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference-dash}`}
                strokeLinecap="round"
                transform="rotate(-90)"
              />
              <text textAnchor="middle" dominantBaseline="central" className="fill-slate-800" fontSize="18" fontWeight={600}>{stats.gcPct}%</text>
              <text y={20} textAnchor="middle" className="fill-slate-500" fontSize="10">GC content</text>
            </g>
          </svg>
        </div>
        {/* Base composition bars */}
        <div className="space-y-3">
          {[['A', stats.A, 'bg-amber-400'], ['T', stats.T, 'bg-sky-400'], ['G', stats.G, 'bg-emerald-500'], ['C', stats.C, 'bg-indigo-500']].map(([label, val, color]) => (
            <div key={label as string} className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{label}</span>
                <span className="text-slate-500">{bar(val as number).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded">
                <div className={`h-2 rounded ${color as string}`} style={{ width: `${bar(val as number)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
