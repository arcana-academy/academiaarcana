import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "healthy" }, { status: 200 });
}
