document.addEventListener('DOMContentLoaded', () => {
    const diseaseTypeSelect = document.getElementById('disease-type');
    const submitButton = document.getElementById('submit-button');

    // Fetch the schema from the backend
    fetch('/get-schema')
        .then(response => response.json())
        .then(schema => {
            // Populate the dropdown with disease types
            const diseases = Object.keys(schema.diseases);
            diseases.forEach(disease => {
                const option = document.createElement('option');
                option.value = disease;
                option.textContent = disease.charAt(0).toUpperCase() + disease.slice(1);
                diseaseTypeSelect.appendChild(option);
            });
        });

     // Handle form submission
     submitButton.addEventListener('click', () => {
        const formData = {};

        // Collect data from all inputs
        document.querySelectorAll('select').forEach(select => {
            if (select.multiple) {
                formData[select.name] = Array.from(select.selectedOptions).map(option => option.value);
            } else {
                formData[select.name] = select.value;
            }
        });

        // Send data to backend
        fetch('/query-clinical-trials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    alert("Query successfully executed. Check console for results.");
                    console.log("Clinical Trials Results:", data.results);
                } else {
                    alert(`Error: ${data.message}`);
                }
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
            });
    });
});

