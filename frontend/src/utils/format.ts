import { formatEther } from 'ethers'

/**
 * Tronca un indirizzo Ethereum: "0x1234...abcd"
 */
export function shortAddress(address: string): string {
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Converte wei (stringa) in ETH leggibile: "1.0 ETH"
 */
export function formatEth(weiValue: string, decimals = 4): string {
  try {
    const eth = formatEther(BigInt(weiValue))
    const rounded = parseFloat(eth).toFixed(decimals).replace(/\.?0+$/, '')
    return `${rounded} ETH`
  } catch {
    return '0 ETH'
  }
}

/**
 * Mostra il block number come riferimento temporale.
 * Può essere esteso con timestamp reale nelle fasi successive.
 */
export function formatDate(blockNumber: number): string {
  return `Block #${blockNumber}`
}


export function changeStringMultiRealBitcoin(string: string) {
  if(string.includes("MultiRealBitcoin")) {
    return "MyRealBigliettoh"
  }
} 