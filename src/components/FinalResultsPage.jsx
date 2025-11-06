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
import gridData from "../assets/image.png";
import { toast } from "react-toastify";
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

const FinalResultsPage = () => {
  const ConsumptionAndEmissionState = useAppStore(
    (s) => s.ConsumptionAndEmission
  );
  const setConsumptionAndEmissionState = useAppStore(
    (s) => s.setConsumptionAndEmission
  );
  const theme = useAppStore((s) => s.theme);
  const GridEmissionState = useAppStore((state) => state.GridEmission);
  const classificationState = useAppStore((state) => state.classificationState);
  const [vehicleGridSelection, setVehicleGridSelection] = useState('')
  const [dailyAnnualSelection, setDailyAnnualSelection] = useState('DAILY') // Default to DAILY
  const FUEL_TYPES = [
    "CNG",
    "Diesel",
    "Electricity",
    "Ethanol",
    "Gasoline",
  ];
  const EMISSION_TYPES = [
    { label: "CO2", unit: "g/mi" },
    { label: "NOx", unit: "g/mi" },
    { label: "PM2.5B", unit: "g/mi" },
    { label: "PM2.5T", unit: "g/mi" },
  ];
  const cityName = classificationState.city || classificationState.cityInput;
  const fuelType = ConsumptionAndEmissionState.FuelType || "";
  const emissionType = ConsumptionAndEmissionState.EmissionType || "";
  const fuelSrc = vehicleGridSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ? getR1FuelImgUrl(fuelType, cityName) : getR2FuelImgUrl(fuelType, cityName);
  const emissionSrc = vehicleGridSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ?  getR1EmissionImgUrl(emissionType, cityName) : getR2EmissionImgUrl(emissionType, cityName);
  const onDownload = () => {
    const emission = GridEmissionState.EmissionType;
    const city = classificationState.cityInput;

    const fuelUrl = vehicleGridSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ? getR1FuelImgUrl(fuelType, cityName) : getR2FuelImgUrl(fuelType, cityName);
    const emissionUrl = vehicleGridSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ?  getR1EmissionImgUrl(emissionType, cityName) : getR2EmissionImgUrl(emissionType, cityName);
    if (!fuelUrl) {
      toast.error("Image not found for selected fuel/city");
      return;
    }

    if (!emissionUrl) {
      toast.error("Image not found for selected emission/city");
      return;
    }

    const filenameEmission = vehicleGridSelection === "VEHICLE" && dailyAnnualSelection === "DAILY" ? buildR1FileNameFromEmission(
      emission,
      city,
      emissionUrl
    ) : buildR2FileNameFromEmission(emission,
      city,
      emissionUrl);
    const filenameFuel = vehicleGridSelection === "VEHICLE" && dailyAnnualSelection === "DAILY"  ? buildR1FileNameFromFuel(fuelType, city, fuelUrl)
    : buildR2FileNameFromFuel(fuelType, city, fuelUrl);

    // trigger download
    const aFuel = document.createElement("a");
    aFuel.href = fuelUrl;
    aFuel.download = filenameFuel;
    document.body.appendChild(aFuel);
    aFuel.click();
    aFuel.remove();

    const aEmission = document.createElement("a");
    aEmission.href = emissionUrl;
    aEmission.download = filenameEmission;
    document.body.appendChild(aEmission);
    aEmission.click();
    aEmission.remove();

    toast.success("Download started");
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
            value={vehicleGridSelection}
            onChange={(e) => {
              setVehicleGridSelection(e.target.value);
            }}
            className="border rounded px-2 py-1 w-48"
          >
            <option value="">Select Vehicle/Grid</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="GRID">Grid</option>
          </select>
        </div>
       
        {vehicleGridSelection !== "GRID" && (
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

        {vehicleGridSelection === "VEHICLE" && (
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
                  <option key={et.label} value={et.label}>
                    {et.label}
                  </option>
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
        {vehicleGridSelection === "VEHICLE" && (
          <>
            <div className="flex flex-col gap-8 flex-1">
              {fuelType && fuelSrc && (
                <img
                  src={fuelSrc}
                  className="max-w-[700px] w-full h-auto object-contain rounded"
                  alt="Fuel consumption chart"
                />
              )}
              {emissionType && emissionSrc && (
                <img
                  src={emissionSrc}
                  className="max-w-[700px] w-full h-auto object-contain rounded"
                  alt="Emission chart"
                />
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
        
        {vehicleGridSelection === "GRID" && (
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
                className="h-[200px] object-contain rounded border border-gray-100"
                style={{ maxWidth: '300px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalResultsPage;
