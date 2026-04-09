import sys
import re

with open('bundle.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = list(re.finditer(r'addEventListener\(.keydown.', text))

out_lines = []
for m in matches:
    start = max(0, m.start() - 100)
    end = min(len(text), m.end() + 200)
    context = text[start:end].replace('\n', ' ')
    out_lines.append(f'Pos {m.start()}: {context}')

with open('keydowns.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))
