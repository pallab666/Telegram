const fs = require('fs');

const files = [
  'src/components/AdminPanelModal.tsx',
  'src/components/BotSetupGuideModal.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/VideoPlayerModal.tsx',
  'src/components/TasksModal.tsx',
  'src/components/WithdrawModal.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    // If line contains only spaces and has length > 0
    if (/^ +$/.test(lines[i])) {
      lines[i] = lines[i] + '</div>';
    }
  }
  fs.writeFileSync(file, lines.join('\n'));
});
