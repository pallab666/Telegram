const fs = require('fs');
let lines = fs.readFileSync('src/components/VideoPlayerModal.tsx', 'utf8').split('\n');

// Line 48: remove </div>
if (lines[47].includes('</div>')) {
  lines[47] = '  ';
}

// End of file: should be </motion.div> instead of </div> for the modal.
// Wait, actually my first `patch_modals.cjs` did this. But then I changed it to `</div>`.
// Let's just overwrite the end of the file correctly.
// Pop all lines from end that are closing braces or divs, and rewrite them.
let endIdx = lines.length - 1;
while(lines[endIdx].trim() === '' || lines[endIdx].includes('};') || lines[endIdx].includes(');') || lines[endIdx].includes('</div>') || lines[endIdx].includes('</motion.div>')) {
  lines.pop();
  endIdx--;
}

lines.push('        </div>');
lines.push('      </motion.div>');
lines.push('    </motion.div>');
lines.push('  );');
lines.push('};');

fs.writeFileSync('src/components/VideoPlayerModal.tsx', lines.join('\n'));
