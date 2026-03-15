import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@/context/AuthContext'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useBuyTicket } from '@/hooks/useBuyTicket'
import { useConfig } from '@/hooks/useConfig'
import { useListTicket } from '@/hooks/useListTicket'
import { axiosInstance } from '@/api/axiosInstance'
import { BottomSheet } from '@/components/BottomSheet'
import { BuyConfirmSheet } from '@/components/BuyConfirmSheet'
import { TxAnimation } from '@/components/TxAnimation'
import { PriceInputSheet } from '@/components/PriceInputSheet'
import { ListProgressSheet } from '@/components/ListProgressSheet'
import { WalletPanel } from '@/components/WalletPanel'
import { MarketplaceGrid } from '@/components/MarketplaceGrid'
import { Toast } from '@/components/Toast'
import type { WalletInfo, ListingInfo } from '@/types/api'

export function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser, refreshCurrentUser, logout } = useAuth()
  const { listings, loading, error, refetch: refetchMarketplace } = useMarketplace()
  const { config } = useConfig()
  const buyerAddress = currentUser?.address ?? ''
  const { state: buyState, startBuy, confirmBuy, cancelBuy, reset } = useBuyTicket(buyerAddress)
  const {
    state: listState,
    startList,
    setPrice,
    confirmList,
    cancel: cancelList,
    reset: resetList,
  } = useListTicket(currentUser?.address ?? '', config?.marketplace_contract_address ?? '')

  const isBuySheetOpen =
    buyState.status === 'confirming' ||
    buyState.status === 'pending' ||
    buyState.status === 'success' ||
    buyState.status === 'error'

  const isListSheetOpen =
    listState.status === 'price-input' ||
    listState.status === 'approving' ||
    listState.status === 'listing' ||
    listState.status === 'success' ||
    listState.status === 'error'

  const isToastVisible = buyState.status === 'success' || buyState.status === 'error'
  const isListToastVisible = listState.status === 'success'

  const listedTokenIds = listings.map((l) => l.token_id)

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

  // After buy success, refresh marketplace and user data
  useEffect(() => {
    if (buyState.status === 'success') {
      void handleRefreshUser()
      refetchMarketplace()
    }
  }, [buyState.status, handleRefreshUser, refetchMarketplace])

  // After list success, refresh marketplace and user data
  useEffect(() => {
    if (listState.status === 'success') {
      void handleRefreshUser()
      refetchMarketplace()
    }
  }, [listState.status, handleRefreshUser, refetchMarketplace])

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

  const handleCloseListSheet = useCallback(() => {
    if (listState.status === 'price-input') {
      cancelList()
    } else {
      resetList()
    }
  }, [listState.status, cancelList, resetList])

  const handleSell = useCallback(
    (tokenId: number) => {
      startList(tokenId)
    },
    [startList]
  )

  const handlePriceConfirm = useCallback(
    (wei: string) => {
      setPrice(wei)
      void confirmList()
    },
    [setPrice, confirmList]
  )

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
          onSell={handleSell}
          onLogout={handleLogout}
          listedTokenIds={listedTokenIds}
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

      <BottomSheet isOpen={isBuySheetOpen} onClose={handleCloseSheet}>
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

      <BottomSheet isOpen={isListSheetOpen} onClose={handleCloseListSheet}>
        {listState.status === 'price-input' && listState.tokenId !== null && (
          <PriceInputSheet
            tokenId={listState.tokenId}
            onConfirm={handlePriceConfirm}
            onCancel={cancelList}
          />
        )}
        {(listState.status === 'approving' ||
          listState.status === 'listing' ||
          listState.status === 'success' ||
          listState.status === 'error') && (
          <ListProgressSheet
            status={listState.status}
            approveTxResult={listState.approveTxResult}
            listTxResult={listState.listTxResult}
            errorMessage={listState.error}
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

      <Toast
        message="Biglietto messo in vendita!"
        type="success"
        visible={isListToastVisible}
        onDismiss={resetList}
      />
    </div>
  )
}
