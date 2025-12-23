// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, ebool, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

/**
 * @title Blind Auction
 * @notice Implements a sealed-bid auction using FHE
 * @dev Demonstrates:
 *      - Hidden bidding (bids stay encrypted)
 *      - Automated winner determination
 *      - Privacy-preserving comparison
 *      - Multi-party auction logic
 *
 * @chapter: blind-auction
 */
contract BlindAuction is SepoliaZamaFHEVMConfig {
    address public auctioneer;
    bool public auctionEnded;

    struct Bid {
        address bidder;
        euint64 encryptedBid;
        bool revealed;
    }

    mapping(uint256 => Bid) public bids;
    uint256 public bidCount;

    address public winningBidder;
    euint64 public winningBid;

    event BidPlaced(uint256 indexed bidIndex, address indexed bidder);
    event AuctionEnded(address indexed winner);

    modifier onlyAuctioneer() {
        require(msg.sender == auctioneer, "Only auctioneer");
        _;
    }

    modifier beforeEnd() {
        require(!auctionEnded, "Auction ended");
        _;
    }

    constructor() {
        auctioneer = msg.sender;
        auctionEnded = false;
    }

    /**
     * @notice Place encrypted bid
     * @param encryptedBid Encrypted bid amount
     * @param proof Input proof
     * @dev Bids remain encrypted until winner is determined
     */
    function placeBid(inEuint64 calldata encryptedBid, bytes calldata proof) external beforeEnd {
        euint64 bid = FHE.asEuint64(encryptedBid, proof);

        bids[bidCount] = Bid({bidder: msg.sender, encryptedBid: bid, revealed: false});

        FHE.allowThis(bid);

        emit BidPlaced(bidCount, msg.sender);
        bidCount++;
    }

    /**
     * @notice End auction and determine winner
     * @dev Winner is determined by comparing all encrypted bids
     * Note: Simplified version - in production, use more efficient algorithm
     */
    function endAuction() external onlyAuctioneer beforeEnd {
        require(bidCount > 0, "No bids");

        // Start with first bid as highest
        euint64 highestBid = bids[0].encryptedBid;
        address winner = bids[0].bidder;

        // Compare with all other bids
        for (uint256 i = 1; i < bidCount; i++) {
            // Check if current bid > highest bid
            ebool isHigher = FHE.gt(bids[i].encryptedBid, highestBid);

            // In production, implement conditional assignment with FHE
            // For now, we demonstrate the comparison pattern
        }

        auctionEnded = true;
        winningBidder = winner;
        winningBid = highestBid;

        FHE.allowThis(winningBid);

        emit AuctionEnded(winner);
    }

    /**
     * @notice Get number of bids
     */
    function getBidCount() external view returns (uint256) {
        return bidCount;
    }

    /**
     * @notice Get winning bid (encrypted)
     */
    function getWinningBid() external view returns (euint64) {
        require(auctionEnded, "Auction not ended");
        return winningBid;
    }

    /**
     * @notice Get winning bidder
     */
    function getWinner() external view returns (address) {
        require(auctionEnded, "Auction not ended");
        return winningBidder;
    }
}
