import { useEffect, useRef } from 'react'

declare global {
  interface Window { $3Dmol?: any }
}

export function Protein3DViewer() {
  const divRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!divRef.current || !window.$3Dmol) return
    const viewer = window.$3Dmol.createViewer(divRef.current, { backgroundColor: 'white' })
    // Placeholder small peptide (Alanine dipeptide) in PDB format
    const pdb = `HEADER    ALA-ALA\nATOM      1  N   ALA A   1       0.000   1.204   0.000  1.00  0.00           N\nATOM      2  CA  ALA A   1       1.458   1.204   0.000  1.00  0.00           C\nATOM      3  C   ALA A   1       2.000  -0.200   0.000  1.00  0.00           C\nATOM      4  O   ALA A   1       1.200  -1.100   0.000  1.00  0.00           O\nTER\nEND\n`
    viewer.addModel(pdb, 'pdb')
    viewer.setStyle({}, { cartoon: { color: 'spectrum' }, stick: {} })
    viewer.zoomTo()
    viewer.render()
    return () => {
      try { viewer.clear(); } catch {}
    }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-lg font-medium mb-3">3D Protein Viewer (placeholder)</h2>
      <div ref={divRef} className="w-full h-64 border rounded" />
    </div>
  )
}
