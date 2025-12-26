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

if ( ! defined( 'ABSPATH' ) ) exit;

class M4D_Product_Media {

  const VERSION = '0.2.1';

  public function __construct() {
    // Admin
    add_action( 'woocommerce_product_after_variable_attributes', [ $this, 'add_variation_gallery_field' ], 10, 3 );
    add_action( 'woocommerce_save_product_variation', [ $this, 'save_variation_gallery' ], 10, 2 );
    add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );

    // Frontend
    add_filter( 'woocommerce_available_variation', [ $this, 'add_gallery_to_variation_data' ], 20, 3 );
    add_shortcode( 'm4d_product_media', [ $this, 'render_shortcode' ] );
    add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );
  }

  private function plugin_url( $path = '' ) {
    return plugin_dir_url( __FILE__ ) . ltrim( $path, '/' );
  }

  /* -------------------------
   * ADMIN
   * ------------------------- */

  public function enqueue_admin_assets( $hook ) {
    // Only load on product edit screens.
    if ( ! isset( $_GET['post'] ) && ! isset( $_GET['post_type'] ) ) return;

    wp_enqueue_media();

    wp_enqueue_script(
      'm4d-product-media-admin',
      $this->plugin_url( 'assets/js/m4d-product-media.js' ),
      [ 'jquery' ],
      self::VERSION,
      true
    );

    // Optional: admin-only CSS could be added later if needed.
  }

  public function add_variation_gallery_field( $loop, $variation_data, $variation ) {
    $gallery = get_post_meta( $variation->ID, '_m4d_variation_gallery', true );
    $ids = is_array( $gallery ) ? implode( ',', $gallery ) : '';
    ?>
    <div class="form-row form-row-full m4d-variation-gallery">
      <label>Variation Image Gallery</label>

      <ul class="m4d-gallery-preview">
        <?php
        if ( is_array( $gallery ) ) {
          foreach ( $gallery as $image_id ) {
            $thumb = wp_get_attachment_image( $image_id, 'thumbnail' );
            if ( $thumb ) {
              echo '<li data-id="' . esc_attr( $image_id ) . '">' . $thumb . '<span class="remove">×</span></li>';
            }
          }
        }
        ?>
      </ul>

      <input type="hidden"
        name="m4d_variation_gallery[<?php echo esc_attr( $variation->ID ); ?>]"
        class="m4d-gallery-input"
        value="<?php echo esc_attr( $ids ); ?>"
      >

      <button type="button" class="button m4d-add-gallery">Add Gallery Images</button>

      <p class="description" style="margin:8px 0 0;">
        These images will be used on the frontend gallery when this variation is selected.
      </p>
    </div>
    <?php
  }

  public function save_variation_gallery( $variation_id, $i ) {
    if ( isset( $_POST['m4d_variation_gallery'][ $variation_id ] ) ) {
      $raw = (string) $_POST['m4d_variation_gallery'][ $variation_id ];
      $ids = array_filter( array_map( 'intval', explode( ',', $raw ) ) );
      update_post_meta( $variation_id, '_m4d_variation_gallery', $ids );
    }
  }

  /* -------------------------
   * FRONTEND
   * ------------------------- */

  public function enqueue_frontend_assets() {
    if ( ! is_product() ) return;

    // Swiper
    wp_enqueue_style(
      'swiper',
      'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css',
      [],
      null
    );

    wp_enqueue_script(
      'swiper',
      'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js',
      [],
      null,
      true
    );

    // Plugin CSS
    wp_enqueue_style(
      'm4d-product-media',
      $this->plugin_url( 'assets/css/m4d-product-media.css' ),
      [],
      self::VERSION
    );

    // Plugin JS
    wp_enqueue_script(
      'm4d-product-media',
      $this->plugin_url( 'assets/js/m4d-product-media.js' ),
      [ 'jquery', 'swiper', 'wc-add-to-cart-variation' ],
      self::VERSION,
      true
    );
  }

  public function add_gallery_to_variation_data( $data, $product = null, $variation = null ) {
    $variation_id = isset( $data['variation_id'] ) ? (int) $data['variation_id'] : 0;
    $ids = get_post_meta( $variation_id, '_m4d_variation_gallery', true );
    $ids = is_array( $ids ) ? array_values( array_filter( array_map( 'intval', $ids ) ) ) : [];

    // Build URL payloads (no filename guessing, no wp.media on frontend)
    $items = [];
    foreach ( $ids as $id ) {
      $large = wp_get_attachment_image_url( $id, 'large' );
      $thumb = wp_get_attachment_image_url( $id, 'thumbnail' );
      if ( $large ) {
        $items[] = [
          'id'    => $id,
          'large' => $large,
          'thumb' => $thumb ? $thumb : $large,
        ];
      }
    }

    $data['m4d_gallery'] = $items;
    return $data;
  }

  public function render_shortcode() {
    global $product;
    if ( ! $product || ! is_a( $product, 'WC_Product' ) ) return '';

    // Base product gallery (fallback/default)
    $ids = array_filter( array_merge(
      [ $product->get_image_id() ],
      $product->get_gallery_image_ids()
    ) );

    $base_items = [];
    foreach ( $ids as $id ) {
      $large = wp_get_attachment_image_url( $id, 'large' );
      $thumb = wp_get_attachment_image_url( $id, 'thumbnail' );
      if ( $large ) {
        $base_items[] = [
          'id'    => $id,
          'large' => $large,
          'thumb' => $thumb ? $thumb : $large,
        ];
      }
    }

    // Output base gallery JSON for frontend reset/fallback
    $json = wp_json_encode( $base_items );

    ob_start(); ?>
      <div class="m4d-product-media" data-base-gallery='<?php echo esc_attr( $json ); ?>'>

        <div class="swiper m4d-main">
          <div class="swiper-wrapper">
            <?php foreach ( $base_items as $item ) : ?>
              <div class="swiper-slide" data-id="<?php echo esc_attr( $item['id'] ); ?>">
                <img src="<?php echo esc_url( $item['large'] ); ?>" alt="">
              </div>
            <?php endforeach; ?>
          </div>

          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
        </div>

        <div class="swiper m4d-thumbs">
          <div class="swiper-wrapper">
            <?php foreach ( $base_items as $item ) : ?>
              <div class="swiper-slide" data-id="<?php echo esc_attr( $item['id'] ); ?>">
                <img src="<?php echo esc_url( $item['thumb'] ); ?>" alt="">
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
