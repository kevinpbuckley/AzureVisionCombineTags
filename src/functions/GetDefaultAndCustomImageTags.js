const { app } = require('@azure/functions');

// Default Computer Vision API config
const CV_ENDPOINT = process.env.CV_ENDPOINT;
const CV_KEY = process.env.CV_KEY;
const CV_MIN_PROBABILITY = parseFloat(process.env.CV_MIN_PROBABILITY) || 0.65;

// Custom Vision Prediction Service config
const CP_PREDICTION_KEY = process.env.CP_PREDICTION_KEY;
const CP_ENDPOINT = process.env.CP_ENDPOINT;
const CP_MIN_PROBABILITY = parseFloat(process.env.CP_MIN_PROBABILITY) || 0.65;

async function getDefaultTags(imageUrl, context) {
    try {
        context.log(`Calling Computer Vision API for image: ${imageUrl}`);
        const response = await fetch(
            `${CV_ENDPOINT}/vision/v2.0/analyze?visualFeatures=Tags&language=en`,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': CV_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: imageUrl })
            }
        );
        if (!response.ok) {
            context.log(`Computer Vision API error: HTTP ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        context.log(`Computer Vision API response: ${JSON.stringify(data)}`);
        return (data.tags || [])
            .filter(tag => tag.confidence >= CV_MIN_PROBABILITY)
            .map(tag => ({
                probability: tag.confidence,
                tagName: tag.name,
                source: "default"
            }));
    } catch (err) {
        context.log(`Default Vision API error: ${err.message}`);
        return [];
    }
}

// Uses Custom Vision Prediction Service
async function getCustomTags(imageUrl, context) {
    try {
        context.log(`Calling Custom Vision Prediction Service for image: ${imageUrl}`);
        const response = await fetch(CP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Prediction-Key': CP_PREDICTION_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Url: imageUrl })
        });
        if (!response.ok) {
            context.log(`Custom Vision API error: HTTP ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        context.log(`Custom Vision API response: ${JSON.stringify(data)}`);
        return (data.predictions || [])
            .filter(pred => pred.probability >= CP_MIN_PROBABILITY)
            .map(pred => ({
                probability: pred.probability,
                tagName: pred.tagName,
                source: "custom"
            }));
    } catch (err) {
        context.log(`Custom Vision API error: ${err.message}`);
        return [];
    }
}

app.http('GetDefaultAndCustomImageTags', {
    methods: ['GET', 'POST'],
    authLevel: 'function', // Require function key
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // Accept ImageUrl from query or JSON body
        let imageUrl = request.query.get('imageUrl');
        if (!imageUrl && request.method === 'POST') {
            try {
                const body = await request.json();
                imageUrl = body.imageUrl;
            } catch {
                context.log('Failed to parse JSON body.');
            }
        }

        if (!imageUrl) {
            context.log('Missing required parameter: imageUrl');
            return { status: 400, body: "Missing required parameter: imageUrl" };
        }

        context.log(`Processing image URL: ${imageUrl}`);
        const [defaultTags, customTags] = await Promise.all([
            getDefaultTags(imageUrl, context),
            getCustomTags(imageUrl, context)
        ]);

        // Sort each array by probability descending
        const sortedDefaultTags = defaultTags.sort((a, b) => b.probability - a.probability);
        const sortedCustomTags = customTags.sort((a, b) => b.probability - a.probability);

        // Combine arrays: default (prediction API) first, then custom vision
        const predictions = [...sortedCustomTags, ...sortedDefaultTags, ];

        context.log(`Returning predictions: ${JSON.stringify(predictions)}`);
        return {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ predictions })
        };
    }
});
