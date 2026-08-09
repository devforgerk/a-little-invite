import {
  InvitationValidationError,
  parseResponseInput,
  submitInvitationResponse,
} from "@/db/invitations";

function validToken(token: string) {
  return /^[A-Za-z0-9_-]{24,64}$/.test(token);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!validToken(token)) {
    return Response.json({ error: "Invitation not found." }, { status: 404 });
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 2_000) {
      return Response.json({ error: "Response is too large." }, { status: 413 });
    }

    const response = parseResponseInput(await request.json());
    const result = await submitInvitationResponse(token, response);

    if (result.outcome === "missing") {
      return Response.json({ error: "Invitation not found." }, { status: 404 });
    }
    if (result.outcome === "expired") {
      return Response.json({ error: "This invitation has expired." }, { status: 410 });
    }
    if (result.outcome === "responded") {
      return Response.json(
        { error: "This invitation already has a response." },
        { status: 409 },
      );
    }

    return Response.json(result.response, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof InvitationValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("Invitation response failed", error);
    return Response.json({ error: "Your response could not be saved just now." }, { status: 500 });
  }
}
