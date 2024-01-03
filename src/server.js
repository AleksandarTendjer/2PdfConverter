const express = require('express');
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const { exec } = require('child_process');
require('dotenv').config()
const app = express();
const port = 3000;

// Set up Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: 'path/to/keyfile.json', // Replace with the path to your Google Cloud keyfile
});

const bucketName = process.env.BUCKET_NAME;
const bucket = storage.bucket(bucketName);

app.use(bodyParser.raw({ type: 'application/octet-stream' }));

app.post('/upload', async (req, res) => {
  try {
    const uniqueFilename = `${Date.now()}_${Math.floor(Math.random() * 100000)}.jpg`;

    const file = bucket.file(uniqueFilename);
    await file.save(req.body, { contentType: 'image/jpeg' });

    console.log('File uploaded to Google Cloud Storage:', uniqueFilename);

    const pythonScript = './scripts/convertToPdf.py';
    const command = `python ${pythonScript} ${uniqueFilename}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).send('Error running Python script');
        return;
      }
      console.log('Python script execution successful!');
      res.status(200).send('File uploaded and processed successfully');
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
