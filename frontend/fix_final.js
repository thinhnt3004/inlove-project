const fs = require('fs');

const files = [
    'src/app/page.tsx',
    'src/app/capsule/page.tsx',
    'src/app/roulette/page.tsx',
    'src/components/ClientLayout.tsx',
    'src/components/MusicPlayer.tsx',
    'src/context/CoupleContext.tsx'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    
    content = content.replace(/fetch\(\\/api\//g, 'fetch(\${API_BASE_URL}/api/');
    content = content.replace(/fetch\(\"\/api\//g, 'fetch(\${API_BASE_URL}/api/');
    content = content.replace(/fetch\(\'\/api\//g, 'fetch(\${API_BASE_URL}/api/');
    
    fs.writeFileSync(file, content);
}

console.log("Done");
