import sys
import re

with open('bundle.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = list(re.finditer(r'createElement\([\'\"]button[\'\"]\)', text))
matches.extend(list(re.finditer(r'<button', text)))

out_lines = []
for m in matches:
    start = max(0, m.start() - 250)
    end = min(len(text), m.end() + 250)
    context = text[start:end].replace('\n', ' ')
    out_lines.append(f'Pos {m.start()}: {context}')

with open('buttons.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))
