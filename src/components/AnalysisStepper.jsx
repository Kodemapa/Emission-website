import React, { useState } from "react";
import EnergyConsumptionAndEmissionRates from "./EnergyConsumptionAndEmissionRates";
import GridEmissionRates from "./GridEmissionRates";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Stack from "@mui/material/Stack";

const steps = [
  "Vehicle Energy Consumption and Emission Rates",
  " Grid Emission Rates",
];


import useAppStore from "../useAppStore";

function AnalysisStepper({ finalNext }) {
  const [activeStep, setActiveStep] = useState(0);

  // Get all user selections from Zustand
  const classificationState = useAppStore((s) => s.classificationState);
  const ConsumptionAndEmissionState = useAppStore((s) => s.ConsumptionAndEmission);

  // Combine all user selections into one variable
  const userSelections = {
    fuelType: ConsumptionAndEmissionState.FuelType,
    emissionType: ConsumptionAndEmissionState.EmissionType,
    vehicleAge: ConsumptionAndEmissionState.VehicleAge,
    city: classificationState.city || classificationState.cityInput,
  };

  const handleNext = () => {
    console.log("next button clicked");
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else if (steps.length == 2) {
      finalNext();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 pl-6 pt-4">
      {/* Step-wise content */}
      <div className="w-full">
        {activeStep === 0 && (
          <EnergyConsumptionAndEmissionRates activeStep={activeStep} userSelections={userSelections} />
        )}
        {activeStep === 1 && <GridEmissionRates activeStep={activeStep} />}
      </div>

      {/* Navigation Buttons */}
      <Stack direction="row" spacing={1}>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleBack}
        >
          Back
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleNext}
          disabled={activeStep === 1}
        >
          Next
        </button>
        {activeStep === 1 && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded ml-2"
            onClick={finalNext}
          >
            Go to Results
          </button>
        )}
      </Stack>
    </div>
  );
}

export default AnalysisStepper;
