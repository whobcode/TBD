import { Hono } from "hono";
import { html } from "hono/html";
import type { Bindings, Variables } from "../types";

export const dashboardRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const dashboardHTML = html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twitter Bot Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>
    [x-cloak] { display: none !important; }
  </style>
</head>
<body class="bg-gray-900 text-white min-h-screen" x-data="dashboard()" x-init="init()">
  <!-- Navigation -->
  <nav class="bg-gray-800 border-b border-gray-700">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold text-blue-400">Twitter Bot Dashboard</h1>
          <span class="text-xs text-gray-500">Powered by Cloudflare</span>
        </div>
        <div class="flex gap-2">
          <button @click="tab = 'research'" :class="tab === 'research' ? 'bg-purple-600' : 'bg-gray-700'" class="px-4 py-2 rounded-lg text-sm hover:bg-purple-500 transition">Research</button>
          <button @click="tab = 'accounts'" :class="tab === 'accounts' ? 'bg-blue-600' : 'bg-gray-700'" class="px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition">Accounts</button>
          <button @click="tab = 'scheduler'" :class="tab === 'scheduler' ? 'bg-blue-600' : 'bg-gray-700'" class="px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition">Scheduler</button>
          <button @click="tab = 'ai'" :class="tab === 'ai' ? 'bg-blue-600' : 'bg-gray-700'" class="px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition">AI Tools</button>
          <button @click="tab = 'analytics'" :class="tab === 'analytics' ? 'bg-blue-600' : 'bg-gray-700'" class="px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition">Analytics</button>
        </div>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 py-8">
    <!-- Research Tab -->
    <div x-show="tab === 'research'" x-cloak>
      <!-- Summary View -->
      <div x-show="!selectedResearchAccount">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Account Research</h2>
          <button @click="showLookup = true" class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 transition">+ Lookup Account</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <template x-for="acc in researchAccounts" :key="acc.id">
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition cursor-pointer" @click="viewResearchAccount(acc.id)">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-2xl font-bold" x-text="acc.username[0]?.toUpperCase()"></span>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-lg" x-text="'@' + acc.username"></h3>
                  <p class="text-gray-400 text-sm" x-text="acc.displayName || ''"></p>
                </div>
                <template x-if="acc.verified">
                  <span class="text-blue-400">&#10003;</span>
                </template>
              </div>

              <div class="grid grid-cols-3 gap-2 mb-4 text-center">
                <div class="bg-gray-700/50 rounded-lg p-2">
                  <p class="text-lg font-bold" x-text="formatNumber(acc.followersCount || 0)"></p>
                  <p class="text-xs text-gray-400">Followers</p>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-2">
                  <p class="text-lg font-bold" x-text="formatNumber(acc.followingCount || 0)"></p>
                  <p class="text-xs text-gray-400">Following</p>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-2">
                  <p class="text-lg font-bold" x-text="formatNumber(acc.tweetCount || 0)"></p>
                  <p class="text-xs text-gray-400">Tweets</p>
                </div>
              </div>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Avg Likes</span>
                  <span class="text-red-400" x-text="(acc.avgLikes || 0).toFixed(1)"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Avg Retweets</span>
                  <span class="text-green-400" x-text="(acc.avgRetweets || 0).toFixed(1)"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Sentiment</span>
                  <span :class="(acc.avgSentiment || 0) > 0.2 ? 'text-green-400' : (acc.avgSentiment || 0) < -0.2 ? 'text-red-400' : 'text-gray-400'" x-text="getSentimentLabel(acc.avgSentiment)"></span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Posts/Day</span>
                  <span class="text-blue-400" x-text="(acc.postingFrequency || 0).toFixed(1)"></span>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                <span class="text-xs text-gray-500" x-text="acc.lastAnalyzed ? 'Updated ' + timeAgo(acc.lastAnalyzed) : 'Not analyzed yet'"></span>
                <span class="text-purple-400 text-sm">View Details &rarr;</span>
              </div>
            </div>
          </template>
        </div>

        <div x-show="researchAccounts.length === 0" class="text-center text-gray-500 py-12">
          <p class="text-lg mb-2">No accounts being tracked yet</p>
          <p class="text-sm">Click "Lookup Account" to start researching Twitter accounts</p>
        </div>
      </div>

      <!-- Detailed View -->
      <div x-show="selectedResearchAccount">
        <button @click="selectedResearchAccount = null; researchDetail = null" class="mb-6 text-gray-400 hover:text-white flex items-center gap-2">
          &larr; Back to all accounts
        </button>

        <div x-show="loadingDetail" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p class="mt-4 text-gray-400">Loading account details...</p>
        </div>

        <div x-show="researchDetail && !loadingDetail">
          <!-- Account Header -->
          <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-4">
                <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-3xl font-bold" x-text="researchDetail?.account?.username[0]?.toUpperCase()"></span>
                </div>
                <div>
                  <h2 class="text-2xl font-bold" x-text="'@' + researchDetail?.account?.username"></h2>
                  <p class="text-gray-400" x-text="researchDetail?.account?.displayName || ''"></p>
                  <p class="text-gray-500 text-sm mt-1" x-text="researchDetail?.account?.bio || ''"></p>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="fetchTweets(researchDetail?.account?.id)" :disabled="fetchingTweets" class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 transition disabled:opacity-50">
                  <span x-show="!fetchingTweets">Refresh Data</span>
                  <span x-show="fetchingTweets">Fetching...</span>
                </button>
                <button @click="getStrategy(researchDetail?.account?.id)" :disabled="loadingStrategy" class="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition disabled:opacity-50">
                  <span x-show="!loadingStrategy">AI Analysis</span>
                  <span x-show="loadingStrategy">Analyzing...</span>
                </button>
                <button @click="deleteResearchAccount(researchDetail?.account?.id)" class="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30">Delete</button>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div class="bg-gray-700/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold" x-text="formatNumber(researchDetail?.account?.followersCount || 0)"></p>
                <p class="text-sm text-gray-400">Followers</p>
              </div>
              <div class="bg-gray-700/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold" x-text="formatNumber(researchDetail?.account?.followingCount || 0)"></p>
                <p class="text-sm text-gray-400">Following</p>
              </div>
              <div class="bg-gray-700/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-red-400" x-text="(researchDetail?.account?.avgLikes || 0).toFixed(1)"></p>
                <p class="text-sm text-gray-400">Avg Likes</p>
              </div>
              <div class="bg-gray-700/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-green-400" x-text="(researchDetail?.account?.avgRetweets || 0).toFixed(1)"></p>
                <p class="text-sm text-gray-400">Avg Retweets</p>
              </div>
              <div class="bg-gray-700/50 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-blue-400" x-text="(researchDetail?.account?.postingFrequency || 0).toFixed(1)"></p>
                <p class="text-sm text-gray-400">Posts/Day</p>
              </div>
            </div>
          </div>

          <!-- AI Strategy Analysis -->
          <div x-show="strategyAnalysis" class="bg-gray-800 p-6 rounded-xl border border-purple-500 mb-6">
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <span class="text-purple-400">AI</span> Content Strategy Analysis
            </h3>
            <div class="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap" x-text="strategyAnalysis"></div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Sentiment Breakdown -->
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 class="text-lg font-bold mb-4">Sentiment Breakdown</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-4">
                  <span class="w-20 text-green-400">Positive</span>
                  <div class="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div class="bg-green-500 h-full" :style="'width: ' + getSentimentPercent('positive') + '%'"></div>
                  </div>
                  <span class="w-12 text-right" x-text="researchDetail?.analytics?.sentimentBreakdown?.positive || 0"></span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="w-20 text-gray-400">Neutral</span>
                  <div class="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div class="bg-gray-500 h-full" :style="'width: ' + getSentimentPercent('neutral') + '%'"></div>
                  </div>
                  <span class="w-12 text-right" x-text="researchDetail?.analytics?.sentimentBreakdown?.neutral || 0"></span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="w-20 text-red-400">Negative</span>
                  <div class="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div class="bg-red-500 h-full" :style="'width: ' + getSentimentPercent('negative') + '%'"></div>
                  </div>
                  <span class="w-12 text-right" x-text="researchDetail?.analytics?.sentimentBreakdown?.negative || 0"></span>
                </div>
              </div>
            </div>

            <!-- Posting Patterns -->
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h3 class="text-lg font-bold mb-4">Posting Patterns</h3>
              <div class="mb-4">
                <p class="text-sm text-gray-400 mb-2">Most Active Hour (UTC)</p>
                <p class="text-2xl font-bold text-purple-400" x-text="formatHour(researchDetail?.account?.mostActiveHour)"></p>
              </div>
              <div>
                <p class="text-sm text-gray-400 mb-2">Hourly Activity</p>
                <div class="flex items-end gap-1 h-20">
                  <template x-for="hour in 24" :key="hour">
                    <div class="flex-1 bg-purple-600 rounded-t" :style="'height: ' + getHourHeight(hour - 1) + '%'" :title="(hour - 1) + ':00'"></div>
                  </template>
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0h</span>
                  <span>6h</span>
                  <span>12h</span>
                  <span>18h</span>
                  <span>24h</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Hashtags -->
          <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6" x-show="researchDetail?.account?.topHashtags">
            <h3 class="text-lg font-bold mb-4">Top Hashtags</h3>
            <div class="flex flex-wrap gap-2">
              <template x-for="tag in parseJSON(researchDetail?.account?.topHashtags)" :key="tag">
                <span class="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm" x-text="tag"></span>
              </template>
            </div>
          </div>

          <!-- Top Performing Tweets -->
          <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6">
            <h3 class="text-lg font-bold mb-4">Top Performing Tweets</h3>
            <div class="space-y-4">
              <template x-for="tweet in researchDetail?.analytics?.topTweets?.slice(0, 5)" :key="tweet.id">
                <div class="bg-gray-700/50 p-4 rounded-lg">
                  <p class="text-white mb-3" x-text="tweet.content"></p>
                  <div class="flex items-center gap-6 text-sm">
                    <span class="text-red-400" x-text="(tweet.likes || 0) + ' likes'"></span>
                    <span class="text-green-400" x-text="(tweet.retweets || 0) + ' retweets'"></span>
                    <span class="text-blue-400" x-text="(tweet.replies || 0) + ' replies'"></span>
                    <span :class="{
                      'text-green-400': tweet.sentimentLabel === 'positive',
                      'text-red-400': tweet.sentimentLabel === 'negative',
                      'text-gray-400': tweet.sentimentLabel === 'neutral'
                    }" x-text="tweet.sentimentLabel"></span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- All Tweets -->
          <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">Recent Tweets (<span x-text="researchDetail?.analytics?.totalTweetsAnalyzed || 0"></span>)</h3>
              <div class="flex gap-2">
                <select x-model="tweetFilter" @change="filterTweets()" class="bg-gray-700 rounded-lg px-3 py-1 text-sm border border-gray-600">
                  <option value="">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
                <select x-model="tweetSort" @change="sortTweets()" class="bg-gray-700 rounded-lg px-3 py-1 text-sm border border-gray-600">
                  <option value="postedAt">Recent</option>
                  <option value="likes">Most Liked</option>
                  <option value="retweets">Most Retweeted</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>
            </div>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <template x-for="tweet in displayedTweets" :key="tweet.id">
                <div class="bg-gray-700/50 p-4 rounded-lg">
                  <p class="text-white text-sm mb-2" x-text="tweet.content"></p>
                  <div class="flex items-center gap-4 text-xs text-gray-400">
                    <span x-text="(tweet.likes || 0) + ' likes'"></span>
                    <span x-text="(tweet.retweets || 0) + ' RT'"></span>
                    <span x-text="(tweet.replies || 0) + ' replies'"></span>
                    <span :class="{
                      'text-green-400': tweet.sentimentLabel === 'positive',
                      'text-red-400': tweet.sentimentLabel === 'negative'
                    }" x-text="tweet.sentimentLabel"></span>
                    <span class="ml-auto" x-text="new Date(tweet.postedAt).toLocaleDateString()"></span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Accounts Tab -->
    <div x-show="tab === 'accounts'" x-cloak>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Bot Accounts</h2>
        <button @click="showAddAccount = true" class="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition">+ Add Account</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <template x-for="account in accounts" :key="account.id">
          <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                <span class="text-xl" x-text="account.username[0]?.toUpperCase()"></span>
              </div>
              <div>
                <h3 class="font-bold" x-text="'@' + account.username"></h3>
                <p class="text-gray-400 text-sm" x-text="account.displayName || ''"></p>
              </div>
            </div>
            <div class="flex justify-between text-sm text-gray-400">
              <span x-text="(account.followersCount || 0) + ' followers'"></span>
              <span :class="account.isActive ? 'text-green-400' : 'text-red-400'" x-text="account.isActive ? 'Active' : 'Inactive'"></span>
            </div>
            <div class="mt-4 flex gap-2">
              <button @click="selectedAccount = account" class="flex-1 bg-gray-700 py-2 rounded hover:bg-gray-600 text-sm">Select</button>
              <button @click="deleteAccount(account.id)" class="bg-red-600/20 text-red-400 px-3 py-2 rounded hover:bg-red-600/30 text-sm">Delete</button>
            </div>
          </div>
        </template>
      </div>

      <div x-show="accounts.length === 0" class="text-center text-gray-500 py-12">
        No accounts added yet. Click "Add Account" to get started.
      </div>
    </div>

    <!-- Scheduler Tab -->
    <div x-show="tab === 'scheduler'" x-cloak>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Scheduled Tweets</h2>
        <button @click="showScheduler = true" class="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition">+ Schedule Tweet</button>
      </div>

      <div class="space-y-4">
        <template x-for="tweet in scheduled" :key="tweet.id">
          <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div class="flex justify-between items-start mb-3">
              <span class="text-blue-400 text-sm" x-text="'@' + (tweet.account?.username || 'Unknown')"></span>
              <span :class="{
                'bg-yellow-600/20 text-yellow-400': tweet.status === 'pending',
                'bg-green-600/20 text-green-400': tweet.status === 'posted',
                'bg-red-600/20 text-red-400': tweet.status === 'failed',
                'bg-gray-600/20 text-gray-400': tweet.status === 'cancelled'
              }" class="px-2 py-1 rounded text-xs" x-text="tweet.status"></span>
            </div>
            <p class="text-white mb-3" x-text="tweet.content"></p>
            <div class="flex justify-between items-center text-sm text-gray-400">
              <span x-text="'Scheduled: ' + new Date(tweet.scheduledFor).toLocaleString()"></span>
              <div class="flex gap-2">
                <template x-if="tweet.status === 'pending'">
                  <button @click="cancelScheduled(tweet.id)" class="text-red-400 hover:text-red-300">Cancel</button>
                </template>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div x-show="scheduled.length === 0" class="text-center text-gray-500 py-12">
        No scheduled tweets. Create one to get started.
      </div>
    </div>

    <!-- AI Tools Tab -->
    <div x-show="tab === 'ai'" x-cloak>
      <h2 class="text-2xl font-bold mb-6">AI Tools</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Tweet Generator -->
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 class="text-lg font-bold mb-4">Generate Tweets</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Account</label>
              <select x-model="aiForm.accountId" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
                <option value="">Select account...</option>
                <template x-for="acc in accounts" :key="acc.id">
                  <option :value="acc.id" x-text="'@' + acc.username"></option>
                </template>
              </select>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Topic</label>
              <input type="text" x-model="aiForm.topic" placeholder="What should the tweet be about?" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Tone</label>
              <select x-model="aiForm.tone" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
                <option value="witty">Witty</option>
                <option value="inspirational">Inspirational</option>
                <option value="informative">Informative</option>
              </select>
            </div>
            <button @click="generateTweets()" :disabled="generating" class="w-full bg-blue-600 py-2 rounded-lg hover:bg-blue-500 transition disabled:opacity-50">
              <span x-show="!generating">Generate Tweets</span>
              <span x-show="generating">Generating...</span>
            </button>
          </div>

          <div x-show="suggestions.length > 0" class="mt-6 space-y-3">
            <h4 class="text-sm text-gray-400">Suggestions:</h4>
            <template x-for="s in suggestions" :key="s.id">
              <div class="bg-gray-700/50 p-4 rounded-lg">
                <p class="text-sm mb-3" x-text="s.content"></p>
                <div class="flex gap-2">
                  <button @click="useSuggestion(s)" class="text-xs bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">Use</button>
                  <button @click="scheduleSuggestion(s)" class="text-xs bg-green-600 px-3 py-1 rounded hover:bg-green-500">Schedule</button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Sentiment Analyzer -->
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 class="text-lg font-bold mb-4">Sentiment Analyzer</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Text to Analyze</label>
              <textarea x-model="sentimentText" rows="4" placeholder="Paste tweet or text to analyze..." class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none resize-none"></textarea>
            </div>
            <button @click="analyzeSentiment()" :disabled="analyzing" class="w-full bg-purple-600 py-2 rounded-lg hover:bg-purple-500 transition disabled:opacity-50">
              <span x-show="!analyzing">Analyze Sentiment</span>
              <span x-show="analyzing">Analyzing...</span>
            </button>
          </div>

          <div x-show="sentiment" class="mt-6 bg-gray-700/50 p-4 rounded-lg">
            <div class="flex items-center gap-4">
              <div :class="{
                'text-green-400': sentiment?.label === 'positive',
                'text-red-400': sentiment?.label === 'negative',
                'text-gray-400': sentiment?.label === 'neutral'
              }" class="text-3xl font-bold" x-text="sentiment?.label?.toUpperCase()"></div>
              <div class="flex-1">
                <div class="text-sm text-gray-400">Score: <span x-text="sentiment?.score?.toFixed(2)"></span></div>
                <div class="text-sm text-gray-400">Confidence: <span x-text="((sentiment?.confidence || 0) * 100).toFixed(0) + '%'"></span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tweet Improver -->
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 class="text-lg font-bold mb-4">Tweet Improver</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Original Tweet</label>
              <textarea x-model="improveText" rows="3" placeholder="Enter your tweet to improve..." class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none resize-none"></textarea>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Optimize for</label>
              <select x-model="improveGoal" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
                <option value="engagement">Engagement</option>
                <option value="clarity">Clarity</option>
                <option value="professional">Professional</option>
                <option value="viral">Viral Potential</option>
              </select>
            </div>
            <button @click="improveTweet()" :disabled="improving" class="w-full bg-orange-600 py-2 rounded-lg hover:bg-orange-500 transition disabled:opacity-50">
              <span x-show="!improving">Improve Tweet</span>
              <span x-show="improving">Improving...</span>
            </button>
          </div>

          <div x-show="improvedTweet" class="mt-6 bg-gray-700/50 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-2">Improved version:</p>
            <p class="text-white" x-text="improvedTweet"></p>
            <button @click="copyToClipboard(improvedTweet)" class="mt-3 text-xs bg-gray-600 px-3 py-1 rounded hover:bg-gray-500">Copy</button>
          </div>
        </div>

        <!-- Hashtag Generator -->
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 class="text-lg font-bold mb-4">Hashtag Generator</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Topic</label>
              <input type="text" x-model="hashtagTopic" placeholder="Enter topic for hashtags..." class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
            </div>
            <button @click="generateHashtags()" :disabled="generatingHashtags" class="w-full bg-cyan-600 py-2 rounded-lg hover:bg-cyan-500 transition disabled:opacity-50">
              <span x-show="!generatingHashtags">Generate Hashtags</span>
              <span x-show="generatingHashtags">Generating...</span>
            </button>
          </div>

          <div x-show="hashtags.length > 0" class="mt-6">
            <div class="flex flex-wrap gap-2">
              <template x-for="tag in hashtags" :key="tag">
                <span @click="copyToClipboard(tag)" class="bg-cyan-600/20 text-cyan-400 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-cyan-600/30" x-text="tag"></span>
              </template>
            </div>
            <button @click="copyToClipboard(hashtags.join(' '))" class="mt-3 text-xs text-gray-400 hover:text-white">Copy all</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics Tab -->
    <div x-show="tab === 'analytics'" x-cloak>
      <h2 class="text-2xl font-bold mb-6">Analytics</h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p class="text-gray-400 text-sm">Total Tweets</p>
          <p class="text-3xl font-bold text-white" x-text="analytics.total_tweets || 0"></p>
        </div>
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p class="text-gray-400 text-sm">Total Likes</p>
          <p class="text-3xl font-bold text-red-400" x-text="analytics.total_likes || 0"></p>
        </div>
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p class="text-gray-400 text-sm">Total Retweets</p>
          <p class="text-3xl font-bold text-green-400" x-text="analytics.total_retweets || 0"></p>
        </div>
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p class="text-gray-400 text-sm">Impressions</p>
          <p class="text-3xl font-bold text-blue-400" x-text="analytics.total_impressions || 0"></p>
        </div>
      </div>

      <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 class="text-lg font-bold mb-4">Recent Tweets</h3>
        <div class="space-y-4">
          <template x-for="tweet in tweets" :key="tweet.id">
            <div class="bg-gray-700/50 p-4 rounded-lg">
              <p class="text-white mb-2" x-text="tweet.content"></p>
              <div class="flex gap-6 text-sm text-gray-400">
                <span x-text="(tweet.likes || 0) + ' likes'"></span>
                <span x-text="(tweet.retweets || 0) + ' retweets'"></span>
                <span x-text="(tweet.replies || 0) + ' replies'"></span>
              </div>
            </div>
          </template>
        </div>
        <div x-show="tweets.length === 0" class="text-center text-gray-500 py-8">
          No tweets recorded yet.
        </div>
      </div>
    </div>
  </main>

  <!-- Add Account Modal -->
  <div x-show="showAddAccount" x-cloak class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showAddAccount = false">
    <div class="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700">
      <h3 class="text-xl font-bold mb-4">Add Bot Account</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Username</label>
          <input type="text" x-model="newAccount.username" placeholder="twitter_handle" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Display Name</label>
          <input type="text" x-model="newAccount.displayName" placeholder="Display Name" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Access Token</label>
          <input type="password" x-model="newAccount.accessToken" placeholder="Bearer token..." class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showAddAccount = false" class="flex-1 bg-gray-700 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
          <button @click="addAccount()" class="flex-1 bg-blue-600 py-2 rounded-lg hover:bg-blue-500">Add Account</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Schedule Tweet Modal -->
  <div x-show="showScheduler" x-cloak class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showScheduler = false">
    <div class="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700">
      <h3 class="text-xl font-bold mb-4">Schedule Tweet</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Account</label>
          <select x-model="newScheduled.accountId" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
            <option value="">Select account...</option>
            <template x-for="acc in accounts" :key="acc.id">
              <option :value="acc.id" x-text="'@' + acc.username"></option>
            </template>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Tweet Content</label>
          <textarea x-model="newScheduled.content" rows="3" maxlength="280" placeholder="What's happening?" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none resize-none"></textarea>
          <div class="text-right text-xs text-gray-500" x-text="(newScheduled.content?.length || 0) + '/280'"></div>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Schedule For</label>
          <input type="datetime-local" x-model="newScheduled.scheduledFor" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 outline-none">
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showScheduler = false" class="flex-1 bg-gray-700 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
          <button @click="scheduleTweet()" class="flex-1 bg-blue-600 py-2 rounded-lg hover:bg-blue-500">Schedule</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Lookup Account Modal -->
  <div x-show="showLookup" x-cloak class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showLookup = false">
    <div class="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700">
      <h3 class="text-xl font-bold mb-4">Lookup Twitter Account</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Username</label>
          <input type="text" x-model="lookupUsername" placeholder="@username or username" class="w-full bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 outline-none">
        </div>
        <p class="text-xs text-gray-500">Enter any public Twitter account to analyze their content, engagement, and posting patterns.</p>
        <div class="flex gap-3 mt-6">
          <button @click="showLookup = false" class="flex-1 bg-gray-700 py-2 rounded-lg hover:bg-gray-600">Cancel</button>
          <button @click="lookupAccount()" :disabled="lookingUp" class="flex-1 bg-purple-600 py-2 rounded-lg hover:bg-purple-500 disabled:opacity-50">
            <span x-show="!lookingUp">Lookup</span>
            <span x-show="lookingUp">Looking up...</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    function dashboard() {
      return {
        tab: 'research',
        accounts: [],
        scheduled: [],
        tweets: [],
        analytics: {},
        suggestions: [],
        sentiment: null,
        hashtags: [],
        improvedTweet: '',

        // Research state
        researchAccounts: [],
        selectedResearchAccount: null,
        researchDetail: null,
        displayedTweets: [],
        tweetFilter: '',
        tweetSort: 'postedAt',
        strategyAnalysis: '',
        loadingDetail: false,
        fetchingTweets: false,
        loadingStrategy: false,
        showLookup: false,
        lookupUsername: '',
        lookingUp: false,

        showAddAccount: false,
        showScheduler: false,
        generating: false,
        analyzing: false,
        improving: false,
        generatingHashtags: false,

        selectedAccount: null,
        newAccount: { username: '', displayName: '', accessToken: '' },
        newScheduled: { accountId: '', content: '', scheduledFor: '' },
        aiForm: { accountId: '', topic: '', tone: 'casual' },
        sentimentText: '',
        improveText: '',
        improveGoal: 'engagement',
        hashtagTopic: '',

        async init() {
          await Promise.all([
            this.loadAccounts(),
            this.loadScheduled(),
            this.loadTweets(),
            this.loadAnalytics(),
            this.loadResearchAccounts()
          ]);
        },

        async loadAccounts() {
          const res = await fetch('/api/accounts');
          const data = await res.json();
          this.accounts = data.accounts || [];
        },

        async loadScheduled() {
          const res = await fetch('/api/scheduler');
          const data = await res.json();
          this.scheduled = data.scheduled || [];
        },

        async loadTweets() {
          const res = await fetch('/api/tweets?limit=20');
          const data = await res.json();
          this.tweets = data.tweets || [];
        },

        async loadAnalytics() {
          const res = await fetch('/api/tweets/analytics');
          const data = await res.json();
          this.analytics = data.analytics || {};
        },

        async loadResearchAccounts() {
          const res = await fetch('/api/research/accounts');
          const data = await res.json();
          this.researchAccounts = data.accounts || [];
        },

        async viewResearchAccount(id) {
          this.selectedResearchAccount = id;
          this.loadingDetail = true;
          this.strategyAnalysis = '';
          try {
            const res = await fetch('/api/research/accounts/' + id);
            const data = await res.json();
            this.researchDetail = data;
            this.displayedTweets = data.tweets || [];
          } finally {
            this.loadingDetail = false;
          }
        },

        async lookupAccount() {
          if (!this.lookupUsername) return;
          this.lookingUp = true;
          try {
            const res = await fetch('/api/research/lookup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: this.lookupUsername })
            });
            const data = await res.json();
            this.lookupUsername = '';
            this.showLookup = false;
            await this.loadResearchAccounts();
            if (data.account?.id) {
              this.viewResearchAccount(data.account.id);
            }
          } finally {
            this.lookingUp = false;
          }
        },

        async fetchTweets(id) {
          this.fetchingTweets = true;
          try {
            await fetch('/api/research/fetch/' + id, { method: 'POST' });
            await this.viewResearchAccount(id);
            await this.loadResearchAccounts();
          } finally {
            this.fetchingTweets = false;
          }
        },

        async getStrategy(id) {
          this.loadingStrategy = true;
          this.strategyAnalysis = '';
          try {
            const res = await fetch('/api/research/accounts/' + id + '/strategy');
            const data = await res.json();
            this.strategyAnalysis = data.analysis || data.error || 'Unable to generate analysis';
          } finally {
            this.loadingStrategy = false;
          }
        },

        async deleteResearchAccount(id) {
          if (!confirm('Delete this account and all its data?')) return;
          await fetch('/api/research/accounts/' + id, { method: 'DELETE' });
          this.selectedResearchAccount = null;
          this.researchDetail = null;
          await this.loadResearchAccounts();
        },

        filterTweets() {
          let tweets = this.researchDetail?.tweets || [];
          if (this.tweetFilter) {
            tweets = tweets.filter(t => t.sentimentLabel === this.tweetFilter);
          }
          this.displayedTweets = tweets;
          this.sortTweets();
        },

        sortTweets() {
          const tweets = [...this.displayedTweets];
          if (this.tweetSort === 'likes') {
            tweets.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          } else if (this.tweetSort === 'retweets') {
            tweets.sort((a, b) => (b.retweets || 0) - (a.retweets || 0));
          } else if (this.tweetSort === 'engagement') {
            tweets.sort((a, b) =>
              ((b.likes || 0) + (b.retweets || 0) + (b.replies || 0)) -
              ((a.likes || 0) + (a.retweets || 0) + (a.replies || 0))
            );
          } else {
            tweets.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
          }
          this.displayedTweets = tweets;
        },

        getSentimentPercent(type) {
          const breakdown = this.researchDetail?.analytics?.sentimentBreakdown || {};
          const total = (breakdown.positive || 0) + (breakdown.neutral || 0) + (breakdown.negative || 0);
          if (total === 0) return 0;
          return ((breakdown[type] || 0) / total * 100).toFixed(0);
        },

        getHourHeight(hour) {
          const hourly = this.researchDetail?.analytics?.hourlyActivity || {};
          const max = Math.max(...Object.values(hourly), 1);
          return ((hourly[hour] || 0) / max * 100) || 5;
        },

        formatHour(hour) {
          if (hour === null || hour === undefined) return 'N/A';
          return hour + ':00 UTC';
        },

        formatNumber(num) {
          if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
          if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
          return num;
        },

        getSentimentLabel(score) {
          if (score === null || score === undefined) return 'N/A';
          if (score > 0.2) return 'Positive';
          if (score < -0.2) return 'Negative';
          return 'Neutral';
        },

        timeAgo(date) {
          const seconds = Math.floor((new Date() - new Date(date)) / 1000);
          if (seconds < 60) return 'just now';
          if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
          if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
          return Math.floor(seconds / 86400) + 'd ago';
        },

        parseJSON(str) {
          try { return JSON.parse(str) || []; } catch { return []; }
        },

        async addAccount() {
          if (!this.newAccount.username || !this.newAccount.accessToken) return;
          await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.newAccount)
          });
          this.newAccount = { username: '', displayName: '', accessToken: '' };
          this.showAddAccount = false;
          await this.loadAccounts();
        },

        async deleteAccount(id) {
          if (!confirm('Delete this account?')) return;
          await fetch('/api/accounts/' + id, { method: 'DELETE' });
          await this.loadAccounts();
        },

        async scheduleTweet() {
          if (!this.newScheduled.accountId || !this.newScheduled.content || !this.newScheduled.scheduledFor) return;
          await fetch('/api/scheduler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...this.newScheduled,
              scheduledFor: new Date(this.newScheduled.scheduledFor).toISOString()
            })
          });
          this.newScheduled = { accountId: '', content: '', scheduledFor: '' };
          this.showScheduler = false;
          await this.loadScheduled();
        },

        async cancelScheduled(id) {
          await fetch('/api/scheduler/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
          });
          await this.loadScheduled();
        },

        async generateTweets() {
          if (!this.aiForm.accountId || !this.aiForm.topic) return;
          this.generating = true;
          this.suggestions = [];
          try {
            const res = await fetch('/api/ai/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...this.aiForm, count: 3 })
            });
            const data = await res.json();
            this.suggestions = data.suggestions || [];
          } finally {
            this.generating = false;
          }
        },

        async analyzeSentiment() {
          if (!this.sentimentText) return;
          this.analyzing = true;
          this.sentiment = null;
          try {
            const res = await fetch('/api/ai/sentiment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: this.sentimentText })
            });
            const data = await res.json();
            this.sentiment = data.sentiment;
          } finally {
            this.analyzing = false;
          }
        },

        async improveTweet() {
          if (!this.improveText) return;
          this.improving = true;
          this.improvedTweet = '';
          try {
            const res = await fetch('/api/ai/improve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: this.improveText, goal: this.improveGoal })
            });
            const data = await res.json();
            this.improvedTweet = data.improved;
          } finally {
            this.improving = false;
          }
        },

        async generateHashtags() {
          if (!this.hashtagTopic) return;
          this.generatingHashtags = true;
          this.hashtags = [];
          try {
            const res = await fetch('/api/ai/hashtags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ topic: this.hashtagTopic, count: 8 })
            });
            const data = await res.json();
            this.hashtags = data.hashtags || [];
          } finally {
            this.generatingHashtags = false;
          }
        },

        useSuggestion(s) {
          this.newScheduled.content = s.content;
          this.newScheduled.accountId = this.aiForm.accountId;
          this.tab = 'scheduler';
          this.showScheduler = true;
        },

        scheduleSuggestion(s) {
          this.newScheduled.content = s.content;
          this.newScheduled.accountId = this.aiForm.accountId;
          this.showScheduler = true;
        },

        copyToClipboard(text) {
          navigator.clipboard.writeText(text);
        }
      }
    }
  </script>
</body>
</html>
`;

dashboardRouter.get("/", (c) => {
  return c.html(dashboardHTML);
});
