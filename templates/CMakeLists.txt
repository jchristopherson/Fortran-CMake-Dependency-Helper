cmake_minimum_required(VERSION 3.20)
project(@PROJECT_NAME@ LANGUAGES Fortran)

enable_language(Fortran)

add_executable(@PROJECT_NAME@ src/main.f90)
include(cmake/dependencies.cmake)
