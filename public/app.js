// --- Global App State & Constants ---
const state = {
  // Calculator values
  calculator: {
    vehicleMileage: 8000,
    fuelType: 'gasoline',
    transitHours: 2,
    flights: 2,
    electricityBill: 80,
    heatingSource: 'natural-gas',
    solar: false,
    diet: 'meat-medium',
    waste: 'average',
    shopping: 'average',
    recyclePaper: true,
    recyclePlastic: true,
  },
  
  // Custom logged actions
  streak: 3,
  greenPoints: 0,
  carbonSavedTotal: 120, // in kg
  completedLogsCount: 4,
  
  // Active state
  activeView: 'dashboard',
  currentEmissions: {
    transport: 0,
    energy: 0,
    diet: 0,
    consumption: 0,
    total: 0
  },
  
  // Simulator adjustments
  simulator: {
    carMiles: 150, // weekly
    heatingTemp: 68,
    meatMeals: 10, // weekly
    flights: 2,
    cleanShare: 20
  },

  // Completed challenges
  completedChallenges: [],
  unlockedBadges: [],
  offsetPercent: 50
};

// Coefficient factors for Carbon calculation (metric tons CO2e / unit / year)
const FACTORS = {
  // Transport
  fuel: {
    gasoline: 0.00041, // tons/mile
    diesel: 0.00046,
    hybrid: 0.00021,
    electric: 0.00008,
    none: 0
  },
  transit: 0.0052, // tons/hour
  flight: 0.45,    // tons/flight

  // Energy
  electricity: 0.0042, // tons/ $ bill (average proxy)
  heating: {
    'natural-gas': 1.6,
    'electricity': 1.1,
    'heating-oil': 2.6,
    'none': 0.1
  },
  
  // Diet & Food
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

  // Consumption
  shopping: {
    heavy: 1.8,
    average: 0.9,
    light: 0.3
  },
  recyclePaper: -0.12,
  recyclePlastic: -0.18
};

// Premium Daily Tips List
const DAILY_TIPS = [
  { title: "Switch to LED Bulbs", desc: "LEDs consume 75% less energy and last 25 times longer than incandescent bulbs, saving money and carbon." },
  { title: "Reduce Shower Time by 2 Mins", desc: "Shortening your shower by just two minutes saves up to 10 gallons of water and reduces water-heating carbon emissions." },
  { title: "Ate Local Foods", desc: "Eating local reduces 'food miles' (the distance food travels from farm to plate) by up to 90%." },
  { title: "Wash Laundry in Cold Water", desc: "About 75% to 90% of all the energy your washing machine uses goes to heating the water. Cold washes work just as well." },
  { title: "Lower Thermostat in Winter", desc: "Setting your thermostat just 2°F lower in winter saves 6% on energy bills and about 300kg of CO2 per year." }
];

// Eco Challenges definitions
const ECO_CHALLENGES = [
  { id: 'car_free_week', title: 'Car-Free Commuter', desc: 'Commute via public transit, walking, or cycling for 5 days.', points: 150, icon: 'bike', completed: false },
  { id: 'meat_less', title: 'Meatless Monday Champion', desc: 'Eat entirely vegetarian or vegan meals for 4 Mondays in a row.', points: 100, icon: 'utensils-crossed', completed: false },
  { id: 'zero_waste', title: 'Zero Waste Warrior', desc: 'Avoid single-use plastics and compost food scraps for a whole week.', points: 200, icon: 'trash-2', completed: false },
  { id: 'energy_diet', title: 'Home Energy Diet', desc: 'Unplug all idle electronics and drop thermostat by 2 degrees for a week.', points: 120, icon: 'power', completed: false }
];

// Achievements / Badges cabinet definition
const ECO_BADGES = [
  { id: 'footprint_wizard', title: 'Footprint Wizard', desc: 'Completed the calculator and established carbon baseline.', icon: 'calculator' },
  { id: 'paris_defender', title: 'Paris Defender', desc: 'Achieved an emission level below 2.0 tons in the Simulator.', icon: 'shield-check' },
  { id: 'streak_master', title: 'Streak Master', desc: 'Achieved a daily green logging streak of 5 days or more.', icon: 'zap' },
  { id: 'global_benefactor', title: 'Carbon Neutral', desc: 'Offset your emissions by 100% using certified offset guides.', icon: 'trees' }
];

