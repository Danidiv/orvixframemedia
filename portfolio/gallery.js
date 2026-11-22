(() => {
  const gallery = document.getElementById("orvix-portfolio-gallery");
  const images = window.orvixPortfolioImages;

  if (!gallery || !Array.isArray(images)) {
    throw new Error("Portfolio gallery markup or image manifest is missing.");
  }

  const grid = gallery.querySelector(".orvix-portfolio-grid");
  const status = gallery.querySelector(".orvix-portfolio-status");
  const filters = [...gallery.querySelectorAll(".orvix-portfolio-filters button")];
  const lightbox = document.getElementById("orvix-portfolio-lightbox");
  const lightboxImage = document.getElementById("orvix-portfolio-lightbox-image");
  const lightboxCategory = document.getElementById("orvix-portfolio-lightbox-category");
  const lightboxTitle = document.getElementById("orvix-portfolio-lightbox-title");
  const lightboxDescription = document.getElementById("orvix-portfolio-lightbox-description");
  const closeButton = gallery.parentElement.querySelector(".orvix-portfolio-lightbox-close");
  const videoIds = new Set();

  if (!grid || !status || filters.length === 0 || !lightbox || !lightboxImage
    || !lightboxCategory || !lightboxTitle || !lightboxDescription || !closeButton) {
    throw new Error("Portfolio gallery is missing required content or lightbox controls.");
  }

  if (images.some((image) => !image.title || !image.description || !image.alt)) {
    throw new Error("Every portfolio image must have a title, description, and alt text.");
  }

  let activeImage = null;
  let previousBodyOverflow = "";

  const openLightbox = (image, trigger) => {
    activeImage = trigger;
    previousBodyOverflow = document.body.style.overflow;
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCategory.textContent = image.category;
    lightboxTitle.textContent = image.title;
    lightboxDescription.textContent = image.description;
    document.body.style.overflow = "hidden";
    lightbox.showModal();
    closeButton.focus();
  };

  closeButton.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      lightbox.close();
    }
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });
  lightbox.addEventListener("close", () => {
    document.body.style.overflow = previousBodyOverflow;
    if (activeImage?.isConnected) {
      activeImage.focus();
    }
    activeImage = null;
  });

  const replacementVideos = [
    { videoId: "xRVTNaIZLB0", title: "Videography" }
  ];

  const videos = replacementVideos
    .filter((video) => {
      if (videoIds.has(video.videoId)) {
        return false;
      }
      videoIds.add(video.videoId);
      return true;
    })
    .map((video) => ({
      type: "video",
      category: "videography",
      title: video.title,
      videoId: video.videoId
    }));

  const shuffle = (values) => {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  };

  const items = [
    ...images.map((image) => ({
      ...image,
      type: "image",
      categories: [
        image.category,
        "photography",
        ...(image.description.toLowerCase().includes("event") ? ["event"] : [])
      ]
    })),
    ...shuffle(videos.map((video) => ({
      ...video,
      categories: [video.category]
    })))
  ];

  const allCategoryLimit = 4;
  const cards = items.map((item) => {
    const card = document.createElement("figure");
    card.className = item.type === "video"
      ? "orvix-portfolio-card orvix-portfolio-card--video"
      : "orvix-portfolio-card";
    card.dataset.category = item.category;
    card.dataset.categories = item.categories.join(" ");
    card.setAttribute("role", "listitem");

    if (item.type === "video") {
      const video = document.createElement("iframe");
      video.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.videoId)}`;
      video.title = item.title;
      video.loading = "lazy";
      video.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      video.allowFullscreen = true;
      video.referrerPolicy = "strict-origin-when-cross-origin";
      card.append(video);
    } else {
      const photo = document.createElement("img");
      photo.src = item.src;
      photo.alt = item.alt;
      photo.title = item.title;
      photo.loading = "lazy";
      photo.decoding = "async";
      photo.setAttribute("role", "button");
      photo.setAttribute("aria-haspopup", "dialog");
      photo.setAttribute("aria-label", `View details: ${item.title}`);
      photo.tabIndex = 0;
      photo.addEventListener("click", () => openLightbox(item, photo));
      photo.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(item, photo);
        }
      });
      card.append(photo);
    }

    const label = document.createElement("figcaption");
    label.textContent = item.title;

    card.append(label);
    grid.append(card);
    return card;
  });

  const applyFilter = (category) => {
    let visibleCount = 0;
    const categoryCounts = new Map();

    cards.forEach((card) => {
      const cardCategory = card.dataset.category;
      const cardCategories = card.dataset.categories.split(" ");
      const categoryCount = categoryCounts.get(cardCategory) || 0;
      const isVisible = category === "all"
        ? categoryCount < allCategoryLimit
        : cardCategories.includes(category);
      card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
        categoryCounts.set(cardCategory, categoryCount + 1);
      }
    });

    filters.forEach((filter) => {
      const isActive = filter.dataset.filter === category;
      filter.classList.toggle("is-active", isActive);
      filter.setAttribute("aria-pressed", String(isActive));
    });

    status.textContent = category === "all"
      ? `Showing ${visibleCount} featured projects. Choose a category to see all.`
      : `Showing ${visibleCount} ${category} projects.`;
  };

  filters.forEach((filter) => {
    filter.addEventListener("click", () => applyFilter(filter.dataset.filter));
  });

  applyFilter("all");
})();
