jQuery(function ($) {

    if (typeof Swiper === 'undefined') {
        return;
    }

    const $mainEl  = document.querySelector('.m4d-main-swiper');
    const $thumbEl = document.querySelector('.m4d-thumb-swiper');

    if (!$mainEl || !$thumbEl) {
        return;
    }

    // Store original slides so we can restore them safely
    const originalMainSlides  = $mainEl.querySelector('.swiper-wrapper').innerHTML;
    const originalThumbSlides = $thumbEl.querySelector('.swiper-wrapper').innerHTML;

    const thumbSwiper = new Swiper($thumbEl, {
        slidesPerView: 'auto',
        spaceBetween: 10,
        watchSlidesProgress: true,
        pagination: {
            el: $thumbEl.querySelector('.swiper-pagination'),
            clickable: true
        }
    });

    const mainSwiper = new Swiper($mainEl, {
        navigation: {
            nextEl: $mainEl.querySelector('.swiper-button-next'),
            prevEl: $mainEl.querySelector('.swiper-button-prev')
        },
        thumbs: {
            swiper: thumbSwiper
        }
    });

    // When a variation is selected
    $('form.variations_form').on('found_variation', function (e, variation) {

        if (!variation || !variation.m4d_gallery || !variation.m4d_gallery.length) {
            return;
        }

        mainSwiper.removeAllSlides();
        thumbSwiper.removeAllSlides();

        variation.m4d_gallery.forEach(img => {
            mainSwiper.appendSlide(
                `<div class="swiper-slide"><img src="${img.src}" alt="" /></div>`
            );
            thumbSwiper.appendSlide(
                `<div class="swiper-slide"><img src="${img.src}" alt="" /></div>`
            );
        });

        mainSwiper.update();
        thumbSwiper.update();
        mainSwiper.slideTo(0, 0);
    });

    // When variations are reset — RESTORE, DON'T RELOAD
    $('form.variations_form').on('reset_data', function () {

        mainSwiper.removeAllSlides();
        thumbSwiper.removeAllSlides();

        mainSwiper.appendSlide(originalMainSlides);
        thumbSwiper.appendSlide(originalThumbSlides);

        mainSwiper.update();
        thumbSwiper.update();
        mainSwiper.slideTo(0, 0);
    });

});
