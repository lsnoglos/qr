// SECCIÓN DE GENERACIÓN DE CÓDIGO QR PERSONALIZADO

const urlInput = document.getElementById('urlInput');
const logoInput = document.getElementById('logoInput');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('qrCanvas');
const ctx = canvas.getContext('2d');

const qrShape = document.getElementById('qrShape');
const colorPicker1 = document.getElementById('colorPicker1');
const colorPicker2 = document.getElementById('colorPicker2');
const gradientDirection = document.getElementById('gradientDirection');
const bgColorPicker = document.getElementById('bgColorPicker');
const transparentBgCheckbox = document.getElementById('transparentBgCheckbox');

const logoSizeSlider = document.getElementById('logoSizeSlider');
const logoBorderRadiusSlider = document.getElementById('logoBorderRadiusSlider');
const fillLogoBgCheckbox = document.getElementById('fillLogoBgCheckbox');
const glowColorPicker = document.getElementById('glowColorPicker');
const glowIntensitySlider = document.getElementById('glowIntensitySlider');

let logoImage = null;
const allLogoControls = [logoSizeSlider, logoBorderRadiusSlider, fillLogoBgCheckbox, glowColorPicker, glowIntensitySlider];

generateBtn.addEventListener('click', drawCanvas);

const allControls = [
    qrShape, colorPicker1, colorPicker2, gradientDirection, bgColorPicker, transparentBgCheckbox,
    ...allLogoControls
];
allControls.forEach(el => {
    if (el) {
        el.addEventListener('input', drawCanvas);
    }
});

logoInput.addEventListener('change', (event) => {
    if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoImage = new Image();
            logoImage.onload = () => {
                allLogoControls.forEach(el => {
                    if (el) el.disabled = false;
                });
                drawCanvas();
            };
            logoImage.src = e.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    } else {
        logoImage = null;
        allLogoControls.forEach(el => {
            if (el) el.disabled = true;
        });
        drawCanvas();
    }
});

function drawCanvas() {
    const url = urlInput.value;
    if (!url) {
        alert('Por favor, introduce una URL.');
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!transparentBgCheckbox.checked) {
        ctx.fillStyle = bgColorPicker.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    try {
        const qr = qrcode(0, 'H');
        qr.addData(url);
        qr.make();

        const moduleCount = qr.getModuleCount();
        const moduleSize = canvas.width / (moduleCount + 2); 
        ctx.fillStyle = createGradient(ctx);

        let logoDimension = 0, logoX = 0, logoY = 0;
        if (logoImage) {
            logoDimension = canvas.width * (parseInt(logoSizeSlider.value, 10) / 100);
            logoX = (canvas.width - logoDimension) / 2;
            logoY = (canvas.height - logoDimension) / 2;
        }

        const pSize = 8; 

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = (col + 1) * moduleSize;
                    const y = (row + 1) * moduleSize;

                    if (logoImage && x < logoX + logoDimension && x + moduleSize > logoX && y < logoY + logoDimension && y + moduleSize > logoY) {
                        continue;
                    }
                    
                    let isPositionPattern = 
                        (row < pSize && col < pSize) ||
                        (row < pSize && col >= moduleCount - pSize) ||
                        (row >= moduleCount - pSize && col < pSize);

                    if (isPositionPattern) {
                        ctx.fillRect(x, y, moduleSize, moduleSize); 
                    } else {
                        drawModule(ctx, x, y, moduleSize, qrShape.value);
                    }
                }
            }
        }

        if (logoImage) {
            const borderRadius = (logoDimension / 2) * (parseInt(logoBorderRadiusSlider.value, 10) / 50);

            ctx.save();
            ctx.shadowColor = glowColorPicker.value;
            ctx.shadowBlur = parseInt(glowIntensitySlider.value, 10);

            if (fillLogoBgCheckbox.checked) {
                ctx.fillStyle = bgColorPicker.value;
                drawRoundedRect(ctx, logoX, logoY, logoDimension, logoDimension, borderRadius);
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0)';
                drawRoundedRect(ctx, logoX, logoY, logoDimension, logoDimension, borderRadius);
                ctx.fill();
            }
            ctx.restore();

            ctx.save();
            drawRoundedRect(ctx, logoX, logoY, logoDimension, logoDimension, borderRadius);
            ctx.clip();
            ctx.drawImage(logoImage, logoX, logoY, logoDimension, logoDimension);
            ctx.restore();
        }

        prepareDownload();
    } catch (error) {
        console.error('Error al generar el QR:', error);
        alert('No se pudo generar el código QR. La URL puede ser demasiado larga.');
    }
}

