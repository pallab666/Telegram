const fs = require('fs');
let lines = fs.readFileSync('src/components/BotSetupGuideModal.tsx', 'utf8').split('\n');

lines[95] = '    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm ">';
lines[96] = '';

let endIdx = lines.length - 1;
while(lines[endIdx].trim() === '' || lines[endIdx].includes('};') || lines[endIdx].includes(');') || lines[endIdx].includes('</div>') || lines[endIdx].includes('</motion.div>')) {
  lines.pop();
  endIdx--;
}

lines.push('        </div>');
lines.push('      </div>');
lines.push('    </motion.div>');
lines.push('  );');
lines.push('};');

fs.writeFileSync('src/components/BotSetupGuideModal.tsx', lines.join('\n').replace(/\n+/g, '\n'));
