function throwInvalidValueError(variableName) {
  throw new Error(`${variableName} variable is not a valid value!`);
}
let whoStartsCalculator = (function () {
  let whoseTurnWasLast = null;
  function _calculateWhoStartsForGame(gameType) {
    if (gameType === "1 player") {
      if (
        whoseTurnWasLast === null ||
        whoseTurnWasLast === "computer" ||
        whoseTurnWasLast === "player 1" ||
        whoseTurnWasLast === "player 2"
      )
        return "player";
      else if (whoseTurnWasLast === "player") return "computer";
    } else if (gameType === "2 player") {
      if (
        whoseTurnWasLast === null ||
        whoseTurnWasLast === "player" ||
        whoseTurnWasLast === "computer" ||
        whoseTurnWasLast === "player 2"
      )
        return "player 1";
      else if (whoseTurnWasLast === "player 1") return "player 2";
      else throwInvalidValueError("whoseTurnWasLast");
    } else throwInvalidValueError("gameType");
  }
  let whoStartsForGame = function (gameType) {
    whoseTurnWasLast = _calculateWhoStartsForGame(gameType);
    return whoseTurnWasLast;
  };
  return { whoStartsForGame };
})();
let moveCalculator = (function () {
  function _oppositePawn(pawn) {
    if (pawn === "x") return "o";
    if (pawn === "o") return "x";
  }
  function _markGridIndexWithPawn(
    pawn,
    index,
    grid
  ) /* index is a number from 1 to 9 */ {
    let row = Math.floor((index - 1) / 3);
    let column = (index - 1) % 3;
    grid[row][column] = pawn;
  }
  function _betterResult(currentBestResult, result, pawn) {
    if (pawn === "x") {
      if (result === "win for x") return true;
      if (result === "draw" && currentBestResult !== "win for x") return true;
      if (result === "win for o" && !currentBestResult) return true;
      return false;
    } else if (pawn === "o") {
      if (result === "win for o") return true;
      if (result === "draw" && currentBestResult !== "win for o") return true;
      if (result === "win for x" && !currentBestResult) return true;
      return false;
    } else throwInvalidValueError("pawn");
  }
  function _checkForResult(allEmptyCells, grid) {
    for (let i = 0; i <= 2; i++) {
      if (grid[i][0] === grid[i][1] && grid[i][1] === grid[i][2] && grid[i][0])
        return `win for ${grid[i][0]}`;
      if (grid[0][i] === grid[1][i] && grid[1][i] === grid[2][i] && grid[0][i])
        return `win for ${grid[0][i]}`;
    }
    if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2] && grid[0][0])
      return `win for ${grid[0][0]}`;
    if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0] && grid[0][2])
      return `win for ${grid[0][2]}`;

    if (allEmptyCells.length === 0) return "draw";
    return null;
  }
  function _minMax(pawnToPlay, allEmptyCells, grid) {
    let finishedGameResult = _checkForResult(allEmptyCells, grid);
    if (finishedGameResult)
      return { bestResult: finishedGameResult, bestResultMoveIndex: null };

    let bestResult = null,
      bestResultMoveIndex = null,
      result;
    for (let i = 0; i < allEmptyCells.length; i++) {
      let cellIndex = allEmptyCells[i];
      allEmptyCells.splice(i, 1); //remove cell from empty cells
      _markGridIndexWithPawn(pawnToPlay, cellIndex, grid); //add pawn to grid

      result = _minMax(
        _oppositePawn(pawnToPlay),
        allEmptyCells,
        grid
      ).bestResult;
      if (_betterResult(bestResult, result, pawnToPlay)) {
        bestResult = result;
        bestResultMoveIndex = i;
      }

      allEmptyCells.splice(i, 0, cellIndex); //remove cell from empty cells
      _markGridIndexWithPawn(null, cellIndex, grid); //remove pawn from grid
    }
    return { bestResult, bestResultMoveIndex };
  }
  function calculateBestMove(pawnToPlay, grid) {
    let emptyCellIndexes = [];
    for (let i = 0; i <= 2; i++) {
      for (let j = 0; j <= 2; j++)
        if (!grid[i][j]) emptyCellIndexes.push(i * 3 + j + 1);
    }
    let result = _minMax(pawnToPlay, emptyCellIndexes, grid);
    return emptyCellIndexes[result.bestResultMoveIndex];
  }
  return { calculateBestMove };
})();

