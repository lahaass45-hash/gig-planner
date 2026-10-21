
export default async (request) => {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Netlify Calendar Function läuft."
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
};


