import glob

files = ['src/components/MusicPlayer.tsx', 'src/app/page.tsx']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the missing API_BASE_URL for music
    content = content.replace("const url = `/music/", "const url = `${API_BASE_URL}/music/")
    # Avatar and cover image URL in page.tsx might also be broken!
    content = content.replace('src={`/api/', 'src={`${API_BASE_URL}/api/')
    content = content.replace('url(`/api/', 'url(`${API_BASE_URL}/api/')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done music and images')
