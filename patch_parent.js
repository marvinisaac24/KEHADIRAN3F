const fs = require('fs');
const content = fs.readFileSync('src/pages/parent/ParentDashboard.tsx', 'utf8');

let newContent = content.replace(
  "import { Search, Plus, User as UserIcon, XCircle, Clock } from 'lucide-react';",
  "import { Search, Plus, User as UserIcon, XCircle, Clock, Download } from 'lucide-react';\nimport html2pdf from 'html2pdf.js';"
);

newContent = newContent.replace(
  "const [isSearching, setIsSearching] = useState(false);",
  "const [isSearching, setIsSearching] = useState(false);\n\n  const handleDownloadPDF = () => {\n    const element = document.getElementById('parent-report-content');\n    if (!element) return;\n    const opt = {\n      margin: 0.5,\n      filename: `Laporan_Kehadiran_Anak.pdf`,\n      image: { type: 'jpeg', quality: 0.98 },\n      html2canvas: { scale: 2 },\n      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }\n    };\n    html2pdf().set(opt).from(element).save();\n  };\n"
);

newContent = newContent.replace(
  "<div className=\"space-y-6\">",
  "<div className=\"space-y-6\">\n      <div className=\"flex justify-end print:hidden\">\n        <button onClick={handleDownloadPDF} className=\"inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm\">\n          <Download className=\"w-4 h-4 mr-2\" /> Muat Turun Analisis PDF\n        </button>\n      </div>\n      <div id=\"parent-report-content\" className=\"space-y-6\">"
);

// We need to close the extra div at the end
newContent = newContent.replace(
  "    </div>\n  );\n}",
  "      </div>\n    </div>\n  );\n}"
);

fs.writeFileSync('src/pages/parent/ParentDashboard.tsx', newContent);
console.log("Patched successfully");
