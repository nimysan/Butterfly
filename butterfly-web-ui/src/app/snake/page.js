import SnakeGame from "../../components/SnakeGame";

export default function SnakePage() {
  return (
    <div className="min-h-screen bg-red-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-16 bg-white rounded-full"></div>
        <div className="absolute top-40 right-20 w-40 h-20 bg-white rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-36 h-18 bg-white rounded-full"></div>
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-yellow-300">
        <h1 className="text-4xl font-bold mb-8">贪吃蛇游戏</h1>
        <SnakeGame />
      </main>
    </div>
  );
}
