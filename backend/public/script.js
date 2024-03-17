const scanner = new Html5QrcodeScanner('reader', {
    qrbox: {
        width: 250,
        height: 250,
    },
    fps: 20,
});

const success = (result) => {
    processQRCode(result);
};

const error = (err) => {
    console.error(err);
};

scanner.render(success, error);

// Add event listener for form submission
document.getElementById('qrForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const qrCode = document.getElementById('qrInput').value;
    processQRCode(qrCode);
});

const processQRCode = async (qrCode) => {
    scanner.clear();
    let element = document.getElementById('element-id');
    if (element) {
        element.remove();
    }

    try {
        const response = await fetch('https://192.168.1.90:3000/decode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qrCode: qrCode }),
        });

        const data = await response.text();
        console.log('Success:', data);
        const resultElement = document.getElementById('result');
        if (data === 'true') {
            // Create success element
            resultElement.innerHTML = `
                <h2>Erfolg!</h2>
                <p>Ergebnis des Scans: ${qrCode}</p>
            `;
            // Change the background color to green
            document.body.style.backgroundColor = 'green';
        } else if (data === 'false') {
            // Create reject element
            resultElement.innerHTML = `
                <h2>Abgelehnt!</h2>
                <p>Ergebnis des Scans: ${qrCode}</p>
            `;
            // Change the background color to red
            document.body.style.backgroundColor = 'red';
        } else {
            const jsonData = JSON.parse(data);
            if (jsonData.status === 'alreadyChecked') {
                // Create already checked element
                resultElement.innerHTML = `
                    <h2>Bereits überprüft!</h2>
                    <p>Ergebnis des Scans: ${qrCode}</p>
                    <p>Entwertet am: ${jsonData.checkedDate} um ${jsonData.checkedTime}</p>
                `;
                // Change the background color to yellow
                document.body.style.backgroundColor = 'yellow';
            }
        }

        // Change the background color back to its original color after 3 seconds and reload the page
        if (document.getElementById('autoLoadCheckbox').checked) {
            setTimeout(() => {
                document.body.style.backgroundColor = '';
                location.reload();
            }, 3000);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
