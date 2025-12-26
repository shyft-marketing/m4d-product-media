jQuery(function ($) {

    if (typeof Swiper === 'undefined') return;

    const $mainWrapper = $('.m4d-main-swiper .swiper-wrapper');
    const $thumbWrapper = $('.m4d-thumb-swiper .swiper-wrapper');

    if (!$mainWrapper.length || !$thumbWrapper.length) return;

    // Cache initial slides (PRODUCT gallery)
    const originalMainSlides = $mainWrapper.children().clone(true);
    const originalThumbSlides = $thumbWrapper.children().clone(true);

    const thumbSwiper = new Swiper('.m4d-thumb-swiper', {
        slidesPerView: 'auto',
        spaceBetween: 10,
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        }
    });

    const mainSwiper = new Swiper('.m4d-main-swiper', {
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        },
        thumbs: {
            swiper: thumbSwiper
        }
    });

    let isUpdating = false;

    function resetToProductImages() {
        if (isUpdating) return;
        isUpdating = true;

        mainSwiper.removeAllSlides();
        thumbSwiper.removeAllSlides();

        mainSwiper.appendSlide(originalMainSlides);
        thumbSwiper.appendSlide(originalThumbSlides);

        mainSwiper.update();
        thumbSwiper.update();
        mainSwiper.slideTo(0);

        isUpdating = false;
    }

    function loadVariationImages(images) {
        if (!images || !images.length || isUpdating) return;

        isUpdating = true;

        mainSwiper.removeAllSlides();
        thumbSwiper.removeAllSlides();

        images.forEach(img => {
            mainSwiper.appendSlide(`
                <div class="swiper-slide">
                    <img src="${img.full}" />
                </div>
            `);

            thumbSwiper.appendSlide(`
                <div class="swiper-slide">
                    <img src="${img.thumb}" />
                </div>
            `);
        });

        mainSwiper.update();
        thumbSwiper.update();
        mainSwiper.slideTo(0);

        isUpdating = false;
    }

    $('form.variations_form')
        .on('found_variation', function (e, variation) {

            // IMPORTANT: ignore initial auto-resolution
            if (!variation || !variation.variation_id) return;

            $.post(
                M4D_MEDIA.ajax_url,
                {
                    action: 'm4d_get_variation_gallery',
                    nonce: M4D_MEDIA.nonce,
                    variation_id: variation.variation_id
                },
                function (res) {
                    if (res.success && res.data.length) {
                        loadVariationImages(res.data);
                    } else {
                        resetToProductImages();
                    }
                }
            );
        })
        .on('reset_data', function () {
            resetToProductImages();
        });

});
