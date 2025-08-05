from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from gridfs import GridFS
from bson import ObjectId
import io
import logging
import PyPDF2
from transformers import DistilBertTokenizer, DistilBertModel
import torch
import re

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

try:
    client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
    client.server_info()
    logger.info("Connected to MongoDB cv_database successfully")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise SystemExit(f"MongoDB connection failed: {str(e)}")

db = client['cv_database']
fs = GridFS(db)
cv_collection = db['cv']

# Load DistilBERT model and tokenizer
tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
model = DistilBertModel.from_pretrained('distilbert-base-uncased')

def extract_text_from_pdf(file_stream):
    try:
        reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return ""

def analyze_cv_text(cv_text):
    # Define common professional keywords
    keywords = [
        'experience', 'education', 'skills', 'project', 'achievement', 'certification',
        'python', 'java', 'javascript', 'management', 'leadership', 'communication',
        'teamwork', 'development', 'analysis', 'design', 'research', 'training'
    ]
    
    # Check for key sections
    sections = {
        'education': bool(re.search(r'\beducation\b|\bdegree\b|\buniversity\b|\bcollege\b', cv_text, re.IGNORECASE)),
        'experience': bool(re.search(r'\bexperience\b|\bwork\b|\bjob\b|\bemployment\b', cv_text, re.IGNORECASE)),
        'skills': bool(re.search(r'\bskills\b|\btechnical\b|\bproficiency\b', cv_text, re.IGNORECASE))
    }
    
    # Count keyword occurrences
    keyword_count = sum(cv_text.lower().count(keyword) for keyword in keywords)
    word_count = len(cv_text.split())
    keyword_density = (keyword_count / word_count) * 100 if word_count > 0 else 0
    
    # Calculate score based on completeness and keyword density
    section_score = sum(1 for present in sections.values() if present) * 20  # 60 points max for sections
    density_score = min(keyword_density * 2, 40)  # 40 points max for keywords
    total_score = round(section_score + density_score, 2)
    
    # Generate message and suggestions
    suggestions = []
    if not sections['education']:
        suggestions.append("Add an 'Education' section with your academic background.")
    if not sections['experience']:
        suggestions.append("Include a 'Work Experience' section detailing your professional history.")
    if not sections['skills']:
        suggestions.append("Add a 'Skills' section to highlight relevant technical and soft skills.")
    if keyword_density < 5:
        suggestions.append("Incorporate more industry-specific keywords (e.g., Python, leadership).")
    if word_count < 100:
        suggestions.append("Expand the CV content to provide more details about your qualifications.")
    
    if total_score >= 80:
        message = f"The CV is strong (Score: {total_score}%). Well-structured with relevant content."
    elif total_score >= 60:
        message = f"The CV is moderately strong (Score: {total_score}%). Some improvements needed."
    else:
        message = f"The CV needs significant improvement (Score: {total_score}%). Lacking key content."
    
    return {
        'message': message,
        'score': total_score,
        'suggestions': suggestions
    }

