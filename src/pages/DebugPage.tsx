import React, { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, any>>({});
  const [apiTestResult, setApiTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    // Get all environment variables that start with VITE_
    const viteEnvVars = Object.entries(import.meta.env)
      .filter(([key]) => key.startsWith('VITE_'))
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: key.includes('KEY') ? '********' : value
      }), {});
    
    setEnvVars(viteEnvVars);
  }, []);

  const testYoutubeApi = async () => {
    setIsTesting(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&type=video&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      setApiTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Current Environment Variables</h2>
        <pre className="bg-white p-4 rounded overflow-auto">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="mb-1">
              <span className="font-mono text-blue-600">{key}</span>:{' '}
              <span className="font-mono">"{String(value)}"</span>
            </div>
          ))}
        </pre>
      </div>

      <div className="p-4 bg-blue-50 rounded-md">
        <h2 className="text-xl font-semibold mb-2">YouTube API Test</h2>
        <button
          onClick={testYoutubeApi}
          disabled={isTesting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 mb-4"
        >
          {isTesting ? 'Testing...' : 'Test YouTube API'}
        </button>
        
        {apiTestResult && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">API Response:</h3>
            <pre className="bg-white p-4 rounded overflow-auto max-h-64">
              {apiTestResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
