import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { BrowserProvider } from 'ethers'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID ?? '1337')

const Web3Context = createContext(null)

export function Web3Provider({ children }) {
  const [address, setAddress] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [currentChainId, setCurrentChainId] = useState(null)

  const isConnected = Boolean(address)
  const isWrongNetwork = isConnected && currentChainId !== null && currentChainId !== CHAIN_ID

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error('NO_METAMASK')

    const browserProvider = new BrowserProvider(window.ethereum)
    const accounts = await browserProvider.send('eth_requestAccounts', [])
    const s = await browserProvider.getSigner()
    const network = await browserProvider.getNetwork()

    setProvider(browserProvider)
    setSigner(s)
    setAddress(accounts[0])
    setCurrentChainId(Number(network.chainId))
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setProvider(null)
    setSigner(null)
  }, [])

  // Ripristina sessione se MetaMask è già connesso
  useEffect(() => {
    if (!window.ethereum) return

    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) {
        const browserProvider = new BrowserProvider(window.ethereum)
        browserProvider.getSigner().then((s) => {
          setProvider(browserProvider)
          setSigner(s)
          setAddress(accounts[0])
        })
      }
    })
  }, [])

  // Aggiorna address se l'utente cambia account in MetaMask
  useEffect(() => {
    if (!window.ethereum) return

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAddress(accounts[0])
      }
    }

    const onChainChanged = (chainIdHex) => {
      setCurrentChainId(parseInt(chainIdHex, 16))
    }

    window.ethereum.on('accountsChanged', onAccountsChanged)
    window.ethereum.on('chainChanged', onChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged)
      window.ethereum.removeListener('chainChanged', onChainChanged)
    }
  }, [disconnect])

  return (
    <Web3Context.Provider value={{ address, provider, signer, isConnected, isWrongNetwork, connect, disconnect, chainId: CHAIN_ID }}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const ctx = useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used inside <Web3Provider>')
  return ctx
}