function drawModule(ctx, x, y, size, shape) {
    const center = size / 2;
    switch (shape) {
        case 'dots':
            ctx.beginPath();
            ctx.arc(x + center, y + center, size / 2.1, 0, 2 * Math.PI);
            ctx.fill();
            break;
        case 'diamonds':
            const scaleFactor = 1.15;
            const s = size * scaleFactor;
            const c = s / 2;
            const x_n = x - (s - size) / 2;
            const y_n = y - (s - size) / 2;

            ctx.beginPath();
            ctx.moveTo(x_n + c, y_n);
            ctx.lineTo(x_n + s, y_n + c);
            ctx.lineTo(x_n + c, y_n + s);
            ctx.lineTo(x_n, y_n + c);
            ctx.closePath();
            ctx.fill();
            break;
        case 'squares':
        default:
            ctx.fillRect(x, y, size, size);
            break;
    }
}

function createGradient(context) {
    const direction = gradientDirection.value;
    let gradient;
    switch (direction) {
        case 'horizontal':
            gradient = context.createLinearGradient(0, 0, context.canvas.width, 0);
            break;
        case 'diagonal':
            gradient = context.createLinearGradient(0, 0, context.canvas.width, context.canvas.height);
            break;
        case 'vertical':
        default:
            gradient = context.createLinearGradient(0, 0, 0, context.canvas.height);
            break;
    }
    gradient.addColorStop(0, colorPicker1.value);
    gradient.addColorStop(1, colorPicker2.value);
    return gradient;
}

function prepareDownload() {
    downloadBtn.href = canvas.toDataURL('image/png');
    downloadBtn.download = 'codigo-qr-personalizado.png';
    downloadBtn.style.display = 'inline-block';
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    if (radius === 0) {
        ctx.rect(x, y, width, height);
    } else {
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
    }
    ctx.closePath();
}

// SECCIÓN DE ESCANEO DE CÓDIGO QR


const startScanBtn = document.getElementById('startScanBtn');
const closeScanBtn = document.getElementById('closeScanBtn');
const scannerModal = document.getElementById('scanner-modal');
const video = document.getElementById('scanner-video');

const scanResultDiv = document.getElementById('scanResult');
const resultText = document.getElementById('resultText');
const resultLink = document.getElementById('resultLink');

const { BrowserMultiFormatReader, DecodeHintType, NotFoundException } = ZXing; 

let stream = null;
let codeReader = null;

startScanBtn.addEventListener('click', () => {
    scannerModal.style.display = 'flex';
    startCamera();
});

closeScanBtn.addEventListener('click', stopCamera);

function startCamera() {
    const constraints = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };
    
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.QR_CODE]);

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (cameraStream) {
            stream = cameraStream;
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();
            
            codeReader = new BrowserMultiFormatReader(hints);
            
            codeReader.decodeFromStream(cameraStream, video, (result, err) => {
                if (result) {
                    handleQRCode(result);
                }
                
                if (err && !(err instanceof NotFoundException)) {
                    console.error("Error de decodificación de ZXing:", err);
                }
            });

        })
        .catch(function (err) {
            console.error("Error al acceder a la cámara en alta resolución:", err);
            
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(function (cameraStream) {
                    stream = cameraStream;
                    video.srcObject = cameraStream;
                    video.setAttribute('playsinline', true);
                    video.play();
                    
                    codeReader = new BrowserMultiFormatReader(hints);
                    codeReader.decodeFromStream(cameraStream, video, (result, err) => {
                        if (result) {
                            handleQRCode(result);
                        }
                        if (err && !(err instanceof NotFoundException)) {
                            console.error("Error de decodificación de ZXing:", err);
                        }
                    });
                    
                }).catch(function (err) {
                    alert("No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios y usar HTTPS.");
                    scannerModal.style.display = 'none';
                });
        });
}

function stopCamera() {
    if (codeReader) {
        codeReader.reset();
    }
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    scannerModal.style.display = 'none';
    
}


function handleQRCode(code) {
    const decodedText = code.text; 
    
    console.log("Código QR encontrado:", decodedText);
    stopCamera();
    scanResultDiv.style.display = 'block';
    resultText.textContent = decodedText;
    
    if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        resultLink.href = decodedText;
        resultLink.style.display = 'inline-block';
    } else {
        resultLink.style.display = 'none';
    }
}
