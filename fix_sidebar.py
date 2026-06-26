import os
import re

nav_content = open('index.html', 'r', encoding='utf-8').read()
nav_match = re.search(r'(<nav class="flex-1 p-8 space-y-4">.*?</nav>)', nav_content, re.DOTALL)
if not nav_match:
    print("Could not find nav block in index.html")
    exit(1)

nav_html = nav_match.group(1)

for file in os.listdir('.'):
    if file.endswith('.html') and file != 'index.html':
        content = open(file, 'r', encoding='utf-8').read()
        new_content = re.sub(r'<nav class="flex-1 p-8 space-y-4">.*?</nav>', nav_html, content, flags=re.DOTALL)
        if new_content != content:
            open(file, 'w', encoding='utf-8').write(new_content)
            print(f"Fixed {file}")
