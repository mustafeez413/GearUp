const fs = require('fs');
const path = require('path');

/**
 * Railway/cloud: paste service account JSON into GOOGLE_CREDENTIALS_JSON.
 * Local dev: use GOOGLE_APPLICATION_CREDENTIALS pointing at a file.
 */
function prepareGoogleCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return;
  }

  const raw = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!raw) {
    return;
  }

  const configDir = path.join(__dirname, '..', 'config');
  const credPath = path.join(configDir, 'google-credentials.json');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(credPath, raw, { encoding: 'utf8', mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

module.exports = { prepareGoogleCredentials };
