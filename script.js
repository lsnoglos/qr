const urlInput = document.getElementById('urlInput');
const logoInput = document.getElementById('logoInput');
const colorPicker = document.getElementById('colorPicker');
const logoSizeSlider = document.getElementById('logoSizeSlider');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('qrCanvas');
const ctx = canvas.getContext('2d');

const logoBorderRadiusSlider = document.getElementById('logoBorderRadiusSlider');
const enableRemoveBgCheckbox = document.getElementById('enableRemoveBgCheckbox');
const removeBgColorPicker = document.getElementById('removeBgColorPicker');

let originalLogo = null;
let processedLogo = null;

generateBtn.addEventListener('click', drawCanvas);
colorPicker.addEventListener('input', drawCanvas);
logoSizeSlider.addEventListener('input', drawCanvas);
logoBorderRadiusSlider.addEventListener('input', drawCanvas);
enableRemoveBgCheckbox.addEventListener('change', handleLogoProcessing);
removeBgColorPicker.addEventListener('input', handleLogoProcessing);

logoInput.addEventListener('change', (event) => {
    if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            originalLogo = new Image();
            originalLogo.onload = () => {
                [logoSizeSlider, logoBorderRadiusSlider, enableRemoveBgCheckbox, removeBgColorPicker].forEach(el => el.disabled = false);
                handleLogoProcessing(); 
            };
            originalLogo.src = e.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    } else {
        originalLogo = null;
        processedLogo = null;
        [logoSizeSlider, logoBorderRadiusSlider, enableRemoveBgCheckbox, removeBgColorPicker].forEach(el => el.disabled = true);
        drawCanvas();
    }
});

function handleLogoProcessing() {
    if (!originalLogo) return;

    if (enableRemoveBgCheckbox.checked) {
        processedLogo = removeColorFromImage(originalLogo, removeBgColorPicker.value);
    } else {
        processedLogo = originalLogo;
    }
    drawCanvas();
}

async function drawCanvas() {
    const url = urlInput.value;
    if (!url) {
        alert('Por favor, introduce una URL.');
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        const qrImage = await loadQrCode(url);
        ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);

        if (processedLogo) {
            const logoSizePercent = parseInt(logoSizeSlider.value, 10) / 100;
            const logoDimension = canvas.width * logoSizePercent;
            const logoX = (canvas.width - logoDimension) / 2;
            const logoY = (canvas.height - logoDimension) / 2;
            const borderRadius = (logoDimension / 2) * (parseInt(logoBorderRadiusSlider.value, 10) / 50);

            ctx.fillStyle = '#FFFFFF';
            drawRoundedRect(ctx, logoX - 5, logoY - 5, logoDimension + 10, logoDimension + 10, borderRadius > 0 ? borderRadius + 5 : 0);
            ctx.fill();
            
            ctx.save();
            drawRoundedRect(ctx, logoX, logoY, logoDimension, logoDimension, borderRadius);
            ctx.clip();
            ctx.drawImage(processedLogo, logoX, logoY, logoDimension, logoDimension);
            ctx.restore();
        }

        prepareDownload();

    } catch (error) {
        console.error('Error al generar el QR:', error);
        alert('No se pudo generar el código QR.');
    }
}

function loadQrCode(url) {
    return new Promise((resolve, reject) => {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/`;
        const params = new URLSearchParams({
            data: url,
            size: `${canvas.width}x${canvas.height}`,
            color: colorPicker.value.substring(1),
            bgcolor: 'FFFFFF',
            qzone: 1,
            margin: 0,
            ecc: 'H'
        });
        
        const qrCodeImage = new Image();
        qrCodeImage.crossOrigin = "Anonymous";
        qrCodeImage.onload = () => resolve(qrCodeImage);
        qrCodeImage.onerror = reject;
        qrCodeImage.src = `${qrApiUrl}?${params.toString()}`;
    });
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

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function removeColorFromImage(image, colorToRemoveHex) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.drawImage(image, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    const colorToRemove = hexToRgb(colorToRemoveHex);
    const tolerance = 20;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const colorDistance = Math.sqrt(
            Math.pow(r - colorToRemove.r, 2) +
            Math.pow(g - colorToRemove.g, 2) +
            Math.pow(b - colorToRemove.b, 2)
        );

        if (colorDistance <= tolerance) {
            data[i + 3] = 0;
        }
    }

    tempCtx.putImageData(imageData, 0, 0);
    
    return tempCanvas;
}