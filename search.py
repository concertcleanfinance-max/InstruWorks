import re

with open('index.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'localStorage' in line:
            print(f"{i}: {line.strip()}")
