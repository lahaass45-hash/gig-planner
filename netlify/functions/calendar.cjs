exports.handler = async function (event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message: "Netlify Calendar Function läuft."
    })
  };
};
