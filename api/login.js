import crypto from "crypto";

const { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } = process.env;

const SCOPES = [
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-email",
].join(" ");

export default function handler(req, res) {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_REDIRECT_URI) {
    res.status(500).json({ error: "Spotify environment variables missing." });
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `spotify_auth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope: SCOPES,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
    show_dialog: "true",
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
