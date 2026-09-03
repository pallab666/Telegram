const fs = require('fs');

const files = [
  'src/components/AdminPanelModal.tsx',
  'src/components/BotSetupGuideModal.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/VideoPlayerModal.tsx',
  'src/components/InitialSetupModal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add motion import if not present
  if (!content.includes("import { motion } from 'motion/react';") && !content.includes("import { motion } from 'framer-motion';")) {
    content = content.replace("import React", "import { motion } from 'motion/react';\nimport React");
  }

  // Replace fixed inset-0 wrapper
  // from: <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
  // to: <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 ..."> (removing animate-in fade-in and duration)
  content = content.replace(
    /<div className="fixed inset-0 z-50[^"]*"/g,
    (match) => {
      let newClass = match.replace('div className="', 'motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="');
      newClass = newClass.replace(/animate-in fade-in(\s*duration-\d+)?/g, '');
      // cleanup double spaces
      newClass = newClass.replace(/\s+/g, ' ');
      return newClass;
    }
  );

  // The inner container often has a class like `relative w-full max-w-md bg-white...` or similar.
  // Wait, the backdrop wrapper finishes with `>`. We also need to change its closing `</div>` to `</motion.div>`.
  // This is tricky with simple replace if there are many divs.
  // Let's use a more targeted replacement.
});
