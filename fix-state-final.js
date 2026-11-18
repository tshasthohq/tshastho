const fs = require('fs');
const file = 'src/app/pharmacy/medicines/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Find the useState for formData and inject 'strength: ""'
// This regex handles: useState({ ... }) AND useState<Type>({ ... })
const useRegex = /(const\s*\[\s*formData\s*,\s*setFormData\s*\]\s*=\s*useState(?:<[^>]+>)?\s*\(\s*\{)/;

if (useRegex.test(content)) {
    // Check if strength is already there to avoid duplicates
    const stateBlock = content.match(/const\s*\[\s*formData\s*,\s*setFormData\s*\]\s*=\s*useState[\s\S]*?\}\s*\)/);
    if (stateBlock && !stateBlock[0].includes('strength:')) {
        content = content.replace(useRegex, '$1\n    strength: "",');
        fs.writeFileSync(file, content);
        console.log('✅ Success! Added strength to form state initialization.');
    } else {
        console.log('✅ Strength is already in form state initialization.');
    }
} else {
    console.log('⚠️ Could not find the exact useState block. Trying a fallback...');
    // Fallback: Look for a generic initial state and add it
    if (!content.includes('strength: ""')) {
        content = content.replace(/useState\(\{/, 'useState({\n    strength: "",');
        fs.writeFileSync(file, content);
        console.log('✅ Fallback applied.');
    }
}
