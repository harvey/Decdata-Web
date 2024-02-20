@echo on
title Setting up Python virtual environment
set VENV_NAME=myenv

:: Create and activate the virtual environment
python -m venv %VENV_NAME%
call %VENV_NAME%\Scripts\activate

:: Upgrade pip (optional)
:: python -m pip install --upgrade pip

:: Install requirements
pip install -r requirements.txt

title Decdata server

:: Run server script
python serv2.py

:: Deactivate venv when done
call %VENV_NAME%\Scripts\deactivate.bat

::Pause
pause