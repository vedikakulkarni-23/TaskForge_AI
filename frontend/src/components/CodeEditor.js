import React, { useState, useEffect } from 'react';

const CodeEditor = () => {
  const [code, setCode] = useState(`# Python Example
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))
print("Welcome to Python in the browser!")`);
  
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [theme, setTheme] = useState('dark');
  const [skulptLoaded, setSkullptLoaded] = useState(false);

  const languages = [
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'html', label: 'HTML', icon: '🌐' },
    { value: 'css', label: 'CSS', icon: '🎨' }
  ];

  const codeTemplates = {
    python: `# Python Example
def calculate_sum(a, b):
    return a + b

result = calculate_sum(5, 10)
print(f'Sum: {result}')`,
    
    javascript: `// JavaScript Example
function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 10);
console.log('Sum:', result);`,
    
    html: `<!-- HTML Example -->
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello World!</h1>
    <p>Welcome to TASKFORGE</p>
</body>
</html>`,
    
    css: `/* CSS Example */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 10px;
}`
  };

  // Load Skulpt for Python execution
  useEffect(() => {
    if (!window.Sk) {
      const script = document.createElement('script');
      script.src = 'https://skulpt.org/js/skulpt.min.js';
      script.async = true;
      script.onload = () => {
        const builtinsScript = document.createElement('script');
        builtinsScript.src = 'https://skulpt.org/js/skulpt-stdlib.js';
        builtinsScript.async = true;
        builtinsScript.onload = () => setSkullptLoaded(true);
        document.body.appendChild(builtinsScript);
      };
      document.body.appendChild(script);
    } else {
      setSkullptLoaded(true);
    }
  }, []);

  const runCode = () => {
    setOutput('');
    
    if (language === 'python') {
      runPython();
    } else if (language === 'javascript') {
      runJavaScript();
    } else {
      setOutput(`Preview is available for HTML/CSS. Copy the code to use it in your project.`);
    }
  };

  const runPython = () => {
    if (!skulptLoaded || !window.Sk) {
      setOutput('Python environment is loading... Please try again in a moment.');
      return;
    }

    try {
      window.Sk.configure({
        output: (text) => {
          setOutput(prev => prev + text);
        },
        read: (filename) => {
          if (window.Sk.builtinFiles === undefined || window.Sk.builtinFiles["files"][filename] === undefined) {
            throw "File not found: '" + filename + "'";
          }
          return window.Sk.builtinFiles["files"][filename];
        }
      });

      const promise = window.Sk.misceval.asyncToPromise(() => {
        return window.Sk.importMainWithBody("<stdin>", false, code, true);
      });

      promise.then(
        () => {
          if (!output) {
            setOutput('Code executed successfully (no output)');
          }
        },
        (error) => {
          setOutput(`Error: ${error.toString()}`);
        }
      );
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const runJavaScript = () => {
    try {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
      };

      eval(code);

      console.log = originalLog;

      setOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no output)');
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setCode(codeTemplates[lang]);
    setOutput('');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const downloadCode = () => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      html: 'html',
      css: 'css'
    };
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `code.${extensions[language]}`;
    link.href = url;
    link.click();
  };

  const clearCode = () => {
    setCode('');
    setOutput('');
  };

  const formatCode = () => {
    const lines = code.split('\n');
    let formatted = '';
    let indent = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('}') || trimmed.includes(']') || trimmed.includes(')')) {
        indent = Math.max(0, indent - 1);
      }
      formatted += '  '.repeat(indent) + trimmed + '\n';
      if (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('(')) {
        indent++;
      }
    });
    
    setCode(formatted);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Code Editor</h2>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Language Selector */}
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => changeLanguage(lang.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  language === lang.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang.icon} {lang.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={runCode}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
            >
              ▶ Run
            </button>
            <button
              onClick={formatCode}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
            >
              Format
            </button>
            <button
              onClick={copyCode}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
            >
              Copy
            </button>
            <button
              onClick={downloadCode}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
            >
              Download
            </button>
            <button
              onClick={clearCode}
              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
        {/* Editor Panel */}
        <div>
          <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-t-md flex justify-between items-center">
            <span className="font-semibold text-sm">Editor</span>
            <span className="text-xs">Lines: {code.split('\n').length}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`w-full h-96 p-4 font-mono text-sm border-2 rounded-b-md focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              theme === 'dark'
                ? 'bg-gray-900 text-green-400 border-gray-700'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
            spellCheck="false"
            style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
          />
        </div>

        {/* Output Panel */}
        <div>
          <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-t-md flex justify-between items-center">
            <span className="font-semibold text-sm">Output</span>
            {output && (
              <button
                onClick={() => setOutput('')}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>
          <div
            className={`w-full h-96 p-4 font-mono text-sm border-2 rounded-b-md overflow-auto ${
              theme === 'dark'
                ? 'bg-gray-900 text-gray-300 border-gray-700'
                : 'bg-gray-50 text-gray-900 border-gray-200'
            }`}
          >
            {output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="text-gray-500 italic">
                Click "Run" to execute your code. Output will appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-900 font-medium mb-2">
            Supported Languages
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Python</strong> - Full execution with Skulpt (most Python stdlib)</p>
            <p>• <strong>JavaScript</strong> - Native browser execution</p>
            <p>• <strong>HTML/CSS</strong> - Code editing and templates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;