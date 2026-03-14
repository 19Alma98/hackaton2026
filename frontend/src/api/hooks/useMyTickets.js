import { useState, useEffect, useCallback } from 'react'
import { getTickets } from '../generated/tickets/tickets'
import { MY_TICKETS } from '../../mock'
import { enrichTickets } from '../enrichment/enrichTickets'

const { getUserTicketsApiTicketsUserAddressGet, getTicketsForSaleApiTicketsForSaleGet } = getTickets()

export function useMyTickets(address) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!address) {
      setTickets([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [userResult, forSaleResult] = await Promise.allSettled([
        getUserTicketsApiTicketsUserAddressGet(address),
        getTicketsForSaleApiTicketsForSaleGet(),
      ])
      if (userResult.status === 'rejected') throw userResult.reason
      const forSaleListings = forSaleResult.status === 'fulfilled' ? forSaleResult.value : []
      const forSaleSet = new Set(forSaleListings.map((l) => String(l.token_id)))
      setTickets(enrichTickets(userResult.value, forSaleSet))
    } catch (err) {
      setError(err.message ?? 'Errore caricamento biglietti')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => { fetchData() }, [fetchData])

  return { tickets, loading, error, refetch: fetchData }
}
