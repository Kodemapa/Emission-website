import React, { useMemo, useState, useEffect } from "react";
import useAppStore from "../useAppStore";
import Atlanta from "../assets/Georgia.svg";
import LosAngeles from "../assets/California.svg";
import Seattle from "../assets/Seattle.svg";
import NewYork from "../assets/NewYork.svg";
import VehicleStepper from "./VerticalStepper";
import { Button } from "@mui/material";
import { Line } from "react-chartjs-2";
import { toast } from "react-toastify";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

const FUEL_TYPES = [
  "Compressed Natural Gas - CNG",
  "Diesel Fuel",
  "Electricity",
  "Ethanol - E-85",
  "Gasoline",
];

const EMISSION_TYPES = [
  { label: "CO2 Emissions", unit: "g/mi" },
  { label: "Energy Rate", unit: "MWh/mile" },
  { label: "NOx", unit: "g/mi" },
  { label: "PM2.5 Brake Wear", unit: "g/mi" },
  { label: "PM2.5 Tire Wear", unit: "g/mi" },
];

function getRandomColor(idx) {
  // Generate visually distinct colors
  const colors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#a55194", "#393b79", "#637939"
  ];
  return colors[idx % colors.length];
}

export default function EnergyConsumptionAndEmissionRates({ activeStep }) {
  // Store slices
  const classificationState = useAppStore((s) => s.classificationState);
  const ConsumptionAndEmissionState = useAppStore((s) => s.ConsumptionAndEmission);
  const setConsumptionAndEmissionState = useAppStore((s) => s.setConsumptionAndEmission);

  // State for real chart data
  const [updateCounter, setUpdateCounter] = useState(0);
  const [consumptionUnit, setConsumptionUnit] = useState("units");
  const [emissionUnit, setEmissionUnit] = useState("units");

  // Remember last requested inputs so we only refetch datasets when the relevant input changes
  const [lastEmissionTypeRequested, setLastEmissionTypeRequested] = useState(null);
  const [lastFuelTypeRequested, setLastFuelTypeRequested] = useState(null);

  // State to hold all received vehicle data
  const [vehicleData, setVehicleData] = useState({});

  // Ref for potential direct chart manipulation (future use)
  // const chartRef = useRef(null);

  // State for chart data
  const [emissionChartData, setEmissionChartData] = useState({
    labels: [],
    datasets: [{
      label: "No Data Yet",
      data: [],
      borderColor: "#ccc",
      backgroundColor: "rgba(0,0,0,0)",
      tension: 0.3,
      pointRadius: 0,
    }],
  });
  const [consumptionChartData, setConsumptionChartData] = useState({
    labels: [],
    datasets: [{
      label: "No Data Yet", 
      data: [],
      borderColor: "#ccc",
      backgroundColor: "rgba(0,0,0,0)",
      tension: 0.3,
      pointRadius: 0,
    }],
  });
  // Emission chart axis helpers (previously computed; removed to use simple axis settings)

  // useEffect to update chart data when vehicleData changes
  useEffect(() => {
    const vehicleColorMap = VEHICLE_TYPES.reduce((acc, type, idx) => {
      acc[type] = getRandomColor(idx);
      return acc;
    }, {});

    const consumptionDatasets = [];
    const emissionDatasets = [];
    let consumptionUnitTemp = "units";
    let emissionUnitTemp = "units";

    Object.entries(vehicleData).forEach(([dataKey, data]) => {
        // Handle the nested data structure from your backend
        let actualData = data;
        let dataPoints = [];
        // Check if this is consumption data or emissions data
        if (dataKey.endsWith('_Consumption')) {
          // Handle consumption data - array of speed/consumption pairs
          if (data.results && Array.isArray(data.results)) {
            // Sort by speed to avoid straight lines between unsorted points
            dataPoints = data.results
              .map(r => ({ x: r.speed, y: r.consumption }))
              .sort((a, b) => a.x - b.x);
            // Get consumption unit from the stored data
            if (data.unit) {
              consumptionUnitTemp = data.unit;
            }
          } else {
            return; // Skip if no consumption data
          }
        } else {
          // Handle emissions data - check for nested "0" structure
          if (data && data["0"] && !data.results) {
            actualData = data["0"];
          }
          if (!actualData || !actualData.results) {
            return;
          }
          const results = actualData.results;
          dataPoints = results
            .map(r => ({ x: r.speed, y: r.prediction }))
            .sort((a, b) => a.x - b.x);
          // Get emission unit
          if (actualData.unit) {
            emissionUnitTemp = actualData.unit;
          }
        }

      // Extract vehicle type from the key (remove _Consumption or _Selected suffix)
      const vehicleType = dataKey.replace(/_Consumption$|_Selected$/, '');

      const newDataset = {
        label: vehicleType,
        data: dataPoints,
        borderColor: vehicleColorMap[vehicleType] || "#000",
        backgroundColor: "rgba(0,0,0,0)",
        tension: 0.3,
        pointRadius: 0,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        }
      };

      // Use prediction_type from backend or the stored emission type
      const predictionType = actualData.prediction_type || data.emissionType || "CO2 Emissions";

      // Separate data based on whether it's Fuel Consumption or the selected emission type
      if (predictionType === "Fuel Consumption" || dataKey.endsWith('_Consumption')) {
        consumptionDatasets.push(newDataset);
      } else {
        // All emission types go to the emission chart (right side)
        emissionDatasets.push(newDataset);
      }
    });

    // Update units separately
    setConsumptionUnit(consumptionUnitTemp);
    setEmissionUnit(emissionUnitTemp);

    // Handle empty data case
    if (consumptionDatasets.length === 0) {
      setConsumptionChartData({
        labels: [],
        datasets: [{
          label: "No Data Available",
          data: [],
          borderColor: "#ccc",
          backgroundColor: "rgba(0,0,0,0)",
          tension: 0.3,
          pointRadius: 0,
        }],
      });
    } else {
      setConsumptionChartData({
        labels: [], // Not needed for scatter plots
        datasets: consumptionDatasets,
      });
    }

    if (emissionDatasets.length === 0) {
      setEmissionChartData({
        labels: [],
        datasets: [{
          label: "No Data Available",
          data: [],
          borderColor: "#ccc", 
          backgroundColor: "rgba(0,0,0,0)",
          tension: 0.3,
          pointRadius: 0,
        }],
      });
    } else {
      setEmissionChartData({
        labels: [], // Not needed for scatter plots
        datasets: emissionDatasets,
      });
    }

    // Increment update counter to force chart re-render
    setUpdateCounter(prev => prev + 1);
  }, [vehicleData]);

  // UI lists & lookups
  const statesList = ["", "Atlanta", "Los Angeles", "Seattle", "NewYork"];
  const cityImages = { 
    "Atlanta": Atlanta, 
    "Los Angeles": LosAngeles, 
    "Seattle": Seattle, 
    "NewYork": NewYork 
  };

  // City name mapping to handle space differences
  const cityNameMapping = {
    "LosAngeles": "Los Angeles",
    "NewYork": "NewYork",
    "Atlanta": "Atlanta",
    "Seattle": "Seattle"
  };

  const steps = [
    "Vehicle Energy Consumption and Emission Rates",
    " Grid Emission Rates",
  ];

  const ageOptions = useMemo(() => Array.from({ length: 30 }, (_, i) => i + 1), []);

  // Controlled selections
  const fuelType = ConsumptionAndEmissionState.FuelType || "";
  const emissionType = ConsumptionAndEmissionState.EmissionType || "";
  const vehicleAge = ConsumptionAndEmissionState.VehicleAge || "";

  // Fix the city key selection logic with proper mapping
  const rawCityName = classificationState.city || classificationState.cityInput;
  const selectedCityName = cityNameMapping[rawCityName] || rawCityName;
  const selectedCityKey = selectedCityName;

  return (
    <div className="flex flex-row items-stretch gap-6 pl-6 pt-4">
      {/* Left: controls */}
      <div className="flex flex-col gap-6">
        <form className="flex items-end gap-4 p-4 rounded" onSubmit={(e) => e.preventDefault()}>
          {/* Fuel Type */}
          <select
            value={fuelType}
            onChange={(e) => {
              setConsumptionAndEmissionState({ FuelType: e.target.value });
            }}
            className="border rounded px-2 py-1 w-48"
          >
            <option value="">Select Fuel Type</option>
            {FUEL_TYPES.map((ft) => (
              <option key={ft} value={ft}>{ft}</option>
            ))}
          </select>

          {/* Emission Type */}
          <select
            value={emissionType}
            onChange={(e) => {
              setConsumptionAndEmissionState({ EmissionType: e.target.value });
            }}
            className="border rounded px-2 py-1 w-48"
          >
            <option value="">Select Emission Type</option>
            {EMISSION_TYPES.map((et) => (
              <option key={et.label} value={et.label}>{et.label}</option>
            ))}
          </select>

          {/* Vehicle Age */}
          <select
            value={vehicleAge}
            className="border rounded px-2 py-1 w-32"
            onChange={(e) => {
              setConsumptionAndEmissionState({ VehicleAge: e.target.value });
            }}
          >
            <option value="" disabled>
              Vehicle Age
            </option>
            {ageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          {/* City (disabled; chosen previously) */}
          <select
            value={selectedCityName}
            disabled
            className="border rounded px-2 py-1 w-40"
          >
            <option value="">City</option>
            {statesList.slice(1).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Button 
              variant="contained" 
              color="primary" 
              disabled={!fuelType || !emissionType || !vehicleAge}
              onClick={async() => {
                try {
                  // Decide whether to fetch consumption and/or emissions this run
                  const shouldFetchConsumption = fuelType !== lastFuelTypeRequested;
                  const shouldFetchEmissions = emissionType !== lastEmissionTypeRequested;

                  // Clear previous data but preserve datasets we are not refetching
                  setVehicleData(prev => {
                    const preserved = {};
                    if (!shouldFetchConsumption && prev) {
                      Object.entries(prev).forEach(([k, v]) => {
                        if (k.endsWith('_Consumption')) preserved[k] = v;
                      });
                    }
                    if (!shouldFetchEmissions && prev) {
                      Object.entries(prev).forEach(([k, v]) => {
                        if (k.endsWith('_Selected')) preserved[k] = v;
                      });
                    }
                    return preserved;
                  });
                  setUpdateCounter(0);

                  // For each vehicle type, make conditional calls
                  for (const vehicleType of VEHICLE_TYPES) {
                    // Fuel Consumption (left chart) - only when fuel changed
                    if (shouldFetchConsumption) {
                      const speeds = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75]; // Speed range
                      const consumptionDataPoints = [];
                      toast.info(`Fetching Fuel Consumption for ${vehicleType}...`);

                      for (const speed of speeds) {
                        const consumptionPayload = {
                          fuelType,
                          vehicleAge,
                          city: selectedCityName,
                          vehicleType,
                          speed
                        };

                        const consumptionRes = await fetch("http://127.0.0.1:5003/predict_consumption", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(consumptionPayload),
                        });
                        if (consumptionRes.ok) {
                          const consumptionData = await consumptionRes.json();
                          consumptionData.forEach(item => {
                            const consumptionValue = item.fuel_consumption !== null 
                              ? item.fuel_consumption 
                              : item.energy_consumption_mwh_mile;

                            consumptionDataPoints.push({
                              speed: item.speed,
                              consumption: consumptionValue,
                              unit: item.fuel_unit || item.energy_unit
                            });
                          });
                        }
                      }

                      setVehicleData(prev => ({
                        ...prev,
                        [`${vehicleType}_Consumption`]: {
                          results: consumptionDataPoints,
                          unit: consumptionDataPoints.length > 0 ? consumptionDataPoints[0].unit : "units",
                          emissionType: "Fuel Consumption",
                          selectedEmissionType: "Fuel Consumption",
                          timestamp: Date.now()
                        }
                      }));
                    }

                    // Emissions (right chart) - only when emission type changed
                    if (shouldFetchEmissions) {
                      toast.info(`Fetching ${emissionType} for ${vehicleType}...`);

                      const selectedRes = await fetch("http://127.0.0.1:5003/predict_emissions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          City: selectedCityName,
                          FuelType: fuelType,
                          VehicleType: vehicleType,
                          Age: parseInt(vehicleAge),
                          EmissionType: emissionType
                        }),
                      });

                      if (!selectedRes.ok) throw new Error(`${emissionType} prediction failed for ${vehicleType}`);

                      const selectedData = await selectedRes.json();
                      const transformedData = {
                        results: selectedData.map(item => ({ speed: item.Speed, prediction: item.PredictedValue })),
                        unit: selectedData[0]?.Unit || "gr/mile",
                        prediction_type: selectedData[0]?.EmissionType || emissionType
                      };

                      setVehicleData(prev => ({
                        ...prev,
                        [`${vehicleType}_Selected`]: {
                          ...transformedData,
                          emissionType: emissionType,
                          selectedEmissionType: emissionType,
                          timestamp: Date.now()
                        }
                      }));

                      toast.success(`Predictions received for ${vehicleType}!`);
                    }
                  }

                  // Update trackers
                  if (shouldFetchConsumption) setLastFuelTypeRequested(fuelType);
                  if (shouldFetchEmissions) setLastEmissionTypeRequested(emissionType);

                  toast.success("✅ All vehicle types processed successfully!");
                } catch (err) {
                  toast.error("Error contacting backend: " + err.message);
                }
              }}
            >
              Predict & Plot
            </Button>
          </div>
        </form>

        {/* Two side-by-side charts as in your PDF */}
          <div className="mt-8 flex flex-row gap-8 justify-start">
          {/* Charts */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
            <div style={{ width: 420, height: 320, padding: 12, border: '1px solid rgba(0,0,0,0.45)', borderRadius: 8, background: 'rgba(255,255,255,0.88)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                <Line
                      key={`consumption-${updateCounter}`}
                      data={consumptionChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        parsing: {
                          xAxisKey: 'x',
                          yAxisKey: 'y'
                        },
                        scales: {
                          x: {
                            type: 'linear',
                            title: { display: true, text: "Speed (mph)" },
                          },
                          y: {
                            type: "linear",
                            display: true,
                            position: "left",
                            title: { display: true, text: `Fuel Consumption Rate (${consumptionUnit})` },
                            // Allow negative values by removing beginAtZero
                          },
                        },
                      }}
                    />
            </div>
            <div style={{ width: 420, height: 320, padding: 12, border: '1px solid rgba(0,0,0,0.45)', borderRadius: 8, background: 'rgba(255,255,255,0.88)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
              <Line
                key={`emission-${updateCounter}`}
                data={emissionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  parsing: {
                    xAxisKey: 'x',
                    yAxisKey: 'y'
                  },
                  scales: {
                    x: {
                      type: 'linear',
                      title: { display: true, text: "Speed (mph)" },
                      min: 0,
                      max: 70,
                      ticks: {
                        stepSize: 10
                      },
                    },
                    y: {
                      type: "linear",
                      display: true,
                      position: "left",
                      title: { display: true, text: `${emissionType || 'Selected Emission Type'} (${emissionUnit})` },
                      // Ensure axis starts at 0 (simple settings to mirror consumption chart)
                      min: 0,
                      // Allow negative values by removing beginAtZero
                    },
                  },
                }}
              />
            </div>
            {/* Shared Legend on the side */}
            <div style={{ minWidth: 240, marginLeft: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: 12, border: '1px solid rgba(0,0,0,0.45)', borderRadius: 8, background: 'rgba(255,255,255,0.88)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 12, fontSize: 20 }}>Vehicle Types</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {VEHICLE_TYPES.map((type, idx) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 32,
                      height: 2,
                      backgroundColor: getRandomColor(idx),
                      marginRight: 14,
                      borderRadius: 1,
                    }} />
                    <span style={{ fontSize: 18, fontWeight: 500 }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: stepper + map image */}
      <div className="flex flex-col gap-6">
        <div className="ml-4">
          <VehicleStepper activeStep={activeStep} steps={steps} />
        </div>
        <div>
          {selectedCityKey && cityImages[selectedCityKey] && (
            <img
              src={cityImages[selectedCityKey]}
              alt={selectedCityName}
              className="w-full h-[500px] object-contain rounded"
            />
          )}
        </div>
      </div>
    </div>
  );
}