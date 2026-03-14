import { useState } from 'react'
import axiosInstance from '../axiosInstance'

export function useMarketplaceActions() {
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  async function listTicket(sellerAddress, tokenId, priceEth) {
    setActionLoading(true)
    setActionError(null)
    try {
      const config = await axiosInstance({ method: 'GET', url: '/api/config' })
      const marketplaceAddr = config.marketplace_contract_address

      await axiosInstance({
        method: 'POST',
        url: '/api/transfers/nft/approve',
        data: {
          owner_address: sellerAddress,
          approved_address: marketplaceAddr,
          token_id: Number(tokenId),
          wait_for_receipt: true,
        },
      })

      const priceWei = String(
        BigInt(Math.round(parseFloat(priceEth) * 1e9)) * BigInt(1e9)
      )

      await axiosInstance({
        method: 'POST',
        url: '/api/marketplace/list',
        data: {
          seller_address: sellerAddress,
          token_id: Number(tokenId),
          price_wei: priceWei,
          wait_for_receipt: true,
        },
      })

      return { ok: true, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail ?? err.message ?? 'Errore durante la vendita'
      setActionError(msg)
      return { ok: false, error: msg }
    } finally {
      setActionLoading(false)
    }
  }

  async function cancelListing(sellerAddress, tokenId) {
    setActionLoading(true)
    setActionError(null)
    try {
      await axiosInstance({
        method: 'POST',
        url: '/api/marketplace/cancel',
        data: {
          seller_address: sellerAddress,
          token_id: Number(tokenId),
          wait_for_receipt: true,
        },
      })
      return { ok: true, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail ?? err.message ?? 'Errore durante il ritiro'
      setActionError(msg)
      return { ok: false, error: msg }
    } finally {
      setActionLoading(false)
    }
  }

  async function buyTicket(buyerAddress, tokenId, priceWei) {
    setActionLoading(true)
    setActionError(null)
    try {
      await axiosInstance({
        method: 'POST',
        url: '/api/marketplace/buy',
        data: {
          buyer_address: buyerAddress,
          token_id: Number(tokenId),
          value_wei: priceWei,
          wait_for_receipt: true,
        },
      })
      return { ok: true, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail ?? err.message ?? 'Acquisto fallito'
      setActionError(msg)
      return { ok: false, error: msg }
    } finally {
      setActionLoading(false)
    }
  }

  return { listTicket, cancelListing, buyTicket, actionLoading, actionError }
}
