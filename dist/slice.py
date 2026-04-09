with open('bundle.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = max(0, 1222000)
with open('tmp_context.txt', 'w', encoding='utf-8') as f:
    f.write(text[start_idx:start_idx+1500])
