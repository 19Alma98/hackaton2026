// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TicketMarketplace is ReentrancyGuard {
    IERC721 public immutable nft;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) private _listings;

    event Listed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event Sold(address indexed seller, address indexed buyer, uint256 indexed tokenId, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);

    constructor(address nftAddress) {
        require(nftAddress != address(0), "zero address");
        nft = IERC721(nftAddress);
    }

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
}
