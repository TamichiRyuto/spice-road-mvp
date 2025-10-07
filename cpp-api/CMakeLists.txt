cmake_minimum_required(VERSION 3.25)
project(spice_curry_api CXX)

# C++26 configuration
set(CMAKE_CXX_STANDARD 26)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimize for performance
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -march=native -flto -DNDEBUG")
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -fsanitize=address")

# Find required packages
find_package(Threads REQUIRED)

# Check for C++26 features
include(CheckCXXSourceCompiles)
check_cxx_source_compiles("
#include <print>
#include <format>
#include <ranges>
#include <expected>
int main() { return 0; }
" HAS_CXX26_FEATURES)

if(NOT HAS_CXX26_FEATURES)
    message(FATAL_ERROR "C++26 features not fully supported by this compiler")
endif()

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)

# stdexec sender/receiver library
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/stdexec EXCLUDE_FROM_ALL)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/stdexec/include)

# Source files - Clean Architecture structure
set(SOURCES
    src/main.cpp
    src/repository/json_repository.cpp
    src/service/shop_service.cpp
    src/service/user_service.cpp
    src/router/router.cpp
)

# Main API Server - Clean Architecture with stdexec
add_executable(spice_curry_api_server ${SOURCES})
target_link_libraries(spice_curry_api_server
    PRIVATE
    Threads::Threads
    STDEXEC::stdexec
)
target_compile_options(spice_curry_api_server PRIVATE
    -Wall -Wextra -Wpedantic
    -ffast-math -funroll-loops
    $<$<CONFIG:Release>:-O3 -march=native -flto>
    $<$<CONFIG:Debug>:-g -O0 -fsanitize=address>
)

# Print build information
message(STATUS "=== Spice Curry API - C++26 Clean Architecture ===")
message(STATUS "CXX Compiler: ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "CXX Standard: C++${CMAKE_CXX_STANDARD}")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Architecture: Domain/Repository/Service/Router")
message(STATUS "================================================")
