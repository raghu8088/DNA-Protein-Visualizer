import { ChangeEvent } from 'react'

type Props = {
  onTextChange: (text: string) => void
  onFileSelected: (file: File) => void | Promise<void>
}

export function DNAInput({ onTextChange, onFileSelected }: Props) {
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFileSelected(f)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-lg font-medium mb-3">DNA Input</h2>
      <div className="flex flex-col gap-3">
        <textarea
          className="w-full min-h-[140px] rounded-md border border-slate-300 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="Paste DNA sequence or FASTA here"
          spellCheck={false}
          onChange={(e)=>onTextChange(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <span className="px-3 py-2 bg-slate-100 rounded border border-slate-300">Upload .fasta or .txt</span>
            {/* Hidden input controlled by label for better UX */}
            <input type="file" accept=".txt,.fasta,.fa" className="hidden" onChange={handleFile} />
          </label>
          <p className="text-xs text-slate-500">Only A, T, G, C will be used; others ignored.</p>
        </div>
      </div>
    </div>
  )
}
