import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sanitizeDNA, toCodons, translateCodonOne } from '../utils/translation'

type Props = {
  dna: string
  onActiveIndexChange?: (i: number | null) => void
  onDone?: () => void
}

export function TranslatorAnimation({ dna, onActiveIndexChange, onDone }: Props) {
  // All codons from the entire sequence (for display)
  const codons = useMemo(() => toCodons(sanitizeDNA(dna)), [dna])
  // Compute the first ORF (start at first ATG, end at first stop)
  const { startCodonIdx, endCodonIdx } = useMemo(() => {
    const startNt = sanitizeDNA(dna).indexOf('ATG')
    if (startNt < 0) return { startCodonIdx: -1, endCodonIdx: -1 }
    const startIdx = Math.floor(startNt / 3)
    let endIdx = codons.length - 1
    for (let k = startIdx; k < codons.length; k++) {
      const aa = translateCodonOne(codons[k])
      if (aa === '*') { endIdx = k; break }
    }
    return { startCodonIdx: startIdx, endCodonIdx: endIdx }
  }, [dna, codons])

  // Current global codon index being animated
  const [i, setI] = useState(0)
  const [running, setRunning] = useState(false)
  const [built, setBuilt] = useState<string[]>([])
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // Reset when DNA changes
    setI(startCodonIdx >= 0 ? startCodonIdx : 0)
    setBuilt([])
    setRunning(false)
    onActiveIndexChange?.(null)
  }, [dna, startCodonIdx])

  useEffect(() => {
    if (!running) return
    // No start codon: stop immediately
    if (startCodonIdx < 0) { setRunning(false); return }
    // Past the end: stop
    if (i > endCodonIdx || i >= codons.length) {
      setRunning(false)
      onActiveIndexChange?.(null)
      onDone?.()
      return
    }
    onActiveIndexChange?.(i)
    const c = codons[i]
    const aa = translateCodonOne(c)
    timerRef.current = window.setTimeout(() => {
      // Stop codon reached: finish without appending '*'
      if (aa === '*') {
        setRunning(false)
        onActiveIndexChange?.(null)
        onDone?.()
        return
      }
      setBuilt(prev => [...prev, aa])
      setI(prev => prev + 1)
    }, 600)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [running, i, codons, startCodonIdx, endCodonIdx])

  const toggle = () => setRunning(r => !r)
  const reset = () => {
    setRunning(false)
    setI(startCodonIdx >= 0 ? startCodonIdx : 0)
    setBuilt([])
    onActiveIndexChange?.(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Translation Animation</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm rounded bg-slate-900 text-white" onClick={toggle}>{running ? 'Pause' : 'Play'}</button>
          <button className="px-3 py-1.5 text-sm rounded border" onClick={reset}>Reset</button>
        </div>
      </div>
      <div className="space-y-2">
  {/* All codons shown; the active one is highlighted during play */}
  <div className="font-mono text-sm flex flex-wrap gap-2">
          {codons.map((c, idx) => (
            <span key={idx} className={`px-2 py-1 rounded border ${idx === i && running ? 'codon-active' : ''}`}>{c}</span>
          ))}
        </div>
        <div className="text-sm">
          <span className="font-medium">Protein building:</span>
          <div className="mt-2 font-mono bg-slate-50 border rounded p-2 min-h-[44px]">
            <AnimatePresence initial={false}>
              {built.map((aa, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25 }}
                  className="inline-block mr-1"
                >
                  {aa}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
