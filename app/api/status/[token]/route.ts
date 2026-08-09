import { getStatusInvitation } from "@/db/invitations";

function validToken(token: string) {
  return /^[A-Za-z0-9_-]{32,72}$/.test(token);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!validToken(token)) {
    return Response.json({ error: "Private status page not found." }, { status: 404 });
  }

  try {
    const result = await getStatusInvitation(token);
    if (!result) {
      return Response.json({ error: "Private status page not found." }, { status: 404 });
    }

    const origin = new URL(request.url).origin;
    return Response.json(
      {
        invitation: result.invitation,
        response: result.response,
        shareUrl: `${origin}/i/${result.publicToken}`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Invitation status lookup failed", error);
    return Response.json({ error: "The response status could not be loaded just now." }, { status: 500 });
  }
}
