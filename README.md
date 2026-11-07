# Proyecto-Restaurante-Programacion-de-Software---Frontend
Repositorio Proyecto Restaurante Programacion de Software - Frontend

# Video del proyecto funcionando

-- YouTube: https://youtu.be/bClS8niaeOM 
-- OneDrive: https://correoitmedu-my.sharepoint.com/:v:/g/personal/kevingarces1131245_correo_itm_edu_co/IQCI4-TreRd4Qb9cV15F84PwAVc70f-YrGPxC3QAWs5xajc?e=ROWTpS&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D

URL del backend
La aplicacion llama a la API en:

-- http://127.0.0.1:8000

codigo para poder levantar el backend:

pip install -r requirements.txt
python -m uvicorn main:app --reload

Está definida en src/enviroments/enmviroments.ts

# Cómo levantar el frontend en local

Se requiere tener Node.js 22 o superior (node -v) y tener el backend del proyecto corriendo en local

1. Clonar el repositorio e instalar las dependencias:

git clone URL-del-repositorio
cd carpeta-del-repositorio
npm install --legacy-peer-deps

2. Abrir src/enviroments/enmviroments.ts y revisar los siguientes valores:

apiUrl: 'http://127.0.0.1:8000'
usuarioAuditoriaId: fa25f194-ef0e-425d-8d8c-50a653f8231a

usuarioAuditoriaId es el usuario que queda registrado como autor de las altas (id_usuario_creacion) y de las ediciones (id_usuario_edicion), así que debe ser un id_usuario que exista en la base de datos

3. Con el backend encendido, iniciar el frontend:

npm start

4. Abrir http://localhost:4200 en el navegador