type Props = {
  proteinOne: string
  proteinThree: string
  useThreeLetter: boolean
}

export function ProteinOutput({ proteinOne, proteinThree, useThreeLetter }: Props) {
  const text = useThreeLetter ? proteinThree : proteinOne
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-lg font-medium mb-3">Protein Sequence</h2>
      <div className="font-mono text-sm whitespace-pre-wrap break-words bg-slate-50 p-3 rounded border border-slate-200 min-h-[100px]">
        {text || <span className="text-slate-500">No protein yet. Enter DNA starting from a start codon (ATG).</span>}
      </div>
    </div>
  )
}
