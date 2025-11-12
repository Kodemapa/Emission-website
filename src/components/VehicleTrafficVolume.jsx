import React from "react";
import { CloudUpload } from "lucide-react";
import * as XLSX from "xlsx";
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
import AtlantaTF from "../assets/TrafficVolumeGA.png";
import LosAngelesTF from "../assets/TrafficVolumeCA.png";
import SeattleTF from "../assets/TrafficVolumeWA.png";
import NewYorkTF from "../assets/TrafficVolumeNY.png";
import TractParametersTable from "./TractParametersTable";
import { toast } from "react-toastify";   
import TrafficLegend from "../assets/TrafficLegend.jpg";
registerAllModules();

function VehicleTrafficVolume() {
  const classificationState = useAppStore((s) => s.classificationState);
  const trafficState = useAppStore((s) => s.trafficVolumeState);
  const setTrafficState = useAppStore((s) => s.setTrafficVolumeState);

  // Show data/results only after Estimate Speed is clicked
  const [showResults, setShowResults] = React.useState(false);
  const [trafficPlotImg, setTrafficPlotImg] = React.useState(null);

  // Auto-show results if speed was estimated before (e.g., when navigating back from next page)
  React.useEffect(() => {
    if (trafficState.speedEstimated) {
      setShowResults(true);
    }
  }, [trafficState.speedEstimated]);

  // Submit data to backend - called by parent component during step navigation
  // eslint-disable-next-line no-unused-vars
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
    formData.append("city_name", city);
    formData.append("base_year", classificationState.baseYear || "");
    formData.append("vehicle_type", classificationState.vehicleType || "");

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
  const cityImages = { 
    Atlanta, 
    "Los Angeles": LosAngeles, 
    LosAngeles, // Add this line to support 'LosAngeles' as a key
    Seattle, 
    NewYork 
  };
  const trafficVolumeImages = {
    Atlanta: AtlantaTF,
    "Los Angeles": LosAngelesTF,
    Seattle: SeattleTF,
    NewYork: NewYorkTF,
  };


  const loadSheet = (file, type) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target.result;
      const wb = file.name.endsWith(".csv")
        ? XLSX.read(data, { type: "string" })
        : XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (type === "trafficVolume") {
        if (parsed.length) {
          setTrafficState({
            trafficVolumeHeaders: parsed[0],
            trafficVolumeData: parsed.slice(1),
            trafficVolumeFile: file,
          });
        } else {
          setTrafficState({
            trafficVolumeHeaders: [],
            trafficVolumeData: [],
            trafficVolumeFile: file,
          });
        }
      } else if (type === "mftParameters") {
        if (parsed.length) {
          setTrafficState({
            trafficMFTParametersHeaders: parsed[0],
            trafficMFTParametersData: parsed.slice(1),
            trafficMFTParametersFile: file,
          });
        } else {
          setTrafficState({
            trafficMFTParametersHeaders: [],
            trafficMFTParametersData: [],
            trafficMFTParametersFile: file,
          });
        }
        // POST to /process/traffic after upload
        try {
          const city = (classificationState.city ?? classificationState.cityInput) || "";
          const year = classificationState.baseYear || "";
          const formData = new FormData();
          formData.append("city_name", city);
          formData.append("year", year);
          formData.append("parameters_file", file);
          await fetch("http://127.0.0.1:5003/process/traffic", {
            method: "POST",
            body: formData,
          });
          // Image logic: fetch traffic plot image from backend
          try {
            if (!city || !year) return;
            const url = `http://127.0.0.1:5003/plot/traffic/${encodeURIComponent(city)}/${encodeURIComponent(year)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch traffic plot image");
            const blob = await res.blob();
            const imgUrl = URL.createObjectURL(blob);
            setTrafficPlotImg(imgUrl);
          } catch (err) {
            setTrafficPlotImg(null);
            toast.error("Failed to load traffic plot image");
          }
        } catch (err) {
          toast.error("MFD parameters processing failed");
        }
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

  const city = (classificationState.city ?? classificationState.cityInput) || "";
  // Normalize city key for image lookup
  let key = city.trim();
  if (key.toLowerCase() === "los angeles") key = "Los Angeles";
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
            <span className="mr-2">Traffic Volume</span>
            <CloudUpload className="ml-2 w-5 h-5" />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => loadSheet(e.target.files[0], 'trafficVolume')}
              className="hidden"
            />
          </label>
          <label className="flex items-center bg-blue-400 text-white font-semibold px-4 rounded cursor-pointer h-10 w-48 whitespace-nowrap justify-center ml-4">
            <span className="mr-2 ml-2">MFD Parameters</span>
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
            className="px-6 py-2 bg-blue-500 text-white rounded font-semibold h-10 min-w-[140px] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={async () => {
              setShowResults(true);
              setTrafficState({ speedEstimated: true });
              // Fetch traffic plot image from backend
              try {
                const city = (classificationState.city ?? classificationState.cityInput) || "";
                const year = classificationState.baseYear || "";
                if (!city || !year) return;
                const url = `http://127.0.0.1:5003/plot/traffic/${encodeURIComponent(city)}/${encodeURIComponent(year)}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch traffic plot image");
                const blob = await res.blob();
                const imgUrl = URL.createObjectURL(blob);
                setTrafficPlotImg(imgUrl);
              } catch (err) {
                setTrafficPlotImg(null);
                toast.error("Failed to load traffic plot image");
              }
            }}
            disabled={!(hasTrafficVolumeData && hasMFTParametersData)}
          >
            Estimate Speed
          </button>
        </form>

        {/* Show data/results only after Estimate Speed is clicked AND speedEstimated flag is set */}
        {showResults && trafficState.speedEstimated && (
          <>
            {trafficPlotImg ? (
              <img
                src={trafficPlotImg}
                alt="Traffic Plot"
                className="w-full max-h-[350px] object-contain rounded"
              />
            ) : srcImg ? (
              <img
                src={srcImg}
                alt={city}
                className="w-full max-h-[350px] object-contain rounded"
              />
            ) : null}
            {/* Traffic Legend Image: only show when trafficPlotImg is visible */}
            {trafficPlotImg && (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <img
                  src={TrafficLegend}
                  alt="Traffic Legend"
                  className="max-w-[350px] object-contain rounded mt-4"
                  style={{ display: 'block' }}
                />
              </div>
            )}
            {/* Show MFD Parameters Table only */}
            {hasMFTParametersData && (
              <div style={{margin:0,padding:0}}>
                <div className="bg-[#f7f7f9] text-[#222222] text-center box-border font-semibold border border-solid border-[#cccccc] rounded-none" style={{borderRadius:0}}>
                  <span>Macroscopic Traffic Model Parameters</span>
                </div>
                <TractParametersTable trafficState={trafficState} />
              </div>
            )}
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

// Export handleNext for parent component to call when navigating to next step
VehicleTrafficVolume.handleNext = function(classificationState, trafficState) {
  return (async () => {
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
    formData.append("city_name", city);
    formData.append("base_year", classificationState.baseYear || "");
    formData.append("vehicle_type", classificationState.vehicleType || "");

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
  })();
};

export default VehicleTrafficVolume;
