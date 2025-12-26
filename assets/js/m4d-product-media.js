(function ($) {
  function uniqByUrl(images) {
    const seen = new Set();
    return images.filter((img) => {
      const key = (img && (img.full || img.large || img.thumb)) || "";
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function normalizeImg(img) {
    if (!img) return null;
    return {
      id: img.id || null,
      full: img.full || img.full_src || img.src || "",
      large: img.large || img.src || img.full_src || "",
      thumb: img.thumb || img.gallery_thumbnail_src || img.thumb_src || img.src || "",
      alt: img.alt || "",
    };
  }

  function buildSlideHtml(url, alt) {
    const safeAlt = alt ? String(alt).replace(/"/g, "&quot;") : "";
    return `<div class="swiper-slide"><img src="${url}" alt="${safeAlt}"></div>`;
  }

  function renderSwipers($root, images) {
    const $main = $root.find(".m4d-pm-main");
    const $thumbs = $root.find(".m4d-pm-thumbs");

    const $mainWrap = $main.find(".swiper-wrapper");
    const $thumbWrap = $thumbs.find(".swiper-wrapper");

    $mainWrap.empty();
    $thumbWrap.empty();

    images.forEach((img) => {
      const mainUrl = img.large || img.full;
      const thumbUrl = img.thumb || img.large || img.full;
      $mainWrap.append(buildSlideHtml(mainUrl, img.alt));
      $thumbWrap.append(buildSlideHtml(thumbUrl, img.alt));
    });

    const existingMain = $main.data("m4dPmMainSwiper");
    const existingThumbs = $thumbs.data("m4dPmThumbsSwiper");
    if (existingMain && typeof existingMain.destroy === "function") existingMain.destroy(true, true);
    if (existingThumbs && typeof existingThumbs.destroy === "function") existingThumbs.destroy(true, true);

    const thumbsSwiper = new Swiper($thumbs[0], {
      slidesPerView: "auto",
      spaceBetween: 10,
      watchSlidesProgress: true,
      pagination: {
        el: $root.find(".m4d-pm-thumbs-pagination")[0],
        clickable: true,
      },
    });

    const mainSwiper = new Swiper($main[0], {
      slidesPerView: 1,
      spaceBetween: 10,
      navigation: {
        nextEl: $root.find(".m4d-pm-next")[0],
        prevEl: $root.find(".m4d-pm-prev")[0],
      },
      thumbs: {
        swiper: thumbsSwiper,
      },
    });

    $main.data("m4dPmMainSwiper", mainSwiper);
    $thumbs.data("m4dPmThumbsSwiper", thumbsSwiper);
  }

  function getVariationForm() {
    const $form = $("form.variations_form");
    return $form.length ? $form : null;
  }

  function getBaseImages() {
    const base = (window.M4DPM && Array.isArray(window.M4DPM.baseImages)) ? window.M4DPM.baseImages : [];
    return uniqByUrl(base.map(normalizeImg)).filter(Boolean);
  }

  function getVariationImageFromEvent(variation) {
    if (!variation || !variation.image) return null;
    const img = normalizeImg(variation.image);
    if (!img || !(img.full || img.large)) return null;
    return img;
  }

  function initOne($root) {
    if (!window.Swiper) return;

    const baseImages = getBaseImages();
    renderSwipers($root, baseImages);

    const $form = getVariationForm();
    if (!$form) return;

    $form.off(".m4dpm");

    $form.on("found_variation.m4dpm", function (e, variation) {
      const varImg = getVariationImageFromEvent(variation);
      if (!varImg) return;

      const merged = uniqByUrl([varImg].concat(baseImages));
      renderSwipers($root, merged);
    });

    $form.on("reset_data.m4dpm", function () {
      renderSwipers($root, baseImages);
    });
  }

  $(document).ready(function () {
    const $roots = $(".m4d-pm[data-m4d-pm='1']");
    if (!$roots.length) return;

    $roots.each(function () {
      initOne($(this));
    });
  });
})(jQuery);
