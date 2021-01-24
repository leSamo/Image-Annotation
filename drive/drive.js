// For setting up token follow Google Drive API documentation: https://developers.google.com/drive/api/v3/quickstart/nodejs

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// if modifying these scopes, delete token.json, new one will be created upon running npm start and authentificating
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// path to file with Google API auth token
const TOKEN_PATH = 'drive/token.json';

function authAndDownload(actionCallback, folderId) {
    fs.readFile('drive/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        authorize(JSON.parse(content), sharedFolderListFiles, actionCallback, { folderId });
    });
}

function authAndUpload(actionCallback, filename, uploadData, folderId) {
    fs.readFile('drive/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        authorize(JSON.parse(content), upload, actionCallback, { folderId, filename, uploadData });
    });
}

function authorize(credentials, authCallback, actionCallback, actionParams) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, authCallback);
        oAuth2Client.setCredentials(JSON.parse(token));
        authCallback(oAuth2Client, actionCallback, actionParams);
    });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // store the token on disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function sharedFolderListFiles(auth, downloadCallback, { folderId }) {
    const drive = google.drive({ version: 'v3', auth });

    drive.files.list({
        pageSize: 50,
        fields: 'nextPageToken, files(id, name)',
        q: `'${folderId}' in parents and trashed = false` /* and fullText contains '.png' or '.jpg' */
    }, (err, res) => {
        if (err) console.log("err:", err);
        if (res === undefined) {
            downloadCallback(null, null, true, "Invalid or no folder ID, please use 'New folder' button to enter a new ID.");
            return;
        }

        // find only images which have not already been annotated (don't have .json file with same basename)
        const fileList = res.data.files;
        const itemList = fileList.reduce((acc, item, index) => {
            const baseName = item.name.split('.')[0];
            const extension = item.name.split('.')[1];

            if (acc.some(item => item.baseName === baseName)) {
                let entry = acc.find(entryy => entryy.baseName === baseName);
                if (extension === "png" || extension === "jpg") {
                    entry.image = item.id;
                    entry.image_extension = extension;
                } else {
                    entry.json = item.id;
                }
            } else {
                let newEntry = { baseName };
                if (extension === "png" || extension === "jpg") {
                    newEntry.image = item.id;
                    newEntry.image_extension = extension;
                } else {
                    newEntry.json = item.id;
                }
                acc.push(newEntry);
            }
            return acc;
        }, []);

        const unannotatedImages = itemList.filter(item => item.json === undefined);

        if (unannotatedImages.length === 0) {
            console.log("All are annotated");
            downloadCallback(null, null, true, "All images from the dataset are already annotated");
            return;
        }

        const fileToDownload = unannotatedImages[0];

        download(auth, fileToDownload.image, folderId, fileToDownload.baseName, fileToDownload.image_extension, downloadCallback);
    });
}

function download(auth, fileId, folderId, filename, extension, downloadCallback) {
    const drive = google.drive({ version: 'v3', auth });

    const dest = fs.createWriteStream(`public/tmp/${folderId}.${extension}`);

    drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
        .then(res => {
            res.data
                .on('end', () => {
                    downloadCallback(filename, extension);
                })
                .on('error', err => {
                    console.error('Error downloading file.');
                })
                .pipe(dest);
        }, err => {
            console.error(err);
            downloadCallback(null, null, true, "Unknown download error");
        });
}

function upload(auth, uploadCallback, { folderId, filename, uploadData }) {
    const drive = google.drive({ version: 'v3', auth });

    drive.files.create({
        requestBody: {
            name: filename.split('.')[0] + ".json",
            parents: [folderId]
        },
        media: {
            body: JSON.stringify(uploadData, null, 4),
        }
    }).then(res => uploadCallback());
}

// Expose functions for app.js
exports.download = authAndDownload;
exports.upload = authAndUpload;