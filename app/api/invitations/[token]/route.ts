import { getPublicInvitation } from "@/db/invitations";

function validToken(token: string) {
  return /^[A-Za-z0-9_-]{24,64}$/.test(token);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!validToken(token)) {
    return Response.json({ error: "Invitation not found." }, { status: 404 });
  }

  try {
    const result = await getPublicInvitation(token);
    if (!result) {
      return Response.json({ error: "Invitation not found." }, { status: 404 });
    }

    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Invitation lookup failed", error);
    return Response.json({ error: "The invitation could not be opened just now." }, { status: 500 });
  }
}
