import { loadConfig } from "@/config";
import { buildReadiness } from "@/domain/readiness";
import { ArcLensError } from "@/domain/errors";
import { getKnowledgeStatus } from "@/knowledge";

export function GET() {
  try {
    const readiness = buildReadiness(loadConfig(), getKnowledgeStatus());
    return Response.json(readiness, {
      status: readiness.ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const arclensError =
      error instanceof ArcLensError
        ? error
        : new ArcLensError({
            code: "ARCLENS_READINESS_FAILED",
            status: 503,
            retryable: false,
            problem: "ArcLens readiness could not be established.",
            cause: "Configuration or committed knowledge validation failed during startup.",
            fix: "Run `npm run doctor` and follow the first failing check.",
            docsUrl: "/docs/errors#arclens-readiness-failed",
          });

    return Response.json({ v: 1, ready: false, error: arclensError.toJSON() }, {
      status: arclensError.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