// Daily Quick Logs Definition
const QUICK_LOGS = [
  { id: 'log_transit', label: 'Used Public Transit / Bike', co2: 8.5, points: 15, checked: false },
  { id: 'log_vegan', label: 'Ate Plant-Based Meals Today', co2: 4.8, points: 10, checked: false },
  { id: 'log_dryer', label: 'Line-Dried My Clothes', co2: 2.1, points: 8, checked: false },
  { id: 'log_thermostat', label: 'Optimized My Thermostat Settings', co2: 3.5, points: 12, checked: false }
];

// Charts references
let breakdownChartInst = null;
let simulatorChartInst = null;

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Load saved state from localStorage
  loadState();

  // Initialize Lucide Icons
  lucide.createIcons();

  // Compute baseline emissions
  calculateEmissions();

  // Setup tab switches
  setupNavigation();

  // Populate dynamic elements
  populateQuickLogs();
  populateChallenges();
  populateBadges();

  // Bind forms & inputs
  bindCalculatorEvents();
  bindSimulatorEvents();
  bindOffsetEvents();

  // Initialize Advisor
  initAdvisorChat();

  // Update overall values
  updateDashboardValues();
  updateOffsetValues();
  
  // Initialize Chart.js objects
  initBreakdownChart();
  initSimulatorChart();
  
  // Set dynamic tip
  triggerTipRefresh();
});

// --- Local Storage Management ---
function saveState() {
  localStorage.setItem('eco_trace_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('eco_trace_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge keys to support schema upgrades
      Object.assign(state, parsed);
    } catch (e) {
      console.error("Error loading localStorage state:", e);
    }
  }
}

// --- Navigation Controller ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      switchView(target);
    });
  });
}

function switchView(viewId) {
  state.activeView = viewId;
  
  // Remove active classes
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
  
  // Add active classes to target view
  const targetPanel = document.getElementById(viewId);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  // Update matching nav links
  document.querySelectorAll(`[data-target="${viewId}"]`).forEach(el => el.classList.add('active'));

  // Handle specific view entries
  if (viewId === 'dashboard') {
    updateDashboardValues();
    if (breakdownChartInst) {
      breakdownChartInst.destroy();
      initBreakdownChart();
    }
  } else if (viewId === 'simulator') {
    syncSimulatorSliders();
    if (simulatorChartInst) {
      simulatorChartInst.destroy();
      initSimulatorChart();
    }
  } else if (viewId === 'offsets') {
    updateOffsetValues();
  } else if (viewId === 'advisor') {
    initAdvisorChat();
  }
}

// --- Carbon Emissions Math Core ---
function calculateEmissions() {
  const calc = state.calculator;

  // 1. TRANSPORT EMISSIONS
  const carFactor = FACTORS.fuel[calc.fuelType];
  const carEmissions = calc.vehicleMileage * carFactor;
  const transitEmissions = calc.transitHours * 52 * FACTORS.transit;
  const flightEmissions = calc.flights * FACTORS.flight;
  const totalTransport = carEmissions + transitEmissions + flightEmissions;

  // 2. HOME ENERGY EMISSIONS
  let electricityEmissions = calc.electricityBill * 12 * FACTORS.electricity;
  if (calc.solar) {
    electricityEmissions *= 0.15; // 85% carbon savings for solar
  }
  
  let heatingEmissions = FACTORS.heating[calc.heatingSource];
  if (calc.solar && calc.heatingSource === 'electricity') {
    heatingEmissions *= 0.3; // heat pump + solar savings
  }
  const totalEnergy = electricityEmissions + heatingEmissions;

  // 3. DIET EMISSIONS
  const dietEmissions = FACTORS.diet[calc.diet];
  const wasteEmissions = FACTORS.waste[calc.waste];
  const totalDiet = dietEmissions + wasteEmissions;

  // 4. CONSUMPTION EMISSIONS
  let recycleOffset = 0;
  if (calc.recyclePaper) recycleOffset += FACTORS.recyclePaper;
  if (calc.recyclePlastic) recycleOffset += FACTORS.recyclePlastic;

  const totalConsumption = Math.max(0.1, FACTORS.shopping[calc.shopping] + recycleOffset);

  // Set state
  state.currentEmissions.transport = parseFloat(totalTransport.toFixed(2));
  state.currentEmissions.energy = parseFloat(totalEnergy.toFixed(2));
  state.currentEmissions.diet = parseFloat(totalDiet.toFixed(2));
  state.currentEmissions.consumption = parseFloat(totalConsumption.toFixed(2));
  
  state.currentEmissions.total = parseFloat(
    (totalTransport + totalEnergy + totalDiet + totalConsumption).toFixed(2)
  );

  saveState();
}

