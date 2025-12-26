jQuery(function ($) {

    if (typeof Swiper === 'undefined') return;

    const $mainWrapper = $('.m4d-main-swiper .swiper-wrapper');
    const $thumbWrapper = $('.m4d-thumb-swiper .swiper-wrapper');

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

    const $thumbSwiperEl = $('.m4d-thumb-swiper');

    const getThumbSpacing = () => {
        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return Number.isFinite(remSize) ? remSize : 16;
    };
    let thumbSpacing = getThumbSpacing();

    const thumbSwiper = new Swiper('.m4d-thumb-swiper', {
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
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        },
        on: {
            touchStart: () => {
                $thumbSwiperEl.addClass('is-grabbing');
            },
            touchEnd: () => {
                $thumbSwiperEl.removeClass('is-grabbing');
            },
            sliderFirstMove: () => {
                $thumbSwiperEl.addClass('is-grabbing');
            },
            transitionEnd: () => {
                $thumbSwiperEl.removeClass('is-grabbing');
            }
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

    function updateThumbSpacing() {
        const nextSpacing = getThumbSpacing();
        if (nextSpacing === thumbSpacing) return;
        thumbSpacing = nextSpacing;
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

    let isUpdating = false;

    function rotateGalleryToIndex(startIndex, options = {}) {
        if (isUpdating || startIndex <= 0) return;
        if (startIndex >= mainSwiper.slides.length) return;

        isUpdating = true;

        const { animate = true } = options;
        const transitionSpeed = animate ? (mainSwiper.params.speed || 300) : 0;

        if (animate) {
            mainSwiper.slideTo(startIndex, transitionSpeed);
            thumbSwiper.slideTo(startIndex, transitionSpeed);
        }

        const reorderSlides = () => {
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
            mainSwiper.slideTo(0, 0);
            thumbSwiper.slideTo(0, 0);

            isUpdating = false;
        };

        if (transitionSpeed > 0) {
            window.setTimeout(reorderSlides, transitionSpeed);
        } else {
            reorderSlides();
        }
    }

    $thumbSwiperEl.on('click', '.swiper-slide', function () {
        const clickedIndex = $(this).index();
        if (typeof clickedIndex !== 'number') return;
        rotateGalleryToIndex(clickedIndex, { animate: true });
    });

    mainSwiper.on('slideChangeTransitionEnd', () => {
        rotateGalleryToIndex(mainSwiper.activeIndex, { animate: false });
    });

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
