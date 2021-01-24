// set border width in CSS to the same value user requested in config.js
document.documentElement.style.setProperty('--annotation-border-width', ANNOTATION_BORDER_WIDTH + "px");

const ALLOWED_SHAPES = ["rectangle", "ellipse", "polygon", "point", "line"];

// setup label .json file importing, to make file select dialog prettier
document.getElementById('upload-labels').addEventListener('click', promptUploadLabelFile);

function promptUploadLabelFile() {
    document.getElementById('fileid').click();
}

// prompt user for folder ID, then save it to a cookie and refresh page
const promptNewFolder = () => {
    folderId = prompt("Enter the folder ID");
    document.cookie = "folderId=" + folderId + ";max-age=31536000";
    if (folderId && folderId != "null") {
        location.reload();
    }
}

let imageName, selectedCategory, categories, hideAnnotations, currentZoom = 1,
    selectedHistory = null;

// if folder ID cookie is present use it, else prompt user for it
let folderId = getCookieValue("folderId");
let labels = getCookieValue("labels");

if (labels && labels !== "null") {
    setupLabels(labels);
}

if (!folderId || folderId === "null") {
    $("#error-msg").html("Invalid or no folder ID, please use 'New folder' button to enter a new ID.");
}

function getCookieValue(name) {
    var value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return value ? value.pop() : '';
}

function showErrorMessage(msg) {
    $("#error-msg").html(msg);
    $("#error-msg").css("display", "block");
}

function setImageName(name, extension) {
    imageName = name;
    $("#title-text").html(`${name}.${extension}`);
}

// API function to download and set image to annotate
downloadImage(folderId);

// create a button in toolbar for each category 
function setupLabels(json) {
    let data = JSON.parse(json);
    document.cookie = "labels=" + JSON.stringify(data) + ";max-age=31536000";

    $("#toolbar .toolbar-item").not("#toolbar-item-template").remove();

    $("#toolbar-placeholder").css("display", "none");

    data.items.forEach(item => {
        // check if annotation shape is legal
        if (!ALLOWED_SHAPES.includes(item.shape)) {
            alert(`Check labels.json, illegal annotation shape "${item.shape}" for label "${item.name}", must be one of "${ALLOWED_SHAPES.join(", ")}". Using "rectangle" shape as a fallback.`);
            item.shape = "rectangle";
        }

        let newItem = $("#toolbar-item-template").clone();

        newItem.css("display", "block");

        if (item.img_src === undefined) {
            item.img_src = `img/${item.shape}.png`;
            item.hasImage = false;
        } else {
            item.hasImage = true;
        }

        categories = data;

        newItem.find(".toolbar-img").attr("src", item.img_src);

        newItem.find(".toolbar-text").html(item.name);

        newItem.attr('title', `id: ${item.id},\nshape: ${item.shape}`);
        newItem.attr('id', item.id);
        newItem.on('click', () => selectCategory(item.id, item.name, item.shape, item.img_src, item.hasImage));

        $("#toolbar").append(newItem);
    });


    // select first category as default
    selectCategory(data.items[0].id, data.items[0].name, data.items[0].shape, data.items[0].img_src, data.items[0].hasImage);
};

function unselectAll() {
    if (selectedHistory) {
        if (selectedHistory.shape === "polygon") {
            $(selectedHistory.lines).not(".main-line").css("border-color", ANNOTATION_COLOR);
        } else {
            $(selectedHistory.element).css("border-color", ANNOTATION_COLOR);
        }

        selectedHistory = null;
    }
}

// when user clicks button select that category
function selectCategory(id, name, shape, img_src, hasImage) {
    unselectAll();

    selectedCategory = { id, name, shape, img_src, hasImage };

    // clear isSelected styling from all buttons
    $('.toolbar-item').css('background-color', 'whitesmoke');

    // apply isSelected styling to clicked button
    $(`.toolbar-item[id=${id}]`).css('background-color', 'skyblue');
}