function Game(gameType) {
  let grid = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
  let _whoWon,
    _winningLine,
    _playerPawn,
    _computerPawn,
    _player1Pawn,
    _player2Pawn,
    waitForPlayerMove,
    whoStarts;
  let move = (function () {
    function _generateComputerMoveCellNumber(
      moveType
    ) /* either "best move" or random */ {
      if (moveType === "random") {
        let allEmptyCells = document.querySelectorAll(
          ".tic-tac-toe .cell.empty"
        );
        let randomCellIndex = Math.floor(Math.random() * allEmptyCells.length);
        let randomCell = allEmptyCells[randomCellIndex];
        let actualCellNumber = randomCell.id.slice(-1);
        return actualCellNumber;
      } else if (moveType === "best move") {
        let gridCopy = grid.slice();
        return moveCalculator.calculateBestMove(_computerPawn, gridCopy);
      } else if (moveType === "sometimes best move") {
        let selectedMoveType =
          Math.floor(Math.random() * 5) === 1 ? "random" : "best move";
        return _generateComputerMoveCellNumber(selectedMoveType);
      } else throwInvalidValueError("moveType");
    }
    function _addComputerPawn(cellNumber) {
      let row = Math.floor((cellNumber - 1) / 3);
      let column = Math.floor((cellNumber - 1) % 3);
      grid[row][column] = _computerPawn;

      let cellElement = document.querySelector(
        `.tic-tac-toe #cell-${cellNumber}`
      );
      cellElement.classList.remove("empty");
      cellElement.classList.add(_computerPawn);
    }
    function computerMove(firstMove = false) {
      _addComputerPawn(
        _generateComputerMoveCellNumber(
          firstMove ? "random" : "sometimes best move"
        )
      );
      let gameIsFinished = checkForGameResult();
      if (gameIsFinished) _finishGame();
      else waitForPlayerMove = true;
    }
    function _waitForOtherPlayerMove() {
      if (_playerPawn === "x") _playerPawn = "o";
      else if (_playerPawn === "o") _playerPawn = "x";
      if (_playerPawn === _player1Pawn)
        changeMatchInstructionElementText("Player 1's turn");
      else if (_playerPawn === _player2Pawn)
        changeMatchInstructionElementText("Player 2's turn");
      else throwInvalidValueError("_playerPawn");
      waitForPlayerMove = true;
    }
    function _addPlayerPawn(cellNumber) {
      let row = Math.floor((cellNumber - 1) / 3);
      let column = Math.floor((cellNumber - 1) % 3);
      grid[row][column] = _playerPawn;

      let cellElement = document.querySelector(
        `.tic-tac-toe #cell-${cellNumber}`
      );
      cellElement.classList.remove("empty");
      cellElement.classList.add(_playerPawn);
    }
    function playerMove(cell) {
      if (!waitForPlayerMove) return;
      let cellIsEmpty = cell.classList.contains("empty");
      if (!cellIsEmpty) return;

      waitForPlayerMove = false;
      let cellNumber = cell.id.slice(-1);
      _addPlayerPawn(cellNumber);
      let gameIsFinished = checkForGameResult();

      if (gameIsFinished) {
        _finishGame();
        return;
      }
      if (gameType === "1 player") setTimeout(computerMove, 300);
      else if (gameType === "2 player") _waitForOtherPlayerMove();
      else throwInvalidValueError("gameType");
    }
    return { computerMove, playerMove };
  })();
  function _checkForWinForWho(
    who
  ) /* returns winning line location if won, or null otherwise */ {
    let pawn;
    if (who === "player") pawn = _playerPawn;
    else if (who === "computer") pawn = _computerPawn;
    else if (who === "player 1") pawn = _player1Pawn;
    else if (who === "player 2") pawn = _player2Pawn;
    else throwInvalidValueError("who");
    for (let i = 0; i < 3; i++) {
      if (
        pawn === grid[0][i] &&
        grid[0][i] === grid[1][i] &&
        grid[1][i] === grid[2][i]
      )
        return `column-${i + 1}`;
      if (
        pawn === grid[i][0] &&
        grid[i][0] === grid[i][1] &&
        grid[i][1] === grid[i][2]
      )
        return `row-${i + 1}`;
    }
    if (pawn === grid[0][0] && pawn === grid[1][1] && pawn === grid[2][2])
      return "diagonal-main";
    if (pawn === grid[0][2] && pawn === grid[1][1] && pawn === grid[2][0])
      return "diagonal-secondary";
    return null;
  }
  function _checkFor1PlayerGameResult() {
    let whereWinForPlayer = _checkForWinForWho("player");
    let whereWinForComputer = _checkForWinForWho("computer");
    let allEmptyCells = document.querySelectorAll(".tic-tac-toe .cell.empty");
    if (whereWinForPlayer) {
      _setResult("player", whereWinForPlayer);
      return true;
    }
    if (whereWinForComputer) {
      _setResult("computer", whereWinForComputer);
      return true;
    }
    if (allEmptyCells.length === 0) {
      _setResult(null, null);
      return true;
    }
    return false;
  }
  function _checkFor2PlayerGameResult() {
    let whereWinForPlayer1 = _checkForWinForWho("player 1");
    let whereWinForPlayer2 = _checkForWinForWho("player 2");
    let allEmptyCells = document.querySelectorAll(".tic-tac-toe .cell.empty");
    if (whereWinForPlayer1) {
      _setResult("player 1", whereWinForPlayer1);
      return true;
    }
    if (whereWinForPlayer2) {
      _setResult("player 2", whereWinForPlayer2);
      return true;
    }
    if (allEmptyCells.length === 0) {
      _setResult(null, null);
      return true;
    }
    return false;
  }
  function checkForGameResult() /* returns true or false (whether the game is finished or not) */ {
    if (gameType === "1 player") return _checkFor1PlayerGameResult();
    else if (gameType === "2 player") return _checkFor2PlayerGameResult();
    else throwInvalidValueError("gameType");
  }
  function _showWinningLine() {
    let winningLineElement = document.querySelector(".winning-line");
    let removeAllOtherClasses = (winningLineElement.className = "winning-line");

    if (_whoWon === "player") winningLineElement.classList.add(_playerPawn);
    else if (_whoWon === "computer")
      winningLineElement.classList.add(_computerPawn);
    else if (_whoWon === "player 1")
      winningLineElement.classList.add(_player1Pawn);
    else if (_whoWon === "player 2")
      winningLineElement.classList.add(_player2Pawn);
    winningLineElement.classList.add(_winningLine);
  }
  function _loadCells() {
    let allCells = document.querySelectorAll(".tic-tac-toe .cell");
    allCells.forEach((cell) => {
      cell.classList.remove("x");
      cell.classList.remove("o");
      cell.classList.remove("empty");

      let cellNumber = +cell.id.slice(-1);
      let row = Math.floor((cellNumber - 1) / 3);
      let column = Math.floor((cellNumber - 1) % 3);
      if (grid[row][column]) cell.classList.add(grid[row][column]);
    });
  }
  function _loadMessage() {
    let matchConclusionElement = document.querySelector(".match-conclusion");
    if (_whoWon) {
      let capitalizedWhoWon =
        _whoWon.charAt(0).toUpperCase() + _whoWon.slice(1);
      changeMatchConclusionElementText(`${capitalizedWhoWon} won!`);
    } else changeMatchConclusionElementText("It's a draw!");
  }
  function showFinishedGame() {
    removeCellListeners();
    _loadCells();
    if (_whoWon) _showWinningLine();
    _loadMessage();
  }
  function _setResult(resultWhoWon, resultWhereWon) {
    _whoWon = resultWhoWon;
    _winningLine = resultWhereWon;
  }
  function showGame() {
    changeMatchInstructionElementText("");
    _loadCells();
    _loadMessage();
    _showWinningLine();
  }
  function _addGameToHistory() {
    gameHistory.push(object);
    let historyMatchesElement = document.querySelector(
      ".match-history .matches"
    );
    let newMatchElement = document.createElement("div");
    newMatchElement.classList.add("match");
    let newTextContainerElement = document.createElement("div");
    newTextContainerElement.classList.add("text-container");
    newMatchElement.appendChild(newTextContainerElement);

    let firstPlayerText = document.createElement("div");
    firstPlayerText.textContent =
      gameType === "1 player" ? "Player" : "Player 1";
    let matchResultText = document.createElement("div");
    if (_whoWon === "player") {
      matchResultText.textContent = ">";
      newMatchElement.classList.add("win-ai");
    } else if (_whoWon === "computer") {
      matchResultText.textContent = "<";
      newMatchElement.classList.add("lose-ai");
    } else if (_whoWon === "player 1") matchResultText.textContent = ">";
    else if (_whoWon === "player 2") matchResultText.textContent = "<";
    else if (!_whoWon) matchResultText.textContent = "-";
    else throwInvalidValueError("_whoWon");
    let secondPlayerText = document.createElement("div");
    secondPlayerText.textContent =
      gameType === "1 player" ? "Computer" : "Player 2";
    newTextContainerElement.append(
      firstPlayerText,
      matchResultText,
      secondPlayerText
    );

    newMatchElement.addEventListener("click", showGame);
    historyMatchesElement.appendChild(newMatchElement);
    let gameHistoryElement = document.querySelector(".match-history");
    gameHistoryElement.classList.remove("hidden");
  }
  function _finishGame() {
    _addGameToHistory();
    showGame();
  }
  function setPawns() {
    if (gameType === "1 player") {
      if (whoStarts === "player") (_playerPawn = "x"), (_computerPawn = "o");
      else if (whoStarts === "computer")
        (_playerPawn = "o"), (_computerPawn = "x");
    } else if (gameType === "2 player") {
      if (whoStarts === "player 1") (_player1Pawn = "x"), (_player2Pawn = "o");
      else if (whoStarts === "player 2")
        (_player1Pawn = "o"), (_player2Pawn = "x");
      else throwInvalidValueError("whoStarts");
    }
  }
  function _initialize1PlayerGame() {
    whoStarts = whoStartsCalculator.whoStartsForGame("1 player");
    waitForPlayerMove = false;
    setPawns();

    if (whoStarts === "computer") setTimeout(move.computerMove, 1000, true);
    else
      setTimeout(() => {
        waitForPlayerMove = true;
      }, 500);
  }
  function _initialize2PlayerGame() {
    whoStarts = whoStartsCalculator.whoStartsForGame("2 player");
    setPawns();
    _playerPawn = "x";
    if (_player1Pawn === _playerPawn)
      changeMatchInstructionElementText("Player 1 starts!");
    else if (_player2Pawn === _playerPawn)
      changeMatchInstructionElementText("Player 2 starts!");
    else throwInvalidValueError("_player1Pawn or _player2Pawn");

    //the one with x always starts
    //player pawn is used as a current player pawn in 2 player games
    waitForPlayerMove = true;
  }
  function initializeGame() {
    if (gameType === "1 player") _initialize1PlayerGame();
    else if (gameType === "2 player") _initialize2PlayerGame();
    else throwInvalidValueError("gameType");
  }
  initializeGame();
  let object = { showGame, move };
  return object;
}
let currentGame = null;
let gameHistory = [];
function changeMatchInstructionElementText(text) {
  let matchInstructionElement = document.querySelector(".match-instruction");
  matchInstructionElement.classList.add("hidden");

  let showMatchInstructionAfterDelay = setTimeout(() => {
    matchInstructionElement.textContent = text;
    matchInstructionElement.classList.remove("hidden");
  }, 400);
}
function changeMatchConclusionElementText(text) {
  let matchConclusionElement = document.querySelector(".match-conclusion");
  matchConclusionElement.classList.add("hidden");

  let showMatchConclusionAfterDelay = setTimeout(() => {
    matchConclusionElement.textContent = text;
    matchConclusionElement.classList.remove("hidden");
  }, 300);
}
/* #region  showGrid */
/* #region  utility functions for showGrid */
function makeGridElementVisible(grid) {
  grid.classList.remove("transparent");
}
function makeGridElementInvisibleButPresent(grid) {
  grid.classList.add("transparent");
}
function unhideGridElement(grid) {
  grid.classList.remove("hidden");
  grid.classList.remove("transparent");
}
function clearCell(cell) {
  cell.classList.remove("x");
  cell.classList.remove("o");
  cell.classList.add("empty");
}
function restartGridCells() {
  let allCells = document.querySelectorAll(".tic-tac-toe .cell");
  allCells.forEach((cell) => {
    clearCell(cell);
  });
}
function clearWinningLine() {
  let winningLineElement = document.querySelector(".winning-line");
  let removeAllOtherClasses = (winningLineElement.className = "winning-line");
}
function clearInstructionText() {
  changeMatchInstructionElementText("");
}
/* #endregion */
function showGridElement() {
  changeMatchConclusionElementText("");
  let ticTacToeGameElement = document.querySelector(".tic-tac-toe");
  let gridIsAlreadyShown = !ticTacToeGameElement.classList.contains("hidden");
  if (gridIsAlreadyShown) {
    makeGridElementInvisibleButPresent(ticTacToeGameElement);
    restartGridCells();
    clearWinningLine();
    clearInstructionText();
    let makeGridVisibleAfterAnimation = setTimeout(
      makeGridElementVisible,
      400,
      ticTacToeGameElement
    );
  } else unhideGridElement(ticTacToeGameElement);
}
/* #endregion */
function newGame(gameType) /* "1 player" or "2 players" */ {
  showGridElement();
  let game = Game(gameType);
  currentGame = game;
}

let initiateGameModeButtonListeners = (function () {
  let button1PlayerModeElement = document.querySelector(
    ".mode-picker button.ai-mode"
  );
  let button2PlayerModeElement = document.querySelector(
    ".mode-picker button.players-mode"
  );
  button1PlayerModeElement.addEventListener("click", () => {
    newGame("1 player");
  });
  button2PlayerModeElement.addEventListener("click", () => {
    newGame("2 player");
  });
})();
let initiateCellListeners = (function () {
  function addCellListner(cell) {
    cell.addEventListener("click", () => {
      currentGame.move.playerMove(event.target);
    });
  }
  let addCellsListeners = (function () {
    let allCells = document.querySelectorAll(".tic-tac-toe .cell");
    allCells.forEach((cell) => addCellListner(cell));
  })();
})();
