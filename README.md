# Azure Function: GetDefaultAndCustomImageTags

This Azure Function processes HTTP GET and POST requests to analyze an image using both the Azure Computer Vision API and a Custom Vision Prediction Service. It returns tags detected by both services, sorted by confidence.

---

## How It Works

1. **Configuration:**  
   The function uses environment variables (Application Settings in Azure) to configure API endpoints, keys, and minimum probability thresholds for both the Computer Vision and Custom Vision services.

2. **Request Handling:**  
   - Accepts an `imageUrl` parameter from the query string or POST body.
   - Calls both the Computer Vision API and the Custom Vision Prediction Service in parallel.
   - Filters and sorts tags from each service by confidence/probability (descending).
   - Combines the results, with default (Computer Vision) tags first, followed by custom (Custom Vision) tags.
   - Returns the combined results as JSON.

3. **Security:**  
   The function requires a function key (`authLevel: 'function'`). You must provide the key as a query parameter (`?code=...`) or in the `x-functions-key` header.

---

## Environment Variables

Set these as Application Settings in Azure, or in your `local.settings.json` for local development:

| Variable                | Description                                                                                                    | Example Value                                                                                      |
|-------------------------|----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `CV_ENDPOINT`           | Base URL for the Azure Computer Vision API.                                                                    | `https://<your-region>.api.cognitive.microsoft.com`                                                |
| `CV_KEY`                | Subscription key for your Azure Computer Vision resource.                                                      | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`                                                                 |
| `CV_MIN_PROBABILITY`    | Minimum confidence threshold for tags returned by Computer Vision API.                                         | `0.65`                                                                                             |
| `CP_ENDPOINT`           | Endpoint URL for your Custom Vision Prediction API (specific to your project and iteration).                   | `https://<your-resource>.cognitiveservices.azure.com/customvision/v3.0/Prediction/<project-id>/detect/iterations/<iteration-name>/image/url` |
| `CP_PREDICTION_KEY`     | Prediction key for your Azure Custom Vision resource.                                                          | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`                                                                 |
| `CP_MIN_PROBABILITY`    | Minimum probability threshold for custom predictions.                                                          | `0.65`                                                                                             |

---

## Example Request

**POST:**


 /api/GetDefaultAndCustomImageTags?imageUrl=https://example.com/image.jpg&code=<your-function-key>

**POST:**
```json
POST /api/GetDefaultAndCustomImageTags?code=<your-function-key>
{
  "imageUrl": "https://example.com/image.jpg"
}