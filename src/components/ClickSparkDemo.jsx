import React from 'react';
import ClickSpark from './ClickSpark';

const ClickSparkDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-8">
      <ClickSpark
        sparkColor="#00ff88"
        sparkSize={12}
        sparkRadius={20}
        sparkCount={12}
        duration={500}
        global={true}
      >
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center shadow-2xl max-w-md mx-auto">
          <h1 className="text-4xl font-black bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent mb-8 drop-shadow-lg">
            ClickSpark Demo
          </h1>
          <p className="text-xl text-white/90 mb-12 opacity-80">
            Click anywhere! Sparks will burst from click position.
          </p>
          <div className="space-y-4">
            <button className="w-full py-4 px-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl font-bold text-lg text-white border border-white/30 transition-all hover:scale-105 shadow-xl">
              Test Button 1
            </button>
            <button className="w-full py-4 px-8 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-2xl font-bold text-lg text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-105">
              Test Button 2
            </button>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button className="py-3 px-6 bg-indigo-500/20 hover:bg-indigo-500/40 backdrop-blur-sm rounded-xl font-bold text-white border border-indigo-400/50 transition-all hover:scale-[1.02]">
                Grid Btn
              </button>
              <button className="py-3 px-6 bg-pink-500/20 hover:bg-pink-500/40 backdrop-blur-sm rounded-xl font-bold text-white border border-pink-400/50 transition-all hover:scale-[1.02]">
                Grid Btn
              </button>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="space-y-1 text-sm text-white/70 font-mono">
              <p>Usage: import ClickSpark from './ClickSpark';</p>
              <p><ClickSpark sparkColor="#fff" global>{`{children}`}</ClickSpark></p>
              <p className="text-emerald-400 text-xs">💡 global=true = sparks anywhere on page!</p>
            </div>
          </div>
        </div>
      </ClickSpark>
    </div>
  );
};

export default ClickSparkDemo;

