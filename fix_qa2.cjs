const fs = require('fs');
let lines = fs.readFileSync('src/components/QuickActions.tsx', 'utf8').split('\n');
lines[157] = '      </motion.div>';
lines[158] = '    </div>';
lines[159] = '  );';
lines[160] = '};';
fs.writeFileSync('src/components/QuickActions.tsx', lines.join('\n'));
