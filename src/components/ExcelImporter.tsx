import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Download, UploadCloud, CheckCircle2, AlertTriangle, Play, FileSpreadsheet, Trash2 } from "lucide-react";
import { MaintenanceCategory, IssueSeverity } from "../types";

interface ExcelImporterProps {
  onImportComplete: (importedTickets: any[]) => void;
  onClose: () => void;
}

export function ExcelImporter({ onImportComplete, onClose }: ExcelImporterProps) {
  const [fileData, setFileData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse excel file
  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setErrors([]);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        validateAndSetRows(rows);
      } catch (err) {
        console.error("Failed to read excel: ", err);
        setErrors(["Unable to read file. Please ensure it is a valid Excel spreadsheet (.xlsx, .xls) or CSV."]);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setErrors(["File reading error. Please try again."]);
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const validateAndSetRows = (rows: any[]) => {
    if (rows.length === 0) {
      setErrors(["The sheet appears to be empty."]);
      return;
    }

    const cleanedRows: any[] = [];
    const validationErrors: string[] = [];

    // Map expected headers (case insensitive / substring matches)
    rows.forEach((row, index) => {
      const rowNum = index + 2; // Excels are 1-indexed, first row is header
      
      const apartment = row["Apartment"] || row["apartment"] || row["Unit"] || row["unit"] || row["Apartment Number"] || "";
      const block = row["Block"] || row["block"] || row["Building Block"] || row["building block"] || "Block A";
      const categoryRaw = row["Category"] || row["category"] || row["Type"] || row["type"] || "";
      const severityRaw = row["Severity"] || row["severity"] || row["Urgency"] || row["urgency"] || "Medium";
      const description = row["Description"] || row["description"] || row["Complaint"] || row["complaint"] || "";
      const contact = row["Contact"] || row["contact"] || row["Phone"] || row["phone"] || row["Contact Number"] || "";
      const email = row["Email"] || row["email"] || row["Resident Email"] || row["resident email"] || "";

      // Validate core elements
      if (!apartment) {
        validationErrors.push(`Row ${rowNum}: 'Apartment Number' is missing.`);
      }
      if (!description) {
        validationErrors.push(`Row ${rowNum}: 'Description' is missing.`);
      }
      if (!contact) {
        validationErrors.push(`Row ${rowNum}: 'Contact Number' is missing.`);
      }
      if (!email) {
        validationErrors.push(`Row ${rowNum}: 'Resident Email' is missing.`);
      }

      // Match Categories safely
      let category = MaintenanceCategory.OTHERS;
      const normalizedCat = String(categoryRaw).toLowerCase();
      if (normalizedCat.includes("sew")) category = MaintenanceCategory.SEWERAGE;
      else if (normalizedCat.includes("external") || normalizedCat.includes("ext")) category = MaintenanceCategory.EXTERNAL_PIPE;
      else if (normalizedCat.includes("internal") || normalizedCat.includes("int") || normalizedCat.includes("water") || normalizedCat.includes("line")) category = MaintenanceCategory.INTERNAL_WATER_LINE;
      else if (normalizedCat.includes("culvert") || normalizedCat.includes("drain")) category = MaintenanceCategory.DRAIN_CULVERT;

      // Match Severity
      let severity = IssueSeverity.MEDIUM;
      const normalizedSev = String(severityRaw).toLowerCase();
      if (normalizedSev.includes("low")) severity = IssueSeverity.LOW;
      else if (normalizedSev.includes("high")) severity = IssueSeverity.HIGH;
      else if (normalizedSev.includes("emergency") || normalizedSev.includes("urgent")) severity = IssueSeverity.EMERGENCY;

      cleanedRows.push({
        apartmentNumber: String(apartment).trim(),
        buildingBlock: String(block).trim(),
        category,
        severity,
        description: String(description).trim(),
        contactNumber: String(contact).trim(),
        residentEmail: String(email).trim()
      });
    });

    setErrors(validationErrors);
    setFileData(cleanedRows);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  // Submit parsed complaints
  const handleCommit = async () => {
    if (fileData.length === 0 || errors.length > 0) return;
    setLoading(true);

    try {
      const results: any[] = [];
      for (const item of fileData) {
        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            skipAI: false // Instantly get diagnosis recommendation
          })
        });
        if (response.ok) {
          const resJson = await response.json();
          results.push(resJson);
        }
      }
      onImportComplete(results);
    } catch (e) {
      console.error("Bulk commit failed: ", e);
      setErrors(["Network error while submitting parsed complaints. Contact building administrator."]);
    } finally {
      setLoading(false);
    }
  };

  // Download generic Excel Template for user convenience
  const downloadTemplate = () => {
    const defaultData = [
      {
        "Apartment Number": "104",
        "Building Block": "Block A",
        "Category": "Internal Water Line",
        "Severity": "High",
        "Description": "Water stains forming on master bathroom ceiling panel from upstairs leak",
        "Contact Number": "+1 (555) 0122-384",
        "Resident Email": "apt104.resident@example.com"
      },
      {
        "Apartment Number": "302",
        "Building Block": "Block C",
        "Category": "Sewerage",
        "Severity": "Emergency",
        "Description": "Kitchen sewer riser backed up, sink water overflowing onto floor tiles",
        "Contact Number": "+1 (555) 0101-998",
        "Resident Email": "collins.blockc@example.com"
      },
      {
        "Apartment Number": "Common Grounds",
        "Building Block": "Block D",
        "Category": "Drain Culvert",
        "Severity": "Low",
        "Description": "Fallen leaves clogging storm water culvert grate near parking gates",
        "Contact Number": "+1 (555) 0152-332",
        "Resident Email": "sitekeeper@example.com"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(defaultData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints Template");
    XLSX.writeFile(workbook, "apartment_complaints_template.xlsx");
  };

  const removeFile = () => {
    setFileData([]);
    setFileName("");
    setErrors([]);
  };

  return (
    <div id="excel-import-modal" className="bg-white border border-slate-200 rounded-2xl shadow-xl p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Bulk Complaint Spreadsheet Upload
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perfect for managers transferring historic, handwritten, or external offline logs into the portal.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Action Box */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-3">
            <p className="font-semibold text-slate-700">Supported Sheet Structure:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li><strong>Apartment Number</strong> (e.g. 102, Ground Gate East)</li>
              <li><strong>Building Block</strong> (e.g. Block B, Wing 1)</li>
              <li><strong>Category</strong> (Sewerage, External Pipe, Internal Water Line, Drain Culvert, Others)</li>
              <li><strong>Severity</strong> (Low, Medium, High, Emergency)</li>
              <li><strong>Description</strong> (Specific structural/fitting failure summary)</li>
              <li><strong>Contact Number</strong> &amp; <strong>Resident Email</strong></li>
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-xs"
              >
                <Download className="w-4 h-4" />
                Download Sample Excel Template
              </button>
            </div>
          </div>

          {/* DND Drag Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              {fileName ? fileName : "Drag & Drop your Spreadsheet file here"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Accepts Excel (.xlsx, .xls) or CSV up to 10MB</p>
          </div>
        </div>

        {/* Right Output Validation Logger */}
        <div className="lg:col-span-7 flex flex-col justify-between border border-slate-100 rounded-xl bg-slate-50/30 p-4">
          <div className="flex-grow">
            <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Parsed Rows Visualizer ({fileData.length} records found)</span>
              {fileData.length > 0 && (
                <button onClick={removeFile} className="text-rose-500 hover:text-rose-700 flex items-center gap-1 text-[10px]">
                  <Trash2 className="w-3 h-3" /> Clear selection
                </button>
              )}
            </h3>

            {loading ? (
              <div className="h-44 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Processing table structures...</p>
              </div>
            ) : fileData.length > 0 ? (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                {fileData.map((row, idx) => (
                  <div key={idx} className="p-2.5 text-xs flex justify-between items-start gap-4 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                          {row.buildingBlock} - {row.apartmentNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-full">
                          {row.category}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded-full ${
                          row.severity === IssueSeverity.EMERGENCY || row.severity === IssueSeverity.HIGH
                            ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
                        }`}>
                          {row.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate text-[11px]">{row.description}</p>
                    </div>
                    <div className="text-[10px] text-right text-slate-400 shrink-0">
                      <div>{row.contactNumber}</div>
                      <div>{row.residentEmail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-44 border border-dashed border-slate-200 rounded-lg bg-white flex flex-col items-center justify-center p-4 text-center">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-1" />
                <p className="text-xs text-slate-400">No Excel file imported yet.</p>
                <p className="text-[10px] text-slate-400 max-w-sm mt-0.5">Please drop template or select an excel file on the left side menu to proceed.</p>
              </div>
            )}

            {/* Error logs */}
            {errors.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 text-[11px] text-red-600 max-h-24 overflow-y-auto space-y-1">
                <div className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Validation Warning ({errors.length} issue(s) detected):</span>
                </div>
                {errors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="py-1.5 px-3 bg-white border border-slate-200 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={fileData.length === 0 || errors.length > 0 || loading}
              className={`py-1.5 px-4 font-semibold text-xs rounded-lg flex items-center gap-1.5 ${
                fileData.length === 0 || errors.length > 0 || loading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-sm transition-all"
              }`}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Uploading rows...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Commit bulk list ({fileData.length} row(s))</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
