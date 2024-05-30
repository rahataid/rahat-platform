import QRCode from 'qrcode';

export async function generateQRCode(input) {
    return QRCode.toBuffer(input.toString())
        .then((buffer) => {
            return buffer
        })
        .catch((err) => {
            console.error(err);
        });
}
