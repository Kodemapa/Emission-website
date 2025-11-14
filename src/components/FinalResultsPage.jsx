import useAppStore from "../useAppStore";
import {
  getR1FuelImgUrl,
  getR1EmissionImgUrl,
  buildR1FileNameFromEmission,
  buildR1FileNameFromFuel,
} from "../utils/resultsOneAssets";
import {
  getR2FuelImgUrl,
  getR2EmissionImgUrl,
  buildR2FileNameFromEmission,
  buildR2FileNameFromFuel,
} from "../utils/resultsTwoAssets";
import { getR3EmissionImgUrl } from "../utils/resultsThirdAssets.js";
import gridData from "../assets/griddata1.png";
import Button from "@mui/material/Button";
import { useState } from "react";

const VEHICLE_TYPES = [
  "Combination Long-haul Truck",
  "Combination Short-haul Truck",
  "Light Commercial Truck",
  "Motorhome - Recreational Vehicle",
  "Motorcycle",
  "Other Buses",
  "Passenger Car",
  "Passenger Truck",
  "Refuse Truck",
  "School Bus",
  "Single Unit Long-haul Truck",
  "Single Unit Short-haul Truck",
  "Transit Bus",
];

function getRandomColor(idx) {
  const colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
    "#a55194",
    "#393b79",
    "#637939",
  ];
  return colors[idx % colors.length];
}

