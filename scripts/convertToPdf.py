from google.cloud import storage
import os
from dotenv import load_dotenv
from fpdf import FPDF
from PIL import Image
from pathlib import Path

pdf = FPDF()
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)
# Set up Google Cloud Storage
project_id = os.getenv('GCLOUD_PROJECT_ID')
bucket_name = os.getenv('BUCKET_NAME')

key_path = os.path.join(os.path.dirname(__file__), '..', 'myKey.json')

storage_client = storage.Client.from_service_account_json(key_path, project=project_id)

bucket = storage_client.bucket(bucket_name)

# Get the filename from the command line arguments
import sys
input_file = sys.argv[1]

# Specify the output filename
output_file = os.path.join(os.path.dirname(__file__), './','tmp/') 
output_file=local_input_path=os.path.join(output_file,f'output_{input_file.replace(".jpg", ".pdf")}')

# Download the input file from Google Cloud Storage
blob = bucket.blob(input_file)
local_input_path =  os.path.join(os.path.dirname(__file__), './','tmp/') 
local_input_path=os.path.join(local_input_path,input_file)
blob.download_to_filename(local_input_path)
print(f'File {input_file} downloaded from Google Cloud Storage.')


im1 = Image.open(local_input_path)
# Get the width and height of that image.
width, height = im1.size
if width > height:
    # If width > height, rotate the image.
    im2 = im1.transpose(Image.ROTATE_270)
    # Delete the previous image.
    os.remove(local_input_path)
    # Save the rotated image.
    im2.save(local_input_path)
    # im.save
    print("\n. Converting to PDF....\n")


pdf.add_page()
# 210 and 297 are the dimensions of an A4 size sheet.
pdf.image(local_input_path, 0, 0, 210, 297)

pdf.output(output_file, "F")   

print("PDF generated successfully!")
# Save the output file to Google Cloud Storage
output_blob = bucket.blob(output_file)
output_blob.upload_from_filename(output_file)
# list all objects in the directory
blobs = bucket.list_blobs(prefix='/tmp/')
for blob in blobs:
    blob.delete()
print(f'File {output_file} uploaded to Google Cloud Storage.')

# Clean up local files
os.remove(local_input_path)
os.remove(output_file)
