# Image Annotation
## App available online at https://evening-caverns-09995.herokuapp.com/.

![Annotating-GIF](https://s8.gifyu.com/images/ezgif-4-2084a73dd6ea.gif)

# Table of contents
1.	[Description](#Description)  
    a.	[Input image data setup](#Input-image-data-setup)  
    b.	[Annotation labels](#Annotation-labels)  
    c.	[Output data](#Output-data)  
    d.	[Browser compatibility](#Browser-compatibility)  
2.	[Local setup](#Local-setup)  
    a.	[First time setup](#First-time-setup)  
    b.	[Run server](#run-server)  
    c.	[Custom configuration](#custom-configuration)  
3.	[Program documentation](#Program-documentation)  
    a.	[Package dependencies](#Package-dependencies)  
    b.	[File structure](#File-structure)  
    c.	[Server architecture](#Server-architecture)  
    d.	[API endpoints](#API-endpoints)  
    e.	[Client architecture](#Client-architecture)  
    f.	[Client-server communication](#Client-server-communication)  
4.	[Used libraries](#Used-libraries)  

# Description
Image annotation tool for machine learning, capable of importing images and exporting JSON data with annotations to Google Drive. App is built in Node.js on Express framework. It uses Google API to communicate with Google Drive. App is available at https://evening-caverns-09995.herokuapp.com/. In case you want to setup the app locally, follow instructions in local setup chapter below.

## Input image data setup
- before using the app, you need to setup a Google Drive folder with the images to annotate
1. Create a new folder inside your [Google Drive](https://drive.google.com/)
2. Put all dataset images in the folder (supported image formats are `.jpg` and `.png`)
3. Share the folder with e-mail address of the account whose credentials the server is using (in case you haven’t setup the app locally, the e-mail is `annotation.tester@gmail.com`) and make sure you select Editor permissions (necessary for sending annotation JSON data back to that folder), in case you setup the app locally and you are using the same account for server API and client, skip this step

## Annotation labels
- before annotating you need to import JSON file with labels defined
- [example labels for annotating chess games](https://gist.github.com/leSamo/61cf20bddfdac5a31e296a5ea129434d)
- properties:
    - `name` - label set name
    - `description` - label set description
    - `items` - array of label objects
        - `name` - text name for a category
        - `id` - category id, which displays in annotation output JSON file
        - `shape` - shape of the annotation, currently supported are `rectangle` (drag a rectangle around object), `ellipse` (drag an ellipse around object), `polygon` (click to create vertices), `point` (click to create a point) and `line` (drag a line)
        - `img_src` - (optional) path to image to be used as icon

## Using the client
- After you open client page, input folder ID by clicking `New folder` button (when you are inside that folder on your drive it's the last part of the URL `drive.google.com/drive/u/0/folders/FOLDER_ID`)
- Import labels JSON file using `Import labels` button (see section below)
- Annotate your image (see section below)
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

## Output data
Clicking submit uploads all annotation data to the same Google Drive folder the images were downloaded from. They are in JSON format as an array of objects, each object representing one annotation, having attributes about their shape, label name, position and size. Example output file containing all 5 possible annotations shapes:
<details>
  <summary>See example</summary>
  
```
[
    {
        "shape": "rectangle",
        "label": "white_pawn",
        "offsetX": 360,
        "offsetY": 176,
        "sizeX": 102,
        "sizeY": 137
    },
    {
        "shape": "polygon",
        "label": "chess_board",
        "points": [
            {
                "x": 650,
                "y": 627
            },
            {
                "x": 942,
                "y": 616
            },
            {
                "x": 601,
                "y": 390
            }
        ]
    },
    {
        "shape": "line",
        "label": "someLine",
        "points": [
            {
                "x": 359,
                "y": 558
            },
            {
                "x": 459,
                "y": 744
            }
        ]
    },
    {
        "shape": "point",
        "label": "somePoint",
        "offsetX": 253,
        "offsetY": 684
    },
    {
        "shape": "ellipse",
        "label": "someEllipse",
        "offsetX": 875,
        "offsetY": 189,
        "sizeX": 186,
        "sizeY": 124
    }
]
```

</details>

## Browser compatibility
- Chrome (tested on version 87)
- Firefox (tested on version 83)
- Edge (tested on version 87)

# Local setup
## First time setup
1. Make sure you have [node.js](https://nodejs.org/) installed (verify installation by running `node -v`)
2. Run `npm install` in root directory
3. [Enable Google Drive API (only step 1)](https://developers.google.com/drive/api/v3/quickstart/nodejs#step_1_turn_on_the) When prompted select `Desktop app`, then click download client configuration. If you are going to use the server only yourself you can use your own Google account, otherwise I recommend creating a new Google account for this
4. Put `credentials.json` file from step 1 into `drive` folder, upon starting the server for the first time you will be prompted to authentificate in the terminal

## Run server
1. Run `npm start` in root directory
2. Client page will be accessible at `localhost:3000`
- to use the client page reffer to the chapter Description above
- some controls can be remapped/adjusted in `public/config.js` file

## Custom configuration
File `public/config.js` provides some options to alter behaviour of the client page, in particular:
- change image zoom sensitivity, max zoom and min zoom
- remap mouse button to different actions
- change thickness of annotations
- change size of point annotations
- set different annotation color

# Program documentation
## Package dependencies
- [Express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js
- [Body parser](http://expressjs.com/en/resources/middleware/body-parser.html) - Parse incoming request bodies in a middleware
- [Google APIs](https://www.npmjs.com/package/googleapis#google-apis) - Node.js client library for using Google APIs.
- [Nodemon](https://nodemon.io/) - Nodemon is a utility that will monitor for any changes in your source and automatically restart your server

## File structure
```
Image-annotation
│───app.js
│───example_chess_labels.json
│───package.json
│───package-lock.json   
│───README.md
│
└───public
│   │───img
│   │───tmp
│   │───API.js
│   │───config.js
│   │───drawAnnotations.js
│   │───index.css
│   │───index.html
│   │───index.js
│   │───labels.json
│   └───transformImage.js
│  
└───drive
    │───drive.js
    └───[this is where you want to place your credentials.json file]
```
## Server architecture 
Upon user entering folder ID, server is requested with providing image from Google Drive folder using /image endpoint, server retrieves list of all files inside the folder from Drive API, finds out which images have already been annotated (all annotated images have .json file with the same basename as them), downloads one of them and sends its filename to the client. Client requests image file from the /imageFile endpoint attaching folder id and image name to the request. Note that in the first request the file is not directly downloaded to the client but to the server, from which it is linked in the second request. Clicking submit button collects all annotation data and is sent to server which creates a new file with the same basename as the image with .json prefix to the same Google Drive folder.

## API Endpoints
| Path       | Method   | Description                                                        |
|------------|:--------:|--------------------------------------------------------------------|
|/           | GET  	| Request client page                                                |
|/image	     | POST  	| Send folder id, receive first unannotated image name               |
|/imageFile	 | GET  	| Send folder id and image name, receive image file                  |
|/submit     | POST  	| Send image name, folder id and JSON annotation data to be uploaded |

![Sequence diagram](https://i.imgur.com/ZcmQRWK.png)

 
## Client architecture
Client page consists of multiple panels and image area. When user imports label file, JSON is parser and for each label an item inside left panel is created. Items can be selected on click. Drawing a new annotation shape will use the label which is currently selected. Label also determines annotation shape.  

Available shapes are:  
- Rectangle – represented by html div element with border  
- Ellipse – represented by html div element with border and border-radius 50%  
- Point – represented by small html div element with border and border-radius 50%  
- Line – represented by rotated html div element with border and 0 height  
- Polygon – represented by multiple lines, line drawn first is orange to highlight orientation (for example determining one particular side of a chessboard)  

Drawing a shape registers a new element in `annotationArray` variable and creates a new item in right history panel. History panel reflects contents of `annotationArray`. Item can be clicked on, highlighting it. Pressing delete or backspace key will delete the selected annotation.  
Deleting an annotation will not delete corresponding HTML element, only hide it by setting its display to none. This allows the annotation to be reverted using undo action.
For the purpose or undo (CTRL+Z) and redo (CTRL+Y) actions there are two arrays undoBuffer and redoBuffer which keep track of these actions. Each item in the buffer has action type attached (add/remove), annotation metadata and html element bound to the annotation.  
Hiding all annotations sets display of html element of every annotation to none, showing annotations sets display back to block.  
Each annotation has either icon or text next to it to show its label. If the label has defined img_src property in imported JSON label file, it uses icon referred to in code as miniature. Otherwise small text with the name of the label is shown, referred to in code as miniature-label.  
Clicking submit button removes html elements bound to annotationArray and converts annotation data to JSON which is sent to server.  
Image container element contains event handlers to respond to mouse wheel scrolling by zooming the image and to respond to dragging with right mouse button to pan the image. Image is moved and zoomed by manipulating its CSS transform properties. HTML elements representing annotations are parented to the image so their position is anchored to the same location on image. Thickness of annotation is invariant to zoom, which means absolute border thickness has to be adjusted to counter relative size of whole shape changing while zooming. Everything connected to image position manipulation is done in the `transformImage.js` file.

![Client layout](https://i.imgur.com/f2wYghh.png)
 
## Client-server communication
Client downloads images and uploads JSON data to server using functions `downloadImage` and `uploadAnnotations` defined inside `API.js`. These can be simply altered to use your own image source or upload target. Available helper functions is showErrorMessage(msg). Make sure to call setImageName(filename, extension) to display the name in the header and store it in code. Modify main image element by changing the source attribute of img element with id #image.
# Used libraries
## Code for image zoom and pan
https://medium.com/better-programming/implementation-of-zoom-and-pan-in-69-lines-of-javascript-8b0cb5f221c1

## Rectangle drawing code
https://stackoverflow.com/questions/17408010/drawing-a-rectangle-using-click-mouse-move-and-click
http://jsfiddle.net/d9BPz/546/

## Drawing lines (for polygons)
https://stackoverflow.com/questions/4270485/drawing-lines-on-html-page

