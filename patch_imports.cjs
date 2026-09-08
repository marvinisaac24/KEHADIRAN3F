const fs = require('fs');
const content = fs.readFileSync('src/pages/parent/ParentDashboard.tsx', 'utf8');

let newContent = content.replace(
  "import { CheckCircle2, XCircle, Clock, Search, Plus, User as UserIcon } from 'lucide-react';",
  "import { CheckCircle2, XCircle, Clock, Search, Plus, User as UserIcon, Download } from 'lucide-react';\nimport html2pdf from 'html2pdf.js';"
);

fs.writeFileSync('src/pages/parent/ParentDashboard.tsx', newContent);
console.log("Imports patched");
