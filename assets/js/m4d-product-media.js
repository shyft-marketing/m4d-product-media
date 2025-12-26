jQuery(function ($) {

    const mainSwiper = new Swiper('.m4d-main-swiper', {
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        }
    });

    const thumbSwiper = new Swiper('.m4d-thumb-swiper', {
        slidesPerView: 'auto',
        spaceBetween: 10,
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        }
    });

    mainSwiper.thumbs.swiper = thumbSwiper;

    $('form.variations_form').on('found_variation', function (e, variation) {

        $.post(
            M4D_MEDIA.ajax_url,
            {
                action: 'm4d_get_variation_gallery',
                nonce: M4D_MEDIA.nonce,
                variation_id: variation.variation_id
            },
            function (res) {
                if (!res.success) return;

                mainSwiper.removeAllSlides();
                thumbSwiper.removeAllSlides();

                // Main variation image first
                if (variation.image && variation.image.full_src) {
                    mainSwiper.appendSlide(`
                        <div class="swiper-slide">
                            <img src="${variation.image.full_src}" />
                        </div>
                    `);
                }

                res.data.forEach(img => {
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
            }
        );
    });

    $('form.variations_form').on('reset_data', function () {
        location.reload();
    });
});
