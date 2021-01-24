// request image name, attach folder ID to the request
function downloadImage(folderId) {
    $.post("/image", { folderId },
        data => {
            if (data.error) {
                showErrorMessage(data.errorMsg);
            } else {
                setImageName(data.name, data.extension)
                $('#image').attr('src', `/imageFile?ext=${data.extension}&folderId=${folderId}`);
            }
        });
}

// when user clicked Submit button send annotation data in JSON format to be uploaded to Google Drive
function uploadAnnotations(annotationArray, folderId, imageName) {
    let isConfirmed = true;

    if (annotationArray.length === 0) {
        isConfirmed = window.confirm("Are you sure you want to submit this image without annotations?");
    }

    if (isConfirmed) {
        // select which fields to include in the JSON file
        const annotations = JSON.stringify(annotationArray.map(item => ({
            ...item,
            element: undefined,
            lines: undefined
        })))
        $.post({
            url: '/submit',
            data: {
                name: imageName,
                folderId,
                annotations
            },
            success: () => {
                location.reload();
            }
        });
    }
}