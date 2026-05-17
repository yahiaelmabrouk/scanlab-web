@echo off
setlocal enabledelayedexpansion

echo HD
cd HD
for /d %%a in (*) do (
    echo Renaming files in %%a
    pushd "%%a"
    for /r %%i in (*) do (
        set "filename=%%~nxi"
        set "foldername=%%~na"
        set "newname=!foldername!_!filename!"

        ECHO Renaming: !filename!
        ren !filename! HD_1-0_1-0_1-0_!foldername!_!filename!
    )
    popd
)

cd ..

echo LD
cd LD
for /d %%a in (*) do (
    echo Renaming files in %%a
    pushd "%%a"
    for /r %%i in (*) do (
        set "filename=%%~nxi"
        set "foldername=%%~na"
        set "newname=!foldername!_!filename!"

        ECHO Renaming: !filename!
        ren !filename! LD_1-0_1-0_1-0_!foldername!_!filename!
    )
    popd
)

ECHO Done
PAUSE