// --- Dashboard Population & Interaction ---
function updateDashboardValues() {
  document.getElementById('dash-emission').innerText = state.currentEmissions.total.toFixed(1);
  document.getElementById('dash-saved').innerText = state.carbonSavedTotal.toFixed(0);
  document.getElementById('dash-streak').innerText = state.streak;
  
  updateUserStatsHeader();
}

function updateUserStatsHeader() {
  // Recalculate level/tier
  let tier = "Eco Novice";
  let points = state.greenPoints;
  
  if (points > 600) tier = "Climate Hero";
  else if (points > 300) tier = "Climate Advocate";
  else if (points > 100) tier = "Carbon Saver";
  
  document.getElementById('user-tier-label').innerText = tier;
  document.getElementById('user-points-label').innerText = `${points} Green Points`;
  
  const chPoints = document.getElementById('challenges-points-total');
  if (chPoints) chPoints.innerText = `${points} GP`;
}

function populateQuickLogs() {
  const container = document.getElementById('quick-actions-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  QUICK_LOGS.forEach(log => {
    const row = document.createElement('div');
    row.className = 'action-log-row';
    row.innerHTML = `
      <div class="action-row-left">
        <label class="action-checkbox-wrap">
          <input type="checkbox" id="${log.id}" ${log.checked ? 'checked' : ''}>
          <span class="checkmark-custom"></span>
        </label>
        <div class="action-details">
          <h4>${log.label}</h4>
          <p>-${log.co2} kg CO₂e saved</p>
        </div>
      </div>
      <div class="log-btn-wrap">
        <button class="btn btn-sm btn-outline-primary" id="btn-log-${log.id}" ${log.checked ? 'disabled' : ''}>Log Choice</button>
      </div>
    `;
    
    container.appendChild(row);
    
    // Bind click events
    const checkbox = row.querySelector('input');
    const button = row.querySelector('button');
    
    const triggerLog = () => {
      if (log.checked) return;
      
      log.checked = true;
      checkbox.checked = true;
      button.disabled = true;
      
      // Update state
      state.carbonSavedTotal += log.co2;
      state.greenPoints += log.points;
      state.completedLogsCount += 1;
      
      // Add streak increment if first log of day
      if (state.completedLogsCount === 1 || state.completedLogsCount % 4 === 0) {
        state.streak += 1;
        checkAndUnlockBadge('streak_master');
      }

      if (state.completedLogsCount >= 5) {
        checkAndUnlockBadge('footprint_wizard');
      }

      saveState();
      updateDashboardValues();
      showToast('Action Logged!', `You saved ${log.co2}kg CO₂ and earned +${log.points} GP!`);
    };
    
    button.addEventListener('click', triggerLog);
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        triggerLog();
      } else {
        // Prevent unchecking for simplicity
        e.target.checked = true;
      }
    });
  });
}

function triggerTipRefresh() {
  const randomTip = DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
  document.getElementById('banner-tip-title').innerText = randomTip.title;
  document.getElementById('banner-tip-desc').innerText = randomTip.desc;
}

