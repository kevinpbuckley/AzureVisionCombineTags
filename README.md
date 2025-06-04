Azure Function named GetDefaultAndCustomImageTags that processes HTTP GET and POST requests to analyze an image using both the Azure Computer Vision API and a Custom Vision Prediction Service.

Key points:

Configuration:
API endpoints and keys are loaded from environment variables for both the default Computer Vision API and the Custom Vision Prediction Service.

getDefaultTags:
Calls the Computer Vision API with the provided image URL, filters tags by a minimum confidence threshold, and returns them in a standardized format.

getCustomTags:
Calls the Custom Vision Prediction Service with the image URL, filters predictions by a minimum probability, and returns them in a standardized format.

HTTP Handler:

Accepts an imageUrl parameter from the query string or POST body.
Calls both tag functions in parallel.
Sorts each result array by confidence/probability (descending).
Combines the arrays (currently, custom tags are listed before default tags—this may be a logic error if you want default tags first).
Returns the combined results as JSON.
Security:
The function requires a function key (authLevel: 'function'), so an API key is needed to call it.
