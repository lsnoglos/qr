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

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = (col + 1) * moduleSize;
                    const y = (row + 1) * moduleSize;

                    if (logoImage && x < logoX + logoDimension && x + moduleSize > logoX && y < logoY + logoDimension && y + moduleSize > logoY) {
                        continue;
                    }
                    drawModule(ctx, x, y, moduleSize, qrShape.value);
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
            ctx.beginPath();
            ctx.moveTo(x + center, y);
            ctx.lineTo(x + size, y + center);
            ctx.lineTo(x + center, y + size);
            ctx.lineTo(x, y + center);
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


//scan

const startScanBtn = document.getElementById('startScanBtn');
const closeScanBtn = document.getElementById('closeScanBtn');
const scannerModal = document.getElementById('scanner-modal');
const video = document.getElementById('scanner-video');
const scannerCanvas = document.getElementById('scanner-canvas');
const scannerCtx = scannerCanvas.getContext('2d');

const scanResultDiv = document.getElementById('scanResult');
const resultText = document.getElementById('resultText');
const resultLink = document.getElementById('resultLink');

let stream = null;
let animationFrameId = null;

startScanBtn.addEventListener('click', () => {
    scannerModal.style.display = 'flex';
    startCamera();
});

closeScanBtn.addEventListener('click', stopCamera);

function startCamera() {
    const constraints = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (cameraStream) {
            stream = cameraStream;
            video.srcObject = stream;
            video.setAttribute('playsinline', true);
            video.play();
            frameCounter = 0; // Reiniciamos el contador
            animationFrameId = requestAnimationFrame(tick);
        })
        .catch(function (err) {
            console.error("Error al acceder a la cámara en alta resolución: ", err);
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(function (cameraStream) {
                    stream = cameraStream;
                    video.srcObject = cameraStream;
                    video.setAttribute('playsinline', true);
                    video.play();
                    frameCounter = 0; // Reiniciamos el contador
                    animationFrameId = requestAnimationFrame(tick);
                }).catch(function (err) {
                    alert("No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios y usar HTTPS.");
                    scannerModal.style.display = 'none';
                });
        });
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    scannerModal.style.display = 'none';
    cancelAnimationFrame(animationFrameId);
}

function applyAdaptiveThreshold(imageData, width, height) {
    const grayData = new Uint8ClampedArray(width * height);
    const integralImage = new Uint32Array(width * height);
    const outputData = new Uint8ClampedArray(imageData.data.length);
    for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
        const brightness = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
        grayData[j] = brightness;
    }
    for (let y = 0; y < height; y++) {
        let sum = 0;
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            sum += grayData[index];
            if (y === 0) {
                integralImage[index] = sum;
            } else {
                integralImage[index] = integralImage[index - width] + sum;
            }
        }
    }
    const s = Math.floor(width / 16);
    const t = 0.15;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const x1 = Math.max(0, x - s);
            const y1 = Math.max(0, y - s);
            const x2 = Math.min(width - 1, x + s);
            const y2 = Math.min(height - 1, y + s);
            const count = (x2 - x1) * (y2 - y1);
            const sum = integralImage[y2 * width + x2] - (x1 > 0 ? integralImage[y2 * width + x1 - 1] : 0) - (y1 > 0 ? integralImage[(y1 - 1) * width + x2] : 0) + (x1 > 0 && y1 > 0 ? integralImage[(y1 - 1) * width + x1 - 1] : 0);
            const color = grayData[index] * count < sum * (1.0 - t) ? 0 : 255;
            const outputIndex = index * 4;
            outputData[outputIndex] = outputData[outputIndex + 1] = outputData[outputIndex + 2] = color;
            outputData[outputIndex + 3] = 255;
        }
    }
    return new ImageData(outputData, width, height);
}

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        frameCounter++;
        if (frameCounter % 4 === 0) {
            scannerCanvas.height = video.videoHeight;
            scannerCanvas.width = video.videoWidth;
            scannerCtx.drawImage(video, 0, 0, scannerCanvas.width, scannerCanvas.height);
            let imageData = scannerCtx.getImageData(0, 0, scannerCanvas.width, scannerCanvas.height);
            imageData = applyAdaptiveThreshold(imageData, scannerCanvas.width, scannerCanvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                handleQRCode(code);
                return;
            }
        }
    }
    animationFrameId = requestAnimationFrame(tick);
}

function handleQRCode(code) {
    console.log("Código QR encontrado:", code.data);
    stopCamera();
    scanResultDiv.style.display = 'block';
    resultText.textContent = code.data;
    if (code.data.startsWith('http://') || code.data.startsWith('https://')) {
        resultLink.href = code.data;
        resultLink.style.display = 'inline-block';
    } else {
        resultLink.style.display = 'none';
    }
}
