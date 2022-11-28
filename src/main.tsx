import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const colorSet = ['red', 'gold', 'green', 'blue', 'purple', 'gray', 'black'] as const;
const typeSet = ['♚', '♛', '♜', '♝', '♞', '♟︎', '☻'] as const;

interface Combination {
  color: typeof colorSet[number];
  type: typeof typeSet[number] | '☙';
}

interface Cell {
  index: number;
  row: number;
  col: number;
}

interface BoardCell extends Cell, Combination {
  isFake: boolean;
}

interface GameState {
  startTime: number;
  cells: BoardCell[];
}

const randMultInt = (mult: number) => (Math.random() * mult) | 0;

const generateGame = (): GameState => {
  const slots = Array.from(Array(100), (_, i) => ({ index: i, row: Math.floor(i / 10), col: i % 10 }));
  const cells: BoardCell[] = [];
  for (let i = 0; i < 50; i += 1) {
    const type = i === 49 ? '☙' : typeSet[Math.floor(i / 7)];
    const color = i === 49 ? colorSet[randMultInt(7)] : colorSet[i % 7];
    const [pair1Slot] = slots.splice(randMultInt(slots.length), 1);
    const [pair2Slot] = slots.splice(randMultInt(slots.length), 1);
    const isFake = Math.random() < 0.2;
    cells[pair1Slot.index] = { color, type, isFake, ...pair1Slot };
    cells[pair2Slot.index] = { color, type, isFake, ...pair2Slot };
  }
  return { startTime: performance.now(), cells };
};

const App = () => {
  const [targetTime, setTargetTime] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timestamp, setTimestamp] = useState(0);
  const timeLeft = gameState ? targetTime - (timestamp - gameState.startTime) : 0;
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState<Record<number, true>>({});

  useEffect(() => {
    if (!gameState) return () => undefined;

    let interrupted: boolean;
    let timerId = requestAnimationFrame(function tick(timestamp) {
      if (interrupted) return;
      setTimestamp(timestamp);
      if (timestamp - gameState.startTime < targetTime) {
        timerId = requestAnimationFrame(tick);
      }
    });

    return () => {
      interrupted = true;
      cancelAnimationFrame(timerId);
    };
  }, [targetTime, gameState]);
  const score = Object.keys(solved).length;
  return (
    <div>
      <h1>짝 맞추기 게임!</h1>
      <div className="i-enjoy">즐겁다</div>
      <h2>
        Score: {score}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Time Left: {timeLeft.toFixed(3)}ms
      </h2>
      {!gameState || timeLeft <= 0 ? (
        <div className="game-scene">
          <button
            type="button"
            className="play"
            onClick={() => {
              setTargetTime(30000);
              setSelected(null);
              setSolved({});
              setGameState(generateGame);
            }}
          >
            PLAY
          </button>
        </div>
      ) : (
        <div className="game-scene">
          {score === 100 ? (
            <>
              <h1>클리어!</h1>
              <button
                type="button"
                className="play"
                onClick={() => {
                  setTargetTime(30000);
                  setSelected(null);
                  setSolved({});
                  setGameState(generateGame);
                }}
              >
                다시하기
              </button>
            </>
          ) : (
            <>
              <div className="time-gauge-bar">
                <div
                  className="time-gauge"
                  style={{ width: `${Math.min(Math.max(0, 100 * (timeLeft / targetTime)), 100)}%` }}
                />
              </div>
              <div className="board">
                {gameState.cells.map(({ index, type, color, isFake }) => (
                  <button
                    key={index}
                    className={
                      selected === index ? 'cell cell--selected' : solved[index] ? 'cell cell--solved' : 'cell'
                    }
                    onClick={() => {
                      if (selected === null) {
                        setSelected(index);
                        return;
                      }
                      if (selected === index) {
                        setSelected(null);
                        return;
                      }
                      if (
                        (gameState.cells[selected].isFake && isFake) ||
                        (gameState.cells[selected].type === type && gameState.cells[selected].color === color)
                      ) {
                        setSolved((prev) => ({ ...prev, [index]: true, [selected]: true }));
                        setTargetTime((t) => t + 1000);
                      }
                      setSelected(null);
                    }}
                  >
                    <span style={{ color }}>{type}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
