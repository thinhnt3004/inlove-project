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
    
    # The backtick was swallowed by powershell, so it currently looks like:
    # fetch(/api/upload",
    # or
    # fetch(/api/upload',
    # or it was correctly backticked if it was originally fetch(\http://...
    
    # Let's just fix it universally.
    # First, let's revert the API_BASE_URL replacements where they are broken.
    content = content.replace('\', 'http://127.0.0.1:8080')
    
    # Now correctly replace them!
    content = content.replace('"http://127.0.0.1:8080', '\')
    content = content.replace('http://127.0.0.1:8080"', '\')
    # For single quotes
    content = content.replace("'http://127.0.0.1:8080", "\")
    content = content.replace("http://127.0.0.1:8080'", "\")
    
    # For already backticked ones
    content = content.replace('http://127.0.0.1:8080', '\')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Fixed URLs cleanly!')
