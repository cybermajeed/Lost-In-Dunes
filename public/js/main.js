// public/js/main.js
// App bootstrap – ties login, game, UI together

window.AppState = {
  player: null,
  locations: [],
};

async function boot() {
  UI.init();
  bindLogin();
}

function bindLogin() {
  const input = document.getElementById("player-name-input");
  const btn = document.getElementById("start-btn");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });

  btn.addEventListener("click", async () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "Loading expedition…";

    try {
      // 1. Get/create player from DB
      const { player } = await API.getOrCreatePlayer(name);
      window.AppState.player = player;

      // 2. Fetch locations from DB
      const { locations } = await API.getLocations();
      window.AppState.locations = locations;

      // 3. Switch to game screen
      document.getElementById("login-screen").classList.remove("active");
      document.getElementById("game-screen").classList.add("active");

      // 4. Init canvas with DB locations
      Game.init(locations);
      UI.updateHUD(player);

      // 5. Hook discovery callback
      Game.setOnDiscovery(handleDiscovery);

      if (player.created) {
        UI.toast(
          "Welcome, Archaeologist",
          `Field log created for ${player.name}. Good luck.`,
        );
      } else {
        UI.toast(
          "Welcome back",
          `${player.name} — Level ${player.level} | ${player.experience} XP`,
        );
      }
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Begin Expedition";
      UI.toast("Connection Error", err.message);
      console.error(err);
    }
  });
}

// Called by Game when player walks onto a discovery spot
async function handleDiscovery(spot) {
  UI.toast("📍 Discovery Site", `You reached: ${spot.name} — investigating…`);

  try {
    const { discovered, artifact, location, message } = await API.discover(
      window.AppState.player.id,
      spot.locationId,
    );

    if (!discovered) {
      UI.toast(
        "🏜 Nothing found",
        message || "The sands hold no secrets here.",
      );
      Game.resetSpot(spot.locationId);
      return;
    }

    Sound.play("discover");

    // Award XP for discovery
    const xp = 30 + spot.richness * 5;
    await API.addExperience(window.AppState.player.id, xp);
    UI.updateHUD(null, xp);

    UI.toast(
      `🏺 Artifact Found!`,
      `${artifact.code_name} — ${artifact.material} (${artifact.condition}) — +${xp} XP`,
    );

    // Small delay then open artifact modal
    setTimeout(async () => {
      try {
        const { artifact: full } = await API.getArtifact(artifact.id);
        UI.openArtifactModal(full);
      } catch (_) {
        UI.openArtifactModal({ ...artifact, location_name: location?.name });
      }
    }, 800);

    Game.resetSpot(spot.locationId);
  } catch (err) {
    UI.toast("Error", err.message);
    Game.resetSpot(spot.locationId);
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", boot);
