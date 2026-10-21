
exports.handler = async function (event, context) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify({
      ok: true,
      message: "Netlify Calendar Function läuft."
    })
  };
};
