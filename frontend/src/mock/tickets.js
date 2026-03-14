// Biglietti in possesso del wallet mock (0xf39f...2266)
export const MY_TICKETS = [
  {
    tokenId: '42',
    eventId: 'evt-01',
    seat: 'Curva Nord – Settore 14 – Fila 8 – Posto 22',
    status: 'owned',
    listingPrice: null,
  },
  {
    tokenId: '87',
    eventId: 'evt-03',
    seat: 'Tribuna Parabolica – Fila 3 – Posto 7',
    status: 'listed',
    listingPrice: '0.11',
  },
  {
    tokenId: '103',
    eventId: 'evt-04',
    seat: 'Tribuna Centrale – Fila 1 – Posto 4',
    status: 'owned',
    listingPrice: null,
  },
]

// Biglietti in vendita nel marketplace
export const LISTINGS = [
  {
    tokenId: '17',
    eventId: 'evt-01',
    seat: 'Tribuna Ovest – Fila 12 – Posto 31',
    price: '0.15',
    seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  },
  {
    tokenId: '23',
    eventId: 'evt-01',
    seat: 'Secondo Anello Verde – Fila 5 – Posto 18',
    price: '0.13',
    seller: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  },
  {
    tokenId: '55',
    eventId: 'evt-02',
    seat: 'Tribuna Sud – Fila 2 – Posto 9',
    price: '0.22',
    seller: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  },
  {
    tokenId: '61',
    eventId: 'evt-02',
    seat: 'Curva Scirea – Settore B – Posto 44',
    price: '0.19',
    seller: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  },
  {
    tokenId: '78',
    eventId: 'evt-03',
    seat: 'Curva Lesmo – Fila 6 – Posto 11',
    price: '0.09',
    seller: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  },
]
