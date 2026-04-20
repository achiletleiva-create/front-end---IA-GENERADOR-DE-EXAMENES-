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
        document.getElementById('txt-tema').textContent = '...';
        
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

        document.getElementById('txt-tema').textContent = tema;
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

            document.getElementById('resultado').innerHTML = data.html || data.content;
            
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
        // Implementar exportación a Word
        this.mostrarError('Exportación a Word en desarrollo');
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
