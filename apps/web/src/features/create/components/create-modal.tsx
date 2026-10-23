"use client";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Images,
  Upload,
} from "lucide-react";
import { PhotoTags } from "./photo-tags";
import { postDtoSchema, type PostTagInput } from "@repo/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";
import { useUiStore } from "@/store/ui.store";

type Kind = "post" | "reel" | "story";
const TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const ratios = {
  Original: "auto",
  Square: "1 / 1",
  Portrait: "4 / 5",
  Landscape: "16 / 9",
};

type Media = { file: File; url: string };
async function crop(file: File, ratio: string): Promise<File> {
  if (
    ratio === "auto" ||
    !file.type.startsWith("image/") ||
    file.type === "image/gif"
  )
    return file;
  const bitmap = await createImageBitmap(file);
  try {
    const [a, b] = ratio.split("/").map(Number);
    const target = a / b;
    const width = Math.min(bitmap.width, bitmap.height * target);
    const height = width / target;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1920 / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare image.");
    context.drawImage(
      bitmap,
      (bitmap.width - width) / 2,
      (bitmap.height - height) / 2,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not crop image."))),
        "image/jpeg",
        0.92,
      ),
    );
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } finally {
    bitmap.close();
  }
}

export function CreateModal() {
  const open = useUiStore((s) => s.createOpen);
  const setOpen = useUiStore((s) => s.setCreateOpen);
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>("post");
  const [media, setMedia] = useState<Media[]>([]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [ratio, setRatio] = useState("auto");
  const [tags, setTags] = useState<PostTagInput[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [closeFriends, setCloseFriends] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  const upload = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      if (kind === "story") {
        form.set("Image", media[0].file);
        return api(`/Story/AddStories?CloseFriends=${closeFriends}`, {
          method: "POST",
          body: form,
        });
      }
      for (const item of media)
        form.append("Images", await crop(item.file, ratio));
      if (caption.trim()) form.set("Content", caption.trim());
      if (location.trim()) form.set("Location", location.trim());
      if (kind === "post" && tags.length)
        form.set("Tags", JSON.stringify(tags));
      return api("/Post/add-post", {
        method: "POST",
        body: form,
        schema: postDtoSchema,
      });
    },
    onSuccess: () => {
      setStep(3);
      void qc.invalidateQueries();
    },
  });
  const close = () => {
    if (upload.isPending) return;
    setOpen(false);
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current = [];
    setMedia([]);
    setTags([]);
    setCaption("");
    setLocation("");
    setCloseFriends(false);
    setIndex(0);
    setStep(0);
    setError("");
    setRatio("auto");
    upload.reset();
  };
  const pick = async (files: File[]) => {
    setError("");
    if (!files.length) return;
    if (files.length > (kind === "post" ? 10 : 1)) {
      setError(
        kind === "post" ? "Choose up to 10 files." : "Choose exactly one file.",
      );
      return;
    }
    if (files.some((f) => !TYPES.includes(f.type))) {
      setError("Use JPEG, PNG, WebP, GIF, MP4, WebM or MOV.");
      return;
    }
    if (kind === "reel" && !files[0].type.startsWith("video/")) {
      setError("Choose one video for a reel.");
      return;
    }
    if (
      files.some(
        (f) => f.size > (f.type.startsWith("video/") ? 100 : 10) * 1024 * 1024,
      )
    ) {
      setError("Images must be under 10 MB and videos under 100 MB.");
      return;
    }
    for (const file of files.filter((f) => f.type.startsWith("video/"))) {
      const url = URL.createObjectURL(file);
      try {
        await new Promise<void>((resolve, reject) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = () => {
            const duration = video.duration;
            video.removeAttribute("src");
            video.load();
            if (duration <= (kind === "story" ? 60 : 90)) resolve();
            else
              reject(
                new Error(
                  kind === "story"
                    ? "Stories can be up to 60 seconds."
                    : "Videos can be up to 90 seconds.",
                ),
              );
          };
          video.onerror = () =>
            reject(new Error("This video could not be opened."));
          video.src = url;
        });
      } catch (e) {
        setError((e as Error).message);
        return;
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    const selected = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    urls.current = selected.map((m) => m.url);
    setMedia(selected);
    setTags([]);
    setIndex(0);
    setStep(1);
  };
  const current = media[index];
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent
        showClose={!upload.isPending}
        className="ig-create-dialog max-w-[850px]"
        aria-describedby="create-description"
      >
        <header className="flex h-14 items-center justify-between border-b border-ig-separator px-4 pr-12">
          {step > 0 && step < 3 ? (
            <button
              aria-label="Go back"
              disabled={upload.isPending}
              onClick={() => {
                setStep((s) => s - 1);
                upload.reset();
              }}
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <DialogTitle>
            {step === 3
              ? "Post shared"
              : step === 1
                ? "Crop"
                : step === 2
                  ? "Create new " + kind
                  : "Create new post"}
          </DialogTitle>
          {step === 1 ? (
            <Button variant="borderless" onClick={() => setStep(2)}>
              Next
            </Button>
          ) : step === 2 ? (
            <Button
              variant="borderless"
              disabled={upload.isPending}
              onClick={() => upload.mutate()}
            >
              {upload.isPending ? <Spinner className="size-4" /> : "Share"}
            </Button>
          ) : (
            <span />
          )}
        </header>
        <DialogDescription id="create-description" className="sr-only">
          Select media, adjust the crop and share your post, reel or story.
        </DialogDescription>
        {step === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void pick(Array.from(e.dataTransfer.files));
            }}
            className={`ig-create-dropzone flex min-h-[420px] flex-col items-center justify-center gap-5 p-6 ${dragging ? "bg-ig-bg-highlight" : ""}`}
          >
            <div
              className="mb-5 flex gap-2"
              role="group"
              aria-label="Publication type"
            >
              {(["post", "reel", "story"] as const).map((k) => (
                <Button
                  key={k}
                  variant={kind === k ? "primary" : "secondary"}
                  onClick={() => setKind(k)}
                  className="capitalize"
                >
                  {k}
                </Button>
              ))}
              <Link
                href="/live/new"
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-lg bg-ig-secondary px-4 text-sm font-semibold text-ig-btn-secondary-text hover:bg-ig-secondary-hover"
              >
                Live
              </Link>
            </div>
            <Images className="size-20 stroke-1" />
            <p className="text-xl">Drag photos and videos here</p>
            <Button onClick={() => input.current?.click()}>
              <Upload className="size-4" /> Select from computer
            </Button>
            <input
              ref={input}
              className="hidden"
              type="file"
              aria-label="Choose media"
              accept={
                kind === "reel"
                  ? TYPES.filter((t) => t.startsWith("video")).join(",")
                  : TYPES.join(",")
              }
              multiple={kind === "post"}
              onChange={(e) => {
                void pick(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
        ) : step === 3 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-5">
            <span className="rounded-full bg-[image:var(--ig-brand-gradient)] p-5 text-ig-text-on-color">
              <Check className="size-12" />
            </span>
            <p className="text-xl">Your {kind} has been shared.</p>
            <Button variant="secondary" onClick={close}>
              Done
            </Button>
          </div>
        ) : (
          <div className="flex max-h-[70dvh] flex-col overflow-y-auto md:flex-row">
            <div className="relative grid min-h-64 flex-1 place-items-center overflow-hidden bg-ig-bg-secondary">
              {current &&
                (current.file.type.startsWith("video/") ? (
                  <video
                    src={current.url}
                    controls
                    playsInline
                    className="max-h-[60dvh] w-full object-contain"
                  />
                ) : (
                  <Image
                    unoptimized
                    width={800}
                    height={800}
                    src={current.url}
                    alt={`Selected media ${index + 1}`}
                    style={{ aspectRatio: ratio }}
                    className="max-h-[60dvh] w-full object-cover"
                  />
                ))}
              {media.length > 1 && (
                <>
                  <button
                    aria-label="Previous media"
                    onClick={() =>
                      setIndex((i) => (i - 1 + media.length) % media.length)
                    }
                    className="absolute left-3 rounded-full bg-ig-bg p-1"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    aria-label="Next media"
                    onClick={() => setIndex((i) => (i + 1) % media.length)}
                    className="absolute right-3 rounded-full bg-ig-bg p-1"
                  >
                    <ChevronRight />
                  </button>
                  <span className="absolute right-3 top-3 rounded-full bg-ig-media-blur px-3 py-1 text-xs text-ig-text-on-media">
                    {index + 1}/{media.length}
                  </span>
                </>
              )}
            </div>
            <div className="w-full space-y-4 border-l border-ig-separator p-5 md:w-[300px]">
              {step === 1 ? (
                <>
                  <p className="font-semibold">Aspect ratio</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ratios).map(([label, value]) => (
                      <Button
                        key={label}
                        variant={ratio === value ? "primary" : "secondary"}
                        onClick={() => setRatio(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-ig-text-secondary">
                    Photos are cropped from the center. Videos and animated GIFs
                    keep their original format.
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor="post-caption" className="block font-semibold">
                    Write a caption
                  </label>
                  <textarea
                    id="post-caption"
                    maxLength={2200}
                    rows={8}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption…"
                    className="w-full resize-none bg-transparent outline-none"
                    disabled={kind === "story"}
                  />
                  <p className="text-right text-xs text-ig-text-secondary">
                    {caption.length}/2,200
                  </p>
                  {kind !== "story" && (
                    <label className="block text-sm">
                      Add location
                      <input
                        aria-label="Add location"
                        maxLength={100}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-ig-stroke bg-transparent px-3 py-2"
                      />
                    </label>
                  )}
                  {kind === "post" &&
                    current?.file.type.startsWith("image/") && (
                      <PhotoTags
                        tags={tags}
                        onChange={setTags}
                        imageIndex={index}
                      />
                    )}
                  {kind === "story" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={closeFriends}
                        onChange={(e) => setCloseFriends(e.target.checked)}
                      />
                      Close friends only
                    </label>
                  )}
                  {kind === "story" && (
                    <p className="text-xs text-ig-text-secondary">
                      Your story will be visible for 24 hours.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {(error || upload.isError) && (
          <p
            role="alert"
            className="border-t border-ig-separator px-6 py-3 text-sm text-ig-error"
          >
            {error || upload.error?.message || "Could not share. Try again."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
