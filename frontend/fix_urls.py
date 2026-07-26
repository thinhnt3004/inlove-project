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
    
    # Fix instances like ${API_BASE_URL}/path" -> ${API_BASE_URL}/path
    content = re.sub(r'\\$\{API_BASE_URL\}([^"]*)"', r'${API_BASE_URL}\1', content)
    
    # Just to be safe for single quotes
    content = re.sub(r"\\$\{API_BASE_URL\}([^']*)'", r'${API_BASE_URL}\1', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed URLs!')
