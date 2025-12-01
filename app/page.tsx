"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PromptRow {
  id: number;
  before: string;
  after: string;
  label?: string;
}

export default function Home() {
  const [rows, setRows] = useState<PromptRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<"markdown" | "raw">("markdown");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length === 0) return;

        let beforeKey = "";
        let afterKey = "";
        let labelKey = "";

        // Find before/after columns
        const originalHeaders = Object.keys(data[0]);
        for (const h of originalHeaders) {
          const lower = h.toLowerCase().trim();
          if (lower.includes("before") || lower === "old" || lower === "original") {
            beforeKey = h;
          } else if (lower.includes("after") || lower === "new" || lower === "updated") {
            afterKey = h;
          } else if (lower.includes("label") || lower.includes("name") || lower.includes("id")) {
            labelKey = h;
          }
        }

        // Fallback: use first two columns
        if (!beforeKey && originalHeaders.length >= 1) beforeKey = originalHeaders[0];
        if (!afterKey && originalHeaders.length >= 2) afterKey = originalHeaders[1];

        const parsed: PromptRow[] = data.map((row, idx) => ({
          id: idx,
          before: row[beforeKey] || "",
          after: row[afterKey] || "",
          label: labelKey ? row[labelKey] : undefined,
        }));

        setRows(parsed);
        setSelectedIndex(0);
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        alert("CSVファイルの解析に失敗しました");
      },
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        parseCSV(file);
      }
    },
    [parseCSV]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseCSV(file);
    },
    [parseCSV]
  );

  const selectedRow = rows[selectedIndex];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--accent-purple)" }}
          >
            ⟷
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Prompt Compare
          </h1>
        </div>

        {rows.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {rows.length} prompts loaded
            </span>
            <div
              className="flex rounded overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <button
                onClick={() => setViewMode("markdown")}
                className="px-3 py-1 text-sm transition-colors"
                style={{
                  background: viewMode === "markdown" ? "var(--accent-blue)" : "transparent",
                  color: viewMode === "markdown" ? "#fff" : "var(--text-secondary)",
                }}
              >
                Rendered
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className="px-3 py-1 text-sm transition-colors"
                style={{
                  background: viewMode === "raw" ? "var(--accent-blue)" : "transparent",
                  color: viewMode === "raw" ? "#fff" : "var(--text-secondary)",
                }}
              >
                Raw
              </button>
            </div>
            <button
              onClick={() => {
                setRows([]);
                setSelectedIndex(0);
              }}
              className="px-3 py-1 text-sm rounded transition-colors hover:opacity-80"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              Reset
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      {rows.length === 0 ? (
        /* Upload Zone */
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-2xl p-12 rounded-lg cursor-pointer transition-all ${
              isDragging ? "upload-zone-active" : ""
            }`}
            style={{
              border: `2px dashed ${isDragging ? "var(--accent-blue)" : "var(--border)"}`,
              background: isDragging ? "rgba(88, 166, 255, 0.05)" : "var(--bg-secondary)",
            }}
          >
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl"
                style={{ background: "var(--bg-tertiary)" }}
              >
                📄
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Drop your CSV file here
              </h2>
              <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
                or click to browse
              </p>
              <div
                className="text-sm p-4 rounded-md"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
              >
                <p className="mb-2">Expected CSV format:</p>
                <code className="block" style={{ color: "var(--accent-orange)" }}>
                  before,after
                </code>
                <code className="block" style={{ color: "var(--accent-orange)" }}>
                  &quot;# Old prompt...&quot;,&quot;# New prompt...&quot;
                </code>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        /* Compare View */
        <div className="flex-1 flex overflow-hidden">
          {/* Main Compare Area */}
          <main className="flex-1 flex overflow-hidden">
            {/* Before Panel */}
            <div
              className="flex-1 flex flex-col overflow-hidden"
              style={{ borderRight: "1px solid var(--border)" }}
            >
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: "var(--accent-red)" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--accent-red)" }}>
                  BEFORE
                </span>
              </div>
              <div className="flex-1 overflow-auto p-6" style={{ background: "var(--bg-primary)" }}>
                {viewMode === "markdown" ? (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedRow?.before || ""}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedRow?.before || ""}
                  </pre>
                )}
              </div>
            </div>

            {/* After Panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: "var(--accent-green)" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--accent-green)" }}>
                  AFTER
                </span>
              </div>
              <div className="flex-1 overflow-auto p-6" style={{ background: "var(--bg-primary)" }}>
                {viewMode === "markdown" ? (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedRow?.after || ""}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedRow?.after || ""}
                  </pre>
                )}
              </div>
            </div>
          </main>

          {/* Sidebar - Row List (Right Side) */}
          <aside
            className="w-64 flex-shrink-0 overflow-y-auto"
            style={{ borderLeft: "1px solid var(--border)", background: "var(--bg-secondary)" }}
          >
            <div
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider sticky top-0"
              style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
            >
              Prompts
            </div>
            <div className="pb-4">
              {rows.map((row, idx) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedIndex(idx)}
                  className="px-4 py-3 cursor-pointer transition-colors hover:opacity-80"
                  style={{
                    background: idx === selectedIndex ? "rgba(88, 166, 255, 0.1)" : "transparent",
                    borderRight: idx === selectedIndex ? "3px solid var(--accent-blue)" : "3px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded text-xs flex items-center justify-center"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className="text-sm truncate flex-1"
                      style={{ color: idx === selectedIndex ? "var(--text-primary)" : "var(--text-secondary)" }}
                    >
                      {row.label || `Prompt ${idx + 1}`}
                    </span>
                  </div>
                  <div
                    className="mt-1 text-xs truncate pl-8"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {row.before.slice(0, 50)}...
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Footer */}
      <footer
        className="px-6 py-2 text-xs flex justify-between"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      >
        <span>Prompt Compare Tool</span>
        {rows.length > 0 && (
          <span>
            Viewing {selectedIndex + 1} of {rows.length}
          </span>
        )}
      </footer>
    </div>
  );
}
