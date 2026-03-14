import { MY_TICKETS } from '../../mock'

/**
 * Arricchisce i TicketInfo dall'API con seat, eventId e status dal mock.
 * @param {import('../generated/hackaton2026TicketAPI.schemas').TicketInfo[]} apiTickets
 * @param {Set<string>} forSaleTokenIds - set di tokenId attualmente in vendita
 * @returns {{ tokenId: string, owner: string, status: 'owned'|'listed', eventId: string|null, seat: string, listingPrice: string|null }[]}
 */
export function enrichTickets(apiTickets, forSaleTokenIds) {
  return apiTickets.map((item) => {
    const tokenId = String(item.token_id)
    const mock = MY_TICKETS.find((t) => t.tokenId === tokenId)
    const isListed = forSaleTokenIds.has(tokenId)
    return {
      tokenId,
      owner: item.owner,
      status: isListed ? 'listed' : 'owned',
      eventId: mock?.eventId ?? null,
      seat: mock?.seat ?? `Posto #${tokenId}`,
      listingPrice: mock?.listingPrice ?? null,
    }
  })
}
