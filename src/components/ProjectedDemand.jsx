import React, { useState, useEffect } from "react";
import { CloudUpload } from "lucide-react";
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import useAppStore from "../useAppStore";
import Atlanta from "../assets/Georgia.svg";
import LosAngeles from "../assets/California.svg";
import Seattle from "../assets/Seattle.svg";
import NewYork from "../assets/NewYork.svg";
import "handsontable/dist/handsontable.full.min.css";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import "handsontable/styles/ht-theme-horizon.css";
import TractParametersTable from "./TractParametersTable";
import { toast } from "react-toastify";
import TrafficLegend from "../assets/TrafficLegend.jpg";

// Register Handsontable modules
registerAllModules();

function ProjectedDemand() {
  const [showTable, setShowTable] = useState(false);
  const theme = useAppStore((s) => s.theme);
  const classificationState = useAppStore((s) => s.classificationState);
  const penetrationState = useAppStore((s) => s.penetrationState);
  const setPenetrationState = useAppStore((s) => s.setPenetrationState);
  const projectedDemandState = useAppStore((s) => s.projectedDemandState);
  const setProjectedDemandState = useAppStore((s) => s.setProjectedDemandState);
  const trafficState = useAppStore((s) => s.trafficVolumeState);

  // Auto-show table if speed was estimated before (e.g., when navigating back from next page)
  useEffect(() => {
    // Only show results if the speedEstimated flag is set (meaning user clicked Estimate Speed before)
    if (projectedDemandState.speedEstimated) {
      setShowTable(true);
    }
  }, [projectedDemandState.speedEstimated]);

  // --- Helper Functions Moved Inside Component ---

  // Helper to convert table data to CSV string
  function arrayToCSV(headers, rows) {
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csvRows = [headers.map(escape).join(",")];
    for (const row of rows) {
      csvRows.push(row.map(escape).join(","));
    }
    return csvRows.join("\n");
  }

  // Submit data to backend - called by parent component during step navigation
  // eslint-disable-next-line no-unused-vars
  const handleNext = async () => {
    // Collect values using mapped city name
    const city =
      cityNameMapping[classificationState.city] ||
      classificationState.cityInput ||
      "";
    // Prefer penetrationState.projectedYear, fallback to classificationState.baseYear
    let year =
      penetrationState.projectedYear || classificationState.baseYear || "";
    const file = projectedDemandState.projectedTrafficVolumeFile || null;
    const headers = projectedDemandState.projectedTrafficVolumeHeaders || [];
    const data = projectedDemandState.projectedTrafficVolumeData || [];
    // Convert table to CSV string
    const csvString =
      headers.length && data.length ? arrayToCSV(headers, data) : "";
    // Store all in a variable
    const values = {
      city,
      year,
      file,
      csv: csvString,
    };
    // Print in console
    console.log("Projected Demand upload values:", {
      ...values,
      file: file ? file.name : null,
    });

    // Prepare FormData for backend
    const formData = new FormData();
    formData.append("city_name", city);
    formData.append("base_year", classificationState.baseYear || "");
    formData.append("vehicle_type", classificationState.vehicleType || "");
    formData.append("projected_year", year);

    // Add transaction_id from localStorage or default
    const storedTransactionId =
      localStorage.getItem("transaction_id") || "emission-analysis-2025";
    formData.append("transaction_id", storedTransactionId);

    if (file) formData.append("file_csv", file);
    if (csvString) formData.append("file_table", csvString);

    try {
      const res = await fetch("http://localhost:5003/upload/projected_traffic", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const respData = await res.json();
      console.log("Backend response:", respData);
      toast.success("Data uploaded successfully!");
      
      // Store transaction_id for later use
      if (respData.transaction_id) {
        localStorage.setItem("transaction_id", respData.transaction_id);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed: " + err.message);
    }
  };

  // --- File and Image Logic ---

  const loadSheet = (file, keyHeaders, keyData) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const wb = file.name.endsWith(".csv")
        ? XLSX.read(data, { type: "string" })
        : XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (parsed.length) {
        setProjectedDemandState({
          [keyHeaders]: parsed[0],
          [keyData]: parsed.slice(1),
          projectedTrafficVolumeFile: file,
        });
        
        // Print variable in console after upload using mapped city name
        const city =
          cityNameMapping[classificationState.city] ||
          classificationState.cityInput ||
          "";
        // Prefer penetrationState.projectedYear, fallback to classificationState.baseYear
        let year =
          penetrationState.projectedYear || classificationState.baseYear || "";
        const csvString = arrayToCSV(parsed[0], parsed.slice(1));
        const values = {
          city,
          year,
          file,
          csv: csvString,
        };
        console.log("Projected Demand upload values (after upload):", {
          ...values,
          file: file ? file.name : null,
        });
      } else {
        setProjectedDemandState({ 
          [keyHeaders]: [], 
          [keyData]: [],
          projectedTrafficVolumeFile: null,
        });
      }
    };
    
    file.name.endsWith(".csv")
      ? reader.readAsText(file)
      : reader.readAsBinaryString(file);
  };

  // Helper to map city to image file base name
  const cityToFile = {
    Atlanta: "Georgia",
    "Los Angeles": "California",
    Seattle: "Washington",
    NewYork: "Newyork",
    "New York": "Newyork",
    "LosAngeles": "California",
    Georgia: "Georgia",
    California: "California",
    Washington: "Washington",
  };

  const statesList = ["", "Atlanta", "Los Angeles", "Seattle", "NewYork"];
  
  // These images must be in src/assets/
  const cityImages = {
    Atlanta: Atlanta,
    "Los Angeles": LosAngeles,
    Seattle: Seattle,
    NewYork: NewYork,
  };

  // City name mapping to handle space differences
  const cityNameMapping = {
    LosAngeles: "Los Angeles",
    "Los Angeles": "Los Angeles",
    "los angeles": "Los Angeles",
    "losangeles": "Los Angeles",
    NewYork: "NewYork",
    "New York": "NewYork",
    "new york": "NewYork",
    "newyork": "NewYork",
    Atlanta: "Atlanta",
    "atlanta": "Atlanta",
    Seattle: "Seattle",
    "seattle": "Seattle",
  };

  const rawCityName = (classificationState.city || classificationState.cityInput || "").trim();
  // Normalize city name for mapping
  const mappedCity = cityNameMapping[rawCityName] || rawCityName;
  const year = penetrationState.projectedYear || classificationState.baseYear || "";
  let projectedImg = null;
  if (mappedCity && year) {
    // Always use cityToFile mapping for the filename
    const fileCity = cityToFile[mappedCity] || mappedCity;
    
    // This path is now correct because /ProjectionDemand is in your public folder
    const imgFile = `/ProjectionDemand/${year}_${fileCity}.png`;
    
    console.log('[ProjectedDemand] mappedCity:', mappedCity, 'fileCity:', fileCity, 'year:', year, 'imgFile:', imgFile);
    projectedImg = imgFile;
  }
  
  return (
    <div className="flex flex-row items-stretch gap-6 pl-6 pt-4">
      <div className="flex flex-col gap-6">
        <form className="flex items-end gap-4 p-4 rounded">
          <label className="flex items-center bg-blue-400 text-white font-semibold px-4 h-[32px] rounded cursor-pointer whitespace-nowrap gap-2">
            <span>Projected Demand</span>
            <CloudUpload className="w-5 h-5" />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) =>
                loadSheet(
                  e.target.files[0],
                  "projectedTrafficVolumeHeaders",
                  "projectedTrafficVolumeData"
                )
              }
              className="hidden"
            />
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Base Year</label>
            <input
              type="text"
              value={classificationState.baseYear || ""}
              readOnly
              className="border rounded px-2 py-1 w-20 h-[32px] bg-gray-200 text-gray-700"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Year</label>
            <select
              value={penetrationState.projectedYear || ""}
              onChange={e => {
                setPenetrationState({ projectedYear: e.target.value });
                // Reset showTable and speedEstimated when year changes
                setShowTable(false);
                setProjectedDemandState({ speedEstimated: false });
              }}
              className="border rounded px-2 py-1 w-24 h-[32px]"
            >
              <option value="">Select</option>
              {classificationState.baseYear &&
                Array.from({ length: 5 }, (_, i) => parseInt(classificationState.baseYear) + i + 1)
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
            </select>
          </div>


          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-medium text-gray-600">City</label>
            <div className="flex items-center gap-2">
              <select
                value={mappedCity}
                disabled
                className={`bg-gray-300 text-gray-600 rounded px-2 py-1 w-48 ${
                  theme === "dark" ? "border-gray-700" : "border-white"
                }`}
              >
                <option value="">City</option>
                {statesList.slice(1).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!penetrationState.projectedYear || !projectedDemandState.projectedTrafficVolumeData?.length}
                onClick={() => {
                  setShowTable(true);
                  // Mark that speed has been estimated
                  setProjectedDemandState({ speedEstimated: true });
                }}
              >
                Estimate Speed
              </button>
            </div>
          </div>
        </form>
        {/* Show data/results only after Estimate Speed is clicked AND speedEstimated flag is set */}
        {showTable && projectedDemandState.speedEstimated && projectedImg && (mappedCity && year) ? (
          <>
            <img
              src={projectedImg}
              alt={`${mappedCity} ${year} Projected Demand`}
              className="w-full max-h-[350px] object-contain rounded"
            />
            {/* This legend image must be in src/assets/TrafficLegend.jpg */}
            <div className="flex justify-center mt-2">
              <img
                src={TrafficLegend}
                alt="Traffic Volume Legend"
                className="h-12 object-contain"
                style={{ maxWidth: 400 }}
              />
            </div>
          </>
        ) : null}
        {showTable && projectedDemandState.speedEstimated && projectedDemandState.projectedTrafficVolumeData?.length > 0 ? (
          <div>
            <div className="bg-[#f7f7f9] text-[#222222] text-center box-border rounded font-semibold border border-solid border-[#cccccc]">
              <span>Projected Increase In Traffic Volumes</span>
            </div>
            <HotTable
              className="min-w-[60%] overflow-auto"
              style={{ minHeight: 500 }}
              data={projectedDemandState.projectedTrafficVolumeData}
              colHeaders={projectedDemandState.projectedTrafficVolumeHeaders}
              rowHeaders
              stretchH="all"
              licenseKey="non-commercial-and-evaluation"
              themeName={
                theme === "dark" ? "ht-theme-main-dark" : "ht-theme-main"
              }
              pagination={false}
              renderPagination={false}
              afterGetColHeader={(col, TH) => {
                TH.style.textAlign = 'left';
                TH.style.paddingLeft = '5px';
                TH.style.fontWeight = 'bold';
              }}
            />
          </div>
        ) : showTable && projectedDemandState.speedEstimated ? (
          <div className="min-w-[60%] flex items-center justify-center h-[500px] text-gray-500">
            No data available
          </div>
        ) : null}
        <TractParametersTable trafficState={trafficState} />
      </div>
      <div className="flex flex-col gap-6">
        {mappedCity && (
          <img
            src={cityImages[mappedCity]}
            alt={mappedCity}
            className="w-full h-[500px] object-contain rounded"
          />
        )}
      </div>
    </div>
  );
}

export default ProjectedDemand;