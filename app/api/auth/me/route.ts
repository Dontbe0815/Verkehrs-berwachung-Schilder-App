import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/session";
export async function GET(){ const s=getSessionFromCookies(); if(!s) return NextResponse.json(null,{status:401}); return NextResponse.json({ username:s.sub, role:s.role }); }
