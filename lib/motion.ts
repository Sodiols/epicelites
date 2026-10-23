/** Shared motion vocabulary so every animated piece of the site moves with the same physics. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeInOutQuart = [0.76, 0, 0.24, 1] as const;

/** A firm spring for UI responses (tabs, toggles, dialogs). */
export const snappy = { type: "spring", stiffness: 420, damping: 38, mass: 0.8 } as const;

/** A heavier spring for large objects (portraits, the jersey). */
export const heavy = { type: "spring", stiffness: 140, damping: 22, mass: 1.1 } as const;

/** Time the route curtain takes to clear, so page intros start right as it leaves. */
export const CURTAIN_DELAY = 0.42;