const FinalResultsPage = ({ resultsSelection, setResultsSelection }) => {
  const [dailyAnnualSelection, setDailyAnnualSelection] = useState('DAILY'); // Default to DAILY
  const ConsumptionAndEmissionState = useAppStore(
    (s) => s.ConsumptionAndEmission
  );
  const setConsumptionAndEmissionState = useAppStore(
    (s) => s.setConsumptionAndEmission
  );
  const theme = useAppStore((s) => s.theme);
  const GridEmissionState = useAppStore((state) => state.GridEmission);
  const classificationState = useAppStore((state) => state.classificationState);
  // Use resultsSelection prop from ArrowStepper for Vehicle/Grid selection
  const FUEL_TYPES = [
    "CNG",
    "Diesel",
    "Electricity",
    "Ethanol",
    "Gasoline",
  ];
  const EMISSION_TYPES = [
    { label: "CO₂",value: 'CO2', unit: "g/mi" },
    { label: "NOₓ", value: 'NOx', unit: "g/mi" },
    { label: "PM2.5B", value: 'PM2.5B', unit: "g/mi" },
    { label: "PM2.5T", value: 'PM2.5T', unit: "g/mi" },
  ];
  const cityName = classificationState.city || classificationState.cityInput;
  const fuelType = ConsumptionAndEmissionState.FuelType || "";
  const emissionType = ConsumptionAndEmissionState.EmissionType || "";
  const fuelSrc = resultsSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ? getR1FuelImgUrl(fuelType, cityName) : getR2FuelImgUrl(fuelType, cityName);
  const emissionSrc = resultsSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ?  getR1EmissionImgUrl(emissionType, cityName) : getR2EmissionImgUrl(emissionType, cityName);
  const onDownload = async () => {
    const emission = GridEmissionState.EmissionType;
    const city = classificationState.cityInput;

    const fuelUrl = resultsSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ? getR1FuelImgUrl(fuelType, cityName) : getR2FuelImgUrl(fuelType, cityName);
    const emissionUrl = resultsSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ?  getR1EmissionImgUrl(emissionType, cityName) : getR2EmissionImgUrl(emissionType, cityName);
    if (!fuelUrl) {
      window.dispatchEvent(
        new CustomEvent("app-notification", { detail: { text: "Image not found for selected fuel/city" } })
      );
      return;
    }

    if (!emissionUrl) {
      window.dispatchEvent(
        new CustomEvent("app-notification", { detail: { text: "Image not found for selected emission/city" } })
      );
      return;
    }

    const filenameEmission = resultsSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ? buildR1FileNameFromEmission(
      emission,
      city,
      emissionUrl
    ) : buildR2FileNameFromEmission(emission,
      city,
      emissionUrl);
    const filenameFuel = resultsSelection === "VEHICLE" && dailyAnnualSelection === "DAILY"  ? buildR1FileNameFromFuel(fuelType, city, fuelUrl)
    : buildR2FileNameFromFuel(fuelType, city, fuelUrl);

    // Helper to download SVG as PNG
    async function downloadAsPng(url, filename) {
      return new Promise((resolve, reject) => {
        fetch(url)
          .then(res => res.text())
          .then(svgText => {
            const svg = new Blob([svgText], { type: 'image/svg+xml' });
            const urlObj = URL.createObjectURL(svg);
            const img = new window.Image();
            img.onload = function () {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename.replace(/\.svg$/i, '.png');
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(urlObj);
                resolve();
              }, 'image/png');
            };
            img.onerror = reject;
            img.src = urlObj;
          })
          .catch(reject);
      });
    }

    // Download logic: if SVG, convert to PNG, else download as is
    const downloadImage = async (url, filename) => {
      if (url.endsWith('.svg')) {
        await downloadAsPng(url, filename);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    };

    await downloadImage(fuelUrl, filenameFuel);
    await downloadImage(emissionUrl, filenameEmission);

    window.dispatchEvent(
      new CustomEvent("app-notification", { detail: { text: "Download started" } })
    );
  };
  return (
    <div className="flex flex-col gap-6">
      {/* Control Panel - All dropdowns in one row */}
      <div className="flex flex-row gap-4 justify-end items-end">
        <div className="flex flex-col gap-[2px]">
          <label className="text-xs font-medium text-gray-600">
            Vehicle / Grid
          </label>
          <select
            value={resultsSelection}
            onChange={(e) => {
              setResultsSelection(e.target.value);
            }}
            className="border rounded px-2 py-1 w-48"
          >
            <option value="">Select Vehicle/Grid</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="GRID">Grid</option>
          </select>
        </div>
       
  {resultsSelection !== "GRID" && (
          <div className="flex flex-col gap-[2px]"> 
            <label className="text-xs font-medium text-gray-600">
              Daily / Annual
            </label>
            <select
              value={dailyAnnualSelection}
              onChange={(e) => {
                setDailyAnnualSelection(e.target.value);
              }}
              className="border rounded px-2 py-1 w-48"
            >
              <option value="">Select Daily/Annual</option>
              <option value="DAILY">Daily</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
        )}

  {resultsSelection === "VEHICLE" && (
          <>
            <div className="flex flex-col gap-[2px]">
              <label className="text-xs font-medium text-gray-600">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => {
                  setConsumptionAndEmissionState({ FuelType: e.target.value });
                }}
                className="border rounded px-2 py-1 w-48"
              >
                <option value="">Select Fuel Type</option>
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[2px]">
              <label className="text-xs font-medium text-gray-600">
                Emission Type
              </label>
              <select
                value={emissionType}
                onChange={(e) => {
                  setConsumptionAndEmissionState({ EmissionType: e.target.value });
                }}
                className="border rounded px-2 py-1 w-48"
              >
                <option value="">Select Emission Type</option>
                {EMISSION_TYPES.map((et) => (
                  <option key={et.label} value={et.value} dangerouslySetInnerHTML={{ __html: et.label }} />
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-[2px]">
              <label className="text-xs font-medium text-gray-600">
                City
              </label>
              <select
                disabled
                className={`border rounded px-2 py-1 w-48 bg-gray-300 cursor-not-allowed ${
                  theme === "dark" ? "bg-[#18181b] text-white border-gray-700" : "text-gray-700 border-gray-400"
                }`}
              >
                <option>{classificationState.city || "City"}</option>
              </select>
            </div>
          </>
        )}

        <Button variant="contained" onClick={onDownload}>
          Download
        </Button>
      </div>

      {/* Content Area - Charts and Map */}
      <div className="flex flex-row gap-6">
  {resultsSelection === "VEHICLE" && (
          <>
            <div className="flex flex-col gap-8 flex-1">
              {fuelType && fuelSrc && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <img
                    src={fuelSrc}
                    className="max-w-[700px] w-full h-auto object-contain rounded"
                    alt="Fuel consumption chart"
                  />
                  <div style={{ fontWeight: 400, fontSize: 16, marginTop: -20, textAlign: 'center', width: 'auto' }}>
                    {fuelType} Consumption
                  </div>
                </div>
              )}
              {emissionType && emissionSrc && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <img
                    src={emissionSrc}
                    className="max-w-[700px] w-full h-auto object-contain rounded"
                    alt="Emission chart"
                  />
                  <div style={{ fontWeight: 400, fontSize: 16, marginTop: -20, textAlign: 'center', width: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: `${emissionType.replace('CO2', 'CO<sub>2</sub>').replace('NOx', 'NO<sub>x</sub>') } Emission` }}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4 flex-shrink-0 ml-auto">
              {/* Vehicle Types Legend */}
              <div
                style={{
                  minWidth: 240,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  padding: 12,
                  border: "1px solid rgba(0,0,0,0.45)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.88)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
              >
                <div
                  style={{ fontWeight: "bold", marginBottom: 6, fontSize: 16 }}
                >
                  Vehicle Types
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {VEHICLE_TYPES.map((type, idx) => (
                    <div
                      key={type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 1,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 20,
                          height: 2,
                          backgroundColor: getRandomColor(idx),
                          marginRight: 8,
                          borderRadius: 1,
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        
  {resultsSelection === "GRID" && (
           <div className="flex flex-row gap-6">
            <div className="flex flex-col gap-6 flex-1">
              <img
                src={getR3EmissionImgUrl("CO2", cityName)}
                className="max-w-[700px] w-full h-auto object-contain rounded"
                alt="CO2 Grid Emission"
              />
              <img
                src={getR3EmissionImgUrl("CH4", cityName)}
                className="max-w-[700px] w-full h-auto object-contain rounded"
                alt="CH4 Grid Emission"
              />
              <img
                src={getR3EmissionImgUrl("N2O", cityName)}
                className="max-w-[700px] w-full h-auto object-contain rounded"
                alt="N2O Grid Emission"
              />
            </div>
            <div className="flex flex-col gap-4 flex-shrink-0 ml-auto">
              <img
                src={gridData}
                alt="Grid Scenarios Legend"
                className="h-[320px] object-contain rounded border border-gray-100"
                style={{ maxWidth: '420px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalResultsPage;
