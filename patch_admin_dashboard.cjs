const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

let newContent = content.replace(
  "import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';",
  "import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';"
);

newContent = newContent.replace(
  "const handleUpdateStatus = async (id: string, newStatus: string) => {",
  "const handleUpdateStatus = async (id: string, newStatus: string, parentId?: string, studentName?: string) => {"
);

newContent = newContent.replace(
  "setPendingAbsences(prev => prev.filter(record => record.id !== id));",
  "setPendingAbsences(prev => prev.filter(record => record.id !== id));\n\n      // Send FCM notification to parent\n      if (parentId) {\n        try {\n          const tokenDoc = await getDoc(doc(db, 'fcm_tokens', parentId));\n          if (tokenDoc.exists()) {\n            const { token } = tokenDoc.data();\n            if (token) {\n              fetch('/api/notify', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({\n                  token,\n                  title: `Status Laporan: ${newStatus}`,\n                  body: `Laporan ketidakhadiran untuk ${studentName || 'anak anda'} telah ${newStatus.toLowerCase()}.`\n                })\n              }).catch(console.error);\n            }\n          }\n        } catch (err) {\n          console.error('Error sending notification', err);\n        }\n      }"
);

newContent = newContent.replace(
  "<button onClick={() => handleUpdateStatus(record.id, 'Diluluskan')}",
  "<button onClick={() => handleUpdateStatus(record.id, 'Diluluskan', record.parentId, record.studentName)}"
);

newContent = newContent.replace(
  "<button onClick={() => handleUpdateStatus(record.id, 'Ditolak')}",
  "<button onClick={() => handleUpdateStatus(record.id, 'Ditolak', record.parentId, record.studentName)}"
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', newContent);
console.log("AdminDashboard patched");
