// 現在開いているページのTLからTweetsの内容を取得
function get_tweets() {
  tweets = []
  $("div[lang='ja']").each(function(i, target) {
    tweets.push($(target).text())
  })
  return tweets
}

// COTOHA APIのアクセストークンを取得する
function get_access_token() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        contentScriptQuery: "get_access_token"
      },
      (response) => { resolve(response) }
    )  
  })
}

// tweetのPositive, Neutral, Negative判定
function get_tweet_sentiment(access_token, tweet) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        contentScriptQuery: "get_tweet_sentiment",
        access_token: access_token,
        tweet: tweet
      },
      (response) => { resolve(response) }
    )
  })
}

// tweetの類似する松岡修造語録を取得する
function get_similar_shuzo_quote(access_token, tweet) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        contentScriptQuery: "get_similar_shuzo_quote",
        access_token: access_token,
        tweet: tweet
      },
      (response) => { resolve(response) }
    )
  })
}

// DOM操作でtweetをnew_tweetに更新する
function change_tweet(tweet, new_tweet) {
  target = $(`div[lang='ja']:contains(${tweet})`)
  $(target).text(new_tweet)
  $(target).css("color", "red")
}


// backgroundからメッセージを受信して処理を実行する
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if ( request == "clicked" ) {
    
    // 現在開いているページのTLからTweetsの内容を取得（`get_tweets`）
    tweets = get_tweets()
    
    // COTOHA APIのアクセストークンを取得する（`get_access_token`）
    get_access_token().then((access_token) => {

      // tweetsから１件ずつtweetに格納して処理する
      for (let tweet of tweets) {

        // 取得したtweetのネガポジ判定をする（`get_tweet_sentiment`）
        get_tweet_sentiment(access_token, tweet).then(sentiment => {

          // tweetがポジティブでないと判断した場合、処理を継続。
          if (sentiment != "Positive") {

            // ポジティブでないtweetと近しい内容の松岡修造語録を取得する（`get_similar_shuzo_quote`）
            get_similar_shuzo_quote(access_token, tweet).then(new_tweet => {

              // ポジティブでないtweetの内容を松岡修造語録に変換する（`change_tweet`）
              change_tweet(tweet, new_tweet)
            })
          }
        })
      }
    })
  }
})