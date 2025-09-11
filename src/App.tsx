import { useMemo, useState } from 'react'
import { DNAInput } from './components/DNAInput'
import { CodonHighlighter } from './components/CodonHighlighter'
import { ProteinOutput } from './components/ProteinOutput'
import { TranslatorAnimation } from './components/TranslatorAnimation'
import { Protein3DViewer } from './components/Protein3DViewer'
import { SequenceGraphics } from './components/SequenceGraphics'
import { parseFasta, sanitizeDNA, translateDNA, toCodons, detectSequenceType, detectPdbIdFromFastaHeader, toCodonsFromFrame } from './utils/translation'
import { AdvancedControls } from './components/AdvancedControls'

export default function App() {
  const [dna, setDna] = useState('')
  const [useThreeLetter, setUseThreeLetter] = useState(false)
  const [activeCodonIndex, setActiveCodonIndex] = useState<number | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [detectedPdb, setDetectedPdb] = useState<string | null>(null)

  const [frame, setFrame] = useState<0|1|2>(0)
  const [strand, setStrand] = useState<'+'|'-'>('+')
  const [speedMs, setSpeedMs] = useState(600)

  const codons = useMemo(() => toCodonsFromFrame(sanitizeDNA(dna), frame, strand), [dna, frame, strand])

  const protein = useMemo(() => translateDNA(sanitizeDNA(dna)), [dna])

  const handleTextInput = (text: string) => {
    setWarning(null)
    setDetectedPdb(detectPdbIdFromFastaHeader(text))
    const type = detectSequenceType(text)
    if (type === 'protein') setWarning('It looks like you pasted a protein FASTA (amino-acid letters). Please provide DNA (A/T/G/C).')
    setDna(sanitizeDNA(text))
  }
  const handleFile = async (file: File) => {
    const text = await file.text()
    const isFasta = file.name.toLowerCase().endsWith('.fasta') || text.startsWith('>')
    const seq = isFasta ? parseFasta(text) : text
    setWarning(null)
    setDetectedPdb(detectPdbIdFromFastaHeader(text))
    const type = detectSequenceType(seq)
    if (type === 'protein') setWarning('It looks like you uploaded a protein FASTA. Please upload DNA (nucleotide sequence).')
    setDna(sanitizeDNA(seq))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">DNA → Protein Visualizer</h1>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-slate-700" checked={useThreeLetter} onChange={(e)=>setUseThreeLetter(e.target.checked)} />
              3-letter amino acids
            </label>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-4">
          <DNAInput onTextChange={handleTextInput} onFileSelected={handleFile} />
          {warning && (
            <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-800 text-sm">{warning}</div>
          )}
          <AdvancedControls dna={sanitizeDNA(dna)} onFrameChange={setFrame} onStrandChange={setStrand} onSpeedChange={setSpeedMs} />
          <SequenceGraphics dna={sanitizeDNA(dna)} />
          <CodonHighlighter codons={codons} activeCodonIndex={activeCodonIndex} />
        </section>
        <section className="space-y-4">
          <ProteinOutput proteinOne={protein.one} proteinThree={protein.three} useThreeLetter={useThreeLetter} />
          <TranslatorAnimation dna={sanitizeDNA(dna)} speedMs={speedMs} onActiveIndexChange={setActiveCodonIndex} onDone={()=>setActiveCodonIndex(null)} />
          {detectedPdb && (
            <div className="text-xs text-slate-600 -mb-3">Detected PDB ID from FASTA header: <span className="font-mono">{detectedPdb}</span>. Preloading structure…</div>
          )}
          <Protein3DViewer initialPdbId={detectedPdb ?? undefined} proteinSeq={protein.one} />
        </section>
      </main>
      <footer className="text-center text-xs text-slate-500 py-6">
        <div>Built with React, TailwindCSS, Framer Motion, and 3Dmol.js</div>
        <div className="mt-1">
          copy right all right reserved by Informatician Roman Chaudhary . contact at <a className="underline" href="https://chaudharyroman.com.np" target="_blank" rel="noreferrer">chaudharyroman.com.np</a>
        </div>
      </footer>
    </div>
  )
}
