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
    
    # Fix the missing API_BASE_URL
    content = content.replace("fetch(`/api/", "fetch(`${API_BASE_URL}/api/")
    content = content.replace("fetch(`http://127.0.0.1:8080/api/", "fetch(`${API_BASE_URL}/api/")
    content = content.replace("fetch('http://127.0.0.1:8080/api/", "fetch(`${API_BASE_URL}/api/")
    content = content.replace('fetch("http://127.0.0.1:8080/api/', 'fetch(`${API_BASE_URL}/api/')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done')
