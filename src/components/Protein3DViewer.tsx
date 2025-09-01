import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { $3Dmol?: any }
}

export function Protein3DViewer() {
  const divRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<'idle'|'loading'|'ready'|'error'>('idle')

  useEffect(() => {
    let cancelled = false
    async function ensure3Dmol() {
      if (window.$3Dmol) return true
      setStatus('loading')
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://3dmol.org/build/3Dmol-min.js'
          script.async = true
          script.onload = () => resolve(true)
          script.onerror = () => reject(new Error('Failed to load 3Dmol.js'))
          document.head.appendChild(script)
        })
        return true
      } catch {
        return false
      }
    }

    async function init() {
      if (!divRef.current) return
      const ok = await ensure3Dmol()
      if (!ok || cancelled || !divRef.current || !window.$3Dmol) { setStatus('error'); return }
      const viewer = window.$3Dmol.createViewer(divRef.current, { backgroundColor: 'white' })
      // Simple placeholder: two atoms connected, visible as spheres & sticks
      const pdb = `HETATM    1  C1  LIG A   1       0.000   0.000   0.000  1.00  0.00           C\nHETATM    2  O1  LIG A   1       1.300   0.000   0.000  1.00  0.00           O\nCONECT    1    2\nEND\n`
      viewer.addModel(pdb, 'pdb')
      viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { radius: 0.5 } })
      viewer.zoomTo()
      viewer.render()
      if (!cancelled) setStatus('ready')
    }
    init()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h2 className="text-lg font-medium mb-3">3D Protein Viewer (placeholder)</h2>
      <div className="w-full h-64 border rounded relative overflow-hidden">
        <div ref={divRef} className="absolute inset-0" />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            {status === 'loading' ? 'Loading 3D viewer…' : status === 'error' ? '3D viewer failed to load.' : 'Idle'}
          </div>
        )}
      </div>
    </div>
  )
}
