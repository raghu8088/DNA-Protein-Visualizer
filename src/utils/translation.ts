const CODON_TABLE_ONE: Record<string, string> = {
  TTT:'F',TTC:'F',TTA:'L',TTG:'L',
  TCT:'S',TCC:'S',TCA:'S',TCG:'S',
  TAT:'Y',TAC:'Y',TAA:'*',TAG:'*',
  TGT:'C',TGC:'C',TGA:'*',TGG:'W',
  CTT:'L',CTC:'L',CTA:'L',CTG:'L',
  CCT:'P',CCC:'P',CCA:'P',CCG:'P',
  CAT:'H',CAC:'H',CAA:'Q',CAG:'Q',
  CGT:'R',CGC:'R',CGA:'R',CGG:'R',
  ATT:'I',ATC:'I',ATA:'I',ATG:'M',
  ACT:'T',ACC:'T',ACA:'T',ACG:'T',
  AAT:'N',AAC:'N',AAA:'K',AAG:'K',
  AGT:'S',AGC:'S',AGA:'R',AGG:'R',
  GTT:'V',GTC:'V',GTA:'V',GTG:'V',
  GCT:'A',GCC:'A',GCA:'A',GCG:'A',
  GAT:'D',GAC:'D',GAA:'E',GAG:'E',
  GGT:'G',GGC:'G',GGA:'G',GGG:'G',
}

const ONE_TO_THREE: Record<string, string> = {
  A:'Ala', R:'Arg', N:'Asn', D:'Asp', C:'Cys', Q:'Gln', E:'Glu', G:'Gly', H:'His', I:'Ile',
  L:'Leu', K:'Lys', M:'Met', F:'Phe', P:'Pro', S:'Ser', T:'Thr', W:'Trp', Y:'Tyr', V:'Val', '*':'Stop'
}

const START = 'ATG'
const STOPS = new Set(['TAA','TAG','TGA'])

export function sanitizeDNA(text: string): string {
  return (text || '').toUpperCase().replace(/[^ATGC]/g, '')
}

export function parseFasta(text: string): string {
  return text.split('\n').filter(line => !line.startsWith('>')).join('').trim()
}

export function toCodons(seq: string): string[] {
  const codons: string[] = []
  for (let i=0; i+2<seq.length; i+=3) codons.push(seq.slice(i, i+3))
  return codons
}

export function reverseComplement(seq: string): string {
  const map: Record<string,string> = { A:'T', T:'A', G:'C', C:'G' }
  return seq.split('').reverse().map(ch => map[ch] || '').join('')
}

export function toCodonsFromFrame(seqRaw: string, frame: 0|1|2, strand: '+'|'-'): string[] {
  let seq = sanitizeDNA(seqRaw)
  if (strand === '-') seq = reverseComplement(seq)
  if (frame) seq = seq.slice(frame)
  return toCodons(seq)
}

export function translateCodonOne(codon: string): string {
  return CODON_TABLE_ONE[codon] ?? '?'
}

// Translate from first ATG until the first stop codon (standard translation)
export function translateDNA(seqRaw: string): { one: string; three: string } {
  const seq = sanitizeDNA(seqRaw)
  // Start translation from first ATG, stop at first stop codon
  const startIdx = seq.indexOf(START)
  if (startIdx === -1) return { one: '', three: '' }
  let one = ''
  for (let i = startIdx; i+2 < seq.length; i += 3) {
    const c = seq.slice(i, i+3)
    const aa = translateCodonOne(c)
    if (aa === '*') break
    one += aa
  }
  const three = one.split('').map(a => ONE_TO_THREE[a] ?? '???').join('-')
  return { one, three }
}

export function translateFromFrame(seqRaw: string, frame: 0|1|2, strand: '+'|'-') {
  let seq = sanitizeDNA(seqRaw)
  if (strand === '-') seq = reverseComplement(seq)
  if (frame) seq = seq.slice(frame)
  const start = seq.indexOf(START)
  if (start < 0) return { one: '', three: '' }
  let one = ''
  for (let i=start; i+2<seq.length; i+=3){
    const c = seq.slice(i,i+3)
    const aa = translateCodonOne(c)
    if (aa === '*') break
    one += aa
  }
  const three = one.split('').map(a => ONE_TO_THREE[a] ?? '???').join('-')
  return { one, three }
}

export function codonUsage(seqRaw: string, frame: 0|1|2, strand: '+'|'-') {
  const arr = toCodonsFromFrame(seqRaw, frame, strand)
  const map: Record<string, number> = {}
  for (const c of arr) map[c] = (map[c]||0)+1
  return map
}

export function aaComposition(oneLetter: string) {
  const map: Record<string, number> = {}
  for (const a of oneLetter) map[a] = (map[a]||0)+1
  return map
}

export function estimateProteinMW(oneLetter: string) {
  // Average residue masses (approx, in Da)
  const mass: Record<string, number> = {
    A:89.09,R:174.20,N:132.12,D:133.10,C:121.16,Q:146.15,E:147.13,G:75.07,H:155.16,I:131.18,
    L:131.18,K:146.19,M:149.21,F:165.19,P:115.13,S:105.09,T:119.12,W:204.23,Y:181.19,V:117.15
  }
  let total = 18.015 // add water once for termini approx
  let prev: string | null = null
  for (const a of oneLetter) {
    if (!mass[a]) continue
    total += mass[a] - 18.015 // subtract water for peptide bond
    prev = a
  }
  return total // in Da
}

// Heuristic: classify raw sequence as 'dna' if >=90% characters are A/T/G/C (ignoring whitespace)
export function detectSequenceType(seqRaw: string): 'dna' | 'protein' | 'unknown' {
  const s = (seqRaw || '').toUpperCase().replace(/\s/g, '')
  if (!s) return 'unknown'
  let atgc = 0
  for (const ch of s) {
    if (ch === 'A' || ch === 'T' || ch === 'G' || ch === 'C') atgc++
  }
  const ratio = atgc / s.length
  return ratio >= 0.9 ? 'dna' : 'protein'
}

// Try to detect a PDB ID from a FASTA header line. We only trust explicit 'pdb' tags to avoid false positives.
export function detectPdbIdFromFastaHeader(rawText: string): string | null {
  const firstLine = (rawText.split('\n')[0] || '').trim()
  if (!firstLine.startsWith('>')) return null
  const header = firstLine
  // Common patterns: pdb|1T15|, PDB:1T15, pdb 1T15
  const patterns = [
    /pdb\|([0-9][A-Za-z0-9]{3})\|/i,
    /pdb[:\s]+([0-9][A-Za-z0-9]{3})/i,
  ]
  for (const re of patterns) {
    const m = header.match(re)
    if (m && m[1]) return m[1].toUpperCase()
  }
  return null
}
