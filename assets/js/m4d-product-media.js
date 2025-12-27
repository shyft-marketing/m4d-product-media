jQuery(function ($) {
    if (window.M4DProductMediaInit) {
        return;
    }
    window.M4DProductMediaInit = true;

    if (typeof Swiper === 'undefined') {
        return;
    }

    const $mainSwiperEl = $('.m4d-main-swiper');
    const $thumbSwiperEl = $('.m4d-thumb-swiper');
    const $mainWrapper = $mainSwiperEl.find('.swiper-wrapper');
    const $thumbWrapper = $thumbSwiperEl.find('.swiper-wrapper');

    if (!$mainWrapper.length || !$thumbWrapper.length) {
        return;
    }

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
    const transitionSpeed = 300;

    const getThumbSpacing = () => {
        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return Number.isFinite(remSize) ? remSize : 16;
    };

    let thumbSpacing = getThumbSpacing();

    const setThumbSpacingVar = () => {
        if ($thumbSwiperEl[0]) {
            $thumbSwiperEl[0].style.setProperty('--m4d-thumb-spacing', `${thumbSpacing}px`);
        }
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

    setThumbSpacingVar();

    const mainSwiper = new Swiper($mainSwiperEl.get(0), {
        speed: transitionSpeed,
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
        const nextSpacing = getThumbSpacing();
        if (nextSpacing === thumbSpacing) {
            return;
        }
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

    let isUpdating = false;

    function resetToProductImages() {
        if (isUpdating) {
            return;
        }
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
        if (!images || !images.length || isUpdating) {
            return;
        }

        isUpdating = true;

        mainSwiper.removeAllSlides();
        thumbSwiper.removeAllSlides();

        images.forEach((img) => {
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

    function getVariationImage(variation) {
        if (!variation || !variation.image) {
            return null;
        }

        const image = variation.image;
        const full = image.full_src || image.src;
        const thumb = image.thumb_src || image.src;

        if (!full || !thumb) {
            return null;
        }

        return { full, thumb };
    }

    $('form.variations_form')
        .on('found_variation', function (e, variation) {
            if (!variation || !variation.variation_id) {
                return;
            }

            const variationImage = getVariationImage(variation);

            $.post(
                M4D_MEDIA.ajax_url,
                {
                    action: 'm4d_get_variation_gallery',
                    nonce: M4D_MEDIA.nonce,
                    variation_id: variation.variation_id
                },
                function (res) {
                    const images = [];

                    if (variationImage) {
                        images.push(variationImage);
                    }

                    if (res.success && res.data.length) {
                        images.push(...res.data);
                    }

                    if (images.length) {
                        loadVariationImages(images);
                        return;
                    }

                    resetToProductImages();
                }
            );
        })
        .on('reset_data', function () {
            resetToProductImages();
        });
});
