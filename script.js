(() => {
  "use strict";

  const timer = document.getElementById("timer");
  const startPauseButton = document.getElementById("start-pause");
  const primaryIcon = document.getElementById("primary-icon");
  const primaryLabel = document.getElementById("primary-label");
  const lapButton = document.getElementById("lap-button");
  const resetButton = document.getElementById("reset-button");
  const clearLapsButton = document.getElementById("clear-laps");
  const lapsList = document.getElementById("laps-list");
  const emptyState = document.getElementById("empty-state");
  const lapCount = document.getElementById("lap-count");
  const statusPill = document.getElementById("status-pill");
  const statusText = document.getElementById("status-text");

  let running = false;
  let startTimestamp = 0;
  let elapsedBeforeStart = 0;
  let animationFrame = null;
  let lastLapElapsed = 0;
  let laps = [];

  const formatTime = (milliseconds, showHours = false) => {
    const totalCentiseconds = Math.floor(milliseconds / 10);
    const centiseconds = totalCentiseconds % 100;
    const totalSeconds = Math.floor(totalCentiseconds / 100);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const pad = (value) => String(value).padStart(2, "0");
    const main = showHours || hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(totalMinutes)}:${pad(seconds)}`;
    return `${main}<span class="milliseconds">.${pad(centiseconds)}</span>`;
  };

  const currentElapsed = () => running
    ? elapsedBeforeStart + (performance.now() - startTimestamp)
    : elapsedBeforeStart;

  function renderTimer() {
    timer.innerHTML = formatTime(currentElapsed());
    if (running) animationFrame = requestAnimationFrame(renderTimer);
  }

  function setStatus(status) {
    statusPill.classList.remove("running", "paused");
    if (status === "Running") statusPill.classList.add("running");
    if (status === "Paused") statusPill.classList.add("paused");
    statusText.textContent = status;
  }

  function updateControls() {
    primaryLabel.textContent = running ? "Pause" : (elapsedBeforeStart > 0 ? "Resume" : "Start");
    primaryIcon.textContent = running ? "Ⅱ" : "▶";
    lapButton.disabled = !running;
    resetButton.disabled = elapsedBeforeStart === 0 && laps.length === 0 && !running;
    clearLapsButton.disabled = laps.length === 0;
  }

  function startTimer() {
    if (running) return;
    running = true;
    startTimestamp = performance.now();
    setStatus("Running");
    renderTimer();
    updateControls();
  }

  function pauseTimer() {
    if (!running) return;
    elapsedBeforeStart = currentElapsed();
    running = false;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    timer.innerHTML = formatTime(elapsedBeforeStart);
    setStatus("Paused");
    updateControls();
  }

  function renderLaps() {
    lapsList.replaceChildren();
    if (laps.length === 0) {
      lapsList.appendChild(emptyState);
      lapCount.textContent = "No laps recorded";
      updateControls();
      return;
    }

    lapCount.textContent = `${laps.length} ${laps.length === 1 ? "lap" : "laps"} recorded`;
    const fastest = Math.min(...laps.map((lap) => lap.duration));
    const slowest = Math.max(...laps.map((lap) => lap.duration));

    [...laps].reverse().forEach((lap) => {
      const row = document.createElement("div");
      row.className = "lap-row";
      if (laps.length > 1 && lap.duration === fastest) row.classList.add("fastest");
      if (laps.length > 1 && lap.duration === slowest) row.classList.add("slowest");

      const number = document.createElement("span");
      number.className = "lap-number";
      number.textContent = `LAP ${String(lap.number).padStart(2, "0")}`;

      const time = document.createElement("span");
      time.className = "lap-time";
      time.textContent = formatPlainTime(lap.duration);

      const total = document.createElement("span");
      total.className = "lap-total";
      total.textContent = formatPlainTime(lap.total);

      row.append(number, time, total);
      lapsList.appendChild(row);
    });
    updateControls();
  }

  function formatPlainTime(milliseconds) {
    const centiseconds = Math.floor(milliseconds / 10);
    const cs = centiseconds % 100;
    const totalSeconds = Math.floor(centiseconds / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }

  function recordLap() {
    if (!running) return;
    const total = currentElapsed();
    const duration = total - lastLapElapsed;
    laps.push({ number: laps.length + 1, duration, total });
    lastLapElapsed = total;
    renderLaps();
  }

  function resetTimer() {
    running = false;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    elapsedBeforeStart = 0;
    startTimestamp = 0;
    lastLapElapsed = 0;
    laps = [];
    timer.innerHTML = formatTime(0);
    setStatus("Ready");
    renderLaps();
    updateControls();
  }

  startPauseButton.addEventListener("click", () => {
    if (running) pauseTimer();
    else startTimer();
  });
  lapButton.addEventListener("click", recordLap);
  resetButton.addEventListener("click", resetTimer);
  clearLapsButton.addEventListener("click", () => {
    laps = [];
    lastLapElapsed = currentElapsed();
    renderLaps();
  });

  document.getElementById("year").textContent = new Date().getFullYear();
  renderLaps();
  updateControls();
})();
