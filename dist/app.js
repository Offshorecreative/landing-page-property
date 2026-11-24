
// Muted, looping previews for MP4 and YouTube cards
const previewStates = new Map();

function updateCardPreviews() {
  previewStates.forEach((state, card) => {
    const { visible, preview } = state;

    if (!visible || viewer.open || document.hidden) {
      if (preview.tagName === "VIDEO") {
        preview.pause();
      } else {
        preview.src = "";
      }
      return;
    }

    if (preview.tagName === "VIDEO") {
      if (!preview.hasAttribute("src")) {
        preview.src = preview.dataset.src;
      }

      preview.play().catch(() => {});
    } else if (!preview.src) {
      preview.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(card.dataset.video) +
        "?autoplay=1&mute=1&controls=0&loop=1&playlist=" +
        encodeURIComponent(card.dataset.video) +
        "&playsinline=1&rel=0";
    }
  });
}

const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      const state = previewStates.get(target);

      if (state) {
        state.visible = isIntersecting;
      }
    });

    updateCardPreviews();
  },
  { threshold: 0.15 },
);

document
  .querySelectorAll(".gallery button.card")
  .forEach((card) => {
    const img = card.querySelector("img");
    const id = card.dataset.video;
    const mp4 = card.dataset.mp4;

    if (!id && !mp4) return;

    let preview;

    if (id) {
      // YouTube autoplay preview
      preview = document.createElement("iframe");

      preview.title = "Property video preview";
      preview.allow = "autoplay; encrypted-media";
      preview.tabIndex = -1;
      preview.setAttribute("aria-hidden", "true");

      preview.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;" +
        "border:0;pointer-events:none;";
    } else {
      // Existing MP4 autoplay preview
      preview = document.createElement("video");

      preview.muted = true;
      preview.defaultMuted = true;
      preview.autoplay = true;
      preview.loop = true;
      preview.playsInline = true;
      preview.preload = "none";
      preview.dataset.src = mp4;
      preview.poster = img.src;

      preview.setAttribute("aria-hidden", "true");
      preview.tabIndex = -1;

      preview.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;" +
        "object-fit:cover;pointer-events:none;";
    }

    img.insertAdjacentElement("afterend", preview);

    previewStates.set(card, {
      visible: false,
      preview,
    });

    cardObserver.observe(card);
  });

document.addEventListener("visibilitychange", updateCardPreviews);
