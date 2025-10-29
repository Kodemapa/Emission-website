// VehicleStepper.jsx
import React from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepConnector, {
  stepConnectorClasses,
} from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import useAppStore from "../useAppStore";

// Connector colored per theme (vertical uses a left border)
const QontoConnector = styled(StepConnector, {
  shouldForwardProp: (prop) => prop !== "isDark",
})(
  ({ isDark }) => ({
    [`& .${stepConnectorClasses.line}`]: {
      borderLeftWidth: 2,
      borderLeftStyle: "solid",
      borderLeftColor: isDark ? "rgba(255,255,255,0.45)" : "#0a2f5c",
      minHeight: 0, // Remove extra space between circles
      marginLeft: 12, // Align line to center of icon (icon is 24px)
    },
    [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line},
      &.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
      borderLeftColor: isDark ? "rgba(255,255,255,0.8)" : "#0a2f5c",
    },
  })
);

// StepLabel with themed text color (works reliably in v5/v6)
const ThemedStepLabel = styled(StepLabel, {
  shouldForwardProp: (prop) => prop !== "isDark",
})(({ isDark }) => ({
  "& .MuiStepLabel-label": {
    color: isDark ? "#fff" : "#0a2f5c",
    fontWeight: 500,
  },
  "& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed": {
    color: isDark ? "#fff" : "#0a2f5c",
  },
  "& .MuiStepLabel-label.Mui-disabled": {
    color: isDark ? "rgba(255,255,255,0.6)" : "rgba(10,47,92,0.6)",
  },
}));

function VehicleStepper({ activeStep = 0, steps = [] }) {
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === "dark";

  const iconInactive = isDark ? "rgba(255,255,255,0.6)" : "#0a2f5c";

  // Calculate line height and offset so the line starts/ends at the center of the first/last icon
  const iconSize = 38;
  const stepCount = steps.length;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 'max-content', display: 'inline-block' }}>
        <Stepper
          key={theme}
          activeStep={activeStep}
          orientation="vertical"
          connector={<span />} // Remove MUI connector
          sx={{ alignItems: "flex-end", width: 'auto' }}
        >
          {steps.map((label, idx) => {
            const isActive = idx === activeStep;
            return (
              <div key={`${label}-${theme}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: iconSize }}>
                {/* Draw line only between icons, not above first or below last */}
                {idx < stepCount - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: iconSize / 2,
                    right: 12,
                    width: 2,
                    height: iconSize * 0.8,
                    background: isDark ? 'rgba(255,255,255,0.45)' : '#0a2f5c',
                    zIndex: 0,
                  }} />
                )}
                <ThemedStepLabel
                  isDark={isDark}
                  icon={<span style={{ display: 'none' }} />}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
                    <span style={{ textAlign: 'right', minWidth: 220 }}>{label}</span>
                    <span style={{ position: 'relative', zIndex: 2, background: 'white' }}>
                      {isActive ? (
                        // Completely filled dark circle for active (same size)
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="#0a2f5c" />
                        </svg>
                      ) : (
                        // Outlined circle for inactive
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke={iconInactive} strokeWidth="2" fill="none" />
                        </svg>
                      )}
                    </span>
                  </span>
                </ThemedStepLabel>
              </div>
            );
          })}
        </Stepper>
      </div>
    </div>
  );
}

export default VehicleStepper;
