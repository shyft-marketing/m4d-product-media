jQuery(function ($) {

    if (window.M4DProductMediaInit) return;
    window.M4DProductMediaInit = true;

    if (typeof Swiper === 'undefined') return;

    const $mainSwiperEl = $('.m4d-main-swiper');
    const $thumbSwiperEl = $('.m4d-thumb-swiper');
    const $mainWrapper = $mainSwiperEl.find('.swiper-wrapper');
    const $thumbWrapper = $thumbSwiperEl.find('.swiper-wrapper');

    if (!$mainWrapper.length || !$thumbWrapper.length) return;

    // Cache initial slides (PRODUCT gallery)
    const originalMainSlides = $mainWrapper
        .children()
        .toArray()
        .map((slide) => slide.outerHTML);
    const originalThumbSlides = $thumbWrapper
        .children()
        .toArray()
        .map((slide) => slide.outerHTML);

    const thumbPaginationEl = $thumbSwiperEl.find('.swiper-pagination').get(0);
    const mainNextEl = $mainSwiperEl.find('.swiper-button-next').get(0);
    const mainPrevEl = $mainSwiperEl.find('.swiper-button-prev').get(0);
    const $thumbSwiperEl = $('.m4d-thumb-swiper');

    const transitionSpeed = 300;

    const getThumbSpacing = () => {
        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return Number.isFinite(remSize) ? remSize : 16;
    };
    let thumbSpacing = getThumbSpacing();
    const setThumbSpacingVar = () => {
        $thumbSwiperEl[0].style.setProperty('--m4d-thumb-spacing', `${thumbSpacing}px`);
    };

    const thumbSwiper = new Swiper($thumbSwiperEl.get(0), {
        slidesPerView: 6,
        spaceBetween: thumbSpacing,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        breakpoints: {
            0: {
                slidesPerView: 3,
                spaceBetween: thumbSpacing
            },
            769: {
                slidesPerView: 4,
                spaceBetween: thumbSpacing
            },
            1025: {
                slidesPerView: 6,
                spaceBetween: thumbSpacing
            }
        },
        pagination: thumbPaginationEl
            ? {
                el: thumbPaginationEl,
                clickable: true
            }
            : undefined,
        on: {
            touchStart: () => {
                m4dThumbSwiperEl.addClass('is-grabbing');
            },
            touchEnd: () => {
                m4dThumbSwiperEl.removeClass('is-grabbing');
            },
            sliderFirstMove: () => {
                m4dThumbSwiperEl.addClass('is-grabbing');
            },
            transitionEnd: () => {
                m4dThumbSwiperEl.removeClass('is-grabbing');
            }
        }
    });
    setThumbSpacingVar();

    const mainSwiper = new Swiper($mainSwiperEl.get(0), {
        navigation: (mainNextEl && mainPrevEl)
            ? {
                nextEl: mainNextEl,
                prevEl: mainPrevEl
            }
            : undefined,
    const mainSwiper = new Swiper('.m4d-main-swiper', {
        speed: transitionSpeed,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        },
        thumbs: {
            swiper: thumbSwiper
        }
    });

    function updateThumbSpacing() {
        var nextSpacing = getThumbSpacing();
        if (nextSpacing === thumbSpacing) return;
        thumbSpacing = nextSpacing;
        setThumbSpacingVar();
        thumbSwiper.params.spaceBetween = thumbSpacing;
        if (thumbSwiper.params.breakpoints) {
            Object.values(thumbSwiper.params.breakpoints).forEach((breakpoint) => {
                if (breakpoint) {
                    breakpoint.spaceBetween = thumbSpacing;
                }
            });
        }
        thumbSwiper.update();
    }

    $(window).on('resize orientationchange', updateThumbSpacing);

    var isUpdating = false;

    function rotateGalleryToIndex(startIndex) {
        if (isUpdating || startIndex <= 0) return;
        if (startIndex >= mainSwiper.slides.length) return;

        isUpdating = true;

        const mainSlides = Array.from(mainSwiper.slides).map((slide) => slide.outerHTML);
        const thumbSlides = Array.from(thumbSwiper.slides).map((slide) => slide.outerHTML);
        const reorderedMain = mainSlides.slice(startIndex).concat(mainSlides.slice(0, startIndex));
        const reorderedThumbs = thumbSlides.slice(startIndex).concat(thumbSlides.slice(0, startIndex));

        mainSwiper.removeAllSlides();
        thumbSwiper.removeAllSlides();

        mainSwiper.appendSlide(reorderedMain);
        thumbSwiper.appendSlide(reorderedThumbs);

        mainSwiper.update();
        thumbSwiper.update();
    }

    $(window).on('resize orientationchange', updateThumbSpacing);

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
        mainSwiper.slideTo(0, 0);
        thumbSwiper.slideTo(0, 0);

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
        mainSwiper.slideTo(0, 0);
        thumbSwiper.slideTo(0, 0);

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
