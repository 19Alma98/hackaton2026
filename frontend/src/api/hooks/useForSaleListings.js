import { useState, useEffect, useCallback } from 'react'
import { getTickets } from '../generated/tickets/tickets'
import { enrichListings } from '../enrichment/enrichListings'

const { getTicketsForSaleApiTicketsForSaleGet } = getTickets()

export function useForSaleListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTicketsForSaleApiTicketsForSaleGet()
      setListings(enrichListings(data))
    } catch (err) {
      setError(err.message ?? 'Errore caricamento listings')
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return { listings, loading, error, refetch: fetchData }
}
