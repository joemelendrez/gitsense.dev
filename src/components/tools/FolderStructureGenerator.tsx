import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { 
  FolderTree, 
  Download, 
  Upload, 
  FileText, 
  Folder, 
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle,
  Zap,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

const FolderStructureGenerator = () => {
  const [structure, setStructure] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedStructure, setParsedStructure] = useState(null);
  const [stats, setStats] = useState({ files: 0, folders: 0 });
  const [projectName, setProjectName] = useState('my-project');
  const fileInputRef = useRef(null);

  // Parse the folder structure text
  const parseStructure = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const structure = [];
    const stack = [{ children: structure, level: -1 }];
    
    let totalFiles = 0;
    let totalFolders = 0;

    lines.forEach(line => {
      // Skip empty lines and lines that are just tree characters
      if (!line.trim() || line.match(/^[│├└─\s]*$/)) return;

      // Calculate indentation level
      const match = line.match(/^([│├└─\s]*)/);
      const indent = match ? match[1].replace(/[│├└─]/g, '  ').length / 2 : 0;
      
      // Extract the actual name (remove tree characters, comments, and GitHub emojis)
      const name = line
        .replace(/^[│├└─\s]*/, '')   // Remove tree characters
        .replace(/\s*#.*$/, '')       // Remove comments
        .replace(/📁|📄|🗂️|📋|📊|⚙️|🏗️|📦|💡|🎯|🔧|🎨|🚀|📈|📉|🔥|💰|🎪|🏆|✨|🎯|📝|🔍|⭐|🌟|💫|⚡|🎊|🎉|🎈/g, '') // Remove GitHub/folder emojis
        .trim();
      
      if (!name) return;

      // Pop stack until we find the right parent level
      while (stack.length > 1 && stack[stack.length - 1].level >= indent) {
        stack.pop();
      }

      const isFolder = name.endsWith('/') || !name.includes('.');
      const cleanName = name.replace(/\/$/, '');
      
      const item = {
        name: cleanName,
        isFolder,
        level: indent,
        children: isFolder ? [] : undefined
      };

      if (isFolder) {
        totalFolders++;
        stack[stack.length - 1].children.push(item);
        stack.push({ children: item.children, level: indent });
      } else {
        totalFiles++;
        stack[stack.length - 1].children.push(item);
      }
    });

    setStats({ files: totalFiles, folders: totalFolders });
    return structure;
  };

  // Generate appropriate content for different file types
  const generateFileContent = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const basename = filename.replace(/\.[^/.]+$/, '');
    
    const templates = {
      'tsx': `// ${filename}\nimport React from 'react';\n\nconst ${basename.replace(/[-_]/g, '')} = () => {\n  return (\n    <div>\n      {/* ${basename} component */}\n    </div>\n  );\n};\n\nexport default ${basename.replace(/[-_]/g, '')};`,
      'ts': `// ${filename}\n\n// TODO: Implement ${basename} functionality\nexport {};\n`,
      'js': `// ${filename}\n\n// TODO: Implement ${basename} functionality\n`,
      'jsx': `// ${filename}\nimport React from 'react';\n\nconst ${basename.replace(/[-_]/g, '')} = () => {\n  return (\n    <div>\n      {/* ${basename} component */}\n    </div>\n  );\n};\n\nexport default ${basename.replace(/[-_]/g, '')};`,
      'css': `/* ${filename} */\n\n/* TODO: Add styles for ${basename} */\n`,
      'scss': `// ${filename}\n\n// TODO: Add styles for ${basename}\n`,
      'json': `{\n  "name": "${basename}",\n  "description": "Generated by GitSense Folder Structure Generator"\n}`,
      'md': `# ${basename}\n\n> Generated by GitSense Folder Structure Generator\n\nTODO: Add content for ${basename}\n`,
      'html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${basename}</title>\n</head>\n<body>\n  <h1>${basename}</h1>\n  <!-- TODO: Add content -->\n</body>\n</html>`,
      'env': `# ${filename}\n# Environment variables\n\n# TODO: Add your environment variables here\n`,
      'gitignore': `# Dependencies\nnode_modules/\n\n# Build outputs\n.next/\nbuild/\ndist/\n\n# Environment files\n.env.local\n.env.*.local\n\n# Logs\n*.log\n\n# OS generated files\n.DS_Store\nThumbs.db\n`,
      'toml': `# ${filename}\n# Configuration file\n\n# TODO: Add configuration settings\n`,
      'xml': `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${filename} -->\n<root>\n  <!-- TODO: Add XML content -->\n</root>`,
      'yml': `# ${filename}\n# YAML configuration\n\n# TODO: Add configuration\nname: "${basename}"\n`,
      'yaml': `# ${filename}\n# YAML configuration\n\n# TODO: Add configuration\nname: "${basename}"\n`
    };

    return templates[ext] || `// ${filename}\n\n// TODO: Implement ${basename}\n// Generated by GitSense Folder Structure Generator\n`;
  };

  // Generate zip file content using JSZip
  const generateZipFile = async (structure) => {
    const zip = new JSZip();
    
    const traverse = (items, currentPath = '') => {
      items.forEach(item => {
        const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        
        if (item.isFolder) {
          // Add folder with .gitkeep to ensure it's created
          if (!item.children || item.children.length === 0) {
            zip.file(`${fullPath}/.gitkeep`, '# This file ensures the empty directory is created\n');
          }
          
          if (item.children && item.children.length > 0) {
            traverse(item.children, fullPath);
          }
        } else {
          // Add file with appropriate content
          const content = generateFileContent(item.name);
          zip.file(fullPath, content);
        }
      });
    };

    traverse(structure);
    return zip;
  };

  // Download structure as ZIP file
  const downloadStructure = async () => {
    if (!parsedStructure) {
      toast.error('Please generate structure first');
      return;
    }

    setLoading(true);
    
    try {
      const zip = await generateZipFile(parsedStructure);
      
      // Generate ZIP blob
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-zA-Z0-9-_]/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`📦 ${projectName} structure downloaded as ZIP file!`);
      
    } catch (error) {
      console.error('Error generating structure:', error);
      toast.error('Error generating structure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeStructure = () => {
    if (!structure.trim()) {
      alert('Please enter a folder structure first');
      return;
    }

    try {
      const parsed = parseStructure(structure);
      setParsedStructure(parsed);
    } catch (error) {
      console.error('Error parsing structure:', error);
      alert('Error parsing structure. Please check the format.');
    }
  };

  const loadSampleStructure = () => {
    const sample = `my-nextjs-app/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .gitignore
├── .env.example
│
├── public/
│   ├── favicon.ico
│   ├── images/
│   │   ├── logo.svg
│   │   └── hero-bg.jpg
│   └── icons/
│       └── arrow.svg
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── loading.tsx
│   │
│   ├── about/
│   │   └── page.tsx
│   │
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       └── page.tsx
│   │
│   └── api/
│       └── contact/
│           └── route.ts
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   │
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
│
├── lib/
│   ├── utils.ts
│   └── api.ts
│
└── types/
    └── global.ts`;

    setStructure(sample);
  };

  const clearStructure = () => {
    setStructure('');
    setParsedStructure(null);
    setStats({ files: 0, folders: 0 });
  };

  const copyStructure = async () => {
    try {
      await navigator.clipboard.writeText(structure);
      alert('Structure copied to clipboard!');
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  const renderStructurePreview = (items, depth = 0) => {
    return items.map((item, index) => (
      <div key={index} className={`flex items-center py-1 ${depth > 0 ? 'ml-6' : ''}`}>
        <div className="flex items-center text-sm">
          {item.isFolder ? (
            <Folder className="w-4 h-4 text-blue-500 mr-2" />
          ) : (
            <FileText className="w-4 h-4 text-gray-500 mr-2" />
          )}
          <span className={item.isFolder ? 'font-medium text-blue-700' : 'text-gray-700'}>
            {item.name}
          </span>
          {item.isFolder && (
            <span className="text-xs text-gray-400 ml-2">
              ({item.children?.length || 0} items)
            </span>
          )}
        </div>
        {item.children && item.children.length > 0 && (
          <div className="ml-4 mt-1">
            {renderStructurePreview(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <FolderTree className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Folder Structure Generator
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}for Developers
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Convert text-based folder structures into downloadable project scaffolds. 
            Perfect for setting up new projects with proper file organization.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Folder Structure Input
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={loadSampleStructure}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Zap className="w-4 h-4 mr-1 inline" />
                    Sample
                  </button>
                  <button
                    onClick={copyStructure}
                    disabled={!structure.trim()}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4 mr-1 inline" />
                    Copy
                  </button>
                  <button
                    onClick={clearStructure}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1 inline" />
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                value={structure}
                onChange={(e) => setStructure(e.target.value)}
                placeholder={`Paste your folder structure here, like:

my-project/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   └── index.tsx
│   └── styles/
│       └── globals.css
├── package.json
└── README.md

Supports tree characters (├──, │, └──) or simple indentation.`}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm 
                         resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         bg-gray-50"
              />

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Supports tree symbols, indentation, and comments (#)
                </div>
                <button
                  onClick={analyzeStructure}
                  disabled={!structure.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Package className="w-4 h-4 mr-2 inline" />
                  Analyze Structure
                </button>
              </div>
            </div>

            {/* Stats */}
            {stats.files > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Structure Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-500 mr-2" />
                    <span>{stats.files} files</span>
                  </div>
                  <div className="flex items-center">
                    <Folder className="w-4 h-4 text-blue-500 mr-2" />
                    <span>{stats.folders} folders</span>
                  </div>
                </div>

                {/* Project Name Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name (for filename)
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Download will be named: <span className="font-mono bg-gray-100 px-1 rounded">{projectName.replace(/[^a-zA-Z0-9-_]/g, '-')}.zip</span>
                  </p>
                </div>
                
                <button
                  onClick={downloadStructure}
                  disabled={!parsedStructure || loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 
                           text-white rounded-lg hover:from-green-600 hover:to-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all
                           font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download Project Structure
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FolderTree className="w-5 h-5 mr-2 text-purple-600" />
                Structure Preview
              </h3>
              
              {parsedStructure && parsedStructure.length > 0 ? (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {renderStructurePreview(parsedStructure)}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Enter a folder structure and click "Analyze Structure" to see the preview</p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">🚀 Features</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                  <span>Generates empty files with appropriate templates</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                  <span>Supports React/Next.js, TypeScript, and common file types</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                  <span>Creates .gitkeep files for empty directories</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                  <span>Handles tree symbols and indentation</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                  <span>Downloadable as organized project structure</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Pro Tips
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Use tree characters (├──, │, └──) or simple indentation</p>
                <p>• Add comments with # for documentation</p>
                <p>• Files are auto-detected by extension (.tsx, .ts, .css, etc.)</p>
                <p>• Folders end with / or have no extension</p>
                <p>• Perfect for scaffolding new React/Next.js projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderStructureGenerator;