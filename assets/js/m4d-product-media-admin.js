jQuery(function ($) {

    function getIds($ul) {
        return $ul.find('li[data-attachment_id]').map(function () {
            return $(this).data('attachment_id');
        }).get();
    }

    function buildGalleryItems(attachments) {
        return attachments.map(function (attachment) {
            const data = attachment.toJSON();
            const id = data.id;
            const thumb = data.sizes && data.sizes.thumbnail
                ? data.sizes.thumbnail.url
                : data.url;

            return `
                <li class="image" data-attachment_id="${id}">
                    <img src="${thumb}" />
                    <ul class="actions">
                        <li>
                            <a href="#" class="delete m4d-remove-image" title="Remove image">×</a>
                        </li>
                    </ul>
                </li>
            `;
        }).join('');
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

    function ensureSortable($ul) {
        if ($ul.data('m4dSortableInit')) return;

        $ul.data('m4dSortableInit', true);

        $ul.sortable({
            items: 'li.image',
            cursor: 'move',
            scrollSensitivity: 40,
            forcePlaceholderSize: true,
            forceHelperSize: false,
            helper: 'clone',
            opacity: 0.65,
            placeholder: 'wc-metabox-sortable-placeholder',
            start: function (event, ui) {
                ui.item.css('background-color', '#f6f6f6');
            },
            stop: function (event, ui) {
                ui.item.removeAttr('style');
                syncInputsAndMarkDirty($ul);
            }
        });
    }

    $(document).on('mouseenter', '.m4d-variation-gallery', function () {
        ensureSortable($(this));
    });

    // Add images
    $(document).on('click', '.m4d-add-variation-images', function (e) {
        e.preventDefault();

        const $btn = $(this);
        const $wrapper = $btn.closest('.m4d-variation-gallery-wrapper');
        const $ul = $wrapper.find('.m4d-variation-gallery');
        let frame = $wrapper.data('m4dGalleryFrame');

        if (!frame) {
            frame = wp.media({
                frame: 'post',
                state: 'gallery',
                title: 'Add images to variation gallery',
                button: { text: 'Add to gallery' },
                library: { type: 'image' },
                multiple: true
            });

            frame.on('update', function () {
                const selection = frame.state().get('selection');
                const html = buildGalleryItems(selection.models);

                $ul.empty().append(html);
                ensureSortable($ul);
                syncInputsAndMarkDirty($ul);
            });

            $wrapper.data('m4dGalleryFrame', frame);
        }

        frame.off('open').on('open', function () {
            const selection = frame.state().get('selection');
            selection.reset();

            getIds($ul).forEach(function (id) {
                const attachment = wp.media.attachment(id);
                attachment.fetch();
                selection.add(attachment);
            });
        });

        frame.open();
    });

    // Remove image
    $(document).on('click', '.m4d-variation-gallery-wrapper .m4d-remove-image', function (e) {
        e.preventDefault();

        const $li = $(this).closest('li');
        const $ul = $li.closest('.m4d-variation-gallery');

        $li.remove();
        syncInputsAndMarkDirty($ul);
    });

});
