import os
import glob
import re

config_code = '''export const API_BASE_URL = typeof window !== 'undefined' ? 
  \\//\:8080\ : 
  'http://127.0.0.1:8080';
'''

with open('src/config.ts', 'w', encoding='utf-8') as f:
    f.write(config_code)

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
    
    if 'http://127.0.0.1:8080' not in content:
        continue
        
    # Determine correct import path
    # If in src/app/ or src/components/, it's ../config or ../../config or @/config
    # Next.js allows @/config since we have @/context etc.
    import_stmt = "import { API_BASE_URL } from '@/config';\n"
    
    # Add import after other imports
    lines = content.split('\n')
    last_import = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import = i
            
    lines.insert(last_import + 1, import_stmt)
    content = '\n'.join(lines)
    
    # Replace URLs
    content = content.replace('"http://127.0.0.1:8080', '${API_BASE_URL}')
    # For strings that end with "
    content = content.replace('http://127.0.0.1:8080"', '')
    # For already template literals
    content = content.replace('http://127.0.0.1:8080', '')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Updated frontend files!')
