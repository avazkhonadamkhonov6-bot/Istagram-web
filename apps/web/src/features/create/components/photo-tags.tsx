"use client";

import { useEffect, useState } from "react";
import { postTagsInputSchema, type PostTagInput } from "@repo/shared";
import { useUserSearch } from "@/features/search/hooks";
import { Button } from "@/components/ui/button";

export function PhotoTags({
  tags,
  onChange,
  imageIndex,
}: {
  tags: PostTagInput[];
  onChange: (tags: PostTagInput[]) => void;
  imageIndex: number;
}) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  useEffect(() => {
    const id = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);
  const users = useUserSearch(term, term.length > 0);
  const selected = tags.filter((t) => t.imageIndex === imageIndex);
  return (
    <fieldset className="space-y-3 border-t border-ig-separator pt-4">
      <legend className="text-sm font-semibold">Tag people</legend>
      <p className="text-xs text-ig-text-secondary">
        Choose a person and position on photo {imageIndex + 1}.
      </p>
      <div className="flex gap-2">
        <label className="min-w-0 text-xs">
          Horizontal %
          <input
            aria-label="Tag horizontal position"
            type="number"
            min={0}
            max={100}
            value={x}
            onChange={(e) =>
              setX(Math.max(0, Math.min(100, Number(e.target.value))))
            }
            className="w-full rounded border border-ig-stroke bg-transparent p-2"
          />
        </label>
        <label className="min-w-0 text-xs">
          Vertical %
          <input
            aria-label="Tag vertical position"
            type="number"
            min={0}
            max={100}
            value={y}
            onChange={(e) =>
              setY(Math.max(0, Math.min(100, Number(e.target.value))))
            }
            className="w-full rounded border border-ig-stroke bg-transparent p-2"
          />
        </label>
      </div>
      <input
        aria-label="Search people to tag"
        placeholder="Search username"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-ig-stroke bg-transparent px-3 py-2 text-sm"
      />
      {term && users.isPending && (
        <p role="status" className="text-xs">
          Searching…
        </p>
      )}
      {term && users.isError && (
        <button type="button" onClick={() => void users.refetch()}>
          Retry people search
        </button>
      )}
      {term && users.data?.length === 0 && (
        <p className="text-xs">No people found.</p>
      )}
      <ul className="max-h-32 overflow-y-auto">
        {users.data?.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              disabled={
                tags.length >= 20 ||
                selected.some((t) => t.userName === user.userName)
              }
              onClick={() => {
                const next = postTagsInputSchema.parse([
                  ...tags,
                  {
                    userName: user.userName,
                    x: x / 100,
                    y: y / 100,
                    imageIndex,
                  },
                ]);
                onChange(next);
                setSearch("");
                setTerm("");
              }}
              className="w-full p-2 text-left text-sm disabled:opacity-50"
            >
              Tag {user.userName}
            </button>
          </li>
        ))}
      </ul>
      <ul className="space-y-1">
        {selected.map((t) => (
          <li
            key={t.userName}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span>
              @{t.userName} ({Math.round(t.x * 100)}%, {Math.round(t.y * 100)}%)
            </span>
            <Button
              type="button"
              variant="borderless"
              onClick={() => onChange(tags.filter((other) => other !== t))}
            >
              Remove tag
            </Button>
          </li>
        ))}
      </ul>
      {tags.length >= 20 && (
        <p className="text-xs">You can tag up to 20 people.</p>
      )}
    </fieldset>
  );
}
