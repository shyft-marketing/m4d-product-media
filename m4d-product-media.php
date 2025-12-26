<?php
/**
 * Plugin Name: M4D Product Media
 * Description: Custom product image + variation media handler.
 * Version: 0.2.4
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

	const META_KEY = '_m4d_variation_gallery';

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

		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || empty( $screen->post_type ) || $screen->post_type !== 'product' ) {
			return;
		}

		wp_enqueue_media();

		$admin_js = plugin_dir_url( __FILE__ ) . 'assets/js/m4d-product-media-admin.js';

		wp_enqueue_script(
			'm4d-product-media-admin',
			$admin_js,
			[ 'jquery' ],
			'0.1.0',
			true
		);
	}

	public function render_variation_gallery_field( $loop, $variation_data, $variation ) {
		$image_ids = get_post_meta( $variation->ID, self::META_KEY, true );
		$image_ids = is_array( $image_ids ) ? array_values( array_filter( array_map( 'absint', $image_ids ) ) ) : [];
		?>
		<div class="form-row form-row-full m4d-variation-gallery-wrapper">
			<label><strong>Variation Image Gallery</strong></label>

			<ul class="m4d-variation-gallery" data-variation-id="<?php echo esc_attr( $variation->ID ); ?>">
				<?php foreach ( $image_ids as $image_id ) :
					$thumb = wp_get_attachment_image_url( $image_id, 'thumbnail' );
					if ( ! $thumb ) {
						continue;
					}
					?>
					<li data-attachment-id="<?php echo esc_attr( $image_id ); ?>">
						<img src="<?php echo esc_url( $thumb ); ?>" alt="" />
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
			delete_post_meta( $variation_id, self::META_KEY );
			return;
		}

		$raw = (string) $_POST['m4d_variation_gallery'][ $variation_id ];

		$ids = array_filter(
			array_map(
				'absint',
				array_filter( array_map( 'trim', explode( ',', $raw ) ) )
			)
		);

		update_post_meta( $variation_id, self::META_KEY, array_values( $ids ) );
	}

	/* -------------------------
	 * FRONTEND
	 * ------------------------- */

	public function enqueue_frontend_assets() {
		// Only enqueue on product pages (and product previews that behave like product pages).
		if ( ! is_singular( 'product' ) ) {
			return;
		}

		wp_enqueue_style(
			'swiper',
			'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
			[],
			'11.0.0'
		);

		wp_enqueue_script(
			'swiper',
			'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
			[],
			'11.0.0',
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
		if ( empty( $variation['variation_id'] ) ) {
			return $variation;
		}

		$gallery_ids = get_post_meta( (int) $variation['variation_id'], self::META_KEY, true );

		if ( ! is_array( $gallery_ids ) || empty( $gallery_ids ) ) {
			return $variation;
		}

		$gallery_ids = array_values( array_filter( array_map( 'absint', $gallery_ids ) ) );
		if ( empty( $gallery_ids ) ) {
			return $variation;
		}

		$images = [];
		foreach ( $gallery_ids as $id ) {
			$src = wp_get_attachment_image_url( $id, 'full' );
			if ( ! $src ) {
				continue;
			}
			$images[] = [
				'id'  => $id,
				'src' => $src,
			];
		}

		if ( ! empty( $images ) ) {
			$variation['m4d_gallery'] = $images;
		}

		return $variation;
	}

	/* -------------------------
	 * SHORTCODE
	 * ------------------------- */

	public function render_product_media_shortcode( $atts = [], $content = null ) {
		// IMPORTANT: Shortcodes must RETURN a string (not echo),
		// otherwise Elementor/WP AJAX responses can break (reload loop / “connection lost”).
		if ( ! function_exists( 'wc_get_product' ) ) {
			return '';
		}

		$product = null;

		// Prefer the global product when available.
		if ( function_exists( 'is_singular' ) && is_singular( 'product' ) ) {
			global $product;
		}

		// Fallback: try getting a product from current post ID.
		if ( ! $product ) {
			$post_id = get_the_ID();
			if ( $post_id ) {
				$maybe = wc_get_product( $post_id );
				if ( $maybe instanceof WC_Product ) {
					$product = $maybe;
				}
			}
		}

		if ( ! ( $product instanceof WC_Product ) ) {
			return '';
		}

		$image_ids = $product->get_gallery_image_ids();
		$main_id   = $product->get_image_id();

		if ( $main_id ) {
			array_unshift( $image_ids, $main_id );
		}

		$image_ids = array_values( array_filter( array_map( 'absint', $image_ids ) ) );
		if ( empty( $image_ids ) ) {
			return '';
		}

		ob_start();
		?>
		<div class="m4d-product-media">
			<div class="swiper m4d-main-swiper">
				<div class="swiper-wrapper">
					<?php foreach ( $image_ids as $id ) :
						$src = wp_get_attachment_image_url( $id, 'full' );
						if ( ! $src ) {
							continue;
						}
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
					<?php foreach ( $image_ids as $id ) :
						$src = wp_get_attachment_image_url( $id, 'thumbnail' );
						if ( ! $src ) {
							continue;
						}
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
