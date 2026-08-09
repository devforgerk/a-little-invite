import {
  createInvitation,
  InvitationValidationError,
  parseInvitationInput,
} from "@/db/invitations";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 12_000) {
      return Response.json({ error: "Invitation details are too large." }, { status: 413 });
    }

    const input = parseInvitationInput(await request.json());
    const created = await createInvitation(input);
    const origin = new URL(request.url).origin;

    return Response.json(
      {
        shareUrl: `${origin}/i/${created.publicToken}`,
        statusUrl: `${origin}/s/${created.statusToken}`,
        expiresAt: created.expiresAt,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof InvitationValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("Invitation creation failed", error);
    return Response.json({ error: "The invitation could not be created just now." }, { status: 500 });
  }
}
