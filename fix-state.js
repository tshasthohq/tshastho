const fs = require('fs');
const file = 'src/app/pharmacy/medicines/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Check if formData useState exists and add strength
const stateRegex = /const\s*\[\s*formData\s*,\s*setFormData\s*\]\s*=\s*useState(?:<[^>]+>)?\s*\(\s*\{/;

if (stateRegex.test(content)) {
    const hasStrength = content.match(/const\s*\[\s*formData\s*,\s*setFormData\s*\]\s*=\s*useState(?:<[^>]+>)?\s*\(\s*\{[\s\S]*?strength/);
    if (!hasStrength) {
        content = content.replace(stateRegex, (match) => match + '\n    strength: "",');
        fs.writeFileSync(file, content);
        console.log('✅ Strength added to form state successfully!');
    } else {
        console.log('✅ Strength is already in form state.');
    }
} else {
    console.log('⚠️ Could not find exact useState pattern, applying fallback.');
    if (!content.includes('strength: ""')) {
        content = content.replace(/useState\(\{/, 'useState({\n    strength: "",');
        fs.writeFileSync(file, content);
        console.log('✅ Fallback applied successfully!');
    }
}
