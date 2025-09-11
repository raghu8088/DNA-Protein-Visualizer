import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { $3Dmol?: any }
}

export function Protein3DViewer({ initialPdbId, proteinSeq }: { initialPdbId?: string, proteinSeq?: string }) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<any>(null)
  const [status, setStatus] = useState<'idle'|'loading'|'ready'|'error'>('idle')
  const [err, setErr] = useState<string | null>(null)
  const [pdbId, setPdbId] = useState(initialPdbId || '1T15') // Example BRCA1 BRCT domain
  const [style, setStyle] = useState<'cartoon'|'stick'|'sphere'|'mix'>('cartoon')
  const [color, setColor] = useState<'spectrum'|'chain'|'ss'|'white'>('spectrum')
  const [autoPredict, setAutoPredict] = useState(false)
  const [predicting, setPredicting] = useState(false)

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
      if (!ok || cancelled || !divRef.current || !window.$3Dmol) { setStatus('error'); setErr('Failed to initialize 3Dmol.js'); return }
      const viewer = window.$3Dmol.createViewer(divRef.current, { backgroundColor: 'white' })
      viewerRef.current = viewer
      // Load initial example by PDB ID (from prop if provided)
      try {
        await loadByPdbId(initialPdbId || pdbId)
      } catch (e: any) {
        setStatus('error'); setErr(e?.message || 'Failed to load structure')
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // If parent provides a new initialPdbId later, load it
  useEffect(() => {
    if (initialPdbId && viewerRef.current) {
      setPdbId(initialPdbId)
      loadByPdbId(initialPdbId).catch(e => { setStatus('error'); setErr(e?.message || 'Failed to load structure') })
    }
  }, [initialPdbId])

  function applyStyle(v: any) {
    const styleObj: any = {}
    if (style === 'cartoon') styleObj.cartoon = { color }
    else if (style === 'stick') styleObj.stick = { colorscheme: color, radius: 0.2 }
    else if (style === 'sphere') styleObj.sphere = { colorscheme: color, radius: 0.8 }
    else if (style === 'mix') {
      styleObj.cartoon = { color }
      styleObj.stick = { radius: 0.2, colorscheme: color }
    }
    v.setStyle({}, styleObj)
  }

  async function loadByPdbId(idRaw: string) {
    setErr(null)
    const v = viewerRef.current
    if (!v || !window.$3Dmol) throw new Error('Viewer not ready')
    const id = (idRaw || '').trim()
    if (!id) throw new Error('Enter a PDB ID')
    setStatus('loading')
    v.clear()
    await new Promise<void>((resolve, reject) => {
      try {
        window.$3Dmol.download(`pdb:${id}`, v, {}, function() {
          try {
            applyStyle(v)
            v.zoomTo()
            v.render()
            setStatus('ready')
            resolve()
          } catch (e) { reject(e) }
        })
      } catch (e) { reject(e) }
    })
  }

  async function loadLocalFile(file: File) {
    setErr(null)
    const v = viewerRef.current
    if (!v || !window.$3Dmol) throw new Error('Viewer not ready')
    const ext = file.name.toLowerCase().endsWith('.cif') || file.name.toLowerCase().endsWith('.mmcif') ? 'mmcif' : 'pdb'
    const text = await file.text()
    setStatus('loading')
    v.clear()
    v.addModel(text, ext)
    applyStyle(v)
    v.zoomTo()
    v.render()
    setStatus('ready')
  }

  async function predictFromSequence(seq: string) {
    if (!seq || seq.length < 20) throw new Error('Protein sequence too short for prediction')
    const v = viewerRef.current
    if (!v) throw new Error('Viewer not ready')
    setStatus('loading'); setPredicting(true); setErr(null)
    // Try ESMFold API (public). If blocked by CORS, user will need backend proxy.
    const urls = [
      'https://api.esmatlas.com/foldSequence/v1/pdb/',
    ]
    let lastErr: any = null
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: seq })
        if (!res.ok) throw new Error(`Prediction failed (${res.status})`)
        const pdb = await res.text()
        v.clear()
        v.addModel(pdb, 'pdb')
        applyStyle(v)
        v.zoomTo()
        v.render()
        setStatus('ready'); setPredicting(false)
        return
      } catch (e) {
        lastErr = e
      }
    }
    setPredicting(false)
    throw lastErr || new Error('Prediction failed')
  }

  // Auto-predict when protein sequence changes and autoPredict is on
  useEffect(() => {
    if (!autoPredict || !proteinSeq) return
    predictFromSequence(proteinSeq).catch((e:any)=>{ setStatus('error'); setErr(e?.message || 'Prediction failed (CORS or service)') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proteinSeq, autoPredict])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">3D Protein Viewer</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="PDB ID"
            value={pdbId}
            onChange={(e)=>setPdbId(e.target.value)}
          />
          <button className="px-2 py-1 rounded border" onClick={()=>loadByPdbId(pdbId)}>Load</button>
          <label className="px-2 py-1 rounded border cursor-pointer">
            Upload PDB/mmCIF
            <input type="file" className="hidden" accept=".pdb,.cif,.mmcif" onChange={(e)=>{const f=e.target.files?.[0]; if (f) loadLocalFile(f)}} />
          </label>
          <select className="border rounded px-2 py-1" value={style} onChange={(e)=>{ setStyle(e.target.value as any); const v=viewerRef.current; if(v){ applyStyle(v); v.render() } }}>
            <option value="cartoon">Cartoon</option>
            <option value="stick">Stick</option>
            <option value="sphere">Spheres</option>
            <option value="mix">Cartoon+Stick</option>
          </select>
          <select className="border rounded px-2 py-1" value={color} onChange={(e)=>{ setColor(e.target.value as any); const v=viewerRef.current; if(v){ applyStyle(v); v.render() } }}>
            <option value="spectrum">Spectrum</option>
            <option value="chain">Chain</option>
            <option value="ss">Secondary</option>
            <option value="white">White</option>
          </select>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={autoPredict} onChange={(e)=>setAutoPredict(e.target.checked)} />
            Auto predict from sequence
          </label>
          <button className="px-2 py-1 rounded border" disabled={!proteinSeq || predicting} onClick={()=>{ if(proteinSeq) predictFromSequence(proteinSeq).catch((e:any)=>{ setStatus('error'); setErr(e?.message || 'Prediction failed') }) }}>
            {predicting ? 'Predicting…' : 'Predict from Seq'}
          </button>
        </div>
      </div>
      <div className="w-full h-80 border rounded relative overflow-hidden">
        <div ref={divRef} className="absolute inset-0" />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            {status === 'loading' ? 'Loading…' : status === 'error' ? (err || '3D viewer failed to load.') : 'Idle'}
          </div>
        )}
      </div>
    </div>
  )
}
