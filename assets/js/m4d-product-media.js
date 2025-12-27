jQuery(function ($) {

    if (typeof Swiper === 'undefined') return;

    var $mainSwiperEl = $('.m4d-main-swiper');
    var $thumbSwiperEl = $('.m4d-thumb-swiper');
    var $mainWrapper = $mainSwiperEl.find('.swiper-wrapper');
    var $thumbWrapper = $thumbSwiperEl.find('.swiper-wrapper');

    if (!$mainWrapper.length || !$thumbWrapper.length) return;

    // Cache initial slides (PRODUCT gallery)
    var originalMainSlides = $mainWrapper
        .children()
        .toArray()
        .map((slide) => slide.outerHTML);
    var originalThumbSlides = $thumbWrapper
        .children()
        .toArray()
        .map((slide) => slide.outerHTML);

    var thumbPaginationEl = $thumbSwiperEl.find('.swiper-pagination').get(0);
    var mainNextEl = $mainSwiperEl.find('.swiper-button-next').get(0);
    var mainPrevEl = $mainSwiperEl.find('.swiper-button-prev').get(0);

    var getThumbSpacing = () => {
        var remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return Number.isFinite(remSize) ? remSize : 16;
    };
    var thumbSpacing = getThumbSpacing();

    var thumbSwiper = new Swiper($thumbSwiperEl.get(0), {
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

    var mainSwiper = new Swiper($mainSwiperEl.get(0), {
        navigation: (mainNextEl && mainPrevEl)
            ? {
                nextEl: mainNextEl,
                prevEl: mainPrevEl
            }
            : undefined,
        thumbs: {
            swiper: thumbSwiper
        }
    });

    function updateThumbSpacing() {
        var nextSpacing = getThumbSpacing();
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

    var isUpdating = false;

    function rotateGalleryToIndex(startIndex, options = {}) {
        if (isUpdating || startIndex <= 0) return;
        if (startIndex >= mainSwiper.slides.length) return;

        isUpdating = true;

        var { animate = true } = options;
        var transitionSpeed = animate ? (mainSwiper.params.speed || 300) : 0;

        if (animate) {
            mainSwiper.slideTo(startIndex, transitionSpeed);
            thumbSwiper.slideTo(startIndex, transitionSpeed);
        }

        var reorderSlides = () => {
            var mainSlides = Array.from(mainSwiper.slides).map((slide) => slide.outerHTML);
            var thumbSlides = Array.from(thumbSwiper.slides).map((slide) => slide.outerHTML);
            var reorderedMain = mainSlides.slice(startIndex).concat(mainSlides.slice(0, startIndex));
            var reorderedThumbs = thumbSlides.slice(startIndex).concat(thumbSlides.slice(0, startIndex));

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
        var clickedIndex = $(this).index();
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
