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
find_package(PkgConfig REQUIRED)
pkg_check_modules(LIBPQXX REQUIRED libpqxx)

# Google Test and nlohmann_json
include(FetchContent)
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG v1.15.2
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)

FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)
set(JSON_BuildTests OFF CACHE INTERNAL "")

FetchContent_MakeAvailable(googletest nlohmann_json)
enable_testing()

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
if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/../stdexec")
    add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../stdexec ${CMAKE_CURRENT_BINARY_DIR}/stdexec EXCLUDE_FROM_ALL)
    include_directories(${CMAKE_CURRENT_SOURCE_DIR}/../stdexec/include)
elseif(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/stdexec")
    add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/stdexec EXCLUDE_FROM_ALL)
    include_directories(${CMAKE_CURRENT_SOURCE_DIR}/stdexec/include)
else()
    message(FATAL_ERROR "stdexec directory not found")
endif()

# Source files - Clean Architecture structure
set(SOURCES
    src/main.cpp
    src/repository/json_repository.cpp
    src/repository/postgres_shop_repository.cpp
    src/repository/postgres_user_repository.cpp
    src/database/connection_pool.cpp
    src/service/shop_service.cpp
    src/service/user_service.cpp
    src/router/router.cpp
)

# Library for database layer
add_library(spice_db
    src/database/connection_pool.cpp
    src/repository/postgres_shop_repository.cpp
    src/repository/postgres_user_repository.cpp
)
target_include_directories(spice_db PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${LIBPQXX_INCLUDE_DIRS}
)
target_link_libraries(spice_db PUBLIC
    ${LIBPQXX_LIBRARIES}
    Threads::Threads
)
target_compile_options(spice_db PRIVATE
    -Wall -Wextra -Wpedantic
)

# Main API Server - Clean Architecture with stdexec
add_executable(spice_curry_api_server ${SOURCES})
target_link_libraries(spice_curry_api_server
    PRIVATE
    Threads::Threads
    STDEXEC::stdexec
    spice_db
    ${LIBPQXX_LIBRARIES}
    nlohmann_json::nlohmann_json
)
target_compile_options(spice_curry_api_server PRIVATE
    -Wall -Wextra -Wpedantic
    -ffast-math -funroll-loops
    $<$<CONFIG:Release>:-O3 -march=native -flto>
    $<$<CONFIG:Debug>:-g -O0 -fsanitize=address>
)

# Tests
add_executable(connection_pool_test tests/database/connection_pool_test.cpp)
target_link_libraries(connection_pool_test
    PRIVATE
    spice_db
    GTest::gtest_main
)
target_include_directories(connection_pool_test PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

add_executable(shop_repository_test tests/repository/shop_repository_test.cpp)
target_link_libraries(shop_repository_test
    PRIVATE
    spice_db
    GTest::gtest_main
)
target_include_directories(shop_repository_test PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

include(GoogleTest)
gtest_discover_tests(connection_pool_test)
gtest_discover_tests(shop_repository_test)

# Print build information
message(STATUS "=== Spice Curry API - C++26 Clean Architecture ===")
message(STATUS "CXX Compiler: ${CMAKE_CXX_COMPILER_ID} ${CMAKE_CXX_COMPILER_VERSION}")
message(STATUS "CXX Standard: C++${CMAKE_CXX_STANDARD}")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Architecture: Domain/Repository/Service/Router")
message(STATUS "================================================")
