const GITHUB_USER = "EEEEdward-0";

const json = (payload, init = {}) =>
  new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=1800",
      ...init.headers,
    },
  });

const githubHeaders = (env) => {
  const token = env.GITHUB_TOKEN || env.GH_TOKEN || env.GITHUB_API_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "edward-personal-site",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function onRequestGet({ env }) {
  try {
    const headers = githubHeaders(env);
    const reposResponse = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
      { headers }
    );

    if (!reposResponse.ok) {
      return json(
        {
          error: "GitHub repositories unavailable",
          status: reposResponse.status,
        },
        { status: 502 }
      );
    }

    const repos = await reposResponse.json();
    const publicRepos = repos.filter((repo) => !repo.fork && repo.languages_url).slice(0, 24);
    const languageMaps = await Promise.all(
      publicRepos.map(async (repo) => {
        const response = await fetch(repo.languages_url, { headers });
        if (!response.ok) return {};
        return response.json();
      })
    );

    const totals = languageMaps.reduce((acc, languages) => {
      Object.entries(languages).forEach(([language, bytes]) => {
        acc[language] = (acc[language] || 0) + bytes;
      });
      return acc;
    }, {});

    if (Object.keys(totals).length === 0) {
      return json({ error: "No language data" }, { status: 404 });
    }

    return json({
      totals,
      sourceText: "基于 GitHub 公开仓库语言字节数统计。",
    });
  } catch (error) {
    return json(
      {
        error: "GitHub language request failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
