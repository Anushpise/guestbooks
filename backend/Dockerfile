FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install C++ runtimes, OpenCV dependencies, Tesseract OCR (English & Hindi)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    tesseract-ocr \
    tesseract-ocr-hin \
    curl \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /app

# Create data directory for persistent SQLite DB and upload storage
RUN mkdir -p /app/data

# Pre-install CPU-only PyTorch to prevent massive 6-8GB CUDA GPU wheels from exhausting disk
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY app /app/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
