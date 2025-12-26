jQuery(function ($) {

    function getIds($ul) {
        return $ul.find('li[data-attachment-id]').map(function () {
            return $(this).data('attachment-id');
        }).get();
    }

    function syncInputsAndMarkDirty($ul) {
        const ids = getIds($ul).join(',');

        const variationId = $ul.data('variation-id');
        const loopIndex = $ul.data('loop-index');

        // Update BOTH hidden fields (by ID + by index)
        const $wrapper = $ul.closest('.m4d-variation-gallery-wrapper');

        const $byId = $wrapper.find(`input[name="m4d_variation_gallery_by_id[${variationId}]"]`);
        const $byIndex = $wrapper.find(`input[name="m4d_variation_gallery_by_index[${loopIndex}]"]`);

        $byId.val(ids).trigger('change');
        $byIndex.val(ids).trigger('change');

        // Tell Woo this variation changed (this enables "Save changes")
        const $variationBox = $ul.closest('.woocommerce_variation');
        $variationBox.addClass('variation-needs-update');
        $('#variable_product_options').trigger('woocommerce_variations_input_changed');
        $('.save-variation-changes').prop('disabled', false);
    }

    // Make the list sortable (drag reorder)
    $(document).on('mouseenter', '.m4d-variation-gallery', function () {
        const $ul = $(this);
        if ($ul.data('m4dSortableInit')) return;

        $ul.data('m4dSortableInit', true);

        $ul.sortable({
            items: 'li',
            stop: function () {
                syncInputsAndMarkDirty($ul);
            }
        });
    });

    // Add images
    $(document).on('click', '.m4d-add-variation-images', function (e) {
        e.preventDefault();

        const $btn = $(this);
        const $wrapper = $btn.closest('.m4d-variation-gallery-wrapper');
        const $ul = $wrapper.find('.m4d-variation-gallery');

        const frame = wp.media({
            title: 'Select gallery images',
            button: { text: 'Add images' },
            multiple: true
        });

        frame.on('select', function () {
            const selection = frame.state().get('selection').toArray();

            selection.forEach(att => {
                const id = att.id;

                // Avoid duplicates
                if ($ul.find(`li[data-attachment-id="${id}"]`).length) return;

                const thumb = (att.attributes.sizes && att.attributes.sizes.thumbnail)
                    ? att.attributes.sizes.thumbnail.url
                    : att.attributes.url;

                $ul.append(`
                    <li data-attachment-id="${id}" style="position:relative; list-style:none;">
                        <img src="${thumb}" style="width:60px; height:60px; object-fit:cover; display:block;" />
                        <button type="button" class="button-link m4d-remove-image"
                            style="position:absolute; top:-8px; right:-8px; width:22px; height:22px; border-radius:999px; background:#fff; border:1px solid #ccc; line-height:20px; text-align:center; padding:0;"
                        >×</button>
                    </li>
                `);
            });

            syncInputsAndMarkDirty($ul);
        });

        frame.open();
    });

    // Remove image
    $(document).on('click', '.m4d-remove-image', function (e) {
        e.preventDefault();

        const $li = $(this).closest('li');
        const $ul = $li.closest('.m4d-variation-gallery');

        $li.remove();
        syncInputsAndMarkDirty($ul);
    });

});
