import Link from "next/link";
import { Heart } from "@/components/ui/icons";

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
        <a href="https://developers.facebook.com/docs/instagram-platform/" target="_blank" rel="noreferrer">API</a>
        <Link href="/explore">Locations</Link>
        <Link href="/explore">Popular</Link>
        <a href="https://www.instagram.com/web/lite/" target="_blank" rel="noreferrer">Instagram Lite</a>
        <a href="https://www.meta.ai/" target="_blank" rel="noreferrer">Meta AI</a>
        <a href="https://www.threads.com/" target="_blank" rel="noreferrer">Threads</a>
        <a href="https://www.meta.com/meta-verified/" target="_blank" rel="noreferrer">Meta Verified</a>
      </nav>
      <p className="mt-4">English <span className="mx-3">⌄</span> © {new Date().getFullYear()} Instagram from Meta</p>
    </footer>
  );
}

export function AuthDivider() {
  return <div className="auth-divider"><span />OR<span /></div>;
}

/** Local photos keep the presentation independent of the API. */
export function LoginPresentation() {
  return (
    <section className="login-presentation" aria-label="Share everyday moments">
      <h2>See everyday<br />moments from your<br /><span>close friends</span>.</h2>
      <div className="login-stories" aria-hidden="true">
        {[
          { src: "/auth/lake.jpg", style: "back-left" },
          { src: "/auth/mountains.jpg", style: "back-right" },
          { src: "/auth/friends.jpg", style: "front" },
        ].map(({ src, style }) => (
          <div key={style} className={`login-story login-story-${style}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
            <div className="login-story-progress"><i /><i /><i /></div>
            <div className="login-story-reply"><span /><Heart /></div>
          </div>
        ))}
        <span className="login-love"><Heart fill="currentColor" /></span>
        <span className="login-close-friends"><svg viewBox="0 0 24 24"><path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="currentColor" /></svg><span>✓</span></span>
      </div>
    </section>
  );
}