// --- Toast System ---
function showToast(title, body) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon-wrap">
      <i data-lucide="award"></i>
    </div>
    <div class="toast-body">
      <h4>${title}</h4>
      <p>${body}</p>
    </div>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();

  // Auto remove
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// --- Challenges & Badge Cabinet ---
function populateChallenges() {
  const container = document.getElementById('challenges-list-container');
  if (!container) return;

  container.innerHTML = '';
  
  ECO_CHALLENGES.forEach(ch => {
    const isCompleted = state.completedChallenges.includes(ch.id);
    const row = document.createElement('div');
    row.className = 'challenge-row';
    row.innerHTML = `
      <div class="challenge-info-wrap">
        <div class="challenge-icon-box">
          <i data-lucide="${ch.icon}"></i>
        </div>
        <div class="challenge-meta">
          <h4>${ch.title}</h4>
          <p>${ch.desc}</p>
          <span class="challenge-points">+${ch.points} GP</span>
        </div>
      </div>
      <button class="btn btn-sm ${isCompleted ? 'btn-outline' : 'btn-primary'}" ${isCompleted ? 'disabled' : ''}>
        ${isCompleted ? 'Completed' : 'Join & Log'}
      </button>
    `;
    
    container.appendChild(row);
    
    const btn = row.querySelector('button');
    btn.addEventListener('click', () => {
      if (isCompleted) return;
      
      state.completedChallenges.push(ch.id);
      state.greenPoints += ch.points;
      
      saveState();
      updateUserStatsHeader();
      populateChallenges();
      showToast('Challenge Completed!', `Congratulations! You completed ${ch.title} and claimed ${ch.points} GP.`);
      
      // Auto unlock check
      if (state.completedChallenges.length === 1) {
        checkAndUnlockBadge('footprint_wizard');
      }
    });
  });
  lucide.createIcons();
}

function populateBadges() {
  const container = document.getElementById('badges-grid-container');
  if (!container) return;

  container.innerHTML = '';
  
  ECO_BADGES.forEach(badge => {
    const isUnlocked = state.unlockedBadges.includes(badge.id);
    const item = document.createElement('div');
    item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
    item.title = badge.desc;
    item.innerHTML = `
      <div class="badge-visual">
        <i data-lucide="${badge.icon}"></i>
      </div>
      <span class="badge-label">${badge.title}</span>
    `;
    container.appendChild(item);
  });
  lucide.createIcons();
}

function checkAndUnlockBadge(badgeId) {
  if (state.unlockedBadges.includes(badgeId)) return;
  
  state.unlockedBadges.push(badgeId);
  saveState();
  populateBadges();
  
  const badge = ECO_BADGES.find(b => b.id === badgeId);
  if (badge) {
    showToast('Badge Unlocked!', `You have earned the "${badge.title}" badge!`);
  }
}

// --- Carbon Offset Actions ---
function bindOffsetEvents() {
  const slider = document.getElementById('offset-slider-percent');
  if (!slider) return;
  
  slider.addEventListener('input', (e) => {
    state.offsetPercent = parseInt(e.target.value);
    updateOffsetValues();
  });
}

function updateOffsetValues() {
  const emission = state.currentEmissions.total;
  const pct = state.offsetPercent;
  const tonsToOffset = (emission * pct) / 100;
  
  document.getElementById('offset-emission-value').innerText = emission.toFixed(1);
  document.getElementById('offset-selected-pct').innerText = `${pct}% Offset (${tonsToOffset.toFixed(1)} tons)`;
  
  // Calculations:
  // 1 tree absorbs ~22kg of CO2 per year. 1 ton CO2 = 45.4 trees.
  const trees = Math.round(tonsToOffset * 45.4);
  // US grid solar factor: ~0.4 kg CO2 / kWh. 1 ton = 2.5 MWh
  const solar = (tonsToOffset * 2.5).toFixed(1);
  // Coal factor: ~1.0 kg CO2 / lb coal. 1 ton = 2200 lbs coal
  const coal = Math.round(tonsToOffset * 2204.6);
  
  document.getElementById('eq-trees').innerText = trees.toLocaleString();
  document.getElementById('eq-solar').innerText = parseFloat(solar).toLocaleString();
  document.getElementById('eq-coal').innerText = coal.toLocaleString();
  
  // Neutral check
  if (pct === 100) {
    checkAndUnlockBadge('global_benefactor');
  }
}

function simulateOffsetPurchase(projectName, pricePerTon) {
  const amount = (state.currentEmissions.total * state.offsetPercent) / 100;
  const cost = (amount * pricePerTon).toFixed(2);
  
  showToast('Offsets Logged!', `Successfully simulated supporting ${projectName} by offsetting ${amount.toFixed(1)} tons ($${cost}).`);
}

