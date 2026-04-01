import {
  stagger,
  type MotionProps,
  type TargetAndTransition,
  type Transition,
  type Variants,
} from "framer-motion";

export const MOTION_TRANSITIONS = {
  enter: {
    type: "spring",
    stiffness: 280,
    damping: 28,
    mass: 0.82,
  } satisfies Transition,
  hover: {
    type: "spring",
    stiffness: 380,
    damping: 24,
    mass: 0.62,
  } satisfies Transition,
  press: {
    type: "spring",
    stiffness: 560,
    damping: 30,
    mass: 0.42,
  } satisfies Transition,
  layout: {
    type: "spring",
    stiffness: 320,
    damping: 30,
    mass: 0.78,
  } satisfies Transition,
  exit: {
    duration: 0.18,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,
  fade: {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
  } satisfies Transition,
  mediaEnter: {
    opacity: {
      duration: 0.18,
      ease: [0.22, 1, 0.36, 1],
    },
    scale: {
      type: "spring",
      stiffness: 300,
      damping: 26,
      mass: 0.78,
    },
  } satisfies Transition,
  mediaExit: {
    opacity: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
    },
    scale: {
      duration: 0.18,
      ease: [0.4, 0, 0.2, 1],
    },
  } satisfies Transition,
} as const;

export const HOVER_LIFT = {
  y: -4,
} satisfies TargetAndTransition;

export const HOVER_LIFT_SOFT = {
  y: -2,
} satisfies TargetAndTransition;

export const HOVER_NUDGE_SOFT = {
  x: 3,
} satisfies TargetAndTransition;

export const TAP_PRESS = {
  scale: 0.985,
} satisfies TargetAndTransition;

export const TAP_PRESS_COMPACT = {
  scale: 0.965,
} satisfies TargetAndTransition;

interface InteractiveMotionPresetOptions {
  hover?: TargetAndTransition;
  tap?: TargetAndTransition;
  transition?: Transition;
}

function createInteractiveMotionPreset({
  hover,
  tap,
  transition = MOTION_TRANSITIONS.hover,
}: InteractiveMotionPresetOptions): Pick<
  MotionProps,
  "whileHover" | "whileTap" | "transition"
> {
  return {
    whileHover: hover,
    whileTap: tap,
    transition,
  };
}

export const LIFT_ONLY_MOTION_PROPS = createInteractiveMotionPreset({
  hover: HOVER_LIFT_SOFT,
});

export const PRESSABLE_MOTION_PROPS = createInteractiveMotionPreset({
  hover: HOVER_LIFT_SOFT,
  tap: TAP_PRESS,
});

export const PRESSABLE_COMPACT_MOTION_PROPS = createInteractiveMotionPreset({
  hover: HOVER_LIFT_SOFT,
  tap: TAP_PRESS_COMPACT,
});

export const NUDGE_COMPACT_MOTION_PROPS = createInteractiveMotionPreset({
  hover: HOVER_NUDGE_SOFT,
  tap: TAP_PRESS_COMPACT,
});

export const TAP_ONLY_MOTION_PROPS = createInteractiveMotionPreset({
  tap: TAP_PRESS,
  transition: MOTION_TRANSITIONS.press,
});

export const CARD_INTERACTION_VARIANTS = {
  rest: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.006,
  },
  tap: {
    y: -1,
    scale: 0.985,
  },
} satisfies Variants;

export const CARD_MEDIA_INTERACTION_VARIANTS = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.045,
  },
  tap: {
    scale: 1.018,
  },
} satisfies Variants;

interface FadeSlideVariantOptions {
  distance?: number;
  scale?: number;
  axis?: "x" | "y";
  enterTransition?: Transition;
  exitTransition?: Transition;
}

export function createFadeSlideVariants({
  distance = 18,
  scale = 0.985,
  axis = "y",
  enterTransition = MOTION_TRANSITIONS.enter,
  exitTransition = MOTION_TRANSITIONS.exit,
}: FadeSlideVariantOptions = {}): Variants {
  const exitDistance = Math.max(8, Math.round(distance * 0.65));

  if (axis === "x") {
    return {
      initial: {
        opacity: 0,
        x: distance,
        scale,
      },
      animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: enterTransition,
      },
      exit: {
        opacity: 0,
        x: exitDistance,
        scale,
        transition: exitTransition,
      },
    } satisfies Variants;
  }

  return {
    initial: {
      opacity: 0,
      y: distance,
      scale,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: enterTransition,
    },
    exit: {
      opacity: 0,
      y: exitDistance,
      scale,
      transition: exitTransition,
    },
  } satisfies Variants;
}

interface StaggerContainerOptions {
  staggerChildren?: number;
  delayChildren?: number;
  from?: number | "first" | "last" | "center";
}

export function createStaggerContainerVariants({
  staggerChildren = 0.055,
  delayChildren = 0.04,
  from = "first",
}: StaggerContainerOptions = {}): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        delayChildren: stagger(staggerChildren, {
          from,
          startDelay: delayChildren,
        }),
      },
    },
  } satisfies Variants;
}

export const SECTION_REVEAL_VARIANTS = createFadeSlideVariants({
  distance: 14,
  scale: 1,
});

export const PAGE_REVEAL_VARIANTS = SECTION_REVEAL_VARIANTS;

export const SURFACE_REVEAL_VARIANTS = createFadeSlideVariants({
  distance: 20,
  scale: 0.99,
});

export const CARD_REVEAL_VARIANTS = SURFACE_REVEAL_VARIANTS;

export const MOTION_LAYOUT_TRANSITION = {
  layout: MOTION_TRANSITIONS.layout,
} as const;

export const CHIP_REVEAL_VARIANTS = createFadeSlideVariants({
  distance: 10,
  scale: 0.97,
});

export const STATUS_SWAP_VARIANTS = createFadeSlideVariants({
  distance: 6,
  scale: 1,
});

export const POPOVER_VARIANTS = createFadeSlideVariants({
  distance: 12,
  scale: 0.97,
});

export const MODAL_PANEL_VARIANTS = createFadeSlideVariants({
  distance: 24,
  scale: 0.96,
});

export const OVERLAY_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: MOTION_TRANSITIONS.fade },
  exit: { opacity: 0, transition: MOTION_TRANSITIONS.exit },
} satisfies Variants;

export const MEDIA_SWAP_VARIANTS = createFadeSlideVariants({
  distance: 0,
  scale: 1.015,
  enterTransition: MOTION_TRANSITIONS.mediaEnter,
  exitTransition: MOTION_TRANSITIONS.mediaExit,
});

export const STAGGER_CONTAINER_VARIANTS = createStaggerContainerVariants();

export const STAGGER_FAST_VARIANTS = createStaggerContainerVariants({
  staggerChildren: 0.04,
  delayChildren: 0.02,
});

export const MENU_ITEM_VARIANTS = createFadeSlideVariants({
  distance: 8,
  scale: 0.99,
});

export const LIST_ITEM_REVEAL_VARIANTS = createFadeSlideVariants({
  distance: 10,
  scale: 0.99,
});
