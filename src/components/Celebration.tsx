import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Priority } from '../types';

interface CelebrationProps {
  isVisible: boolean;
  priority: Priority;
  onComplete: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({ isVisible, priority, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const duration = priority === 'high' ? 5 * 1000 : priority === 'medium' ? 3 * 1000 : 1.5 * 1000;
      const animationEnd = Date.now() + duration;
      
      const triggerConfetti = () => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return;

        const particleCount = priority === 'high' ? 100 : priority === 'medium' ? 60 : 30;
        
        if (priority === 'high') {
          // Gold fountain from sides to keep center clear
          confetti({
            particleCount: particleCount / 3,
            angle: 60,
            spread: 80,
            origin: { x: 0, y: 0.7 },
            colors: ['#FFD700', '#DAA520', '#FFF8DC', '#B8860B']
          });
          confetti({
            particleCount: particleCount / 3,
            angle: 120,
            spread: 80,
            origin: { x: 1, y: 0.7 },
            colors: ['#FFD700', '#DAA520', '#FFF8DC', '#B8860B']
          });
          // Add center burst
          confetti({
            particleCount: particleCount / 3,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#DAA520', '#FFF8DC', '#B8860B']
          });
        } else if (priority === 'medium') {
          // Multicolor bursts
          confetti({
            particleCount: particleCount / 2,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 }
          });
          confetti({
            particleCount: particleCount / 2,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 }
          });
        } else {
          // Blue center burst
          confetti({
            particleCount,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb']
          });
        }

        if (timeLeft > 0) {
          setTimeout(() => requestAnimationFrame(triggerConfetti), 200);
        }
      };

      triggerConfetti();

      const timer = setTimeout(() => {
        onComplete();
      }, duration + 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, priority, onComplete]);

  const getCelebrationContent = () => {
    switch (priority) {
      case 'high':
        return {
          emoji: "🐈",
          title: "LEGENDARY!",
          subtitle: "Top priority conquered!",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200"
        };
      case 'medium':
        return {
          emoji: "🦝",
          title: "Great Work!",
          subtitle: "You're on a roll!",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50",
          borderColor: "border-indigo-200"
        };
      default:
        return {
          emoji: "🐼",
          title: "Done!",
          subtitle: "Nice and easy.",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
    }
  };

  const content = getCelebrationContent();

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/5">
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 10 }}
            className={cn(
              "p-10 rounded-[2.5rem] shadow-2xl border-4 flex flex-col items-center gap-6 backdrop-blur-xl min-w-[320px]",
              content.bgColor,
              content.borderColor
            )}
          >
            <motion.div
              animate={priority === 'high' ? {
                scale: [1, 1.1, 1],
                rotate: [-2, 2, -2, 2, 0]
              } : {
                y: [0, -8, 0]
              }}
              style={priority === 'high' ? { filter: "sepia(1) hue-rotate(-20deg) saturate(2)" } : {}}
              transition={{ repeat: Infinity, duration: priority === 'high' ? 0.3 : 2 }}
              className="text-9xl select-none"
            >
              {content.emoji}
            </motion.div>

            <div className="text-center space-y-2">
              <h2 className={cn("text-4xl font-black uppercase tracking-tight", content.color)}>
                {content.title}
              </h2>
              <p className="text-gray-600 font-medium text-lg">{content.subtitle}</p>
            </div>

            <div className="flex gap-4 mt-2">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="flex gap-3"
              >
                <span className="text-3xl">✨</span>
                <span className="text-3xl">👏</span>
                <span className="text-3xl">✨</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper for class names since I can't import it easily here without checking utils
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
