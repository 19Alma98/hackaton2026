import { useState, useEffect } from 'react'
import { getWallets } from '../generated/wallets/wallets'

const { getWalletsApiWalletsGet } = getWallets()

const FALLBACK_WALLET = { balance_eth: 0, nonce: 0 }

export function useWallet(address) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address) return

    setLoading(true)
    setError(null)
    getWalletsApiWalletsGet({ address })
      .then((data) => {
        setWallet(data[0] ?? FALLBACK_WALLET)
      })
      .catch((err) => {
        setError(err.message ?? 'Errore caricamento wallet')
        setWallet(FALLBACK_WALLET)
      })
      .finally(() => setLoading(false))
  }, [address])

  return { wallet, loading, error }
}
