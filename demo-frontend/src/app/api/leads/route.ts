import { NextResponse } from "next/server";

const CRM_ENDPOINT =
  process.env.CRM_WEBHOOK_URL ?? "http://localhost:3333/leads";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.formId || !body?.payload) {
    return NextResponse.json(
      { message: "Payload incompleto" },
      { status: 400 }
    );
  }

  try {
    const crmResponse = await fetch(CRM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        receivedAt: new Date().toISOString()
      })
    });

    if (!crmResponse.ok) {
      const detail = await crmResponse.text();
      throw new Error(detail);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CRM webhook error", error);
    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo enviar el lead al CRM simulado"
      },
      { status: 502 }
    );
  }
}
