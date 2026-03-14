// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TicketMarketplace is ReentrancyGuard {
    IERC721 public immutable nft;

    // ── Fixed-price listings ────────────────────────────────────────

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) private _listings;

    event Listed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event Sold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);

    // ── Offers (proposal / accept / reject) ─────────────────────────

    struct Offer {
        uint256 amount;
        bool active;
    }

    // tokenId => buyer => Offer  (one offer per buyer per token)
    mapping(uint256 => mapping(address => Offer)) private _offers;

    event OfferMade(address indexed buyer, uint256 indexed tokenId, uint256 amount);
    event OfferAccepted(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 amount);
    event OfferRejected(address indexed seller, address indexed buyer, uint256 indexed tokenId);
    event OfferWithdrawn(address indexed buyer, uint256 indexed tokenId);

    constructor(address nftAddress) {
        require(nftAddress != address(0), "zero address");
        nft = IERC721(nftAddress);
    }

    // ── Listing functions ───────────────────────────────────────────

    function listTicket(uint256 tokenId, uint256 price) external {
        require(price > 0, "price must be > 0");
        require(nft.ownerOf(tokenId) == msg.sender, "not token owner");
        require(
            nft.getApproved(tokenId) == address(this) ||
            nft.isApprovedForAll(msg.sender, address(this)),
            "marketplace not approved"
        );

        _listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        emit Listed(msg.sender, tokenId, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = _listings[tokenId];
        require(listing.active, "not listed");
        require(listing.seller == msg.sender, "not seller");

        delete _listings[tokenId];
        emit ListingCancelled(tokenId);
    }

    function buyTicket(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = _listings[tokenId];
        require(listing.active, "not listed");
        require(msg.value >= listing.price, "insufficient payment");

        delete _listings[tokenId];

        nft.transferFrom(listing.seller, msg.sender, tokenId);

        (bool sent, ) = payable(listing.seller).call{value: listing.price}("");
        require(sent, "ETH transfer failed");

        uint256 excess = msg.value - listing.price;
        if (excess > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: excess}("");
            require(refunded, "refund failed");
        }

        emit Sold(listing.seller, msg.sender, tokenId, listing.price);
    }

    function getListing(uint256 tokenId) external view returns (address seller, uint256 price, bool active) {
        Listing storage listing = _listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }

    // ── Offer functions ─────────────────────────────────────────────

    /// @notice Buyer sends ETH as an offer for a token. The ETH is held
    ///         in escrow until the seller accepts/rejects or the buyer withdraws.
    function makeOffer(uint256 tokenId) external payable {
        require(msg.value > 0, "offer must be > 0");
        require(nft.ownerOf(tokenId) != address(0), "token does not exist");
        require(!_offers[tokenId][msg.sender].active, "offer already active");

        _offers[tokenId][msg.sender] = Offer({
            amount: msg.value,
            active: true
        });

        emit OfferMade(msg.sender, tokenId, msg.value);
    }

    /// @notice Token owner accepts an offer: NFT goes to buyer, ETH to seller.
    function acceptOffer(uint256 tokenId, address buyer) external nonReentrant {
        require(nft.ownerOf(tokenId) == msg.sender, "not token owner");
        require(
            nft.getApproved(tokenId) == address(this) ||
            nft.isApprovedForAll(msg.sender, address(this)),
            "marketplace not approved"
        );

        Offer memory offer = _offers[tokenId][buyer];
        require(offer.active, "no active offer");

        delete _offers[tokenId][buyer];

        // Cancel any active fixed-price listing for this token
        if (_listings[tokenId].active) {
            delete _listings[tokenId];
        }

        nft.transferFrom(msg.sender, buyer, tokenId);

        (bool sent, ) = payable(msg.sender).call{value: offer.amount}("");
        require(sent, "ETH transfer failed");

        emit OfferAccepted(msg.sender, buyer, tokenId, offer.amount);
    }

    /// @notice Token owner rejects an offer and refunds the buyer.
    function rejectOffer(uint256 tokenId, address buyer) external nonReentrant {
        require(nft.ownerOf(tokenId) == msg.sender, "not token owner");

        Offer memory offer = _offers[tokenId][buyer];
        require(offer.active, "no active offer");

        delete _offers[tokenId][buyer];

        (bool refunded, ) = payable(buyer).call{value: offer.amount}("");
        require(refunded, "refund failed");

        emit OfferRejected(msg.sender, buyer, tokenId);
    }

    /// @notice Buyer withdraws their own offer and gets their ETH back.
    function withdrawOffer(uint256 tokenId) external nonReentrant {
        Offer memory offer = _offers[tokenId][msg.sender];
        require(offer.active, "no active offer");

        delete _offers[tokenId][msg.sender];

        (bool refunded, ) = payable(msg.sender).call{value: offer.amount}("");
        require(refunded, "refund failed");

        emit OfferWithdrawn(msg.sender, tokenId);
    }

    function getOffer(uint256 tokenId, address buyer) external view returns (uint256 amount, bool active) {
        Offer storage offer = _offers[tokenId][buyer];
        return (offer.amount, offer.active);
    }
}
