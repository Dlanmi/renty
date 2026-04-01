// Mobile: imagen de altura fija arriba, card debajo (sin overlap)
// md+: card se superpone sobre la imagen como overlay
// lg+: imagen muy alta para feel inmersivo (estilo QuintoAndar)
export const HOME_SEARCH_HERO_MEDIA_HEIGHT_CLASS =
  "h-[220px] min-[380px]:h-[240px] sm:h-[280px] md:h-[500px] lg:h-[680px] xl:h-[720px]";

// En md+ la shell se posiciona absolute sobre la imagen
// En mobile no tiene posicionamiento especial — el card va debajo en el flujo normal
export const HOME_SEARCH_HERO_OVERLAY_SHELL_CLASS =
  "mx-auto max-w-7xl px-4 sm:px-6 md:absolute md:inset-x-0 md:top-[clamp(32px,5vw,60px)] md:max-w-none md:px-0 lg:top-[clamp(80px,10vh,100px)]";

// Mobile: sin negative margin — el card fluye naturalmente debajo de la imagen
// md+: padding izquierdo para alinear con el contenido
export const HOME_SEARCH_HERO_CARD_POSITION_CLASS =
  "pb-6 pt-5 md:mt-0 md:pb-0 md:pt-0 md:pl-[clamp(24px,4vw,44px)] lg:pl-[clamp(40px,5vw,64px)]";
