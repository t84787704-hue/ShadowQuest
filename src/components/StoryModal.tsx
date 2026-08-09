import React, { useState } from 'react';
import { Shield, Flame, Compass, ChevronRight, SkipForward } from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';

interface StoryModalProps {
  onComplete: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);

  const storyPages = [
    {
      title: 'THE PEACEFUL REALM OF AETHERIA',
      subtitle: 'A world blessed by ancient elemental power',
      icon: <Shield className="w-10 h-10 text-sky-400" />,
      content:
        'For hundreds of years, the kingdom of Aetheria flourished under the radiant glow of six sacred Element Orbs—protecting nature, mountains, skies, and fire from corruption.',
      bgGradient: 'from-sky-950/80 via-slate-900 to-slate-950',
    },
    {
      title: 'THE DARKNESS FALLS',
      subtitle: 'The Goblin King steals the Sacred Orbs',
      icon: <Flame className="w-10 h-10 text-rose-500 animate-pulse" />,
      content:
        'One stormy night, the Goblin King and his shadowy generals shattered the sacred shrine! They seized all six Orbs, casting the realm into chaos and unleashing goblin hordes across six corrupted worlds.',
      bgGradient: 'from-rose-950/80 via-slate-900 to-slate-950',
    },
    {
      title: 'HERO BLAZE ARISES!',
      subtitle: 'Your epic quest begins',
      icon: <Compass className="w-10 h-10 text-amber-400" />,
      content:
        'You are BLAZE—a fearless warrior armed with the legendary Sun Blade. Journey from Green Forest to the fiery Lava Fortress, defeat the boss generals, and restore peace to Aetheria!',
      bgGradient: 'from-amber-950/80 via-slate-900 to-slate-950',
    },
  ];

  const handleNext = () => {
    audioEngine.playButtonClick();
    if (currentPage < storyPages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    audioEngine.playButtonClick();
    onComplete();
  };

  const activePage = storyPages[currentPage];

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none">
      <div
        className={`w-full max-w-lg bg-gradient-to-b ${activePage.bgGradient} border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden`}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 font-bold px-3 py-1.5 bg-slate-900/60 rounded-lg border border-slate-800 transition"
        >
          <SkipForward className="w-3.5 h-3.5" /> SKIP
        </button>

        {/* Story Badge Icon */}
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-4 shadow-lg">
          {activePage.icon}
        </div>

        {/* Story Text */}
        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black mb-1">
          CHAPTER {currentPage + 1} OF 3
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wider mb-1">
          {activePage.title}
        </h2>

        <p className="text-xs text-slate-400 mb-4 font-semibold italic">
          {activePage.subtitle}
        </p>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md shadow-inner">
          {activePage.content}
        </div>

        {/* Page Dots Indicator */}
        <div className="flex gap-2 mb-6">
          {storyPages.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentPage
                  ? 'w-6 bg-amber-400'
                  : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Navigation Action */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl border border-amber-300/40 shadow-lg flex items-center justify-center gap-2 transition"
        >
          {currentPage === storyPages.length - 1 ? (
            <>
              BEGIN ADVENTURE
              <Compass className="w-4 h-4" />
            </>
          ) : (
            <>
              NEXT
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
