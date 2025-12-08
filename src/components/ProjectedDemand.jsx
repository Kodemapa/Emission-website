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

// --- Reusable Zoom Toolbar Component ---
const ZoomToolbar = ({ onZoomIn, onZoomOut, onReset }) => (
  <div className="absolute top-4 right-4 z-10 flex bg-white rounded border border-gray-300 shadow-sm overflow-hidden select-none">
    <button
      onClick={onZoomIn}
      className="px-3 py-1 text-blue-600 hover:bg-gray-50 border-r border-gray-200 text-lg font-bold leading-none transition-colors"
      title="Zoom In"
      type="button"
    >
      +
    </button>
    <button
      onClick={onZoomOut}
      className="px-3 py-1 text-blue-600 hover:bg-gray-50 border-r border-gray-200 text-lg font-bold leading-none transition-colors"
      title="Zoom Out"
      type="button"
    >
      -
    </button>
    <button
      onClick={onReset}
      className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-gray-50 uppercase tracking-wide transition-colors"
      title="Reset Zoom"
      type="button"
    >
      RESET
    </button>
  </div>
);

function ProjectedDemand() {
  const [showTable, setShowTable] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  
  const theme = useAppStore((s) => s.theme);
  const classificationState = useAppStore((s) => s.classificationState);
  const penetrationState = useAppStore((s) => s.penetrationState);
  const setPenetrationState = useAppStore((s) => s.setPenetrationState);
  const projectedDemandState = useAppStore((s) => s.projectedDemandState);
  const setProjectedDemandState = useAppStore((s) => s.setProjectedDemandState);
  const trafficState = useAppStore((s) => s.trafficVolumeState);

  // Auto-show table if speed was estimated before
  useEffect(() => {
    if (projectedDemandState.speedEstimated) {
      setShowTable(true);
    }
  }, [projectedDemandState.speedEstimated]);

  // Reset zoom when the image (year/city) changes
  useEffect(() => {
    setImageZoom(1);
  }, [penetrationState.projectedYear, classificationState.city]);

  // Zoom Handlers
  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + 0.25, 3.5)); // Max zoom 3.5x
  const handleZoomOut = () => setImageZoom((prev) => Math.max(prev - 0.25, 1)); // Min zoom 1x
  const handleResetZoom = () => setImageZoom(1);

  // Helper to convert table data to CSV string
  function arrayToCSV(headers, rows) {
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csvRows = [headers.map(escape).join(",")];
    for (const row of rows) {
      csvRows.push(row.map(escape).join(","));
    }
    return csvRows.join("\n");
  }

  // File Upload Logic
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
      } else {
        setProjectedDemandState({ 
          [keyHeaders]: [], 
          [keyData]: [],
          projectedTrafficVolumeFile: null,
        });
      }
    };
    file.name.endsWith(".csv") ? reader.readAsText(file) : reader.readAsBinaryString(file);
  };

  const cityToFile = {
    Atlanta: "GA", "Los Angeles": "CA", Seattle: "WA", NewYork: "NY",
    "New York": "Newyork", "LosAngeles": "California", Georgia: "Georgia",
    California: "California", Washington: "Washington",
  };

  const statesList = ["", "Atlanta", "Los Angeles", "Seattle", "NewYork"];
  
  const cityImages = {
    Atlanta: Atlanta, "Los Angeles": LosAngeles, Seattle: Seattle, NewYork: NewYork,
  };

  const cityNameMapping = {
    LosAngeles: "Los Angeles", "Los Angeles": "Los Angeles", "los angeles": "Los Angeles", "losangeles": "Los Angeles",
    NewYork: "NewYork", "New York": "NewYork", "new york": "NewYork", "newyork": "NewYork",
    Atlanta: "Atlanta", "atlanta": "Atlanta",
    Seattle: "Seattle", "seattle": "Seattle",
  };

  const rawCityName = (classificationState.city || classificationState.cityInput || "").trim();
  const mappedCity = cityNameMapping[rawCityName] || rawCityName;
  const year = penetrationState.projectedYear || classificationState.baseYear || "";
  let projectedImg = null;
  if (mappedCity && year) {
    const fileCity = cityToFile[mappedCity] || mappedCity;
    const imgFile = `/projected-demand-images/${fileCity}_${year}.png`;
    projectedImg = imgFile;
  }
  
  // Construct Title for the Card
  const cardTitle = year ? `Year ${year}` : "Projected Demand";

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
                loadSheet(e.target.files[0], "projectedTrafficVolumeHeaders", "projectedTrafficVolumeData")
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
                  setProjectedDemandState({ speedEstimated: true });
                }}
              >
                Estimate Speed
              </button>
            </div>
          </div>
        </form>

        {/* --- Image Display with 950px Width --- */}
        {showTable && projectedDemandState.speedEstimated && projectedImg && (mappedCity && year) ? (
          <div className="flex flex-col gap-2 max-w-[950px]">
            {/* Image Container Card */}
            <div className="relative w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm group">
              
              {/* Title Section Inside Card */}
              <div className="pt-4 pb-2 text-center">
              </div>

              {/* Scrollable Area */}
              <div className="w-full h-[400px] overflow-auto bg-gray-50">
                <img
                  src={projectedImg}
                  alt={`${mappedCity} ${year} Projected Demand`}
                  className="transition-all duration-200 ease-out origin-top-left max-w-none mx-auto"
                  style={{ 
                    width: `${imageZoom * 100}%`,
                    height: 'auto',
                    // Removed minWidth/minHeight to allow natural image size to center if small, 
                    // or scroll if zoomed.
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Zoom Controls Positioned Top-Right of Card */}
              <ZoomToolbar 
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onReset={handleResetZoom}
              />
            </div>

            {/* Legend Image */}
            <div className="flex justify-center mt-2">
              <img
                src={TrafficLegend}
                alt="Traffic Volume Legend"
                className="h-20 object-contain"
                style={{ maxWidth: 600 }}
              />
            </div>
          </div>
        ) : null}

        {/* --- Table with Width 950px --- */}
        {showTable && projectedDemandState.speedEstimated && projectedDemandState.projectedTrafficVolumeData?.length > 0 ? (
          <div className="bg-[#f7f7f9] text-[#222222]" style={{ width: '950px', margin: '0 auto', overflowX: 'auto', overflowY: 'hidden' }}>
            <div style={{
              width: '950px',
              background: '#f7f7f9',
              border: '1px solid #cccccc',
              borderBottom: 'none',
              textAlign: 'center',
              fontSize: '1.15rem',
              color: '#222',
            }}>
              <span>Projected Increase In Traffic Volumes</span>
            </div>
            <div style={{ width: '950px', overflowX: 'auto', overflowY: 'hidden' }}>
              <HotTable
                className="overflow-auto"
                style={{ width: '950px', minHeight: 500, borderRadius: 0 }}
                data={projectedDemandState.projectedTrafficVolumeData}
                colHeaders={projectedDemandState.projectedTrafficVolumeHeaders}
                rowHeaders
                stretchH="all"
                licenseKey="non-commercial-and-evaluation"
                themeName={theme === "dark" ? "ht-theme-main-dark" : "ht-theme-main"}
                pagination={false}
                renderPagination={false}
                afterGetColHeader={(col, TH) => {
                  TH.style.textAlign = 'left';
                  TH.style.paddingLeft = '5px';
                  TH.style.fontWeight = 'bold';
                }}
              />
            </div>
          </div>
        ) : showTable && projectedDemandState.speedEstimated ? (
          <div className="min-w-[60%] flex items-center justify-center h-[500px] text-gray-500">
            No data available
          </div>
        ) : null}
        
        {/* Tract Table with Width 950px */}
        <div className="max-w-[950px]">
           <TractParametersTable trafficState={trafficState} />
        </div>
      </div>

      {/* Right Column: City Map */}
      <div className="flex flex-col gap-6 min-w-[400px]">
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