// --- Calculator Wizard logic ---
let currentStep = 1;
function bindCalculatorEvents() {
  const btnNext = document.getElementById('btn-calc-next');
  const btnBack = document.getElementById('btn-calc-back');
  
  if (!btnNext || !btnBack) return;
  
  btnNext.addEventListener('click', () => {
    if (currentStep < 4) {
      currentStep++;
      updateWizardPane();
    } else {
      // Completed last step
      calculateEmissions();
      checkAndUnlockBadge('footprint_wizard');
      showToast('Calculator Finished!', 'Your baseline carbon footprint has been successfully calculated!');
      switchView('dashboard');
      currentStep = 1;
      updateWizardPane();
    }
  });

  btnBack.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateWizardPane();
    }
  });

  // Attach live calculation triggers to inputs
  const inputs = document.querySelectorAll('.wizard-form-body input, .wizard-form-body select');
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      readCalculatorFormValues();
      calculateEmissions();
      document.getElementById('calc-live-total').innerText = state.currentEmissions.total.toFixed(1);
    });
  });
}

function readCalculatorFormValues() {
  state.calculator.vehicleMileage = parseFloat(document.getElementById('calc-vehicle-mileage').value) || 0;
  state.calculator.fuelType = document.getElementById('calc-fuel-type').value;
  state.calculator.transitHours = parseFloat(document.getElementById('calc-transit-hours').value) || 0;
  state.calculator.flights = parseFloat(document.getElementById('calc-flights').value) || 0;
  state.calculator.electricityBill = parseFloat(document.getElementById('calc-electricity-bill').value) || 0;
  state.calculator.heatingSource = document.getElementById('calc-heating-source').value;
  state.calculator.solar = document.getElementById('calc-solar').checked;
  state.calculator.diet = document.getElementById('calc-diet').value;
  state.calculator.waste = document.getElementById('calc-waste').value;
  state.calculator.shopping = document.getElementById('calc-shopping').value;
  state.calculator.recyclePaper = document.getElementById('calc-recycle-paper').checked;
  state.calculator.recyclePlastic = document.getElementById('calc-recycle-plastic').checked;
}

function updateWizardPane() {
  // Update indicator active classes
  document.querySelectorAll('.wizard-step-indicator').forEach(el => {
    const step = parseInt(el.getAttribute('data-step'));
    el.classList.remove('active', 'completed');
    if (step === currentStep) {
      el.classList.add('active');
    } else if (step < currentStep) {
      el.classList.add('completed');
    }
  });

  // Display correct pane
  document.querySelectorAll('.wizard-step-pane').forEach(el => el.classList.remove('active'));
  document.getElementById(`step-pane-${currentStep}`).classList.add('active');

  // Set buttons
  const btnNext = document.getElementById('btn-calc-next');
  const btnBack = document.getElementById('btn-calc-back');
  
  btnBack.disabled = (currentStep === 1);
  btnNext.innerText = (currentStep === 4) ? 'Finish & Save' : 'Next Step';
}

// --- Simulator Interactive Control ---
function syncSimulatorSliders() {
  // Sync sliders to current calculator baseline values
  state.simulator.carMiles = Math.round(state.calculator.vehicleMileage / 52);
  state.simulator.heatingTemp = 68;
  
  let dietMeals = 14;
  if (state.calculator.diet === 'meat-heavy') dietMeals = 21;
  else if (state.calculator.diet === 'meat-medium') dietMeals = 10;
  else if (state.calculator.diet === 'pescatarian') dietMeals = 6;
  else if (state.calculator.diet === 'vegetarian' || state.calculator.diet === 'vegan') dietMeals = 0;
  
  state.simulator.meatMeals = dietMeals;
  state.simulator.flights = state.calculator.flights;
  state.simulator.cleanShare = state.calculator.solar ? 100 : 20;

  // Set DOM range sliders
  document.getElementById('sim-range-car').value = state.simulator.carMiles;
  document.getElementById('sim-range-heating').value = state.simulator.heatingTemp;
  document.getElementById('sim-range-meat').value = state.simulator.meatMeals;
  document.getElementById('sim-range-flights').value = state.simulator.flights;
  document.getElementById('sim-range-green-energy').value = state.simulator.cleanShare;

  updateSimulatorVisualDisplays();
}

