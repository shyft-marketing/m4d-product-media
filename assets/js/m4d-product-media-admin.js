jQuery(function ($) {

    function syncInput($wrapper) {
        const ids = [];

        $wrapper.find('li[data-attachment-id]').each(function () {
            ids.push($(this).data('attachment-id'));
        });

        $wrapper
            .closest('.m4d-variation-gallery-wrapper')
            .find('.m4d-variation-gallery-input')
            .val(ids.join(','));
    }

    // ADD images
    $(document).on('click', '.m4d-add-variation-images', function (e) {
        e.preventDefault();

        const $button = $(this);
        const $wrapper = $button
            .closest('.m4d-variation-gallery-wrapper')
            .find('.m4d-variation-gallery');

        const frame = wp.media({
            title: 'Select variation gallery images',
            button: { text: 'Add images' },
            multiple: true
        });

        frame.on('select', function () {
            const selection = frame.state().get('selection');

            selection.each(function (attachment) {
                attachment = attachment.toJSON();

                // Prevent duplicates
                if ($wrapper.find(`li[data-attachment-id="${attachment.id}"]`).length) {
                    return;
                }

                $wrapper.append(`
                    <li data-attachment-id="${attachment.id}">
                        <img src="${attachment.sizes.thumbnail.url}" />
                        <button type="button" class="m4d-remove-image">×</button>
                    </li>
                `);
            });

            syncInput($wrapper);
        });

        frame.open();
    });

    // REMOVE images
    $(document).on('click', '.m4d-remove-image', function () {
        const $li = $(this).closest('li');
        const $wrapper = $li.closest('.m4d-variation-gallery');

        $li.remove();
        syncInput($wrapper);
    });

});
