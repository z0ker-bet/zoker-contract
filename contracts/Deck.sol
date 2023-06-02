// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "hardhat/console.sol";

interface IShuffleVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[209] memory input
    ) external view;
}

interface IDecrypt1 {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) external view;
}

interface IDecrypt3 {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[10] memory input
    ) external view;
}

interface IDecrypt4 {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory input
    ) external view;
}

contract DeckManagement {
    mapping (uint256 => Deck) decks;

    IShuffleVerifier shuffle;

    IDecrypt1 decrypt1;

    IDecrypt3 decrypt3;

    IDecrypt4 decrypt4;

    struct Deck {
        uint256[52] deck;
        uint256[52] userDecrypted;
        uint256[52] dealerDecrypted;
        uint8 currentUserDecryptedIndex;
    }

    function getDeck(uint256 gameId) public view returns (uint256[52] memory) {
        uint256[52] memory deck = decks[gameId].deck;
        return deck;
    }

    function getUserDecrypted(uint256 gameId, uint8 index) public view returns (uint256) {
        uint256 userDecrypted = decks[gameId].userDecrypted[index];
        return userDecrypted;
    }

    function getUserDecrypteds(uint256 gameId) public view returns (uint256[52] memory) {
        uint256[52] memory userDecrypted = decks[gameId].userDecrypted;
        return userDecrypted;
    }

    function getDealerDecrypteds(uint256 gameId) public view returns (uint256[52] memory) {
        uint256[52] memory dealerDecrypted = decks[gameId].dealerDecrypted;
        return dealerDecrypted;
    }

    function setup(
        uint256 gameId,
        uint256[52] calldata startingDeck
    ) external returns (bool) {
        Deck storage deck = decks[gameId];
        deck.deck = startingDeck;
        return true;
    }

    function moveUserDecryptedIndex(
        uint256 gameId,
        uint8 index
    ) external {
        Deck storage deck = decks[gameId];
        deck.currentUserDecryptedIndex = deck.currentUserDecryptedIndex + index;
    }

    function getUserDecryptedIndex(
        uint256 gameId
    ) public view returns (uint8) {
        Deck memory deck = decks[gameId];
        return deck.currentUserDecryptedIndex;
    }

    constructor(
        address _shuffle,
        address _decrypt1,
        address _decrypt3,
        address _decrypt4
    ) {
        shuffle = IShuffleVerifier(_shuffle);
        decrypt1 = IDecrypt1(_decrypt1);
        decrypt3 = IDecrypt3(_decrypt3);
        decrypt4 = IDecrypt4(_decrypt4);
    }

    function shuffleVerifyAndSave(
        uint256 gameId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[209] memory input
    ) public {
        for (uint i = 0; i < 52; i++) {
            input[i + 156] = decks[gameId].deck[i];
        }
        shuffle.verifyProof(a, b, c, input);

        for (uint i = 0; i < 52; i++) {
            decks[gameId].deck[i] = input[i + 52];
        }
    }

    function userDecrypt1Card(
        uint256 gameId,
        uint8 id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) public {
        Deck storage deck = decks[gameId];
        input[2] = deck.deck[id];
        decrypt1.verifyProof(a, b, c, input);
        deck.userDecrypted[id] = input[0];
    }

    function dealerDecrypt1Card(
        uint256 gameId,
        uint8 id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) public {
        Deck storage deck = decks[gameId];
        input[2] = deck.userDecrypted[id];
        decrypt1.verifyProof(a, b, c, input);
        deck.dealerDecrypted[id] = input[0];
    }

    function dealerDecrypt3Card(
        uint256 gameId,
        uint8 id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[10] memory input
    ) public {
        Deck storage deck = decks[gameId];

        for (uint i = 0; i < 3; i++) {
            input[6 + i] = deck.userDecrypted[id + i];
        }
        decrypt3.verifyProof(a, b, c, input);
        decks[gameId].dealerDecrypted[id] = input[0];
        decks[gameId].dealerDecrypted[id + 1] = input[1];
        decks[gameId].dealerDecrypted[id + 2] = input[2];
    }

    function userDecrypt4Card(
        uint256 gameId,
        uint8 id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory input
    ) public {
        Deck storage deck = decks[gameId];

        for (uint i = 0; i < 4; i++) {
            if (deck.userDecrypted[id + i] != 0) {
                input[8 + i] = deck.userDecrypted[id + i];
            } else {
                input[8 + i] = deck.deck[id + i];
            }
        }
        decrypt4.verifyProof(a, b, c, input);
        decks[gameId].userDecrypted[id] = input[0];
        decks[gameId].userDecrypted[id + 1] = input[1];
        decks[gameId].userDecrypted[id + 2] = input[2];
        decks[gameId].userDecrypted[id + 3] = input[3];
    }
}
