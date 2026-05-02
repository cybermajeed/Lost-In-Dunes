// public/js/ui.js
// Manages all modal / panel UI interactions

const UI = (() => {
  // ── Toast ───────────────────────────────
  let toastTimer = null;

  function toast(title, body, type = "info") {
    const el = document.getElementById("discovery-toast");
    el.innerHTML = `<div class="toast-title">${title}</div><div>${body}</div>`;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 5000);
  }

  // ── Artifact Modal ───────────────────────
  let currentArtifactId = null;

  function openArtifactModal(artifact) {
    currentArtifactId = artifact.id;

    document.getElementById("modal-code").textContent = artifact.code_name;
    document.getElementById("modal-location").textContent =
      artifact.location_name || "Unknown Location";
    document.getElementById("modal-material").textContent = artifact.material;
    document.getElementById("modal-age").textContent =
      `~${artifact.estimated_age.toLocaleString()} yrs`;
    document.getElementById("modal-condition").textContent = artifact.condition;
    document.getElementById("modal-status").textContent =
      artifact.status || "unanalyzed";

    const classSection = document.getElementById("classification-section");
    if (artifact.classified_type) {
      classSection.classList.remove("hidden");
      document.getElementById("modal-type").textContent =
        artifact.classified_type;
      document.getElementById("modal-civ").textContent =
        artifact.civilization || "—";
      document.getElementById("modal-confidence").textContent =
        artifact.confidence_level ? `${artifact.confidence_level}%` : "—";
    } else {
      classSection.classList.add("hidden");
    }

    document.getElementById("pattern-alert").classList.add("hidden");
    document.getElementById("analyze-btn").disabled =
      !!artifact.classified_type;
    document.getElementById("analyze-btn").textContent =
      artifact.classified_type ? "Already Analyzed" : "Analyze Artifact";
    document.getElementById("analyze-spinner").classList.add("hidden");

    document.getElementById("artifact-modal").classList.remove("hidden");
  }

  async function analyzeCurrentArtifact() {
    if (!currentArtifactId) return;
    const btn = document.getElementById("analyze-btn");
    const spinner = document.getElementById("analyze-spinner");

    btn.classList.add("hidden");
    spinner.classList.remove("hidden");

    try {
      const result = await API.analyze(currentArtifactId);
      const { classification, hypothesis, patternFound } = result;

      // Update modal
      const classSection = document.getElementById("classification-section");
      classSection.classList.remove("hidden");
      document.getElementById("modal-type").textContent = classification.type;
      document.getElementById("modal-civ").textContent =
        classification.civilization;
      document.getElementById("modal-confidence").textContent =
        `${classification.confidence_level}%`;
      document.getElementById("modal-theory").textContent =
        hypothesis.theory_text;
      document.getElementById("modal-status").textContent = "analyzed";

      if (patternFound) {
        document.getElementById("pattern-alert").classList.remove("hidden");
      }

      btn.disabled = true;
      btn.textContent = "Analyzed";
      btn.classList.remove("hidden");
      spinner.classList.add("hidden");

      // Award XP
      const xp = Math.floor(classification.confidence_level / 10) * 10 + 20;
      toast(
        "🧪 Analysis Complete",
        `Classified as ${classification.type} | +${xp} XP`,
        "success",
      );
      if (window.AppState?.player) {
        await API.addExperience(window.AppState.player.id, xp);
        updateHUD(null, xp);
      }
    } catch (err) {
      spinner.classList.add("hidden");
      btn.classList.remove("hidden");
      toast("Error", err.message, "error");
    }
  }

  // ── Logbook Modal ────────────────────────
  async function openLogbook() {
    document.getElementById("logbook-modal").classList.remove("hidden");
    await loadLogbook();
  }

  async function loadLogbook() {
    const material = document.getElementById("filter-material").value;
    const type = document.getElementById("filter-type").value;
    const sort = document.getElementById("sort-by").value;

    const tbody = document.getElementById("logbook-tbody");
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Loading…</td></tr>`;

    try {
      const filters = {};
      if (material) filters.material = material;
      if (type) filters.type = type;
      if (sort) filters.sort = sort;

      const { artifacts } = await API.getArtifacts(filters);
      if (!artifacts.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No artifacts found. Go explore!</td></tr>`;
        return;
      }

      tbody.innerHTML = artifacts
        .map(
          (a) => `
        <tr data-id="${a.id}" style="cursor:pointer">
          <td><strong>${a.code_name}</strong></td>
          <td>${a.material}</td>
          <td>${a.estimated_age?.toLocaleString() || "—"}</td>
          <td>${a.condition}</td>
          <td>${a.location_name || "—"}</td>
          <td>${
            a.classified_type
              ? `<span class="tag tag-${a.classified_type}">${a.classified_type}</span>`
              : '<span class="tag tag-unknown">unanalyzed</span>'
          }</td>
          <td>${a.civilization || "—"}</td>
          <td>${a.confidence_level ? a.confidence_level + "%" : "—"}</td>
          <td><button class="btn-secondary" style="padding:4px 10px;font-size:0.7rem" onclick="UI.openArtifactById(${a.id})">View</button></td>
        </tr>
      `,
        )
        .join("");
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">${err.message}</td></tr>`;
    }
  }

  async function openArtifactById(id) {
    try {
      const { artifact } = await API.getArtifact(id);
      document.getElementById("logbook-modal").classList.add("hidden");
      openArtifactModal(artifact);
    } catch (err) {
      toast("Error", err.message);
    }
  }

  // ── Patterns Modal ───────────────────────
  async function openPatterns() {
    document.getElementById("patterns-modal").classList.remove("hidden");
    const list = document.getElementById("patterns-list");
    list.innerHTML = '<p class="empty-state">Loading…</p>';

    try {
      const { patterns } = await API.getPatterns();
      if (!patterns.length) {
        list.innerHTML =
          '<p class="empty-state">No patterns detected yet. Analyze more artifacts.</p>';
        return;
      }
      list.innerHTML = patterns
        .map(
          (p) => `
        <div class="pattern-card">
          <h4>🏛 ${p.civilization} — ${p.material}</h4>
          <div class="pattern-stats">
            <span><strong>${p.artifact_count}</strong> artifacts</span>
            <span>Avg confidence: <strong>${Math.round(p.avg_confidence)}%</strong></span>
            <span>Age range: <strong>${p.youngest.toLocaleString()}–${p.oldest.toLocaleString()} yrs</strong></span>
          </div>
        </div>
      `,
        )
        .join("");
    } catch (err) {
      list.innerHTML = `<p class="empty-state">${err.message}</p>`;
    }
  }

  // ── HUD updater ──────────────────────────
  function updateHUD(player, xpGained = 0) {
    if (player) {
      document.getElementById("hud-name").textContent = player.name;
      document.getElementById("hud-level").textContent = player.level;
      const pct = ((player.experience % 500) / 500) * 100;
      document.getElementById("xp-bar").style.width = pct + "%";
    } else if (window.AppState?.player) {
      const p = window.AppState.player;
      p.experience = (p.experience || 0) + xpGained;
      p.level = Math.floor(p.experience / 500) + 1;
      const pct = ((p.experience % 500) / 500) * 100;
      document.getElementById("hud-level").textContent = p.level;
      document.getElementById("xp-bar").style.width = pct + "%";
    }
  }

  // ── Init bindings ────────────────────────
  function init() {
    // Artifact modal
    document.getElementById("artifact-modal-close").onclick = () =>
      document.getElementById("artifact-modal").classList.add("hidden");
    document.getElementById("analyze-btn").onclick = analyzeCurrentArtifact;

    // Logbook
    document.getElementById("logbook-btn").onclick = openLogbook;
    document.getElementById("logbook-modal-close").onclick = () =>
      document.getElementById("logbook-modal").classList.add("hidden");
    document.getElementById("apply-filters").onclick = loadLogbook;

    // Patterns
    document.getElementById("patterns-btn").onclick = openPatterns;
    document.getElementById("patterns-modal-close").onclick = () =>
      document.getElementById("patterns-modal").classList.add("hidden");

    // Close modals on backdrop click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    });
  }

  return { init, toast, openArtifactModal, openArtifactById, updateHUD };
})();
