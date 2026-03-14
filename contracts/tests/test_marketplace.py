import ape
import pytest

PRICE = 10**18  # 1 ETH


# ── Listing ──────────────────────────────────────────────────────────

class TestListTicket:
    def test_owner_can_list(self, ticket_nft, marketplace, owner, alice):
        token_id = 1001
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)

        receipt = marketplace.listTicket(token_id, PRICE, sender=alice)

        seller, price, active = marketplace.getListing(token_id)
        assert seller == alice.address
        assert price == PRICE
        assert active is True
        assert receipt.status == 1

    def test_list_emits_listed_event(self, ticket_nft, marketplace, owner, alice):
        token_id = 1002
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)

        receipt = marketplace.listTicket(token_id, PRICE, sender=alice)

        events = list(receipt.decode_logs(marketplace.Listed))
        assert len(events) == 1
        args = events[0].event_arguments
        assert args["seller"] == alice.address
        assert args["tokenId"] == token_id
        assert args["price"] == PRICE

    def test_non_owner_cannot_list(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 1003
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)

        with ape.reverts("not token owner"):
            marketplace.listTicket(token_id, PRICE, sender=bob)

    def test_price_must_be_positive(self, ticket_nft, marketplace, owner, alice):
        token_id = 1004
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)

        with ape.reverts("price must be > 0"):
            marketplace.listTicket(token_id, 0, sender=alice)

    def test_must_be_approved(self, ticket_nft, marketplace, owner, alice):
        token_id = 1005
        ticket_nft.mint(alice, token_id, sender=owner)

        with ape.reverts("marketplace not approved"):
            marketplace.listTicket(token_id, PRICE, sender=alice)

    def test_relist_replaces_previous(self, ticket_nft, marketplace, owner, alice):
        token_id = 1006
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)

        marketplace.listTicket(token_id, PRICE, sender=alice)
        new_price = PRICE * 2
        marketplace.listTicket(token_id, new_price, sender=alice)

        _, price, active = marketplace.getListing(token_id)
        assert price == new_price
        assert active is True

    def test_approved_for_all_works(self, ticket_nft, marketplace, owner, alice):
        token_id = 1007
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.setApprovalForAll(marketplace.address, True, sender=alice)

        receipt = marketplace.listTicket(token_id, PRICE, sender=alice)
        assert receipt.status == 1

        ticket_nft.setApprovalForAll(marketplace.address, False, sender=alice)


# ── Buying ───────────────────────────────────────────────────────────

class TestBuyTicket:
    def test_buyer_receives_nft_and_seller_receives_eth(
        self, ticket_nft, marketplace, owner, alice, bob
    ):
        token_id = 2001
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        seller_balance_before = alice.balance

        marketplace.buyTicket(token_id, sender=bob, value=PRICE)

        assert ticket_nft.ownerOf(token_id) == bob.address
        assert alice.balance == seller_balance_before + PRICE

    def test_buy_emits_sold_event(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 2002
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        receipt = marketplace.buyTicket(token_id, sender=bob, value=PRICE)

        events = list(receipt.decode_logs(marketplace.Sold))
        assert len(events) == 1
        args = events[0].event_arguments
        assert args["seller"] == alice.address
        assert args["buyer"] == bob.address
        assert args["tokenId"] == token_id
        assert args["price"] == PRICE

    def test_listing_cleared_after_purchase(
        self, ticket_nft, marketplace, owner, alice, bob
    ):
        token_id = 2003
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        marketplace.buyTicket(token_id, sender=bob, value=PRICE)

        _, _, active = marketplace.getListing(token_id)
        assert active is False

    def test_insufficient_payment_reverts(
        self, ticket_nft, marketplace, owner, alice, bob
    ):
        token_id = 2004
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        with ape.reverts("insufficient payment"):
            marketplace.buyTicket(token_id, sender=bob, value=PRICE - 1)

    def test_buy_unlisted_token_reverts(self, marketplace, bob):
        with ape.reverts("not listed"):
            marketplace.buyTicket(99999, sender=bob, value=PRICE)

    def test_overpayment_refunded(
        self, ticket_nft, marketplace, owner, alice, charlie
    ):
        token_id = 2005
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        overpay = PRICE * 2
        buyer_balance_before = charlie.balance

        receipt = marketplace.buyTicket(token_id, sender=charlie, value=overpay)
        gas_cost = receipt.total_fees_paid

        expected = buyer_balance_before - PRICE - gas_cost
        assert charlie.balance == expected


# ── Cancel listing ───────────────────────────────────────────────────

class TestCancelListing:
    def test_seller_can_cancel(self, ticket_nft, marketplace, owner, alice):
        token_id = 3001
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        receipt = marketplace.cancelListing(token_id, sender=alice)

        _, _, active = marketplace.getListing(token_id)
        assert active is False
        assert receipt.status == 1

    def test_cancel_emits_event(self, ticket_nft, marketplace, owner, alice):
        token_id = 3002
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        receipt = marketplace.cancelListing(token_id, sender=alice)

        events = list(receipt.decode_logs(marketplace.ListingCancelled))
        assert len(events) == 1
        assert events[0].event_arguments["tokenId"] == token_id

    def test_non_seller_cannot_cancel(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 3003
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)

        with ape.reverts("not seller"):
            marketplace.cancelListing(token_id, sender=bob)

    def test_cancel_unlisted_reverts(self, marketplace, alice):
        with ape.reverts("not listed"):
            marketplace.cancelListing(88888, sender=alice)

    def test_buy_after_cancel_reverts(
        self, ticket_nft, marketplace, owner, alice, bob
    ):
        token_id = 3004
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE, sender=alice)
        marketplace.cancelListing(token_id, sender=alice)

        with ape.reverts("not listed"):
            marketplace.buyTicket(token_id, sender=bob, value=PRICE)


# ── getListing view ──────────────────────────────────────────────────

class TestGetListing:
    def test_unlisted_returns_defaults(self, marketplace):
        seller, price, active = marketplace.getListing(77777)
        assert seller == "0x0000000000000000000000000000000000000000"
        assert price == 0
        assert active is False
