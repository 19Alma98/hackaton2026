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


# ── makeOffer ────────────────────────────────────────────────────────

class TestMakeOffer:
    def test_buyer_can_make_offer(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 4001
        ticket_nft.mint(alice, token_id, sender=owner)

        receipt = marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        amount, active = marketplace.getOffer(token_id, bob)
        assert amount == PRICE
        assert active is True
        assert receipt.status == 1

    def test_make_offer_emits_event(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 4002
        ticket_nft.mint(alice, token_id, sender=owner)

        receipt = marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        events = list(receipt.decode_logs(marketplace.OfferMade))
        assert len(events) == 1
        args = events[0].event_arguments
        assert args["buyer"] == bob.address
        assert args["tokenId"] == token_id
        assert args["amount"] == PRICE

    def test_offer_must_be_positive(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 4003
        ticket_nft.mint(alice, token_id, sender=owner)

        with ape.reverts("offer must be > 0"):
            marketplace.makeOffer(token_id, sender=bob, value=0)

    def test_duplicate_offer_reverts(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 4004
        ticket_nft.mint(alice, token_id, sender=owner)

        marketplace.makeOffer(token_id, sender=bob, value=PRICE)
        with ape.reverts("offer already active"):
            marketplace.makeOffer(token_id, sender=bob, value=PRICE * 2)

    def test_multiple_buyers_can_offer(self, ticket_nft, marketplace, owner, alice, bob, charlie):
        token_id = 4005
        ticket_nft.mint(alice, token_id, sender=owner)

        marketplace.makeOffer(token_id, sender=bob, value=PRICE)
        marketplace.makeOffer(token_id, sender=charlie, value=PRICE * 2)

        amt_bob, active_bob = marketplace.getOffer(token_id, bob)
        amt_charlie, active_charlie = marketplace.getOffer(token_id, charlie)
        assert active_bob is True
        assert active_charlie is True
        assert amt_bob == PRICE
        assert amt_charlie == PRICE * 2


# ── acceptOffer ──────────────────────────────────────────────────────

class TestAcceptOffer:
    def test_seller_accepts_offer(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 5001
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)

        marketplace.makeOffer(token_id, sender=bob, value=PRICE)
        seller_bal_before = alice.balance

        receipt = marketplace.acceptOffer(token_id, bob, sender=alice)
        gas_cost = receipt.total_fees_paid

        assert ticket_nft.ownerOf(token_id) == bob.address
        assert alice.balance == seller_bal_before + PRICE - gas_cost
        assert receipt.status == 1

    def test_accept_emits_event(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 5002
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        receipt = marketplace.acceptOffer(token_id, bob, sender=alice)

        events = list(receipt.decode_logs(marketplace.OfferAccepted))
        assert len(events) == 1
        args = events[0].event_arguments
        assert args["seller"] == alice.address
        assert args["buyer"] == bob.address
        assert args["tokenId"] == token_id
        assert args["amount"] == PRICE

    def test_accept_clears_offer(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 5003
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        marketplace.acceptOffer(token_id, bob, sender=alice)

        _, active = marketplace.getOffer(token_id, bob)
        assert active is False

    def test_accept_cancels_active_listing(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 5004
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.listTicket(token_id, PRICE * 3, sender=alice)

        marketplace.makeOffer(token_id, sender=bob, value=PRICE)
        marketplace.acceptOffer(token_id, bob, sender=alice)

        _, _, listing_active = marketplace.getListing(token_id)
        assert listing_active is False

    def test_non_owner_cannot_accept(self, ticket_nft, marketplace, owner, alice, bob, charlie):
        token_id = 5005
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        with ape.reverts("not token owner"):
            marketplace.acceptOffer(token_id, bob, sender=charlie)

    def test_accept_without_approval_reverts(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 5006
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        with ape.reverts("marketplace not approved"):
            marketplace.acceptOffer(token_id, bob, sender=alice)

    def test_accept_nonexistent_offer_reverts(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 5007
        ticket_nft.mint(alice, token_id, sender=owner)
        ticket_nft.approve(marketplace.address, token_id, sender=alice)

        with ape.reverts("no active offer"):
            marketplace.acceptOffer(token_id, bob, sender=alice)


# ── rejectOffer ──────────────────────────────────────────────────────

class TestRejectOffer:
    def test_seller_rejects_and_buyer_refunded(
        self, ticket_nft, marketplace, owner, alice, bob
    ):
        token_id = 6001
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        buyer_bal_before = bob.balance

        receipt = marketplace.rejectOffer(token_id, bob, sender=alice)

        assert bob.balance == buyer_bal_before + PRICE
        assert receipt.status == 1

    def test_reject_emits_event(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 6002
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        receipt = marketplace.rejectOffer(token_id, bob, sender=alice)

        events = list(receipt.decode_logs(marketplace.OfferRejected))
        assert len(events) == 1
        args = events[0].event_arguments
        assert args["seller"] == alice.address
        assert args["buyer"] == bob.address
        assert args["tokenId"] == token_id

    def test_reject_clears_offer(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 6003
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        marketplace.rejectOffer(token_id, bob, sender=alice)

        _, active = marketplace.getOffer(token_id, bob)
        assert active is False

    def test_non_owner_cannot_reject(self, ticket_nft, marketplace, owner, alice, bob, charlie):
        token_id = 6004
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        with ape.reverts("not token owner"):
            marketplace.rejectOffer(token_id, bob, sender=charlie)

    def test_reject_nonexistent_offer_reverts(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 6005
        ticket_nft.mint(alice, token_id, sender=owner)

        with ape.reverts("no active offer"):
            marketplace.rejectOffer(token_id, bob, sender=alice)


# ── withdrawOffer ────────────────────────────────────────────────────

class TestWithdrawOffer:
    def test_buyer_withdraws_and_gets_refund(
        self, ticket_nft, marketplace, owner, alice, bob
    ):
        token_id = 7001
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        buyer_bal_before = bob.balance

        receipt = marketplace.withdrawOffer(token_id, sender=bob)
        gas_cost = receipt.total_fees_paid

        assert bob.balance == buyer_bal_before + PRICE - gas_cost
        assert receipt.status == 1

    def test_withdraw_emits_event(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 7002
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        receipt = marketplace.withdrawOffer(token_id, sender=bob)

        events = list(receipt.decode_logs(marketplace.OfferWithdrawn))
        assert len(events) == 1
        args = events[0].event_arguments
        assert args["buyer"] == bob.address
        assert args["tokenId"] == token_id

    def test_withdraw_clears_offer(self, ticket_nft, marketplace, owner, alice, bob):
        token_id = 7003
        ticket_nft.mint(alice, token_id, sender=owner)
        marketplace.makeOffer(token_id, sender=bob, value=PRICE)

        marketplace.withdrawOffer(token_id, sender=bob)

        _, active = marketplace.getOffer(token_id, bob)
        assert active is False

    def test_withdraw_nonexistent_offer_reverts(self, marketplace, bob):
        with ape.reverts("no active offer"):
            marketplace.withdrawOffer(99999, sender=bob)

    def test_buyer_can_reoffer_after_withdraw(
        self, ticket_nft, marketplace, owner, alice, bob
    ):
        token_id = 7004
        ticket_nft.mint(alice, token_id, sender=owner)

        marketplace.makeOffer(token_id, sender=bob, value=PRICE)
        marketplace.withdrawOffer(token_id, sender=bob)

        new_amount = PRICE * 2
        marketplace.makeOffer(token_id, sender=bob, value=new_amount)

        amount, active = marketplace.getOffer(token_id, bob)
        assert amount == new_amount
        assert active is True


# ── getOffer view ────────────────────────────────────────────────────

class TestGetOffer:
    def test_no_offer_returns_defaults(self, marketplace, bob):
        amount, active = marketplace.getOffer(77777, bob)
        assert amount == 0
        assert active is False