function bindSimulatorEvents() {
  const sliders = [
    { id: 'sim-range-car', key: 'carMiles', display: 'sim-val-car' },
    { id: 'sim-range-heating', key: 'heatingTemp', display: 'sim-val-heating' },
    { id: 'sim-range-meat', key: 'meatMeals', display: 'sim-val-meat' },
    { id: 'sim-range-flights', key: 'flights', display: 'sim-val-flights' },
    { id: 'sim-range-green-energy', key: 'cleanShare', display: 'sim-val-green-energy' }
  ];

  sliders.forEach(slider => {
    const input = document.getElementById(slider.id);
    if (!input) return;

    input.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      state.simulator[slider.key] = val;
      document.getElementById(slider.display).innerText = val;
      
      updateSimulatorChart();
      updateSimulatorMilestoneText();
    });
  });
}

function updateSimulatorVisualDisplays() {
  document.getElementById('sim-val-car').innerText = state.simulator.carMiles;
  document.getElementById('sim-val-heating').innerText = state.simulator.heatingTemp;
  document.getElementById('sim-val-meat').innerText = state.simulator.meatMeals;
  document.getElementById('sim-val-flights').innerText = state.simulator.flights;
  document.getElementById('sim-val-green-energy').innerText = state.simulator.cleanShare;
}

function resetSimulator() {
  syncSimulatorSliders();
  updateSimulatorChart();
  updateSimulatorMilestoneText();
  showToast('Reset Complete', 'Simulator values reset to your baseline metrics.');
}

function getSimulatorProjectedTotal() {
  // Calculations based on slider outputs
  // Car: miles/week * 52 * fuel factor
  const fuelFactor = FACTORS.fuel[state.calculator.fuelType === 'none' ? 'gasoline' : state.calculator.fuelType];
  const carEmission = state.simulator.carMiles * 52 * fuelFactor;
  
  // Transit: (keep constant from calculator)
  const transitEmission = state.calculator.transitHours * 52 * FACTORS.transit;
  
  // Flights
  const flightEmission = state.simulator.flights * FACTORS.flight;

  // Energy Electricity: base electricity reduced by clean percentage
  let electricityBase = state.calculator.electricityBill * 12 * FACTORS.electricity;
  electricityBase *= (1 - state.simulator.cleanShare / 100);
  
  // Thermostat adjustment
  const tempDiff = state.simulator.heatingTemp - 68;
  const tempAdjustmentFactor = tempDiff * 0.08; // 80kg per degree target difference
  const heatingBase = Math.max(0.1, FACTORS.heating[state.calculator.heatingSource] + tempAdjustmentFactor);

  // Diet
  const meatMealRatio = state.simulator.meatMeals / 21;
  const dietEmission = meatMealRatio * FACTORS.diet['meat-heavy'] + (1 - meatMealRatio) * FACTORS.diet['vegan'];
  const wasteEmission = FACTORS.waste[state.calculator.waste];

  // Consumption (static)
  const consumptionEmission = state.currentEmissions.consumption;

  const total = carEmission + transitEmission + flightEmission + electricityBase + heatingBase + dietEmission + wasteEmission + consumptionEmission;
  return parseFloat(total.toFixed(2));
}

