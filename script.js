const urlInput = document.getElementById('urlInput');
const logoInput = document.getElementById('logoInput');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('qrCanvas');
const ctx = canvas.getContext('2d');

const colorPicker1 = document.getElementById('colorPicker1');
const colorPicker2 = document.getElementById('colorPicker2');
const gradientDirection = document.getElementById('gradientDirection');
const bgColorPicker = document.getElementById('bgColorPicker');
const transparentBgCheckbox = document.getElementById('transparentBgCheckbox');

const logoSizeSlider = document.getElementById('logoSizeSlider');
const logoBorderRadiusSlider = document.getElementById('logoBorderRadiusSlider');

let logoImage = null;

generateBtn.addEventListener('click', drawCanvas);
[colorPicker1, colorPicker2, gradientDirection, bgColorPicker, transparentBgCheckbox].forEach(el => el.addEventListener('input', drawCanvas));
[logoSizeSlider, logoBorderRadiusSlider].forEach(el => el.addEventListener('input', drawCanvas));

logoInput.addEventListener('change', (event) => {
    if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoImage = new Image();
            logoImage.onload = () => {
                [logoSizeSlider, logoBorderRadiusSlider].forEach(el => el.disabled = false);
                drawCanvas();
            };
            logoImage.src = e.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    } else {
        logoImage = null;
        [logoSizeSlider, logoBorderRadiusSlider].forEach(el => el.disabled = true);
        drawCanvas();
    }
});

async function drawCanvas() {
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
        const originalQrImage = await loadQrCode(url);
        const qrImageWithTransparentBg = await removeColorFromImage(originalQrImage, '#FFFFFF');
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        const gradient = createGradient(tempCtx);
        tempCtx.fillStyle = gradient;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(qrImageWithTransparentBg, 0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.globalCompositeOperation = 'source-over';

        ctx.drawImage(tempCanvas, 0, 0);

        if (logoImage) {
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
            ctx.drawImage(logoImage, logoX, logoY, logoDimension, logoDimension);
            ctx.restore();
        }
        prepareDownload();
    } catch (error) {
        console.error('Error al generar el QR:', error);
        alert('No se pudo generar el código QR.');
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
        case 'radial':
            gradient = context.createRadialGradient(context.canvas.width / 2, context.canvas.height / 2, 0, context.canvas.width / 2, context.canvas.height / 2, context.canvas.width / 2);
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

function loadQrCode(url) {
    return new Promise((resolve, reject) => {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/`;
        const params = new URLSearchParams({
            data: url,
            size: `${canvas.width}x${canvas.height}`,
            color: '000000',
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
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function removeColorFromImage(image, colorToRemoveHex) {
    return new Promise(resolve => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = image.naturalWidth;
        tempCanvas.height = image.naturalHeight;
        tempCtx.drawImage(image, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        const colorToRemove = hexToRgb(colorToRemoveHex);
        if (!colorToRemove) {
            resolve(image);
            return;
        }
        const tolerance = 30;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (r > colorToRemove.r - tolerance && r < colorToRemove.r + tolerance &&
                g > colorToRemove.g - tolerance && g < colorToRemove.g + tolerance &&
                b > colorToRemove.b - tolerance && b < colorToRemove.b + tolerance) {
                data[i + 3] = 0;
            }
        }
        tempCtx.putImageData(imageData, 0, 0);
        const newImage = new Image();
        newImage.onload = () => resolve(newImage);
        newImage.src = tempCanvas.toDataURL();
    });
}
