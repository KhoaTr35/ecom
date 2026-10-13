import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong, please try again" } },
    { status: 500 },
  );
}
