jQuery(function ($) {
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

    $('form.variations_form').on('found_variation', function (e, variation) {
        if (!variation.m4d_gallery) {
            return;
        }

        mainSwiper.removeAllSlides();
        thumbSwiper.removeAllSlides();

        variation.m4d_gallery.forEach(img => {
            mainSwiper.appendSlide(`
                <div class="swiper-slide">
                    <img src="${img.src}" />
                </div>
            `);

            thumbSwiper.appendSlide(`
                <div class="swiper-slide">
                    <img src="${img.src}" />
                </div>
            `);
        });

        mainSwiper.update();
        thumbSwiper.update();
        mainSwiper.slideTo(0);
    });

    $('form.variations_form').on('reset_data', function () {
        location.reload();
    });
});
