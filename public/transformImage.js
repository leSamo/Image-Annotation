(() => {
    /* RENDERER DEFINITION */
    const hasPositionChanged = ({ pos, prevPos }) => pos !== prevPos;

    const valueInRange = ({ minScale, maxScale, scale }) => scale <= maxScale && scale >= minScale;

    const getTranslate = ({ minScale, maxScale, scale }) => ({ pos, prevPos, translate }) =>
        valueInRange({ minScale, maxScale, scale }) && hasPositionChanged({ pos, prevPos }) ?
        translate + (pos - prevPos * scale) * (1 - 1 / scale) :
        translate;

    const getScale = ({ scale, minScale, maxScale, scaleSensitivity, deltaScale }) => {
        let newScale = scale + (deltaScale / (scaleSensitivity / scale));
        newScale = Math.max(minScale, Math.min(newScale, maxScale));
        return [scale, newScale];
    };

    const getMatrix = ({ scale, translateX, translateY }) => `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;

    const pan = ({ state, originX, originY }) => {
        state.transformation.translateX += originX;
        state.transformation.translateY += originY;
        state.element.style.transform =
            getMatrix({ scale: state.transformation.scale, translateX: state.transformation.translateX, translateY: state.transformation.translateY });
    };

    const canPan = (state) => ({
        panBy: ({ originX, originY }) => pan({ state, originX, originY }),
        panTo: ({ originX, originY, scale }) => {
            state.transformation.scale = scale;
            pan({ state, originX: originX - state.transformation.translateX, originY: originY - state.transformation.translateY });
        },
    });

    const canZoom = (state) => ({
        zoom: ({ x, y, deltaScale }) => {
            const { left, top } = state.element.getBoundingClientRect();
            const { minScale, maxScale, scaleSensitivity } = state;
            const [scale, newScale] = getScale({ scale: state.transformation.scale, deltaScale, minScale, maxScale, scaleSensitivity });
            const originX = x - left;
            const originY = y - top;
            const newOriginX = originX / scale;
            const newOriginY = originY / scale;
            const translate = getTranslate({ scale, minScale, maxScale });
            const translateX = translate({ pos: originX, prevPos: state.transformation.originX, translate: state.transformation.translateX });
            const translateY = translate({ pos: originY, prevPos: state.transformation.originY, translate: state.transformation.translateY });

            state.element.style.transformOrigin = `${newOriginX}px ${newOriginY}px`;
            state.element.style.transform = getMatrix({ scale: newScale, translateX, translateY });
            state.transformation = { originX: newOriginX, originY: newOriginY, translateX, translateY, scale: newScale };

            // adjust annotation thickness when zooming
            $(".rectangle").css("border-width", ANNOTATION_BORDER_WIDTH / newScale);
            $(".ellipse").css("border-width", ANNOTATION_BORDER_WIDTH / newScale);
            $(".point").css("border-width", ANNOTATION_BORDER_WIDTH / newScale);

            // adjust miniature size when zooming
            $(".miniature").css("width", 32 / newScale);
            $(".miniature").css("right", (-32 - ANNOTATION_BORDER_WIDTH) / newScale);
            $(".miniature-label").css("font-size", Math.min(1 / newScale, 3) + "rem");
            $(".miniature-label").css("top", -ANNOTATION_BORDER_WIDTH / newScale - parseInt($(".miniature-label").parent().not(".deleted").find(".miniature-label").css("height")));

            currentZoom = newScale;
        }
    });

    const renderer = ({ minScale, maxScale, element, scaleSensitivity }) => {
        const state = {
            element,
            minScale,
            maxScale,
            scaleSensitivity,
            transformation: {
                originX: 0,
                originY: 0,
                translateX: 0,
                translateY: 0,
                scale: 1
            },
        };
        return Object.assign({}, canZoom(state), canPan(state));
    };

    /* RENDERER IMPLEMENTATION */
    const container = document.getElementById("container");
    const instance = renderer({ minScale: ZOOM_MIN, maxScale: ZOOM_MAX, element: container.children[0], scaleSensitivity: 1.0 / ZOOM_SENSITIVITY });

    // center image on start
    instance.panBy({
        originX: 200,
        originY: 60
    });

    container.addEventListener("wheel", (event) => {
        event.preventDefault();
        instance.zoom({
            deltaScale: Math.sign(event.deltaY) > 0 ? -1 : 1,
            x: event.pageX,
            y: event.pageY
        });
    });
    container.addEventListener("dblclick", () => {
        instance.panTo({
            originX: 200,
            originY: 60,
            scale: 1,
        });
    });
    container.addEventListener("mousemove", (event) => {
        event.preventDefault();
        if (event.buttons !== PAN_MOUSE_BUTTON) {
            return;
        }

        document.body.style.cursor = "move";

        instance.panBy({
            originX: event.movementX,
            originY: event.movementY
        });
    });
    container.addEventListener("mouseup", (event) => {
        document.body.style.cursor = "default"
    });
})();