
import React from "react";
import { CloudUpload } from "lucide-react";
import * as XLSX from "xlsx";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import "handsontable/styles/ht-theme-horizon.css";
import Atlanta from "../assets/Georgia.svg";
import LosAngeles from "../assets/California.svg";
import Seattle from "../assets/Seattle.svg";
import NewYork from "../assets/NewYork.svg";
import VehicleStepper from "./VerticalStepper";
import useAppStore from "../useAppStore";
import { toast } from "react-toastify";


function VehicleClassification({ activeStep }) {
  const theme = useAppStore((s) => s.theme);
  const classificationState = useAppStore((s) => s.classificationState);
  const setClassificationState = useAppStore((s) => s.setClassificationState);
  const statesList = ["", "Atlanta", "Los Angeles", "Seattle", "NewYork"];
  const cityImages = { Atlanta, LosAngeles, Seattle, NewYork };
  const verticalSteps = [
    "Vehicle Classification Data",
    "Projected Vehicle Penetration Rate Data",
    "Traffic Volume and Speed",
    "Projected Demand",
  ];

  // Pagination state and handlers
  const [currentPage, setCurrentPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const totalRows = classificationState.classificationData?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const paginatedData = React.useMemo(() => {
    if (!classificationState.classificationData) return [];
    const start = currentPage * rowsPerPage;
    return classificationState.classificationData.slice(start, start + rowsPerPage);
  }, [classificationState.classificationData, currentPage, rowsPerPage]);

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(0);
  };

  const handlePaginationNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handleBack = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  // ✅ Send data to backend on Next
  const handleNext = async () => {
    const payload = {
      base_year: classificationState.baseYear,
      city: classificationState.city,
      classification_table_data: classificationState.allClassificationData,
      classification_table_headers: classificationState.classificationHeaders,
      vehicle_type: classificationState.vehicleType,
    };

    try {
      const res = await fetch(
        "http://localhost:5003/upload/vehicle_classification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      console.log("Backend response:", data);

      // ✅ Save transaction_id to both localStorage and Zustand state
      if (data.transaction_id && data.transaction_id !== "none") {
        localStorage.setItem("transaction_id", data.transaction_id);
        console.log("Transaction ID stored:", data.transaction_id);
        setClassificationState({ transactionId: data.transaction_id });
      } else {
        console.warn(
          "Transaction ID is missing or invalid:",
          data.transaction_id
        );
        toast.error(
          "Transaction ID not received from backend. Please try again."
        );
      }

      toast.success("Data uploaded successfully!");
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    }
  };
  const filterByVehicle = React.useCallback((rows, vehicleType) => {
    if (!rows || rows.length === 0) return [];
    if (!vehicleType) return rows;
    const filtered = rows.filter(
      (row) =>
        row?.[0]?.toString().trim().toLowerCase() ===
        vehicleType.toString().trim().toLowerCase()
    );
    return filtered.length > 0 ? filtered : rows;
  }, []);

  // Always derive filtered table data from original data
  React.useEffect(() => {
    const next = filterByVehicle(
      classificationState.allClassificationData,
      classificationState.vehicleType
    );
    setClassificationState({ classificationData: next });
  }, [
    classificationState.vehicleType,
    classificationState.city,
    classificationState.allClassificationData,
    filterByVehicle,
    setClassificationState,
  ]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
    if (!file) return;

    // Save the uploaded file in state
    setClassificationState({ classificationFile: file, uploadedFile: file });

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const isCSV = file.name.toLowerCase().endsWith(".csv");
      const workbook = XLSX.read(data, { type: isCSV ? "string" : "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) || [];

      if (parsed.length > 0) {
        const headers = parsed[0];
        const rows = parsed.slice(1);

        let isNewData = true;
        const prevRows = classificationState.allClassificationData;
        if (prevRows && prevRows.length > 0) {
          isNewData = JSON.stringify(prevRows) !== JSON.stringify(rows);
        }
        console.log(
          isNewData
            ? "New data uploaded."
            : "Existing data uploaded (no change)."
        );

        setClassificationState({
          ...classificationState,
          classificationHeaders: headers,
          allClassificationData: rows,
        });
      } else {
        setClassificationState({
          classificationHeaders: [],
          allClassificationData: [],
          classificationData: [],
        });
      }
    };

    if (file.name.toLowerCase().endsWith(".csv")) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 pt-4 transition-colors duration-300 w-full max-w-full justify-center">
      {/* Left panel: form + table */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          <form className="flex flex-col gap-2 md:gap-4 p-2 md:p-4 rounded transition-colors duration-300 w-full min-w-0 overflow-x-auto">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full">
              {/* Base Year */}
              <div className="flex flex-col gap-1 min-w-[80px] max-w-[100px] w-auto">
                <label className="text-xs font-medium text-gray-600">
                  Base Year
                </label>
                <select
                  value={classificationState.baseYear}
                  onChange={(e) =>
                    setClassificationState({ baseYear: e.target.value })
                  }
                  className={`border rounded px-2 py-1 w-full h-[32px] transition-colors duration-300 ${
                    theme === "dark"
                      ? "bg-[#18181b] text-white border-gray-700"
                      : "bg-white text-black border-gray-300"
                  }`}
                  disabled={classificationState.city === ""}
                >
                  <option value="">Year</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              </div>
              {/* Vehicle Type */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs font-medium text-gray-600">
                  Vehicle Type
                </label>
                <select
                  value={classificationState.vehicleType}
                  onChange={(e) =>
                    setClassificationState({ vehicleType: e.target.value })
                  }
                  disabled={classificationState.city === ""}
                  className={`border rounded px-2 py-1 w-full transition-colors duration-300 ${
                    theme === "dark"
                      ? "bg-[#18181b] text-white border-gray-700"
                      : "bg-white text-black border-gray-300"
                  }`}
                >
                  <option value="">Vehicle Type</option>
                  <option value="Combination long-haul Truck">
                    Combination long-haul Truck
                  </option>
                  <option value="Combination short-haul Truck">
                    Combination short-haul Truck
                  </option>
                  <option value="Light Commercial Truck">
                    Light Commercial Truck
                  </option>
                  <option value="Motorhome - Recreational Vehicle">
                    Motorhome - Recreational Vehicle
                  </option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Other Buses">Other Buses</option>
                  <option value="Passenger Truck">Passenger Truck</option>
                  <option value="Refuse Truck">Refuse Truck</option>
                  <option value="School Bus">School Bus</option>
                  <option value="Single Unit long-haul Truck">
                    Single Unit long-haul Truck
                  </option>
                  <option value="Single Unit short-haul Truck">
                    Single Unit short-haul Truck
                  </option>
                  <option value="Transit Bus">Transit Bus</option>
                </select>
              </div>
              {/* City */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label className="text-xs font-medium text-gray-600">City</label>
                <select
                  value={classificationState.cityInput}
                  onChange={(e) =>
                    setClassificationState({
                      cityInput: e.target.value,
                      city: e.target.value.replace(/\s+/g, ""),
                    })
                  }
                  className={`border rounded px-2 py-1 w-full transition-colors duration-300 ${
                    theme === "dark"
                      ? "bg-[#18181b] text-white border-gray-700"
                      : "bg-white text-black border-gray-300"
                  }`}
                >
                  <option value="">City</option>
                  {statesList.slice(1).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Upload Vehicle Classification button below City, right-aligned and smaller */}
            <div className="flex w-full justify-end mt-2">
              <label
                className={`flex items-center font-semibold px-3 py-1.5 rounded cursor-pointer h-[36px] text-sm transition-colors duration-300 whitespace-nowrap w-full max-w-[300px]
                  ${theme === "dark" ? "bg-blue-900 text-white" : "bg-blue-400 text-white"}`}
                style={{ minWidth: 0 }}
              >
                <span className="flex items-center gap-2 w-full justify-center">
                  Upload Vehicle Classification
                  <CloudUpload className="w-4 h-4" />
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  disabled={classificationState.city === ""}
                  className="hidden"
                />
              </label>
            </div>
          </form>

        {/* Handsontable */}
        {classificationState.classificationData?.length > 0 ? (
          <div className="flex-1 w-full min-w-0 overflow-auto" style={{ minHeight: 320, maxHeight: 480 }}>
            <div className="flex items-center justify-end mb-2">
              <label className="mr-2 font-semibold">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="border rounded px-2 py-1"
                style={{ width: 80 }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <HotTable
              data={paginatedData}
              colHeaders={classificationState.classificationHeaders}
              rowHeaders
              stretchH="all"
              height={350}
              width="100%"
              licenseKey="non-commercial-and-evaluation"
              themeName={
                theme === "dark" ? "ht-theme-main-dark" : "ht-theme-main"
              }
            />
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 mt-4">
              <button
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                onClick={handleBack}
                disabled={currentPage === 0}
                type="button"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <span className="px-2 py-2 font-semibold">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={handlePaginationNext}
                disabled={currentPage >= totalPages - 1}
                type="button"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 w-full min-w-0 overflow-auto">
            {/* placeholder */}
          </div>
        )}
        </div>
      </div>

      {/* Right panel: only map image if available */}
      <div className="flex flex-col gap-6 justify-center items-center w-full md:w-[300px] max-w-[400px] mx-auto md:mx-0">
        {classificationState.city && cityImages[classificationState.city] && (
          <img
            src={cityImages[classificationState.city]}
            alt={classificationState.city}
            className="w-full max-h-[300px] md:max-h-[500px] object-contain rounded"
          />
        )}
      </div>
    </div>
  );
}

export default VehicleClassification;
