import { Handler } from '@netlify/functions'
import { Octokit } from '@octokit/rest'

const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const { owner, repo, path = '', token } = event.queryStringParameters || {}

  if (!owner || !repo) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing owner or repo parameter' })
    }
  }

  try {
    const octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    })

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(data)
    }
  } catch (error: any) {
    return {
      statusCode: error.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: error.message || 'Failed to fetch repository content' 
      })
    }
  }
}

export { handler }