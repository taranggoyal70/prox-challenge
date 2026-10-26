export function GET() {
  return Response.json(
    { v: 1, status: "alive" },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
