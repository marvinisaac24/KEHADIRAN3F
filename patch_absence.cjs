const fs = require('fs');
const content = fs.readFileSync('src/pages/parent/ReportAbsence.tsx', 'utf8');

let newContent = content.replace(
  "import html2pdf from 'html2pdf.js';",
  ""
);

newContent = newContent.replace(
  /const downloadReceipt = \(\) => {[\s\S]*?html2pdf\(\)\.set\(opt\)\.from\(tempDiv\)\.save\(\);\n  };/,
  `const downloadReceipt = () => {
    const content = \`
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #2563eb; margin-bottom: 20px; text-align: center;">SK Tudan</h1>
        <h2 style="margin-bottom: 20px; text-align: center;">Resit Penghantaran Laporan Ketidakhadiran</h2>
        <hr style="margin: 20px 0;" />
        <p><strong>No. Rujukan:</strong> \${reference}</p>
        <p><strong>Nama Pelajar:</strong> \${student?.name}</p>
        <p><strong>Tarikh Ketidakhadiran:</strong> \${date}</p>
        <p><strong>Sebab:</strong> \${reason}</p>
        <p><strong>Status:</strong> Menunggu Kelulusan</p>
        <hr style="margin: 20px 0;" />
        <p style="text-align: center; color: #64748b;">Terima kasih.</p>
      </div>
    \`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };`
);

fs.writeFileSync('src/pages/parent/ReportAbsence.tsx', newContent);
console.log("Absence patched");
