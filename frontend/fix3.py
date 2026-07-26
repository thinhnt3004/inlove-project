import glob

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
    
    # Just fix all instances of `${API_BASE_URL}` that lack a backtick
    content = content.replace('fetch(${API_BASE_URL}', 'fetch(`${API_BASE_URL}')
    
    # Also fix the trailing double/single quote
    content = content.replace('`${API_BASE_URL}/api/upload",', '`${API_BASE_URL}/api/upload`,')
    content = content.replace('`${API_BASE_URL}/api/user/${userId}/avatar`,', '`${API_BASE_URL}/api/user/${userId}/avatar`,')
    content = content.replace('`${API_BASE_URL}/api/user/${userId}/profile`,', '`${API_BASE_URL}/api/user/${userId}/profile`,')
    content = content.replace('`${API_BASE_URL}/api/couple/create`,', '`${API_BASE_URL}/api/couple/create`,')
    content = content.replace('`${API_BASE_URL}/api/music")', '`${API_BASE_URL}/api/music`)')
    content = content.replace('`${API_BASE_URL}/music/${songName}`;', '`${API_BASE_URL}/music/${songName}`;')
    
    import re
    # Fix instances where the end quote was left over and not caught above
    # E.g. `${API_BASE_URL}/api/upload", -> `${API_BASE_URL}/api/upload`,
    content = re.sub(r'\`\$\{API_BASE_URL\}([^`"\n]*)"', r'`${API_BASE_URL}\1`', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done fixing!')
