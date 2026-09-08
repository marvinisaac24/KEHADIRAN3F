const fs = require('fs');
const content = fs.readFileSync('src/pages/parent/ParentDashboard.tsx', 'utf8');

let newContent = content.replace(
  "import html2pdf from 'html2pdf.js';",
  ""
);

newContent = newContent.replace(
  /const handleDownloadPDF = \(\) => {[\s\S]*?html2pdf\(\)\.set\(opt\)\.from\(element\)\.save\(\);\n  };/,
  `const handleDownloadPDF = () => {
    window.print();
  };`
);

fs.writeFileSync('src/pages/parent/ParentDashboard.tsx', newContent);
console.log("Parent patched");
