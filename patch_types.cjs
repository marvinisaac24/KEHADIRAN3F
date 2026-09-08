const fs = require('fs');
const content = fs.readFileSync('src/pages/parent/ParentDashboard.tsx', 'utf8');

let newContent = content.replace(
  "image: { type: 'jpeg', quality: 0.98 },",
  "image: { type: 'jpeg' as const, quality: 0.98 },"
);

newContent = newContent.replace(
  "jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }",
  "jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }"
);

fs.writeFileSync('src/pages/parent/ParentDashboard.tsx', newContent);
console.log("Types patched");
