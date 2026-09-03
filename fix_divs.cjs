const fs = require('fs');
const cp = require('child_process');

const files = [
  'src/components/AdminPanelModal.tsx',
  'src/components/BotSetupGuideModal.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/VideoPlayerModal.tsx',
  'src/components/TasksModal.tsx'
];

// First, revert the auto_close.cjs changes by removing </div> that are just whitespace + </div>
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // the script did: lines[i] = lines[i] + '</div>'; where lines[i] was just spaces
  // so we look for lines that are exactly spaces followed by </div>
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^ +<\/div>$/.test(lines[i])) {
      lines[i] = lines[i].replace('</div>', '');
    }
  }
  fs.writeFileSync(file, lines.join('\n'));
});
