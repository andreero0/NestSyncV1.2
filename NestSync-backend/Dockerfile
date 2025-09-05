# NestSync FastAPI Backend - Production Dockerfile
# Optimized for Railway deployment with Canadian compliance support

# =============================================================================
# Build Stage - Install dependencies and compile extensions
# =============================================================================
FROM python:3.11-slim as builder

# Set build arguments for optimization
ARG BUILD_ENV=production
ARG PYTHONDONTWRITEBYTECODE=1
ARG PYTHONUNBUFFERED=1

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    build-essential \
    gcc \
    g++ \
    # Database clients and development headers
    libpq-dev \
    postgresql-client \
    # Image processing libraries
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    # OCR and document processing
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    poppler-utils \
    # ML/AI dependencies
    libblas-dev \
    liblapack-dev \
    libatlas-base-dev \
    gfortran \
    # Security and encryption
    libssl-dev \
    libffi-dev \
    # Redis support
    redis-tools \
    # System utilities
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for dependencies
ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Upgrade pip and install wheel for faster builds
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements and install Python dependencies
WORKDIR /app
COPY requirements*.txt ./

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Pre-compile Python bytecode
RUN python -m compileall /opt/venv

# =============================================================================
# Production Stage - Minimal runtime environment
# =============================================================================
FROM python:3.11-slim as production

# Set production environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    VIRTUAL_ENV=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    # Canadian timezone for compliance
    TZ=America/Toronto \
    # Application settings
    APP_MODULE=main:app \
    HOST=0.0.0.0 \
    PORT=8000 \
    WORKERS=1 \
    WORKER_CLASS=uvicorn.workers.UvicornWorker

# Install minimal runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Database runtime libraries
    libpq5 \
    postgresql-client \
    # Image processing runtime libraries
    libjpeg62-turbo \
    libpng16-16 \
    libwebp6 \
    libfreetype6 \
    liblcms2-2 \
    libopenjp2-7 \
    libtiff5 \
    # OCR runtime
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    poppler-utils \
    # ML/AI runtime libraries
    libblas3 \
    liblapack3 \
    libatlas3-base \
    # Security libraries
    ca-certificates \
    # Redis client
    redis-tools \
    # System utilities for health checks
    curl \
    # Timezone data
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set timezone
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create non-root user for security (Canadian compliance best practice)
RUN groupadd --gid 1001 nestsync && \
    useradd --uid 1001 --gid nestsync --shell /bin/bash --create-home nestsync

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Set application directory
WORKDIR /app

# Copy application code with proper ownership
COPY --chown=nestsync:nestsync . .

# Create directories for application data with proper permissions
RUN mkdir -p /app/logs /app/temp /app/uploads && \
    chown -R nestsync:nestsync /app && \
    chmod -R 755 /app

# Create health check script
RUN echo '#!/bin/bash\n\
response=$(curl -f -s http://localhost:${PORT:-8000}/health || exit 1)\n\
echo "Health check response: $response"\n\
if [[ $response == *"healthy"* ]]; then\n\
  exit 0\n\
else\n\
  exit 1\n\
fi' > /usr/local/bin/healthcheck.sh && \
    chmod +x /usr/local/bin/healthcheck.sh

# Switch to non-root user
USER nestsync

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Health check configuration for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["/usr/local/bin/healthcheck.sh"]

# Command to run the application
# Railway will provide the PORT environment variable
CMD uvicorn $APP_MODULE \
    --host $HOST \
    --port ${PORT:-8000} \
    --workers ${WORKERS:-1} \
    --worker-class ${WORKER_CLASS} \
    --access-log \
    --log-level info \
    --timeout-keep-alive 65 \
    --timeout-graceful-shutdown 30

# =============================================================================
# Development Stage (optional) - For local development
# =============================================================================
FROM production as development

# Switch back to root for development tool installation
USER root

# Install development tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    vim \
    git \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Install development Python packages
RUN pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    pytest-cov \
    black \
    flake8 \
    mypy \
    ipython \
    debugpy

# Switch back to nestsync user
USER nestsync

# Override CMD for development with hot reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# =============================================================================
# Labels and Metadata
# =============================================================================
LABEL maintainer="NestSync Team" \
      description="NestSync FastAPI Backend - Canadian Diaper Planning App" \
      version="1.0.0" \
      org.opencontainers.image.title="NestSync Backend" \
      org.opencontainers.image.description="FastAPI backend for NestSync Canadian diaper planning application" \
      org.opencontainers.image.vendor="NestSync" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.url="https://nestsync.ca" \
      org.opencontainers.image.documentation="https://docs.nestsync.ca" \
      ca.nestsync.compliance="PIPEDA" \
      ca.nestsync.region="Canada"