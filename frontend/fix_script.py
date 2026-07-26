import glob
import re

files = [
    'src/app/page.tsx',
    'src/app/capsule/page.tsx',
    'src/app/roulette/page.tsx',
    'src/components/ClientLayout.tsx',
    'src/components/MusicPlayer.tsx',
    'src/context/CoupleContext.tsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('${API_BASE_URL}', 'http://127.0.0.1:8080')
    content = content.replace('`${API_BASE_URL}', 'http://127.0.0.1:8080')
    
    # Just string replace correctly
    content = content.replace('"http://127.0.0.1:8080', '`${API_BASE_URL}')
    content = content.replace('http://127.0.0.1:8080"', '${API_BASE_URL}`')
    content = content.replace("'http://127.0.0.1:8080", "`${API_BASE_URL}")
    content = content.replace("http://127.0.0.1:8080'", "${API_BASE_URL}`")
    
    content = content.replace('http://127.0.0.1:8080', '${API_BASE_URL}')
    
    # Fix instances where the end quote was left over
    content = re.sub(r'\`\$\{API_BASE_URL\}([^`"]*)"', r'`${API_BASE_URL}\1`', content)
    content = re.sub(r"\`\$\{API_BASE_URL\}([^`']*)'", r'`${API_BASE_URL}\1`', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed URLs!')
