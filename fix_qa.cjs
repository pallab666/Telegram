const fs = require('fs');
let lines = fs.readFileSync('src/components/QuickActions.tsx', 'utf8').split('\n');
lines[157] = '      </motion.div>';
lines[158] = '    </div>';
fs.writeFileSync('src/components/QuickActions.tsx', lines.join('\n'));
