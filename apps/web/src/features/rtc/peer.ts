"use client";

import type { IceServer, RtcSignal } from "@repo/shared";

/**
 * Yak RTCPeerConnection bo yak user (zang yo efir).
 * - ICE candidate-hoe ki pesh az remoteDescription omadand, dar navbat memonand.
 * - `initiator` offer mesozad; tarafi digar answer.
 */
export class Peer {
  readonly pc: RTCPeerConnection;
  private pending: RTCIceCandidateInit[] = [];

  constructor(
    iceServers: IceServer[],
    private readonly send: (signal: RtcSignal) => void,
    onStream: (stream: MediaStream) => void,
    onState?: (state: RTCPeerConnectionState) => void,
  ) {
    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.send({ type: "candidate", candidate: e.candidate.toJSON() as RtcSignal["candidate"] });
    };
    // Har track (audio, bad video) → MediaStream-i nav, to <video> srcObject-ro az nav girad va tasvir hatman paydo shavad
    const remote = new MediaStream();
    this.pc.ontrack = (e) => {
      for (const t of [...(e.streams[0]?.getTracks() ?? []), e.track]) if (!remote.getTrackById(t.id)) remote.addTrack(t);
      onStream(new MediaStream(remote.getTracks()));
    };
    this.pc.onconnectionstatechange = () => {
      onState?.(this.pc.connectionState);
      // Shabaka ivaz shud → ICE-i nav
      if (this.pc.connectionState === "failed") this.pc.restartIce();
    };
  }

  addStream(stream: MediaStream) {
    stream.getTracks().forEach((t) => this.pc.addTrack(t, stream));
  }

  /** Kamera ivaz shud — bidun renegotiation */
  async replaceVideo(track: MediaStreamTrack) {
    const sender = this.pc.getSenders().find((s) => s.track?.kind === "video");
    await sender?.replaceTrack(track);
  }

  /** Faqat qabul (tamoshobini efir) */
  receiveOnly() {
    this.pc.addTransceiver("video", { direction: "recvonly" });
    this.pc.addTransceiver("audio", { direction: "recvonly" });
  }

  async offer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.send({ type: "offer", sdp: offer.sdp });
  }

  private chain: Promise<void> = Promise.resolve();

  /** Signal-ho bo tartib (offer pesh az candidate-ho), hatto agar paydarpay oyand */
  handle(signal: RtcSignal) {
    this.chain = this.chain.then(() => this.process(signal)).catch(() => undefined);
    return this.chain;
  }

  private async process(signal: RtcSignal) {
    if (signal.type === "offer" || signal.type === "answer") {
      await this.pc.setRemoteDescription({ type: signal.type, sdp: signal.sdp });
      for (const c of this.pending.splice(0)) await this.pc.addIceCandidate(c).catch(() => undefined);
      if (signal.type === "offer") {
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.send({ type: "answer", sdp: answer.sdp });
      }
      return;
    }
    if (!signal.candidate) return;
    if (!this.pc.remoteDescription) this.pending.push(signal.candidate);
    else await this.pc.addIceCandidate(signal.candidate).catch(() => undefined);
  }

  close() {
    this.pc.onicecandidate = null;
    this.pc.ontrack = null;
    this.pc.onconnectionstatechange = null;
    this.pc.close();
  }
}

/** Ovoz: echo / shovqin / baland-pastii xudkor — ovozi toza, bidun aks-sado */
const AUDIO: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
};

export type Facing = "user" | "environment";

const videoConstraints = (facing: Facing, exact: boolean): MediaTrackConstraints => ({
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
  facingMode: exact ? { exact: facing } : facing,
});

const isRetryable = (err: unknown) => ["OverconstrainedError", "NotFoundError"].includes((err as DOMException).name);

/** Kamera / mikrofon; kamerai pesh (ruy) — pesh-farz. Xatoi fahmo baroi toast */
export async function getMedia(video: boolean, facing: Facing = "user"): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone need HTTPS or localhost");
  try {
    if (!video) return await navigator.mediaDevices.getUserMedia({ audio: AUDIO, video: false });
    try {
      // Telefon: hatman kamerai pesh
      return await navigator.mediaDevices.getUserMedia({ audio: AUDIO, video: videoConstraints(facing, true) });
    } catch (err) {
      // Kompyuter: kamera "user" nadorad → har kamerai mavjud
      if (!isRetryable(err)) throw err;
      return await navigator.mediaDevices.getUserMedia({ audio: AUDIO, video: videoConstraints(facing, false) });
    }
  } catch (err) {
    const name = (err as DOMException).name;
    if (name === "NotAllowedError") throw new Error(video ? "Allow camera and microphone access" : "Allow microphone access");
    if (name === "NotFoundError") throw new Error(video ? "Camera or microphone not found" : "Microphone not found");
    throw new Error("Camera or microphone is busy");
  }
}

/** Faqat track-i video baroi ivazi kamera (pesh / qafo) */
export async function getCameraTrack(facing: Facing): Promise<MediaStreamTrack> {
  const stream = await navigator.mediaDevices
    .getUserMedia({ video: videoConstraints(facing, true) })
    .catch((err) => {
      if (!isRetryable(err)) throw err;
      return navigator.mediaDevices.getUserMedia({ video: videoConstraints(facing, false) });
    });
  const track = stream.getVideoTracks()[0];
  if (!track) throw new Error("Camera not found");
  return track;
}

export const stopStream = (stream: MediaStream | null | undefined) => stream?.getTracks().forEach((t) => t.stop());

/** "3:07" */
export function formatDuration(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}
