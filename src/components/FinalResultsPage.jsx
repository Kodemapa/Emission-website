import useAppStore from "../useAppStore";
import Atlanta from "../assets/Georgia.svg";
import LosAngeles from "../assets/California.svg";
import Seattle from "../assets/Seattle.svg";
import NewYork from "../assets/NewYork.svg";
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
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import { useState } from "react";
const FinalResultsPage = () => {
  const ConsumptionAndEmissionState = useAppStore(
    (s) => s.ConsumptionAndEmission
  );
  const setConsumptionAndEmissionState = useAppStore(
    (s) => s.setConsumptionAndEmission
  );
  const theme = useAppStore((s) => s.theme);
  const GridEmissionState = useAppStore((state) => state.GridEmission);
  const cityImages = { Atlanta, LosAngeles, Seattle, NewYork };
  const classificationState = useAppStore((state) => state.classificationState);
  const [vehicleGridSelection, setVehicleGridSelection] = useState('')
  const [dailyAnnualSelection, setDailyAnnualSelection] = useState('')
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
    <div className="flex flex-row  gap-6"> 
      {vehicleGridSelection === "VEHICLE" && <div className="flex flex-col items-end gap-8">
        <div className="flex flex-col items-end gap-4">
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
          <img
            src={fuelSrc}
            className="max-w-[700px] w-full h-auto object-contain rounded mx-auto"
          />
        </div>
        <div className="flex flex-col items-end gap-4">
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
          </select></div>
          <img
            src={emissionSrc}
            className="max-w-[700px] w-full h-auto object-contain rounded mx-auto"
          />
        </div>
      </div> }
      {vehicleGridSelection === "GRID" && <div className="flex flex-col gap-6">
        <img
            src={getR3EmissionImgUrl("CO2", cityName)}
            className="max-w-[700px] w-full h-auto object-contain rounded mx-auto"
          />
          <img
            src={getR3EmissionImgUrl("CH4", cityName)}
            className="max-w-[700px] w-full h-auto object-contain rounded mx-auto"
          />
          <img
            src={getR3EmissionImgUrl("N2O", cityName)}
            className="max-w-[700px] w-full h-auto object-contain rounded mx-auto"
          />
      </div> }
      {vehicleGridSelection === "VEHICLE" && <div className="flex flex-col gap-4 items-center">
        <div className="flex flex-col gap-[2px]">
        <label className="text-xs font-medium text-gray-600">
                  City
                </label>
        <select
            disabled
            className={`border rounded px-2 py-1 w-25 ${
              theme === "dark" ? "bg-[#18181b] text-white border-gray-700" : ""
            }`}
          >
            <option>{classificationState.city || "City"}</option>
          </select></div>
        <img
          src={cityImages[classificationState.city]}
          alt={classificationState.city}
          className="w-full h-[500px] object-contain rounded"
        />
      </div> }
      <div className="flex flex-col gap-[300px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-[2px]"> <label className="text-xs font-medium text-gray-600">
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
          </select></div>
       
          {vehicleGridSelection !== "GRID" && <div className="flex flex-col gap-[2px]"> 
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
          </select></div>}
        </div>
        <div>
          <Button variant="contained" onClick={onDownload}>
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinalResultsPage;
