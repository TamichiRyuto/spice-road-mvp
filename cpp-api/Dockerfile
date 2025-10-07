# Dockerfile for C++26 development with GCC 15+
FROM gcc:15

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    ninja-build \
    git \
    pkg-config \
    libnuma-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Set C++26 environment variables
ENV CXX=g++
ENV CC=gcc
ENV CXXFLAGS="-std=c++26 -O3 -march=native"
ENV CMAKE_CXX_STANDARD=26

# Create build directory
RUN mkdir -p build

# Default command
CMD ["bash"]