'use client';
import { useEffect, useState, useCallback } from 'react';

export default function SnakeGame() {
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([5, 5]);
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const gridSize = 20;
  const cellSize = 20;

  const generateFood = useCallback(() => {
    const newFood = [
      Math.floor(Math.random() * gridSize),
      Math.floor(Math.random() * gridSize)
    ];
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake([[10, 10]]);
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    generateFood();
    setGameStarted(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake(currentSnake => {
      const head = [...currentSnake[0]];
      
      switch(direction) {
        case 'UP': head[1] -= 1; break;
        case 'DOWN': head[1] += 1; break;
        case 'LEFT': head[0] -= 1; break;
        case 'RIGHT': head[0] += 1; break;
      }

      // Check for collisions with walls
      if (head[0] < 0 || head[0] >= gridSize || head[1] < 0 || head[1] >= gridSize) {
        setGameOver(true);
        return currentSnake;
      }

      // Check for collisions with self
      if (currentSnake.some(segment => segment[0] === head[0] && segment[1] === head[1])) {
        setGameOver(true);
        return currentSnake;
      }

      const newSnake = [head];
      
      // Check if snake ate food
      if (head[0] === food[0] && head[1] === food[1]) {
        setScore(prev => prev + 1);
        generateFood();
        newSnake.push(...currentSnake);
      } else {
        newSnake.push(...currentSnake.slice(0, -1));
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted) {
        setGameStarted(true);
        return;
      }

      switch(e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameStarted]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, 150);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  return (
    <div className="flex flex-col items-center bg-black/50 p-4 rounded-lg backdrop-blur-sm">
      <div className="mb-4 text-yellow-300">
        Score: {score}
      </div>
      <div 
        className="relative border-2 border-yellow-300"
        style={{
          width: gridSize * cellSize,
          height: gridSize * cellSize
        }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-yellow-300"
            style={{
              width: cellSize - 2,
              height: cellSize - 2,
              left: segment[0] * cellSize,
              top: segment[1] * cellSize
            }}
          />
        ))}
        <div
          className="absolute bg-red-400"
          style={{
            width: cellSize - 2,
            height: cellSize - 2,
            left: food[0] * cellSize,
            top: food[1] * cellSize
          }}
        />
      </div>
      {gameOver && (
        <div className="mt-4">
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-yellow-300 text-red-600 rounded hover:bg-yellow-400"
          >
            Play Again
          </button>
        </div>
      )}
      {!gameStarted && !gameOver && (
        <div className="mt-4 text-yellow-300">
          Press any arrow key to start
        </div>
      )}
    </div>
  );
}
