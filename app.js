const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// functions to communicate with drive.js file which communicates with Google Drive API
const drive = require('./drive/drive');

const app = express();

// parse request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// expose /public folder
app.use(express.static(path.join(__dirname, 'public')));

// serve index.html for the user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// user entered folder ID and requested image
// if folder ID is valid send image name, else send error
app.post('/image', (req, res) => {
    const folderId = req.body.folderId;

    const onDownloadFinished = (name, extension, error = false, errorMsg) => {
        if (error) {
            res.json({
                error: true,
                errorMsg: errorMsg
            });
        } else { // success
            res.json({
                error: false,
                name: name,
                extension: extension
            });
        }
    }

    drive.download(onDownloadFinished, folderId);
});

// user received image name and is now requesting image file
app.get('/imageFile', (req, res) => {
    res.sendFile(path.join(__dirname + `/public/tmp/${req.query.folderId}.${req.query.ext}`));
});

// user clicked on submit button, upload JSON file to Google Drive folder
app.post('/submit', (req, res) => {
    const annotationData = JSON.parse(req.body.annotations);
    const onSuccess = () => res.sendStatus(200);

    drive.upload(onSuccess, req.body.name, annotationData, req.body.folderId);
});

app.listen(process.env.PORT || 3000, () =>
    console.log(`Server listening on port ${process.env.PORT || 3000}!`)
);