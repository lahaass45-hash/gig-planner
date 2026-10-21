
const https = require("https");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, message: "Nur GET erlaubt." })
    };
  }

  const email = process.env.ICLOUD_EMAIL;
  const password = process.env.ICLOUD_APP_PASSWORD;

  if (!email || !password) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: "iCloud-Umgebungsvariablen fehlen in Netlify."
      })
    };
  }

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "caldav.icloud.com",
      path: "/",
      method: "PROPFIND",
      headers: {
        Authorization: "Basic " + Buffer.from(`${email}:${password}`).toString("base64"),
        Depth: "0",
        "Content-Type": "application/xml; charset=utf-8"
      },
      timeout: 10000
    }, (res) => {
      res.resume();

      resolve({
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: res.statusCode === 207 || res.statusCode === 200,
          icloudStatus: res.statusCode,
          message: res.statusCode === 207 || res.statusCode === 200
            ? "iCloud hat geantwortet."
            : "iCloud-Verbindung noch nicht bestätigt."
        })
      });
    });

    req.on("timeout", () => req.destroy(new Error("Timeout")));
    req.on("error", () => resolve({
      statusCode: 502,
      body: JSON.stringify({ ok: false, message: "iCloud-Verbindung fehlgeschlagen." })
    }));

    req.write('<?xml version="1.0" encoding="UTF-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>');
    req.end();
  });
};
