<?php
/**
 * Plugin Name: M4D Product Media
 * Description: Custom product image + variation media handler.
 * Version: 0.2.22
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

		/* Admin */
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_assets' ] );
		add_action( 'woocommerce_product_after_variable_attributes', [ $this, 'render_variation_gallery_field' ], 10, 3 );

		// Save hook that works reliably with Woo’s AJAX variation save flow.
		add_action( 'woocommerce_admin_process_variation_object', [ $this, 'save_variation_gallery_safe' ], 10, 2 );

		/* Frontend */
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_assets' ] );

		/* AJAX */
		add_action( 'wp_ajax_m4d_get_variation_gallery', [ $this, 'ajax_get_variation_gallery' ] );
		add_action( 'wp_ajax_nopriv_m4d_get_variation_gallery', [ $this, 'ajax_get_variation_gallery' ] );

		/* Shortcode */
		add_shortcode( 'm4d_product_media', [ $this, 'render_product_media_shortcode' ] );
	}

	/* -------------------------
	 * ADMIN
	 * ------------------------- */

	public function enqueue_admin_assets( $hook ) {
		if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || $screen->post_type !== 'product' ) {
			return;
		}

		wp_enqueue_media();

		wp_enqueue_style(
			'm4d-product-media-admin',
			plugin_dir_url( __FILE__ ) . 'assets/css/m4d-product-media-admin.css',
			[],
			'0.2.13'
		);

		wp_enqueue_script(
			'm4d-product-media-admin',
			plugin_dir_url( __FILE__ ) . 'assets/js/m4d-product-media-admin.js',
			[ 'jquery', 'jquery-ui-sortable' ],
			'0.2.13',
			true
		);
	}

	public function render_variation_gallery_field( $loop, $variation_data, $variation ) {
		$variation_id = $variation->ID;

		$image_ids = get_post_meta( $variation_id, '_m4d_variation_gallery', true );
		$image_ids = is_array( $image_ids ) ? $image_ids : [];

		?>
		<div class="form-row form-row-full m4d-variation-gallery-wrapper">
			<label><strong>Variation Image Gallery</strong></label>

			<div class="m4d-variation-gallery-container">
				<ul class="product_images m4d-variation-gallery"
				data-variation-id="<?php echo esc_attr( $variation_id ); ?>"
				data-loop-index="<?php echo esc_attr( $loop ); ?>"
			>
					<?php foreach ( $image_ids as $image_id ) :
						$thumb = wp_get_attachment_image_url( $image_id, 'thumbnail' );
						if ( ! $thumb ) { continue; }
						?>
						<li class="image" data-attachment_id="<?php echo esc_attr( $image_id ); ?>">
							<img src="<?php echo esc_url( $thumb ); ?>" />
							<ul class="actions">
								<li>
									<a href="#" class="delete m4d-remove-image" title="Remove image">×</a>
								</li>
							</ul>
						</li>
					<?php endforeach; ?>
				</ul>
			</div>

			<?php
			/**
			 * IMPORTANT:
			 * Woo’s variation saving is heavily index-driven.
			 * So we store the same data in two fields:
			 * 1) by variation ID (easy lookup)
			 * 2) by loop index (matches Woo's save payload pattern)
			 */
			?>
			<input type="hidden"
				class="m4d-variation-gallery-input"
				name="m4d_variation_gallery_by_id[<?php echo esc_attr( $variation_id ); ?>]"
				value="<?php echo esc_attr( implode( ',', $image_ids ) ); ?>"
			/>

			<input type="hidden"
				class="m4d-variation-gallery-input"
				name="m4d_variation_gallery_by_index[<?php echo esc_attr( $loop ); ?>]"
				value="<?php echo esc_attr( implode( ',', $image_ids ) ); ?>"
			/>

			<p class="add_product_images hide-if-no-js">
				<a href="#" class="button m4d-add-variation-images">Add product gallery images</a>
			</p>
			<p class="description" style="margin-top:6px;">
				Tip: Drag to reorder. These are additional images only — the main variation image stays separate.
			</p>
		</div>
		<?php
	}

	public function save_variation_gallery_safe( $variation, $index ) {
		$variation_id = $variation->get_id();

		$raw = '';

		// Preferred: by variation ID
		if ( isset( $_POST['m4d_variation_gallery_by_id'][ $variation_id ] ) ) {
			$raw = sanitize_text_field( wp_unslash( $_POST['m4d_variation_gallery_by_id'][ $variation_id ] ) );
		}
		// Fallback: by loop index (how Woo often submits variation fields)
		elseif ( isset( $_POST['m4d_variation_gallery_by_index'][ $index ] ) ) {
			$raw = sanitize_text_field( wp_unslash( $_POST['m4d_variation_gallery_by_index'][ $index ] ) );
		}

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
			'11'
		);

		wp_enqueue_script(
			'swiper',
			'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
			[],
			'11',
			true
		);

		wp_enqueue_style(
			'm4d-product-media',
			plugin_dir_url( __FILE__ ) . 'assets/css/m4d-product-media.css',
			[],
			'0.2.13'
		);

		wp_enqueue_script(
			'm4d-product-media',
			plugin_dir_url( __FILE__ ) . 'assets/js/m4d-product-media.js',
			[ 'jquery', 'swiper' ],
			'0.2.13',
			true
		);

		wp_localize_script(
			'm4d-product-media',
			'M4D_MEDIA',
			[
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'm4d_media_nonce' ),
			]
		);
	}

	/* -------------------------
	 * AJAX
	 * ------------------------- */

	public function ajax_get_variation_gallery() {
		check_ajax_referer( 'm4d_media_nonce', 'nonce' );

		$variation_id = absint( $_POST['variation_id'] ?? 0 );
		if ( ! $variation_id ) {
			wp_send_json_error();
		}

		$ids = get_post_meta( $variation_id, '_m4d_variation_gallery', true );
		$ids = is_array( $ids ) ? $ids : [];

		$images = [];
		foreach ( $ids as $id ) {
			$full  = wp_get_attachment_image_url( $id, 'full' );
			$thumb = wp_get_attachment_image_url( $id, 'thumbnail' );

			if ( ! $full || ! $thumb ) { continue; }

			$images[] = [
				'full'  => $full,
				'thumb' => $thumb,
			];
		}

		wp_send_json_success( $images );
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

		$featured_id = $product->get_image_id();
		$gallery_ids = $product->get_gallery_image_ids();
		$main_image_ids = array_values( array_unique( array_filter( array_merge( [ $featured_id ], $gallery_ids ) ) ) );

		ob_start();
		?>
		<div class="m4d-product-media">

			<div class="swiper m4d-main-swiper">
				<div class="swiper-wrapper">
					<?php foreach ( $main_image_ids as $id ) :
						$full = wp_get_attachment_image_url( $id, 'full' );
						if ( ! $full ) { continue; }
						?>
						<div class="swiper-slide">
							<img src="<?php echo esc_url( $full ); ?>" />
						</div>
					<?php endforeach; ?>
				</div>

				<div class="swiper-button-next"></div>
				<div class="swiper-button-prev"></div>
			</div>

			<div class="swiper m4d-thumb-swiper">
				<div class="swiper-wrapper">
					<?php foreach ( $main_image_ids as $id ) :
						$thumb = wp_get_attachment_image_url( $id, 'thumbnail' );
						if ( ! $thumb ) { continue; }
						?>
						<div class="swiper-slide">
							<img src="<?php echo esc_url( $thumb ); ?>" />
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
