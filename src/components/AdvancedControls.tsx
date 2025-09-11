import { useEffect, useMemo, useState } from 'react'
import { aaComposition, codonUsage, estimateProteinMW, sanitizeDNA, toCodonsFromFrame, translateFromFrame } from '../utils/translation'

type Props = {
  dna: string
  onFrameChange?: (frame: 0|1|2) => void
  onStrandChange?: (strand: '+'|'-') => void
  onSpeedChange?: (ms: number) => void
}

export function AdvancedControls({ dna, onFrameChange, onStrandChange, onSpeedChange }: Props) {
  const [frame, setFrame] = useState<0|1|2>(0)
  const [strand, setStrand] = useState<'+'|'-'>('+')
  const [speed, setSpeed] = useState(600)

  useEffect(() => { onFrameChange?.(frame) }, [frame])
  useEffect(() => { onStrandChange?.(strand) }, [strand])
  useEffect(() => { onSpeedChange?.(speed) }, [speed])

  const codons = useMemo(() => toCodonsFromFrame(dna, frame, strand), [dna, frame, strand])
  const protein = useMemo(() => translateFromFrame(dna, frame, strand), [dna, frame, strand])
  const usage = useMemo(() => codonUsage(dna, frame, strand), [dna, frame, strand])
  const aaComp = useMemo(() => aaComposition(protein.one), [protein.one])
  const mw = useMemo(() => estimateProteinMW(protein.one), [protein.one])

  const maxCodonCount = Math.max(1, ...Object.values(usage))
  const maxAaCount = Math.max(1, ...Object.values(aaComp))

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-lg font-medium mb-3">Advanced Controls</h2>
      <div className="flex flex-wrap gap-3 items-center text-sm mb-4">
        <label className="inline-flex items-center gap-2">Strand
          <select className="border rounded px-2 py-1" value={strand} onChange={(e)=>setStrand(e.target.value as any)}>
            <option value="+">+</option>
            <option value="-">-</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2">Frame
          <select className="border rounded px-2 py-1" value={frame} onChange={(e)=>setFrame(Number(e.target.value) as any)}>
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2">Anim speed
          <input type="range" min={150} max={1200} step={50} value={speed} onChange={(e)=>setSpeed(Number(e.target.value))} />
          <span>{speed} ms</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="font-medium mb-2">Codon Usage (frame {frame}, strand {strand})</div>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-auto pr-1">
            {Object.entries(usage).sort().map(([c, n]) => (
              <div key={c} className="text-xs">
                <div className="flex justify-between"><span className="font-mono">{c}</span><span>{n}</span></div>
                <div className="h-1.5 bg-slate-200 rounded">
                  <div className="h-1.5 rounded bg-slate-700" style={{ width: `${(n/maxCodonCount)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="font-medium mb-2">Protein Stats</div>
          <div className="text-sm mb-2">Length: <span className="font-mono">{protein.one.length}</span> aa · MW ≈ <span className="font-mono">{(mw/1000).toFixed(2)} kDa</span></div>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-auto pr-1">
            {Object.entries(aaComp).sort().map(([a, n]) => (
              <div key={a} className="text-xs">
                <div className="flex justify-between"><span className="font-mono">{a}</span><span>{n}</span></div>
                <div className="h-1.5 bg-slate-200 rounded">
                  <div className="h-1.5 rounded bg-emerald-600" style={{ width: `${(n/maxAaCount)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
