const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// Add Recharts imports
content = content.replace(
  "import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';",
  "import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';"
);

// Add state for chart data
content = content.replace(
  "const [previewImage, setPreviewImage] = useState<string | null>(null);",
  "const [previewImage, setPreviewImage] = useState<string | null>(null);\n  const [chartData, setChartData] = useState<any[]>([]);"
);

// Add fetch logic for chart data
content = content.replace(
  "const fetchPending = async () => {",
  "const fetchPending = async () => {\n      try {\n        const approvedQ = query(\n          collection(db, 'absences'),\n          where('status', '==', 'Diluluskan')\n        );\n        const approvedSnapshot = await getDocs(approvedQ);\n        const dateCounts: Record<string, number> = {};\n        approvedSnapshot.docs.forEach(doc => {\n          const data = doc.data();\n          if (data.date && data.date.startsWith('2026-01-')) {\n            dateCounts[data.date] = (dateCounts[data.date] || 0) + 1;\n          }\n        });\n        const formattedData = Object.keys(dateCounts).sort().map(date => ({\n          date: date.substring(8, 10) + ' Jan',\n          jumlah: dateCounts[date]\n        }));\n        setChartData(formattedData);\n      } catch (err) {\n        console.error('Error fetching chart data:', err);\n      }\n"
);

// Replace placeholder with chart
content = content.replace(
  '<p className="text-slate-500">Carta Kehadiran Mingguan Placeholder</p>',
  `{chartData.length > 0 ? (
            <div className="w-full h-full min-h-[300px]">
              <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">Analisis Ketidakhadiran Harian (Januari 2026)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500">Tiada data analisis bulan ini.</p>
          )}`
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
console.log("AdminDashboard chart patched");
