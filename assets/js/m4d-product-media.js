jQuery(function ($) {
  function buildSlide(htmlOrUrl, isImageUrl = true) {
    if (!htmlOrUrl) return null;

    if (isImageUrl) {
      return `
        <div class="swiper-slide">
          <img src="${htmlOrUrl}" alt="" />
        </div>
      `;
    }

    return `<div class="swiper-slide">${htmlOrUrl}</div>`;
  }

  function initOne($root) {
    const root = $root.get(0);
    if (!root) return;

    const $main = $root.find('.m4d-main-swiper').first();
    const $thumb = $root.find('.m4d-thumb-swiper').first();
    if (!$main.length || !$thumb.length) return;

    // Scope pagination/nav to THIS instance (important if multiple widgets exist)
    const paginationEl = $thumb.find('.swiper-pagination').get(0);
    const nextEl = $main.find('.swiper-button-next').get(0);
    const prevEl = $main.find('.swiper-button-prev').get(0);

    // Thumb swiper (carousel)
    const thumbSwiper = new Swiper($thumb.get(0), {
      slidesPerView: 'auto',
      spaceBetween: 10,
      freeMode: true,
      watchSlidesProgress: true,
      pagination: paginationEl
        ? {
            el: paginationEl,
            clickable: true
          }
        : undefined
    });

    // Main swiper
    const mainSwiper = new Swiper($main.get(0), {
      navigation:
        nextEl && prevEl
          ? {
              nextEl,
              prevEl
            }
          : undefined,
      thumbs: {
        swiper: thumbSwiper
      }
    });

    // Default (no-variation-selected) media payload from PHP
    const defaults = window.M4D_PRODUCT_MEDIA || {};
    const defaultFeaturedFull = defaults.featured_full || '';
    const defaultGallery = Array.isArray(defaults.gallery) ? defaults.gallery : [];

    function renderDefault() {
      // Main: featured first, then gallery full
      // Thumbs: gallery thumbs only
      mainSwiper.removeAllSlides();
      thumbSwiper.removeAllSlides();

      if (defaultFeaturedFull) {
        const s = buildSlide(defaultFeaturedFull, true);
        if (s) mainSwiper.appendSlide(s);
      }

      defaultGallery.forEach((img) => {
        if (img && img.full) {
          const s = buildSlide(img.full, true);
          if (s) mainSwiper.appendSlide(s);
        }
      });

      defaultGallery.forEach((img) => {
        if (img && img.thumb) {
          const s = buildSlide(img.thumb, true);
          if (s) thumbSwiper.appendSlide(s);
        }
      });

      mainSwiper.update();
      thumbSwiper.update();
      mainSwiper.slideTo(0, 0);
    }

    // Variation selected:
    // Main: variation main image first, then variation gallery full images
    // Thumbs: variation gallery thumbs only
    function renderVariation(variation) {
      const vMain = variation && variation.image && (variation.image.full_src || variation.image.src);
      const vGallery = variation && Array.isArray(variation.m4d_gallery) ? variation.m4d_gallery : [];

      // If no gallery images on that variation, fall back to default gallery thumbs (optional safety).
      const galleryToUse = vGallery.length ? vGallery : [];

      mainSwiper.removeAllSlides();
      thumbSwiper.removeAllSlides();

      if (vMain) {
        const s = buildSlide(vMain, true);
        if (s) mainSwiper.appendSlide(s);
      } else if (defaultFeaturedFull) {
        const s = buildSlide(defaultFeaturedFull, true);
        if (s) mainSwiper.appendSlide(s);
      }

      // Main: add variation gallery full images
      galleryToUse.forEach((img) => {
        const full = img && (img.full || img.src); // backward safety if older shape exists
        if (!full) return;
        const s = buildSlide(full, true);
        if (s) mainSwiper.appendSlide(s);
      });

      // Thumbs: add variation gallery thumbs only
      galleryToUse.forEach((img) => {
        const thumb = img && (img.thumb || img.src);
        if (!thumb) return;
        const s = buildSlide(thumb, true);
        if (s) thumbSwiper.appendSlide(s);
      });

      // If variation has NO gallery, you wanted "only images in the carousel should be those in the variation image gallery".
      // That means: if empty, keep thumbs empty (or you can change to defaultGallery here if you decide later).
      // Leaving it empty is consistent with that requirement.

      mainSwiper.update();
      thumbSwiper.update();
      mainSwiper.slideTo(0, 0);
    }

    // On first load: enforce your desired default behavior
    renderDefault();

    // Hook into Woo variations
    const $form = $('form.variations_form').first();

    $form.on('found_variation', function (e, variation) {
      renderVariation(variation);
    });

    $form.on('reset_data', function () {
      // IMPORTANT: never location.reload() here.
      // Just restore defaults so you don't get reload loops / editor "connection lost" weirdness.
      renderDefault();
    });
  }

  $('.m4d-product-media').each(function () {
    initOne($(this));
  });
});
