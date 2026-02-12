/* Language colours */
const COLOURS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00add8",
  Ruby: "#701516",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Vue: "#42b883",
  Svelte: "#ff3e00",
  Nix: "#7e7eff",
};

const DEFAULT_COLOUR = "#7070a0";

function relTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) {
    return `${Math.floor(diff)}s ago`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  } else {
    return `${Math.floor(diff / 86400)}d ago`;
  }
}

function formatEvent(e) {
  const repo = e.repo.split("/")[1];
  switch (e.type) {
    /* events */
    case "PushEvent": {
      const n = e.payload.commits?.length || e.payload.size || 0;
      return `Pushed ${n} commit${n !== 1 ? "s" : ""} to ${repo}`;
    }

    case "PullRequestEvent":
      return `${e.payload.action} PR in ${repo}`;

    case "IssuesEvent":
      return `${e.payload.ref_type} in ${repo}`;

    case "CreateEvent":
      return `Created ${e.payload.ref_type} in ${repo}`;

    case "PullRequestReviewEvent":
      return `Released PR in ${repo}`;

    case "ReleaseEvent":
      return `Released ${e.payload.release?.tag_name || "version"} in ${repo}`;

    default:
      return e.type.replace("Event", "") + ` in ${repo}`;
  }
}

/* card */
function buildCard(i, index) {
  const card = document.createElement("div");
  card.className = "card";

  const body = document.createElement("div");
  body.className = "card-body";

  /* profile */
  body.innerHTML += `
    <div class="profile-row">
        <div class="profile-info">
            <div class="display-name">${i.name || i.login}</div>
            <div class="login"><a href="${i.html_url}" target="_blank">@${i.login} <span class="link-arrow">↗</span></a></div>
        </div>
    </div>
    `;

  /* bio */
  if (i.bio) {
    body.innerHTML += `<div class="bio">${i.bio}</div>`;
  }

  /* stats */
  body.innerHTML += `
    <div class="stats-row">
        <div class="stat">
          <div class="stat-value">${i.public_repos ?? 0}</div>
          <div class="stat-label">Repos</div>
        </div>
        <div class="stat">
          <div class="stat-value">${(i.stars ?? 0).toLocaleString()}</div>
          <div class="stat-label">Stars</div>
        </div>
        <div class="stat">
          <div class="stat-value">${i.followers ?? 0}</div>
          <div class="stat-label">Followers</div>
        </div>
    </div>
    `;

  /* languages */
  if (i.languages && i.languages.length) {
    const langHtml = i.languages
      .map((lang) => {
        const colour = COLOURS[lang] || DEFAULT_COLOUR;
        return `
        <span class="lang-tag">
            <span class="lang-dot" style="background:${colour}"></span>
            ${lang}
        </span>
        `;
      })
      .join("");
    body.innerHTML += `<div class="languages">${langHtml}</div>`;
  }

  card.innerHTML = `<img class="avatar-hero" src="${i.avatar_url}" alt="${i.login}" loading="lazy">`;

  card.appendChild(body);
  return card;
}

/* render the grid */
const grid = document.getElementById("grid");

async function init() {
  let members;
  try {
    const result = await fetch("data.json");
    if (!result.ok) throw new Error(`Could not load data (${result.status})`);
    members = await result.json();
  } catch (error) {
    grid.innerHTML = `
        <p style="font-family: var(--mono);font-size:0.85rem;color:red">
            Error ${error.message}. Make sure the data json file is in the same folder.
        </p>
        `;
    return;
  }

  if (!members.length) {
    grid.innerHTML = `
        <p style="font-family: var(--mono);font-size:0.85rem;color:red">
            The data json file is empty.
        </p>
    `;
    return;
  }

  document.getElementById("count").textContent =
    `${members.length} member${members.length !== 1 ? "s" : ""}`;

  members.forEach((i, y) => {
    try {
      grid.appendChild(buildCard(i, y));
    } catch (error) {
      console.log(`Failed to build a card for this @${i.login}:`, error);
    }
  });
}

init();
