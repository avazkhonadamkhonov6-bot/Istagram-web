import Link from "next/link";
import { Camera } from "lucide-react";
export default function NotFound() {
 return <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-5 px-6 text-center"><Camera className="size-14 stroke-1" /><h1 className="text-2xl font-semibold">Sorry, this page isn’t available.</h1><p className="max-w-sm text-ig-text-secondary">The link may be broken, or the page may have been removed.</p><Link href="/" className="font-semibold text-ig-link-action">Go back to Instagram</Link></div>;
}
