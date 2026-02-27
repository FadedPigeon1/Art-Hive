import React from "react";

const RoundTransition = ({ round, totalRounds }) => {
  return (
    <div className="fixed inset-0 z-50 bg-blue-600 flex flex-col items-center justify-center">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#fff 2px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative z-10 text-center">
        <p className="text-yellow-400 font-black text-2xl uppercase tracking-widest mb-4 animate-pulse">
          Get Ready...
        </p>

        <h1 className="text-8xl md:text-9xl font-black text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.3)] transform -rotate-2 mb-6">
          ROUND {round}
        </h1>

        {totalRounds && (
          <p className="text-blue-200 font-bold text-xl">of {totalRounds}</p>
        )}

        <div className="flex gap-3 justify-center mt-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-white rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoundTransition;
