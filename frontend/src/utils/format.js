import { formatEther } from 'ethers'

/** 0x1234...abcd */
export function shortAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/** "Dom 12 Apr · 20:45" */
export function formatEventDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }) + ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

/** "0.12 ETH" */
export function formatEth(value) {
  return `${value} ETH`
}

/** "0.15 ETH" — converte una stringa wei in ETH leggibile */
export function formatWei(weiString) {
  try {
    return `${formatEther(weiString)} ETH`
  } catch {
    return '— ETH'
  }
}
