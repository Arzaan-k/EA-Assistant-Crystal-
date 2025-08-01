import { GoogleAuth } from "google-auth-library"

const auth = new GoogleAuth({
  credentials: {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
  },
  scopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
})

export async function getGoogleClient(accessToken: string) {
  const client = auth.fromAPIKey(process.env.GOOGLE_API_KEY!)
  client.setCredentials({ access_token: accessToken })
  return client
}

export { auth }
