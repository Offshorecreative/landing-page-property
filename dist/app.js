const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const track = (event, detail = {}) =>
  (window.dataLayer = window.dataLayer || []).push({ event, ...detail });

// Navigation
const menu = $("#nav"),
  burger = $("#burger");

function toggleMenu(open) {
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

burger.onclick = () => toggleMenu(!menu.classList.contains("open"));
menu.onclick = () => toggleMenu(false);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") toggleMenu(false);
});

document
  .querySelectorAll('a[href="#contact"],a[href="#work"]')
  .forEach((a) =>
    a.addEventListener("click", () =>
      track("cta_click", {
        destination: a.hash,
        label: a.textContent.trim(),
      }),
    ),
  );

// Portfolio popup
const viewer = $("#viewer"),
  photo = $("#fullPhoto"),
  holder = $("#videoHolder");

// Muted, looping previews for the MP4 cards
const previewStates = new Map();

function updateCardPreviews() {
  previewStates.forEach((visible, video) => {
    if (!visible || viewer.open || document.hidden) {
      video.pause();
      return;
    }

    if (!video.hasAttribute("src")) {
      video.src = video.dataset.src;
    }

    video.play().catch(() => {});
  });
}

const cardObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      previewStates.set(target, isIntersecting);
    });

    updateCardPreviews();
  },
  { threshold: 0.15 },
);

document
  .querySelectorAll(".gallery button.card[data-mp4]")
  .forEach((card) => {
    const img = card.querySelector("img");
    const preview = document.createElement("video");

    preview.muted = true;
    preview.defaultMuted = true;
    preview.autoplay = true;
    preview.loop = true;
    preview.playsInline = true;
    preview.preload = "none";
    preview.dataset.src = card.dataset.mp4;
    preview.poster = img.src;

    preview.setAttribute("aria-hidden", "true");
    preview.tabIndex = -1;

    preview.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;" +
      "object-fit:cover;pointer-events:none;";

    img.insertAdjacentElement("afterend", preview);

    previewStates.set(preview, false);
    cardObserver.observe(preview);
  });

document.addEventListener("visibilitychange", updateCardPreviews);

// Open a project when its card is clicked
document.querySelectorAll(".gallery button.card").forEach((card) => {
  card.onclick = () => {
    const img = card.querySelector("img");
    const id = card.dataset.video;
    const mp4 = card.dataset.mp4;
    const title = card.querySelector("strong").textContent;

    holder.replaceChildren();
    soundButton.hidden = true;

    photo.hidden = Boolean(mp4 || id);
    photo.src = img.src;
    photo.alt = img.alt;

    $("#projectTitle").textContent = title;
    $("#category").textContent = card.querySelector("small").textContent;

    $("#source").hidden = Boolean(mp4);
    $("#source").href = id
      ? "https://www.youtube.com/watch?v=" + id
      : "https://offshorecreative.co/";

    $("#source").textContent = id
      ? "Watch on YouTube"
      : "Offshore portfolio";

    viewer.showModal();
    updateCardPreviews();

    if (mp4) {
      // Play the full MP4 video with controls.
      const video = document.createElement("video");

      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.poster = img.src;
      video.src = mp4;

      holder.append(video);
      watchSound(video);

      video.play().catch(() => {});
    } else if (id) {
      // Casa Kong and Villa Gama: YouTube playback on click.
      const iframe = document.createElement("iframe");

      iframe.src =
        "https://www.youtube.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&playsinline=1";

      iframe.title = title;
      iframe.allow =
        "autoplay; encrypted-media; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";

      holder.append(iframe);
    }

    track("portfolio_open", { project: title });
  };
});

// Sound control for MP4 popup videos.
// YouTube uses its own player controls.
const soundButton = viewer.querySelector(".sound");

function syncSound(video) {
  soundButton.textContent = video.muted ? "Sound on" : "Mute";

  soundButton.setAttribute(
    "aria-label",
    video.muted ? "Turn sound on" : "Mute sound",
  );
}

