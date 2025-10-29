import React from "react";
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
import VehicleStepper from "./VerticalStepper";
import AtlantaTF from "../assets/TrafficVolumeGA.png";
import LosAngelesTF from "../assets/TrafficVolumeCA.png";
import SeattleTF from "../assets/TrafficVolumeWA.png";
import NewYorkTF from "../assets/TrafficVolumeNY.png";
import TractParametersTable from "./TractParametersTable";
import { toast } from "react-toastify";
registerAllModules();

function VehicleTrafficVolume({ activeStep }) {
  const classificationState = useAppStore((s) => s.classificationState);
  const trafficState = useAppStore((s) => s.trafficVolumeState);
  const setTrafficState = useAppStore((s) => s.setTrafficVolumeState);
  const [calculatedSpeeds, setCalculatedSpeeds] = React.useState([]);
  // Show data/results only after Estimate Speed is clicked
  const [showResults, setShowResults] = React.useState(false);

  // Submit data to backend
  const handleNext = async () => {
    // Collect values
    const city =
      (classificationState.city ?? classificationState.cityInput) || "";
    const trafficVolumeFile = trafficState.trafficVolumeFile || null;
    const mftParametersFile = trafficState.trafficMFTParametersFile || null;
    const values = {
      city,
      trafficVolumeFile: trafficVolumeFile ? trafficVolumeFile.name : null,
      mftParametersFile: mftParametersFile ? mftParametersFile.name : null,
    };
    console.log("Traffic Volume and Speed upload values (on Next):", values);

    // Check if both files are selected
    if (!trafficVolumeFile || !mftParametersFile) {
      toast.error("Please select both Traffic Volume and MFT Parameters files");
      return;
    }

    // Prepare FormData for backend
    const formData = new FormData();
    formData.append("city_name", city); // Use city_name as expected by backend

    // Add transaction_id from localStorage or default
    const storedTransactionId =
      localStorage.getItem("transaction_id") || "emission-analysis-2025";
    formData.append("transaction_id", storedTransactionId);

    formData.append("file1", trafficVolumeFile);
    formData.append("file2", mftParametersFile);

    try {
      console.log("Uploading to /upload/traffic_volume...");
      const res = await fetch("http://localhost:5003/upload/traffic_volume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      console.log("Backend response:", data);
      toast.success("Traffic data uploaded successfully!");

      // Store transaction_id for later use
      if (data.transaction_id) {
        localStorage.setItem("transaction_id", data.transaction_id);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed: " + err.message);
    }
  };

  const statesList = ["", "Atlanta", "Los Angeles", "Seattle", "NewYork"];
  const cityImages = { Atlanta, LosAngeles, Seattle, NewYork };
  const trafficVolumeImages = {
    Atlanta: AtlantaTF,
    "Los Angeles": LosAngelesTF,
    Seattle: SeattleTF,
    NewYork: NewYorkTF,
  };


  const loadSheet = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const wb = file.name.endsWith(".csv")
        ? XLSX.read(data, { type: "string" })
        : XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (type === "trafficVolume") {
        if (parsed.length)
          setTrafficState({
            trafficVolumeHeaders: parsed[0],
            trafficVolumeData: parsed.slice(1),
            trafficVolumeFile: file,
          });
        else
          setTrafficState({
            trafficVolumeHeaders: [],
            trafficVolumeData: [],
            trafficVolumeFile: file,
          });
      } else if (type === "mftParameters") {
        if (parsed.length)
          setTrafficState({
            trafficMFTParametersHeaders: parsed[0],
            trafficMFTParametersData: parsed.slice(1),
            trafficMFTParametersFile: file,
          });
        else
          setTrafficState({
            trafficMFTParametersHeaders: [],
            trafficMFTParametersData: [],
            trafficMFTParametersFile: file,
          });
      }
      // Print variable in console after upload
      const city =
        (classificationState.city ?? classificationState.cityInput) || "";
      const trafficVolumeFile =
        type === "trafficVolume" ? file : trafficState.trafficVolumeFile;
      const mftParametersFile =
        type === "mftParameters" ? file : trafficState.trafficMFTParametersFile;
      const values = {
        city,
        trafficVolumeFile: trafficVolumeFile ? trafficVolumeFile.name : null,
        mftParametersFile: mftParametersFile ? mftParametersFile.name : null,
      };
      console.log(
        "Traffic Volume and Speed upload values (after upload):",
        values
      );
    };
    file.name.endsWith(".csv")
      ? reader.readAsText(file)
      : reader.readAsBinaryString(file);
  };

  // Calculate speed when user clicks the button
  /*const handleCalculateSpeed = () => {
    const data = trafficState.trafficMFTParametersData || [];
    const headers = trafficState.trafficMFTParametersHeaders || [];
    // Try to find columns for distance and time
    const distanceIdx = headers.findIndex(h => /distance/i.test(h));
    const timeIdx = headers.findIndex(h => /time/i.test(h));
    if (distanceIdx === -1 || timeIdx === -1) {
      toast.error("CSV must have 'distance' and 'time' columns.");
      return;
    }
    const speeds = data.map(row => {
      const distance = parseFloat(row[distanceIdx]);
      const time = parseFloat(row[timeIdx]);
      const speed = time > 0 ? (distance / time) : 0;
      return { distance, time, speed: speed.toFixed(2) };
    });
    setCalculatedSpeeds(speeds);
  };*/

  const city =
    (classificationState.city ?? classificationState.cityInput) || "";
  const key = city.trim();
  const srcImg = trafficVolumeImages[key];

  const hasTrafficVolumeData =
    trafficState.trafficVolumeData && trafficState.trafficVolumeData.length > 0;
  const hasMFTParametersData =
    trafficState.trafficMFTParametersData &&
    trafficState.trafficMFTParametersData.length > 0;

  return (
    <div className="flex flex-row items-stretch gap-6 pl-6 pt-4">
      <div className="flex flex-col gap-6">
        <form className="flex items-end gap-4 p-4 rounded">
          <label className="flex items-center bg-blue-400 text-white font-semibold px-4 rounded cursor-pointer h-10 w-48 whitespace-nowrap justify-center">
            <span className="mr-2">Upload Traffic Volume</span>
            <CloudUpload className="ml-2 w-5 h-5" />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => loadSheet(e.target.files[0], 'trafficVolume')}
              className="hidden"
            />
          </label>
          <label className="flex items-center bg-blue-400 text-white font-semibold px-4 rounded cursor-pointer h-10 w-48 whitespace-nowrap justify-center ml-4">
            <span className="mr-2 ml-2">Upload MFD Parameters</span>
            <CloudUpload className="ml-2 w-5 h-5" />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => loadSheet(e.target.files[0], 'mftParameters')}
              className="hidden"
            />
          </label>
          <div className="flex flex-col gap-1 items-center">
            <label className="text-xs font-medium text-gray-600">Base Year</label>
            <select
              value={classificationState.baseYear}
              disabled
              className="bg-gray-200 text-gray-600 rounded px-2 h-10 w-24 border border-gray-300 font-semibold text-base"
            >
              <option value="">Base Year</option>
              {classificationState.baseYear && (
                <option value={classificationState.baseYear}>{classificationState.baseYear}</option>
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <label className="text-xs font-medium text-gray-600">City</label>
            <select
              value={classificationState.cityInput}
              disabled
              className="bg-gray-200 text-gray-600 rounded px-2 h-10 w-32 border border-gray-300 font-semibold text-base"
            >
              <option value="">City</option>
              {statesList.slice(1).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="px-6 py-2 bg-blue-500 text-white rounded font-semibold h-10 min-w-[140px] hover:bg-blue-600"
            onClick={() => setShowResults(true)}
          >
            Estimate Speed
          </button>
        </form>

        {/* Show data/results only after Estimate Speed is clicked */}
        {showResults && (hasTrafficVolumeData || hasMFTParametersData) && (
          <>
            {srcImg ? (
              <img
                src={srcImg}
                alt={city}
                className="w-full max-h-[350px] ma object-contain rounded"
              />
            ) : null}
            {/* Show MFD Parameters Table only */}
            <TractParametersTable trafficState={trafficState} />
          </>
        )}
      </div>
      <div className="flex flex-col gap-6">
        {classificationState.city && (
          <img
            src={cityImages[classificationState.city]}
            alt={classificationState.city}
            className="w-full h-[500px] object-contain rounded"
          />
        )}
      </div>
    </div>
  );
}

export default VehicleTrafficVolume;
