jQuery(function ($) {
    function openMediaFrame($wrapper, $input) {
        const frame = wp.media({
            title: 'Select Gallery Images',
            button: { text: 'Add Images' },
            multiple: true
        });

        frame.on('select', function () {
            const selection = frame.state().get('selection');
            let ids = $input.val() ? $input.val().split(',') : [];

            selection.each(function (attachment) {
                attachment = attachment.toJSON();
                if (!ids.includes(String(attachment.id))) {
                    ids.push(attachment.id);

                    $wrapper.append(`
                        <li data-attachment-id="${attachment.id}">
                            <img src="${attachment.sizes.thumbnail.url}" />
                            <button type="button" class="m4d-remove-image">×</button>
                        </li>
                    `);
                }
            });

            $input.val(ids.join(','));
        });

        frame.open();
    }

    $(document).on('click', '.m4d-add-variation-images', function () {
        const $parent = $(this).closest('.m4d-variation-gallery-wrapper');
        openMediaFrame(
            $parent.find('.m4d-variation-gallery'),
            $parent.find('.m4d-variation-gallery-input')
        );
    });

    $(document).on('click', '.m4d-remove-image', function () {
        const $li = $(this).closest('li');
        const id = $li.data('attachment-id');
        const $input = $li.closest('.m4d-variation-gallery-wrapper')
            .find('.m4d-variation-gallery-input');

        let ids = $input.val().split(',').filter(v => v !== String(id));
        $input.val(ids.join(','));
        $li.remove();
    });
});
