// JavaScript principal para la aplicación Generador de Exámenes UCV

class ExamGenerator {
    constructor() {
        this.currentSlide = 1;
        this.examType = '';
        this.examTitle = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showSlide(1);
    }

    setupEventListeners() {
        // Event listeners para navegación
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigation();
            this.setupFileUpload();
            this.setupExamGeneration();
        });
    }

    setupNavigation() {
        // Los botones de navegación se configuran a través de atributos onclick
        // pero podemos mejorarlos con event listeners
        const buttons = document.querySelectorAll('[onclick*="seleccionarExamen"]');
        buttons.forEach(button => {
            const onclick = button.getAttribute('onclick');
            const match = onclick.match(/seleccionarExamen\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                const [, type, title] = match;
                button.removeAttribute('onclick');
                button.addEventListener('click', () => this.seleccionarExamen(type, title));
            }
        });
    }

    setupFileUpload() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('input-archivo');
        
        if (dropZone && fileInput) {
            // Drag and drop
            dropZone.addEventListener('dragover', this.dragOver.bind(this));
            dropZone.addEventListener('dragleave', this.dragLeave.bind(this));
            dropZone.addEventListener('drop', this.dropArchivo.bind(this));
            
            // File input change
            fileInput.addEventListener('change', this.cargarArchivo.bind(this));
        }
    }

    setupExamGeneration() {
        const generateBtn = document.querySelector('[onclick*="pedirIA"]');
        if (generateBtn) {
            generateBtn.removeAttribute('onclick');
            generateBtn.addEventListener('click', () => this.pedirIA());
        }
    }

    // Navegación entre slides
    showSlide(slideNumber) {
        document.querySelectorAll('[id^="slide-"]').forEach(slide => {
            slide.style.display = 'none';
        });
        
        const targetSlide = document.getElementById(`slide-${slideNumber}`);
        if (targetSlide) {
            targetSlide.style.display = 'block';
            this.currentSlide = slideNumber;
        }
    }

    seleccionarExamen(tipo, titulo) {
        this.examType = tipo;
        this.examTitle = titulo;
        
        document.getElementById('titulo-examen-hoja').textContent = titulo;
        
        this.showSlide(2);
    }

    volverALaPortada() {
        this.showSlide(1);
    }

    irASlide3() {
        this.showSlide(3);
        this.generarQuiz();
    }

    irASlide4() {
        this.showSlide(4);
    }

    volverAlEditor() {
        this.showSlide(2);
    }

    volverDesdeCorrector() {
        this.showSlide(1);
    }

    // Generación de exámenes
    async pedirIA() {
        const tema = document.getElementById('tema').value.trim();
        if (!tema) {
            this.mostrarError('Por favor ingresa un tema para el examen');
            return;
        }

        if (!this.examType) {
            this.mostrarError('Por favor selecciona un tipo de examen primero');
            return;
        }

        document.getElementById('resultado').innerHTML = '<p style="text-align:center;">Generando examen...</p>';

        try {
            const response = await fetch('https://back-end-ia-generador-de-examenes.onrender.com/generar-examen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, tipo: this.examType })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            document.getElementById('resultado').innerHTML = data.html || data.contenido || data.content;
            
            // Aplicar correcciones si es necesario
            if (this.examType === 'pa1' || this.examType === 'parcial') {
                const resultado = document.getElementById('resultado');
                resultado.innerHTML = this.corregirHerramientasManuales(resultado.innerHTML);
            }
            
        } catch (error) {
            console.error('Error al generar examen:', error);
            this.mostrarError('Error al generar examen: ' + error.message);
        }
    }

    // Generación de quiz
    async generarQuiz() {
        const tema = document.getElementById('tema').value.trim();
        if (!tema) {
            this.mostrarError('Por favor ingresa un tema primero');
            return;
        }

        document.getElementById('txt-multiple').value = 'Generando preguntas...';
        document.getElementById('txt-match').value = 'Generando emparejamientos...';

        try {
            const response = await fetch('https://back-end-ia-generador-de-examenes.onrender.com/generar-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, tipo: this.examType })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            document.getElementById('txt-multiple').value = data.multiple || '';
            document.getElementById('txt-match').value = data.match || '';
            
        } catch (error) {
            console.error('Error al generar quiz:', error);
            this.mostrarError('Error al generar quiz: ' + error.message);
        }
    }

    // Manejo de archivos
    dragOver(event) {
        event.preventDefault();
        event.currentTarget.style.borderColor = '#7ec8ff';
    }

    dragLeave(event) {
        event.preventDefault();
        event.currentTarget.style.borderColor = '';
    }

    dropArchivo(event) {
        event.preventDefault();
        event.currentTarget.style.borderColor = '';
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.procesarArchivo(files[0]);
        }
    }

    cargarArchivo(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.procesarArchivo(files[0]);
        }
    }

    procesarArchivo(file) {
        if (!file.type.match('image.*') && !file.type.includes('pdf')) {
            this.mostrarError('Por favor sube un archivo PDF o imagen');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('preview-img');
            const nombreArchivo = document.getElementById('nombre-archivo');
            const btnResolver = document.getElementById('btn-resolver');
            
            if (file.type.includes('pdf')) {
                preview.style.display = 'none';
                nombreArchivo.textContent = `PDF: ${file.name}`;
            } else {
                preview.src = e.target.result;
                preview.style.display = 'block';
                nombreArchivo.textContent = `Imagen: ${file.name}`;
            }
            
            btnResolver.disabled = false;
            this.currentFile = {
                data: e.target.result,
                type: file.type.includes('pdf') ? 'application/pdf' : file.type
            };
        };
        
        reader.readAsDataURL(file);
    }

    // Resolución de exámenes
    async resolverExamen() {
        if (!this.currentFile) {
            this.mostrarError('Por favor sube un archivo primero');
            return;
        }

        const btnResolver = document.getElementById('btn-resolver');
        btnResolver.disabled = true;
        btnResolver.textContent = 'Resolviendo...';

        try {
            const response = await fetch('https://back-end-ia-generador-de-examenes.onrender.com/resolver-examen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imagen: this.currentFile.data,
                    mimeType: this.currentFile.type
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Mostrar resultado (implementar UI para mostrar la solución)
            this.mostrarSolucion(data.solucion);
            
        } catch (error) {
            console.error('Error al resolver examen:', error);
            this.mostrarError('Error al resolver examen: ' + error.message);
        } finally {
            btnResolver.disabled = false;
            btnResolver.textContent = 'Resolver Examen';
        }
    }

    // Utilidades
    corregirHerramientasManuales(html) {
        // Implementación simplificada de la corrección
        return html; // Por ahora retornamos el HTML sin cambios
    }

    mostrarError(mensaje) {
        // Crear elemento de error temporal
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        errorDiv.textContent = mensaje;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    mostrarSolucion(solucion) {
        // Implementar UI para mostrar la solución
        console.log('Solución:', solucion);
        this.mostrarError('Solución generada (revisa la consola)');
    }

    copyText(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.select();
            document.execCommand('copy');
            this.mostrarError('Texto copiado al portapapeles');
        }
    }

    exportarWord() {
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-PE').replace(/\//g, '-');
        const areaClone = document.getElementById('area-impresion').cloneNode(true);
        const imgUCVWeb = areaClone.querySelector('.logo-ucv-img');
        const imgCISWeb = areaClone.querySelector('.logo-cis-img');
        const urlUCV = imgUCVWeb ? new URL(imgUCVWeb.getAttribute('src'), window.location.href).href : '';
        const urlCIS = imgCISWeb ? new URL(imgCISWeb.getAttribute('src'), window.location.href).href : '';

        const headerOriginal = areaClone.querySelector('.header');
        if(headerOriginal) {
            headerOriginal.innerHTML = `
                <table border="0" cellspacing="0" cellpadding="0" style="width:100%; border-bottom:2px solid black; margin-bottom:10px;">
                    <tr>
                        <td align="left" valign="middle" style="border:none; padding: 10px 0;">
                            <img src="${urlUCV}" width="180" height="90" style="width:180px; height:90px; display:block;">
                        </td>
                        <td align="right" valign="middle" style="border:none; padding: 10px 0;">
                            <img src="${urlCIS}" width="160" height="80" style="width:160px; height:80px; display:block;">
                        </td>
                    </tr>
                </table>`;
        }

        // Mejorar el título para que esté centrado, subrayado y con tamaño elegante
        const tituloHoja = areaClone.querySelector('#titulo-examen-hoja');
        if (tituloHoja) {
            tituloHoja.style.cssText = 'text-align:center; text-decoration:underline; font-size:14pt; margin-top:15px; margin-bottom:20px; color:#1a237e; font-weight:600;';
        }

        const contenidoHTML = areaClone.innerHTML;
        const estilosWord = `<style>
            @page { size: A4; margin: 2cm; }
            * { font-family: 'Calibri Light', sans-serif !important; }
            body, p, div, span, h1, h2, h3, h4, li, table, td, th { font-family: 'Calibri Light', sans-serif !important; font-size: 10pt; }
            #titulo-examen-hoja { text-align:center !important; text-decoration:underline !important; font-size:14pt !important; margin-top:15px !important; margin-bottom:20px !important; color:#1a237e !important; font-weight:600 !important; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #000000; padding: 4px; font-size: 9pt; }
            p, li, div:not(.header) { font-size: 10pt; }
        </style>`;
        const documentoCompleto = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'>${estilosWord}</head><body style="font-family:'Calibri Light', sans-serif;">${contenidoHTML}</body></html>`;

        const blob = new Blob(['\ufeff', documentoCompleto], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.examTitle} - ${fecha}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Inicializar la aplicación
const app = new ExamGenerator();

// Funciones globales para compatibilidad con HTML existente
function seleccionarExamen(tipo, titulo) {
    app.seleccionarExamen(tipo, titulo);
}

function pedirIA() {
    app.pedirIA();
}

function irASlide3() {
    app.irASlide3();
}

function irASlide4() {
    app.irASlide4();
}

function volverALaPortada() {
    app.volverALaPortada();
}

function volverAlEditor() {
    app.volverAlEditor();
}

function volverDesdeCorrector() {
    app.volverDesdeCorrector();
}

function dragOver(event) {
    app.dragOver(event);
}

function dragLeave(event) {
    app.dragLeave(event);
}

function dropArchivo(event) {
    app.dropArchivo(event);
}

function cargarArchivo(event) {
    app.cargarArchivo(event);
}

function resolverExamen() {
    app.resolverExamen();
}

function copyText(elementId) {
    app.copyText(elementId);
}

function exportarWord() {
    app.exportarWord();
}
