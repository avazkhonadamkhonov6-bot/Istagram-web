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
    this.pc.ontrack = (e) => onStream(e.streams[0] ?? new MediaStream([e.track]));
    this.pc.onconnectionstatechange = () => {
      onState?.(this.pc.connectionState);
      // Shabaka ivaz shud → ICE-i nav
      if (this.pc.connectionState === "failed") this.pc.restartIce();
    };
  }

  addStream(stream: MediaStream) {
    stream.getTracks().forEach((t) => this.pc.addTrack(t, stream));
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

/** Kamera / mikrofon; xatoi fahmo baroi toast */
export async function getMedia(video: boolean): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone need HTTPS or localhost");
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
    });
  } catch (err) {
    const name = (err as DOMException).name;
    if (name === "NotAllowedError") throw new Error(video ? "Allow camera and microphone access" : "Allow microphone access");
    if (name === "NotFoundError") throw new Error(video ? "Camera or microphone not found" : "Microphone not found");
    throw new Error("Camera or microphone is busy");
  }
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
