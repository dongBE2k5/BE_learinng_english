const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Gemini SDK using GOOGLE_API_KEY from .env
const googleApiKey = process.env.GOOGLE_API_KEY || '';
// Strip quotes from OpenRouter key if present
const openRouterApiKey = (process.env.OPENROUTER_API_KEY || '').replace(/^["']|["']$/g, '');
const genAI = new GoogleGenerativeAI(googleApiKey);

// Helper list of fallback models mapped to their official API names
const getFallbackModels = (usePro = false) => {
    // If Pro is requested, prioritize Pro models first, then fall back to standard ones
    if (usePro) {
        return [
            'gemini-2.5-pro',
            'gemini-3.1-pro',
            'gemini-1.5-pro',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash-lite',
            'gemma-4-e2b-it',
            'gemma-4-26b-a4b-it',
            'gemma-4-31b',
            'gemini-3.5-flash',
            'gemini-3.1-flash-lite',
            'gemini-1.5-flash',
            'deepseek/deepseek-v4-pro',
            'deepseek/deepseek-v4-flash'
        ];
    }

    // Default fallback order: Ưu tiên Gemma 4 E2B miễn phí và các model OpenRouter
    return [
        'google/gemma-4-e2b-it:free',
        'google/gemma-4-e2b-it',
        'gemma-4-e2b-it',
        'meta-llama/llama-3.3-70b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'qwen/qwen3-coder:free',
        'google/gemma-4-31b-it:free',
        'google/gemma-4-26b-a4b-it:free',
        'openai/gpt-oss-120b:free',
        'openai/gpt-oss-20b:free',
        'openrouter/free',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.5-pro',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash-lite',
        'gemma-4-26b-a4b-it',
        'gemma-4-31b',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro',
        'gemini-1.5-flash'
    ];
};

/**
 * OpenRouter Fetch Wrapper
 */
async function callOpenRouter(modelName, prompt, systemInstruction, jsonMode) {
    if (!openRouterApiKey) throw new Error("OPENROUTER_API_KEY is not set");
    
    // Prefix with google/ if not already
    let orModel = modelName;
    if (!orModel.includes('/')) {
        orModel = `google/${modelName}`;
    }

    const messages = [];
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const body = {
        model: orModel,
        messages: messages,
        max_tokens: 2048 // Avoid credit limit errors on low/zero balance accounts
    };
    
    // OpenRouter JSON mode support
    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    // Set a 45 second timeout for OpenRouter requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return {
                text: data.choices[0].message.content,
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };
        }
        throw new Error("Invalid response format from OpenRouter");
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Generates text content with automatic fallback model selection.
 * Will try Google API first. If rate limited, falls back to OpenRouter.
 */
async function generateContent(prompt, systemInstruction = '', jsonMode = false, usePro = false, preferredModel = null) {
    let models = getFallbackModels(usePro);
    if (preferredModel && typeof preferredModel === 'string' && preferredModel.trim() !== '' && preferredModel !== 'auto') {
        models = [preferredModel.trim(), ...models.filter(m => m !== preferredModel.trim())];
    }
    let lastError = null;
    const errors = []; // Track all errors

    for (const modelName of models) {
        let resultObj = null;

        // Try Google API first, ONLY if it's not explicitly an OpenRouter model string
        if (!modelName.includes('/') && !modelName.includes(':free')) {
            try {
                console.log(`[Google API] Requesting model: ${modelName} (usePro: ${usePro})`);
                
                const modelConfig = { model: modelName };
                if (systemInstruction) {
                    modelConfig.systemInstruction = systemInstruction;
                }
                
                const config = {};
                if (jsonMode) {
                    config.responseMimeType = "application/json";
                }
                modelConfig.generationConfig = config;

                const model = genAI.getGenerativeModel(modelConfig);
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    console.log(`[Google API] Success using model: ${modelName}`);
                    return {
                        text,
                        metadata: {
                            modelUsed: modelName,
                            usage: {
                                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                                totalTokens: response.usageMetadata?.totalTokenCount || 0
                            },
                            errors
                        }
                    };
                }
            } catch (err) {
                console.warn(`[Google API] Model ${modelName} failed: ${err.message || err}`);
                lastError = err;
                errors.push({ model: modelName, error: err.message || String(err) });
            }
        }

        // If Google API failed (or was skipped), try OpenRouter only if it is an OpenRouter-targeted model
        if (!resultObj && openRouterApiKey && (modelName.includes('/') || modelName.includes(':free'))) {
            let orModelName = modelName;
            if (!orModelName.includes('/')) orModelName = `google/${orModelName}`;
            try {
                console.log(`[OpenRouter API] Requesting model: ${orModelName}`);
                const orResult = await callOpenRouter(orModelName, prompt, systemInstruction, jsonMode);
                if (orResult && orResult.text) {
                    console.log(`[OpenRouter API] Success using model: ${orModelName}`);
                    return {
                        text: orResult.text,
                        metadata: {
                            modelUsed: orModelName,
                            usage: orResult.usage,
                            errors
                        }
                    };
                }
            } catch (orErr) {
                console.warn(`[OpenRouter API] Model ${orModelName} failed: ${orErr.message || orErr}`);
                lastError = orErr;
                errors.push({ model: orModelName, error: orErr.message || String(orErr) });
            }
        }
    }

    throw new Error(`[API] All model requests failed. Last error: ${lastError ? lastError.message : 'Unknown'}. Tracked errors: ${JSON.stringify(errors)}`);
}

/**
 * Processes audio input with automatic fallback model selection (Google only).
 */
async function processAudio(base64Audio, mimeType, prompt, jsonMode = false) {
    const rawModels = getFallbackModels(false);
    // Filter for native Gemini models first to ensure fast multimodal vision/audio performance
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', ...rawModels.filter(m => !m.includes('gemini-2.5-flash') && !m.includes('gemini-2.0-flash') && !m.includes('gemini-2.5-pro'))];
    let lastError = null;
    const errors = [];

    for (const modelName of models) {
        try {
            console.log(`[Google API] Requesting processAudio with model: ${modelName}`);

            const modelConfig = { model: modelName };
            const config = {};
            if (jsonMode) {
                config.responseMimeType = "application/json";
            }
            modelConfig.generationConfig = config;

            const model = genAI.getGenerativeModel(modelConfig);
            const result = await model.generateContent([
                {
                    inlineData: {
                        data: base64Audio,
                        mimeType: mimeType
                    }
                },
                prompt
            ]);
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`[Google API] Audio process success using model: ${modelName}`);
                return {
                    text,
                    metadata: {
                        modelUsed: modelName,
                        usage: {
                            promptTokens: response.usageMetadata?.promptTokenCount || 0,
                            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                            totalTokens: response.usageMetadata?.totalTokenCount || 0
                        },
                        errors
                    }
                };
            }
        } catch (err) {
            console.warn(`[Google API] Audio process failed on model ${modelName}. Error: ${err.message || err}`);
            lastError = err;
            errors.push({ model: modelName, error: err.message || String(err) });
        }
    }

    throw new Error(`[Google API] All model requests for audio processing failed. Last error: ${lastError ? lastError.message : 'Unknown'}. Tracked errors: ${JSON.stringify(errors)}`);
}

module.exports = {
    generateContent,
    processAudio
};
