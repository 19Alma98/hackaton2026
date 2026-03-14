const GRADIENTS = [
  'from-violet-600 to-indigo-800',
  'from-rose-600 to-pink-900',
  'from-teal-500 to-cyan-800',
  'from-amber-500 to-orange-800',
  'from-emerald-500 to-green-800',
  'from-sky-500 to-blue-800',
  'from-fuchsia-600 to-purple-900',
]

/** Gradiente deterministico da una stringa (address o tokenId) */
export function stringToGradient(str = '') {
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}
