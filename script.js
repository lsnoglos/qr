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

let logoImage = null;

generateBtn.addEventListener('click', drawCanvas);
[qrShape, colorPicker1, colorPicker2, gradientDirection, bgColorPicker, transparentBgCheckbox].forEach(el => el.addEventListener('input', drawCanvas));
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

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = (col + 1) * moduleSize;
                    const y = (row + 1) * moduleSize;
                    drawModule(ctx, x, y, moduleSize, qrShape.value);
                }
            }
        }

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
        alert('No se pudo generar el código QR. La URL puede ser demasiado larga.');
    }
}

function drawModule(ctx, x, y, size, shape) {
    const center = size / 2;
    switch (shape) {
        case 'dots':
            ctx.beginPath();
            ctx.arc(x + center, y + center, size / 2.1, 0, 2 * Math.PI); // Ligeramente más pequeño para que no se toquen
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