@app.route('/cv', methods=['GET'])
def get_all_cvs():
    try:
        cv_list = []
        for cv in cv_collection.find():
            file_id = cv.get('file_id')
            if not file_id:
                logger.warn(f"Missing file_id for CV: {cv.get('name', 'Unnamed CV')} (id: {str(cv.get('_id'))})")
            else:
                if not fs.exists(ObjectId(file_id)):
                    logger.warn(f"file_id {str(file_id)} not found in GridFS for CV: {cv.get('name', 'Unnamed CV')}")
            cv_list.append({
                'id': str(cv.get('_id')),
                'name': cv.get('name', 'Unnamed CV'),
                'notes': cv.get('notes', []),
                'file_id': str(file_id) if file_id else None
            })
        logger.info(f"Fetched {len(cv_list)} files from cv collection")
        return jsonify(cv_list), 200
    except Exception as e:
        logger.error(f"Error fetching files from cv collection: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            logger.error('No file provided in request')
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error('No file selected')
            return jsonify({'error': 'No file selected'}), 400

        file_content = file.read()
        if not file_content:
            logger.error('Empty file uploaded')
            return jsonify({'error': 'Empty file uploaded'}), 400
        
        file.seek(0)
        file_id = fs.put(file, filename=file.filename, content_type=file.content_type)
        if not file_id:
            logger.error('Failed to store file in GridFS')
            return jsonify({'error': 'Failed to store file in GridFS'}), 500
        
        if not fs.exists(file_id):
            logger.error(f"File not found in GridFS after upload, file_id: {str(file_id)}")
            return jsonify({'error': 'File storage verification failed'}), 500

        cv_data = {
            'name': file.filename.rsplit('.', 1)[0],
            'notes': [],
            'file_id': file_id
        }
        result = cv_collection.insert_one(cv_data)
        logger.info(f"Uploaded file: {file.filename}, id: {str(result.inserted_id)}, file_id: {str(file_id)}")
        return jsonify({
            'id': str(result.inserted_id),
            'name': cv_data['name'],
            'notes': cv_data['notes'],
            'file_id': str(file_id)
        }), 200
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/cv/<cv_id>', methods=['DELETE'])
def delete_cv(cv_id):
    try:
        if not ObjectId.is_valid(cv_id):
            logger.error(f"Invalid cv_id format: {cv_id}")
            return jsonify({'error': 'Invalid CV ID'}), 400
        
        cv = cv_collection.find_one({'_id': ObjectId(cv_id)})
        if not cv:
            logger.error(f"CV not found: {cv_id}")
            return jsonify({'error': 'CV not found'}), 404
        
        file_id = cv.get('file_id')
        if file_id:
            if fs.exists(ObjectId(file_id)):
                fs.delete(ObjectId(file_id))
                logger.info(f"Deleted GridFS file: {file_id}")
            else:
                logger.warn(f"file_id {file_id} not found in GridFS for CV: {cv_id}")
        
        result = cv_collection.delete_one({'_id': ObjectId(cv_id)})
        if result.deleted_count == 0:
            logger.error(f"Failed to delete CV: {cv_id}")
            return jsonify({'error': 'Failed to delete CV'}), 500
        
        logger.info(f"Deleted CV: {cv_id}")
        return jsonify({'message': 'CV deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/pdf/<file_id>', methods=['GET'])
def get_pdf(file_id):
    try:
        if not ObjectId.is_valid(file_id):
            logger.error(f"Invalid file_id format: {file_id}")
            return jsonify({'error': 'Invalid file ID'}), 400
        
        file = fs.get(ObjectId(file_id))
        logger.info(f"Serving PDF file: {file.filename}, file_id: {file_id}")
        return send_file(
            io.BytesIO(file.read()),
            mimetype=file.content_type,
            as_attachment=False,
            download_name=file.filename
        )
    except Exception as e:
        logger.error(f"Error serving file {file_id}: {str(e)}")
        return jsonify({'error': 'File not found or invalid'}), 404

@app.route('/analyze', methods=['POST'])
def analyze_cv():
    try:
        data = request.get_json()
        cv_id = data.get('cv_id')
        
        if not cv_id:
            logger.error('Missing cv_id')
            return jsonify({'error': 'Missing CV ID'}), 400
        
        if not ObjectId.is_valid(cv_id):
            logger.error(f"Invalid cv_id format: {cv_id}")
            return jsonify({'error': 'Invalid CV ID'}), 400
        
        cv = cv_collection.find_one({'_id': ObjectId(cv_id)})
        if not cv or not cv.get('file_id'):
            logger.error(f"CV or file_id not found: {cv_id}")
            return jsonify({'error': 'CV or file not found'}), 404
        
        file = fs.get(ObjectId(cv.get('file_id')))
        cv_text = extract_text_from_pdf(io.BytesIO(file.read()))
        if not cv_text:
            logger.error(f"No text extracted from CV: {cv_id}")
            return jsonify({'error': 'Unable to extract text from CV'}), 400

        analysis_result = analyze_cv_text(cv_text)
        logger.info(f"Analyzed CV {cv_id}: Score {analysis_result['score']}%, Message: {analysis_result['message']}")
        return jsonify(analysis_result), 200
    except Exception as e:
        logger.error(f"Error analyzing CV: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)