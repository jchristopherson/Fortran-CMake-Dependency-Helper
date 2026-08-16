cmake_minimum_required(VERSION 3.20)
project(@PROJECT_NAME@ LANGUAGES Fortran)

include(cmake/dependencies.cmake)

enable_language(Fortran)

add_executable(@PROJECT_NAME@ src/main.f90)
