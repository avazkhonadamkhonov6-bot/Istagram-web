import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Send } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/wordmark";

export function AuthFooter() {
  return (
    <footer className="auth-footer">
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <a href="https://about.meta.com/" target="_blank" rel="noreferrer">Meta</a>
        <a href="https://about.instagram.com/" target="_blank" rel="noreferrer">About</a>
        <a href="https://about.instagram.com/blog" target="_blank" rel="noreferrer">Blog</a>
        <a href="https://about.instagram.com/about-us/careers" target="_blank" rel="noreferrer">Jobs</a>
        <a href="https://help.instagram.com/" target="_blank" rel="noreferrer">Help</a>
        <a href="https://privacycenter.instagram.com/policy/" target="_blank" rel="noreferrer">Privacy</a>
        <a href="https://help.instagram.com/581066165581870/" target="_blank" rel="noreferrer">Terms</a>
        <Link href="/explore">Locations</Link>
      </nav>
      <p className="mt-4">English <span className="mx-3">⌄</span> © {new Date().getFullYear()} Instagram from Meta</p>
    </footer>
  );
}

export function AuthDivider() {
  return <div className="auth-divider"><span />OR<span /></div>;
}

/** Decorative app preview. Both photos are local, with a gentle crossfade. */
export function LoginPresentation() {
  return (
    <div className="login-presentation" aria-hidden="true">
      <div className="login-phone login-phone-back">
        <div className="login-phone-notch" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/auth/mountains.jpg" alt="" className="size-full object-cover" />
        <div className="login-story-caption">A little closer to the extraordinary.</div>
      </div>
      <div className="login-phone login-phone-front">
        <div className="login-phone-notch" />
        <div className="flex items-center justify-between px-3 pb-2 pt-8">
          <Wordmark className="h-8 w-[92px]" /><Heart className="size-5" /><Send className="size-5" />
        </div>
        <div className="flex items-center gap-2 border-t border-ig-separator px-3 py-2">
          <div className="login-preview-avatar" />
          <div className="text-[10px] leading-[14px]"><b>pamir.travel</b><br />Somewhere beautiful</div>
        </div>
        <div className="login-preview-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/auth/mountains.jpg" alt="" className="login-photo-one" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/auth/lake.jpg" alt="" className="login-photo-two" />
        </div>
        <div className="flex gap-3 px-3 py-3"><Heart className="size-5" /><MessageCircle className="size-5" /><Send className="size-5" /><Bookmark className="ml-auto size-5" /></div>
        <div className="px-3 text-[11px] leading-4"><b>pamir.travel</b> Moments worth sharing.<br /><span className="text-ig-text-secondary">View all 24 comments</span></div>
        <div className="login-home-indicator" />
      </div>
    </div>
  );
}
