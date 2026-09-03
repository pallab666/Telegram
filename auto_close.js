const fs = require('fs');

const files = [
  'src/components/AdminPanelModal.tsx',
  'src/components/BotSetupGuideModal.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/VideoPlayerModal.tsx',
  'src/components/InitialSetupModal.tsx',
  'src/components/TasksModal.tsx'
];

files.forEach(file => {
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  let openCount = 0;
  for (let i = 0; i < lines.length; i++) {
    // If line contains only spaces and has length > 0
    if (/^ +$/.test(lines[i])) {
      lines[i] = lines[i] + '</div>';
    } else if (lines[i].match(/<div[^>]*>.*[^<]*$/)) {
      // maybe same line div? We can't be sure easily.
    }
  }
  fs.writeFileSync(file, lines.join('\n'));
});
