// src/components/tools/GitHubAnalyzer.tsx - Add this section
const GitHubTokenInput = ({ onTokenChange }: { onTokenChange: (token: string) => void }) => {
  const [token, setToken] = useState('')
  const [isValid, setIsValid] = useState < boolean | null > (null)
  const [testing, setTesting] = useState(false)
  
  const testToken = async () => {
    if (!token) return
    
    setTesting(true)
    try {
      const github = new GitHubService(token)
      const result = await github.testConnection()
      
      if (result.success) {
        setIsValid(true)
        onTokenChange(token)
        toast.success(`Connected as ${result.user}`)
      } else {
        setIsValid(false)
        toast.error('Invalid token')
      }
    } catch (error) {
      setIsValid(false)
      toast.error('Token validation failed')
    } finally {
      setTesting(false)
    }
  }
  
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900">Private Repository Access</h4>
      <div className="flex space-x-2">
        <Input
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={testToken}
          loading={testing}
          disabled={!token}
          variant="outline"
          size="sm"
        >
          Test
        </Button>
      </div>
      
      {isValid === true && (
        <p className="text-sm text-green-600">✅ Token valid - Private repos accessible</p>
      )}
      {isValid === false && (
        <p className="text-sm text-red-600">❌ Invalid token or insufficient permissions</p>
      )}
      
      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer">How to create a GitHub token</summary>
        <ol className="list-decimal ml-4 mt-2 space-y-1">
          <li>Go to GitHub Settings → Developer settings</li>
          <li>Click Personal access tokens → Tokens (classic)</li>
          <li>Generate new token with 'repo' scope</li>
          <li>Copy and paste the token above</li>
        </ol>
      </details>
    </div>
  )
}