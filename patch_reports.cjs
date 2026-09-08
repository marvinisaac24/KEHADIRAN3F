const fs = require('fs');
const content = fs.readFileSync('src/components/reports/ReportsView.tsx', 'utf8');

let newContent = content.replace(
  "import html2pdf from 'html2pdf.js';",
  ""
);

newContent = newContent.replace(
  /const handleExport = \(\) => {[\s\S]*?html2pdf\(\)\.set\(opt\)\.from\(element\)\.save\(\);\n  };/,
  `const handleExport = () => {
    window.print();
  };`
);

fs.writeFileSync('src/components/reports/ReportsView.tsx', newContent);
console.log("Reports patched");
