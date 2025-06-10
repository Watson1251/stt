echo "Running gunicorn"
gunicorn -b stt:8000 main:app --reload