function watchSound(video) {
  soundButton.hidden = false;
  syncSound(video);

  video.addEventListener("volumechange", () => syncSound(video));
}

soundButton.onclick = (event) => {
  event.stopPropagation();

  const video = holder.querySelector("video");
  if (!video) return;

  video.muted = !video.muted;

  if (!video.muted && video.paused) {
    video.play().catch(() => {});
  }

  syncSound(video);
};

// Close popup
viewer.querySelector(".close").onclick = (event) => {
  event.stopPropagation();
  viewer.close();
};

viewer.onclick = (event) => {
  if (event.target !== viewer) return;

  const bounds = viewer.getBoundingClientRect();

  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  ) {
    viewer.close();
  }
};

viewer.onclose = () => {
  holder.replaceChildren();
  soundButton.hidden = true;
  updateCardPreviews();
};

// Photography galleries
function revealGallery() {
  const active = document.getElementById(location.hash.slice(1));

  if (!active?.classList.contains("photoPanel")) return;

  document
    .querySelectorAll(".photoPanel")
    .forEach((panel) => (panel.hidden = panel !== active));

  active.focus({ preventScroll: true });

  active.scrollIntoView({
    behavior: reduced ? "instant" : "smooth",
    block: "start",
  });
}

document.querySelectorAll(".photoCard").forEach((link) =>
  link.addEventListener("click", (event) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (location.hash !== link.hash) {
      history.pushState(null, "", link.hash);
    }

    revealGallery();
  }),
);

window.addEventListener("hashchange", revealGallery);
revealGallery();

// WhatsApp inquiry form
const form = $("#inquiry");

function inquiryMessage(data) {
  const services = data.getAll("service").join(", ");

  const rows = [
    ["Name", data.get("name")],
    ["Company / Property", data.get("company")],
    ["Property Location", data.get("location")],
    ["Instagram / Website", data.get("profile")],
    ["Property Type", data.get("type")],
    ["Services", services],
    ["Preferred Date", data.get("date")],
    ["Project Details", data.get("details")],
  ];

  return [
    "Hi Offshore Creative! 👋",
    "I'm interested in your creative services for my property.",
    ...rows
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => "*" + k + ":* " + v.trim()),
    "I'd love to discuss how we can work together to market my property. Looking forward to hearing from you!",
  ].join("\n\n");
}

form.elements.name.oninput = () => {
  form.elements.name.setCustomValidity("");
};

form.onsubmit = (e) => {
  e.preventDefault();

  if (!form.elements.name.value.trim()) {
    form.elements.name.setCustomValidity("Please enter your name.");
    form.reportValidity();
    return;
  }

  const message = inquiryMessage(new FormData(form));

  window.open(
    "https://wa.me/628113935959?text=" + encodeURIComponent(message),
    "_blank",
    "noopener,noreferrer",
  );

  track("whatsapp_inquiry_open");
};

// Scroll animations
if (!reduced && window.gsap) {
  const io = new IntersectionObserver((entries) =>
    entries
      .filter((e) => e.isIntersecting)
      .forEach((e) => {
        gsap.from(e.target, {
          y: 16,
          opacity: 0.75,
          duration: 0.55,
        });

        io.unobserve(e.target);
      }),
  );

  document
    .querySelectorAll(".gallery,.formats,.rows,.whyGrid aside")
    .forEach((el) => io.observe(el));
}

// Hero project button
$("#heroWork").onclick = () =>
  document.querySelector('.gallery [data-video="Vl9wvu12mqE"]').click();

// Format section videos
const formatsObserver = new IntersectionObserver((entries) => {
  for (const { isIntersecting, target } of entries) {
    if (!isIntersecting) {
      target.pause();
      continue;
    }

    if (!target.src) target.src = target.dataset.src;
    if (!reduced) target.play().catch(() => {});
  }
});

document
  .querySelectorAll(".formats video")
  .forEach((video) => formatsObserver.observe(video));

if (location.hash === "#work-") {
  document.getElementById("work").scrollIntoView();
}
