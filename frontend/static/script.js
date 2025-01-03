document.addEventListener('DOMContentLoaded', () => {
    const diseaseTypeSelect = document.getElementById('disease-type');
    const formContainer = document.getElementById('dynamic-form-container');
    const submitButton = document.getElementById('submit-button');
    const querySummaryContainer = document.getElementById('query-summary');
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) {
        console.error("Error: #results-container element not found in the DOM.");
        return; // Stop execution if the container is missing
    }

    console.log("Results container found:", resultsContainer);

    // Fetch the schema from the backend
    fetch('/get-schema')
        .then(response => response.json())
        .then(schema => {
            const diseases = schema.diseases;

            // Populate disease types dropdown
            Object.keys(diseases).forEach(disease => {
                const option = document.createElement('option');
                option.value = disease;
                option.textContent = disease.charAt(0).toUpperCase() + disease.slice(1);
                diseaseTypeSelect.appendChild(option);
            });

            // Handle disease type selection
            diseaseTypeSelect.addEventListener('change', () => {
                const selectedDisease = diseaseTypeSelect.value;
                formContainer.innerHTML = ''; // Clear previous fields
                if (selectedDisease && diseases[selectedDisease]) {
                    renderFormFields(diseases[selectedDisease]);
                }
            });

            // Render form fields for the selected disease
            function renderFormFields(diseaseData) {
                // Render Primary Classification Fields
                if (diseaseData.primaryClassificationFields) {
                    formContainer.appendChild(createSectionTitle('Primary Classification Fields'));
            
                    // Use field order if defined in the schema
                    const fieldOrder = diseaseData.primaryClassificationFieldOrder || Object.keys(diseaseData.primaryClassificationFields);
            
                    fieldOrder.forEach(field => {
                        const fieldData = diseaseData.primaryClassificationFields[field];
            
                        if (Array.isArray(fieldData)) {
                            formContainer.appendChild(createDropdown(field, fieldData));
                        } else if (typeof fieldData === 'object') {
                            // Render subsections for nested objects
                            formContainer.appendChild(createSectionTitle(field, 5)); // Use h4 for subsections
                            renderNestedFields(fieldData);
                        } else {
                            console.error(`Unexpected field type for ${field}:`, fieldData);
                        }
                    });
                }
            
                // Render Primary Endpoints
                if (diseaseData.primaryEndpoints) {
                    formContainer.appendChild(createSectionTitle('Primary Endpoints'));
                    formContainer.appendChild(createMultiSelect('primaryEndpoints', diseaseData.primaryEndpoints));
                }
            
               // Render Study Design Criteria
if (diseaseData.studyDesignCriteria) {
    formContainer.appendChild(createSectionTitle('Study Design Criteria'));

    // Render Trial Phases
    if (diseaseData.studyDesignCriteria.trialPhases) {
        formContainer.appendChild(createMultiSelect('trialPhases', diseaseData.studyDesignCriteria.trialPhases));
    }

    // Render Randomization
    if (diseaseData.studyDesignCriteria.randomization) {
        formContainer.appendChild(createDropdown('randomization', diseaseData.studyDesignCriteria.randomization));
    }

    // Render Blinding
    if (diseaseData.studyDesignCriteria.blinding) {
        formContainer.appendChild(createDropdown('blinding', diseaseData.studyDesignCriteria.blinding));
    }

    // Render Trial Types
    if (diseaseData.studyDesignCriteria.trialType) {
        formContainer.appendChild(createMultiSelect('trialType', diseaseData.studyDesignCriteria.trialType));
    }
}

            
                // Render Special Population Criteria
                if (diseaseData.specialPopulationCriteria) {
                    formContainer.appendChild(createSectionTitle('Special Population Criteria'));
                    formContainer.appendChild(createMultiSelect('specialPopulationCriteria', diseaseData.specialPopulationCriteria));
                }
            }
            
            // Render nested fields (handles arrays and objects recursively)
            function renderNestedFields(fields) {
                Object.keys(fields).forEach(field => {
                    const fieldData = fields[field];
                    console.log('Processing field:', field, 'Data:', fieldData); // Debug log for troubleshooting
            
                    if (Array.isArray(fieldData)) {
                        // If the field data is an array, create a dropdown
                        formContainer.appendChild(createDropdown(field, fieldData));
                    } else if (typeof fieldData === 'object') {
                        // If the field data is an object, treat it as a subsection
                        formContainer.appendChild(createSectionTitle(field, 4)); // Use h4 for subsections
                        renderNestedFields(fieldData); // Recursively process nested fields
                    } else {
                        console.error(`Skipping invalid field: ${field}. Expected an array or object, received:`, fieldData);
                    }
                });
            }
            
            
            

            // Create dropdown (single-select)
            function createDropdown(name, options) {
                console.log(`Creating dropdown for: ${name}`, options); // Log options
                const container = document.createElement('div');
                const label = document.createElement('label');
                label.textContent = `${name.charAt(0).toUpperCase() + name.slice(1)}: `;
                const select = document.createElement('select');
                select.name = name;
            
                // Validate that options is an array
                if (Array.isArray(options)) {
                    options.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option;
                        opt.textContent = option;
                        select.appendChild(opt);
                    });
                } else {
                    console.error(`Options for ${name} must be an array. Received:`, options);
                    return document.createTextNode(`Error rendering ${name}: options must be an array.`);
                }
            
                container.appendChild(label);
                container.appendChild(select);
                return container;
            }
            

            // Create multi-select
            function createMultiSelect(name, options) {
                const container = document.createElement('div');
                const label = document.createElement('label');
                label.textContent = `${name.charAt(0).toUpperCase() + name.slice(1)}: `;
                const select = document.createElement('select');
                select.name = name;
                select.multiple = true;

                options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    select.appendChild(opt);
                });

                container.appendChild(label);
                container.appendChild(select);
                return container;
            }

            // Create section title
            function createSectionTitle(title, level = 3) {
                const section = document.createElement(`h${level}`);
                section.textContent = title.charAt(0).toUpperCase() + title.slice(1);
                return section;
            }
            
        })
        .catch(error => {
            console.error('Error fetching schema:', error);
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

        // Fetch data from the backend
        fetch('/query-clinical-trials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === "success") {
                    const results = data.results;

                    // Clear previous results
                    querySummaryContainer.innerHTML = "";
                    resultsContainer.innerHTML = "";

                     // Summarize query dimensions
                     const querySummary = `
                     <p><strong>Query Dimensions:</strong></p>
                     <ul>
                         <li><strong>Disease Type:</strong> ${formData.diseaseType || "Not specified"}</li>
                         <li><strong>Trial Phases:</strong> ${(formData.trialPhases && formData.trialPhases.length > 0) ? formData.trialPhases.join(", ") : "Not specified"}</li>
                         <li><strong>Primary Endpoints:</strong> ${(formData.primaryEndpoints && formData.primaryEndpoints.length > 0) ? formData.primaryEndpoints.join(", ") : "Not specified"}</li>
                         <li><strong>Other Criteria:</strong> ${formData.specialPopulationCriteria ? formData.specialPopulationCriteria.join(", ") : "Not specified"}</li>
                     </ul>
                 `;
                 querySummaryContainer.innerHTML = querySummary;

                    // Render results
                    if (results.length > 0) {
                        results.forEach(result => {
                            const resultDiv = document.createElement('div');
                            resultDiv.className = "result";

                            resultDiv.innerHTML = `
                                <h3>${result.title}</h3>
                                <p><strong>ID:</strong> ${result.id}</p>
                                <p><strong>Condition:</strong> ${result.condition}</p>
                                <p><strong>Summary:</strong> ${result.summary}</p>
                            `;

                            resultsContainer.appendChild(resultDiv);
                        });
                    } else {
                        resultsContainer.innerHTML = "<p>No clinical trials found.</p>";
                    }
                } else {
                    alert(`Error: ${data.message}`);
                }
            })
            .catch(error => {
                console.error("Fetch Error:", error.message);
                alert(`An error occurred: ${error.message}`);
            });
    });
});


