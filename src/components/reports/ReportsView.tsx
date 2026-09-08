import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useStudents } from "../../lib/students";
import {
  FileText,
  Calendar,
  Users,
  BarChart3,
  Download,
  Filter,
  UserMinus,
  Loader2,
  Upload,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Papa from "papaparse";
import {
  parseAbsenceDate,
  formatAbsenceDate,
  formatDateTime,
} from "../../lib/dateUtils";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ReportsView() {
  const studentsList = useStudents();
  const [activeTab, setActiveTab] = useState("daily");
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  ); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [excludedStudents, setExcludedStudents] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "absences"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAbsences(docs);
    } catch (error) {
      console.error("Error fetching absences: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, []);

  const tabs = [
    { id: "daily", label: "Kehadiran Harian", icon: Calendar },
    { id: "monthly", label: "Analisis Bulanan", icon: BarChart3 },
    { id: "reasons", label: "Sebab Ketidakhadiran", icon: FileText },
    { id: "approvals", label: "Rekod Kelulusan", icon: ShieldCheck },
    { id: "class", label: "Ringkasan Kelas", icon: Users },
  ];

  const allUniqueStudents = Array.from(
    new Set([
      ...studentsList.map((s) => s.name),
      ...absences.map((a) => a.studentName),
    ]),
  ).sort();

  const uniqueStudents = allUniqueStudents.filter(
    (name) => !excludedStudents.includes(name),
  );

  const toggleStudent = (name: string) => {
    setExcludedStudents((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleExport = () => {
    window.print();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          const totalRecords = data.filter(
            (row) => row.studentName && row.date,
          ).length;

          if (totalRecords > 0) {
            // Kosongkan rekod lama dalam sistem
            const q = query(collection(db, "absences"));
            const snap = await getDocs(q);
            for (const document of snap.docs) {
              await deleteDoc(doc(db, "absences", document.id));
            }
          }

          let processed = 0;

          const uniqueNewStudents = new Set<string>();

          for (const row of data) {
            if (row.studentName && row.date) {
              uniqueNewStudents.add(row.studentName);
              await addDoc(collection(db, "absences"), {
                studentName: row.studentName,
                date: row.date,
                reason: row.reason || "Tiada Maklumat",
                status: row.status || "Diluluskan",
                createdAt: new Date().toISOString(),
              });
              processed++;
              setUploadProgress(Math.round((processed / totalRecords) * 100));
            }
          }

          // Wujudkan senarai murid baharu dan kosongkan yang sedia ada
          if (uniqueNewStudents.size > 0) {
            const newStudentsList = Array.from(uniqueNewStudents)
              .sort()
              .map((name, index) => ({
                id: String(index + 1).padStart(3, "0"),
                name: name,
                class: "3 Fleksibel",
              }));
            localStorage.setItem(
              "admin_students",
              JSON.stringify(newStudentsList),
            );
            window.dispatchEvent(new Event("students_updated"));
          }
          
          localStorage.setItem("last_csv_upload", new Date().toISOString());
          window.dispatchEvent(new Event("csv_uploaded"));

          setSuccessMessage(
            "Data CSV berjaya dimuat naik dan dikemas kini dalam sistem!",
          );
          setTimeout(() => setSuccessMessage(""), 5000);
          await fetchAbsences();
        } catch (error) {
          console.error("Ralat memuat naik CSV:", error);
          alert("Gagal memuat naik data CSV.");
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        console.error("Ralat parse CSV:", error);
        alert("Gagal membaca fail CSV.");
        setIsUploading(false);
        setUploadProgress(0);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Laporan Kehadiran
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Analisis dan rekod ketidakhadiran pelajar
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <UserMinus className="w-4 h-4 mr-2" />
              Tapis Pelajar{" "}
              {excludedStudents.length > 0 && `(${excludedStudents.length})`}
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pilih Pelajar
                  </h3>
                  {excludedStudents.length > 0 && (
                    <button
                      onClick={() => setExcludedStudents([])}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {allUniqueStudents.map((student) => (
                    <label
                      key={student}
                      className="flex items-start space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!excludedStudents.includes(student)}
                        onChange={() => toggleStudent(student)}
                        className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 leading-tight">
                        {student}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(activeTab === "daily" || activeTab === "reasons" || activeTab === "approvals") && (
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm border-none focus:ring-0 text-slate-700 dark:text-slate-200"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString("ms-MY", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm border-none focus:ring-0 text-slate-700 dark:text-slate-200"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading
              ? `Memuat Naik... ${uploadProgress}%`
              : "Muat Naik CSV"}
          </button>

          <button
            onClick={handleExport}

            className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Cetak PDF
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Memuat naik dan memproses data CSV...
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6 shadow-sm text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center justify-center">
          {successMessage}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden print:border-none print:shadow-none">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 hide-scrollbar print:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mr-2 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          id="report-content"
          className="p-6 overflow-x-auto print:overflow-visible"
        >
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              Memuatkan data...
            </div>
          ) : (
            <>
              {activeTab === "daily" && (
                <DailyAttendanceTab
                  absences={absences}
                  month={selectedMonth}
                  year={selectedYear}
                  uniqueStudents={uniqueStudents}
                />
              )}
              {activeTab === "monthly" && (
                <MonthlyAnalysisTab
                  absences={absences}
                  year={selectedYear}
                  uniqueStudents={uniqueStudents}
                />
              )}
              {activeTab === "reasons" && (
                <AbsenceReasonsTab
                  absences={absences}
                  month={selectedMonth}
                  year={selectedYear}
                  excludedStudents={excludedStudents}
                />
              )}
              {activeTab === "approvals" && (
                <StudentApprovalsTab
                  absences={absences}
                  month={selectedMonth}
                  year={selectedYear}
                  onRefresh={fetchAbsences}
                />
              )}
              {activeTab === "class" && <ClassSummaryTab />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DailyAttendanceTab({
  absences,
  month,
  year,
  uniqueStudents,
}: {
  absences: any[];
  month: number;
  year: number;
  uniqueStudents: string[];
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = new Date(year, month - 1, 1)
    .toLocaleString("ms-MY", { month: "long" })
    .toUpperCase();

  const dailyTotals = Array(daysInMonth).fill(0);

  // Compute daily totals before rendering chart
  const attendanceDataMap = new Map();
  uniqueStudents.forEach((student) => {
    const attendanceMap = new Map<number, string>();
    absences
      .filter((a) => {
        if (a.studentName !== student) return false;
        if (a.status !== "Diluluskan") return false;
        const parsed = parseAbsenceDate(a.date);
        return parsed && parsed.month === month && parsed.year === year;
      })
      .forEach((a) => {
        const parsed = parseAbsenceDate(a.date);
        if (!parsed) return;
        const day = parsed.day;
        let mark = "0";
        if (a.attachmentUrl) {
          const reasonUpper = (a.reason || "").toUpperCase();
          if (
            a.reason === "Sakit" ||
            a.reason === "Temujanji Doktor" ||
            reasonUpper.includes("SAKIT") ||
            reasonUpper.includes("DOKTOR") ||
            reasonUpper.includes("KLINIK")
          ) {
            mark = "S";
          } else {
            mark = "SR";
          }
        }
        attendanceMap.set(day, mark);
      });

    for (const day of attendanceMap.keys()) {
      if (day > 0 && day <= daysInMonth) {
        dailyTotals[day - 1]++;
      }
    }
    attendanceDataMap.set(student, attendanceMap);
  });

  return (
    <div>
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold">ANALISIS KEHADIRAN MURID</h2>
        <h3 className="text-md font-semibold">TAHUN TIGA FLEKSIBEL</h3>
        <p className="text-slate-500">
          {monthName} {year}
        </p>
      </div>

      <div className="w-full h-[250px] mb-8 print:hidden">
        <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">
          Trend Ketidakhadiran Harian
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={days.map((d, i) => ({
              hari: String(d).padStart(2, "0"),
              jumlah: dailyTotals[i],
            }))}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="hari"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar
              dataKey="jumlah"
              name="Jumlah Tidak Hadir"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs justify-center text-slate-600 dark:text-slate-400">
        <span className="flex items-center">
          <span className="w-4 h-4 inline-flex items-center justify-center bg-white border border-slate-300 mr-1">
            /
          </span>{" "}
          Hadir
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 inline-flex items-center justify-center bg-red-50 text-red-500 font-bold border border-red-200 mr-1">
            0
          </span>{" "}
          Tidak Hadir (Tiada Dokumen)
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 inline-flex items-center justify-center bg-amber-50 text-amber-600 font-bold border border-amber-200 mr-1">
            S
          </span>{" "}
          Sijil Sakit
        </span>
        <span className="flex items-center">
          <span className="w-4 h-4 inline-flex items-center justify-center bg-blue-50 text-blue-600 font-bold border border-blue-200 mr-1">
            SR
          </span>{" "}
          Surat Rasmi
        </span>
      </div>
      <table className="w-full text-sm text-center border-collapse border border-slate-300 dark:border-slate-600">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-700">
            <th className="border border-slate-300 dark:border-slate-600 p-2 text-left sticky left-0 bg-slate-100 dark:bg-slate-700 z-10">
              Bil
            </th>
            <th className="border border-slate-300 dark:border-slate-600 p-2 text-left sticky left-8 bg-slate-100 dark:bg-slate-700 z-10 min-w-[200px]">
              Nama Pelajar
            </th>
            {days.map((d) => (
              <th
                key={d}
                className="border border-slate-300 dark:border-slate-600 p-1 w-8"
              >
                {String(d).padStart(2, "0")}
              </th>
            ))}
            <th className="border border-slate-300 dark:border-slate-600 p-2">
              Hadir
            </th>
          </tr>
        </thead>
        <tbody>
          {uniqueStudents.map((student, idx) => {
            const attendanceMap = attendanceDataMap.get(student) || new Map();
            const hadirCount = daysInMonth - attendanceMap.size;

            return (
              <tr
                key={student}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="border border-slate-300 dark:border-slate-600 p-2 sticky left-0 bg-white dark:bg-slate-800">
                  {idx + 1}
                </td>
                <td className="border border-slate-300 dark:border-slate-600 p-2 text-left sticky left-8 bg-white dark:bg-slate-800 text-xs font-medium">
                  {student}
                </td>
                {days.map((d) => {
                  const status = attendanceMap.get(d);
                  let cellClass = "text-slate-400";
                  let display = "/";

                  if (status === "0") {
                    cellClass =
                      "text-red-500 font-bold bg-red-50 dark:bg-red-900/20";
                    display = "0";
                  } else if (status === "S") {
                    cellClass =
                      "text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20";
                    display = "S";
                  } else if (status === "SR") {
                    cellClass =
                      "text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20";
                    display = "SR";
                  }

                  return (
                    <td
                      key={d}
                      className={`border border-slate-300 dark:border-slate-600 p-1 font-mono ${cellClass}`}
                    >
                      {display}
                    </td>
                  );
                })}
                <td className="border border-slate-300 dark:border-slate-600 p-2 font-semibold">
                  {hadirCount}/{daysInMonth}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MonthlyAnalysisTab({
  absences,
  year,
  uniqueStudents,
}: {
  absences: any[];
  year: number;
  uniqueStudents: string[];
}) {
  const months = [
    "Jan",
    "Feb",
    "Mac",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ogs",
    "Sep",
    "Okt",
    "Nov",
    "Dis",
  ];

  // Compute chart data dynamically
  const monthlyTotals = Array(12).fill(0);

  const studentRows = uniqueStudents.map((student, idx) => {
    // Add firestore real data for selected year
    const dynamicMonthly = Array(12).fill(0);
    absences.forEach((a) => {
      if (a.status === "Diluluskan" && a.studentName === student) {
        const parsed = parseAbsenceDate(a.date);
        if (parsed && parsed.year === year) {
          const m = parsed.month - 1; // 0-indexed
          if (m >= 0 && m < 12) dynamicMonthly[m]++;
        }
      }
    });

    const total = dynamicMonthly.reduce((a, b) => a + b, 0);

    // Add to chart totals
    dynamicMonthly.forEach((val, i) => {
      monthlyTotals[i] += val;
    });

    return (
      <tr
        key={student}
        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <td className="border border-slate-300 dark:border-slate-600 p-2">
          {idx + 1}
        </td>
        <td className="border border-slate-300 dark:border-slate-600 p-2 text-left text-xs font-medium">
          {student}
        </td>
        {dynamicMonthly.map((val, mIdx) => (
          <td
            key={mIdx}
            className="border border-slate-300 dark:border-slate-600 p-2"
          >
            {val}
          </td>
        ))}
        <td className="border border-slate-300 dark:border-slate-600 p-2 font-bold">
          {total}
        </td>
      </tr>
    );
  });

  const chartData = months.map((m, i) => ({
    month: m,
    jumlah: monthlyTotals[i],
  }));

  return (
    <div>
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold">
          ANALISIS REKOD TIDAK HADIR MENGIKUT PELAJAR
        </h2>
        <p className="text-slate-500">TAHUN {year}</p>
      </div>

      <div className="w-full h-[300px] mb-8 print:hidden">
        <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">
          Carta Analisis Ketidakhadiran Bulanan
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar
              dataKey="jumlah"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="w-full text-sm text-center border-collapse border border-slate-300 dark:border-slate-600">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-700">
            <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
              Bil
            </th>
            <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
              Nama
            </th>
            {months.map((m) => (
              <th
                key={m}
                className="border border-slate-300 dark:border-slate-600 p-2"
              >
                {m}
              </th>
            ))}
            <th className="border border-slate-300 dark:border-slate-600 p-2 font-bold">
              Jumlah
            </th>
          </tr>
        </thead>
        <tbody>{studentRows}</tbody>
      </table>
    </div>
  );
}

function AbsenceReasonsTab({
  absences,
  month,
  year,
  excludedStudents,
}: {
  absences: any[];
  month: number;
  year: number;
  excludedStudents: string[];
}) {
  const dynamicRecords = absences.filter((a) => {
    if (a.status !== "Diluluskan") return false;
    const parsed = parseAbsenceDate(a.date);
    return parsed && parsed.month === month && parsed.year === year;
  });

  const allRecords = dynamicRecords
    .map((a) => ({
      date: formatAbsenceDate(a.date),
      name: a.studentName,
      reason: (a.reason || "Tiada Sebab").toUpperCase(),
      approvedAt: a.approvedAt,
      status: a.status,
    }))
    .filter((r) => !excludedStudents.includes(r.name));

  const monthName = new Date(year, month - 1, 1)
    .toLocaleString("ms-MY", { month: "long" })
    .toUpperCase();

  return (
    <div>
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold">ANALISIS SEBAB TIDAK HADIR</h2>
        <h3 className="text-md font-semibold">KELAS TAHUN TIGA FLEKSIBEL</h3>
        <p className="text-slate-500">
          BULAN {monthName} {year}
        </p>
      </div>
      <table className="w-full text-sm text-left border-collapse border border-slate-300 dark:border-slate-600">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-700">
            <th className="border border-slate-300 dark:border-slate-600 p-3 w-16 text-center">
              Bil
            </th>
            <th className="border border-slate-300 dark:border-slate-600 p-3 w-32">
              Tarikh Tidak Hadir
            </th>
            <th className="border border-slate-300 dark:border-slate-600 p-3">
              Nama Murid
            </th>
            <th className="border border-slate-300 dark:border-slate-600 p-3">
              Sebab Ketidakhadiran
            </th>
            <th className="border border-slate-300 dark:border-slate-600 p-3 w-40 text-center">
              Status Kelulusan
            </th>
          </tr>
        </thead>
        <tbody>
          {allRecords.map((record, idx) => (
            <tr
              key={idx}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td className="border border-slate-300 dark:border-slate-600 p-3 text-center">
                {idx + 1}
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-3 font-semibold text-slate-800 dark:text-slate-200">
                {record.date}
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-3 font-medium text-xs">
                {record.name}
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-3 text-xs">
                {record.reason}
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-3 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Diluluskan
                </span>
                {record.approvedAt && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatDateTime(record.approvedAt)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClassSummaryTab() {
  return (
    <div>
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold">
          SENARAI RINGKASAN MURID MENGIKUT KELAS
        </h2>
      </div>
      <div className="text-sm overflow-x-auto print:overflow-visible">
        <table className="w-full text-center border-collapse border border-slate-300 dark:border-slate-600">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th
                rowSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-2 text-left"
              >
                Tahun / Kelas
              </th>
              <th
                rowSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-2"
              >
                Jumlah
              </th>
              <th
                colSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-1"
              >
                ISLAM
              </th>
              <th
                colSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-1"
              >
                B.ISLAM
              </th>
              <th
                colSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-1"
              >
                MELAYU
              </th>
              <th
                colSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-1"
              >
                CINA
              </th>
              <th
                colSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-1"
              >
                IBAN
              </th>
              <th
                colSpan={2}
                className="border border-slate-300 dark:border-slate-600 p-1"
              >
                LAIN-LAIN
              </th>
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-800 text-xs">
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                L
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                P
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                L
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                P
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                L
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                P
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                L
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                P
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                L
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                P
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                L
              </th>
              <th className="border border-slate-300 dark:border-slate-600 p-1">
                P
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-slate-50">
              <td className="border border-slate-300 dark:border-slate-600 p-2 text-left font-medium">
                TAHUN TIGA FLEKSIBEL
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2 font-bold">
                34
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                6
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                4
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                12
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                12
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                5
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                1
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                2
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                0
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                5
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                11
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                2
              </td>
              <td className="border border-slate-300 dark:border-slate-600 p-2">
                4
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentApprovalsTab({
  absences,
  month,
  year,
  onRefresh,
}: {
  absences: any[];
  month: number;
  year: number;
  onRefresh?: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterByMonth, setFilterByMonth] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const monthName = new Date(year, month - 1, 1)
    .toLocaleString("ms-MY", { month: "long" })
    .toUpperCase();

  const filteredAbsences = absences.filter((a) => {
    // Exclude system marker
    if (a.status === "Sistem") return false;

    // Student search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = a.studentName?.toLowerCase().includes(term);
      const matchRef = a.reference?.toLowerCase().includes(term);
      const matchReason = a.reason?.toLowerCase().includes(term);
      if (!matchName && !matchRef && !matchReason) return false;
    }

    // Status filter
    if (statusFilter !== "all" && a.status !== statusFilter) {
      return false;
    }

    // Month filter if active
    if (filterByMonth) {
      const parsed = parseAbsenceDate(a.date);
      if (!parsed || parsed.month !== month || parsed.year !== year) {
        return false;
      }
    }

    return true;
  });

  // Sort: pending first, then by date descending
  const sortedRecords = [...filteredAbsences].sort((a, b) => {
    if (a.status === "Menunggu Kelulusan" && b.status !== "Menunggu Kelulusan") return -1;
    if (a.status !== "Menunggu Kelulusan" && b.status === "Menunggu Kelulusan") return 1;
    const timeA = new Date(a.approvedAt || a.date || a.createdAt || 0).getTime();
    const timeB = new Date(b.approvedAt || b.date || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const validRecords = absences.filter((a) => a.status !== "Sistem");
  const approvedTotal = validRecords.filter((a) => a.status === "Diluluskan").length;
  const pendingTotal = validRecords.filter((a) => a.status === "Menunggu Kelulusan").length;
  const rejectedTotal = validRecords.filter((a) => a.status === "Ditolak").length;

  return (
    <div className="space-y-6">
      {/* Lightbox Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Lampiran / Surat Sokongan MC</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex justify-center bg-slate-50 dark:bg-slate-900/50">
              {previewImage.startsWith("data:image") ||
              previewImage.includes(".png") ||
              previewImage.includes(".jpg") ||
              previewImage.includes(".jpeg") ? (
                <img
                  src={previewImage}
                  alt="Attachment"
                  className="max-w-full h-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <FileText className="w-16 h-16 mb-4 text-slate-400" />
                  <p>Dokumen lampiran fail.</p>
                  <a
                    href={previewImage}
                    download="lampiran"
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Muat Turun Fail
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header & Stats Cards */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Rekod Kelulusan Ketidakhadiran Murid
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rekod status permohonan ketidakhadiran murid yang telah diluluskan dan disahkan dalam laporan analitik
            </p>
          </div>
        </div>

        {/* Summary metric counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Jumlah Permohonan
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {validRecords.length}
            </span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl p-3">
            <span className="text-xs text-green-700 dark:text-green-400 block font-medium">
              Diluluskan (Dalam Analitik)
            </span>
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
              {approvedTotal}
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
            <span className="text-xs text-amber-700 dark:text-amber-400 block font-medium">
              Menunggu Kelulusan
            </span>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {pendingTotal}
            </span>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-3">
            <span className="text-xs text-red-700 dark:text-red-400 block font-medium">
              Ditolak
            </span>
            <span className="text-2xl font-bold text-red-700 dark:text-red-400">
              {rejectedTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari murid atau rujukan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status filters */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("Diluluskan")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === "Diluluskan"
                  ? "bg-green-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              Diluluskan
            </button>
            <button
              onClick={() => setStatusFilter("Menunggu Kelulusan")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === "Menunggu Kelulusan"
                  ? "bg-amber-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setStatusFilter("Ditolak")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === "Ditolak"
                  ? "bg-red-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              Ditolak
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={filterByMonth}
              onChange={(e) => setFilterByMonth(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>Hanya Bulan {monthName}</span>
          </label>
        </div>
      </div>

      {/* Table of Approval Records */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <th className="p-3 w-12 text-center border-b border-slate-200 dark:border-slate-700">Bil</th>
              <th className="p-3 w-32 border-b border-slate-200 dark:border-slate-700">No. Rujukan</th>
              <th className="p-3 border-b border-slate-200 dark:border-slate-700">Nama Murid</th>
              <th className="p-3 w-24 border-b border-slate-200 dark:border-slate-700">Kelas</th>
              <th className="p-3 w-36 border-b border-slate-200 dark:border-slate-700">Tarikh Tidak Hadir</th>
              <th className="p-3 border-b border-slate-200 dark:border-slate-700">Sebab</th>
              <th className="p-3 w-28 text-center border-b border-slate-200 dark:border-slate-700">Lampiran</th>
              <th className="p-3 w-36 text-center border-b border-slate-200 dark:border-slate-700">Status Kelulusan</th>
              <th className="p-3 w-40 border-b border-slate-200 dark:border-slate-700">Tarikh Kelulusan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {sortedRecords.length > 0 ? (
              sortedRecords.map((record, idx) => {
                const isApproved = record.status === "Diluluskan";
                const isPending = record.status === "Menunggu Kelulusan";
                const isRejected = record.status === "Ditolak";

                return (
                  <tr
                    key={record.id || idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 text-center text-xs text-slate-500">{idx + 1}</td>
                    <td className="p-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                      {record.reference || (record.id ? record.id.substring(0, 8).toUpperCase() : "-")}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                        {record.studentName}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                      {record.studentClass || "3 Fleksibel"}
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatAbsenceDate(record.date)}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {record.reason || "Tiada Sebab"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {record.attachmentUrl ? (
                        <button
                          onClick={() => setPreviewImage(record.attachmentUrl)}
                          className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 mr-1" />
                          Lihat MC
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isApproved && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Diluluskan
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Menunggu
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Ditolak
                        </span>
                      )}
                      {!isApproved && !isPending && !isRejected && (
                        <span className="text-xs text-slate-500">{record.status || "-"}</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                      {record.approvedAt ? (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {formatDateTime(record.approvedAt)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Oleh: {record.approvedBy || "Pentadbir"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum diluluskan</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Tiada rekod kelulusan ditemui
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cuba ubah kata kunci carian atau tetapan tapisan.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
