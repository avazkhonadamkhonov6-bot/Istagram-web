import {
  callDtoSchema,
  iceServerSchema,
  liveCommentDtoSchema,
  liveDtoSchema,
  type CallDto,
  type IceServer,
  type LiveCommentDto,
  type LiveDto,
} from "@repo/shared";
import { api } from "@/lib/api-client";

/** Endpoint-hoi zang va efir (Spec 16) tavassuti BFF */

const json = (body: unknown) => ({ headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

let iceCache: Promise<IceServer[]> | null = null;
/** STUN / TURN az API (yak bor baroi sahifa) */
export function getIceServers(): Promise<IceServer[]> {
  iceCache ??= api<IceServer[]>("/Call/get-ice-servers", { schema: iceServerSchema.array() }).catch((err) => {
    iceCache = null;
    throw err;
  });
  return iceCache;
}

// ---- Zang (§2) ----
export const startCall = (chatId: number, type: CallDto["type"]) =>
  api<CallDto>("/Call/start-call", { method: "POST", ...json({ chatId, type }), schema: callDtoSchema });
export const acceptCall = (callId: number) => api<CallDto>(`/Call/accept-call?callId=${callId}`, { method: "POST", schema: callDtoSchema });
export const declineCall = (callId: number) => api<CallDto>(`/Call/decline-call?callId=${callId}`, { method: "POST", schema: callDtoSchema });
export const endCall = (callId: number) => api<CallDto>(`/Call/end-call?callId=${callId}`, { method: "POST", schema: callDtoSchema });
export const getActiveCalls = () => api<CallDto[]>("/Call/get-active-calls", { schema: callDtoSchema.array() });

// ---- Efir (§3) ----
export const startLive = (title?: string) => api<LiveDto>("/Live/start-live", { method: "POST", ...json(title ? { title } : {}), schema: liveDtoSchema });
export const endLive = (liveId: number) => api<LiveDto>(`/Live/end-live?liveId=${liveId}`, { method: "POST", schema: liveDtoSchema });
export const getLives = () => api<LiveDto[]>("/Live/get-lives", { schema: liveDtoSchema.array() });
export const getLive = (liveId: number) => api<LiveDto>(`/Live/get-live-by-id?liveId=${liveId}`, { schema: liveDtoSchema });
export const getLiveComments = (liveId: number) =>
  api<LiveCommentDto[]>(`/Live/get-comments?liveId=${liveId}`, { schema: liveCommentDtoSchema.array() });
export const addLiveComment = (liveId: number, text: string) =>
  api<LiveCommentDto>("/Live/add-comment", { method: "POST", ...json({ liveId, text }), schema: liveCommentDtoSchema });
