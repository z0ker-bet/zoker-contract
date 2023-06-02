// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./BoardManagerStorage.sol";
import "./GameUtils.sol";
import "./Deck.sol";

// state:
// 1: stared
// 2: dealer shulled
// 3: user shuffled
// 4: user deal 4
// 5: dealer deal 3
// 6: user Hit
// 7: dealer deal hit
// 8: user double
// 9: user stand
// 20: dealer reveal hidden card
// 10: dealer hit
// 11: user blackjack stop game
// 12: user bust stop game
// 13: push
// 14: user win
// 15: dealer blackjack
// 16: dealer win
// 17: dealer bust

contract BlackJack is GameUtils, DeckManagement {
    mapping(uint256 => Board) private boards;
    mapping(address => uint256) public getBoardIdFromAddress;
    uint256 public boardCounter;
    uint256 public betPrice = 10000000000000000;

    // Events
    event Hit(address indexed player, address indexed dealer, uint256 id);
    event Stand(address indexed player, address indexed dealer, uint256 id);
    event Double(address indexed player, address indexed dealer, uint256 id);
    event NewGame(address indexed dealer, uint256 id);
    event JoinGame(address indexed player, address indexed dealer, uint256 id);
    event Win(address indexed winner, uint256 reward, uint256 id);
    event OpenInsurance(address indexed player, address indexed dealer, uint256 id);
    event EndInsurance(address indexed winner, uint256 reward, uint256 id);
    event Shuffle(uint256 id);
    event Draw(uint256 id);
    event EndGame(uint256 id, address indexed winner, uint256 playerReceive, uint256 dealerReceive);

    constructor(
        address _shuffle,
        address _decrypt1,
        address _decrypt3,
        address _decrypt4
    ) DeckManagement(_shuffle, _decrypt1, _decrypt3, _decrypt4) {
        boardCounter = 0;
    }

    function startNewGame(uint256[52] memory startingDeck, uint256 _betPrice) external payable {
        boardCounter++;
        // check dealer not in a game
        require(getBoardIdFromAddress[msg.sender] == 0, "Dealer in board");
        //check dealer value >= betPrice
        require(msg.value >= _betPrice * 2, "Insufficient fund");
        Board memory board;
        board.id = boardCounter;
        board.dealer = msg.sender;
        board.dealerBal = _betPrice * 2;
        board.state = 1;
        board.betPrice = _betPrice;

        this.setup(boardCounter, startingDeck);

        boards[board.id] = board;
        getBoardIdFromAddress[msg.sender] = boardCounter;
        emit NewGame(msg.sender, board.id);
    }

    function shuffleDeck(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[209] memory input
    ) external {
        uint256 currentGameId = getBoardIdFromAddress[msg.sender];
        this.shuffleVerifyAndSave(currentGameId, a, b, c, input);
        Board storage board = boards[currentGameId];
        require(board.state == 1, "This action only for dealer shuffle");
        board.state = 2;
    }

    function joinBoardAndShuffleDeck(
        uint256 _id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[209] memory input
    ) external payable {
        require(
            getBoardIdFromAddress[msg.sender] == 0,
            "Player already in another game"
        );
        getBoardIdFromAddress[msg.sender] = _id;
        Board storage board = boards[_id];

        require(board.player == address(0), "Game has already started");
        require(msg.value >= board.betPrice, "Insufficient fund");
        require(board.state == 2, "This action only for user shuffle");
        board.playerBet = board.betPrice;
        board.player = msg.sender;
        board.state = 3;
        this.shuffleVerifyAndSave(_id, a, b, c, input);
        emit JoinGame(msg.sender, board.dealer, board.id);
    }

    // function insurance(uint256 _id) payable external {
    //     require(getBoardIdFromAddress[msg.sender] == _id, "Only player");

    //     Board storage board = boards[_id];
    //     require(board.inProgress, "On Player turn");
    //     require(board.canInsure, "Only insurance turn");
    //     require(msg.value >= betPrice, "Pay for insurance");
    //     board.insuranceBet = betPrice;
    //     board.canInsure = false;
    // }

    // Deal 4 cards
    function deal4(
        uint256 gameId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory input
    ) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];
        require(board.state == 3, "On Player turn");

        this.userDecrypt4Card(gameId, 0, a, b, c, input);
        this.moveUserDecryptedIndex(gameId, 3);
        board.state = 4;
    }

    // Deal 3 cards
    function deal3(
        uint256 gameId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[10] memory input
    ) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];
        require(board.state == 4, "On Player turn");
        board.state = 5;

        this.dealerDecrypt3Card(gameId, 0, a, b, c, input);

        board.playerCards.push(input[0]);
        board.playerCards.push(input[1]);

        uint256 point0 = getPoint(input[0]);
        uint256 point1 = getPoint(input[1]);
        uint256 point2 = getPoint(input[2]);
        board.canDouble = true;

        if (point0 == point1) {
            board.canSplit = true;
        }

        if (point0 == 1) {
            board.playerPointMax += 11;
            board.playerPointMin += 1;
        } else {
            board.playerPointMax += point0;
            board.playerPointMin += point0;
        }

        if (point1 == 1 && board.playerPointMax == 11) {
            board.playerPointMax += 1;
            board.playerPointMin += 1;
        } else if (point1 == 1 && board.playerPointMax != 11) {
            board.playerPointMax += 11;
            board.playerPointMin += 1;
        } else {
            board.playerPointMax += point1;
            board.playerPointMin += point1;
        }

        board.dealerCards.push(input[2]);

        if (point2 == 1) {
            board.canInsure = true;
            board.dealerPointMax += 11;
            board.dealerPointMin += 1;
        } else {
            board.dealerPointMax += point2;
            board.dealerPointMin += point2;
        }

        if (board.playerPointMax == 21) {
            // player blackjack
            board.state = 11;
            endGame(board, board.player, (board.playerBet * 150) / 100);
        }
    }

    // Hit in normal case
    function userHit(
        uint256 gameId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];
        require(
            board.state == 5 || board.state == 7,
            "This action only for player hit"
        );
        board.state = 6;

        uint8 id = this.getUserDecryptedIndex(gameId);
        this.userDecrypt1Card(gameId, id + 1, a, b, c, input);
        this.moveUserDecryptedIndex(gameId, 1);
        emit Hit(board.player, board.dealer, board.id);
    }

    function userDoubleDown(
        uint256 gameId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory input
    ) external payable {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");
        Board storage board = boards[gameId];
        require(board.state == 5, "This action only for player double");
        require(msg.value >= board.betPrice, "Insufficient fund");
        board.playerBet += board.betPrice;
        board.state = 8;

        uint8 id = this.getUserDecryptedIndex(gameId);
        this.userDecrypt4Card(gameId, id + 1, a, b, c, input);
        this.moveUserDecryptedIndex(gameId, 3);
        emit Double(board.player, board.dealer, board.id);
    }

    // Hit in normal case
    function dealHit(
        uint256 gameId,
        uint8 id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];
        require(
            board.state == 6,
            "This action only for dealer reveal card for player"
        );
        board.state = 7;

        this.dealerDecrypt1Card(gameId, id, a, b, c, input);

        if (input[0] <= 52) {
            uint256 point = getPoint(input[0]);
            board.playerCards.push(input[0]);
            if (board.isSplitting) {
                // board.playerCardsSplit.push(input[0]);
                // if (
                //     point == 1 &&
                //     board.playerSplitTotal < 11
                // ) {
                //     board.isSoftHandSplit = true;
                //     board.playerSplitTotal += 11;
                // } else {
                //     board.playerSplitTotal += 1;
                // }
                // if (board.isSoftHandSplit && board.playerSplitTotal > 21) {
                //     board.playerSplitTotal -= 10;
                //     board.isSoftHandSplit = false;
                // }
                // if (board.playerSplitTotal > 21) {
                //     board.splitCounter++;
                //     board.isSplitting = false;
                // }
            } else {
                if (point == 1 && board.playerPointMax < 11) {
                    board.playerPointMax += 11;
                } else {
                    board.playerPointMax += point;
                }
                board.playerPointMin += point;
            }
            checkUserBust(board);
        }
    }

    // Hit in normal case
    function dealDouble(
        uint256 gameId,
        uint8 id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];
        require(
            board.state == 8,
            "This action only for dealer reveal card for player"
        );
        board.state = 9;

        this.dealerDecrypt1Card(gameId, id, a, b, c, input);

        if (input[0] <= 52) {
            uint256 point = getPoint(input[0]);
            board.playerCards.push(input[0]);
            if (point == 1 && board.playerPointMax < 11) {
                board.playerPointMax += 11;
            } else {
                board.playerPointMax += point;
            }
            board.playerPointMin += point;
            checkUserBust(board);
        }
    }

    function stand(
        uint256 gameId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[13] memory input
    ) external payable {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];
        require(board.state == 7 || board.state == 5, "This action only for player stand");
        board.state = 9;

        uint8 id = this.getUserDecryptedIndex(gameId);
        this.userDecrypt4Card(gameId, id + 1, a, b, c, input);
        this.moveUserDecryptedIndex(gameId, 3);
        board.canSplit = false;
        board.canInsure = false;
        board.canDouble = false;
        emit Stand(board.player, board.dealer, board.id);
    }

    // function insurance(uint256 _id) payable external {
    //     require(getBoardIdFromAddress[msg.sender] == _id, "Only player");

    //     Board storage board = boards[_id];
    //     require(board.inProgress, "On Player turn");
    //     require(board.canInsure, "Only insurance turn");
    //     require(msg.value >= betPrice, "Pay for insurance");
    //     board.insuranceBet = betPrice;
    //     board.canInsure = false;
    // }

    function getPlayerCards(
        uint256 gameId
    ) public view returns (uint256[] memory) {
        Board memory board = boards[gameId];

        return board.playerCards;
    }

    function getDealerCards(
        uint256 gameId
    ) public view returns (uint256[] memory) {
        Board memory board = boards[gameId];

        return board.dealerCards;
    }

    function hitForDealer(
        uint256 gameId,
        uint8 id,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];
        require(
            board.state == 20 || board.state == 10,
            "This action only for dealer hit"
        );

        this.dealerDecrypt1Card(gameId, id, a, b, c, input);

        if (input[0] <= 52) {
            board.state = 10;
            board.dealerCards.push(input[0]);
            uint256 point = getPoint(input[0]);
            if (point == 1 && board.dealerPointMax < 11) {
                board.dealerPointMax += 11;
                board.dealerPointMin += 1;
            } else {
                board.dealerPointMax += point;
                board.dealerPointMin += point;
            }

            if (board.dealerPointMin >= 16 || board.dealerPointMax >= 16) {
                uint256 playerPoint = calculatePoint(
                    board.playerPointMin,
                    board.playerPointMax
                );
                uint256 dealerPoint = calculatePoint(
                    board.dealerPointMin,
                    board.dealerPointMax
                );

                if (dealerPoint <= 21) {
                    if (playerPoint == dealerPoint) {
                        board.state = 13; // push
                        endGame(board, address(0), 0);
                    }

                    if (playerPoint > dealerPoint) {
                        board.state = 14; // user win
                        endGame(board, board.player, board.playerBet);
                    }

                    if (playerPoint < dealerPoint) {
                        board.state = 16; // dealer win
                        endGame(board, board.dealer, board.playerBet);
                    }
                } else {
                    board.state = 17; //dealer bust
                    endGame(board, board.player, board.playerBet);
                }
            }
        }
    }

    function dealHiddenCard(
        uint256 gameId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");

        Board storage board = boards[gameId];

        require(board.dealer == msg.sender, "Only dealer");
        require(
            board.state == 8 || // double
            board.state == 9, // stand
            "This action only for dealer reveal hidden card"
        );

        this.dealerDecrypt1Card(gameId, 3, a, b, c, input);
        board.state = 20;

        if (input[0] <= 52) {
            uint256 point = getPoint(input[0]);
            if (point == 1 && board.dealerPointMax < 11) {
                board.dealerPointMax += 11;
                board.dealerPointMin += 1;
            } else {
                board.dealerPointMax += point;
                board.dealerPointMin += point;
            }

            board.dealerCards.push(input[0]);
        }

        if (board.dealerPointMin >= 16) {
            uint256 playerPoint = calculatePoint(
                board.playerPointMin,
                board.playerPointMax
            );
            uint256 dealerPoint = calculatePoint(
                board.dealerPointMin,
                board.dealerPointMax
            );

            if (dealerPoint == 21) {
                // dealer blackjack
                board.state = 15;
                endGame(board, board.dealer, board.playerBet);
            }

            if (playerPoint == dealerPoint) {
                board.state = 13; // push
                endGame(board, address(0), 0);
            } else if (playerPoint > dealerPoint) {
                board.state = 14; // user win
                endGame(board, board.player, board.playerBet);
            } else {
                board.state = 16; // dealer win
                endGame(board, board.dealer, board.playerBet);
            }
        }
    }

    function quitGame(uint256 gameId) external {
        require(getBoardIdFromAddress[msg.sender] == gameId, "Only player");
        Board storage board = boards[gameId];
        if (msg.sender == board.player) {
            if (board.dealer != address(0)) {
                endGame(board, board.dealer, board.playerBet);
                board.state = 16;
            } else {
                endGame(board, address(0), 0);
                board.state = 13;
            }
        } else {
            if (board.player != address(0)) {
                endGame(board, board.player, board.playerBet);
                board.state = 14;
            } else {
                endGame(board, address(0), 0);
                board.state = 13;
            }
        }
    }

    function calculatePoint(
        uint256 min,
        uint256 max
    ) public pure returns (uint256) {
        if (max > 21) {
            return min;
        } else {
            return max;
        }
    }

    function checkUserBust(Board storage board) private {
        if (board.playerPointMin > 21) {
            board.state = 12;
            endGame(board, board.dealer, board.playerBet);
        }
    }

    function endGame(Board storage board, address winner, uint256 bounty) private {
        uint256 playerReceive = board.playerBet;
        uint256 dealerReceive = board.dealerBal;
        if (winner == board.player) {
            playerReceive += bounty;
            dealerReceive -= bounty;
        } else {
            playerReceive -= bounty;
            dealerReceive += bounty;
        }
        getBoardIdFromAddress[board.dealer] = 0;
        getBoardIdFromAddress[board.player] = 0;
        emit EndGame(board.id, winner, playerReceive, dealerReceive);
        payable(board.player).transfer(playerReceive);
        payable(board.dealer).transfer(dealerReceive);
    }

    function getBoard(
        uint256 gameId
    )
        public
        view
        returns (
            address, // dealer
            address, // player
            uint256, //betPrice
            // Dealer's info
            uint256, //dealerPointMax
            uint256, //dealerPointMin
            uint8, //State
            // bool, //canSplit
            bool, //canDouble
            bool, //canInsure
            // bool, //isSplitting
            uint256, //Dealer's balance
            // Player's Info
            uint256, // Player's bet
            uint256, //playerPointMax
            uint256 //playerPointMin
        )
    {
        Board memory board = boards[gameId];
        return (
            board.dealer,
            board.player,
            board.betPrice,
            board.dealerPointMax,
            board.dealerPointMin,
            board.state,
            // board.canSplit,
            board.canDouble,
            board.canInsure,
            // board.isSplitting,
            board.dealerBal,
            board.playerBet,
            board.playerPointMax,
            board.playerPointMin
        );
    }
}
