import type { NextApiRequest } from "next";

export interface ResourceSessionUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  npm?: string;
  organizationalCode?: string;
}

interface ResourceSessionResponse {
  user: ResourceSessionUser | null;
}

const DEFAULT_RESOURCE_SESSION_URL =
  "https://resource.csui.dev/api/auth/session";
const RESOURCE_SESSION_COOKIE =
  process.env.RESOURCE_CSUI_SESSION_COOKIE?.trim() || "session";
const SESSION_LOOKUP_TIMEOUT_MS = 1500;

export async function getResourceSessionUser(
  req: NextApiRequest
): Promise<ResourceSessionUser | null> {
  const sessionToken = req.cookies[RESOURCE_SESSION_COOKIE];

  if (!sessionToken) {
    return null;
  }

  const sessionUrl =
    process.env.RESOURCE_CSUI_SESSION_URL?.trim() ||
    DEFAULT_RESOURCE_SESSION_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(sessionUrl, {
      headers: {
        cookie: `${RESOURCE_SESSION_COOKIE}=${sessionToken}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as ResourceSessionResponse;
    return body.user ?? null;
  } catch (error) {
    console.warn("Failed to resolve resource-csui session", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
