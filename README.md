# Image Annotation
FIT VUT IP1 project 2020/21

![Annotating-GIF](https://s8.gifyu.com/images/ezgif-4-2084a73dd6ea.gif)

# Server setup
## First time setup
1. Make sure you have [node.js](https://nodejs.org/) installed (verify installation by running `node -v`)
2. Run `npm install` in root directory
3. [Enable Google Drive API (only step 1)](https://developers.google.com/drive/api/v3/quickstart/nodejs#step_1_turn_on_the), if you are going to use the server only yourself you can use your own Google account, otherwise I recommend creating a new Google account for this
4. Put `credentials.json` file from step 1 into `drive` folder, upon starting the server for the first time you will be prompted to authentificate

## Run application server
1. Run `npm start` in root directory
2. Client page will be accessible at `localhost:3000`
- some controls can be remapped/adjusted in `public/config.js` file


# Client setup
## Google Drive folder setup
- you can use this example folder ID for testing: `1VB40I0EfnOiiU4e-krtWt9-pV4bNoBLv`
- before using the app you need to setup a new Google Drive folder with the images to annotate
1. Create a new folder inside your [Google Drive](https://drive.google.com/), it doesn't have to be the same account as server
2. Put all dataset images in that folder (supported image formats are `.jpg` and `.png`)
3. Share that folder with e-mail address of the account whose credentails the server is using and make sure you select Editor permissions (necessary for sending annotation JSON data back to that folder), if you are using the same account for server API and client, skip this step

## Using the client
- After you open client page, input folder ID by clicking `New folder` button (when you are inside that folder on your drive it's the last part of the URL `drive.google.com/drive/u/0/folders/FOLDER_ID`)
- Import labels JSON file using `Import labels` button (see section below)
- Annotate you image (see section below)
- When finished with the image, click `Submit` button, the annotation data will be converted to JSON format and uploaded to the same Google Drive folder the images are downloaded from with the same basename as the image (`image_name.jpg` -> `image_name.json`)
- If you later want to change the source folder ID, you can do so by clicking `New folder` button

## Image annotation
- pan image by holding right click
- zoom image in and out with scroll wheel
- depending on currently selected label shape you either draw by left clicking or left clicking and dragging cursor
- complete polygon annotation by clicking orange button placed on the first vertex
- line between first two polygon vertices is orange, this can be used to annotate polygon orientation
- undo last drawn annotation using `CTRL + Z`
- redo undo-ed annotation using `CTRL + Y`
- toggle hide and show all current annotations with `SPACE`
- toggle hide and show all annotation miniatures with `left ALT`
- delete any previous annotation by selecting it in the right history panel and pressing `DEL` or `BACKSPACE`

## Importing labels
- before annotating you need to import JSON file with labels defined
- [example labels for annotating chess games](https://gist.github.com/leSamo/61cf20bddfdac5a31e296a5ea129434d)
- properties:
    - `name` - label set name
    - `description` - label set description
    - `items` - array of label objects
        - `name` - text name for a category
        - `id` - category id, which displays in annotation output JSON file
        - `shape` - shape of bounding box, currently supported are `rectangle` (drag a rectangle around object), `ellipse` (drag an ellipse around object), `polygon` (click to create vertices), `point` (click to create a point) and `line` (drag a line)
        - `img_src` - (optional) path to image to be used as icon


## Compatible browsers
- Chrome 
- Firefox
- Edge


## Used libraries
### Code for image zoom and pan (under MIT licence)
https://medium.com/better-programming/implementation-of-zoom-and-pan-in-69-lines-of-javascript-8b0cb5f221c1

### Rectangle drawing code
https://stackoverflow.com/questions/17408010/drawing-a-rectangle-using-click-mouse-move-and-click
http://jsfiddle.net/d9BPz/546/

### Drawing lines (for polygons)
https://stackoverflow.com/questions/4270485/drawing-lines-on-html-page