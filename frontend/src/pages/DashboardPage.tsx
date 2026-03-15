import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useBuyTicket } from '@/hooks/useBuyTicket'
import { axiosInstance } from '@/api/axiosInstance'
import { BottomSheet } from '@/components/BottomSheet'
import { BuyConfirmSheet } from '@/components/BuyConfirmSheet'
import { TxAnimation } from '@/components/TxAnimation'
import { WalletPanel } from '@/components/WalletPanel'
import { MarketplaceGrid } from '@/components/MarketplaceGrid'
import { Toast } from '@/components/Toast'
import type { WalletInfo, ListingInfo } from '@/types/api'

export function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser, refreshCurrentUser, logout } = useAuth()
  const { listings, loading, error, refetch: refetchMarketplace } = useMarketplace()
  const buyerAddress = currentUser?.address ?? ''
  const { state: buyState, startBuy, confirmBuy, cancelBuy, reset } = useBuyTicket(buyerAddress)

  const isBottomSheetOpen =
    buyState.status === 'confirming' ||
    buyState.status === 'pending' ||
    buyState.status === 'success' ||
    buyState.status === 'error'

  const isToastVisible = buyState.status === 'success' || buyState.status === 'error'

  const handleRefreshUser = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await axiosInstance.get<WalletInfo[]>('/api/wallets', { signal })
      refreshCurrentUser(response.data)
    } catch (err) {
      if (axios.isCancel(err)) return
      // Silently ignore — user data stays as-is
    }
  }, [refreshCurrentUser])

  // Refresh user data on mount (e.g. page reload after purchase)
  useEffect(() => {
    const controller = new AbortController()
    void handleRefreshUser(controller.signal)
    return () => controller.abort()
  }, [handleRefreshUser])

  // After success, refresh marketplace and user data
  useEffect(() => {
    if (buyState.status === 'success') {
      void handleRefreshUser()
      refetchMarketplace()
    }
  }, [buyState.status, handleRefreshUser, refetchMarketplace])

  const handleTokenClick = useCallback(
    (tokenId: number) => {
      navigate('/token/' + tokenId)
    },
    [navigate]
  )

  const handleLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  const handleBuyListing = useCallback(
    (listing: ListingInfo) => {
      startBuy(listing)
    },
    [startBuy]
  )

  const handleConfirm = useCallback(() => {
    void confirmBuy()
  }, [confirmBuy])

  const handleCloseSheet = useCallback(() => {
    if (buyState.status === 'confirming') {
      cancelBuy()
    } else {
      reset()
    }
  }, [buyState.status, cancelBuy, reset])

  if (currentUser === null) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#050508] p-4">
      <header className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-white">HaCCaTThon - Chain</h1>
        <p className="text-slate-400 text-sm">{currentUser.name}</p>
      </header>

      <main className="max-w-5xl mx-auto grid lg:grid-cols-[320px_1fr] gap-6">
        <WalletPanel
          wallet={currentUser}
          onTokenClick={handleTokenClick}
          onLogout={handleLogout}
        />

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white">Marketplace</h2>
          <MarketplaceGrid
            listings={listings}
            loading={loading}
            error={error}
            currentAddress={currentUser.address}
            onBuy={handleBuyListing}
          />
        </section>
      </main>

      <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseSheet}>
        {buyState.status === 'confirming' && buyState.listing !== null && (
          <BuyConfirmSheet
            listing={buyState.listing}
            buyerAddress={buyerAddress}
            onConfirm={handleConfirm}
            onCancel={cancelBuy}
          />
        )}
        {(buyState.status === 'pending' ||
          buyState.status === 'success' ||
          buyState.status === 'error') && (
          <TxAnimation
            status={buyState.status}
            txHash={buyState.txResult?.tx_hash}
            errorMessage={buyState.error}
          />
        )}
      </BottomSheet>

      <Toast
        message={
          buyState.status === 'success'
            ? 'Biglietto acquistato con successo!'
            : buyState.error ?? 'Errore durante l\'acquisto'
        }
        type={buyState.status === 'success' ? 'success' : 'error'}
        visible={isToastVisible}
        onDismiss={reset}
      />
    </div>
  )
}
