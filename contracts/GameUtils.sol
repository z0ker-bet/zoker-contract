// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

// import "@openzeppelin/contracts/access/Ownable.sol";
import "./BoardManagerStorage.sol";

contract GameUtils {
    uint256 public immutable CARD_NUM = 52;

    function createInitialCards()
        internal
        pure
        returns (uint256[] memory cards)
    {
        cards = new uint256[](CARD_NUM);
        for (uint256 i = 0; i < CARD_NUM; ++i) {
            cards[i] = i + 1;
        }
        return cards;
    }

    function getUserDecryptedInfo(uint256 val) public pure returns (CardInfo memory) {
        uint256 value_ = val % 13;
        if (val % 13 == 0) {
            value_ = 13;
        }
        return CardInfo({rank: Rank(val / 13), value: value_});
    }

    function getUserDecryptedValue(uint256 val) public pure returns (uint256) {
        uint256 value_ = val % 13;
        if (val % 13 == 0) {
            value_ = 13;
        }
        return value_;
    }


    function getPoint(uint256 val) public pure returns (uint256) {
        CardInfo memory card = getUserDecryptedInfo(val);
        if ( card.value > 10) {
            return 10;
        } else {
            return card.value;
        }
    }
}