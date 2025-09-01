import { Fragment } from 'react'

type Props = {
  codons: string[]
  activeCodonIndex: number | null
}

const START = new Set(['ATG'])
const STOP = new Set(['TAA','TAG','TGA'])

export function CodonHighlighter({ codons, activeCodonIndex }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-lg font-medium mb-3">Codon Highlighting</h2>
      <div className="font-mono text-sm flex flex-wrap gap-2">
        {codons.length === 0 && (
          <p className="text-slate-500 text-sm">Enter DNA to see codons highlighted.</p>
        )}
        {codons.map((c, i) => {
          const color = START.has(c) ? 'codon-green' : STOP.has(c) ? 'codon-red' : 'codon-blue'
          const active = i === activeCodonIndex
          return (
            <span key={i} className={`px-2 py-1 rounded ${color} ${active ? 'codon-active' : ''}`}>{c}</span>
          )
        })}
      </div>
      <div className="text-xs text-slate-600 mt-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded codon-green inline-block border"></span>Start: ATG</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded codon-red inline-block border"></span>Stop: TAA, TAG, TGA</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded codon-blue inline-block border"></span>Other codons</span>
      </div>
    </div>
  )
}
