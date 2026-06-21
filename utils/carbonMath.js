/**
 * @fileoverview Carbon math coefficients and calculation engine.
 */

/**
 * Emission factors for carbon calculation (metric tons CO2e per unit per year).
 * @type {Object}
 */
const FACTORS = {
  fuel: {
    gasoline: 0.00041,
    diesel: 0.00046,
    hybrid: 0.00021,
    electric: 0.00008,
    none: 0
  },
  transit: 0.0052,
  flight: 0.45,
  electricity: 0.0042,
  heating: {
    'natural-gas': 1.6,
    'electricity': 1.1,
    'heating-oil': 2.6,
    'none': 0.1
  },
  diet: {
    'meat-heavy': 3.1,
    'meat-medium': 1.9,
    'pescatarian': 1.4,
    'vegetarian': 0.9,
    'vegan': 0.4
  },
  waste: {
    high: 0.8,
    average: 0.4,
    low: 0.1
  },
  shopping: {
    heavy: 1.8,
    average: 0.9,
    light: 0.3
  },
  recyclePaper: -0.12,
  recyclePlastic: -0.18
};

/**
 * Calculates carbon footprint emissions in metric tons CO2e/year based on lifestyle inputs.
 * 
 * @param {Object} calc - User inputs from the calculator wizard.
 * @param {number} calc.vehicleMileage - Annual miles driven.
 * @param {string} calc.fuelType - Vehicle fuel type ('gasoline', 'diesel', 'hybrid', 'electric', 'none').
 * @param {number} calc.transitHours - Weekly public transit hours.
 * @param {number} calc.flights - Annual flight count.
 * @param {number} calc.electricityBill - Average monthly electricity bill in USD.
 * @param {string} calc.heatingSource - Primary heating source ('natural-gas', 'electricity', 'heating-oil', 'none').
 * @param {boolean} calc.solar - True if solar panels or 100% green energy is utilized.
 * @param {string} calc.diet - Primary diet type ('meat-heavy', 'meat-medium', 'pescatarian', 'vegetarian', 'vegan').
 * @param {string} calc.waste - Household food waste factor ('high', 'average', 'low').
 * @param {string} calc.shopping - Consumer shopping frequency ('heavy', 'average', 'light').
 * @param {boolean} calc.recyclePaper - True if user regularly recycles paper.
 * @param {boolean} calc.recyclePlastic - True if user regularly recycles plastics/metals.
 * @returns {Object} Output breakdown of emissions by category (transport, energy, diet, consumption, total).
 */
function calculateBaseline(calc) {
  // 1. Transport Emissions
  const carFactor = FACTORS.fuel[calc.fuelType] !== undefined ? FACTORS.fuel[calc.fuelType] : FACTORS.fuel.gasoline;
  const carEmissions = (calc.vehicleMileage || 0) * carFactor;
  const transitEmissions = (calc.transitHours || 0) * 52 * FACTORS.transit;
  const flightEmissions = (calc.flights || 0) * FACTORS.flight;
  const transport = carEmissions + transitEmissions + flightEmissions;

  // 2. Home Energy Emissions
  let electricityEmissions = (calc.electricityBill || 0) * 12 * FACTORS.electricity;
  if (calc.solar) {
    electricityEmissions *= 0.15;
  }
  let heatingEmissions = FACTORS.heating[calc.heatingSource] !== undefined ? FACTORS.heating[calc.heatingSource] : FACTORS.heating['natural-gas'];
  if (calc.solar && calc.heatingSource === 'electricity') {
    heatingEmissions *= 0.3;
  }
  const energy = electricityEmissions + heatingEmissions;

  // 3. Diet Emissions
  const dietEmissions = FACTORS.diet[calc.diet] !== undefined ? FACTORS.diet[calc.diet] : FACTORS.diet['meat-medium'];
  const wasteEmissions = FACTORS.waste[calc.waste] !== undefined ? FACTORS.waste[calc.waste] : FACTORS.waste.average;
  const diet = dietEmissions + wasteEmissions;

  // 4. Consumption Emissions
  let recycleOffset = 0;
  if (calc.recyclePaper) recycleOffset += FACTORS.recyclePaper;
  if (calc.recyclePlastic) recycleOffset += FACTORS.recyclePlastic;
  const shoppingValue = FACTORS.shopping[calc.shopping] !== undefined ? FACTORS.shopping[calc.shopping] : FACTORS.shopping.average;
  const consumption = Math.max(0.1, shoppingValue + recycleOffset);

  const total = parseFloat((transport + energy + diet + consumption).toFixed(2));

  return {
    transport: parseFloat(transport.toFixed(2)),
    energy: parseFloat(energy.toFixed(2)),
    diet: parseFloat(diet.toFixed(2)),
    consumption: parseFloat(consumption.toFixed(2)),
    total
  };
}

