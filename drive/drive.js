const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json, new one will be created upon running npm start and authentificating.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const TOKEN_PATH = 'drive/token.json';

function authAndDownload(whenDone, folderId) {
    fs.readFile('drive/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        authorize(JSON.parse(content), sharedFolderListFiles, whenDone, folderId);
    });
}

function authAndUpload(whenDone, name, data, folderId) {
    fs.readFile('drive/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        authorize(JSON.parse(content), upload, whenDone, folderId, name, data);
    });
}

function authorize(credentials, callback, whenDone, folderId, name, content) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, whenDone, folderId, name, content);
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
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function sharedFolderListFiles(auth, whenDone, folderId) {
    const drive = google.drive({ version: 'v3', auth });

    drive.files.list({
        pageSize: 50,
        fields: 'nextPageToken, files(id, name)',
        q: `'${folderId}' in parents and trashed = false` /* and fullText contains '.png' or '.jpg' */
    }, (err, res) => {
        if (err) console.log("err:", err);
        if (res === undefined) {
            whenDone(null, null, true, "Invalid or no folder ID, please use 'New folder' button to enter a new ID.");
            return;
        }

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
            whenDone(null, null, true, "All images from the dataset are already annotated");
            return;
        }

        const fileToDownload = unannotatedImages[0];

        download(auth, fileToDownload.image, folderId, fileToDownload.baseName, fileToDownload.image_extension, whenDone);
    });
}

function download(auth, fileId, folderId, filename, extension, whenDone) {
    const drive = google.drive({ version: 'v3', auth });

    const dest = fs.createWriteStream(`public/tmp/${folderId}.${extension}`);

    drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
        .then(res => {
            res.data
                .on('end', () => {
                    whenDone(filename, extension);
                })
                .on('error', err => {
                    console.error('Error downloading file.');
                })
                .pipe(dest);
        }, err => {
            console.error(err);
            whenDone(null, null, true, "Unknown download error");
        });
}

function upload(auth, whenDone, folderId, name, content) {
    const drive = google.drive({ version: 'v3', auth });
    drive.files.create({
        requestBody: {
            name: name.split('.')[0] + ".json",
            parents: [folderId]
        },
        media: {
            body: JSON.stringify(content, null, 4),
        }
    }).then(res => whenDone());
}

// Expose functions for app.js
exports.download = authAndDownload;
exports.upload = authAndUpload;