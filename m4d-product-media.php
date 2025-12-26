<?php
/**
 * Plugin Name: M4D Product Media
 * Description: Custom product image + variation media handler.
 * Version: 0.2.5
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
        return;
    }

    $raw = trim( wp_unslash( $_POST['m4d_variation_gallery'][ $variation_id ] ) );

    if ( $raw === '' ) {
        delete_post_meta( $variation_id, '_m4d_variation_gallery' );
        return;
    }

    $ids = array_filter(
        array_map( 'absint', explode( ',', $raw ) )
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

        // Provide default (no-variation-selected) media so JS can cleanly reset without reloading.
        $defaults = $this->get_default_product_media_payload();
        wp_localize_script( 'm4d-product-media', 'M4D_PRODUCT_MEDIA', $defaults );
    }

    private function get_default_product_media_payload() {
        global $product;

        $payload = [
            'product_id'     => 0,
            'featured_full'  => '',
            'featured_id'    => 0,
            'gallery'        => [], // full + thumb
        ];

        if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
            return $payload;
        }

        $payload['product_id']  = (int) $product->get_id();
        $payload['featured_id'] = (int) $product->get_image_id();

        if ( $payload['featured_id'] ) {
            $payload['featured_full'] = (string) wp_get_attachment_image_url( $payload['featured_id'], 'full' );
        }

        $gallery_ids = $product->get_gallery_image_ids();

        foreach ( $gallery_ids as $id ) {
            $id = (int) $id;
            $payload['gallery'][] = [
                'id'    => $id,
                'full'  => (string) wp_get_attachment_image_url( $id, 'full' ),
                'thumb' => (string) wp_get_attachment_image_url( $id, 'thumbnail' ),
            ];
        }

        return $payload;
    }

    public function inject_variation_gallery_data( $variation ) {
        // Always include the key so JS logic is predictable.
        $variation['m4d_gallery'] = [];

        $gallery_ids = get_post_meta( $variation['variation_id'], '_m4d_variation_gallery', true );

        if ( is_array( $gallery_ids ) && ! empty( $gallery_ids ) ) {
            foreach ( $gallery_ids as $id ) {
                $id = (int) $id;
                $variation['m4d_gallery'][] = [
                    'id'    => $id,
                    'full'  => (string) wp_get_attachment_image_url( $id, 'full' ),
                    'thumb' => (string) wp_get_attachment_image_url( $id, 'thumbnail' ),
                ];
            }
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
        if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
            return '';
        }

        // Default view:
        // - Main swiper: featured image first, then product gallery images
        // - Thumbs: ONLY product gallery images (not the featured image)
        $featured_id = (int) $product->get_image_id();
        $gallery_ids = $product->get_gallery_image_ids();

        $main_ids = [];
        if ( $featured_id ) {
            $main_ids[] = $featured_id;
        }
        foreach ( $gallery_ids as $gid ) {
            $main_ids[] = (int) $gid;
        }

        ob_start();
        ?>
        <div class="m4d-product-media" data-product-id="<?php echo esc_attr( $product->get_id() ); ?>">
            <div class="swiper m4d-main-swiper">
                <div class="swiper-wrapper">
                    <?php foreach ( $main_ids as $id ) :
                        $src = wp_get_attachment_image_url( $id, 'full' );
                        if ( ! $src ) { continue; }
                        ?>
                        <div class="swiper-slide" data-image-id="<?php echo esc_attr( $id ); ?>">
                            <img src="<?php echo esc_url( $src ); ?>" alt="" />
                        </div>
                    <?php endforeach; ?>
                </div>

                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>

            <div class="swiper m4d-thumb-swiper">
                <div class="swiper-wrapper">
                    <?php foreach ( $gallery_ids as $id ) :
                        $id = (int) $id;
                        $src = wp_get_attachment_image_url( $id, 'thumbnail' );
                        if ( ! $src ) { continue; }
                        ?>
                        <div class="swiper-slide" data-image-id="<?php echo esc_attr( $id ); ?>">
                            <img src="<?php echo esc_url( $src ); ?>" alt="" />
                        </div>
                    <?php endforeach; ?>
                </div>
                <div class="swiper-pagination"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

new M4D_Product_Media();
