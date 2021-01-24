// array to hold all annotation DOM elements with additional data
// used for going back in history (undo with CTRL + Z) and for holding data sent to server on submit
const annotationArray = [];

const initDraw = canvas => {
    // calculate cursor position relative to top-left image corner with positive axes towards down resp. right direction and save it mouse variable
    const refreshMousePosition = e => {
        const ev = e || window.event; // Moz || IE
        const scale = document.getElementById('hook').getBoundingClientRect().width / document.getElementById('hook').offsetWidth;
        if (ev.pageX) { // Moz
            mouse.x = (ev.pageX - $('#hook').offset().left) / scale;
            mouse.y = (ev.pageY - $('#hook').offset().top) / scale;
        } else if (ev.clientX) { // IE
            mouse.x = (ev.clientX - $('#hook').offset().left) / scale;
            mouse.y = (ev.clientY - $('#hook').offset().top) / scale;
        }
    };

    // object to hold mouse data
    let mouse = {
        x: 0,
        y: 0,
        startX: 0,
        startY: 0
    };

    let element = null; // rectangle currently being drawn
    let points = []; // polygon currently being drawn
    let lines = []; // DOM elements of currently drawn polygon
    let polygonButton; // button to end current polygon

    // if mouse moves during drawing of an annotation - resize DOM element accordingly
    canvas.onmousemove = e => {
        if (!selectedCategory) {
            return;
        }

        if (selectedCategory.shape !== "rectangle" && selectedCategory.shape !== "ellipse" && selectedCategory.shape !== "line") {
            return;
        }

        refreshMousePosition(e);

        if (element !== null) {
            if (selectedCategory.shape === "line") {
                // redraw line from start pos to current mouse pos
                calculateLine(mouse.startX, mouse.startY, mouse.x, mouse.y, ANNOTATION_COLOR, undefined, element);
            } else {
                // redraw rectangle or ellipse with new size
                element.style.width = Math.abs(mouse.x - mouse.startX) + 'px';
                element.style.height = Math.abs(mouse.y - mouse.startY) + 'px';
                element.style.left = (mouse.x - mouse.startX < 0) ? mouse.x + 'px' : mouse.startX + 'px';
                element.style.top = (mouse.y - mouse.startY < 0) ? mouse.y + 'px' : mouse.startY + 'px';
            }
        }
    }

    // user clicked on an item from history panel
    const selectFromHistory = (data, element) => {
        // unhighlight other items and annotations and highlight selected item
        $("#history .toolbar-item").css("background-color", "");
        $(".rectangle, .ellipse, .line, .point").css("border-color", ANNOTATION_COLOR);
        element.css("background-color", "skyblue");

        // highlight selected annotation
        selectedHistory = annotationArray[element.index() - 1];
        if (selectedHistory.shape === "polygon") {
            $(selectedHistory.lines).not(".main-line").css("border-color", "skyblue");
        } else {
            $(selectedHistory.element).css("border-color", "skyblue");
        }
    }

    // user selected item from history panel and delteted it
    const deleteSelected = () => {
        if (selectedHistory) {
            // remove annotation
            if (selectedHistory.shape === "rectangle" || selectedHistory.shape === "ellipse" || selectedHistory.shape === "point" || selectedHistory.shape === "line") {
                $(selectedHistory.element).css("display", "none");
                $(selectedHistory.element).addClass("deleted");
            } else {
                selectedHistory.lines.forEach(line => {
                    $(line).css("display", "none");
                    $(line).addClass("deleted");
                });
            }

            // remove from annotation array
            const indexToDelete = annotationArray.findIndex(item => item.element === selectedHistory.element);
            annotationArray.splice(indexToDelete, 1);

            // remove history
            $("#history .toolbar-item").eq(indexToDelete + 1).remove();

            // add to undo buffer
            undoBuffer.push({ actionType: "add", annotation: selectedHistory });

            // reset color to default in case it is undo-ed
            if (selectedHistory.shape === "polygon") {
                $(selectedHistory.lines).not(".main-line").css("border-color", ANNOTATION_COLOR);
            } else {
                $(selectedHistory.element).css("border-color", ANNOTATION_COLOR);
            }

            selectedHistory = null;
        }
    }

    // user drew a new annotation
    const registerNewElement = (data) => {
        // setup new history panel item
        let newItem = $("#history-item-template").clone();

        newItem.css("display", "block");

        // set gray subtext
        if (data.shape === "rectangle" || data.shape === "ellipse" || data.shape === "point") {
            newItem.find(".toolbar-subtext").html(`${data.shape} at (${data.offsetX}, ${data.offsetY})`);
        } else if (data.shape === "polygon") {
            newItem.find(".toolbar-subtext").html(`${data.shape} with ${data.points.length} points`);
        } else {
            newItem.find(".toolbar-subtext").html(`${data.shape}`);
        }

        // set icon
        newItem.find(".toolbar-img").attr("src", categories.items.find(item => item.id === data.label).img_src);

        // set text
        newItem.find(".toolbar-text").html(categories.items.find(item => item.id === data.label).name);

        // setup on click handler
        newItem.click(() => selectFromHistory(data, newItem));

        $("#history").append(newItem);

        // track annotation object
        const newAnnotation = {...data };
        annotationArray.push(newAnnotation);
        undoBuffer.push({ actionType: "remove" });

        return newAnnotation;
    }

    // on DRAW_MOUSE_BUTTON press start drawing
    canvas.onmousedown = e => {
        e.preventDefault();

        if (e.button != DRAW_MOUSE_BUTTON) {
            return;
        }

        refreshMousePosition(e);

        if (selectedCategory.shape === "line") {
            element = calculateLine(mouse.x, mouse.y, mouse.x, mouse.y, ANNOTATION_COLOR);
            element.className = selectedCategory.shape;

            mouse.startX = mouse.x;
            mouse.startY = mouse.y;

            canvas.appendChild(element);

            document.body.style.cursor = "crosshair";
        } else if (selectedCategory.shape === "point") {
            element = document.createElement('div');
            element.className = selectedCategory.shape;
            element.style.width = ANNOTATION_POINT_SIZE + 'px';
            element.style.height = ANNOTATION_POINT_SIZE + 'px';

            const borderWidth = ANNOTATION_BORDER_WIDTH / currentZoom;

            element.style.left = mouse.x - ANNOTATION_POINT_SIZE / 2 - borderWidth + 'px';
            element.style.top = mouse.y - ANNOTATION_POINT_SIZE / 2 - borderWidth + 'px';

            $(element).css("border", `${borderWidth}px solid ${ANNOTATION_COLOR}`);

            canvas.appendChild(element);
        } else if (selectedCategory.shape === "rectangle" || selectedCategory.shape === "ellipse") {
            // save starting point coords, init rectangle DOM element, change cursor to crosshair
            mouse.startX = mouse.x;
            mouse.startY = mouse.y;

            element = document.createElement('div');
            element.className = selectedCategory.shape;
            element.style.left = mouse.x + 'px';
            element.style.top = mouse.y + 'px';
            $(element).css("border", `${ANNOTATION_BORDER_WIDTH / currentZoom}px solid ${ANNOTATION_COLOR}`);

            canvas.appendChild(element);

            document.body.style.cursor = "crosshair";
        } else if (selectedCategory.shape === "polygon") {
            // save current mouse position position to point array and draw line connecting this point with previous

            // ignore if clicking ending button
            if (e.target.tagName === "BUTTON") {
                return;
            }

            if (points.length === 0) {
                // first vertex of polygon

                // create button on starting point for polygon completion
                polygonButton = document.createElement("button");

                $(polygonButton).attr("id", "polygon-button")
                $(polygonButton).css("left", mouse.x);
                $(polygonButton).css("top", mouse.y);
                $(polygonButton).click(() => endPolygon());

                canvas.appendChild(polygonButton);
            } else {
                // draw a line between this vertex and previous
                const line = calculateLine(points[points.length - 1].x, points[points.length - 1].y, mouse.x, mouse.y, points.length === 1 ? "orange" : ANNOTATION_COLOR, points.length === 1 ? "main-line" : undefined);
                canvas.appendChild(line);
                lines.push(line);
            }

            // add current point to points array
            points.push({ x: Math.round(mouse.x), y: Math.round(mouse.y) });
        }
    }

    // on DRAW_MOUSE_BUTTON release finish drawing rectangle - push rectangle coords into array of all annotations and revert cursor to default
    canvas.onmouseup = e => {
        refreshMousePosition(e);

        // polygon has its own finish-up function
        if (selectedCategory.shape === "polygon") {
            return;
        }

        if (e.button !== DRAW_MOUSE_BUTTON) {
            return;
        }

        if (element !== null) {
            // info about position which will be passed to output JSON file
            let posInfo;

            if (selectedCategory.shape === "point") {
                posInfo = {
                    offsetX: parseInt(element.style.left, 10) + parseInt(element.style.width, 10),
                    offsetY: parseInt(element.style.top, 10) + parseInt(element.style.height, 10)
                }
            } else if (selectedCategory.shape === "line") {
                posInfo = {
                    points: [{
                            x: parseInt(mouse.startX, 10),
                            y: parseInt(mouse.startY, 10)
                        },
                        {
                            x: parseInt(mouse.x, 10),
                            y: parseInt(mouse.y, 10)
                        }
                    ]
                }
            } else {
                posInfo = {
                    offsetX: parseInt(element.style.left, 10),
                    offsetY: parseInt(element.style.top, 10),
                    sizeX: parseInt(element.style.width, 10),
                    sizeY: parseInt(element.style.height, 10)
                }
            }

            // add new item to history and keep track of it
            registerNewElement({
                shape: selectedCategory.shape,
                element,
                label: selectedCategory.id,
                ...posInfo
            });

            addMiniature(element, selectedCategory.shape === "line");

            element = null;
            document.body.style.cursor = "default";
        }
    }

    // on cursor leaving the canvas cancel drawing and destroy drawn DOM element
    canvas.onmouseleave = e => {
        // only cancel shapes which are drawn by dragging
        if (selectedCategory.shape !== "rectangle" && selectedCategory.shape !== "ellipse" && selectedCategory.shape !== "line") {
            return;
        }

        if (element !== null) {
            element.remove();
            element = null;
        }
    }

    // handle actions from keyboard
    document.onkeydown = e => {
        var evtobj = window.event ? event : e

        // undo last drawn element on CTRL + Z
        if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
            undo();
        }

        // redo last drawn element on CTRL + Y
        if (evtobj.keyCode == 89 && evtobj.ctrlKey) {
            redo();
        }

        // submit image with annotations on ENTER press
        if (evtobj.keyCode == 13) {
            uploadAnnotations(annotationArray, folderId, imageName);
        }

        // toggle hide/show all miniatures on left ALT
        if (evtobj.key === "Alt") {
            evtobj.preventDefault();

            toggleMiniatures();
        }

        // toggle hide/show previous annotations on SPACE
        if (evtobj.keyCode === 32) {
            evtobj.preventDefault();

            toggleAnnotations();
        }

        // delete currently selected element from history panel on DEL or BACKSPACE
        if (evtobj.keyCode === 46 || evtobj.keyCode === 8) {
            evtobj.preventDefault();

            deleteSelected();
        }
    }

    // draw line between last and first polygon point, remove button, clear points array and add miniature
    function endPolygon() {
        const line = calculateLine(points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y);
        lines.push(line);
        canvas.appendChild(line);

        registerNewElement({
            shape: "polygon",
            label: selectedCategory.id,
            lines,
            points
        });

        points = [];
        lines = [];

        $(polygonButton).remove();

        addMiniature(line, true);
    }

    // create DOM div element to represent line
    function createLineElement(offsetX, offsetY, length, angle, color = ANNOTATION_COLOR, className = "line") {
        let lineElement = document.createElement("div");

        let style =
            `position: absolute;
                 transform: rotate(${angle}rad);
                 width: ${length}px;
                 height: 0px;
                 top: ${offsetY}px;
                 left: ${offsetX}px;
                 border: 5px solid ${color};`

        lineElement.style = style;
        $(lineElement).addClass(className);

        return lineElement;
    }

    // if user is dragging a new line refresh its position on every move
    function moveLineElement(element, offsetX, offsetY, length, angle, color) {
        element.style =
            `position: absolute;
             transform: rotate(${angle}rad);
             width: ${length}px;
             height: 0px;
             top: ${offsetY}px;
             left: ${offsetX}px;
             border: 5px solid ${color};`
    }

    // calculate line between points [x1, y1] and [x2, y2]
    // if element is supplied move it, otherwise create it
    function calculateLine(x1, y1, x2, y2, color, className, element) {
        const deltaX = x1 - x2;
        const deltaY = y1 - y2;

        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;

        const offsetX = centerX - length / 2;
        const offsetY = centerY;

        const angle = Math.PI - Math.atan2(-deltaY, deltaX);

        return element ? moveLineElement(element, offsetX, offsetY, length, angle, color) : createLineElement(offsetX, offsetY, length, angle, color, className);
    }

    // create miniature and adjust its size to current zoom
    function addMiniature(parentElement, inverseParentRotation) {
        if (selectedCategory.hasImage) {
            const img = document.createElement("img");
            const imgSrc = categories.items.find(item => item.id === selectedCategory.id).img_src;

            $(img).addClass("miniature");
            $(img).attr("src", imgSrc);
            $(img).css("width", 32 / currentZoom);
            $(img).css("right", -(32 + ANNOTATION_BORDER_WIDTH) / currentZoom);
            hideMiniatures && $(img).css("display", "none");

            // counter parent element rotation, so the miniature isn't rotated at all
            if (inverseParentRotation) {
                let parentRotationMatrix = $(parentElement).css("transform").split(/[\(),]+/).splice(1, 6).map(item => parseFloat(item));
                let parentRotationAngle = Math.atan2(parentRotationMatrix[1], parentRotationMatrix[0]);

                $(img).css("transform", `rotate(${-parentRotationAngle}rad)`);
            }

            parentElement.appendChild(img);
        } else {
            const label = document.createElement("span");
            $(label).html(selectedCategory.name);
            $(label).addClass("miniature-label");
            $(label).css("font-size", Math.min(1 / currentZoom, 3) + "rem");
            parentElement.appendChild(label);
            $(label).css("top", -ANNOTATION_BORDER_WIDTH / currentZoom - parseInt($(label).css("height")));

            // counter parent element rotation, so the miniature isn't rotated at all
            if (inverseParentRotation) {
                let parentRotationMatrix = $(parentElement).css("transform").split(/[\(),]+/).splice(1, 6).map(item => parseFloat(item));
                let parentRotationAngle = Math.atan2(parentRotationMatrix[1], parentRotationMatrix[0]);

                $(label).css("transform", `rotate(${-parentRotationAngle}rad)`);
            }
        }
    }

    let undoBuffer = []; // remember which annotations were added/removed to able to undo
    let redoBuffer = []; // remember which annotations were undo-ed to able to redo

    // undo last drawn annotation upon pressing CTRL + Z or clicking undo button
    function undo() {
        const undoAction = undoBuffer.pop();

        if (undoAction === undefined) {
            return;
        }

        // last undo-ed action was adding an element, remove it
        if (undoAction.actionType === "remove") {
            const elementToRemove = annotationArray.pop();

            if (elementToRemove) {
                redoBuffer.push(elementToRemove);

                if (elementToRemove.shape !== "polygon") {
                    $(elementToRemove.element).css("display", "none");
                    $(elementToRemove.element).addClass("deleted");
                } else {
                    elementToRemove.lines.forEach(line => {
                        $(line).css("display", "none");
                        $(line).addClass("deleted");
                    });
                }

                // remove last item from history
                $('#history .toolbar-item').last().remove();
            }

            // last undo-ed action was removing an element, add it back 
        } else if (undoAction.actionType === "add") {
            if (undoAction.annotation.shape !== "polygon") {
                $(undoAction.annotation.element).css("display", "block");
                $(undoAction.annotation.element).removeClass("deleted");
            } else {
                undoAction.annotation.lines.forEach(line => {
                    $(line).css("display", "block");
                    $(line).removeClass("deleted");
                });
            }

            registerNewElement({...undoAction.annotation });
        }
    }

    // redo last undo-ed annotation upon pressing CTRL + Y or clicking redo button
    function redo() {
        const elementToAdd = redoBuffer.pop();
        if (elementToAdd) {
            registerNewElement(elementToAdd);
            if (elementToAdd.shape !== "polygon") {
                $(elementToAdd.element).css("display", "block");
                $(elementToAdd.element).removeClass("deleted");
            } else {
                elementToAdd.lines.forEach(line => {
                    $(line).css("display", "block");
                    $(line).removeClass("deleted");
                });
            }
        }
    }

    // user clicked on toggle annotation visibility button or pressed SPACE
    function toggleAnnotations() {
        if (annotationArray.length === 0) {
            return;
        }

        hideAnnotations = !hideAnnotations;

        if (hideAnnotations) {
            // hide all annotation elements
            $(".rectangle").css("display", "none");
            $(".ellipse").css("display", "none");
            $(".line").css("display", "none");
            $(".main-line").css("display", "none");
            $(".point").css("display", "none");
            $("#status").html("Previous annotations are hidden, press SPACE to show them.");
            $('#toggle-annotations-button > img').css("background-color", "skyblue");
        } else {
            // show all annotation elements
            $(".rectangle").not(".deleted").css("display", "block");
            $(".ellipse").not(".deleted").css("display", "block");
            $(".line").not(".deleted").css("display", "block");
            $(".main-line").not(".deleted").css("display", "block");
            $(".point").css("display", "block");
            $("#status").html("");
            $('#toggle-annotations-button > img').css("background-color", "");
        }
    }

    let hideMiniatures = false;

    // user clicked on toggle miniature visibility button or pressed left ALT
    function toggleMiniatures() {
        if (annotationArray.length === 0) {
            return;
        }

        hideMiniatures = !hideMiniatures;

        if (hideMiniatures) {
            // hide all miniatures
            $(".miniature").css("display", "none");
            $(".miniature-label").css("display", "none");
            $("#status").html("Annotation miniatures are hidden, press left ALT to show them.");
            $('#toggle-miniatures-button > img').css("background-color", "skyblue");
        } else {
            // show all miniatures
            $(".miniature").css("display", "block");
            $(".miniature-label").css("display", "block");
            $("#status").html("");
            $('#toggle-miniatures-button > img').css("background-color", "");
        }
    }

    // bind undo and redo function to their corresponding button in toolbar
    $("#undo-button").click(() => undo());
    $("#redo-button").click(() => redo());
    $("#toggle-annotations-button").click(() => toggleAnnotations());
    $("#toggle-miniatures-button").click(() => toggleMiniatures());
}

initDraw(document.getElementById('hook'));