function updateSimulatorMilestoneText() {
  const projected = getSimulatorProjectedTotal();
  const iconBlock = document.getElementById('milestone-status-icon');
  const titleBlock = document.getElementById('milestone-status-title');
  const descBlock = document.getElementById('milestone-status-desc');
  const statusBlock = document.getElementById('milestone-status-block');

  if (projected <= 2.0) {
    statusBlock.style.borderColor = 'rgba(163, 230, 53, 0.4)';
    iconBlock.innerHTML = `<i data-lucide="check-circle" class="text-accent animate-pulse"></i>`;
    titleBlock.innerText = "Target Achieved! (1.5°C Goal)";
    titleBlock.className = "text-accent";
    descBlock.innerText = `Outstanding! Your simulated emissions (${projected.toFixed(1)} tons) meet the sustainable Paris Agreement climate cap!`;
    checkAndUnlockBadge('paris_defender');
  } else if (projected <= 5.0) {
    statusBlock.style.borderColor = 'rgba(6, 182, 212, 0.4)';
    iconBlock.innerHTML = `<i data-lucide="alert-circle" class="text-secondary"></i>`;
    titleBlock.innerText = "Moderate Emissions (2.0°C Limit)";
    titleBlock.className = "text-secondary";
    descBlock.innerText = `You emit ${projected.toFixed(1)} tons. Good effort, but aim below 2.0 tons to keep global warming strictly limited.`;
  } else {
    statusBlock.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    iconBlock.innerHTML = `<i data-lucide="x-circle" class="text-danger"></i>`;
    titleBlock.innerText = "Exceeds Safe Limits";
    titleBlock.className = "text-danger";
    descBlock.innerText = `Your setting outputs ${projected.toFixed(1)} tons, exceeding global ecological thresholds. Try reducing car driving or shifting diet.`;
  }
  lucide.createIcons();
}

// --- Data Visualization (Chart.js) ---
function initBreakdownChart() {
  const ctx = document.getElementById('emissionBreakdownChart');
  if (!ctx) return;

  const dataValues = [
    state.currentEmissions.transport,
    state.currentEmissions.energy,
    state.currentEmissions.diet,
    state.currentEmissions.consumption
  ];

  // If no emissions calculated yet, provide average placeholder
  const hasData = dataValues.some(val => val > 0);
  const data = hasData ? dataValues : [4.5, 3.8, 2.5, 1.2];

  breakdownChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Transport', 'Home Energy', 'Diet & Food', 'Shopping & Waste'],
      datasets: [{
        data: data,
        backgroundColor: [
          '#10b981', // emerald
          '#06b6d4', // cyan
          '#a3e635', // lime
          '#3b82f6'  // blue
        ],
        borderWidth: 2,
        borderColor: '#121824',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#f3f4f6',
            font: { family: 'Outfit', size: 12 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw;
              const pct = ((val / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(0);
              return ` ${context.label}: ${val.toFixed(1)} tons (${pct}%)`;
            }
          }
        }
      },
      cutout: '68%'
    }
  });
}

