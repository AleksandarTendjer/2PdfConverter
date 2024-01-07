const express = require('express');
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const { exec } = require('child_process');
const Multer= require('multer')
require('dotenv').config()
const app = express();
const port = 3000;

const multer= new Multer({
    storage: Multer.memoryStorage(),
    limits:{
        fileSize: 5 * 1024 * 1024
    }
})

// Set up Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: './myKey.json', // Replace with the path to your Google Cloud keyfile
});

const bucketName = process.env.BUCKET_NAME;
const bucket = storage.bucket(bucketName);

app.use(bodyParser.raw({ type: 'application/octet-stream' }));
app.get('/',(req,res)=>{
    res.sendFile(__dirname+"/index.html")
})
app.post('/upload',multer.single("imgfile") , async (req, res) => {
  try {

     // Upload the JPEG file to Google Cloud Storage
    const jpegFile = bucket.file(req.file.originalname);
    const jpegFileWriteStream = jpegFile.createWriteStream();
    jpegFileWriteStream.end(req.file.buffer);

    jpegFileWriteStream.on('finish', async () => {
    console.log('File uploaded to Google Cloud Storage:', req.file.originalname);
    const pythonScript = './scripts/convertToPdf.py';
    const command = `python ${pythonScript} ${req.file.originalname}`;

    exec(command, async(error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).send('Error running Python script');
        return;
      }
      console.log('Python script execution successful!');
    
        await jpegFile.delete();

        const pdfFile = bucket.file(pdfFileName);
        const pdfFileBuffer = await pdfFile.download();
        await pdfFile.delete();

        // Send the PDF file as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.status(200).send(pdfFileBuffer[0]);
    });
    })

   
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
