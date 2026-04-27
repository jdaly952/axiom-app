import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="relative flex items-center" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-black whitespace-nowrap z-50 border-2 border-[#8B7355] shadow-2xl pointer-events-none"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
