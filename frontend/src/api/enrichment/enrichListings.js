import { LISTINGS } from '../../mock'
import { formatWei } from '../../utils/format'

/**
 * Arricchisce i ListingInfo dall'API con seat e eventId dal mock.
 * @param {import('../generated/hackaton2026TicketAPI.schemas').ListingInfo[]} apiListings
 * @returns {{ tokenId: string, seller: string, priceWei: string, price: string, eventId: string|null, seat: string }[]}
 */
export function enrichListings(apiListings) {
  return apiListings.map((item) => {
    const tokenId = String(item.token_id)
    const mock = LISTINGS.find((l) => l.tokenId === tokenId)
    return {
      tokenId,
      seller: item.seller,
      priceWei: item.price_wei,
      price: formatWei(item.price_wei),
      eventId: mock?.eventId ?? null,
      seat: mock?.seat ?? `Posto #${tokenId}`,
    }
  })
}
