declare global {
  namespace Cloudflare {
    type Env = {
      AI: {
        run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
      };
      AI_RATE_LIMITS: {
        get: (key: string) => Promise<string | null>;
        put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
      };
    };
  }
  type PagesFunction<Env = unknown> = (
    context: {
      request: Request;
      env: Env;
      params: Record<string, string | string[]>;
      data: Record<string, unknown>;
      next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
      waitUntil: (promise: Promise<unknown>) => void;
    }
  ) => Response | Promise<Response>;
}

export {};
