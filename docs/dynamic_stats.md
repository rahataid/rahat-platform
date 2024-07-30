# Documentation: Dynamic Chart Data Integration
### Front-End (FE) Implementation:
Purpose: Send a GET request with the project UUID to retrieve resource data for generating charts on a specific page.
#### Process:
Send GET Request:
Include the project UUID in the request URL.S
Receive Response:
The response will contain the necessary resources for chart generation.

### Back-End (BE) Implementation:
Purpose: Handle incoming GET requests that include a project UUID and return a response with the required resources for chart visualization.
#### Process:
Receive GET Request:
Extract the project UUID from the request.
Return Response:
The response should include resources structured as follows:

Resource Structure for Charts:
#### 1. Data Sources:
Definition: An object containing information about multiple data sources.
Example:

"dataSources": {
    "source2": {
        "type": "url",
        "args": {
            "url": "http://localhost:5500/v1/projects/${project_uuid}/stats"
        },
        "data": []
    }
}


Note: Multiple sources can be defined, which can be utilized by UI components.

#### 2. UI Elements:
Definition: An array of UI elements, where each element represents a row.
Structure:
Each row can contain multiple columns, represented by a nested array.
Each nested element represents a single UI component to be displayed.
Example:

"ui": [
    [
        {
            "title": "Gender",
            "type": "pie",
            "props": {},
            "dataSrc": "source2",
            "dataMap": "BENEFICIARY_GENDER_ID_${uuid}",
            "colSpan": 1,
            "rowSpan": 2
        }
    ],
    [
        {
            "title": "Beneficiary Internet Status",
            "type": "bar",
            "props": {},
            "dataSrc": "source2",
            "dataMap": "BENEFICIARY_INTERNETSTATUS_ID_${uuid}",
            "colSpan": 1,
            "rowSpan": 1
        }
    ]
]


### UI Element Structure:
title: The title of the chart (e.g., "Gender").
type: The type of chart (e.g., "pie", "bar").
props: Additional properties for the chart.
dataSrc: The data source identifier (e.g., "source2").
dataMap: The mapping key for the data (e.g., BENEFICIARY_GENDER_ID_${uuid}).
colSpan: The column span for the chart.
rowSpan: The row span for the chart.
Front-End (FE) Mapping:

#### Process:
Map through UI Array:
Iterate over the ui array from the data source.
Generate Rows:
For each array element, generate a row containing the specified charts.
Fetch Data:
Retrieve data for each chart from the specified data sources.
Example:
With the provided data source, the UI will generate two rows:
The first row will contain a pie chart for "Gender" data.
The second row will contain a bar chart for "Beneficiary Internet Status" data.
Data for these charts will be fetched from source2, which includes the URL to fetch data.

### Dynamic Charts:
Purpose: Provide UUIDs in the request to fetch data for specific projects. If no UUID is provided, data for the entire platform will be retrieved, suitable for use in the main dashboard.


