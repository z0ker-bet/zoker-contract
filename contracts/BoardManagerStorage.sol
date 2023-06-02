// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

enum Rank {
    Spades, 
    Hearts,
    Diamonds,
    Clubs
}

// example: 
// card value: 50
// card info: rank: 50 / 13 = 3 (Clubs), value: 50 % 13 = 11 (2,3,4,5,6,7,8,9,j,>>Q<<,k,a)
struct CardInfo {
    Rank rank;
    uint256 value;
}

// the board state
struct Board {
    uint256 id;
    uint8 state;
    address dealer;
    address player;
    uint256 splitCounter;
    uint256 betPrice;

    // Player's info
    uint256 insuranceBet;
    uint256 playerBet;
    uint256[] playerCards;
    uint256[] playerCardsSplit;
    uint256 playerPointMax;
    uint256 playerPointMin;
    uint256 playerSplitTotal;
    uint256[] playerPointSplit;
    uint256 splitBet;

    // Dealer's info
    uint256 dealerBal;
    uint256[] dealerCards;

    uint256 dealerPointMax;
    uint256 dealerPointMin;

    bool canDouble;
    bool canInsure;
    bool canSplit;
    bool isSplitting;
    // bool isSoftHand;
    // bool isSoftHandSplit;
}