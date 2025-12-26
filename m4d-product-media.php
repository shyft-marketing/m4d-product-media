<?php
/**
 * Plugin Name: M4D Product Media
 * Description: Custom product image + variation media handler.
 * Version: 0.1.0
 * Author: SHYFT
 * Author URI: https://shyft.wtf/
 * Plugin URI: https://github.com/shyft-marketing/m4d-product-media
 * GitHub Plugin URI: https://github.com/shyft-marketing/m4d-product-media
 * Primary Branch: main
 */

defined( 'ABSPATH' ) || exit;


if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'wp_footer', function () {
    if ( ! is_product() ) {
        return;
    }

    global $product;

    if ( ! $product instanceof WC_Product ) {
        return;
    }

    // Base product images
    $product_images = [];

    foreach ( $product->get_gallery_image_ids() as $image_id ) {
        $product_images[] = [
            'id'  => $image_id,
            'src' => wp_get_attachment_image_url( $image_id, 'full' ),
            'alt' => get_post_meta( $image_id, '_wp_attachment_image_alt', true ),
        ];
    }

    // Include featured image first
    if ( $product->get_image_id() ) {
        array_unshift( $product_images, [
            'id'  => $product->get_image_id(),
            'src' => wp_get_attachment_image_url( $product->get_image_id(), 'full' ),
            'alt' => get_post_meta( $product->get_image_id(), '_wp_attachment_image_alt', true ),
        ]);
    }

    // Variations
    $variations_data = [];

    if ( $product->is_type( 'variable' ) ) {
        foreach ( $product->get_available_variations() as $variation ) {
            $vid = $variation['variation_id'];

            $images = [];

            if ( ! empty( $variation['image']['id'] ) ) {
                $image_id = $variation['image']['id'];

                $images[] = [
                    'id'  => $image_id,
                    'src' => wp_get_attachment_image_url( $image_id, 'full' ),
                    'alt' => get_post_meta( $image_id, '_wp_attachment_image_alt', true ),
                ];
            }

            $variations_data[ $vid ] = [
                'attributes' => $variation['attributes'],
                'images'     => $images,
            ];
        }
    }
    ?>

    <script>
        window.M4DProductMedia = <?php echo wp_json_encode([
            'productImages' => $product_images,
            'variations'    => $variations_data,
        ]); ?>;
    </script>

    <?php
});