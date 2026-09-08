const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');
content = content.replace(
  '"ai-studio-75f156d3-289b-4e79-b60f-62b18aa9625e"',
  '"ai-studio-sistemketidakhad-75f156d3-289b-4e79-b60f-62b18aa9625e"'
);
fs.writeFileSync('src/lib/firebase.ts', content);
console.log("Firebase DB ID patched");
