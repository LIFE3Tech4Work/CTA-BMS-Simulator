/**
 * Free Explore Mode Scenarios (14 predefined BMS operating conditions)
 * 
 * Each scenario defines a starting row in the historical data, a description,
 * and optional point overrides that configure the simulator to demonstrate
 * specific operating conditions or fault states.
 * 
 * startRow maps to the 1,017-row dataset (May 1 – June 12, 2026, hourly)
 * Row 1 = May 1 00:00, Row 24 = May 1 23:00, Row 25 = May 2 00:00, etc.
 * 
 * Validates: Requirements 21.3
 */

export const Scenarios = [
  {
    id: 1,
    name: "Normal Summer Operation",
    description: "Typical daytime cooling operation with economizer active. AHU-4-4 running at design conditions with stable supply air temperature and moderate outdoor conditions.",
    startRow: 240,
    pointOverrides: {}
  },
  {
    id: 2,
    name: "Economizer Lockout",
    description: "High outdoor temperature and humidity prevent economizer operation. OA damper at minimum position while mechanical cooling handles full load.",
    startRow: 480,
    pointOverrides: {
      "AO_OAD_44@DEV4004": 15,
      "AO_CHW_44@DEV4004": 85
    }
  },
  {
    id: 3,
    name: "Simultaneous Heating + Cooling",
    description: "Fault condition where both preheat and chilled water valves are open simultaneously, wasting energy. Triggers F-03 alarm.",
    startRow: 300,
    pointOverrides: {
      "AO_CHW_46@DEV4006": 45,
      "AO_PHT_46@DEV4006": 35
    }
  },
  {
    id: 4,
    name: "Manual Override Active",
    description: "RunSchedule forced to Occupied during unoccupied hours (22:00–06:00). Demonstrates F-02 scheduling fault where AHU runs unnecessarily overnight.",
    startRow: 22,
    pointOverrides: {
      "BI_SCHED_44@DEV4004": 1
    }
  },
  {
    id: 5,
    name: "CO₂ Sensor Fault",
    description: "CO₂ sensor reading drops below 100 ppm indicating sensor failure or disconnection. Triggers F-01 alarm for abnormally low reading.",
    startRow: 250,
    pointOverrides: {
      "AI_CO2_44@DEV4004": 45
    }
  },
  {
    id: 6,
    name: "PHT Valve Stuck",
    description: "Preheat coil valve stuck at approximately 25% position for extended duration. Indicates actuator failure or control signal loss. Triggers F-04 after 3+ hours.",
    startRow: 150,
    pointOverrides: {
      "AO_PHT_44@DEV4004": 25.0
    }
  },
  {
    id: 7,
    name: "Free Cooling Opportunity",
    description: "Mild outdoor conditions (OAT < 55°F, low enthalpy) permit free cooling via economizer. OA damper should be fully open to reduce mechanical cooling load.",
    startRow: 50,
    pointOverrides: {
      "AI_OAT@DEV5000": 52,
      "AI_OAH@DEV5000": 20,
      "AO_OAD_44@DEV4004": 100
    }
  },
  {
    id: 8,
    name: "Cooling Tower Fault",
    description: "Cooling tower running at 100% speed while outdoor conditions are favorable for free cooling. Triggers F-05 indicating controls failure or stuck VFD.",
    startRow: 60,
    pointOverrides: {
      "AO_CT02@DEV5000": 100,
      "AI_OAT@DEV5000": 48,
      "AI_OAH@DEV5000": 18
    }
  },
  {
    id: 9,
    name: "High Humidity",
    description: "Elevated return air humidity in AHU-4-6 zone. Demonstrates dehumidification demand and impact on cooling coil operation and energy consumption.",
    startRow: 500,
    pointOverrides: {
      "AI_RAH_46@DEV4006": 72
    }
  },
  {
    id: 10,
    name: "Nighttime Override",
    description: "AHU operating during unoccupied nighttime hours with reduced ventilation. Shows typical after-hours operation with minimum OA damper position.",
    startRow: 3,
    pointOverrides: {
      "BI_SCHED_44@DEV4004": 0,
      "AO_OAD_44@DEV4004": 10,
      "AO_FAN_44@DEV4004": 30
    }
  },
  {
    id: 11,
    name: "Weekend Scheduling Fault",
    description: "AHU-9-2 style fault where system runs 24/7 without unoccupied periods. Demonstrates energy waste from improper schedule configuration.",
    startRow: 144,
    pointOverrides: {
      "BI_SCHED_44@DEV4004": 1
    }
  },
  {
    id: 12,
    name: "VFD Modulation (Healthy)",
    description: "Supply air fan speed modulating normally between 40–70% to maintain duct static pressure. Demonstrates healthy VFD operation and load-following behavior.",
    startRow: 260,
    pointOverrides: {
      "AO_FAN_44@DEV4004": 55
    }
  },
  {
    id: 13,
    name: "Peak Cooling Load",
    description: "Maximum summer cooling demand with CHW valve near 100%, fan at high speed, and OA damper at minimum. Hottest afternoon conditions in the dataset.",
    startRow: 750,
    pointOverrides: {
      "AO_CHW_44@DEV4004": 95,
      "AO_FAN_44@DEV4004": 90,
      "AO_OAD_44@DEV4004": 15
    }
  },
  {
    id: 14,
    name: "Transition Season",
    description: "Mild spring conditions with fluctuating heating/cooling demand. Economizer swings between full open and modulated positions as outdoor temp varies around changeover point.",
    startRow: 100,
    pointOverrides: {
      "AI_OAT@DEV5000": 58,
      "AO_OAD_44@DEV4004": 65,
      "AO_CHW_44@DEV4004": 20,
      "AO_PHT_44@DEV4004": 10
    }
  }
];

export default Scenarios;

// Expose globally for browser-based loading (no module bundler)
if (typeof window !== 'undefined') {
  window.SCENARIOS = Scenarios;
  window.Scenarios = Scenarios;
}
