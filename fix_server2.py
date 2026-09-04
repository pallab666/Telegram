import re

with open('server.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "STORE_FILE = path.join(" in line:
        skip = True
        continue
    
    if skip:
        if line.startswith("  // ") and "Get all shared videos" in line:
            skip = False
        elif line.startswith("  // ") and "Get all tasks" in line:
            skip = False
        elif line.startswith("  // ") and "Get Ad Config" in line:
            skip = False
        elif line.startswith("  // ") and "Get Broadcast" in line:
            skip = False
        elif line.startswith("  // ") and "Get System Settings" in line:
            skip = False
        elif line.startswith("  // ") and "Get all withdrawals" in line:
            skip = False
        elif line.startswith("  // ") and "Register Telegram User" in line:
            skip = False
        elif line.startswith("  // ") and "Register Referred User API" in line:
            skip = False

        if skip:
            # We are skipping until we hit the next endpoint declaration
            if line.startswith("  // ") and line.strip() != "":
                skip = False
            else:
                continue

    new_lines.append(line)

with open('server.ts', 'w') as f:
    f.writelines(new_lines)
