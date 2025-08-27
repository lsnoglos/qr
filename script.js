const urlInput = document.getElementById('urlInput');
const logoInput = document.getElementById('logoInput');
const colorPicker = document.getElementById('colorPicker');
const logoSizeSlider = document.getElementById('logoSizeSlider');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('qrCanvas');
const ctx = canvas.getContext('2d');

let logoImage = null;

generateBtn.addEventListener('click', drawCanvas);
logoSizeSlider.addEventListener('input', drawCanvas);
colorPicker.addEventListener('input', drawCanvas);

logoInput.addEventListener('change', (event) => {
    if (event.target.files && event.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoImage = new Image();
            logoImage.onload = () => {
                logoSizeSlider.disabled = false;
                drawCanvas();
            };
            logoImage.src = e.target.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    } else {
        logoImage = null;
        logoSizeSlider.disabled = true;
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

    try {
        const qrImage = await loadQrCode(url);
        
        ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);

        if (logoImage) {
            const logoSizePercent = parseInt(logoSizeSlider.value, 10) / 100;
            const logoDimension = canvas.width * logoSizePercent;
            const logoX = (canvas.width - logoDimension) / 2;
            const logoY = (canvas.height - logoDimension) / 2;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(logoX - 5, logoY - 5, logoDimension + 10, logoDimension + 10); 
            
            ctx.drawImage(logoImage, logoX, logoY, logoDimension, logoDimension);
        }

        prepareDownload();

    } catch (error) {
        console.error('Error al generar el QR:', error);
        alert('No se pudo generar el código QR. Revisa la URL y tu conexión a internet.');
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
    const dataUrl = canvas.toDataURL('image/png');
    downloadBtn.href = dataUrl;
    downloadBtn.download = 'codigo-qr-personalizado.png';
    downloadBtn.style.display = 'inline-block';
}