const fs = require('fs');

const errors = `src/components/BalanceCard.tsx(87,7)
src/components/DailySpinWheel.tsx(283,7)
src/components/MoviesClipsSection.tsx(146,7)
src/components/ProfileModal.tsx(229,7)
src/components/RankModal.tsx(238,7)
src/components/ReferModal.tsx(399,7)
src/components/SettingsModal.tsx(621,7)
src/components/TasksModal.tsx(335,17)
src/components/TasksModal.tsx(340,7)
src/components/WithdrawModal.tsx(413,21)
src/components/WithdrawModal.tsx(419,9)
src/components/WithdrawModal.tsx(420,7)
src/components/QuickActions.tsx(158,5)`.split('\n');

errors.forEach(err => {
  const [filePart] = err.split(')');
  const [file, lineStr] = filePart.split('(');
  const lineNum = parseInt(lineStr.split(',')[0], 10);
  
  if (fs.existsSync(file)) {
    let lines = fs.readFileSync(file, 'utf8').split('\n');
    let idx = lineNum - 1;
    // We want to replace the `</div>` at idx with `</motion.div>`.
    // Wait, the error might point to the end of the file or the actual line.
    // Let's search upwards from idx for a `</div>`
    for (let i = idx; i >= 0; i--) {
      if (lines[i].includes('</div>')) {
        lines[i] = lines[i].replace('</div>', '</motion.div>');
        break;
      }
    }
    fs.writeFileSync(file, lines.join('\n'));
  }
});
