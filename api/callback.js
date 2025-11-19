import cookie from "cookie";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} = process.env;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { code, state } = req.query;
  const cookies = cookie.parse(req.headers.cookie || "");
  const storedState = cookies.spotify_auth_state;

  if (!state || state !== storedState) {
    res.status(400).json({ error: "State mismatch" });
    return;
  }

  res.setHeader(
    "Set-Cookie",
    "spotify_auth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure"
  );

  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  try {
    const basicAuth = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      res
        .status(500)
        .json({ error: "Failed to fetch token", details: errorBody });
      return;
    }

    const tokenData = await tokenResponse.json();
    res.status(200).json(tokenData);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Token exchange failed", details: err.message });
  }
}
