import { FacebookLogoIcon, PlayIcon, TiktokLogoIcon, TwitchLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { MatchStatus } from "@/lib/supabase/types";

const PLATFORMS: { test: RegExp; name: string; icon: Icon }[] = [
  { test: /(^|\.)(youtube\.com|youtu\.be)$/i, name: "YouTube", icon: YoutubeLogoIcon },
  { test: /(^|\.)twitch\.tv$/i, name: "Twitch", icon: TwitchLogoIcon },
  { test: /(^|\.)(facebook\.com|fb\.watch|fb\.gg)$/i, name: "Facebook", icon: FacebookLogoIcon },
  { test: /(^|\.)tiktok\.com$/i, name: "TikTok", icon: TiktokLogoIcon },
];

function platformOf(url: string) {
  try {
    const host = new URL(url).hostname;
    return PLATFORMS.find((p) => p.test.test(host)) ?? null;
  } catch {
    return null;
  }
}

/**
 * The broadcast link for a match. Its wording follows the match: a red "Watch live" while the
 * admin has the match marked live, "Watch replay" once it is over, and the platform name before
 * it starts. Red is reserved for the live state so it always means "on air right now".
 */
export function StreamButton({
  url,
  status,
  size = "md",
  className = "",
}: {
  url: string;
  status: MatchStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  if (status === "cancelled") return null;
  const platform = platformOf(url);
  const live = status === "live";
  const PlatformIcon = platform?.icon ?? PlayIcon;
  const label = live ? "Watch live" : status === "completed" ? "Watch replay" : platform ? `Watch on ${platform.name}` : "Watch stream";
  const sizing = size === "sm" ? "min-h-10 gap-2.5 px-4 text-xs [--cut:9px] sm:px-4" : "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn group ${live ? "btn-live" : "btn-ghost [--btn-bg:var(--color-night)]"} ${sizing} ${className}`}
    >
      {live ? (
        <span className="relative grid size-2.5 place-items-center" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-current opacity-70 motion-safe:animate-ping" />
          <span className="relative size-2 rounded-full bg-current" />
        </span>
      ) : (
        <PlayIcon
          size={size === "sm" ? 13 : 15}
          weight="fill"
          aria-hidden
          className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-110"
        />
      )}
      {label}
      {(live || status === "completed") && platform && <span className="sr-only"> on {platform.name}</span>}
      {platform && (live || status === "completed") && (
        <PlatformIcon size={size === "sm" ? 15 : 17} weight="fill" aria-hidden className="opacity-80" />
      )}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
