"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCollections,
  addCollection,
  deleteCollection,
  getCollectionPosts,
  addToCollection,
} from "@/features/social/api";
import {
  renameCollection,
  removeFromCollection,
} from "@/features/integrations/api";
import { mediaUrl, isVideoFile } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
export function CollectionsBrowser({
  postId,
  onSaved,
}: {
  postId?: number;
  onSaved?: () => void;
}) {
  const client = useQueryClient();
  const list = useQuery({ queryKey: ["collections"], queryFn: getCollections });
  const [selected, setSelected] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const posts = useInfiniteQuery({
    queryKey: ["collection-posts", selected],
    queryFn: ({ pageParam }) => getCollectionPosts(selected!, pageParam),
    enabled: selected !== null && !postId,
    initialPageParam: 1,
    getNextPageParam: (last, pages) =>
      last.length === 12 ? pages.length + 1 : undefined,
  });
  const mutation = useMutation({
    mutationFn: async (
      kind: "create" | "rename" | "delete" | "add" | "remove",
    ) => {
      if (kind === "create") {
        const collection = await addCollection(name.trim());
        if (postId) await addToCollection(collection.id, postId);
        return;
      }
      if (kind === "rename") return renameCollection(selected!, name.trim());
      if (kind === "delete") return deleteCollection(selected!);
      if (kind === "add") return addToCollection(selected!, postId!);
      throw new Error("Select a post to remove.");
    },
    onSuccess: (_, kind) => {
      void client.invalidateQueries();
      setName("");
      setConfirmDelete(false);
      if (kind === "delete") setSelected(null);
      if (postId && (kind === "create" || kind === "add")) {
        toast("Saved to collection");
        onSaved?.();
      }
    },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) => removeFromCollection(selected!, id),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["collection-posts", selected],
      });
      void client.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <section aria-label="Collections" className="space-y-4 py-5">
      <h2 className="font-semibold">Collections</h2>
      {list.isPending && <p role="status">Loading collections…</p>}
      {list.isError && (
        <button
          onClick={() => void list.refetch()}
          className="text-ig-link-action"
        >
          Retry collections
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        {(list.data ?? []).map((c) => (
          <button
            key={c.id}
            aria-pressed={selected === c.id}
            onClick={() => {
              setSelected(c.id);
              setName(c.name);
              setConfirmDelete(false);
            }}
            className={`rounded-xl border px-4 py-3 ${selected === c.id ? "border-ig-primary" : "border-ig-stroke"}`}
          >
            {c.name} · {c.postsCount}
          </button>
        ))}
      </div>
      {!list.isPending && !list.isError && !list.data?.length && (
        <p className="text-ig-text-secondary">No collections yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) mutation.mutate("create");
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          aria-label="Collection name"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name"
          className="min-w-0 flex-1 rounded-lg border border-ig-stroke bg-transparent px-3 py-2"
        />
        <Button type="submit" disabled={!name.trim() || mutation.isPending}>
          New collection
        </Button>
        {selected !== null && (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={!name.trim() || mutation.isPending}
              onClick={() => mutation.mutate("rename")}
            >
              Rename collection
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={() =>
                confirmDelete
                  ? mutation.mutate("delete")
                  : setConfirmDelete(true)
              }
            >
              {confirmDelete
                ? "Confirm delete collection"
                : "Delete collection"}
            </Button>
            {postId && (
              <Button
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate("add")}
              >
                Save to collection
              </Button>
            )}
          </>
        )}
      </form>
      {selected !== null && !postId && (
        <>
          {posts.isPending && <p role="status">Loading collection…</p>}
          {posts.isError && (
            <button
              onClick={() => void posts.refetch()}
              className="text-ig-link-action"
            >
              Retry collection
            </button>
          )}
          {posts.data?.pages.flat().length === 0 && (
            <p className="text-ig-text-secondary">This collection is empty.</p>
          )}
          <div className="grid grid-cols-3 gap-1">
            {posts.data?.pages.flat().map((post) => (
              <div key={post.postId} className="min-w-0">
                <Link
                  href={`/p/${post.postId}`}
                  className="block aspect-[3/4] overflow-hidden bg-ig-bg-secondary"
                >
                  {post.images[0] &&
                    (isVideoFile(post.images[0]) ? (
                      <video
                        src={mediaUrl(post.images[0])!}
                        muted
                        preload="metadata"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Image
                        unoptimized
                        src={mediaUrl(post.images[0])!}
                        width={300}
                        height={400}
                        alt={post.title || `Post by ${post.userName}`}
                        className="size-full object-cover"
                      />
                    ))}
                </Link>
                <button
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(post.postId)}
                  className="py-2 text-xs text-ig-link-action"
                >
                  Remove from collection
                </button>
              </div>
            ))}
          </div>
          {posts.hasNextPage && (
            <Button
              disabled={posts.isFetchingNextPage}
              onClick={() => void posts.fetchNextPage()}
            >
              Load more collection posts
            </Button>
          )}
        </>
      )}
    </section>
  );
}
