from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import subprocess
import uuid
from werkzeug.utils import secure_filename
import tempfile

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        input_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.{file_extension}")
        output_path = os.path.join(OUTPUT_FOLDER, f"{file_id}_bw.{file_extension}")
        
        # Save uploaded file
        file.save(input_path)
        
        # Get trim parameters
        start_time = request.form.get('startTime')
        end_time = request.form.get('endTime')
        
        try:
            # Build FFmpeg command
            cmd = ['ffmpeg', '-i', input_path]
            
            # Add trim parameters if provided
            if start_time and end_time:
                start_time = float(start_time)
                end_time = float(end_time)
                duration = end_time - start_time
                
                cmd.extend(['-ss', str(start_time), '-t', str(duration)])
            
            # Add filters and output
            cmd.extend([
                '-vf', 'hue=s=0',  # Remove saturation (grayscale)
                '-c:a', 'copy',    # Copy audio without re-encoding
                output_path
            ])
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return jsonify({'error': f'FFmpeg error: {result.stderr}'}), 500
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'message': 'Video converted successfully'
            })
            
        except Exception as e:
            return jsonify({'error': f'Conversion failed: {str(e)}'}), 500
        
        finally:
            # Clean up input file
            if os.path.exists(input_path):
                os.remove(input_path)
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/trim', methods=['POST'])
def trim_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    file = request.files['video']
    start_time = request.form.get('startTime')
    end_time = request.form.get('endTime')
    
    if not start_time or not end_time:
        return jsonify({'error': 'Start time and end time are required'}), 400
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        input_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.{file_extension}")
        output_path = os.path.join(OUTPUT_FOLDER, f"{file_id}_trimmed.{file_extension}")
        
        # Save uploaded file
        file.save(input_path)
        
        try:
            start_time = float(start_time)
            end_time = float(end_time)
            duration = end_time - start_time
            
            # Trim video using FFmpeg
            cmd = [
                'ffmpeg', '-i', input_path,
                '-ss', str(start_time),
                '-t', str(duration),
                '-c', 'copy',  # Copy without re-encoding for speed
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return jsonify({'error': f'FFmpeg error: {result.stderr}'}), 500
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'message': 'Video trimmed successfully',
                'type': 'trimmed'
            })
            
        except Exception as e:
            return jsonify({'error': f'Trimming failed: {str(e)}'}), 500
        
        finally:
            # Clean up input file
            if os.path.exists(input_path):
                os.remove(input_path)
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/merge', methods=['POST'])
def merge_videos():
    video_count = request.form.get('videoCount')
    if not video_count:
        return jsonify({'error': 'Video count not provided'}), 400
    
    try:
        video_count = int(video_count)
        if video_count < 2:
            return jsonify({'error': 'At least 2 videos are required for merging'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid video count'}), 400
    
    # Check if all video files are present
    video_files = []
    for i in range(video_count):
        video_key = f'video{i}'
        if video_key not in request.files:
            return jsonify({'error': f'Video {i+1} not provided'}), 400
        
        file = request.files[video_key]
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': f'Invalid video file {i+1}'}), 400
        
        video_files.append(file)
    
    # Generate unique file ID for the merged video
    file_id = str(uuid.uuid4())
    input_paths = []
    
    try:
        # Save all uploaded videos
        for i, file in enumerate(video_files):
            filename = secure_filename(file.filename)
            file_extension = filename.rsplit('.', 1)[1].lower()
            input_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_input_{i}.{file_extension}")
            file.save(input_path)
            input_paths.append(input_path)
        
        # Create output path
        output_path = os.path.join(OUTPUT_FOLDER, f"{file_id}_merged.mp4")
        
        # Create a temporary file list for FFmpeg concat
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            concat_file = f.name
            for input_path in input_paths:
                # Convert to absolute path and escape for FFmpeg
                abs_path = os.path.abspath(input_path).replace('\\', '/')
                f.write(f"file '{abs_path}'\n")
        
        try:
            # Use FFmpeg concat demuxer to merge videos
            cmd = [
                'ffmpeg',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-c', 'copy',  # Copy streams without re-encoding for speed
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                # If concat fails, try with re-encoding
                cmd = [
                    'ffmpeg',
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', concat_file,
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    output_path
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    return jsonify({'error': f'FFmpeg merge error: {result.stderr}'}), 500
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'message': f'Successfully merged {video_count} videos',
                'type': 'merged'
            })
            
        finally:
            # Clean up concat file
            if os.path.exists(concat_file):
                os.remove(concat_file)
            
    except Exception as e:
        return jsonify({'error': f'Merge failed: {str(e)}'}), 500
    
    finally:
        # Clean up input files
        for input_path in input_paths:
            if os.path.exists(input_path):
                os.remove(input_path)

@app.route('/download/<file_id>')
def download_video(file_id):
    # Find the output file (try all possible versions)
    for ext in ALLOWED_EXTENSIONS:
        # Try merged version first
        output_path = os.path.join(OUTPUT_FOLDER, f"{file_id}_merged.mp4")
        if os.path.exists(output_path):
            return send_file(output_path, as_attachment=True)
        
        # Try black & white version
        output_path = os.path.join(OUTPUT_FOLDER, f"{file_id}_bw.{ext}")
        if os.path.exists(output_path):
            return send_file(output_path, as_attachment=True)
        
        # Try trimmed version
        output_path = os.path.join(OUTPUT_FOLDER, f"{file_id}_trimmed.{ext}")
        if os.path.exists(output_path):
            return send_file(output_path, as_attachment=True)
    
    return jsonify({'error': 'File not found'}), 404

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)