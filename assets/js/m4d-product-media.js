/* global jQuery, wp */
jQuery(function ($) {

  /* ==========================
   * ADMIN: Variation gallery UI
   * ========================== */
  function isAdmin() {
    return $('body').hasClass('wp-admin');
  }

  function refreshVariationInput($preview) {
    const ids = [];
    $preview.find('li').each(function () {
      ids.push($(this).data('id'));
    });

    $preview.closest('.m4d-variation-gallery')
      .find('.m4d-gallery-input')
      .val(ids.join(','));
  }

  if (isAdmin()) {
    // Add images
    $(document).on('click', '.m4d-add-gallery', function (e) {
      e.preventDefault();

      const $galleryWrap = $(this).siblings('.m4d-gallery-preview');

      const frame = wp.media({
        title: 'Select Gallery Images',
        multiple: true,
        library: { type: 'image' }
      });

      frame.on('select', function () {
        frame.state().get('selection').each(function (att) {
          const json = att.toJSON();
          const id = json.id;
          const thumb = (json.sizes && json.sizes.thumbnail) ? json.sizes.thumbnail.url : json.url;

          // Prevent duplicates
          if ($galleryWrap.find(`li[data-id="${id}"]`).length) return;

          $galleryWrap.append(
            `<li data-id="${id}"><img src="${thumb}" alt=""><span class="remove">×</span></li>`
          );
        });

        refreshVariationInput($galleryWrap);
      });

      frame.open();
    });

    // Remove images
    $(document).on('click', '.m4d-gallery-preview .remove', function () {
      const $wrap = $(this).closest('.m4d-gallery-preview');
      $(this).closest('li').remove();
      refreshVariationInput($wrap);
    });
  }

  /* ==========================
   * FRONTEND: Swiper gallery
   * ========================== */
  function isProductPageGalleryPresent() {
    return $('.m4d-product-media').length > 0 && typeof Swiper !== 'undefined';
  }

  if (!isAdmin() && isProductPageGalleryPresent()) {
    let mainSwiper, thumbsSwiper;

    function initSwipers() {
      thumbsSwiper = new Swiper('.m4d-thumbs', {
        slidesPerView: 'auto',
        spaceBetween: 10,
        watchSlidesProgress: true,
        pagination: {
          el: '.m4d-thumbs .swiper-pagination',
          clickable: true
        }
      });

      mainSwiper = new Swiper('.m4d-main', {
        navigation: {
          nextEl: '.m4d-main .swiper-button-next',
          prevEl: '.m4d-main .swiper-button-prev'
        },
        thumbs: {
          swiper: thumbsSwiper
        }
      });
    }

    function destroySwipers() {
      try { if (mainSwiper) mainSwiper.destroy(true, true); } catch (e) {}
      try { if (thumbsSwiper) thumbsSwiper.destroy(true, true); } catch (e) {}
      mainSwiper = null;
      thumbsSwiper = null;
    }

    function renderGallery(items) {
      const $media = $('.m4d-product-media');
      const $mainWrap = $media.find('.m4d-main .swiper-wrapper');
      const $thumbWrap = $media.find('.m4d-thumbs .swiper-wrapper');

      $mainWrap.empty();
      $thumbWrap.empty();

      (items || []).forEach(item => {
        $mainWrap.append(
          `<div class="swiper-slide" data-id="${item.id}">
            <img src="${item.large}" alt="">
          </div>`
        );

        $thumbWrap.append(
          `<div class="swiper-slide" data-id="${item.id}">
            <img src="${item.thumb || item.large}" alt="">
          </div>`
        );
      });
    }

    function getBaseGallery() {
      const raw = $('.m4d-product-media').attr('data-base-gallery');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch (e) { return []; }
    }

    function swapTo(items) {
      destroySwipers();
      renderGallery(items);
      initSwipers();
    }

    // Init with base gallery
    initSwipers();

    // Woo variation found -> swap to that variation gallery if present, else fallback
    $('form.variations_form').on('found_variation', function (e, variation) {
      if (variation && variation.m4d_gallery && variation.m4d_gallery.length) {
        swapTo(variation.m4d_gallery);
      } else {
        swapTo(getBaseGallery());
      }
    });

    // Reset variations -> revert to base product gallery
    $('form.variations_form').on('reset_data', function () {
      swapTo(getBaseGallery());
    });
  }

});
