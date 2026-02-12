/* Reads the list below, 
fetches profile, repos, & events for each, 
and writes to the data.json file */
const MEMBERS = [
  "rufai",
  "theonlySophia",
  "osemenjoy",
  "Byord-ml",
  "Ano-ly",
  "odunlemi",
  "cchukwuetoo",
  "cyryl1",
  "Daniel-Ojo-Williams",
  "DonaldOgbe",
  "ebun-amoo",
  "Ghiftee",
  "glaogideonelorm",
  "Zubbee18",
  "Sodiaro",
  "Purpose-Longe",
  "Precious-Bob",
  "osadeleke",
  "Macdavid28",
  "lowlifehighway",
  "KikiXoxo",
  "KazeemOluwanifemi",
  "JohnAkindipe",
  "GrimTech",
];

require("dotenv").config();
const PAT = process.env.GITHUB_PAT;
const fs = require("fs");

if (!PAT) {
  console.error("Error");
  process.exit(1);
}

if (MEMBERS.length === 0 || MEMBERS[0] === "username1") {
  console.error("Please fill in the members lsit at the top of the file.");
  process.exit(1);
}

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}  →  ${path}`);
  return res.json();
}

async function fetchMember(login) {
  console.log(`  Fetching @${login}…`);

  const [profile, repos, events] = await Promise.all([
    ghFetch(`/users/${login}`).catch((e) => {
      console.warn(`    ⚠ profile: ${e.message}`);
      return { login };
    }),
    ghFetch(`/users/${login}/repos?per_page=100&sort=pushed`).catch(() => []),
    ghFetch(`/users/${login}/events/public?per_page=20`).catch(() => []),
  ]);

  // total stars across all repos
  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

  // language frequency
  const langCount = {};
  repos.forEach((r) => {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  });
  const languages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)
    .slice(0, 5);

  // keeps only what the dashboard needs from events
  const recentEvents = events.slice(0, 5).map((e) => ({
    type: e.type,
    repo: e.repo.name,
    payload: {
      ...e.payload,
      // preserve commit count
      size: e.payload.size ?? e.payload.commits?.length ?? 0,
    },
    created_at: e.created_at,
  }));

  return {
    login: profile.login,
    name: profile.name || null,
    bio: profile.bio || null,
    avatar_url: profile.avatar_url || null,
    html_url: profile.html_url || `https://github.com/${login}`,
    public_repos: profile.public_repos ?? 0,
    followers: profile.followers ?? 0,
    stars,
    languages,
    recentEvents,
  };
}

async function main() {
  console.log(`\nFetching ${MEMBERS.length} member(s)…\n`);

  const results = [];
  for (const login of MEMBERS) {
    try {
      const data = await fetchMember(login);
      results.push(data);
    } catch (err) {
      console.warn(`  ✖ Skipping @${login}: ${err.message}`);
    }
  }

  const out = JSON.stringify(results, null, 2);
  fs.writeFileSync("data.json", out);

  console.log(
    `\n✓ Wrote data.json  (${results.length} member${results.length !== 1 ? "s" : ""})\n`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