function initSimulatorChart() {
  const ctx = document.getElementById('simulatorChart');
  if (!ctx) return;

  const currentSimVal = getSimulatorProjectedTotal();

  simulatorChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['US Avg', 'My Current Baseline', 'Simulated Future Target', 'Paris Agreement Goal'],
      datasets: [{
        data: [16.0, state.currentEmissions.total || 4.8, currentSimVal, 2.0],
        backgroundColor: [
          'rgba(255, 255, 255, 0.15)', // us avg
          'rgba(6, 182, 212, 0.3)',    // cyan baseline
          'rgba(16, 185, 129, 0.8)',   // emerald active sim
          'rgba(163, 230, 53, 0.7)'    // lime target
        ],
        borderColor: [
          'rgba(255, 255, 255, 0.3)',
          '#06b6d4',
          '#10b981',
          '#a3e635'
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: 'Tons CO₂e / Year', color: '#9ca3af', font: { family: 'Outfit' } },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

function updateSimulatorChart() {
  if (!simulatorChartInst) return;
  const projectValue = getSimulatorProjectedTotal();
  
  simulatorChartInst.data.datasets[0].data[2] = projectValue;
  
  // Shift colors depending on target fulfillment
  if (projectValue <= 2.0) {
    simulatorChartInst.data.datasets[0].backgroundColor[2] = 'rgba(163, 230, 53, 0.85)'; // glowing lime
    simulatorChartInst.data.datasets[0].borderColor[2] = '#a3e635';
  } else {
    simulatorChartInst.data.datasets[0].backgroundColor[2] = 'rgba(16, 185, 129, 0.8)';  // standard emerald
    simulatorChartInst.data.datasets[0].borderColor[2] = '#10b981';
  }

  simulatorChartInst.update();
}

// --- AI Eco-Advisor Core ---
const ADVISOR_KNOWLEDGE = {
  welcome: "Hello! I am EcoAdvisor. I have analyzed your carbon profile. Let me know which area you'd like to optimize, or query a topic below.",
  transport: {
    title: "Transport Audit",
    text: "Your transportation footprint is {transport_val} tons/year. Action plan: 1. Reducing flight counts by 1 saves ~0.45 tons. 2. Switching to hybrid or EV cuts miles emissions by 50-80%. 3. Telecommuting 2 days/week removes ~1.0 ton annually."
  },
  home: {
    title: "Home Energy Audit",
    text: "Your residential emissions total {energy_val} tons/year. Quick remedies: 1. Insulating window cracks saves 15% heating. 2. Shifting to heat pump reduces energy intensity. 3. Solar panel offsets reduce power emissions by 85%."
  },
  diet: {
    title: "Diet Audit",
    text: "Your food footprint logs {diet_val} tons/year. Sustainable tips: 1. Replacing beef with chicken or fish cuts diet footprint by 40%. 2. Moving vegetarian 3 days/week saves ~0.5 tons CO2e/year. 3. Composting leftovers prevents methane in landfills."
  },
  quick: {
    title: "Top 3 Easiest Wins",
    text: "Here are your 3 highest-leverage actions based on your current inputs: 1. Wash clothes in cold water (-150kg CO2/yr). 2. Turn off standby power strips (-200kg CO2/yr). 3. Walk or bike for trips under 2 miles (-450kg CO2/yr)."
  }
};

function initAdvisorChat() {
  const box = document.getElementById('advisor-messages-box');
  if (!box || box.children.length > 0) return; // Prevent double init
  
  box.innerHTML = `
    <div class="chat-bubble bot">
      ${ADVISOR_KNOWLEDGE.welcome}
    </div>
  `;
  
  populateAdvisorRecommendations();
}

function askAdvisorQuestion(topic) {
  const box = document.getElementById('advisor-messages-box');
  if (!box) return;

  // Add user bubble
  const queryLabel = {
    transport: "Analyze my travel emissions",
    home: "Evaluate my household energy",
    diet: "Review my food choices",
    quick: "Give me 3 easiest wins"
  }[topic];

  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.innerText = queryLabel;
  box.appendChild(userBubble);

  // Generate reply
  setTimeout(() => {
    let reply = ADVISOR_KNOWLEDGE[topic].text;
    // Replace dynamic placeholders
    reply = reply.replace('{transport_val}', state.currentEmissions.transport);
    reply = reply.replace('{energy_val}', state.currentEmissions.energy);
    reply = reply.replace('{diet_val}', state.currentEmissions.diet);

    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot';
    botBubble.innerHTML = `<strong>${ADVISOR_KNOWLEDGE[topic].title}:</strong><br>${reply}`;
    box.appendChild(botBubble);
    
    // Auto scroll chat window
    box.scrollTop = box.scrollHeight;
  }, 400);
}

function populateAdvisorRecommendations() {
  const container = document.getElementById('advisor-recommendations-list');
  if (!container) return;

  container.innerHTML = '';

  const recs = [
    { title: "Shift to Electric Car", desc: "Change vehicle type to EV", category: "transport", icon: "car", savings: "1.8 tons" },
    { title: "Install Solar Arrays", desc: "Utilize household solar panel power", category: "energy", icon: "sun", savings: "2.4 tons" },
    { title: "Reduce Beef Intake", desc: "Swap 4 beef meals with vegetarian meals weekly", category: "diet", icon: "utensils-crossed", savings: "0.8 tons" },
    { title: "Eliminate Shopping Waste", desc: "Shift shopping habits to conscious", category: "consumption", icon: "shopping-bag", savings: "0.6 tons" }
  ];

  recs.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'tailored-action-card';
    card.innerHTML = `
      <div class="t-left">
        <div class="t-icon-box">
          <i data-lucide="${rec.icon}"></i>
        </div>
        <div class="t-text">
          <h4>${rec.title}</h4>
          <p>${rec.desc}</p>
        </div>
      </div>
      <span class="t-impact">-${rec.savings}/yr</span>
    `;
    container.appendChild(card);
  });
  lucide.createIcons();
}
