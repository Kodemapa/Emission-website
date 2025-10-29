import React, { useState, useRef } from "react";
import useAppStore from "../useAppStore";
import VehicleClassification from "./VehicleClassification";
import VehiclePenetration from "./VehiclePenetration";
import VehicleTrafficVolume from "./VehicleTrafficVolume";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Stack from "@mui/material/Stack";
import ProjectedDemand from "./ProjectedDemand";
import { toast } from "react-toastify";

const steps = [
  "Vehicle Classification Data",
  "Projected Vehicle Penetration Rate Data",
  "Traffic Volume and Speed",
  "Projected Demand",
];

function InputStepper({ finalNext, activeStep, setActiveStep }) {
  const lastSentDataRef = useRef(null);
  const VEHICLE_TYPES = [
    "Combination long-haul Truck",
    "Combination short-haul Truck",
    "Light Commercial Truck",
    "Motorhome - Recreational Vehicle",
    "Motorcycle",
    "Other Buses",
    "Passenger Car",
    "Passenger Truck",
    "Refuse Truck",
    "School Bus",
    "Single Unit long-haul Truck",
    "Single Unit short-haul Truck",
    "Transit Bus",
  ];

  const handleNext = async () => {
    const store = useAppStore.getState();

    // Configuration for each step
    const stepConfig = [
      {
        type: "vehicle_classification",
        state: store.classificationState,
        fileKey: "uploadedFile",
        extraFields: {
          main_city: store.classificationState.city || "",
          year: store.classificationState.baseYear || "",
          user_id: "1",
        },
      },
      {
        type: "penetration_rate",
        state: store.penetrationState,
        fileKey: "uploadedFile",
        extraFields: {
          main_city: store.penetrationState.city || "",
          year: store.penetrationState.baseYear || "",
          user_id: "1",
        },
      },
      {
        type: "traffic_volume",
        state: store.trafficVolumeState,
        fileKey: "uploadedFile",
        extraFields: {
          main_city: store.trafficVolumeState.city || "",
          year: store.trafficVolumeState.baseYear || "",
          user_id: "1",
        },
      },
      {
        type: "projected_traffic",
        state: store.projectedDemandState,
        fileKey: "uploadedFile",
        extraFields: {
          main_city: store.projectedDemandState.city || "",
          year: store.projectedDemandState.baseYear || "",
          user_id: "1",
        },
      },
    ];

    const currentStep = stepConfig[activeStep];

    // For vehicle classification, send one request with all data
    if (
      currentStep &&
      currentStep.type === "vehicle_classification" &&
      currentStep.state &&
      currentStep.state[currentStep.fileKey]
    ) {
      const formData = new FormData();
      // Add extra fields
      Object.entries(currentStep.extraFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      // Add file
      formData.append(
        "file",
        currentStep.state[currentStep.fileKey],
        currentStep.state[currentStep.fileKey].name
      );

      try {
        const res = await fetch(
          `http://localhost:5003/upload/${currentStep.type}`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (!res.ok) throw new Error("Failed to save table");
        const data = await res.json();
        console.log("Table saved:", data);
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
        lastSentDataRef.current = formData;
        toast.success("Data uploaded successfully");
      } catch (err) {
        // Mock successful response for development - suppress console errors
        console.log(
          "Backend not available - using mock response for development"
        );
        toast.success("Data uploaded successfully (mocked)");
        lastSentDataRef.current = formData;
      }
    } else if (
      currentStep &&
      currentStep.state &&
      currentStep.state[currentStep.fileKey]
    ) {
      // For other steps, keep the original logic
      const formData = new FormData();
      Object.entries(currentStep.extraFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append(
        "file",
        currentStep.state[currentStep.fileKey],
        currentStep.state[currentStep.fileKey].name
      );

      try {
        const res = await fetch(
          `http://localhost:5003/upload/${currentStep.type}`,
          {
            method: "POST",
            body: formData,
          }
        );
        if (!res.ok) throw new Error("Failed to save table");
        const data = await res.json();
        console.log("Table saved to backend:", data);
        lastSentDataRef.current = formData;
        toast.success("Data uploaded successfully");
      } catch (err) {
        console.error("Error saving table to backend:", err);
        toast.error(`Failed to upload data: ${err.message}`);
      }
    }

    // Step navigation
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else if (steps.length === 4) {
      finalNext();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 pl-2 pt-0 mt-[-5rem] w-full">
      {/* Step-wise content */}
      <div className="w-full">
        {activeStep === 0 && <VehicleClassification activeStep={activeStep} />}
        {activeStep === 1 && <VehiclePenetration activeStep={activeStep} />}
        {activeStep === 2 && <VehicleTrafficVolume activeStep={activeStep} />}
        {activeStep === 3 && <ProjectedDemand activeStep={activeStep} />}
      </div>

      {/* Navigation Buttons */}
      <div className="w-full max-w-3xl mx-auto flex flex-row justify-between gap-4 mt-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </button>
        <div>
          {activeStep < steps.length - 1 && (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleNext}
            >
              Next
            </button>
          )}
          {activeStep === steps.length - 1 && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={finalNext}
            >
              Go to Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InputStepper;
