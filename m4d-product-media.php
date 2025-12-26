<?php
/**
 * Plugin Name: M4D Product Media
 * Description: Custom product image + variation media handler.
 * Version: 0.2.1
 * Author: SHYFT
 * Author URI: https://shyft.wtf/
 * Plugin URI: https://github.com/shyft-marketing/m4d-product-media
 * GitHub Plugin URI: https://github.com/shyft-marketing/m4d-product-media
 * Primary Branch: main
 */

if (!defined('ABSPATH')) exit;

class M4D_Product_Media {
    const HANDLE = 'm4d-product-media';

    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        add_shortcode('m4d_product_media', [$this, 'shortcode']);
    }

    public function register_assets() {
        wp_register_style(
            self::HANDLE,
            plugins_url('assets/css/m4d-product-media.css', __FILE__),
            [],
            '0.1.0'
        );

        wp_register_script(
            self::HANDLE,
            plugins_url('assets/js/m4d-product-media.js', __FILE__),
            ['jquery'],
            '0.1.0',
            true
        );

        wp_register_style(
            'm4d-swiper',
            'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
            [],
            '11.0.0'
        );

        wp_register_script(
            'm4d-swiper',
            'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
            [],
            '11.0.0',
            true
        );
    }

    public function shortcode($atts = []) {
        if (!function_exists('is_product') || !is_product()) {
            return '';
        }

        global $product;
        if (!$product || !is_a($product, 'WC_Product')) {
            return '';
        }

        $image_ids = [];

        $featured_id = $product->get_image_id();
        if ($featured_id) {
            $image_ids[] = $featured_id;
        }

        $gallery_ids = $product->get_gallery_image_ids();
        if (!empty($gallery_ids)) {
            $image_ids = array_merge($image_ids, $gallery_ids);
        }

        $images = [];
        foreach ($image_ids as $id) {
            $full  = wp_get_attachment_image_src($id, 'full');
            $large = wp_get_attachment_image_src($id, 'large');
            $thumb = wp_get_attachment_image_src($id, 'woocommerce_thumbnail');

            if (!$full || empty($full[0])) continue;

            $alt = trim(get_post_meta($id, '_wp_attachment_image_alt', true));

            $images[] = [
                'id'    => (int) $id,
                'full'  => $full[0],
                'large' => ($large && !empty($large[0])) ? $large[0] : $full[0],
                'thumb' => ($thumb && !empty($thumb[0])) ? $thumb[0] : $full[0],
                'alt'   => $alt,
            ];
        }

        wp_enqueue_style('m4d-swiper');
        wp_enqueue_script('m4d-swiper');
        wp_enqueue_style(self::HANDLE);
        wp_enqueue_script(self::HANDLE);

        wp_localize_script(self::HANDLE, 'M4DPM', [
            'baseImages' => $images,
        ]);

        ob_start(); ?>
        <div class="m4d-pm" data-m4d-pm="1">
            <div class="m4d-pm-main swiper">
                <div class="swiper-wrapper"></div>

                <div class="m4d-pm-nav m4d-pm-prev" aria-label="Previous slide"></div>
                <div class="m4d-pm-nav m4d-pm-next" aria-label="Next slide"></div>
            </div>

            <div class="m4d-pm-thumbs swiper">
                <div class="swiper-wrapper"></div>
                <div class="m4d-pm-thumbs-pagination"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

new M4D_Product_Media();
