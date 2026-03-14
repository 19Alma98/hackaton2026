import ape
import pytest

ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


# ── ERC-721 basics ──────────────────────────────────────────────────

class TestMetadata:
    def test_name(self, ticket_nft):
        assert ticket_nft.name() == "HackTicket"

    def test_symbol(self, ticket_nft):
        assert ticket_nft.symbol() == "HTKT"


# ── Minting ─────────────────────────────────────────────────────────

class TestMint:
    def test_owner_can_mint(self, ticket_nft, owner, alice):
        receipt = ticket_nft.mint(alice, 1, sender=owner)
        assert ticket_nft.ownerOf(1) == alice.address
        assert receipt.status == 1

    def test_mint_emits_transfer_event(self, ticket_nft, owner, alice):
        receipt = ticket_nft.mint(alice, 100, sender=owner)
        events = list(receipt.decode_logs(ticket_nft.Transfer))
        assert len(events) == 1
        args = events[0].event_arguments
        assert args["from"] == ZERO_ADDRESS
        assert args["to"] == alice.address
        assert args["tokenId"] == 100

    def test_non_owner_cannot_mint(self, ticket_nft, alice, bob):
        with ape.reverts("Ownable: caller is not the owner"):
            ticket_nft.mint(bob, 200, sender=alice)

    def test_duplicate_token_id_reverts(self, ticket_nft, owner, alice):
        ticket_nft.mint(alice, 300, sender=owner)
        with ape.reverts("ERC721: token already minted"):
            ticket_nft.mint(alice, 300, sender=owner)


# ── Batch minting ───────────────────────────────────────────────────

class TestMintBatch:
    def test_mint_batch(self, ticket_nft, owner, alice, bob):
        receipt = ticket_nft.mintBatch(
            [alice, bob, alice],
            [10, 11, 12],
            sender=owner,
        )
        assert ticket_nft.ownerOf(10) == alice.address
        assert ticket_nft.ownerOf(11) == bob.address
        assert ticket_nft.ownerOf(12) == alice.address

        events = list(receipt.decode_logs(ticket_nft.Transfer))
        assert len(events) == 3

    def test_mint_batch_length_mismatch_reverts(self, ticket_nft, owner, alice):
        with ape.reverts("length mismatch"):
            ticket_nft.mintBatch([alice], [50, 51], sender=owner)

    def test_mint_batch_non_owner_reverts(self, ticket_nft, alice, bob):
        with ape.reverts("Ownable: caller is not the owner"):
            ticket_nft.mintBatch([bob], [60], sender=alice)


# ── ERC-721 Enumerable ──────────────────────────────────────────────

class TestEnumerable:
    def test_total_supply_increases_after_mint(self, ticket_nft, owner, alice):
        supply_before = ticket_nft.totalSupply()
        ticket_nft.mint(alice, 400, sender=owner)
        assert ticket_nft.totalSupply() == supply_before + 1

    def test_token_by_index(self, ticket_nft, owner, alice):
        ticket_nft.mint(alice, 500, sender=owner)
        total = ticket_nft.totalSupply()
        last_token = ticket_nft.tokenByIndex(total - 1)
        assert last_token == 500

    def test_token_of_owner_by_index(self, ticket_nft, owner, bob):
        balance_before = ticket_nft.balanceOf(bob)
        ticket_nft.mint(bob, 600, sender=owner)
        token_id = ticket_nft.tokenOfOwnerByIndex(bob, balance_before)
        assert token_id == 600

    def test_balance_of(self, ticket_nft, owner, bob):
        balance_before = ticket_nft.balanceOf(bob)
        ticket_nft.mint(bob, 700, sender=owner)
        assert ticket_nft.balanceOf(bob) == balance_before + 1
