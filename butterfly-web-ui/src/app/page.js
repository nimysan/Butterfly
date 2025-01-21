import Image from "next/image";
import SnakeGame from "../components/SnakeGame";

export default function Home() {
  return (
    <div className="min-h-screen bg-red-600 relative overflow-hidden">
      {/* Decorative clouds */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-16 bg-white rounded-full"></div>
        <div className="absolute top-40 right-20 w-40 h-20 bg-white rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-36 h-18 bg-white rounded-full"></div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-yellow-300">
        {/* Lanterns */}
        <div className="absolute top-10 left-10 animate-bounce-slow">
          <Image src="/lantern.svg" alt="Lantern" width={80} height={96} />
        </div>
        <div className="absolute top-20 right-10 animate-bounce-delayed">
          <Image src="/lantern.svg" alt="Lantern" width={80} height={96} />
        </div>

        {/* Greeting text */}
        <h1 className="text-6xl md:text-8xl font-bold mb-8 animate-fade-in text-center">
          新年快乐
        </h1>
        <p className="text-2xl md:text-4xl mb-8 animate-fade-in-delayed text-center">
          Happy Chinese New Year
        </p>
        <p className="text-xl md:text-2xl animate-fade-in-delayed-more text-center mb-8">
          恭喜发财 万事如意
        </p>

        {/* Snake Game */}
        <div className="mb-8">
          <SnakeGame />
        </div>

        {/* Decorative elements */}
        <div className="flex gap-8">
          <div className="w-16 h-16 border-4 border-yellow-300 rounded-full animate-spin-slow"></div>
          <div className="w-16 h-16 border-4 border-yellow-300 rounded-full animate-spin-slow-reverse"></div>
        </div>
      </main>
    </div>
  );
}
