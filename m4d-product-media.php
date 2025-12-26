<?php
/**
 * Plugin Name: M4D Product Media
 * Description: Custom product image + variation media handler.
 * Version: 0.2.2
 * Author: SHYFT
 * Author URI: https://shyft.wtf/
 * Plugin URI: https://github.com/shyft-marketing/m4d-product-media
 * GitHub Plugin URI: https://github.com/shyft-marketing/m4d-product-media
 * Primary Branch: main
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class M4D_Product_Media {

    public function __construct() {
        // Admin
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
        add_action( 'woocommerce_product_after_variable_attributes', [ $this, 'render_variation_gallery_field' ], 10, 3 );
        add_action( 'woocommerce_save_product_variation', [ $this, 'save_variation_gallery' ], 10, 2 );

        // Frontend
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );
        add_filter( 'woocommerce_available_variation', [ $this, 'inject_variation_gallery_data' ] );

        // Shortcode
        add_shortcode( 'm4d_product_media', [ $this, 'render_product_media_shortcode' ] );
    }

    /* -------------------------
     * ADMIN
     * ------------------------- */

    public function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'post.php' && $hook !== 'post-new.php' ) {
            return;
        }

        $screen = get_current_screen();
        if ( ! $screen || $screen->post_type !== 'product' ) {
            return;
        }

        wp_enqueue_media();

        wp_enqueue_script(
            'm4d-product-media-admin',
            plugin_dir_url( __FILE__ ) . 'assets/js/m4d-product-media-admin.js',
            [ 'jquery' ],
            '0.1.0',
            true
        );
    }

    public function render_variation_gallery_field( $loop, $variation_data, $variation ) {
        $image_ids = get_post_meta( $variation->ID, '_m4d_variation_gallery', true );
        $image_ids = is_array( $image_ids ) ? $image_ids : [];
        ?>
        <div class="form-row form-row-full m4d-variation-gallery-wrapper">
            <label><strong>Variation Image Gallery</strong></label>

            <ul class="m4d-variation-gallery" data-variation-id="<?php echo esc_attr( $variation->ID ); ?>">
                <?php foreach ( $image_ids as $image_id ) :
                    $thumb = wp_get_attachment_image_url( $image_id, 'thumbnail' );
                    ?>
                    <li data-attachment-id="<?php echo esc_attr( $image_id ); ?>">
                        <img src="<?php echo esc_url( $thumb ); ?>" />
                        <button type="button" class="m4d-remove-image">×</button>
                    </li>
                <?php endforeach; ?>
            </ul>

            <input
                type="hidden"
                class="m4d-variation-gallery-input"
                name="m4d_variation_gallery[<?php echo esc_attr( $variation->ID ); ?>]"
                value="<?php echo esc_attr( implode( ',', $image_ids ) ); ?>"
            />

            <button type="button" class="button m4d-add-variation-images">
                Add Gallery Images
            </button>
        </div>
        <?php
    }

    public function save_variation_gallery( $variation_id, $i ) {
        if ( ! isset( $_POST['m4d_variation_gallery'][ $variation_id ] ) ) {
            delete_post_meta( $variation_id, '_m4d_variation_gallery' );
            return;
        }

        $ids = array_filter(
            array_map(
                'absint',
                explode( ',', $_POST['m4d_variation_gallery'][ $variation_id ] )
            )
        );

        update_post_meta( $variation_id, '_m4d_variation_gallery', $ids );
    }

    /* -------------------------
     * FRONTEND
     * ------------------------- */

    public function enqueue_frontend_assets() {
        if ( ! is_product() ) {
            return;
        }

        wp_enqueue_style(
            'swiper',
            'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
            [],
            '11.0'
        );

        wp_enqueue_script(
            'swiper',
            'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
            [],
            '11.0',
            true
        );

        wp_enqueue_style(
            'm4d-product-media',
            plugin_dir_url( __FILE__ ) . 'assets/css/m4d-product-media.css',
            [],
            '0.1.0'
        );

        wp_enqueue_script(
            'm4d-product-media',
            plugin_dir_url( __FILE__ ) . 'assets/js/m4d-product-media.js',
            [ 'jquery', 'swiper' ],
            '0.1.0',
            true
        );
    }

    public function inject_variation_gallery_data( $variation ) {
        $gallery_ids = get_post_meta( $variation['variation_id'], '_m4d_variation_gallery', true );

        if ( is_array( $gallery_ids ) && ! empty( $gallery_ids ) ) {
            $images = [];

            foreach ( $gallery_ids as $id ) {
                $images[] = [
                    'id'  => $id,
                    'src' => wp_get_attachment_image_url( $id, 'full' ),
                ];
            }

            $variation['m4d_gallery'] = $images;
        }

        return $variation;
    }

    /* -------------------------
     * SHORTCODE
     * ------------------------- */

    public function render_product_media_shortcode() {
        if ( ! is_product() ) {
            return '';
        }

        global $product;

        if ( ! $product ) {
            return '';
        }

        $image_ids = $product->get_gallery_image_ids();
        array_unshift( $image_ids, $product->get_image_id() );
        ?>
        <div class="m4d-product-media">
            <div class="swiper m4d-main-swiper">
                <div class="swiper-wrapper">
                    <?php foreach ( $image_ids as $id ) :
                        $src = wp_get_attachment_image_url( $id, 'full' );
                        ?>
                        <div class="swiper-slide" data-image-id="<?php echo esc_attr( $id ); ?>">
                            <img src="<?php echo esc_url( $src ); ?>" />
                        </div>
                    <?php endforeach; ?>
                </div>

                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>

            <div class="swiper m4d-thumb-swiper">
                <div class="swiper-wrapper">
                    <?php foreach ( $image_ids as $id ) :
                        $src = wp_get_attachment_image_url( $id, 'thumbnail' );
                        ?>
                        <div class="swiper-slide" data-image-id="<?php echo esc_attr( $id ); ?>">
                            <img src="<?php echo esc_url( $src ); ?>" />
                        </div>
                    <?php endforeach; ?>
                </div>
                <div class="swiper-pagination"></div>
            </div>
        </div>
        <?php
    }
}

new M4D_Product_Media();
