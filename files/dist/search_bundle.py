import re, sys

def search(pattern, context=300, max_results=5):
    with open('bundle.js', 'r', encoding='utf-8') as f:
        content = f.read()
    for m in list(re.finditer(pattern, content))[:max_results]:
        start = max(0, m.start() - context)
        end = min(len(content), m.end() + context)
        print(f"\n=== Found '{pattern}' at byte {m.start()} ===")
        print(content[start:end])
        print("---")

if __name__ == '__main__':
    search(sys.argv[1], int(sys.argv[2]) if len(sys.argv)>2 else 300, int(sys.argv[3]) if len(sys.argv)>3 else 5)