/**
 * Simulates future carbon emissions based on interactive simulator slider values.
 * 
 * @param {Object} sim - Slider variables from simulator pane.
 * @param {number} sim.carMiles - Weekly car miles driven.
 * @param {number} sim.heatingTemp - Target indoor thermostat temperature.
 * @param {number} sim.meatMeals - Number of meat meals consumed per week (out of 21).
 * @param {number} sim.flights - Annual flight count.
 * @param {number} sim.cleanShare - Percentage of home energy that is green (0-100).
 * @param {Object} calc - Initial baseline calculator inputs.
 * @returns {number} Projected annual emissions in tons CO2e.
 */
function simulateFootprint(sim, calc) {
  // Car emissions: miles/week * 52 * fuel factor from baseline
  const fuelType = calc.fuelType === 'none' ? 'gasoline' : calc.fuelType;
  const fuelFactor = FACTORS.fuel[fuelType] || FACTORS.fuel.gasoline;
  const carEmission = (sim.carMiles || 0) * 52 * fuelFactor;

  // Transit emissions (constant from baseline)
  const transitEmission = (calc.transitHours || 0) * 52 * FACTORS.transit;

  // Flights
  const flightEmission = (sim.flights || 0) * FACTORS.flight;

  // Electricity emissions: base electricity bill * 12 * factor * clean energy reduction
  let electricityBase = (calc.electricityBill || 0) * 12 * FACTORS.electricity;
  electricityBase *= (1 - (sim.cleanShare || 0) / 100);

  // Heating emissions: adjusted by thermostat target temperature (relative to base 68F)
  const tempDiff = (sim.heatingTemp || 68) - 68;
  const tempAdjustment = tempDiff * 0.08;
  const heatingBase = Math.max(0.1, (FACTORS.heating[calc.heatingSource] || 1.6) + tempAdjustment);

  // Diet emissions: proportion of meat meals vs vegan meals
  const meatMealRatio = Math.max(0, Math.min(21, sim.meatMeals || 0)) / 21;
  const dietEmission = meatMealRatio * FACTORS.diet['meat-heavy'] + (1 - meatMealRatio) * FACTORS.diet['vegan'];
  const wasteEmission = FACTORS.waste[calc.waste] || FACTORS.waste.average;

  // Consumption emissions (constant from baseline)
  let recycleOffset = 0;
  if (calc.recyclePaper) recycleOffset += FACTORS.recyclePaper;
  if (calc.recyclePlastic) recycleOffset += FACTORS.recyclePlastic;
  const shoppingValue = FACTORS.shopping[calc.shopping] || FACTORS.shopping.average;
  const consumptionEmission = Math.max(0.1, shoppingValue + recycleOffset);

  const total = carEmission + transitEmission + flightEmission + electricityBase + heatingBase + dietEmission + wasteEmission + consumptionEmission;
  return parseFloat(total.toFixed(2));
}

module.exports = {
  FACTORS,
  calculateBaseline,
  simulateFootprint
};
