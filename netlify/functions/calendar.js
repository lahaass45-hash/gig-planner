
exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Bitte GET verwenden."
      })
    };
  }

  const email = process.env.ICLOUD_EMAIL;
  const password = process.env.ICLOUD_APP_PASSWORD;

  if (!email || !password) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        connected: false,
        error: "iCloud-Zugangsdaten fehlen in Netlify."
      })
    };
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <d:propfind xmlns:d="DAV:">
      <d:prop>
        <d:current-user-principal/>
      </d:prop>
    </d:propfind>`;

  try {
    const authorization =
      "Basic " +
      Buffer.from(`${email}:${password}`).toString("base64");

    let url = "https://caldav.icloud.com/";

    for (let i = 0; i < 5; i++) {
      const response = await fetch(url, {
        method: "PROPFIND",
        redirect: "manual",
        headers: {
          "Authorization": authorization,
          "Depth": "0",
          "Content-Type": "application/xml; charset=utf-8"
        },
        body: xml,
        signal: AbortSignal.timeout(10000)
      });

      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");

        if (!location) {
          throw new Error("Weiterleitung ohne Ziel.");
        }

        const next = new URL(location, url);

        if (
          next.protocol !== "https:" ||
          !(
            next.hostname === "icloud.com" ||
            next.hostname.endsWith(".icloud.com")
          )
        ) {
          throw new Error("Unsicheres Weiterleitungsziel.");
        }

        url = next.href;
        continue;
      }

      if (response.status === 207) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            connected: true,
            message: "iCloud-CalDAV antwortet erfolgreich."
          })
        };
      }

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          connected: false,
          error:
            response.status === 401
              ? "Anmeldung fehlgeschlagen. Zugangsdaten prüfen."
              : `iCloud antwortet mit HTTP ${response.status}.`
        })
      };
    }

    throw new Error("Zu viele Weiterleitungen.");
  } catch {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        connected: false,
        error: "Verbindung fehlgeschlagen. Netlify-Logs prüfen."
      })
    };
  }
};

